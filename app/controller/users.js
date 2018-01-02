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
// var crypto		= require('./../../libs/crypto');


module.exports.controllerFunction = function(app){

	var infoOf = {};

	//All pages routing path
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

	///////////////////// SignUp functions //////////////
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
					// console.log("data addedd");
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

	////////////////////// LogIn function /////////////////////
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

	///////////////forgot api//////////////
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

	///////////ROute to newPassword password /////////////
	appRouter.post('/reset/:token', function(req, res) {
		// console.log("2"+req.params.token);
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


	///////////////// Adding Product Info //////////////
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
									req.flash('success','Product Added Successfully');
									res.render('product',{user:req.session.user});
								}
							});
							
							// res.render('error',{title: "Product Added"});
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

	////////// To view Products /////////////////
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

	///////////// Single info of a product ///////////////////
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

	//////////////// Adding to Cart function /////////////
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
						req.flash('success','Product Addedd to Cart');
						res.render('product',{user:userFound});
					}
				});
			}
		});
	});

	///////////// Sending view ////////////////
	appRouter.get('/editPro/:id',auth.isLoggedIn,function(req,res){
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
						// console.log("pro "+update);
						res.render('error',{title : "Came here"});
					}
				});
			}
		});
	});

	////////////// Viewing to cart function and making payment function /////////////////
	appRouter.get('/viewCart/:id',auth.isLoggedIn,function(req,res,next){
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
							eCart.findOne({'cart.productId':req.params.id},function(err,result){
								if(err){
									req.flash('error','Something Went Wrong');
									res.render('product',{user:req.session.user});
								}else{
									console.log('product Found');
									eCart.update({'cart.productId':req.params.id},updateObj,{multi:true},function(err,update){
										if(err){
											req.flash('error','Something Went Wrong');
											res.render('product',{user:req.session.user});
										}else{
											console.log(update);
											req.flash('success','Product Updated Successfully');
											res.render('product',{user:req.session.user});
										}
									});
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



	////////////// LogOut function ///////////
	appRouter.get('/logout',function(req,res){
		req.session.user = null;
		res.end();
		res.redirect('/users/index');
	});



	////////////// Setting default route ///////////////////
	app.use('/users',appRouter);
}