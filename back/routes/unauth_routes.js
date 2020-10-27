const router = require('express').Router();
const handlersf = require('../apis/handle_unath_routes.js');
const dotenv = require('dotenv').config();

module.exports = function(app){
    let handlers = handlersf(app);
    router.post('/auth/register', handlers.register);
    router.post('/auth/verify/:type/:token', handlers.verifyToken);

    router.post('/auth/login', handlers.login('local'));
    router.get('/auth/fb', handlers.thirdPartyAuth('facebook'));
    router.get('/auth/fb/callback',handlers.login('facebook'));
    router.get('/auth/github', handlers.thirdPartyAuth('github'))
    router.get('/auth/github/callback',handlers.login('github'));

    app.use(router)
}