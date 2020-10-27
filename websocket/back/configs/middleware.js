const { session } = require("passport");

module.exports = function(app){
    return {
        ensureAuthenticated(req, res, next){
            let {sessionMap} = app;
            let sockets = app.sessionMap.get(req.sessionID);
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
                console.log(true)
                return next();
            }
            res.clearCookie('InVzZXIi');
            res.clearCookie('connect.sid');
            let intent = Buffer.from(req.url).toString('base64');
                res.cookie('aW50ZW50VVJM', intent, {httpOnly: false, sameSite: 'strict', maxAge: 100});
            return res.redirect('/auth/login');
        },
        ensureSQLConnected(req, res, next){
            if(app.conn){
                return next();
            }
            else{
                return res.json({err: 'Cannot connect to sql database'});
            }
        }
    }
}
