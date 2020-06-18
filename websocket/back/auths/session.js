const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const dotenv = require('dotenv').config();
module.exports = function(client){
    let storeOption = {
        // clientPromise: client,
        dbName: process.env.MG_DB_NAME,
        touchAfter: 24*60*60,
        ttl: 14 * 24 * 60 * 60,
        autoRemove: 'interval',
        autoRemoveInterval: 10
    };
    if(client.then){
        storeOption.clientPromise = client;
    }
    else {
        storeOption.client = client;
    }
    let sessionParser = session({
    saveUninitialized: false,
    secret: process.env.SESS_SECRET,
    resave: false,
    store: new MongoStore(storeOption)
    });
    return sessionParser;
}