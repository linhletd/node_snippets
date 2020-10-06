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
                return next();
            }
            res.clearCookie('InVzZXIi');
            res.clearCookie('connect.sid');
            return res.redirect('/auth/login');
        }
    }
}
