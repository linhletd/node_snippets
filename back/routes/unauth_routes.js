const router = require('express').Router();
const handlersf = require('../apis/handle_unath_routes.js');
const dotenv = require('dotenv').config();
let Middleware = require('../configs/middleware');
module.exports = function(app){
    let handlers = handlersf(app);
    let customMiddleware = new Middleware(app);
    router.post('/auth/register',customMiddleware.ensureHavingInitCookie, handlers.register);
    router.get('/auth/verify', handlers.verifyToken);
    router.post('/auth/invoke-token', customMiddleware.ensureHavingInitCookie, handlers.invokeToken)

    router.post('/auth/login', handlers.login('local'));
    router.get('/auth/fb', handlers.thirdPartyAuth('facebook'));
    router.get('/auth/fb/callback',handlers.login('facebook'));
    router.get('/auth/github', handlers.thirdPartyAuth('github'))
    router.get('/auth/github/callback',handlers.login('github'));
    
    app.use(router)
}