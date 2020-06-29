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
    let apiObject = {
        createTopic: function(req, res, next){
            let Author = req.user;
            let Question = encodeHTML(req.body.question);
            let PostTime = Date.now();
            Author._id = ObjectId(Author._id);
            let newTopic = {
                Question,
                AttachImage: null,
                Author,
                PostTime,
                Comments: [],
                UpVote: 0,
                DownVote: 0
            }
            topics.insertOne(newTopic,(err, doc) =>{
                if(err) return res.json({err: err.message});
                let message = {
                    type: 'update board',
                    payload:{
                        _id: doc.insertedId,
                        Question,
                        PostTime,
                        Author,
                        Upvote: 0,
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
            let cursor = topics.aggregate([
                {
                    $addFields: {
                        Comment: {$size: "$Comments"}
                    }
                },
                {
                    $project: {
                        Comments: 0,
                        AttachImage: 0
                    },
                },
                {
                    $sort: {
                        PostTime: -1,
                    }
                }
            ]);
            cursor.on('error',(err) =>{
                return res.json({err: err.message})
            })
            let checked = false;
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
            let _id = new ObjectId(req.params.topic_id);
            topics.findOne({_id}, (err, topic) =>{
                if(err) return res.json({err: err.message});
                res.json(topic)
            })

        },
        postComment: function(req, res, next){
            let newComment = {
                _id: ObjectId(),
                Content: encodeHTML(req.body.comment),
                PostTime: Date.now(),
                PostBy: req.user,
                UpVote: 0,
                DownVote: 0,
                replies: []
            }
            let topicId = new ObjectId(req.body.id);
            topics.updateOne(
                {_id: topicId},
                {$push: {Comments: newComment}},
                {upsert: false}
            ,(err, doc) =>{
                if(err) return res.json({err: err.message});
                else if(doc.modifiedCount !== 0){
                    newComment.tid = req.body.id;
                    let message = {
                        type: 'update comment',
                        payload: newComment
                    }
                    app.idMap.forEach((socket) =>{
                        socket.send(JSON.stringify(message));
                    })
                }
                res.json({})
            })
        },
        getUserSignal: function(req, res, next){
            let cursor = users.find({})
            .project({
                Username: 1,
                Avartar: 1,
            })
            cursor.on('error',(err) =>{
                return res.json({err: err.message})
            })
            let checked = false;
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
        }

    }
    return apiObject
}