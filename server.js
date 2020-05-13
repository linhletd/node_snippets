var express = require('express');
var dotenv = require('dotenv').config();
var config = require('./server/configure.js');
// var bodyParser = require('body-parser')
// var f = require('./controllers/apis.js')
var app = express();
// app.use(bodyParser.urlencoded({extended: true}));
// app.route('/apis').post(f.currentWeather)
config(app);
app.route('/errortest').get(function(){
    throw new Error('manualy throw error')
})
app.listen(process.env.port||3300,function callback(){
    console.log('server is listening on port ' + (process.env.PORT||3300))
} )