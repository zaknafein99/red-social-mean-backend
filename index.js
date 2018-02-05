'use strict'

var mongoose = require('mongoose');

mongoose.Promise = global.Promise;
//mongoose.connect('mongodb://localhost:27017/curso_mean_social', { useMongoClient: true})
mongoose.connect('mongodb://localhost:27017/curso_mean_social')

    .then(() => {
        console.log("La conexión a la base de datos curso_mean_social se a realizado correctamente");

    })
    .catch(err => console.log(err));
    
