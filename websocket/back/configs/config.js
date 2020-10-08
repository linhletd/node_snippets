const bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
const morgan = require('morgan');
const useHelmet = require('../secure/helmet');
const dotenv = require('dotenv').config({path: '../../../.env'})
const express = require('express');
// const formidable = require('formidable');

const useUnauthRoute = require('../routes/unauth_routes');
const useAuthRoute = require('../routes/auth_routes')
module.exports = function config(app){
    useHelmet(app);
    app.use(morgan('tiny'))
    app.get('/script',(req, res) => {
        res.sendFile(process.cwd() + '/statics/js/main.bundle.js')
    })
    /*****************************************/

    
    app.use(express.static('statics'));
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(cookieParser(process.env.SESS_SECRET));

    // app.use(morgan('dev'));
    useUnauthRoute(app);
    useAuthRoute(app);


    /*****************************************/

    app.use((req, res) => {
        res.sendFile(process.cwd() + '/index.html')
    });

}