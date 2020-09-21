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
                // console.log(req.session.passport)
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
            needReceiveLeave(inviteId){
                let msg = {
                    type: 'leave',
                    payload: {inviteId}
                }
                this.send(JSON.stringify(msg));
            },
            needClearCurrentGameRef(socket){
                let oldRef = socket.ref && socket.ref.game;
                if(oldRef){
                    console.log('send leave')
                    oldRef.send(JSON.stringify({
                        type: 'leave',
                        payload: {inviteId: socket.inviteId}
                    }))
                    delete socket.inviteId
                    delete oldRef.inviteId
                    delete socket.ref.game;
                    delete oldRef.ref.game;
                }
            }
        }
        ws.on('close',() => {
            console.log('close');
            utils.needClearCurrentGameRef(ws);
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
            if(payload._id && !ownerMap.get(payload._id)){
                return;
            }
            (()=>{
                switch(type){
                    case 'invite':
                        return ()=>{
                            utils.needClearCurrentGameRef(this)
                            let {_id, inviteId} = payload;
                            this.inviteId = inviteId;
                            let msg = {
                                type: 'invite',
                                payload:{
                                    socketId: this.id,
                                    originatorId: this.owner,
                                    inviteId
                                }
                            }
                            ownerMap.get(_id).forEach((socket) =>{
                                socket.send(JSON.stringify(msg))
                            })
                        }
                    case 'accept':
                        return ()=>{
                            let {socketId: sid, declined, inviteId} = payload;
                            let {owner:_id, id} = this;
                            let partnerSocket = idMap.get(sid);
                            if(!partnerSocket || partnerSocket.inviteId !== inviteId){
                                return //utils.needReceiveLeave(inviteId)
                            }
                            utils.needClearCurrentGameRef(this)
                            this.ref.game = partnerSocket;
                            this.inviteId = inviteId;
                            partnerSocket.ref.game = this;
                            let msg = {
                                type: 'accept',
                                payload: {_id, inviteId}
                            }
                            partnerSocket.send(JSON.stringify(msg));
                            declined.length && declined.map(({socketId: id, inviteId}) => {
                                let msg = {
                                    type: 'decline',
                                    payload: {_id: this.owner, reason: 'playing with somebody', inviteId}
                                }
                                idMap.get(id).send(JSON.stringify(msg));
                            })
                            utils.discardSomeWhere(_id, id);
                        }
                    case 'decline':
                        return ()=>{
                            let {socketId, inviteId} = payload, {id, owner: _id} = this;
                            utils.discardSomeWhere(_id, id);
                            let intendPartner = idMap.get(socketId);
                            if(intendPartner && intendPartner.inviteId === inviteId){
                                let msg = {
                                    type: 'decline',
                                    payload: {_id, reason: 'can not play now', inviteId}
                                }
                                intendPartner.send(JSON.stringify(msg));
                            }

                        }
                    case 'cancel': case 'leave':
                        return ()=>{
                            let inviteId = this.inviteId;
                            if(type === 'cancel' && !this.ref.game) {
                                let {_id} = payload;
                                ownerMap.get(_id).forEach((socket) =>{
                                    socket.send(JSON.stringify({
                                        type: 'cancel',
                                        payload: {inviteId}
                                    }))
                                })
                            }
                            utils.needClearCurrentGameRef(this)
                        }
                    case 'go': case 'shoot': case 'continue':
                        return () =>{
                            this.ref.game && this.ref.game.send(message);
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
