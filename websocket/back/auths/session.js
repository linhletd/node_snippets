const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const dotenv = require('dotenv').config();
module.exports = function(client){
    const sessionParser = session({
    saveUninitialized: false,
    secret: process.env.SESS_SECRET,
    resave: false,
    store: new MongoStore({
            clientPromise: client,
            dbName: process.env.MG_DB_NAME,
            touchAfter: 24*60*60,
            ttl: 14 * 24 * 60 * 60,
            autoRemove: 'interval',
            autoRemoveInterval: 10
        })
    });
}