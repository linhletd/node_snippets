const helmet = require('helmet');
module.exports = function(app){
    app.use(helmet.hidePoweredBy({ setTo: 'PHP 4.2.0' }));
    app.use(helmet.frameguard({action: 'DENY'}));
    app.use(helmet.xssFilter());
    app.use(helmet.noSniff());
    app.use(helmet.ieNoOpen());
    app.use(helmet.hsts());
    app.use(helmet.dnsPrefetchControl());
    // app.use(helmet.noCache());
    // app.use(helmet.contentSecurityPolicy({
    //     directives:{
    //         scriptSrc: ["'self'"]
    //     }
    // }))
}
