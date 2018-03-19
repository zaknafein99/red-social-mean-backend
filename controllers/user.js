/*jslint node: true */
'use strict';

var User = require('../models/user');
var bcrypt = require('bcrypt-nodejs');
var jwt = require('../services/jwt');
var mongoosePaginate = require('mongoose-pagination');
var fs = require ('fs');
var path = require ('path');

// Metodos de prueba
function home(req, res) {
    res.status(200).send({
        message: 'Hola mundo desde el servidor de NodeJS'
    });
}

function pruebas(req, res) {
    res.status(200).send({
        message: 'Acción de pruebas en el servidor de NodeJS'
    });
}

// Registro
function saveUser(req, res){
    var params = req.body;
    var user = new User();

    if(params.name && params.surname && params.nick && params.email && params .password){

        user.name = params.name;
        user.surname = params.surname;
        user.nick = params.nick;
        user.email = params.email;
        user.role = 'ROLE_USER';
        user.image = null;

        // Controlar usuarios duplicados
        User.find({ $or: [
                            {email: user.email.toLowerCase()},
                            {nick: user.nick.toLowerCase()},
                        ]}).exec((err, users) => {
                            if(err) return res.status(500).send({message: 'Error en la petición de usuarios'});
                            if(users.length >= 1) {
                                return res.status(200).send({message: 'El usuario que intentas registrar ya existe'});
                            }else{
                                // Ciffra la password y guarda los datos
                                bcrypt.hash(params.password, null, null, (err, hash) => {
                                    user.password = hash;

                                    user.save((err, userStored) => {
                                        if(err) return res.status(500).send({message: 'Error al guardar el usuario'});

                                        if(userStored){
                                            res.status(200).send({user: userStored});
                                        }else{
                                            res.status(404).send({message: 'No se ha registrado el usuario'});
                                        }
                                    });
                                });
                            }
                        });
    }else{
        res.status(200)({
            message: "Envía todos los campos necesarios"
        });
    }
}

// Login
function loginUser(req, res){
    var params = req.body;

    var email = params.email;
    var password = params.password;

    User.findOne({email: email}, (err, user) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});
        if(user){
            bcrypt.compare(password, user.password, (err, check) => {
                if(check){
                    if(params.gettoken){
                        // Devolver y devolver el token
                        return res.status(200).send({
                            token: jwt.createToken(user),
                        });
                    }else{
                        // Devolver datos de usuario
                        user.password = undefined;
                        return res.status(200).send({user});
                    }
                }else{
                    return res.status(404).send({message: 'El usuario no se ha podido identificar'});
                }
            });
        }else{
            return res.status(404).send({message: 'El usuario no se ha podido identificar!'});
        }
    });
}

// Conseguir datos de un usuario

function getUser(req, res){
    var userId = req.params.id;

    User.findById(userId, (err, user) => {
        if(err) return res.status(500).send({message: "Error en la petición"});

        if(!user) return res.status(404).send({message: "El usuario no existe"});

        return res.status(200).send({user});
    });
}

// Devolver un listado de usuarios paginados
function getUsers(req, res){
    var identity_user_id = req.user.sub;

    var page = 1;
    if(req.params.page){
        page = req.params.page;

    }

    var itemsPerPage = 5;
    User.find().sort('_id').paginate(page, itemsPerPage, (err, users, total) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!users) return res.status(404).send({message: 'No hay usuarios disponibles'});

        return res.status(200).send({
            users,
            total,
            pages: Math.ceil(total/itemsPerPage)
        })
    });
}

// Edición de datos de usuario
function updateUser(req, res){
    var userId = req.params.id;
    var update = req.body;

    // Borrar la propiedad password
    delete update.password;

    if(userId != req.user.sub){
        console.log(req.user.sub);
        return res.status(500).send({message: 'No tienes permiso para actualizar los datos del usuario'});
    }

    User.findByIdAndUpdate(userId, update, {new:true}, (err, userUpdated) => {
        if(err) return res.status(500).send({message: 'Error en la petición'});

        if(!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});

        return res.status(200).send({user: userUpdated});
    });

}

// Subir archivos de imagen/avatar de usuario

function uploadImage(req, res){
    var userId = req.params.id;


    if(req.files){
        var file_path = req.files.image.path;
        console.log(file_path);

        // Separo la ruta del nombre de archivo
        var file_split = file_path.split('/');
        console.log(file_split);

        // Cargo solo el nombre del archivo
        var file_name = file_split[2];
        console.log(file_name);

        // Separo la extension del nombre del archivo
        var ext_split = file_name.split('\.');

        console.log(ext_split);

        // Cargo la extensión en una variable
        var file_ext = ext_split[1];

        if(userId != req.user.sub){
            return removeFilesOfUploads(res, file_path, 'No tienes permiso para actualizar los datos del usuario');
        }

        if(file_ext == 'png' || file_ext == 'jpg' || file_ext == 'gif' || file_ext == 'jpeg' ){
            // Actualizar documento de usuario logueado
            User.findByIdAndUpdate(userId, {image: file_name}, {new: true}, (err, userUpdated) =>{

        	if(err) return res.status(500).send({message: 'Error en la petición'});
            if(!userUpdated) return res.status(404).send({message: 'No se ha podido actualizar el usuario'});
            return res.status(200).send({user: userUpdated});
        })
        }else{
            return removeFilesOfUploads(res, file_path, 'Extensión no válida');
        }

    }else{
        return res.status(200).send({message: 'No se han subido imágenes'});
    }
}

function removeFilesOfUploads(res, file_path, message){
    fs.unlink(file_path, (err) => {
        return res.status(200).send({message: message});
    });
}

function getImageFile(req, res){
    var image_file = req.params.imageFile;
    var path_file = './uploads/users/'+image_file;

    fs.exists(path_file, (exists) => {
    if(exists){
            res.sendFile(path.resolve(path_file));
        }else{
            res.status(200).send({message: 'No existe la imagen'});
        }
    });
}

module.exports= {
    home,
    pruebas,
    saveUser,
    loginUser,
    getUser,
    getUsers,
    updateUser,
    uploadImage,
    getImageFile
}
