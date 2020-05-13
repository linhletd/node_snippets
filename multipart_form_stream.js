const http = require('http');
let fs = require('fs')
http.createServer((request, response) => {
console.log(request.url, request.method)
if(request.url === "/") {
response.writeHead(200, {
"Content-Type": "text/html"
});
return response.end(
`<form action="/uploads" enctype="multipart/form-data" method="post">
Title: <input type="text" name="title"><br />
<input type="file" name="upload1"><br />
<input type="file" name="upload2"><br />
<input type="submit" value="Upload">
</form>`
);
}
if(request.url === '/uploads' && request.method.toLowerCase() === 'post'){
    // let arr = [];
    // request.on('data',(chunk) =>{
    //     arr.push(chunk)
    // })
    request.pipe(fs.createWriteStream('./haaha'));
    request.on('end',()=>{
        // let file = fs.createWriteStream('./haaha')
        // arr.map((chunk)=>{
        //     file.write(chunk)
        // })
        console.log(1)
    })
    response.end('hahah')
}

}).listen(8080);