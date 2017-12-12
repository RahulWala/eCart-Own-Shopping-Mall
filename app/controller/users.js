var mongoose 	= require('mongoose');
var express 	= require('express');
var auth 		= require('./../../middlewares/auth');
//express router //used to define route
var appRouter 	= express.Router();
var eCart 		= mongoose.model('User');
var responseGenerator = require('./../../libs/responseGenerator');
var eProduct  	= mongoose.model('Product');

var async = require("async");

module.exports.controllerFunction = function(app){

	//All pages routing path
	appRouter.get('/index',function(req,res){
		res.render('index');
	});

	appRouter.get('/proInfo',function(req,res){
		res.render('proInfo');
	});

	appRouter.get('/viewPro',function(req,res){
		res.render('viewPro');
	});

	// appRouter.get('/signup/screen',function(req,res){
	// 	res.render('signup');
	// });

	// appRouter.get('/login/screen',function(req,res){
	// 	res.render('login');
	// });	

	appRouter.get('/cart/screen',function(req,res){
		res.render('cart');
	});

	appRouter.get('/product',function(req,res){
		res.render('product');
	});

	appRouter.get('/error/screen',function(req,res){
		res.render('error');
	});

	///////////////////// SignUp functions //////////////
	appRouter.post('/signup',function(req,res){
		if(req.body.firstName != undefined && req.body.lastName != undefined && req.body.emailId != undefined && req.body.password != undefined){

			var newUser			= new eCart({
				userName		: 	req.body.firstName+' '+req.body.lastName,
				firstName		: 	req.body.firstName,
				lastName		: 	req.body.lastName,
				emailId			: 	req.body.emailId,
				mobileNumber	: 	req.body.mobileNumber,
				password		: 	req.body.password
			});

			// console.log("data addedd");
			newUser.save(function(error){
				if(error){
					// console.log("error is here");
					// var myResponse = responseGenerator.generate(true,"Enter correct value",406,null);
					// console.log(error);
					// res.send(myResponse);
					res.render('error');
				}
				else{
					// console.log("error in else");
					// var myResponse = responseGenerator.generate(false,"Successfully generated",200,newUser);
					// console.log(myResponse);
					// res.send(myResponse);
					req.session.user = newUser;
					delete req.session.user.password;
					res.render('index');
				}
			});//end newUser save
		}
		else{
			// console.log("error in first else");
			res.render('error');
		}
	});

	////////////////////// LogIn function /////////////////////
	appRouter.post('/login',function(req,res){
		eCart.findOne({$and:[{'emailId':req.body.emailId},{'password':req.body.password}]}).exec(function(err,foundUser){
			// console.log(foundUser+"came in login function");
			if(err){
				// console.log("error in starting");
				// var myResponse = responseGenerator.generate(true,"Serious error",404,null);
				// res.send(myResponse);
				res.render('error');
			}else if(foundUser == null || foundUser == undefined || foundUser.emailId == undefined || foundUser.password == null){
				// console.log("eroor due to user info");
				// var myResponse = responseGenerator.generate(true,"Check your Email Id and Password",404,null);
				// res.send(myResponse);
				res.render('error',{title : "User Not Found"});
			}
			else{
				// var myResponse = responseGenerator.generate(false,"Successfully logged in",200,myResponse);
				// res.send(myResponse);
				// console.log(foundUser);
				req.session.user = foundUser;
				
				res.render('product',{user : foundUser});
			}
		});
	});
	
	///////////////// Adding Product Info //////////////
	appRouter.post('/proInfo',function(req,res){
		if(req.body.proName != undefined && req.body.price != undefined && req.body.category != undefined){
			var newPro = new eProduct({
				proName 	: req.body.proName,
				price 		: req.body.price,
				seller		: req.body.seller,
				model 		: req.body.model,
				comment		: req.body.comment,
				category	: req.body.category
			});

			newPro.save(function(err){					
				if(err){
					// console.log(err);
					res.render('error');
				} else{
					res.render('error',{title: "Product Added"});
				}
			});
		}else{
			// console.log("You missed some parameter");
			res.render('error',{title : 'You missed some field'});
		}
	});	

	////////// To view Products /////////////////
	appRouter.post('/viewPro',function(req,res){
		eProduct.find(function(err,foundPro){
			if(err){
				res.render('error',{title : "Something Went Wrong"});
			}else{
				// console.log(foundPro);
				// req.session.cartPro = foundPro;
				res.render('viewPro',{proInfo : foundPro});
			}
		});
	});

	//////////////// Adding to Cart function /////////////
	appRouter.post('/addCart/:id',auth.isLoggedIn,function(req,res,next){
		eProduct.findOne({"_id":req.params.id},function(err,gotProduct){
			if(err){
			}
			else{   
				eCart.findOneAndUpdate({"_id":req.session.user},{$push : {cart:gotProduct}},{new:true},function(err,userFound){
					if(err){
						res.render('error',{title : "Something Went Wrong"});
					}
					else if(userFound == null || userFound == undefined || userFound==""){
						res.render('error', {title : "User Not Found"});
					}
					else{
						// console.log("UF "+userFound);
						res.render('product',{user:userFound});
					}
				});
			}
		});
	});

	///////////// Sending view ////////////////
	appRouter.get('/editPro/:id',function(req,res){
		res.render('proInfo');
	});

	///////////////// Editing info of a product ////////////////////
	appRouter.post('/editPro/:id',auth.isLoggedIn,function(req,res,next){
		eProduct.findOne({'_id':req.params.id},function(err,result){
			if(err){
				res.render('error',{title : "Something Went Wrong"});
			}else if(result  == null || result == undefined || result == ""){
				res.render('error', {title : "Product Doesn't exist"});
			}else{
				eProduct.findOneAndUpdate({'_id':req.params.id},function(err,update){
					if(err){
						res.render('error',{title : "Something Went Wrong"});
					}else if(update == null || update == undefined || update == ""){
						res.render('error', {title : "Product Doesn't exist"});
					}else{
						console.log("pro "+update);
						res.render('error',{title : "Came here"});
					}
				});
			}
		});
	});

	// /////////////// Deleteing product  ////////////////
	// appRouter.post('/deletePro/:id',auth.isLoggedIn,function(req,res,next){
	// 	eProduct.findOne({'_id':req.params.id},function(err,result){
	// 		if(err){
	// 			res.render('error',{title : "Something Went Wrong"});
	// 		}else if(result == null || result == undefined || result == ""){
	// 			eProduct
	// 			res.render("error",{title : "Product doesn't exist"});
	// 		}else{
	// 			// console.log('id is '+req.params.id);
	// 			eProduct.remove().where({'_id':req.params.id}).exec((function(err,result){
	// 				if(err){
	// 					res.render('error',{title : "Something Went Wrong"});
	// 				}else if(result == null || result == undefined || result == ""){
	// 					res.render('error',{title : "Product doesn't exists"});
	// 				}else{
	// 					res.render("error",{title : "Product Removed Successfully"});
	// 				}
	// 			}));
	// 		}
	// 	});
	// });

	////////////// Viewing to cart function and making payment function /////////////////
	appRouter.post('/viewCart/:id',auth.isLoggedIn,function(req,res,next){
		eCart.findOne({'_id':req.params.id},function(err,users){
			if(err){
				res.render('error',{title : "Something Went Wrong"});
			}
			else{
				// console.log("users "+users);
				res.render('viewCart',{items : users.cart});
			}
		});
	});


	/////////////// Delete product from cart ////////////////
	// appRouter.post('/delete/:id',auth.isLoggedIn,function(req,res,next){
	// 	eProduct.findOne({'_id':req.params.id},function(err,proFound){
	// 		if(err){
	// 			res.render('error',{title : "Something Went Wrong"});
	// 		}else if(proFound == null || proFound == "" || proFound == undefined){
	// 			eCart.findOneAndUpdate({'_id':req.session.user},{$pull:{cart:proFound}},function(err,result){
	// 				if(err){
	// 					res.render('error',{title : "Something Went Wrong"});
	// 				}else{
	// 					res.render('error',{title : "Product Removed From Cart"});
	// 				}
	// 			});
	// 		}
	// 		else{
	// 			eCart.findOneAndUpdate({'_id':req.session.user},{$pull:{cart:proFound}},function(err,result){
	// 				if(err){
	// 					res.render('error',{title : "Something Went Wrong"});
	// 				}else{
	// 					res.render('error',{title : "Product Removed From Cart"});
	// 				}
	// 			});
	// 		}
	// 	});
	// });

	////////////////Deketing from cart///////////////////
	appRouter.post('/delete/:id',auth.isLoggedIn,function(req,res){

		var getProduct = function(callback){
			eProduct.findOne({"_id":req.params.id},{new:true},function(err,products){
				if(err){
					var myResponse = responseGenerator.generate(true,err,500,null);
				}else{
					callback(null,products);
				}
			});
		}

		var getUser = function(arg,callback){
			eCart.findOne({"_id":req.session.user._id},function(err,users){
				if(err){
					var myResponse = responseGenerator.generate(true,err,500,null);
				}else{
					callback(null,arg,users);
				}
			});
		}

		var deleteCart = function(arg,arg1,callback){
			eCart.findOneAndUpdate({"_id":req.session.user._id},{$pull:{"cart":arg._id}},function(err,delCart){
				if(err){
					var myResponse = responseGenerator.generate(true,err,500,null);
				}else{
					console.log("Arg is : "+arg);
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
					res.render("error",{title : "Something Went Wrong"});
				}
				else{
					res.render("error",{title : "Product Removed From Cart"});
				}
			})
	});

	////////////// Deleting product from product list and cart also //////////////////////
	appRouter.post('/deletePro/:id',auth.isLoggedIn,function(req,res){

		//Async function 
		var getProduct = function(callback){
			eProduct.findOne({'_id':req.params.id},function(err,result){
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
			eProduct.remove({"_id":req.params.id},function(err,pro){
				if(err){
					var myResponse = responseGenerator.generate(true,err,500,null);
					callback(myResponse);
				}else{
					var myResponse = responseGenerator.generate(false,"Product Deleted Successfully",200,pro);
					callback(null,myResponse);
				}
			});
		}

		async.waterfall([
			getProduct,
			getUser,
			deletingProduct
			],function(err,result){
				if(err){
					res.render("error",{title : "Something Went Wrong"});
				}else{
					eCart.update({},{$pull : {"cart" : {"_id" : req.params.id}}},{multi:true},function(err,result){
						if(err){
							res.render("error", {title : "Something Went Wrong"})
						}else{
							res.render("error",{title : "Product deleted Successfully"});
						}
					});
				}
			});
	});



	////////////// LogOut function ///////////
	appRouter.get('/logout',function(req,res){
		req.session.destroy(function(err){
			res.redirect('/users/index');
		});
	});



	////////////// Setting default route ///////////////////
	app.use('/users',appRouter);
}


