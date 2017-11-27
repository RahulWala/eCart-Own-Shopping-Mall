//including a module
var mongoose = require('mongoose');

 //declare schema object
var Schema = mongoose.Schema;

var eCart = new Schema({

	userName		: 	{type:String, default:'', required:true},
	firstName		: 	{type:String, default:''},
	lastName		: 	{type:String, default:''},
	emailId			: 	{type:String, default:''},
	mobileNumber	: 	{type:Number, default:''},
	password		: 	{type:String, default:''},
	cart 			: 	[]
}
);

mongoose.model('User',eCart);