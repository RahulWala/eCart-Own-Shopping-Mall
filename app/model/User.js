//including a module
var mongoose = require('mongoose');

 //declare schema object
var Schema = mongoose.Schema;

var eCart = new Schema({

	userName		: 	{type:String, default:'', required:true},
	firstName		: 	{type:String, default:''},
	lastName		: 	{type:String, default:''},
	emailId			: 	{type:String, default:'', required:true},
	mobileNumber	: 	{type:Number, default:''},
	password		: 	{type:String, default:'', required:true},
	cart 			: 	[],
	resetPasswordToken		: {type:String},
  	resetPasswordExpires	: Date
}
);

mongoose.model('User',eCart);