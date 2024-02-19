// require('dotenv').config();
const express = require('express');


const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const compression = require('compression');
const session = require('express-session');
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const MongoStore = require('connect-mongo');
const flash = require('connect-flash');
// const homeController = require('./controllers/homeController');

const User = require('./models/User');


const indexRouter = require('./controllers/authController');


const mongoDb = "mongodb+srv://zdes:zdeslav@cluster0.abxta9f.mongodb.net/Users0?retryWrites=true&w=majority";
mongoose.connect(mongoDb);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongo connection error'));

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');









// Define local strategy for authentication
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    const user = await User.findOne({ username: username });
    if (!user) {
      return done(null, false, { message: 'Incorrect username' });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return done(null, false, { message: 'Incorrect password' });
    }
    return done(null, user);
  } catch (err) {
    return done(err);
  }
}));

// Serialize and deserialize user
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

app.use(compression());
if (process.env.NODE_ENV !== 'production') {
	app.use(logger('dev'));
}
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

const sessionStore = new MongoStore({
	mongoUrl: mongoDb,
	collection: 'sessions',
});

app.use(
	session({
		secret: 'e0efdfb72eaea8f482de81ce04719cca12ccc61d97f0c315160a891404dfeadb',
		resave: false,
		saveUninitialized: true,
		store: sessionStore,
		cookie: {
			maxAge: 1000 * 60 * 60 * 24,
		},
	})
);


app.use(flash());
// Passport middleware should be registered after session middleware
app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
	res.locals.currentUser = req.user;
	next();
});



app.use('/', indexRouter);






app.use(function(req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
	res.locals.message = err.message;
	res.locals.error = req.app.get('env') === 'development' ? err : {};

	res.status(err.status || 3000);
	res.render('error');
});






module.exports = app;
