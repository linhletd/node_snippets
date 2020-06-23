const router = require('express').Router();
const apisf = require('../apis/apis.js');
const dotenv = require('dotenv').config({path: '../../../.env'});

module.exports = function(app){
    const customMidleware = require('../configs/middleware')(app);
    let apis = apisf(app);
    app.use(customMidleware.ensureAuthenticated);
    app.post('/discuss/post_topic',apis.createTopic);
    app.get('/discuss/data/titles', apis.getTopicTitle);
    app.get('/discuss/data/content/:topic_id', apis.getTopicContentById);
    app.get('/discuss/comment', apis.postComment)
    // router here
}