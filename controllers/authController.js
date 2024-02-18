const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const passport = require('../passport-config');
const User = require('../models/User');

exports.signup_get = (req, res) => {
    res.render("signup");
};

exports.signup_post = async (req, res, next) => {
    try {
        // Check if passwords match
        if (req.body.password !== req.body.confirmPassword) {
            return res.status(400).send('Passwords do not match');
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(req.body.password, 10);

        // Create a new user object
        const user = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPassword
        });

        // Save the user to the database
        await user.save();

        // Redirect to login page after successful signup
        passport.authenticate("local")(req, res, () => {
            // Redirect to home page after successful signup and authentication
            res.redirect("/");
        });
    } catch (err) {
        // Check if the error is a validation error indicating duplicate email
        if (err.name === 'MongoError' && err.code === 11000) {
            return res.status(400).send('User with this email already exists. Go back and change e-mail. Thank you!');
        }
        
        // If it's not a duplicate email error, pass the error to the next middleware
        return next(err);
    }
};

exports.login_get = (req, res) => {
    res.render('login-form');
};

exports.login_post = (req, res, next) => {
    passport.authenticate("local", {
        successRedirect: "/",
        failureRedirect: "/login"
    })(req, res, next);
};





exports.logout_get = (req, res, next) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect("/");
    });
};

