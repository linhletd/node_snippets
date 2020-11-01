const ObjectId = require('mongodb').ObjectId;
const WebSocket = require('ws');
const dotenv = require('dotenv').config();
const uuid = require('uuid');
let idMap = new Map();
let ownerMap = new Map();
let sessionMap = new Map();
let topicMap = new Map();
let discussSet = new Set();
module.exports = function applyWebsocket(server, app){
    app.idMap = idMap;
    app.ownerMap = ownerMap;
    app.sessionMap = sessionMap;
    app.topicMap = topicMap;
    app.discussSet = discussSet;
    let client = app.client;
    let db = client.db(process.env.MG_DB_NAME);
    let users = db.collection('users');
    let topics = db.collection('topics');
    let sessionParser = require('./back/auths/session')(client);
    let wss = new WebSocket.Server({noServer: true});
    server.on('upgrade',(req, socket, head) =>{
        sessionParser(req, {}, function next(){
            if(req.session.passport && req.session.passport.user){
                let socketID = uuid.v4();
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
        ws.send(JSON.stringify({
            type: 'ws id',
            payload: socketID
        }))
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
                ws.send(JSON.stringify(msg));
            },
            needClearCurrentGameRef(socket){
                let oldRef = socket.ref && socket.ref.game;
                if(oldRef){
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
            utils.needClearCurrentGameRef(ws);
            idMap.delete(socketID);
            if(ownerMap.get(userID).size === 1){
                ownerMap.delete(userID);
                let msg = JSON.stringify({type: 'offline', payload: {_id: userID}});
                idMap.forEach((socket) => {
                    socket.send(msg);
                })
                users.updateOne({_id: ObjectId(userID)}, {
                    $set: {
                        LastActive: Date.now() - 60 * 1000
                    }
                },
                {
                    upsert: false
                })
            }
            else {
                ownerMap.get(userID).delete(ws);
            }
            sessionMap.get(sessionID).size === 1 ? sessionMap.delete(sessionID) : sessionMap.get(sessionID).delete(ws)
            clearInterval(itval);
            if(ws.topic){
                let list = topicMap.get(ws.topic);
                if(list.size === 1){
                    topicMap.delete(ws.topic)
                }
                else{
                    list.delete(ws)
                }
            }
            if(discussSet.has(ws)){
                discussSet.delete(ws);
            }

        });

        ws.on('message', function incoming(message){
            let {type, payload} = JSON.parse(message);
            (()=>{
                try{
                    switch(type){
                        case 'invite':
                            return ()=>{
                                utils.needClearCurrentGameRef(this)
                                let {_id, inviteId} = payload;
                                this.inviteId = inviteId;
                                let msg = JSON.stringify({
                                    type: 'invite',
                                    payload:{
                                        socketId: this.id,
                                        originatorId: this.owner,
                                        inviteId
                                    }
                                })
                                let friend = ownerMap.get(_id);
                                if(friend){
                                    friend.forEach((socket) =>{
                                        socket.send(msg)
                                    })
                                }
                                else{
                                    ws.send(JSON.stringify({
                                        type: 'offline',
                                        payload: {_id}
                                    }))
                                }
                            }
                        case 'accept':
                            return ()=>{
                                let {socketId: sid, declined, inviteId} = payload;
                                let {owner:_id, id} = this;
                                let partnerSocket = idMap.get(sid);
                                if(!partnerSocket || partnerSocket.inviteId !== inviteId){
                                    return utils.needReceiveLeave(inviteId)
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
                                    let player = ownerMap.get(_id);
                                    let msg = JSON.stringify({
                                        type: 'cancel',
                                        payload: {inviteId}
                                    });
                                    player && player.forEach((socket) =>{
                                        socket.send(msg)
                                    })
                                }
                                utils.needClearCurrentGameRef(this)
                            }
                        case 'go': case 'shoot': case 'continue':
                            return () =>{
                                this.ref.game && this.ref.game.send(message);
                            }
                        case 'xdiscuss':
                            return ()=>{
                                discussSet.delete(ws)
                            }
                        case 'otopic':
                            return () =>{
                                ws.topic = payload;
                                let topic;
                                if((topic = topicMap.get(payload))){
                                    topic.add(ws);
                                }
                                else{
                                    topic = new Set([ws]);
                                    topicMap.set(payload, topic);
                                }
                            }
                        case 'xtopic':
                            return () =>{
                                if(ws.topic){
                                    let topic = topicMap.get(ws.topic);
                                    topic.size === 1 ? topicMap.delete(ws.topic) : topic.delete(ws);//topic may not registered fastly enough
                                    delete ws.topic;
                                }
                            }
                        case 'upvote':
                            return ()=>{
                                topics.updateOne({_id: ObjectId(payload)}, {
                                $addToSet: {UpVotes: ws.owner}
                                }, (err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'topicbar',
                                            _id: payload,
                                            payload: {
                                                upvoted: true,
                                                downvoted: false,
                                                user: ws.owner
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                        let msg2 = JSON.stringify({
                                            type: 'topictitle',
                                            _id: payload,
                                            payload: {
                                                UpVote: 1,
                                            }
                                        });
                                        idMap.forEach((sock) =>{
                                            sock.send(msg2)
                                        }) 
                                    }
                                })
                            }
                        case 'unupvote':
                            return () =>{
                                topics.updateOne({_id: ObjectId(payload)}, {
                                    $pull: {UpVotes: ws.owner}
                                }, (err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'topicbar',
                                            _id: payload,
                                            payload: {
                                                upvoted: false,
                                                downvoted: false,
                                                user: ws.owner
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                        let msg2 = JSON.stringify({
                                            type: 'topictitle',
                                            _id: payload,
                                            payload: {
                                                UpVote: -1,
                                            }
                                        });
                                        idMap.forEach((sock) =>{
                                            sock.send(msg2)
                                        })
                                        
                                    }
                                })
                            }
                        case 'toupvote':
                            return ()=>{
                                topics.updateOne({_id: ObjectId(payload)}, {
                                    $push: {UpVotes: ws.owner},
                                    $pull: {DownVotes: ws.owner}
                                }, (err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'topicbar',
                                            _id: payload,
                                            payload: {
                                                upvoted: true,
                                                downvoted: false,
                                                user: ws.owner
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                        let msg2 = JSON.stringify({
                                            type: 'topictitle',
                                            _id: payload,
                                            payload: {
                                                UpVote: 1,
                                                DownVote: -1
                                            }
                                        });
                                        idMap.forEach((sock) =>{
                                            sock.send(msg2)
                                        })
                                    }
                                })
                            }
                        case 'downvote':
                            return ()=>{
                                topics.updateOne({_id: ObjectId(payload)}, {
                                $addToSet: {DownVotes: ws.owner}
                                }, (err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'topicbar',
                                            _id: payload,
                                            payload: {
                                                upvoted: false,
                                                downvoted: true,
                                                user: ws.owner
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                        let msg2 = JSON.stringify({
                                            type: 'topictitle',
                                            _id: payload,
                                            payload: {
                                                DownVote: 1
                                            }
                                        });
                                        idMap.forEach((sock) =>{
                                            sock.send(msg2)
                                        })
                                    }
                                })
                            }
                        case 'undownvote':
                            return () =>{
                                topics.updateOne({_id: ObjectId(payload)}, {
                                    $pull: {DownVotes: ws.owner}
                                }, (err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'topicbar',
                                            _id: payload,
                                            payload: {
                                                upvoted: false,
                                                downvoted: false,
                                                user: ws.owner
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                        let msg2 = JSON.stringify({
                                            type: 'topictitle',
                                            _id: payload,
                                            payload: {
                                                DownVote: -1
                                            }
                                        });
                                        idMap.forEach((sock) =>{
                                            sock.send(msg2)
                                        })
                                    } 
                                })
                            }
                        case 'todownvote':
                            return ()=>{
                                topics.updateOne({_id: ObjectId(payload)}, {
                                    $addToSet: {DownVotes: ws.owner},
                                    $pull: {UpVotes: ws.owner}
                                }, (err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'topicbar',
                                            _id: payload,
                                            payload: {
                                                upvoted: false,
                                                downvoted: true,
                                                user: ws.owner
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                        let msg2 = JSON.stringify({
                                            type: 'topictitle',
                                            _id: payload,
                                            payload: {
                                                DownVote: 1,
                                                UpVote: -1
                                            }
                                        });
                                        idMap.forEach((sock) =>{
                                            sock.send(msg2)
                                        })
                                    }
                                })
                            }
                        case 'comment':
                            return ()=>{
                                let {topicId, content} = payload;
                                let newComment = {
                                    _id: ObjectId(),
                                    Content: content,
                                    PostTime: Date.now(),
                                    PostedBy: ws.owner,
                                    UpVotes: [],
                                    DownVotes: [],
                                    Replies: []
                                }
                                topics.updateOne(
                                    {_id: ObjectId(topicId)},
                                    {
                                        $push: {Comments: newComment},
                                        $inc: {Comment: 1}
                                    },
                                    {upsert: false}
                                ,(err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'comment',
                                            _id: topicId,
                                            payload: newComment
                                        })
                                        topicMap.get(topicId).forEach(sock =>{
                                            sock.send(msg1)
                                        })
                                        let msg2 = JSON.stringify({
                                            type: 'topictitle',
                                            _id: topicId,
                                            payload: {
                                                Comment: 1,
                                            }
                                        })
                                        idMap.forEach((sock) =>{
                                            sock.send(msg2);
                                        })
                                    }
                                })
                            }
                        case 'c_up':
                            return ()=>{
                                topics.updateOne({_id: ObjectId(payload.topicId), 'Comments._id': ObjectId(payload.commentId)},
                                {$addToSet: {'Comments.$.UpVotes': ws.owner}},(err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'cmtbar',
                                            _id: payload.commentId,
                                            payload: {
                                                user: ws.owner,
                                                upvoted: true,
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                    }
                                })
                            }
                        case 'c_toup':
                            return ()=>{
                                topics.updateOne({_id: ObjectId(payload.topicId), 'Comments._id': ObjectId(payload.commentId)},{
                                $addToSet: {'Comments.$.UpVotes': ws.owner},
                                $pull: {'Comments.$.DownVotes': ws.owner},
                                }, (err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'cmtbar',
                                            _id: payload.commentId,
                                            payload: {
                                                user: ws.owner,
                                                upvoted: true,
                                                downvoted: false
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                    }
                                })
                            }
                        case 'c_unup':
                            return ()=>{
                                topics.updateOne({_id: ObjectId(payload.topicId), 'Comments._id': ObjectId(payload.commentId)},
                                {$pull: {'Comments.$.UpVotes': ws.owner}}, (err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'cmtbar',
                                            _id: payload.commentId,
                                            payload: {
                                                user: ws.owner,
                                                upvoted: false
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                    }
                                })
                            }
                        case 'c_down':
                            return ()=>{
                                topics.updateOne({_id: ObjectId(payload.topicId), 'Comments._id': ObjectId(payload.commentId)},
                                {$addToSet: {'Comments.$.DownVotes': ws.owner}}, (err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'cmtbar',
                                            _id: payload.commentId,
                                            payload: {
                                                user: ws.owner,
                                                downvoted: true
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                    }
                                })
                            }
                        case 'c_todown':
                            return ()=>{
                                topics.updateOne({_id: ObjectId(payload.topicId), 'Comments._id': ObjectId(payload.commentId)},{
                                $addToSet: {'Comments.$.DownVotes': ws.owner},
                                $pull: {'Comments.$.UpVotes': ws.owner}
                                }, (err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'cmtbar',
                                            _id: payload.commentId,
                                            payload: {
                                                user: ws.owner,
                                                downvoted: true,
                                                upvoted: false
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                    }
                                })
                            }
                        case 'c_undown':
                            return ()=>{
                                topics.updateOne({_id: ObjectId(payload.topicId), 'Comments._id': ObjectId(payload.commentId)},{
                                $pull: {'Comments.$.Downvotes': ws.owner}
                                }, (err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'cmtbar',
                                            _id: payload.commentId,
                                            payload: {
                                                user: ws.owner,
                                                downvoted: false,
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                    }
                                })
                            }
                        case 'reply':
                            return () =>{
                                let {commentId, topicId, content} = payload;
                                let newRep = {
                                    _id: ObjectId(),
                                    Content: content,
                                    PostTime: Date.now(),
                                    PostedBy: ws.owner,
                                    UpVotes: [],
                                    DownVotes: []
                                }
                                topics.updateOne({_id: ObjectId(topicId), 'Comments._id': ObjectId(commentId)},{
                                    $push: {'Comments.$.Replies': newRep},
                                    $inc: {'Comment': 1}
                                }, (err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'reply',
                                            _id: commentId,
                                            payload: newRep
                                        })
                                        topicMap.get(topicId).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                        let msg2 = JSON.stringify({
                                            type: 'topictitle',
                                            _id: topicId,
                                            payload: {
                                                Comment: 1
                                            }
                                        })
                                        idMap.forEach(sock =>{
                                            sock.send(msg2);
                                        })
                                    }
                                })
                            }
                        case 'r_up':
                            return ()=>{
                                let {topicId, commentId, replyId} = payload;
                                topics.updateOne({_id: ObjectId(topicId), 'Comments._id': ObjectId(commentId)},
                                {$addToSet: {'Comments.$.Replies.$[elem].UpVotes': ws.owner}},
                                {arrayFilters: [{'elem._id': ObjectId(replyId)}]}
                                ,(err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'repbar',
                                            _id: replyId,
                                            payload: {
                                                cmtId: commentId,
                                                user: ws.owner,
                                                upvoted: true,
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                    }
                                })
                            }
                        case 'r_toup':
                            return ()=>{
                                let {topicId, commentId, replyId} = payload;
                                topics.updateOne({_id: ObjectId(topicId), 'Comments._id': ObjectId(commentId)},
                                {
                                    $addToSet: {'Comments.$.Replies.$[elem].UpVotes': ws.owner},
                                    $pull: {'Comments.$.Replies.$[elem].DownVotes': ws.owner}
                                },
                                {arrayFilters: [{'elem._id': ObjectId(replyId)}]}
                                ,(err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'repbar',
                                            _id: replyId,
                                            payload: {
                                                cmtId: commentId,
                                                user: ws.owner,
                                                upvoted: true,
                                                downvoted: false
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                    }
                                })
                            }
                        case 'r_unup':
                            return ()=>{
                                let {topicId, commentId, replyId} = payload;
                                topics.updateOne({_id: ObjectId(topicId), 'Comments._id': ObjectId(commentId)},
                                {
                                    $pull: {'Comments.$.Replies.$[elem].UpVotes': ws.owner}
                                },
                                {arrayFilters: [{'elem._id': ObjectId(replyId)}]}
                                ,(err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'repbar',
                                            _id: replyId,
                                            payload: {
                                                cmtId: commentId,
                                                user: ws.owner,
                                                upvoted: false
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                    }
                                })
                            } 
                        case 'r_down':
                            return ()=>{
                                let {topicId, commentId, replyId} = payload;
                                topics.updateOne({_id: ObjectId(topicId), 'Comments._id': ObjectId(commentId)},
                                {
                                    $addToSet: {'Comments.$.Replies.$[elem].DownVotes': ws.owner}
                                },
                                {arrayFilters: [{'elem._id': ObjectId(replyId)}]}
                                ,(err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'repbar',
                                            _id: replyId,
                                            payload: {
                                                cmtId: commentId,
                                                user: ws.owner,
                                                downvoted: true
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                    }
                                })
                            }   
                        case 'r_todown':
                            return ()=>{
                                let {topicId, commentId, replyId} = payload;
                                topics.updateOne({_id: ObjectId(topicId), 'Comments._id': ObjectId(commentId)},
                                {
                                    $addToSet: {'Comments.$.Replies.$[elem].DownVotes': ws.owner},
                                    $pull: {'Comments.$.Replies.$[elem].UpVotes': ws.owner}
                                },
                                {arrayFilters: [{'elem._id': ObjectId(replyId)}]}
                                ,(err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'repbar',
                                            _id: replyId,
                                            payload: {
                                                cmtId: commentId,
                                                user: ws.owner,
                                                downvoted: true,
                                                upvoted: false
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                    }
                                })
                            }
                        case 'r_undown':
                            return ()=>{
                                let {topicId, commentId, replyId} = payload;
                                topics.updateOne({_id: ObjectId(topicId), 'Comments._id': ObjectId(commentId)},
                                {
                                    $pull: {'Comments.$.Replies.$[elem].DownVotes': ws.owner}
                                },
                                {arrayFilters: [{'elem._id': ObjectId(replyId)}]}
                                ,(err) =>{
                                    if(!err){
                                        let msg1 = JSON.stringify({
                                            type: 'repbar',
                                            _id: replyId,
                                            payload: {
                                                cmtId: commentId,
                                                user: ws.owner,
                                                downvoted: false,
                                            }
                                        });
                                        topicMap.get(ws.topic).forEach((sock) =>{
                                            sock.send(msg1)
                                        });
                                    }
                                })
                            }                                                  
                        default:
                            return ()=>{
    
                            }
                    }
                }
                catch{
                    ws.send(JSON.stringify({type: 'err'}))
                }
            })()()

            if(Date.now() >= ws.expires){
                return ws.close(4000, 'session terminated')
            }
        })
    
    })
}
