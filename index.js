"use strict"

const express = require('express')
const app = express()
const fs = require('fs');
const md5 = require("md5");

var adjectives = [];
var adj_map = {};

function loadAdjectives(callback){
	fs.readFile( __dirname + '/adj_short.txt', function (err, data) {
	  if (err) {
	    return callback(err, null);
	  }
	  const str = data.toString();
	  const parts = str.split("\n");
	  callback(null, parts);
	});	
}

loadAdjectives(function(err, arr){
	if (err) {
		throw err;
	}
	adjectives = arr;
	adjectives.forEach(function(a){
		adj_map[md5(a)] = a;
		console.log(md5(a)+ " => " + a);
	});
	console.log(arr.length+" adjectives loaded");
});

app.set('view engine', 'pug')
app.use(express.static(__dirname + '/public'));

app.get('/', function (req, res) {
  let i = Math.floor(Math.random()* adjectives.length),
  	  adjective = adjectives[i],
  	  hash = md5(adjective);
  	  res.redirect("/i/"+hash);
});

app.get('/i/:hash', function (req, res) {
  let hash = req.params.hash,
  	  adjective = null;

  if (typeof hash !== "string" || !adj_map[hash]) {
  	return res.redirect('/');
  }
  adjective = adj_map[hash].charAt(0).toUpperCase() + adj_map[hash].slice(1);
  adjective = adjective.trim();
  res.render('index', { message: '\"'+adjective+'" Brexit', key: hash, encoded: encodeURIComponent('I got \"'+adjective+'" #Brexit - what\'s your policy?') })
});
app.get('/*', function (req, res) {
  	return res.redirect('/');
});
app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})