const router = require('express').Router();
const apisf = require('../apis/apis.js');
const dotenv = require('dotenv').config({path: '../../../.env'});
const {ensureAuthenticated} = require('../configs/middleware');

module.exports = function(client, app){
    app.use(ensureAuthenticated);

    // router here
    app.use(router)
}