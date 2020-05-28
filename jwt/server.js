let express = require('express');
let jwt = require('jwt-simple');
let bodyParser = require('body-parser');
let dotenv = require('dotenv').config({path: '../.env'});
let {encrypt, decrypt} = require('./cryptoo.js');
let MongoClient = require('mongodb').MongoClient;
let passport = require('passport');
let {Strategy:JwtStrategy, ExtractJwt} = require('passport-jwt');

let dbConnect = new Promise((resolve, reject) => {
    MongoClient.connect(process.env.MGDB,{ useUnifiedTopology: true }, (err, client) => {
        if(err){
            reject(err);
            console.log('unable to connect mongo database');
        }
        else {
            resolve(client.db(process.env.MG_DB_NAME));
            console.log('database connected')
        }
    })
})
let secret = process.env.JWT_SECRET;

let app = express();
let opts = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: secret,
    ignoreExpiration: true,
    passReqToCallback: false,
    audience: 'http://localhost'
};
passport.use(new JwtStrategy(opts, (payload, done) =>{
    try {
        let user = JSON.parse(decrypt(payload.sessionData));
        return done(null,user);
    }
    catch(e){
        return done(null, false)
    }
}))

app.use(bodyParser.urlencoded({extended: true}))
app.use(passport.initialize())
app.post('/authenticate',async(req, res) =>{
    let db = await dbConnect;
    if(!db){
        return res.json({err:'unable to connect to database'});
    }
    let usersCollection = db.collection('users');
    let username = req.body.username;
    let password = req.body.password;
    if(!username || !password){
        return res.json({err:'invalid credential'})
    }
    usersCollection.findOne({username, password},{username:1},(err, doc) => {
        if(err) throw err;
        else if(doc){
            let sessionData = encrypt(JSON.stringify({username: doc.username, admin: true}))
            let payload = {
                iss: "http://localhost",
                aud: ["http://localhost"],
                sub: "localhost",//should never assign again
                iat: + new Date(),
                exp: Date.now() + 100000,
                sessionData
            }
            let refresh = jwt.encode(Object.assign({typ: 'refresh',exp: payload.exp +3*3600*1000},payload),secret);
            let token = jwt.encode(payload, secret);
            return res.json({data:{token, refresh}})
        }
        return res.json({err:'invalid credential'})
    })
})
app.get('/userstory/hobby', async (req, res) => {
    let token = req.headers['authorization'].replace('Bearer ','')
    try {
        var data = jwt.decode(token,secret, false);
        data.sessionData = JSON.parse(decrypt(data.sessionData));//to do somthing with
        if(data.exp > + new Date()){
            let db = await dbConnect;
            db.collection('users').findOne({username: data.sessionData.username},(err,{username, hobby}) =>{
                if(err){
                   return res.json({err: err.message})
                }
                return res.json({username, hobby})
            })
        }
        else{
            return res.json({err: 'token expired'})
        }
    }
    catch(e){
        console.log(e)
        return res.json({err: 'invalid token'})
    }
})
app.get('/userstory/hobbi',passport.authenticate('jwt',{session: false}),async (req, res) =>{
    console.log(req)
    let db = await dbConnect;
    db.collection('users').findOne({username: 'linh'},(err,{username, hobby}) =>{
        if(err){
           return res.json({err: err.message})
        }
        return res.json({username, hobby})
    })
})
app.post('/refresh_token',(req, res)=>{
    let refreshToken = req.body.refreshToken;
    if(!refreshToken){
        return res.json({err: 'invalid refresh token'})
    }
    try {
        var data = jwt.decode(refreshToken,secret, false);
        let sessionData = JSON.parse(decrypt(data.sessionData));//to do something with
        console.log(data.exp > + new Date(),data.typ === 'refresh' )
        if(data.exp > + new Date() && data.typ === 'refresh'){
            delete data.refresh;
            data.iat = + new Date();
            data.exp = Date.now() + 100000;
            let token = jwt.encode(data, secret);
            return res.json({token})
        }
        else{
            return res.json({err: 'refresh token expired, please login again'})
        }
    }
    catch(e){
        console.log(e)
        return res.json({err: 'invalid token'})
    }
})
app.get('/script',(req, res) => {
    res.sendFile(__dirname +'/bundle.js')
})
app.use((req, res) =>{
    res.sendFile(__dirname+'/index.html')
})
app.listen(8080,()=>{console.log('listening')});