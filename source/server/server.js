const express = require('express');
const app = express();
const { unlink } = require('fs-extra');
const morgan = require('morgan');
const path = require('path');
const methodOverride = require('method-override');
const bodyParser = require('body-parser');
const multer = require('multer'); //multer para entender las imagesnes subidas
const mongoose = require('mongoose');
const passport = require('passport');  //modulo que permite configurar
//la manera en la que voy a autenticar en mi sistema
const uuid = require('uuid/v4');
const { format } = require('timeago.js');

//el metodo format formatea un texto en este caso el horario
app.use((req, res, next) => {
  app.locals.format = format;
  next();
});



//me traigo 'passport' importandolo desde db-config para inicializarlo
require('../db-config/passport')(passport);


const flash = require('connect-flash'); //modulo que permite
//mandar mensajes que se almacenan en el navegador y luego los podemos
//mostrar cuando por ejemplo el usuario se equivoque o haga bien las cosas



const cookieParser = require('cookie-parser');
//cookie-parser me permite administrar las cookies del navegador
//es decir almacena los datos dentro del navegador para comprobar si el
//usuario esta logueado o no




const session = require('express-session');


//esquema de datos de las imagesnes y usuarios
const imageSchema = require('../models/image')
const user = require('../models/user')




//conexión a mongodb a través de dbconfig donde tengo 
//configurada mi url de la base de datos
const { url } = require('../db-config/database.js');
//Entre llaves obtengo ese mismo objeto con dicho nombre
mongoose.connect(url, {
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false
})
  .then(db => console.log('Db conectada'))
  .catch(err => console.log(err));



//motor de plantilla

app.set('views', path.join(__dirname, '../client'));
app.set('view engine', 'ejs');

//middlewares!!!!!
//esta propiedad de multer me permite establecer la manera de almacenar
//las imagenes mediante filename y tambien 
//le doy el destino donde lo voy a almacenar
const storage = multer.diskStorage({
  destination: path.join(__dirname, '../client/public-css/images'),
  filename: (req, file, cb, filename) => {
    cb(null, uuid() + path.extname(file.originalname));
  }
});

//methodOverride me permite utilizar mas metodos en los formularios
app.use(methodOverride('_method'));

//utilizo multer y le doy la direccion de donde se guardaran
//las imagenes que voy a subir desde el navegador
//le paso el storage como un objeto
app.use(multer({
  storage: storage,
  limits: { fileSize: 50000000 },    //establezco que el tamaño maximo es de 50MB
  fileFilter: (req, file, cb) => {     //esto es para filtrar que sea una imagen lo que se suba
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype); //verifico la extension 
    const extname = filetypes.test(path.extname(file.originalname)); //obtengo el nombre de extension
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb("Error: El archivo debe ser una imagen válida");
    }
  }
}).single('photo')); //establezco que se subirán una a la vez y a traves
//del name "foto", en el formulario de home.ejs

app.use(morgan('dev'));
app.use(cookieParser());
app.use(session(
  {
    secret: 'gjll',
    resave: true,
    saveUninitialized: true
  }));

//es el modulo que me permite definir la config de como se autentica el usuario
app.use(passport.initialize());

//las sesiones sirve para que la info no se pida a cada momento en la base de datos
app.use(passport.session());

//flash funciona para que las paginas html tengan una forma de comunicarse
//osea  para que se pasen mensajes entre ellas
app.use(flash());
app.use((req, res, next) => {
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});


// Middleware de body-parser para json
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));



// Ruta para recursos estáticos.
app.use(express.static(path.join(__dirname, '../client')));




//recibo los datos del formulario de home sobre la mascota encontrada
//la funcionalidad async/await permite almacenar datos sin necesidad
//de escribir promesas o mas codigo
app.post('/add', async (req, res) => {
  const file = req.file;
  const { pet, race, place, description, contact } = req.body;
  if (!pet || !race || !place || !file || !description || !contact) {
    //datos del formularios que se completaron o no
    const forMas = req.body.pet;
    const forRaz = req.body.race;
    const forLug = req.body.place;
    const forCont = req.body.contact;
    const forDes = req.body.description;
    res.render(path.join(__dirname, '../client/re-upload.ejs'), {
      forMas,
      forRaz,
      forLug,
      forCont,
      forDes
    });
  }
  else {
    const images = new imageSchema();
    images.pet = req.body.pet;
    images.race = req.body.race;
    images.place = req.body.place;
    images.contact = req.body.contact;
    images.description = req.body.description;
    images.filename = req.file.filename;
    images.path = '/public-css/images/' + req.file.filename;
    images.originalname = req.file.originalname;
    images.mimetype = req.file.mimetype;
    req.size = req.file.size;
    images.user = req.user.id;
    await images.save();
    res.redirect('/home');
  }
});

app.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/');
});

//obtengo las rutas
require('../routes/routes.js')(app, passport);


// Server iniciado en puerto 3000
app.listen(3000, function () {
  console.log('Escuchando puerto 3000 con Express');
});
