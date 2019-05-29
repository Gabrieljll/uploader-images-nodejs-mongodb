const path = require('path');
const { unlink } = require('fs-extra');
const passport = require('passport');

//mis esquemas de datos
const imageSchema = require('../models/image');
const user = require('../models/user');

module.exports = (app, passport) => {
    // GET /
    app.get('/', (req, res) => {
        // Responde con la página index.html
        res.render(path.join(__dirname, '../client/index'));
    });

    app.get('/login', (req, res) => {
        res.render(path.join(__dirname, '../client/login'), {
            message: req.flash('loginMessage')
        });
    });

    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/home',
        failureRedirect: '/login',
        failureFlash: true
    }));




    app.get('/signup', (req, res) => {
        res.render(path.join(__dirname, '../client/signup'), {
            message: req.flash('signupMessage')
        });
    });

    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/login',
        failureRedirect: '/signup',
        failureFlash: true
    }));

    // GET /home
    //actualizo el home con los datos 
    //que tengo en mi base
    //busca los datos y los almacena en una constante
    //y luego las muestra por consola
    app.get('/home', isLoggedIn, async (req, res) => {
        // Responde con la página home.html
        const images = await imageSchema.find().sort({ date: 'desc' });

        res.render(path.join(__dirname, '../client/home.ejs'), {
            images
        });
    });

    app.get('/upload', isLoggedIn, (req, res) => {
        res.render(path.join(__dirname, '../client/upload.ejs'));
    });

    app.get('/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        const image = await imageSchema.findById(id);
        let loggedUser = false;

        if (req.user.id == image.user) {
            loggedUser = true;
        }

        res.render(path.join(__dirname, '../client/image-profile.ejs'), {
            image: image,
            loggedUser: loggedUser
        });
    });

    app.put('/editing/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        const image = await imageSchema.findById(id);
        const path = image.path;
        const { pet, race, place, contact, description } = req.body;
        await imageSchema.findByIdAndUpdate(req.params.id, { pet, race, place, path, contact, description });
        res.redirect('/home');


    });


    app.get('/delete/:id', isLoggedIn, async (req, res) => {
        const { id } = req.params;
        const image = await imageSchema.findByIdAndDelete(id);
        //esto elimina la imagen de mi carpeta images utilizando la direccion de la imagen
        await unlink(path.resolve(path.join(__dirname, '../client/' + image.path)));
        res.redirect('/home');
    });

    app.get('/edit/:id', isLoggedIn, async (req, res) => {

        const img = await imageSchema.findById(req.params.id);
        res.render(path.join(__dirname, '../client/edit.ejs'), {
            img
        });
    });




    //función que verifica que el usuario esté logueado
    function isLoggedIn(req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        } else {
            return res.redirect('/login');
        }
    }


};