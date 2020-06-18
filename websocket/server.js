'use strict';
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const dotenv = require('dotenv').config({path: '../.env'});
const uuid = require('uuid');
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const config = require('./back/configs/config');
const { session } = require('passport');


let map = new Map();
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
const sessionParser = require('./back/auths/session')(dbConnect);
dbConnect.then((client) => {
    let db = client.db(process.env.MG_DB_NAME);
    let users = db.collection('users');
    let sessions = db.collection('sessions')
    users.updateMany({},{$set: {IsOnline: 0}});
    sessions.find({session: {$regex:/"ws":\[.+?\]/}}).forEach((doc) =>{
        let resetValue = doc.session.replace(/"ws":\[.+?\]/,'"ws":[]');
        sessions.updateOne({_id: doc._id},{$set: {session: resetValue}})
    })

    const app = express();
    app.get('/script',(req, res) => {
        res.sendFile(__dirname + '/bundle.js')
    })
    config(client, app);
    app.use((req, res) => {
        res.sendFile(__dirname + '/index.html')
    });

    const server = http.createServer(app);
    const wss = new WebSocket.Server({noServer: true});
    server.on('upgrade',(req, socket, head) =>{
        console.log('client want to communicate via websocket');
        sessionParser(req, {}, function next(){
            if(req.sessionID){
                let socketID = uuid.v4();
                let userID = req.session.passport.user.id;
                req.session.ws.push(socketID);
                req.sessionStore.set(req.sessionID, req.session,(err)=>{
                    console.log(err,'save session');
                })
                wss.handleUpgrade(req, socket, head, (ws) =>{
                    wss.emit('connection', ws, socketID, userID)
                })
            }
            else{
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
            }
        })
    
    })
    wss.on('connection', (ws, socketID, userID) =>{
        ws.owner = userID;
        map.set(socketID, ws);
        let _id = ObjectID(userID);
        users.findOne({_id},(err, user) => {
            if(err){ return console.log('err when update online state')}
            users.updateOne({_id},{$set: {IsOnline: user.IsOnline === undefined ? 1 : ++user.IsOnline}});
        })
        ws.isAlive = true;
        let itval = setInterval(() => {
            if(ws.isAlive){
                ws.isAlive = false;
                ws.ping(()=>{})
                return;
            }
            return ws.terminate();
    
        },30000)
        ws.on('pong', function(){
            this.isAlive = true;
        })
        ws.on('close',() => {
            map.delete(socketID);
            clearInterval(itval);
            let _id = ObjectID(userID);
            users.findOne({_id},(err, user) => {
                if(err){ return console.log('err when update online state')}
                users.updateOne({_id},{$set: {IsOnline: user.IsOnline === undefined ? 0 : --user.IsOnline}});
            })
        });
    
    })
    server.listen(8080, () =>{
        console.log('server is listening on port 8080')
    })
}).catch((err) => {
    console.log('cannot connect to database: ', err)
})
