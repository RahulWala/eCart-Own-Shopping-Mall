var express 	 = 	require('express');
var app			 = 	express();
var logger 		 = 	require('morgan');
var bodyParser 	 = 	require('body-parser');
var cookieParser = 	require('cookie-parser');
var session 	 = 	require('express-session');
var mongoose 	 =  require('mongoose');
var fs 			 =  require('fs');

//used to get the path of our view files in our comp
var path 		 = require('path');

app.use(bodyParser.json({limit:'10mb',extended:true}));
app.use(bodyParser.urlencoded({limit:'10mb',extended:true}));
app.use(cookieParser());

app.use(session({
	name	: 	'myFirstCookie',
	secret	: 	'R@W@1209348756',
	resave	: 	 true,
	httpOnly: 	 true,
	saveUninitialized : true,
	cookie 	: 	{ secure : false}
}));

//setting the templating engine
app.set("view engine",'jade');

//set the view folder
app.set('views',path.join(__dirname+'/app/views'));



//it will log or keep track of all the request that are made to the app
app.use(logger('dev'));



//defining configuration of mongodb or at eCart it will create db
var dbPath = "mongodb://localhost/eCart";

//telling mongo db to connect at dbPath or connect database
db = mongoose.connect(dbPath);

//checking connection is open or not
mongoose.connection.once('open',function(){
	console.log("Database Connection is open....");
});



//////////////////////// Models and views part //////////////////
fs.readdirSync('./app/model').forEach(function(file){
	if(file.indexOf('.js'))
		require('./app/model/'+file);
});

fs.readdirSync('./app/controller').forEach(function(file){
	if(file.indexOf('.js')){
		var control = require('./app/controller/'+file);

		control.controllerFunction(app);
	}
});

//auth file to check authentication of user
var auth = require('./middlewares/auth');
app.use(auth.loggedInUser);


/////////////////////////////////////listening port//////////////////////////
app.listen(3000,function(){
	console.log("App started listening on port 3000.....");
});
