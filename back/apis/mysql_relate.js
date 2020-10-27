const { query } = require("express");

module.exports = function (app){
    let Ob = {
        getPreviewNorthWindData: (req, res, next) =>{
            let str = req.query.query;
            if(!/^\W*select/i.test(str)){
                return res.json({err: 'Seem you not to try to read data'})
            }
            try{
                let query = app.conn.query(str);
                let started = false;
                query.on('result', (row) =>{
                    if(!started){
                        res.write('{"data": [' + JSON.stringify(row))
                        started = true
                    }
                    else{
                        res.write(',' + JSON.stringify(row))
                    }
                })
                query.on('end', () =>{
                    res.end(']}')
                });
                query.on('error', (err) =>{
                    console.log('load data err', err.message);
                    if(started){
                        res.end('], "err": "err occurs while loading data"}')
                    }
                    else{
                        res.json({err: "err occurs while loading data"})
                    }
                })
            }
            catch(e){
                return res.json({err: 'Invalid syntax or disallowed multiple query'})
            }
        },
        downloadNorthWindData: (req, res, next) =>{
            let str = req.query.query;
            if(!/^\W*select/i.test(str)){
                return res.json({err: 'Seem you not to try to read data'})
            }
            let format = req.query.format;
            try{
                let query = app.conn.query(str);
                let started = false;
                if(format === 'json'){
                    let space = (n) =>{
                        let sp = '';
                        for(let i = 1; i <= n; i++){
                            sp += ' ';
                        }
                        return sp;
                    }
                    res.writeHead(200, {"Content-Type": "application/json"});
                    query.on('result', (row) =>{
                        let rowStr = JSON.stringify(row, null, 3).replace(/^\{\s{3}/, space(20) + '{');
                        if(!started){
                            res.write('{\r\n     "data": [\r\n' + rowStr)
                            started = true
                        }
                        else{
                            res.write(',\r\n' + rowStr)
                        }
                    })
                    query.on('end', () =>{
                        res.end('\r\n     ]\r\n}')
                    });
                    query.on('error', (err) =>{
                        console.log('load data err', err.message);
                        if(started){
                            res.end('     ],\r\n "  err": "err occurs while loading data"\r\n}')
                        }
                        else{
                            res.json({err: "err occurs while loading data"})
                        }
                    })
                }
                else if(format === 'csv'){
                    res.writeHead(200, {"Content-Type": "text/csv"});
                    let field;
                    query.on('result', (row) =>{
                        let rowStr = '';
                        if(!started){
                            field = Object.keys(row);
                            field.map((c, i) =>{
                                if(/\,/.test(c) || /\n/.test(c)){
                                    rowStr += `"${c}"`;
                                }
                                else{
                                    rowStr += `${c}`;
                                }
                                if(i !== field.length - 1){
                                    rowStr += ',';
                                }
                            })
                            started = true
                        }
                        rowStr += '\r\n';
                        field.map((c, i) =>{
                            if(/\,/.test(row[c]) || /\n/.test(row[c])){
                                rowStr += `"${row[c]}"`;
                            }
                            else if(row[c] === null){
                                rowStr += '';
                            }
                            else{
                                rowStr += `${row[c]}`;
                            }
                            if(i !== field.length - 1){
                                rowStr += ',';
                            }
                        });
                        res.write(rowStr);
                    })
                    query.on('end', () =>{
                        res.end();
                    });
                    query.on('error', (err) =>{
                        console.log('load data err', err.message);
                        res.end('err occurs while loading data');
                    })
                }
            }
            catch{
                if(req.query.format === 'json'){
                    return res.json({err: 'Invalid syntax or disallowed multiple query'});
                }
                else{
                    res.end('Invalid syntax or disallowed multiple query');
                }
            }
        },
    };
    return Ob;
}