const fs = require('fs');

function writeFile(conn, filename, table){
    let file = fs.createWriteStream(`./saved_data/${filename}`);
    let keys;
    let _r = 0;
    let r, w = 0;
    let x = conn.query(`SELECT * FROM ${table}`);
    x.on('error', (err) => {throw err})
    x.on('result', (row) => {
        _r++;
        // console.log(row);
        if(!keys){
            keys = Object.keys(row);
            file.write(keys.map(cur =>(`"${cur}"`)).join(',')+"\r\n");
        }
        let line = [];
        for(let key of keys){
            let chunk;
            if(/\,/.test(row[key])|| /\n/.test(row[key])){
                chunk = `"${row[key]}"`;
            }
            else if(row[key] === null ){
                chunk = `""`;
            }
            else {
                chunk = row[key];
            }
            line.push(chunk);
            // if(keys.indexOf(key) === keys.length - 1){
            //     file.write(chunk +"\r\n", (err) =>{
            //         if(err) throw err;
            //         w++;
            //         if(r === w){
            //             console.log(`${filename} completed`);
            //             file.end();
            //         }
            //     });
            // }
            // else{
            //     file.write(chunk + ",");
            // }
        }
        file.write(line.join(',') + (w === r - 1 ? "" :'\r\n'),(err) =>{
            w++;
            if(r === w){
                console.log(`${filename} completed`);
                file.end();
            }
        })
    })
    x.on('end', () => {
        r = _r;
    })

}

function writeFile_alt(conn,query,filename,encoding){
    if(conn.state !== 'connected') {
        console.log('DB is not connected');
        return;
    };
    let storage = [];
    let keys;
    let _r = 0;
    let r, w = -1;
    let stop = false;
    let pos = 0;
    let path = `${process.cwd()}/saved_data/${filename}`;
    let fd;
    let wait = false;
    query.on('error',(err) =>{
        console.log('err occur when load data from db', err);
        storage = []
        stop = true;
    })
    .on('result', (row) =>{
        storage.push(row);
        _r++;
        if(fd && wait){
            _write(fd, storage);
            wait = false;
        }
    })
    .on('end',() =>{
        r = _r;
    })
    function _write(fd, storage){
        if(stop){
            fs.close(fd, () =>{
                fs.unlink(path,()=>{
                    console.log('file cleared')
                });
            });
            return;
        }
        else if(r == w){
            fs.close(fd, ()=>{
                console.log(`${w} rows completely written into ${filename}`);
            });
            return;
        }
        if(storage.length){
            let row = storage[0];
            if(!keys){
                keys = Object.keys(row);
                let title = {};
                keys.map(key =>{
                    title[key] = key;
                });
                storage.unshift(title);
            }
            row = storage.splice(0,1)[0];
            let _line = []

            for(let key of keys){
                let chunk;
                if(/\,/.test(row[key])|| /\n/.test(row[key])){
                    chunk = `"${row[key]}"`;
                }
                else if(row[key] === null ){
                    chunk = `""`;
                }
                else {
                    chunk = row[key];
                }
                _line.push(chunk);
            }
            let line = _line.join(',') + (w === r - 1 ? "" :'\r\n');
            let buffer = Buffer.from(line, encoding || 'utf8');
            fs.write(fd, buffer, 0, buffer.length, pos, (err, byteNum, bufRef) =>{
                if(err){
                    console.log('error occurs while writing to file');
                    stop = true;
                }
                pos += byteNum;
                w++;
                _write(fd, storage);
            })
        }
        else {
            wait = true;
        }
    }
    fs.open(path, 'w',(err, _fd) =>{
        if(err){
            console.log('error occurs while opening file', err);
            return;
        }
        fd = _fd
        _write(fd, storage)
    })
}
module.exports = {
    dbToFile: writeFile,
    dbToFile_alt: writeFile_alt
}