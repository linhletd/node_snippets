const fs = require('fs');
// const readline = require('readline');
const ReadRow = require('../helpers/readrow.js');
const delimiterParser = require('../helpers/parserow.js');

//rely on 'readline' module
// function insertRecordsFromFile(conn,table,file,delimiter,cb = delimiterParser.bind({}, delimiter)){
//     let linestream = readline.createInterface({
//         input: fs.createReadStream(file),
//         terminal: false
//         });
//     console.log('running...')
//     let data = false;
//     linestream.on("line", ln => {
//         if(data && /\w/.test(ln)){
//             let record = cb(ln);
//             console.log(record)
//             let cmd = `INSERT INTO ${table} VALUES (?)`
//             conn.query(cmd,[record], (err, result) => {
//                 if(err) throw err;
//                 console.log('one record inserted');
//             })
//         }
//         else{
//             data = true;
//         }
//     });
//     linestream.on('close',()=>{
//         console.log('reading finished');
//     })
// }

//write own method
function insertRecordsFromFile_alt(conn,table,file,delimiter,max = 10000 , size = 1024,cb = delimiterParser.bind({}, delimiter)){
    if(conn.state !== 'connected') {
        console.log('DB is not connected');
        return;
    };
    console.log('running...');
    let readrow = new ReadRow(file,max,size);
    let data = false;
    let r;
    let w = 0;
    setImmediate(readrow.read.bind(readrow));
    readrow.on("row", row => {
        if(data && /\w/.test(row)){
            let record = cb(row);
            // console.log(record)
            conn.query(`INSERT INTO ${table} VALUES (?)`,[record], (err, result) => {
                if(err) throw err;
                w++;
                if(w === r){
                    console.log(`all records inserted (reading -1, for title row)`, w);
                    // conn.end();
                }
                else{
                    // console.log('one record inserted',w);
                }
            })
        }
        else{
            data = true;
        }
    });
    readrow.on('close',(num)=>{
        r = num - 1;
        console.log('reading finished',num);
    })
}
module.exports = {
    fileToDB: insertRecordsFromFile,
    fileToDB_alt: insertRecordsFromFile_alt
}