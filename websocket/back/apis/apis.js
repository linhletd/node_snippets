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
            console.log(req.body)
            let author = req.user;
            let question = encodeHTML(req.body.question);
            let post_time = Date.now();
            author._id = ObjectId(author.id);
            delete author.id;
            let newTopic = {
                Question: question,
                AttachImage: null,
                Author: author,
                PostTime: post_time,
                Comments: []
            }
            topics.insertOne(newTopic,(err, doc) =>{
                if(err) return res.json({err: err.message});
                newTopic.id = doc.insertedId;
                let message = {
                    type: 'update topic title board',
                    payload:{
                        tid: doc.insertedId,
                        question,
                        post_time,
                        author: req.user
                    }
                }
                app.idMap.forEach((socket) =>{
                    socket.send(JSON.stringify(message));
                })
                return res.json(newTopic)
            })
        },
        getTopicTitle: function(req, res, next){
            let cursor = topics.find({_id},{Question: 1})
                cursor.on('error',(err) =>{
                    return res.json({err: err.message})
                })
                let check = false;
                cursor.on('data',(doc) =>{
                    if(!check){
                        res.writeHead(200, 'Content-Type','application/json');
                        res.write('[');
                        check = true;
                    }
                    res.write(JSON.stringify(doc))
                });
                cursor.on('end',()=>{
                    res.end(']');
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
            console.log(req.url)
            let newComment = Object.assign({
                _id: ObjectId(),
                TimeStamp: Date.now()
            }, {x: encodeHTML(req.body.comment)});
            let topicId = ObjectId(req.body.id)
            topics.updateOne(
                {_id: topicId},
                {$push: {Comments: newComment}},
                {upsert: false}
            ,(err, doc) =>{
                if(err) return res.json({err: err.message});
                else if(doc.modifiedCount !== 0){
                    let message = {
                        type: 'add comment',
                        tid: req.body.id,
                        payload: newComment
                    }
                    app.idMap.forEach((socket) =>{
                        socket.send(JSON.stringify(message));
                    })
                }
                res.end()
            })
        }
    }
    return apiObject
}