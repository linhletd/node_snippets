const router = require('express').Router();
const apisf = require('./apis/apis.js');


module.exports = function(client, app){
    let apis = apisf(client, app);
    router.post('/auth/register', apis.register);
    router.post('/auth/reset-request', apis.resetReq);
    router.post('/auth/verify/:type/:token', apis.verifyToken);
    router.post('/auth/reset-password', apis.resetPassword);

    router.post('/auth/login', apis.login('local'));
    router.get('/auth/fb', apis.thirdPartyAuth('facebook'));
    router.get('/auth/fb/callback',apis.login('facebook'));
    router.get('/auth/github', apis.thirdPartyAuth('github'))
    router.get('/auth/github/callback',apis.login('github'));


    router.post('/user/change-password', apis.changePassword)
    router.post('/user/note', apis.getNote)

    router.get('/discuss', apis.discuss);
    router.get()

    return router
}