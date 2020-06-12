let express = require('express');
let session = require('express-session');
let http = require('http');
let sessionParser = session({
  saveUninitialized: true,
  resave: false,
  secret: '123'
})
let app = express();
app.use(sessionParser);
app.use((req, res) =>{
  console.log(req.res)
  console.log(req.sessionID);
  res.send(req.sessionID)
});
let server = http.createServer(app);
server.on('upgrade',()=>{

})
server.listen(8000,()=>{
  console.log('listening');
})