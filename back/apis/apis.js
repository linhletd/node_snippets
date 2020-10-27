const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config({path: '../../../.env'});
const sendEmail = require('../utils/send_email');
const {generateToken, getPayloadFromToken} = require('../utils/generate_token');
const ObjectId = require('mongodb').ObjectId;
function encodeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
module.exports = function(app){
    let client = app.client;
    let db = process.env.MG_DB_NAME
    let topics = client.db(db).collection('topics');
    let users = client.db(db).collection('users');
    // let addOnOffStatus = (user) =>{
    //     app.ownerMap.get(user._id.toString()) ? user.isOnline = true : user.isOnline = false;
    // }
    let apiObject = {
        createTopic: function(req, res, next){
            let Title = req.body.title,
                Category = req.body.category,
                Content = req.body.content,
                Author = ObjectId(req.user._id),
                PostTime = Date.now();
            let newTopic = {
                Title,
                Category,
                Content,
                Author,
                PostTime,
                UpVotes: [],
                DownVotes: [],
                Comments: [],
                Comment: 0
            }
            topics.insertOne(newTopic,(err, doc) =>{
                if(err) return res.json({err: err.message});
                let message = {
                    type: 'update board',
                    payload:{
                        _id: doc.insertedId,
                        Title,
                        Category,
                        PostTime,
                        Author,
                        UpVote: 0,
                        DownVote: 0,
                        Comment: 0
                    }
                }
                app.idMap.forEach((socket) =>{
                    socket.send(JSON.stringify(message));
                });
                return res.json(newTopic)
            })
        },
        getTopicTitle: function(req, res, next){
            let socketId = req.query.s;
            if(socketId){
                let discuss = app.discussSet;
                discuss.add(app.idMap.get(socketId));
            }
            let cursor = topics.aggregate([
                {
                    $project: {Comments: 0}
                },
                {
                    $addFields: {
                        UpVote: {$size: '$UpVotes'},
                        DownVote: {$size: '$DownVotes'},
                    }
                },
                {
                    $project: {
                        UpVotes: 0,
                        DownVotes: 0,
                    },
                },
                {
                    $sort: {
                        PostTime: -1,
                    }
                }
            ]);
            let checked = false;
            cursor.on('error',(err) =>{
                console.log(err)
                if(checked){
                    return res.end(`],"err": ${err.message}}`)
                }
                res.json({err: err.message})
            })
            cursor.on('data',(doc) =>{
                if(!checked){
                    res.write('{"data": [');
                    res.write(JSON.stringify(doc))
                    checked = true;
                }
                else if(checked){
                    res.write(',' + JSON.stringify(doc))
                }
            });
            cursor.on('end',()=>{
                res.end(']}');
            })
        },
        getTopicContentById: function(req, res, next){
            let _id = req.params.topic_id;
            let socketId = req.query.s;
            let topicMap = app.topicMap;
            if(socketId){
                let ws = app.idMap.get(socketId);
                if(ws.topic){
                    let s = app.topicMap.get(ws.topic);
                    if(s.size === 1){
                        app.topicMap.delete(ws.topic);
                    }
                    else{
                        s.delete(ws);
                    }
                }
                ws.topic = _id;
                let topic;
                if((topic = topicMap.get(_id))){
                    topic.add(ws);
                }
                else{
                    topic = new Set([ws]);
                    topicMap.set(_id, topic);
                }
            }
            topics.findOne({_id: ObjectId(_id)}, (err, topic) =>{
                if(err) return res.json({err: err.message});
                res.json(topic);
            })

        },
        getUserSignal: function(req, res, next){
            let cursor = users.find({})
            .project({
                Username: 1,
                Avartar: 1,
                LastActive: 1
            })
            let checked = false;
            cursor.on('error',(err) =>{
                if(checked){
                    return res.end(`],"err": ${err.message}}`)
                }
                res.json({err: err.message})
            })
            cursor.on('data',(doc) =>{
                app.ownerMap.get(doc._id.toString()) ? doc.isOnline = true : doc.isOnline = false;
                if(!checked){
                    res.write('{"data": [');
                    res.write(JSON.stringify(doc))
                    checked = true;
                }
                else if(checked){
                    res.write(',' + JSON.stringify(doc))
                }
            });
            cursor.on('end',()=>{
                res.end(']}');
            })
        },

        logout: function(req, res, next){
            req.session.destroy((err) => {
                //
            });
            res.clearCookie('InVzZXIi');
            res.clearCookie('connect.sid');
            res.json({result: 'ok'})
        },
        feedback: (req, res, next) =>{
            let {feedback} = req.body;
            let feedbacks = client.db(db).collection('feedbacks');
            let newFb = {
                Content: feedback,
                PostTime: new Date(),
                user: req.user ? req.user._id : null
            }
            feedbacks.insertOne(newFb,(err) =>{
                if(!err){
                    res.send('Thank you!');
                }
                else{
                    res.send('Error occured')
                }
            })
        }
    }
    return apiObject
}