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
        ws.ref = {};
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
        let utils = {
            discardSomeWhere(ownerId, expt){
                ownerMap.get(ownerId).forEach(socket => {
                    if(socket.id === expt) return;
                    socket.send(JSON.stringify({
                        type: 'somewhere',
                        payload: {}
                    }))
                })
            },
            needReceiveLeave(socket){
                let partnerSocket = socket.ref.game;
                if(partnerSocket){
                    delete partnerSocket.ref.game;
                    delete socket.ref.game;
                    let msg = {
                        type: 'leave',
                        payload: {_id: this.owner}
                    }
                    partnerSocket.send(JSON.stringify(msg));
                }
            }
        }
        ws.on('close',() => {
            console.log('close');
            utils.needReceiveLeave(ws);
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
            // console.log(`client say ${message}`)
            let {type, payload} = JSON.parse(message);
            console.log(type);
            (()=>{
                switch(type){
                    case 'invite':
                        return ()=>{
                            let {_id} = payload;
                            let raceId = uuid.v4();
                            this.waittingFor = raceId;
                            let msg = {
                                type: 'invite',
                                payload:{
                                    socketId: this.id,
                                    originatorId: this.owner,
                                    raceId
                                }
                            }
                            ownerMap.get(_id).forEach((socket) =>{
                                socket.send(JSON.stringify(msg))
                            })
                        }
                    case 'accept':
                        return ()=>{
                            let {socketId: sid, declined, raceId} = payload;
                            if(this.waittingFor !== raceId){
                                return utils.needReceiveLeave(this)
                            }
                            let {owner:_id, id} = this
                            let partnerSocket = idMap.get(sid)
                            this.ref.game = partnerSocket;
                            partnerSocket.ref.game = this;
                            let msg = {
                                type: 'accept',
                                payload: {
                                    _id
                                }
                            }
                            partnerSocket.send(JSON.stringify(msg));
                            declined.length && declined.map(id => {
                                let msg = {
                                    type: 'decline',
                                    payload: {_id: this.owner, reason: 'playing with somebody'}
                                }
                                idMap.get(id).send(JSON.stringify(msg));
                            })
                            utils.discardSomeWhere(_id, id);
                        }
                    case 'decline':
                        return ()=>{
                            let {inviteId} = payload, {id, owner: _id} = this;
                            console.log(payload)
                            let msg = {
                                type: 'decline',
                                payload: {_id, reason: 'can not play now'}
                            }
                            idMap.get(inviteId).send(JSON.stringify(msg));
                            utils.discardSomeWhere(_id, id);
                        }
                    case 'cancel': case 'leave':
                        delete this.waittingFor;
                        return ()=>{
                            let partnerSocket = this.ref.game
                            if(partnerSocket){
                                utils.needReceiveLeave(this)
                            }
                            else if(type === 'cancel') {
                                let {_id} = payload;
                                ownerMap.get(_id).forEach((socket) =>{
                                    socket.send(JSON.stringify({
                                        type: 'cancel',
                                        payload: {inviteId: this.id}
                                    }))
                                })
                            }
                        }
                    case 'go': case 'shoot':
                        return () =>{
                            this.ref.game.send(message);
                        }
                    case 'leave':
                        return () =>{
                            utils.needReceiveLeave(this);
                        }
                    default:
                        return ()=>{

                        }
                }
            })()()

            if(Date.now() >= ws.expires){
                return ws.close(4000, 'session terminated')
            }
            // idMap.forEach((socket) =>{
            //     socket.send(JSON.stringify({type: 'server hello',payload: {}}))
            // })

        })
    
    })
}
