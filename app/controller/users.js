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

	//Helper variable
	var infoOf = {};

	/*****************************************/
	/*			All Pages Route 	  		*/
	/***************************************/
	appRouter.get('/index',function(req,res){
		res.render('index');
	});

	appRouter.get('/proInfo',auth.isLoggedIn,function(req,res){
		res.render('proInfo');
	});

	appRouter.get('/cart/screen',auth.isLoggedIn,function(req,res){
		res.render('cart');
	});

	appRouter.get('/product',auth.isLoggedIn,function(req,res){
		res.render('product');
	});

	appRouter.get('/error/screen',auth.isLoggedIn,function(req,res){
		res.render('error');
	});

	/*****************************************/
	/*			SignUp Function 	  		*/
	/***************************************/
	appRouter.post('/signup',function(req,res){
		if(req.body.firstName != undefined && req.body.lastName != undefined && req.body.emailId != undefined && req.body.password != undefined){

			eCart.findOne({'emailId':req.body.emailId},function(err,user){
				if(err){
					req.flash('error','Something Went Wrong');
					res.render('index');
				}else if(user && user != null){
					req.flash('error','Email Already Exists');
					res.render('index');
				} else{
					var newUser			= new eCart({
						userName		: 	req.body.firstName+' '+req.body.lastName,
						firstName		: 	req.body.firstName,
						lastName		: 	req.body.lastName,
						emailId			: 	req.body.emailId,
						mobileNumber	: 	req.body.mobileNumber,
						password		: 	req.body.password
					});
					// console.log("data added");
					newUser.save(function(error,result){
						if(error){
							// console.log("error is here");
							// var myResponse = responseGenerator.generate(true,"Enter correct value",406,null);
							// console.log(error);
							// res.send(myResponse);
							req.flash('info',"Something is missing");
							res.render('error');
						}else if(result.emailId == null || result.emailId == "" || result.password == null || result.password == "" && result.mobileNumber == null || result.mobileNumber == "" && result.lastName == null || result.last
							 == "" && result.firstName == null || result.firstName == "" && result.userName == null || result.userName == ""){
							req.flash('error',"Some field is missing");
							res.render('index');
						}
						else{
							// console.log("error in else");
							// var myResponse = responseGenerator.generate(false,"Successfully generated",200,newUser);
							// console.log(myResponse);
							// res.send(myResponse);					req.session.user = newUser;
							// delete req.session.user.password;
							req.flash('success',"Successfully Signed Up");
							res.render('index');
						}
					});//end newUser save
				}
			});
			
		}
		else{
			// console.log("error in first else");
			req.flash('error',"Some Fields are mssing");
			res.render('/users/index');
		}
	});


	/*****************************************/
	/*			LogIn Function 		  		*/
	/***************************************/
	appRouter.post('/login',auth.loggedInUser,function(req,res){
		// console.log("Came here");
		eCart.findOne({$and:[{'emailId':req.body.emailId},{'password':req.body.password}]}).exec(function(err,foundUser){
			// console.log(foundUser+"came in login function");
			if(err){
				// console.log("error in starting");
				// var myResponse = responseGenerator.generate(true,"Serious error",404,null);
				// res.send(myResponse);
				req.flash('error','There is some error');
				res.render('error');
			}else if(foundUser == null || foundUser == undefined || foundUser.emailId == undefined || foundUser.password == null){
				// console.log("error due to user info");
				// var myResponse = responseGenerator.generate(true,"Check your Email Id and Password",404,null);
				// res.send(myResponse);
				req.flash('error','Invalid Username or Password');
				res.redirect('/users/index');
			}else{
				// var myResponse = responseGenerator.generate(false,"Successfully logged in",200,myResponse);
				// res.send(myResponse);
				// console.log(foundUser);
				req.flash('success','Successfully logged in. Enjoy Shopping!!');
				req.session.user = foundUser;
				res.render('product',{user : foundUser});
			}
		});
	});

	/*****************************************/
	/*			Adding Product Info  		*/
	/***************************************/
	appRouter.post('/proInfo',auth.isLoggedIn,function(req,res){
		eCart.findOne({'emailId':req.session.user.emailId},function(err,user){
			if(err){
				req.flash('error','User Not Found');
				res.render('product',{user:req.session.user});
			}else{
				if(req.body.proName != undefined && req.body.price != undefined && req.body.category != undefined &&
					req.body.seller != undefined && req.body.model != undefined && req.body.descrip != undefined){
					var newPro = new eProduct({
						owner 		: user,
						proName 	: req.body.proName,
						price 		: req.body.price,
						seller		: req.body.seller,
						model 		: req.body.model,
						descrip		: req.body.descrip,
						category	: req.body.category
					});

					newPro.save(function(err,resul){					
						if(err){
							// console.log(err);
							res.render('error');
						} else{
							eProduct.findOne({"owner":req.session.user}).populate('owner','emailId').exec(function(err,proOwner){
								if(err){
									res.render('error','You have no authority to add product');
								}else{
									// console.log("proOwner is : "+proOwner);
									req.flash('success','Product AddedSuccessfully');
									res.render('product',{user:req.session.user});
								}
							});
							
							// res.render('error',{title: "Product Added});
						}
					});
				}else{
					// console.log("You missed some parameter");
					req.flash('error','Some fields were missing');
					res.render('proInfo');
				}
			}
		});

	});	

	/*****************************************/
	/*			To View Product  		 	*/
	/***************************************/
	appRouter.get('/viewPro',function(req,res){
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

	/*****************************************/
	/*			Single Product Info      	*/
	/***************************************/
	appRouter.get('/singlePro/:id',auth.isLoggedIn,function(req,res){
		eProduct.findOne({'_id':req.params.id},function(err,proFound){
			if(err){
				req.flash('error',"Didn't found anything");
			}else{
				// console.log("Poduct found : "+proFound);
				res.render('single',{product : proFound});
			}
		});
	});

	/*****************************************/
	/*		Adding Product to Cart     		*/
	/***************************************/
	appRouter.post('/addCart/:id',auth.isLoggedIn,function(req,res,next){
		eProduct.findOne({"_id":req.params.id},function(err,gotProduct){
			if(err){
				res.render('error','Product not found');
			}
			else{   
				eCart.findOneAndUpdate({"_id":req.session.user},{$push : {cart:gotProduct}},{new:true},function(err,userFound){
					if(err){
						req.flash('error','Something Went Wrong');
						res.render('error',{title : "Something Went Wrong"});
					}
					else if(userFound == null || userFound == undefined || userFound==""){
						res.render('error', {title : "User Not Found"});
					}
					else{
						// console.log("UF "+userFound);
						req.flash('success','Product Added to Cart');
						res.render('product',{user:userFound});
					}
				});
			}
		});
	});

	/*****************************************/
	/*			Viewing Product to Cart   	*/
	/***************************************/
	appRouter.get('/viewCart/:id',auth.isLoggedIn,function(req,res,next){
		eCart.findOne({'_id':req.params.id},function(err,users){
			if(err){
				req.flash('error','Something Went Wrong');
				res.render('index');
			}
			else{
				// console.log("users "+users);
				res.render('viewCart',{items : users.cart});
			}
		});
	});

	/*****************************************/
	/*			LogOut Function 		   	*/
	/***************************************/
	appRouter.get('/logout',function(req,res){
		req.session.user = null;
		res.end();
		res.redirect('/users/index');
	});

	/*****************************************/
	/*			Setting Default Route	   	*/
	/***************************************/
	app.use('/users',appRouter);
}