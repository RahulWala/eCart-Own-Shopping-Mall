//including a module
var mongoose = require('mongoose');

 //declare schema object
var Schema = mongoose.Schema;

var eProduct = new Schema({

	// product info
	proName			: 	{type:String, required:true},
	price			: 	{type:Number,default:0,required:true},
	seller			: 	{type:String, default:''},
	model 			: 	{type:String},
	descrip			: 	{type:String,required:true},
	category		: 	{type:String},
	owner			: 	{type:mongoose.Schema.Types.ObjectId,ref:"User"}
}
);

mongoose.model('Product',eProduct);