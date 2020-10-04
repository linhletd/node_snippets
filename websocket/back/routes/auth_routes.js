const router = require('express').Router();
const apisf = require('../apis/apis.js');
const others = require('../apis/other_apis');
const dotenv = require('dotenv').config({path: '../../../.env'});

module.exports = function(app){
    const customMidleware = require('../configs/middleware')(app);
    let apis = apisf(app);
    app.use(customMidleware.ensureAuthenticated);

    app.get('/logout', apis.logout)

    app.post('/discuss/post_topic',apis.createTopic);
    app.get('/discuss/data/titles', apis.getTopicTitle);
    app.get('/discuss/data/content/:topic_id', apis.getTopicContentById);
    app.post('/discuss/comment', apis.postComment);
    app.get('/users/status', apis.getUserSignal);

    app.post('/others/currentweather', others.currentWeather);
    app.post('/others/similarity', others.similarity)
}