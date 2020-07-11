
const dotenv = require('dotenv').config({path: '/.env'});
const {MongoClient, ObjectId} = require('mongodb');
// const dbConnect = new Promise((resolve, reject) => {
//   MongoClient.connect('mongodb+srv://linh:linh@cluster0-derva.mongodb.net/',{ useUnifiedTopology: true }, (err, client) => {
//       if(err){
//           reject(err);
//       }
//       else {
//           resolve(client);
//       }
//   })
// });
// dbConnect.then((client) => {
//     console.log('database connected');
//     /************** clear previous redundants *********************/
//     let db = client.db(process.env.MG_DB_NAME);
//     let users = db.collection('users');
//     let sessions = db.collection('sessions');
//     let topics = db.collection('topics');
//     let _id = new ObjectId('5eedec31faae71095065d9f1');
//     console.log(_id)
//     let newComment = {comment:'x'}
//     topics.findOne({_id},(err, doc) =>{
//         console.log(err,doc);
//     })
//     /**********************************************/

//     // topics.updateOne(
//     //     {_id},
//     //     {$push: {Comments: newComment}},
//     //     {upsert: false}
//     // ,(err, doc) =>{
//     //    console.log(err, doc)
//     // })
   
// }).catch((err) => {
//     console.log('cannot connect to database: ', err)
// })
let _id = new ObjectId('5eedec31faae71095065d9f1');
console.log(JSON.stringify(_id))