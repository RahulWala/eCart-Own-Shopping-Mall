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

	var infoOf = {};
	
	///////////// Sending view ////////////////
	appRouter.get('/editPro/:id',auth.isLoggedIn,function(req,res){
		res.render('proInfo');
	});

	////////////// Editing product info ///////////
	appRouter.get('/edit/:id',auth.isLoggedIn,function(req,res){
		eProduct.findOne({'_id':req.params.id},function(err,result){
			if(err){
				res.render("error",{title : "Something Went Wrong"});
			}else{
				// console.log("edit result"+result);
				res.render("editProduct",{user : result});
			}
		});
	});

	appRouter.put('/editPro/:id',auth.isLoggedIn,function(req,res){

		var update = req.body;

		var getProduct = function(callback){
			eProduct.findOne({'_id':req.params.id})
			.populate({path:'owner',select:'emailId'})
			.exec(function(err,result){
				if(err){
					var myResponse = responseGenerator.generate(true,err,500,null);
				}else{
					var myResponse = responseGenerator.generate(false,"Product Found",200,result);
					callback(null,result);
				}
			});
		}

		var getUser = function(arg,callback){
			eCart.findOne({'_id':req.session.user._id},function(err,proUser){
				if(err){
					var myResponse = responseGenerator.generate(true,err,500,null);
					callback(null,myResponse);
				}else{
					callback(null,arg,proUser);
				}
			});
		}

		var proUpdate = function(arg,arg1,callback){

			///////Checking authority/////////
			if(arg.owner.emailId == arg1.emailId){
				eProduct.findByIdAndUpdate({'_id':arg._id},update,{new:true},function(err,update){
					if(err){
						var myResponse = responseGenerator.generate(true,err,401,null);
						callback(null,myResponse);
					}else{
						// console.log('error 1')
						infoOf.carts = true;
						var myResponse = responseGenerator.generate(false,'Product Info Updated Successfully',200,infoOf.carts);
						callback(null,myResponse);
					}
				});
			}else{
				infoOf.carts = false;
				// console.log("error 2");
				var myResponse = responseGenerator.generate(true,'You are not authorized user',403,infoOf.carts);
				callback(null,myResponse);
			}
		}

		async.waterfall([
			getProduct,
			getUser,
			proUpdate
			],function(err,result){
				if(err){
					req.flash('error','Something Went Wrong')
					res.render("error",{title : "Something Went Wrong"});
				}else{
					if(result.message == 'You are not authorized user' || err){
						req.flash('error','You are not authorized user');
						res.render('product',{user:req.session.user});
					}else{
						if(infoOf.carts == true){
							var updateObj = {$set:{}};
							for(var para in req.body) {
							  	updateObj.$set['cart.$.'+para] = req.body[para];
							}
							//updating cart product of all users
							eCart.update({'cart._id':req.params.id},updateObj,{multi:true})
							.exec(function(err,update){
								if(err){
									console.log(err);
									req.flash('error','Something Went Wrong');
									res.render('product',{user:req.session.user});
								}else{
									console.log(update);
									req.flash('success','Product Updated Successfully');
									res.render('product',{user:req.session.user});
								}
							});
						}else{
							req.flash('error','You are not authorized user');
							res.render('product',{user:req.session.user});
						}
					}
				}
			});
	});

	////////////// Setting default route ///////////////////
	app.use('/users',appRouter);
}