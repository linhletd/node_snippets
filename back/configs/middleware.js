const uuid = require('uuid');
class CustomMiddleware{
    constructor(app){
        this.app = app;
        this.ensureAuthenticated = this.ensureAuthenticated.bind(this);
        this.ensureSQLConnected = this.ensureSQLConnected.bind(this);
    }
    ensureAuthenticated(req, res, next){
        let sockets = this.app.sessionMap.get(req.sessionID);
        if(req.user){
            sockets ? sockets.forEach(sock => {
                sock.expires = Date.now() + 14*24*3600*1000;
            }) : "";
            return next()
        }
        sockets ? (sockets.forEach(cur =>{
            cur.close(4000, 'session terminated')
        })) : "";
        if(/^\/auth/.test(req.url)){
            return next();
        }
        res.clearCookie('InVzZXIi');
        res.clearCookie('connect.sid');
        let intent = Buffer.from(req.url).toString('base64');
            res.cookie('aW50ZW50VVJM', intent, {httpOnly: false, sameSite: 'strict', maxAge: 10000});
        return res.redirect('/auth/login');
    }
    ensureSQLConnected(req, res, next){
        if(this.app.conn){
            return next();
        }
        else{
            return res.json({err: 'Cannot connect to sql database'});
        }
    }
    setInitialCookie(req, res, next){
        res.cookie('init', uuid.v4(), {httpOnly: true, sameSite: 'strict', signed: true});
        next();
    }
    ensureHavingInitCookie(req, res, next){
        if(req.signedCookies.init){
            return next();
        }
        res.redirect('/auth/login');
    }
}
module.exports = CustomMiddleware;