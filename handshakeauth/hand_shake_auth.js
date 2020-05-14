const express = require('express');
const crypto = require('crypto');
const mysql = require('mysql');
const bodyParser = require('body-parser')
const dotenv = require('dotenv').config({path: '../.env'});
const bcrypt = require('bcrypt')

conn = mysql.createConnection({
    database: process.env.SQL_DB1,
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD

})
let dbPromise = new Promise((resolve, reject) => {
    conn.connect((err) =>{
        if (err) {
            console.log('unable to connect db')
            reject(err);
        }
        else {
            resolve(conn);
            // conn.query(`CREATE TABLE Users1(
            //     Username VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
            //     Password VARCHAR(50),
            //     Challenge CHAR(64)
            //   )`,(err, result) =>{
            //     if (err) throw err;
            //     console.log('table users1 created')
            //   })
        }
    })
}).catch((err) => {
    console.log(err)
})
let app = express();
app.use((req, res, next) =>{
    console.log(req.url, req.method);
    next()
})
app.use(bodyParser.urlencoded({extended:true}));
app.get('/script',(req, res) =>{
    res.sendFile(__dirname+"/script.js")
})
app.get('/sha256',(req, res) =>{
    res.sendFile(__dirname+'/sha256.js')
})
app.get('/login',(req, res) => {
    res.sendFile(__dirname + '/index.html');   
}).post('/login',async (req, res) =>{
    let db = await dbPromise;
    db.query(`SELECT Username, Challenge FROM users1 WHERE Username = ${db.escape(req.body.username)}`,(err, result) =>{
        if(result.length && result[0].Challenge !== null && result[0].Challenge === req.body.hash){
            res.send('Successful')
        }
        else{
            res.send('Failed')
        }
    })
})
app.post('/check',async (req, res) =>{
    let db = await dbPromise;
    db.query(`SELECT Username, Password FROM users1 WHERE Username = ${db.escape(req.body.username)}`,(err, result) =>{
        if (result.length){
            let randomKey = Math.random();
            let hash = crypto.createHash('sha256').update(randomKey.toString() + result[0].Password).digest('hex');
            db.query(`UPDATE users1 SET Challenge = "${hash}" WHERE Username = "${result[0].Username}"`,(err, result) =>{
                res.send(randomKey.toString())
            });
        }
        else{
            res.end('no user')
        }
    })
})
//below api for creating testing account
app.post('/register',async (req, res) =>{
    db = await dbPromise;
    db.query(`SELECT Username FROM users1 WHERE Username = ${db.escape(req.body.username)}`,(err, result) =>{
        if(err) throw err
        if(result.length){
            res.end(`username ${req.body.username} already exists, try other name`);
        }
        else {
            db.query(`INSERT INTO users1 VALUES (?)`, [[req.body.username, req.body.password, null]],(err, result) =>{
                res.writeHead(200,{'Content-Type': 'text/html'})
                res.end('account created')
            })
        }
    })
})
app.listen(8000,()=>{
    console.log('listening on port 8000')
})