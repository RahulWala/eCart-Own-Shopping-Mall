var mongoose 	= require('mongoose');
var express 	= require('express');
var async 		= require("async");
var nodemailer	= require('nodemailer');
var crypto		= require('crypto');
var passport	= require('passport');

//express router used to define route
var appRouter 	= express.Router();

var eCart 		= mongoose.model('User');
var eProduct  	= mongoose.model('Product');

var responseGenerator	= require('./../../libs/responseGenerator');
var auth 				= require('./../../middlewares/auth');

module.exports.controllerFunction = function(app){

	///////////////forgot Api//////////////
	appRouter.get('/forgot',function(req,res){
		res.render('forgotPro');
	});

	//////////  Reseting password  ////////////
	appRouter.post('/forgot', function(req, res, next) {
	  async.waterfall([
	    function(done) {
	      crypto.randomBytes(20, function(err, buf) {
	        var token = buf.toString('hex');
	        done(err, token);
	      });
	    },
	    function(token, done) {
	      eCart.findOne({ emailId: req.body.emailId }, function(err, user) {
	        if (!user) {
	          req.flash('error', 'No account with that email address exists.');
	          return res.redirect('/users/forgot');
	        }
	       // console.log(user);
	        user.resetPasswordToken = token;
	        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

	        user.save(function(err,user) {
	        	// console.log(user);
	          done(err, token, user);
	        });
	      });
	    },
	    function(token, user, done) {
	      var smtpTransport = nodemailer.createTransport({
	        service: 'Gmail',
	        auth: {
	          user: 'rahulwala72@gmail.com',
	          pass: '01475963'
	        }
	      });
	      var mailOptions = {
	        to: user.emailId,
	        from: 'eCart service',
	        subject: 'eCart Password Reset',
	        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
	          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
	          'http://' + req.headers.host + '/users/reset/' + token + '\n\n' +
	          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
	      };
	      smtpTransport.sendMail(mailOptions, function(err) {
	        req.flash('info', 'An e-mail has been sent to ' + user.emailId + ' with further instructions.');
	        done(err, 'done');
	      });
	    }
	  ], function(err) {
	    if (err) return next(err);
	    res.redirect('/users/index');
	  });
	});

	////////redirecting for newPassword///////
	appRouter.get('/reset/:token', function(req, res) {
	  eCart.findOne({resetPasswordToken : req.params.token}, function(err, user) {
	    	// console.log(req.params.token);
	    if (!user) {
	    	req.flash('error', 'Password reset token is invalid or has expired.');
	    	return res.redirect('/users/forgot');
	    }
	    res.render('reset', {user: req.user});
	  });
	});

	///////////Route to newPassword password /////////////
	appRouter.post('/reset/:token', function(req, res) {
	  async.waterfall([
	    function(done) {
	      eCart.findOne({ resetPasswordToken : req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
	        if (!user) {
	        	// console.log(err);
	        	req.flash('error', 'Password reset token is invalid or has expired.');
	        	return res.redirect('/users/index');
	        }

	        user.password = req.body.password;
	        user.resetPasswordToken = undefined;
	        user.resetPasswordExpires = undefined;

	        user.save(function(err) {
	          done(err,user);
	        });
	      });
	    },
	    function(user, done) {
	      var smtpTransport = nodemailer.createTransport({
	        service: 'Gamil',
	        auth: {
	          user: 'rahulwala72@gmail.com',
	          pass: '01475963'
	        }
	      });
	      var mailOptions = {
	        to: user.emailId,
	        from: 'passwordreset@demo.com',
	        subject: 'Your password has been changed',
	        text: 'Hello,\n\n' +
	          'This is a confirmation that the password for your account ' + user.emailId + ' has just been changed.\n'
	      };
	      smtpTransport.sendMail(mailOptions, function(err) {
	        req.flash('success', 'Success! Your password has been changed.');
	        done(err);
	      });
	    }
	  ], function(err) {
	    res.render('index');
	  });
	});


	////////////// Setting default route ///////////////////
	app.use('/users',appRouter);
}