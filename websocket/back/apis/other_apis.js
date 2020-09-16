let qs = require('query-string');
let http = require('http');
module.exports = {
    //'https://us1.locationiq.com/v1/reverse.php?key=pk.fef54894c32d28253d8379d17512351e&lat=21.5602008&lon=105.9201406&format=json'
    currentWeather: function(req, res, next){
        let qr = qs.stringify({appid: process.env.WTHR_KEY, units: 'metric', format: 'json',...req.body});
        let opts = new URL(`http://api.openweathermap.org/data/2.5/weather?${qr}`);
        http.request(opts,(vres) =>{
            let statusCode = vres.statusCode.toString()[0]
            if(req.body.q || statusCode !== '2'){
                if(vres.statusCode.toString()[0] === '2'){
                    vres.pipe(res);
                }
                else{
                    res.json({err: vres.statusMessage});
                }
            }
            else{
                let data = '';
                vres.on('data', (chunk) =>{
                    data += chunk.toString();
                })
                vres.on('end',() =>{
                    try{
                        data = JSON.parse(data);
                        if(data.name == ''){
                            qr = qs.stringify({key: process.env.GEO_KEY, format: 'json',...req.body});
                            opts = new URL(`http://us1.locationiq.com/v1/reverse.php?${qr}`);
                            http.request(opts, (vres1) =>{
                                let dt = '';
                                vres1.on('data',(chunk) =>{
                                    dt += dt + chunk.toString();
                                })
                                vres1.on('close',() =>{
                                    try{
                                        dt = JSON.parse(data);
                                        if(dt.display_name){
                                            data.name = dt.display_name;
                                        }
                                        res.json(data);
                                    }
                                    catch{
                                        res.json(data);
                                    }
                                })
                            }).end();
                        }
                        else{
                            res.json(data);
                        }
                    }
                    catch(e){
                        res.json({err: e.message});
                    }
                })
                vres.on('error', (err) =>{
                    res.json({err: err.message});
                })
            }
        }).end()
    },
    // similarity: function(req, res, next){
    //     if(!req.body.src || !req.body.des){
    //         res.writeHead(400,'input values must not be empty strings');
    //         res.end();
    //     }
    //     res.json(similarity(req.body.src, req.body.des));
    // }
}

