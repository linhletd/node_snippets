const router = require('express').Router();
const apisf = require('../apis/apis.js');
const sqlrelate = require('../apis/mysql_relate');
const others = require('../apis/other_apis');
const dotenv = require('dotenv').config();
const Middleware = require('../configs/middleware');
module.exports = function(app){
    let customMiddleware = new Middleware(app);
    let apis = apisf(app);
    let apis1 = sqlrelate(app);
    app.post('/feedback', apis.feedback);
    app.use(customMiddleware.ensureAuthenticated);

    app.get('/logout', apis.logout)

    app.post('/discuss/post_topic',apis.createTopic);
    app.get('/discuss/data/titles', apis.getTopicTitle);
    app.get('/discuss/data/content/:topic_id', apis.getTopicContentById);
    app.get('/users/status', apis.getUserSignal);

    app.post('/others/currentweather', others.currentWeather);
    app.post('/others/similarity', others.similarity);

    app.use('/sql_query', customMiddleware.ensureSQLConnected)
    app.get('/sql_query/preview', apis1.getPreviewNorthWindData);
    app.get('/sql_query/download', apis1.downloadNorthWindData)

}