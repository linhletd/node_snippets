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
    host: process.env.MYSQL_HOST,
    database: process.env.MYSQL_DB1,
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    port: 3306,
    multipleStatements: false
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
// let dbConnection = Promise.all([mongoConnect, mysqlConnect]);
// dbConnection.then(([client, conn]) => {
mongoConnect.then(client =>{
try{
    /************** clear previous redundants *********************/
    let db = client.db(process.env.MG_DB_NAME);
    let users = db.collection('users');
    let sessions = db.collection('sessions');
    sessions.find({session: {$regex:/"ws":\[.+?\]/}}).forEach((doc) =>{
        let resetValue = doc.session.replace(/"ws":\[.+?\]/,'"ws":[]');
        sessions.updateOne({_id: doc._id},{$set: {session: resetValue}})
    })
    /**********************************************/

    const app = express();
    app.client = client;
    mysqlConnect.then((conn) =>{
        app.conn = conn;
    }).catch(err =>{
        console.log('err occured when connect to mysql database', err.message)
    })
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
