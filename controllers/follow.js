'use strict'

// var path = require('path');
// var fs = require('fs');
var mongoosePaginate = require('mongoose-pagination');

var User = require('../models/user');
var Follow = require('../models/follow');

function saveFollow(req, res){
    var params = req.body;
    
    var follow = new Follow();
    follow.user = req.user.sub;
    follow.followed = params.followed;

    follow.save((err, followStored) => {
        if(err) return res.status(500).send({message: 'Error al guardar el seguimiento'});

        if(!folloStored) return res.status.send({message: 'El seguimiento no se ha guardado'});

        return res.status(200).send({follow:followStored});
        });
}

function deleteFollow(req, res){
	// Id del usuario que vamos a cambiar su follow
	var userId = req.user.sub;
	// Id del usuario que vamos a dejar de seguir, se los pasamos por URL
	var followId = req.params.id;

	Follow.find({'user':userId, 'followed':followId}).remove(err => {
		if(err) return res.status(500).send({message: 'Error al dejar de seguir'});

		return res.status(200).send({message: 'El follow se ha eliminado'});
	})
}

module.exports = {
	saveFollow,
	deleteFollow
}
