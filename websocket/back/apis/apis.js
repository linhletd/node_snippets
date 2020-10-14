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
                Comments: []
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
            let cursor = topics.aggregate([
                {
                    $addFields: {
                        UpVote: {$size: "$UpVotes"},
                        DownVote: {$size: "$DownVotes"},
                        Comment: {$size: "$Comments"}
                    }
                },
                {
                    $project: {
                        UpVotes: 0,
                        DownVotes: 0,
                        Comments: 0
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
            let _id = ObjectId(req.params.topic_id);
            topics.findOne({_id}, (err, topic) =>{
                if(err) return res.json({err: err.message});
                res.json(topic)
            })

        },
        postComment: function(req, res, next){
            let newComment = {
                _id: ObjectId(),
                Comment: req.body.comment,
                CommentTime: Date.now(),
                CommentedBy: req.user._id,
                UpVotes: [],
                DownVotes: [],
                Replies: []
            }
            let topicId = new ObjectId(req.body.id);
            topics.updateOne(
                {_id: topicId},
                {$push: {Comments: newComment}},
                {upsert: false}
            ,(err, doc) =>{
                if(err) return res.json({err: err.message});
                else if(doc.modifiedCount !== 0){
                    newComment.tid = req.body.id;//tid topicid
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
            res.clearCookie('InVzZXIi');
            res.clearCookie('connect.sid');
            res.json({result: 'ok'})
        }

    }
    return apiObject
}