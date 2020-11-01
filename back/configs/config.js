const bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
const morgan = require('morgan');
const useHelmet = require('../secure/helmet');
const dotenv = require('dotenv').config();
const express = require('express');
let Middleware = require('./middleware');

const useUnauthRoute = require('../routes/unauth_routes');
const useAuthRoute = require('../routes/auth_routes');
module.exports = function config(app){
    let customMiddleware = new Middleware(app);
    //keep glitch awake for a while
    app.get('/awake',(req, res, next) =>{
        res.end()
    })
    //
    app.get('/favicon.ico', (req, res, next)=>{
        return res.sendFile(process.cwd() + '/statics/image/icon.png')
    })
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
    app.get('/feedback', (req, res) =>{
        res.sendFile(process.cwd() + '/statics/html/feedback.html');
    })
    app.get('/term-privacy', (req, res) =>{
        res.sendFile(process.cwd() + '/statics/html/term_privacy.html');
    })
    useUnauthRoute(app);
    useAuthRoute(app);


    /*****************************************/
    app.use(customMiddleware.setInitialCookie,(req, res) => {
        res.sendFile(process.cwd() + '/index.html');
    });

}