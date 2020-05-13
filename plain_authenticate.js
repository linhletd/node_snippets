const mysql = require('mysql');
const dotenv = require('dotenv').config();
const http = require('http');
const bcrypt = require('bcrypt');
const qs = require('querystring');
const crypto = require('crypto');

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

            //     conn.query(`CREATE TABLE Users(
            //       UserName VARCHAR(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
            //       Password VARCHAR(50)
            //     )`,(err, result) =>{
            //       if (err) throw err;
            //       console.log('table users created')
            //     })
        }
    })
})

http.createServer(async (req, res) =>{
    console.log(req.url,req.method)
    let db = await dbPromise;
    if(req.url === '/register' && req.method.toLowerCase() === 'get'){
        res.writeHead(200, {"Content-Type": "text/html"})
        return res.end(`<form action = "/register" method = "post">Register <br/>
                    Username: <input type = "text" name = "username"> <br/>
                    Password: <input type = "password" name = "password"> <br/>
                    <input type = "submit" value = "submit"> <br/>
                 </form>
        `)
    }
    else if(req.url === '/register' && req.method.toLowerCase() === 'post'){
        let body = "";
        req.on('data', (chunk) =>{
            chunk && (body += chunk);
        })
        req.on('end',() =>{
            let formData = qs.parse(body);
            console.log(body,formData)
            db.query(`SELECT UserName FROM users WHERE Username = ${db.escape(formData.username)}`,(err, result) =>{
                console.log(result)
                if(result.length){
                    res.end(`username ${formData.username} already exists, try other name`);
                }
                else {
                    bcrypt.hash(formData.password, 10)
                    .then((encryptedPW) => {
                        let sessionCookie = crypto.createHash('md5').update(formData.username).digest('hex');
                        db.query(`INSERT INTO users VALUES (?)`, [[formData.username, encryptedPW, sessionCookie]],(err, result) =>{
                            console.log(err,result)
                            res.end('account created')
                        })
                    })
                }
            })
        })

    }
    else if(req.url === '/login' && req.method.toLowerCase() === 'get'){
        res.writeHead(200, {"Content-Type": "text/html"})
        res.end(`
        <form action = "/login" method = "post">Login <br/>
        Username: <input type = "text" name = "username" required /> <br/>
        Password: <input type = "password" name = "password" required/> <br/>
        <input type = "submit" value = "Submit"/>
        </form>
        `)
    }
    else if(req.url === '/login' && req.method.toLowerCase() === 'post'){
        let body = "";
        req.on('data', (chunk) =>{
            chunk && (body += chunk);
        });
        req.on('end', ()=>{
        let formData = qs.parse(body);
        db.query(`SELECT Username, Password, SessionCookie FROM users WHERE Username = ${db.escape(formData.username)}`,(err, result)=>{
            if(result.length){
                bcrypt.compare(formData.password, result[0]['Password'])
                .then((bool) =>{
                    if(bool){
                        res.writeHead(200,{'Set-Cookie': `session=${result[0].SessionCookie}; samesite=lax`})
                        res.end('login successfully')
                    }
                    else{
                        res.end('wrong password')
                    }
                })
            }
            else {
                res.end('username does not exists')
            }
        })
        
        
        })
    }
    else{
        res.writeHead(200, {"Content-Type": "text/html"});
        res.end(`
        <a href = "/login">Login</a> <br/>
        <a href = "/register">Sign up</a>
        `)
    }
}).listen(8000)