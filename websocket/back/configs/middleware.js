const { session } = require("passport");

module.exports = {
    ensureAuthenticated(req, res, next){
        console.log(req.sessionID)
        if(/^\/auth/.test(req.url)){
            return next();
        }

        if(req.isAuthenticated && req.isAuthenticated()){
            return next()
        }
        return res.redirect('/auth/login')
    }
}