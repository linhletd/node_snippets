'use strict';
const WebSocket = require('ws');
const http = require('http');
const express = require('express');
const dotenv = require('dotenv').config({path: '../.env'});
const uuid = require('uuid');
const MongoClient = require('mongodb').MongoClient;

let map = new Map();
map.set()
const app = express();
const map = new Map();
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
    let db = client.db(process.env.MG_BD_NAME);
    let users = db.collection('users');
    const server = http.createServer(app);
    const wss = new WebSocket.Server({noServer: true});
    server.on('upgrade',(req, socket, head) =>{
        sessionParser(req, {}, function next(){
            if(req.authenticated() && req.session.ws){
                let socketID = uuid.v4();
                let userID = req.session.passport.user.id;
                req.session.ws.push(uuid);
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
        map.set(socketID, ws);
        users.findOne({_id: userID},(err, user) => {
            if(err){ return console.log('err when update online state')}
            user.isOnline === undefined ? user.isOnline = 1 : ++user.isOnline;
            users.save(user);
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
            users.findOne({_id: userID},(err, user) => {
                if(err){ return console.log('err when update online state')}
                user.isOnline === undefined ? user.isOnline = 0 : --user.isOnline;
                users.save(user);
            })
        });
    
    })
    server.listen(8080, () =>{
        console.log('server is listening on port 8080')
    })
}).catch((err) => {
    console.log('cannot connect to database: ', err.message)
})
