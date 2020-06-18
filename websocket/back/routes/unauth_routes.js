const router = require('express').Router();
const handlersf = require('../apis/handle_unath_routes.js');
const dotenv = require('dotenv').config({path: '../../../.env'});

module.exports = function(client, app){
    let handlers = handlersf(client, app);
    router.post('/auth/register', handlers.register);
    router.post('/auth/verify/:type/:token', handlers.verifyToken);

    router.post('/auth/login', handlers.login('local'));
    router.get('/auth/fb', handlers.thirdPartyAuth('facebook'));
    router.get('/auth/fb/callback',handlers.login('facebook'));
    router.get('/auth/github', handlers.thirdPartyAuth('github'))
    router.get('/auth/github/callback',handlers.login('github'));

    router.delete('user/logout',handlers.logout)


    app.use(router)
}