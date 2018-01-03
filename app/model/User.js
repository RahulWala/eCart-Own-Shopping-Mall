//including a module
var mongoose = require('mongoose');

 //declare schema object
var Schema = mongoose.Schema;

var cartContent = new Schema({

	_id			: 	{type:mongoose.Schema.Types.ObjectId,required:true,index:true},
	proName		: 	{type:String,default:'',required:true},
	category	: 	{type:String},
	price		: 	{type:Number,default:0,required:true}
});

var eCart = new Schema({
	userName		: 	{type:String, default:'', required:true},
	firstName		: 	{type:String, required:true},
	lastName		: 	{type:String, required:true},
	emailId			: 	{type:String, default:'', required:true},
	mobileNumber	: 	{type:Number, default:''},
	password		: 	{type:String, default:'', required:true},
	cart 			: 	[cartContent],
	resetPasswordToken		: {type:String},
  	resetPasswordExpires	: Date
});



mongoose.model('User',eCart);