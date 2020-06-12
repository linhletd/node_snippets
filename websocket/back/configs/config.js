const bodyParser = require('body-parser');
const useCustomMiddleware = require('./middleware');
const useRoute = require('../routes/routes')
module.exports = function config(client, app){
    useCustomMiddleware(app);
    useRoute(client, app);
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());
}