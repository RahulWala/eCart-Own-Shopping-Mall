var mongoose 	= require('mongoose');
var express 	= require('express');
var auth 		= require('./../../middlewares/auth');
//express router //used to define route
var appRouter 	= express.Router();
var eCart 		= mongoose.model('User');
var responseGenerator = require('./../../libs/responseGenerator');
var eProduct  	= mongoose.model('Product');



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
			}
			else if(foundUser == null || foundUser == undefined || foundUser.emailId == undefined || foundUser.password == null){
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
				console.log("User info "+req.session.user);
				res.render('product',{user:foundUser});
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
					console.log(err);
					res.render('error');
				} else{

					res.render('error',{title: "Product Added"});
				}
			});
		} else{
			// console.log("You missed some parameter");
			res.render('error',{title : 'You missed some field'});
		}
	});	

	////////// To view Products /////////////////
	appRouter.post('/viewPro',function(req,res){
		eProduct.find(function(err,foundPro){
			if(err){
				// console.log(err);
				res.render('err');
			}else{

				res.render('viewPro',{proInfo : foundPro});
			}
		});
	});

	//////////////// Adding to Cart function /////////////
	appRouter.get('/addCart/:id',function(req,res,next){
		eProduct.findOne({'_id' : req.params.id},function(err,foundProduct){
			if(err){
				res.render('error',{title : "Product doesn't exist"});
			}else if(foundProduct == undefined || foundProduct == null || foundProduct == ""){
				res.render('error',{title : "Product doesn't exist"});
			} else{
				req.session.cart = foundProduct;
				eCart.findByIdAndUpdate(req.session.user,{$push : {cart : foundProduct}},function(err,foundUser){
					if(err){
						res.render('error',{title : "You are not logged in"});

					} else if(foundUser == undefined || foundUser == null){
						res.render('error',{title : "Login to access your cart"});
					}else{
						req.session.userCart = foundUser;
						res.render('product');
					}
				});
			}
		});
	});

	////////////// Viewing to cart function and making payment function /////////////////
	appRouter.get('/viewCart',auth.isLoggedIn,function(req,res,next){

		eCart.find(req.session.user,function(err,result){
			if(err){
				res.render('error',{title : "You are not logged in"});
			}else{
				req.session.viewCart = result;
				res.render('viewCart',{ items : req.session.userCart.cart});
			}
		});

	});


	/////////////// Delete product from cart ////////////////
	appRouter.post('/delete/fromCart/:id',function(req,res,next){
		eCart.findOneAndUpdate({"_id": req.session.user._id},{$pull:{cart:{'_id':req.params.id}}},{multi : true},function(err,result){
			if(err){
				res.render('error', {title : "Sorry ! Product doesn't exist"});
			}else if(result == "" || result == undefined || result == null){
				res.render('error', {title : "No such Product exist"})
			}else{
				res.render('error',{title : "Deleted Successfully"});
			}
		})
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

