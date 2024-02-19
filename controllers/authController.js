const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Message = require('../models/message');
const { DateTime } = require('luxon');
// require('dotenv').config();
// Route for rendering the home page
// Route for handling the home page after successful login
// Route for rendering the home page
// GET route to render the home page
router.get('/', async (req, res, next) => {
  try {
    // Fetch all messages from the database and sort them by the time field in descending order
    const messages = await Message.find().populate('createdBy').sort({ createdAt: 'desc' }).exec();

    // Render the home page with the messages
    res.render('home', {currentUser: req.user, messages: messages });
  } catch (err) {
    // Handle errors
    next(err);
  }
});




// Route for rendering the sign-up form
router.get('/sign-up', (req, res) => {
    res.render('signup');
});

// Route for handling sign-up form submission


router.post('/sign-up', [
    body('firstName', 'First name must not be empty.')
			.trim()
			.isLength({ min: 1 })
			.escape(),
		body('lastName', 'Last name must not be empty.')
			.trim()
			.isLength({ min: 1 })
			.escape(),
		body('username')
			.trim()
			.isLength({ min: 1 })
			.escape()
			.withMessage('Username must not be empty.')
			.custom(async (value) => {
				const user = await User.findOne({ username: value });
				if (user) {
					throw new Error('Username already in use.');
				}
			}),
		body('password', 'Your password should be at least 8 characters long.')
			.trim()
			.isLength({ min: 1 })
			.escape(),
		body('confirmPassword', 'Passwords do not match.').custom(
			(value, { req }) => {
				return value === req.body.password;
			}
		),
], async (req, res, next) => {
		try {
			const errors = validationResult(req);

			if (!errors.isEmpty()) {
				res.render('signup', {
					errors: errors.array(),
					username: req.body.username,
					firstName: req.body.firstName,
					lastName: req.body.lastName,
				});
			} else
				bcrypt.hash(
					req.body.password,
					10,
					async (err, hashedPassword) => {
						if (err) {
							next(err);
						}

						const user = new User({
							username: req.body.username,
							firstName: req.body.firstName,
							lastName: req.body.lastName,
							password: hashedPassword,
						});
						await user.save();
						
                        
                        
                        // Log in the user after signing up
                req.login(user, (err) => {
                    if (err) {
                        return next(err);
                    }
                    return res.redirect('/');
                });
					}
				);
		} catch (err) {
			return next(err);
		}
	}
);


// Route for rendering the login form
router.get('/log-in', (req, res) => {
	const errors = req.flash('error');
	const username = req.flash('username')[0];
	res.render('login-form', { errors: errors, username: username });
});
// Route for handling login form submission
router.post('/log-in', (req, res, next) => {
	req.flash('username', req.body.username);

	passport.authenticate('local', {
		successRedirect: '/',
		failureRedirect: '/log-in',
		failureFlash: true,
	})(req, res, next);
});


// Route for logging out
router.get('/log-out', (req, res, next) => {
	req.logout((err) => {
		if (err) {
			return next(err);
		}
		res.redirect('/');
	});
});


router.get('/membership', (req, res, next) => {
  try {
		
		res.render('membership');
	} catch (err) {
		return next(err);
	}

});



router.post('/membership', async (req, res) => {
    const { secretCode } = req.body;
    const expectedCode = '12345'; // Expected secret code
    const adminCode = '12345admin';

    if (secretCode === expectedCode) {
        // Update user's membership status in the database
        try {
            req.user.isMember = true; // Assuming req.user contains the current user object
            await req.user.save();
            // Redirect to the user's profile page or any other relevant page
            return res.redirect('/');
        } catch (error) {
            console.error('Error updating membership status:', error);
            return res.status(500).send('Internal Server Error');
        }
    } else if (secretCode === adminCode) {
        // Update user's membership and admin status in the database
        try {
            req.user.isMember = true; // Set user as member
            req.user.isAdmin = true; // Set user as admin
            await req.user.save();
            // Redirect to the user's profile page or any other relevant page
            return res.redirect('/');
        } catch (error) {
            console.error('Error updating membership and admin status:', error);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        // If the secret code is incorrect, render the membership form again with an error message
        return res.render('membership', { error: 'Invalid secret code. Please try again.' });
    } 
});



router.get('/new-message', (req, res, next) => {
  try {
		
		res.render('new-message');
	} catch (err) {
		return next(err);
	}

});

router.post('/new-message', async (req, res, next) => {
  try {
    // Extract information from the request body
    const { title, content, } = req.body;
    // Assuming req.user contains information about the logged-in user
    const createdBy = req.user._id;
    const createdAt = DateTime.now().toISO();
    // Create a new message using the Message model
    const message = new Message({
      title: title,
      content: content,
      createdBy: createdBy, // Assign the ID of the logged-in user to createdBy field
      createdAt: createdAt
    });

    // Save the new message to the database
    await message.save();

    // Redirect the user to the home page after successfully creating the message
    res.redirect('/');
  } catch (err) {
    // Handle errors
    next(err);
  }
});

router.post('/delete-message/:id', async (req, res, next) => {
    try {
        const messageId = req.params.id;
        // Delete the message from the database using the message ID
        await Message.findByIdAndDelete(messageId);
        // Redirect back to the home page after successful deletion
        res.redirect('/');
    } catch (error) {
        console.error('Error deleting message:', error);
        res.status(500).send('Internal Server Error');
    }
});


module.exports = router;



