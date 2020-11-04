const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config();
const assignIcon = require('../utils/avatar_factory');
const sendEmail = require('../utils/send_email');
const {getPayloadFromToken} = require('../utils/generate_token');
function encodeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
module.exports = function(app){
    let client = app.client;
    let auth = require('../auths/auth')(app);
    let db = client.db(process.env.MG_DB_NAME);
    let users = db.collection('users');
    let apis = {
        register: (req, res, next)=>{
            let Email = req.body.regist_email;
            users.findOne({Email}, async (err, user) =>{
                if(err){
                    return res.json({err: 'error occurs'});
                }
                else if(user){
                    return res.json({err: 'Already registered'})
                }
                else{
                    let Username = encodeHTML(req.body.regist_name),
                        StartJoining = Date.now(),
                        Avartar = assignIcon(Email),
                        Verified = 0,
                        Password = await bcrypt.hash(req.body.regist_password, 10).catch((err) =>{
                            return err
                        });
                    if(typeof Password == 'object'){
                        let err = Password;
                        return res.json({err: 'error occurs'});
                    }
                    return users.insertOne({
                        Email,
                        Username,
                        Password,
                        StartJoining,
                        LoginCount: 0,
                        Avartar,
                        Verified
                    },(err, doc) =>{
                        if(err) return res.json({err: 'error occurs'});
                        sendEmail({to: Email, name: Username, type: 'verify'})
                        .catch((err) => {console.log(err.message)})
                        .then(() =>{
                            let user = {_id: doc.insertedId, Username, Email, Avartar};
                            res.json({user});
                        })
                        // req.logIn(user,(err) =>{
                        //     if(err) return res.json({err: 'error occurs'});
                        //     let obj = JSON.stringify(user);
                        //     let userCookie = Buffer.from(obj).toString('base64');
                        //     res.cookie('InVzZXIi', userCookie, {httpOnly: false, sameSite: 'strict'});
                        //     res.json({
                        //         result: 'ok',
                        //         user
                        //     })
                        // })
                    })    
                }

            })
        },
        thirdPartyAuth: function(thirdPty){
            return auth.authenticate(thirdPty)
        },
        login: (loginType)=>((req, res, next)=>{
            auth.authenticate(loginType,(err, user, info) =>{
                if(err){
                    return next(err)
                }
                else if(!user){
                    return res.status(401).json({err: info})
                }
                else if(user && user.Verified === 0){
                    return res.json({user})
                }
                req.logIn(user,(err) =>{
                    if(err){
                        return next(err);
                    }
                    let obj = JSON.stringify(user);
                    let userCookie = Buffer.from(obj).toString('base64');
                    res.cookie('InVzZXIi', userCookie, {httpOnly: false, sameSite: 'strict'});
                    if(req.header('Accept') === 'application/json'){
                        return res.json({user})
                    }
                    res.writeHead(200,{'Content-Type': 'text/html'});
                    res.end(`<script>
                                    if(window.BroadcastChannel){
                                        let bc = new BroadcastChannel('bc1');
                                        bc.postMessage('${obj}');
                                        close();
                                    }
                                    else{
                                        window.open('${process.env.HOST}','_self')
                                    }
                                </script>`)
                });
            })(req, res, next)
        }),
        invokeToken: (req, res, next) =>{
            try{
                sendEmail(req.body).catch((err) => {console.log(err.message)});
                return res.json({status: 'ok'})
            }
            catch{
                return res.json({err: 'err'})
            }
        },
        verifyToken: (req, res, next) =>{
            if(!req.query.token) return next();
            let payload = getPayloadFromToken(req.query.token);
            if(!payload){
                return res.json({err: 'invalid or expired token'});
            }
            else{
                switch(payload.type){
                    case 'verify':{
                        users.findOneAndUpdate({Email: payload.sub},
                            {$set: {Verified: 1, LastLogin: Date.now(), LoginCount: 1}},
                            {
                                upsert: false,
                                returnNewDocument: false,
                                projection: {
                                    Username: 1,
                                    Avartar: 1,
                                    _id: 1,
                                    Email: 1,
                                    Verified: 1
                                }
                            },
                            (err, {value: user}) =>{
                            if(user.Verified){
                                return res.redirect('/auth/login');
                            }
                            delete user.Verified;
                            req.logIn(user, (err) =>{
                                if(err) return next(err);
                                let obj = JSON.stringify(user);
                                let userCookie = Buffer.from(obj).toString('base64');
                                res.cookie('InVzZXIi', userCookie, {httpOnly: false, sameSite: 'strict'});
                                res.redirect('/')
                            })
                        })
                    }
                }
            }
        },

    };

    return apis
}