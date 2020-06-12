module.exports = function customMiddleware(app){
    function ensureAuthenticated(req, res, next){
        if(req.url.match(/^\/(.*?)\//)[1] === 'auth'){
            return next();
        }
        if(req.authenticated()){
            return next()
        }
        return res.redirect('/auth/login')
    }

    app.use(ensureAuthenticated)

}