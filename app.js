require('dotenv').config();
var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const bcrypt = require('bcryptjs');
const passport = require('./passport-config')
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const homeController = require('./controllers/homeController');
const authController = require('./controllers/authController')
const User = require('./models/User')
const flash = require('connect-flash');

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const mongoDb = process.env.DB_URL
mongoose.connect(mongoDb);
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));




var app = express();




app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));
app.use(flash());








app.get("/sign-up", authController.signup_get)
app.get("/login", authController.login_get);
app.get("/", homeController.home_get);

app.get("/log-out", authController.logout_get);
app.post("/sign-up", authController.signup_post);
app.post("/login", authController.login_post);



// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});
app.use((req, res, next) => {
    res.locals.currentUser = req.user;
    res.locals.isAuthenticated = req.isAuthenticated();
    next();
});
// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
