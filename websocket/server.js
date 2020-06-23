'use strict';
const http = require('http');
const express = require('express');
const dotenv = require('dotenv').config({path: '../.env'});
const MongoClient = require('mongodb').MongoClient;
const config = require('./back/configs/config');
const applyWebsocket = require('./ws_server')

const dbConnect = new Promise((resolve, reject) => {
  MongoClient.connect(process.env.MGDB,{ useUnifiedTopology: true }, (err, client) => {
      if(err){
          reject(err);
      }
      else {
          resolve(client);
      }
  })
});
dbConnect.then((client) => {
    console.log('database connected');
try{
    /************** clear previous redundants *********************/
    let db = client.db(process.env.MG_DB_NAME);
    let users = db.collection('users');
    let sessions = db.collection('sessions');
    users.updateMany({},{$set: {IsOnline: 0}});
    sessions.find({session: {$regex:/"ws":\[.+?\]/}}).forEach((doc) =>{
        let resetValue = doc.session.replace(/"ws":\[.+?\]/,'"ws":[]');
        sessions.updateOne({_id: doc._id},{$set: {session: resetValue}})
    })
    /**********************************************/

    const app = express();
    app.client = client;
    const server = http.createServer(app);
    applyWebsocket(server, app, client);
    config(app);



    server.listen(8080, () =>{
        console.log('server is listening on port 8080')
    })
}
catch(e){
    console.log('err occurs when running server',e)
}
}).catch((err) => {
    console.log('cannot connect to database: ', err)
})
