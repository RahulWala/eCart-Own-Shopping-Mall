var mongoose = require('mongoose');
var userModel = mongoose.model('User');
var proModel = mongoose.model('Product');

module.exports.loggedInUser = function(req,res,next){

	if(req.session.user){
		console.log("Logged in user");
		userModel.findOne({$and:[{'emailId' : req.session.user.emailId},{'mobileNumber' : req.session.user.mobileNumber}]},function(err,user){
			if(user){
				req.session.user = user;
				delete req.session.user.password;
				next();
			}else{
				//do nothing
			}
		});
	} else{
		next();
	}
}

module.exports.isLoggedIn = function(req,res,next){
	if(!req.session.user){
		console.log("is logged in");
		// res.send("clear");
		res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
        res.header('Expires', '-1');
        res.header('Pragma', 'no-cache');
		res.redirect('/users/index');
	}else{
		next();
	}
}