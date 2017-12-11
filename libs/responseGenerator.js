var express = require('express');
var app = express();

exports.generate = function(error,message,status,data){
	var myResponse = {
		error : error ,
		message : message,
		status : status,
		data : data
	};

	return myResponse;
}