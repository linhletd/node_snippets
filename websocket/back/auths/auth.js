const passport = require('passport');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config({path: '../../.env'});
const LocalStrategy = require('passport-local').Strategy;
const FbStrategy = require('passport-facebook').Strategy;
const GithubStrategy = require('passport-github').Strategy;

module.exports = function(app){
    let client = app.client;
    let db = client.db(process.env.MG_DB_NAME)
    passport.serializeUser((user, done) =>{
        return done(null,user)
      })
    passport.deserializeUser((user, done) =>{
    return done(null, user)
    })
      
    const sessionParser = require('./session')(client);
    app.use(sessionParser);
    app.use(passport.initialize());
    app.use(passport.session());

    const local = new LocalStrategy({
        usernameField: 'login_email',
        passwordField: 'login_password'
    },(Email, password, done)=>{
        // console.log(done)
        db.collection('users').findOne({Email},(err, user) =>{
            if(err){
                return done(err);
            }
            else if(user){
                if(!user.Password){
                    return done(null, false, 'incorrect password');
                }
                return  bcrypt.compare(password, user.Password,(err, ok) =>{
                    if(err){
                        return done(err);
                    }
                    else if(!ok){
                        return done(null, false, 'incorrect password');
                    }
                    let _id = user._id;
                    delete user._id;
                    user.LastLogin = Date.now();
                    user.LoginCount += 1;
                    db.collection('users').updateOne({_id},{$set: user});
                    done(null, {_id, Username: user.Username, Email: user.Email, Avartar: user.Avartar});
                })
            }
           return done(null, false, 'not registered');
        })
    });
    const fb = new FbStrategy({
        clientID: process.env.FB_CLIENT_ID,
        clientSecret: process.env.FB_CLIENT_SECRET,
        callbackURL: process.env.HOST +'/auth/fb/callback',
        profileFields: ['id', 'emails', 'name', 'picture']
        
    },(accessToken, refreshToken, {_json}, done)=>{
        let profile = _json;
        console.log( profile.picture);
        let Email = profile.email
            Username = profile.first_name,
            FacebookID = profile.id,
            Avartar = profile.picture.data.url;
        db.collection('users').findOne({Email},(err, user) =>{
            if(err){
                return done(err)
            }
            else if(user){
                user.LastLogin = Date.now();
                user.LoginCount += 1;
                user.FacebookID = FacebookID;
                user.Avartar = Avartar;
                let _id = user._id;
                delete user._id;
                db.collection('users').updateOne({_id},{$set: user});
                return done(null,{_id, Username: user.Username, Email: user.Email, Avartar: user.Avartar})

            }
            else {
                user = {
                    Username, 
                    Email, 
                    FacebookID, 
                    Avartar: Avartar,
                    StartJoining: Date.now(),
                    LastLogin: Date.now(),
                    LoginCount: 1
                };
                db.collection('users').insertOne(user,(err, doc) =>{
                    if(err){
                        return done(err)
                    }
                    done(null, {_id: doc.insertedId.toString(), Username: user.Username, Email: user.Email, Avartar: user.Avartar})
                });
            }
        })
    });
    const github = new GithubStrategy({
        clientID: process.env.GH_CLIENT_ID,
        clientSecret: process.env.GH_CLIENT_SECRET,
        callbackURL: process.env.HOST + '/auth/github/callback',
        scope: 'user:email'
    },(accessToken, refreshToken, profile, done) =>{
        let Email = profile.emails[0].value,
            Username = profile.username,
            GithubID = profile.id,
            Avartar = profile.photos[0].value;
        db.collection('users').findOne({Email},(err, user) =>{
            if(err){
                return done(err)
            }
            else if(user){
                user.LastLogin = Date.now();
                user.LoginCount += 1;
                user.GithubID = GithubID;
                user.Avartar = Avartar;
                // console.log(user);
                let _id = user._id;
                delete user._id;
                db.collection('users').updateOne({_id},{$set: user});
                return done(null, {_id, Username: user.Username, Email: user.Email, Avartar: user.Avartar})
            }
            else {
                user = {
                    Username,
                    Email,
                    GithubID,
                    Avartar,
                    StartJoining: Date.now(),
                    LastLogin: Date.now(),
                    LoginCount: 1
                };
                db.collection('users').insertOne(user,(err, doc) =>{
                    if(err){
                        return done(err)
                    }
                    done(null, {_id: doc.insertedId, Username: user.Username, Email: user.Email, Avartar: user.Avartar})
                });
            }
        })

        
    })
    passport.use(local);
    passport.use(fb);
    passport.use(github);
    return passport;
}