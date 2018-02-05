'use strict'

var mongoose = require('mongoose');
var schema = mongoose.Schema;

var FollowSchema = Schema({
    user: { type: schema.ObjectId, ref: 'User'},
    followed: { type: schema.ObjectId, ref: 'User'},
});

module.exports = mongoose.model('Follow', FollowSchema);