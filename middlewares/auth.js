var mongoose = require('mongoose');
var userModel = mongoose.model('User');
var proModel = mongoose.model('Product');

module.exports.loggedInUser = function(req,res,next){
	if(req.session.user){
		userModel.findOne({$and:[{'emailId' : req.session.user.emailId},{'mobileNumber' : req.session.user.mobileNumber}]},function(err,user){
			if(user){

				req.session.user = user;
				delete req.session.user.password;
				next();

			}else{

			}
		});
	} else{
		next();
	}
}

module.exports.isLoggedIn = function(req,res,next){
	if(!req.session.user){
		res.redirect('/users/product');
	}else{
		next();
	}
}