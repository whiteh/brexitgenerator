"use strict"

const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/brexit');
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function() {
    console.log("Database connection initialised...");
});
const md5 = require("md5");


const adjectiveSchema = mongoose.Schema({
    hash: String,
    votes: Array,
    up: Number,
    down: Number
});



adjectiveSchema.methods.vote = function(ip, dir, cb) {
    const ip_hash = md5(ip);
    if (this.votes.indexOf(ip_hash) < 0 ) {
        this.votes.push(ip_hash);
        this[dir] +=1;
    }
    return cb(null, this);
};

var Adjective = mongoose.model('Adjective', adjectiveSchema);

module.exports = {
    addVote: function(ip, adj_hash, dir, callback) {
        Adjective.findOne( {hash : adj_hash}, function (err, doc) {
            let adj = null;
            if (err) {
                return callback(err, null);
            }
            if (doc){
                adj = doc;
            }else{
                adj = new Adjective({hash: adj_hash, votes: [], up:0, down:0});
            }

            adj.vote(ip, dir, function(err, adj){
                if (err) {
                    return callback(err, null);
                }
                adj.save(callback);
            });
        });
    },
    getVotes: function(adj_hash, callback) {
        Adjective.findOne( { hash:adj_hash }, function(err, doc) {
            let adj = null;
            if (err) {
                return callback(err, null);
            }
            if (doc){
                adj = { up: doc.up || 0, down: doc.down || 0 };
            }else {
                adj = { up: 0, down:0 };
            }

            callback(null, adj);
        });
    }


};
