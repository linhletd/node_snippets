const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config({path: '../../../.env'});
const assignIcon = require('../utils/avartar_factory');
const sendEmail = require('../utils/send_email');
const {generateToken, getPayloadFromToken} = require('../utils/generate_token');
function encodeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;');
}
module.exports = function(app){
    let client = app.client;
    let auth = require('../auths/auth')(app);
    let db = client.db(process.env.MG_DB_NAME);
    let apis = {
        register: (req, res, next)=>{
            console.log(req.body)
            let Email = req.body.regist_email;
            let users = db.collection('users');
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
                        LastLogin = StartJoining,
                        LoginCount = 1,
                        Avartar = assignIcon(Email),
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
                        LastLogin,
                        LoginCount,
                        Avartar
                    },(err, doc) =>{
                        if(err) return res.json({err: 'error occurs'});
                        let user = {_id: doc.insertedId, Username, Email, Avartar};
                        req.logIn(user,(err) =>{
                            if(err) return res.json({err: 'error occurs'});
                            let obj = JSON.stringify(user);
                            let userCookie = Buffer.from(obj).toString('base64');
                            res.cookie('InVzZXIi', userCookie, {httpOnly: false, sameSite: 'strict'});
                            res.json({
                                result: 'ok',
                                user
                            })
                        })
                    })    
                }
                // sendEmail(Email,'verify').then((info) =>{
                //     console.log(info);
                //     res.redirect(302,'/user/verified');
                // }).catch((err) => next(err))

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
                req.logIn(user,(err) =>{
                    if(err){
                        return next(err);
                    }
                    let obj = JSON.stringify(user);
                    let userCookie = Buffer.from(obj).toString('base64');
                    res.cookie('InVzZXIi', userCookie, {httpOnly: false, sameSite: 'strict'});
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
        verifyToken: (req, res, next) => {
            let payload = getPayloadFromToken(req.params.token);
            if(!payload || payload.iat < Date.now()){
                return res.json({err: 'invalid or expired token'});
            }
            if(payload.type === 'verify_account'){
                //
            }
        },

    };

    return apis
}