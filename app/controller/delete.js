var mongoose 	= require('mongoose');
var express 	= require('express');
var async 		= require("async");
var nodemailer	= require('nodemailer');
var crypto		= require('crypto');

//express router used to define route
var appRouter 	= express.Router();

var eCart 		= mongoose.model('User');
var eProduct  	= mongoose.model('Product');

var responseGenerator	= require('./../../libs/responseGenerator');
var auth 				= require('./../../middlewares/auth');


module.exports.controllerFunction = function(app){

	////////////////Deleting from cart///////////////////
	appRouter.post('/delete/:id',auth.isLoggedIn,function(req,res){

		var getProduct = function(callback){
			eProduct.findOne({"_id":req.params.id}).exec(function(err,products){
				if(err){
					var myResponse = responseGenerator.generate(true,err,404,null);
				}else{
					callback(null,products);
				}
			});
		}

		var getUser = function(arg,callback){
			eCart.findOne({"_id":req.session.user._id},function(err,users){
				if(err){
					var myResponse = responseGenerator.generate(true,err,403,null);
				}else{
					callback(null,arg,users);
				}
			});
		}

		var deleteCart = function(arg,arg1,callback){
			eCart.findOneAndUpdate({"_id":req.session.user._id},{$pull:{"cart":arg}},function(err,delCart){
				if(err){
					var myResponse = responseGenerator.generate(true,err,500,null);
				}else{
					// console.log("Arg is : "+arg);
					// console.log("DelCart : "+delCart);
					var myResponse = responseGenerator.generate(false,"Product Removed From Cart",200,delCart);
					callback(null,myResponse);
				}
			})
		}

		async.waterfall([
			getProduct,
			getUser,
			deleteCart
			],function(err,result){
				if(err){
					req.flash('error','You are not allow to delete');
					res.render("product",{user : req.session.user});
				}
				else{
					req.flash('success','Product Removed from cart');
					res.render("product",{user:req.session.user});
				}
			})
	});

	////////////// Deleting product from product list and cart also //////////////////////
	appRouter.post('/deletePro/:id',auth.isLoggedIn,function(req,res){

		//Async function 
		var getProduct = function(callback){
			eProduct.findOne({'_id':req.params.id})
			.populate({path:'owner',select:'emailId'})
			.exec(function(err,result){
				if(err){
					var myResponse = responseGenerator.generate(true,err,500,null);
					callback(myResponse);
				}else{
					// console.log("Showing this "+result);
					callback(null,result);
				}
			});
		}

		var getUser = function(arg,callback){
			eCart.findOne({'_id':req.session.user._id},function(err,user){
				if(err){
					var myResponse = responseGenerator.generate(true,err,500,null);
					callback(myResponse);
				}else{
					callback(null,arg,user);
				}
			});
		}

		var deletingProduct = function(arg,arg1,callback){
			if(arg.owner.emailId == arg1.emailId){
				// console.log("came here "+arg.owner.firstName+' '+arg1.firstName);
				eProduct.remove({"_id":req.params.id},function(err,pro){
					if(err){
						var myResponse = responseGenerator.generate(true,err,403,null);
						callback(myResponse);
					}else{
						// console.log("deleteProduct : "+pro);
						var myResponse = responseGenerator.generate(false,"Product Removed Successfully",200,pro);
						callback(null,arg,arg1,pro);
					}
				});
			}
		}

		var deleteCart = function(arg,arg1,arg2,callback){
			eCart.findOneAndUpdate({"_id":req.session.user._id},{$pull:{"cart":arg}},function(err,deleteCart){
				if(err){
					var myResponse = responseGenerator.generate(true,err,500,null);
					callback(null,myResponse);
				}else{
					var myResponse = responseGenerator.generate(false,"Product Removed Successfully",200,deleteCart);
					callback(null,myResponse);
				}
			});
		}

		async.waterfall([
			getProduct,
			getUser,
			deletingProduct,
			deleteCart
			],function(err,result){
				if(err){
					req.flash('error','Something Went Wrong');
					res.render('product',{user : req.session.user});
				}else{
					if( result.message == 'You are not authorized user' || err){
						req.flash('error','You are not authorized user');
						res.render('product',{user:req.session.user});
					}else{
						req.flash('success','Product Removed Successfully');
						res.render('product',{user:req.session.user});
					}
				}
			});
	});

	////////////// Setting default route ///////////////////
	app.use('/users',appRouter);
}
