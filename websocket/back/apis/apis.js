const bcrypt = require('bcrypt');
const assignIcon = require('../utils/avartar_factory');
const sendEmail = require('../utils/send_email');
const {generateToken, getPayloadFromToken} = require('../utils/generate_token');
module.exports = function(client, app){
    const auth = require('../auths/auth')(client, app);
    let db = client.db(process.env.MG_DB_NAME);
    let apis = {
        register: (req, res, next)=>{
            let Email = req.body.regist_email;
            let users = db.collection('users');
            users.findOne({Email}, async (err, user) =>{
                if(err){
                    return next(err);
                }
                if(!user){
                    let Username = req.body.regist_name,
                        StartJoining = Date.now(),
                        LastLogin = StartJoining,
                        LoginCount = 1,
                        Avartar = assignIcon(Email)
                        Password = await bcrypt.hash(req.body.regist_password, 10).catch((err) =>{
                            return err
                        });
                        if(typeof Password == 'object'){
                            let err = Password;
                            return next(err);
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
                        if(err) return next(err);
                        req.logIn({id: doc.insertedId, username: Username, email: Email, avartar: Avartar},(err) =>{
                            if(err) return next(err);
                            return res.redirect(302, '/user')
                        })
                    })    
                }
                sendEmail(Email,'verify').then((info) =>{
                    console.log(info);
                    res.redirect(302,'/user/verified');
                }).catch((err) => next(err))

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
                    req.session.ws = []; //create array for socket id
                    res.status(200).json(user)
                });
            })
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
        disscus: (req, res, next) => {

        }
    };

    return apis
}