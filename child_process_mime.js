let exec = require('child_process').exec;
exec(`file --brief --mime server.js`, (err, mime) => {
    console.log(mime)
})