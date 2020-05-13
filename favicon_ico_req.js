const http = require('http')
http.createServer((req, res) => {
    if(req.url === '/favicon.ico'){
        res.writeHead(200, {'Content-Type': "image/x-icon"});
        return res.end()
    }
    /* response for other routes*/
})