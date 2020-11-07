let EventEmitter = require('events');
let fs = require('fs');
const dotenv = require('dotenv').config()


class ReadRow extends EventEmitter{
  constructor(file, limit, bufferSize){
    super();
    this.source = file;
    this.bufferSize = bufferSize;
    this.read = this.read.bind(this);
    this.limit = limit;
  }
  read(){
    let pos = 0;
      let dblqcount = 0;
      let buf = Buffer.alloc(this.bufferSize);
      let off = 0;
      let count = - 1;
      let stop = false;
      let _readline = ((fd, bytesTotal) => {
        if(pos === bytesTotal ||stop ){
          fs.close(fd,()=>{
            this.emit('close', count);
          });
          return;
        }
        fs.read(fd, buf, off, 1, pos, (err, bytesNum, bufRef) =>{
          if(err) throw err;

          if(bufRef[off] === 0x22){
            dblqcount++;
          }
          if((bufRef[off] === 0x0a && dblqcount % 2 === 0|| pos + 1 === bytesTotal) ){
            count++;
            this.emit('row',bufRef.slice(0, off).toString('utf8'));
            if(count === this.limit + 1){
                stop = true;
                console.log('stop reading file, row number reachs limitation, ', this.limit);
            }
            off = -1;
          }
          pos++;
          off++;
          _readline(fd,bytesTotal);
        })
      }).bind(this) //lexical scope with arrow funcion, not necsessarily 'bind'
    fs.stat(this.source, (err, stat) => {
      if(err) throw err;
      if(!stat.isFile()) throw new Error('this type of file is not supported');
      fs.open(this.source, 'r', (err, fd) => {
        if(err) throw err;
        _readline(fd, stat.size);
      })
    })
  } 
}
module.exports = ReadRow;