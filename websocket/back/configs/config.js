const bodyParser = require('body-parser');
let cookieParser = require('cookie-parser');
const morgan = require('morgan');
const useHelmet = require('../secure/helmet');
const dotenv = require('dotenv').config({path: '../../../.env'})

const useUnauthRoute = require('../routes/unauth_routes');
const useAuthRoute = require('../routes/auth_routes')
module.exports = function config(client, app){
    useHelmet(app);
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
    app.use(cookieParser(process.env.SESS_SECRET));
    // app.use(morgan('dev'));
    useUnauthRoute(client, app);
    useAuthRoute(client, app)

}