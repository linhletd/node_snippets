const passport = require('passport');
const bcrypt = require('bcrypt');
const LocalStrategy = require('passport-local').Strategy;
const FbStrategy = require('passport-facebook').Strategy;
const GithubStrategy = require('passport-github').Strategy;
const dotenv = require('dotenv').config();


module.exports = function(client, app){
    let db = client.db(process.env.MG_BD_NAME)
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
        usernameField: 'login-email',
        passwordField: 'login-password'
    },(Email, password, done)=>{
        console.log(done)
        db.collection('users').findOne({Email},(err, user) =>{
            if(err){
                return done(err);
            }
            else if(user && user.Password){
               return  bcrypt.compare(password, user.Password,(err, ok) =>{
                    if(err){
                        return done(err);
                    }
                    else if(!ok){
                        return done(null, false, 'incorrect password');
                    }
                    user.LastLogin = Date.now();
                    user.LoginCount += 1;
                    db.collection('users').save(user);
                    done(null, {email: user.Email, id: user._id, username: user.Username, avartar: user.Avartar});
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
        
    },(accessToken, refreshToken, profile, done)=>{
        console.log(accessToken, refreshToken, profile);
        let Email = profile.emails[0].value,
            Username = profile.name,
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
                db.collection('users').save(user);
                return done(null,{id: user._id, username: user.username, email: user.Email, avartar: user.Avartar})

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
                    done(null, {id: doc.insertedId, username: user.Username, email: user.Email, avartar: user.Avartar})
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
                db.collection('users').save(user);
                return done(null, {id: user._id, username: user.Username, email: user.Email, avartar: user.Avartar})
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
                    done(null, {id: doc.insertedId, username: user.Username, email: user.Email, avartar: user.Avartar})
                });
            }
        })

        
    })
    passport.use(local);
    passport.use(fb);
    passport.use(github);
    return passport;
}