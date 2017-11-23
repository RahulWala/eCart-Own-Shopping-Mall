//including a module
var mongoose = require('mongoose');

 //declare schema object
var Schema = mongoose.Schema;

var eProduct = new Schema({

	// product info
	proName			: 	{type:String, required:true},
	price			: 	{type:Number, required:true},
	seller			: 	{type:String, default:''},
	model 			: 	{type:String},
	comment			: 	{type:String},
	category		: 	{type:String}
}
);

mongoose.model('Product',eProduct);