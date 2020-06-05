const http = require('http');
http.createServer((req, res) => {
    let cookies = req.headers.cookie;
    if(cookies){
        let cooks = cookies.split(';').reduce((acc, cur) =>{
            let cok = cur.match(/(.*?)=(.*)/);
            acc[cok[1].trim()] = cok[2].trim();
            return acc;
        },{});
        console.log(cooks)
        return res.end(cookies)
    }
    else{
        let cookiename = 'id';
        let cookievalue = '1234'
        let age = 4;
        let expirydate = new Date()
        expirydate.setDate(expirydate.getDate() + age)
        res.setHeader('Set-Cookie',[`${cookiename}=${cookievalue}; expires=${expirydate.toUTCString()}; httponly=true; samesite=lax`,`x=23456; expires=${expirydate.toUTCString()}` ]);
        // console.log(res.getHeader('Set-Cookie'))
        res.writeHead(302,{'Location': '/'});
        return res.end();
    }
}).listen(8000)