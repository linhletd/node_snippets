'use strict';
const http = require('http');
const express = require('express');
const dotenv = require('dotenv').config({path: '../.env'});
const MongoClient = require('mongodb').MongoClient;
const config = require('./back/configs/config');
const applyWebsocket = require('./ws_server');
const sql = require('mysql');


let mongoConnect = new Promise((resolve, reject) => {
  MongoClient.connect(process.env.MGDB,{ useUnifiedTopology: true }, (err, client) => {
      if(err){
          reject(err);
      }
      else {
          resolve(client);
          console.log('mongo connected');
      }
  })
})
let conn = sql.createConnection({
    database: "northwindvn",
    host: "db4free.net",
    user: "linhletd",
    port: 3306,
    password: "samsung@1",
    multipleStatements: true
});
let mysqlConnect = new Promise((resolve, reject) => {
    conn.connect((err) =>{
        if(err){
            reject(err);
        }
        else{
            resolve(conn);
            console.log('mysql connected')
        }
    })
})
let dbConnection = Promise.all([mongoConnect, mysqlConnect]);
dbConnection.then(([client, conn]) => {
try{
    /************** clear previous redundants *********************/
    let db = client.db(process.env.MG_DB_NAME);
    let users = db.collection('users');
    let sessions = db.collection('sessions');
    // users.updateMany({},{$unset: {IsOnline: ''}});
    sessions.find({session: {$regex:/"ws":\[.+?\]/}}).forEach((doc) =>{
        let resetValue = doc.session.replace(/"ws":\[.+?\]/,'"ws":[]');
        sessions.updateOne({_id: doc._id},{$set: {session: resetValue}})
    })
    /**********************************************/

    const app = express();
    app.client = client;
    app.conn = conn;
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
