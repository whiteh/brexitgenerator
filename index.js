"use strict"

const express = require('express')
const app = express()
const fs = require('fs');
const md5 = require("md5");
const RateLimit = require('express-rate-limit');
const votes = require("./model/db.js");

const limiter = new RateLimit({
  windowMs: 0*1000, // 30 secs
  max: 10, // limit each IP to 1 requests per windowMs 
  delayMs: 0 // disable delaying - full speed until the max limit is reached 
});

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
		let m = md5(a);
		adj_map[m] = a;
		console.log(m+ " => " + a);

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


// Voting mechanism

app.use("/vote/:hash", limiter);

app.put('/vote/:hash/:dir', function (req, res) {
  let hash      = req.params.hash,
  	  direction = req.params.dir,
  	  adjective = null,
      ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

  if (typeof hash !== "string" || !adj_map[hash]) {
  	res.status("404");
  	return res.send("Policy not found");
  }
  console.log(adj_map[hash]+" voted "+direction);
  votes.addVote(ip, hash, direction, function(err, adj){
    if (err) {
      console.log(err);
      res.status("500");
      return res.send("There was an error");
    }
    res.status("200");
    return res.send("Vote cast");
  });
  
});

app.get('/*', function (req, res) {
  	return res.redirect('/');
});
app.listen(3000, function () {
  console.log("")
  console.log('Example app listening on port 3000!')
})