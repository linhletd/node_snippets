const ObjectID = require('mongodb').ObjectID;
const WebSocket = require('ws');
const dotenv = require('dotenv').config({path: '../.env'});
const uuid = require('uuid');
let idMap = new Map();
let ownerMap = new Map();
let sessionMap = new Map();

module.exports = function applyWebsocket(server, app){
    app.idMap = idMap;
    app.ownerMap = ownerMap;
    app.sessionMap = sessionMap;
    let client = app.client;
    let db = client.db(process.env.MG_DB_NAME);
    let users = db.collection('users');
    let sessions = db.collection('sessions');
    let topics = db.collection('topics');
    let sessionParser = require('./back/auths/session')(client);
    let wss = new WebSocket.Server({noServer: true});
    server.on('upgrade',(req, socket, head) =>{
        console.log('client want to communicate via websocket');
        sessionParser(req, {}, function next(){
            if(req.session.passport && req.session.passport.user){
                let socketID = uuid.v4();
                console.log(req.session.passport)
                let user = req.session.passport.user;
                let sessionID = req.sessionID;
                wss.handleUpgrade(req, socket, head, (ws) =>{
                    wss.emit('connection', ws, socketID, user, sessionID);
                })
            }
            else{
                socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
                socket.destroy();
            }
        })
    
    })
    wss.on('connection', (ws, socketID, user, sessionID) =>{
        let userID = user._id;
        ws.owner = userID;
        ws.id = socketID;
        idMap.set(socketID, ws);
        let uid = ownerMap.get(userID);
        let sid = sessionMap.get(sessionID);
        if(uid){
            uid.add(ws);
        }
        else {
            idMap.forEach(socket => {
                socket.send(JSON.stringify({
                    type: 'online',
                    payload: user
                }))
            })
            uid = new Set([ws]);
            ownerMap.set(userID, uid);
        }
        sid ? sid.add(ws) : (sid = new Set([ws]), sessionMap.set(sessionID, sid));

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
            console.log('close')
            idMap.delete(socketID);
            if(ownerMap.get(userID).size === 1){
                ownerMap.delete(userID);
                idMap.forEach((socket) => {
                    socket.send(JSON.stringify({type: 'offline', payload: {_id: userID}}));
                })
            }
            else {
                ownerMap.get(userID).delete(ws);
            }
            sessionMap.get(sessionID).size === 1 ? sessionMap.delete(sessionID) : sessionMap.get(sessionID).delete(ws)
            clearInterval(itval);

        });
        ws.on('message', function incoming(message){
            console.log(`client say ${message}`)
            if(Date.now() >= ws.expires){
                return ws.close(4000, 'session terminated')
            }
            idMap.forEach((socket) =>{
                socket.send(JSON.stringify({type: 'server hello',payload: {}}))
            })

        })
    
    })
}
