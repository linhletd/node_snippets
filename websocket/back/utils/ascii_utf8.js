const fs = require('fs');
const Transform  = require('stream').Transform;

class ConvertFile{
    constructor(originFileName, force = false, bufSize = 2){
        this.file = `${process.cwd()}/data/${originFileName}`;
        this.bufSize = bufSize;
        this.force = force;
        this.tempFile = `${process.cwd()}/temp/${originFileName}_temp`;
        this.totalByte;
        this.pos = 0;
        this.pos1 = 0;
    }
    static pos = 0;
    static posn;
    static posu;
    static a;
    static u = {val: undefined, count: 0};

    static utf8tize(buf){
        let arr = [];
        buf.map((val,idx) =>{
            if(this.posn && val){
                throw new Error('Binary file or encoding not supported')
            }
            else if(val < 128){
                arr.push(val);
                val === 0 && (this.posn = this.pos + idx +1)
            }
            else{
                let _val = val.toString(2);
                let b1 = Number.parseInt('110000' + _val.slice(0,2),2);
                let b2 = Number.parseInt('10' + _val.slice(2),2);
                arr.push(b1,b2);
                this.pos + idx === this.posu && (_val.slice(0,2) != '10' ? this.a = true : this.u.val = true, this.u.count++);
                _val.slice(0,3) === '110' && (this.posu = this.pos + idx + 1)
            }
    
        })
        this.pos += buf.length;
        return Buffer.from(arr)
    }

    static convert(file){
        let temp = `${process.cwd()}/temp/${file}_temp`
        let readStream = fs.createReadStream(`${process.cwd()}/data/${file}`);
        let writeStream = fs.createWriteStream(`${process.cwd()}/temp/${file}_temp`);
        let f = this.utf8tize.bind(this);
        let utf8tizer = new Transform({
            transform: function(chunk, encoding, callback) {
                let newChunk;
                try {
                    newChunk = f(chunk)
                }
                catch(e){
                    console.log('error occurs: ', e.message);
                    this.end();
                    fs.unlink(temp,()=>{})
                    return
                }
                this.push(newChunk);
                callback();
            }
        });
        readStream.pipe(utf8tizer).pipe(writeStream);
        writeStream.on('close',()=>{
            console.log('complete')
        })
    }


    copy(fd, fd1){
        let r,_r = 0, w = 0;
        let _rw;
        return new Promise((resolve, reject) =>{
            (_rw = () =>{
                if(this.pos >= this.totalByte){
                    r = _r;
                    return;
                }
                let _bufSize;
                if(this.totalByte - this.pos < this.bufSize){
                    _bufSize = this.totalByte - this.pos;
                }
                else {
                    _bufSize = this.bufSize;
                }
                let buf = Buffer.alloc(_bufSize);
                let pos = this.pos
                fs.read(fd,buf,0,buf.length,pos,(err, num, buf) =>{
                    if(err) {
                        reject(err);
                        return;
                    };
                    _r++;
                    try{
                        var buf1 = ConvertFile.utf8tize(buf);
                    }
                    catch(err){
                        reject(err);
                        return;
                    }
                    fs.write(fd1, buf1, 0, buf1.length, this.pos1, (err, num, buf1) =>{
                        if(err) {
                            reject(err);
                            return;
                        }
                        w++;
                        r && r === w && (resolve() || true) && (fs.close(fd,()=>{}) || true) && fs.close(fd1,()=>{})
                    })
                    this.pos1 += buf1.length;
                    this.pos += buf.length;
                    _rw();
                })
            })()
        })
    }

    asciiToUtf8(){
        let fd1, fd2;
        let p1 = new Promise((resolve, reject) =>{
            fs.open(this.file, 'r', (err, fd) =>{
                fd1 = fd;
                err ? reject(err) : resolve(fd)
            })
        });
        let p2 = new Promise((resolve, reject) =>{
            fs.open(this.tempFile, 'w', (err, fd) =>{
                fd2 = fd;
                err ? reject(err) : resolve(fd)
            })
        });
        let p3 = new Promise((resolve, reject) =>{
            fs.stat(this.file,(err, stats) =>{
                err && reject(err);
                stats && (this.totalByte = stats.size);
                resolve(stats.size)
            })
        })
        Promise.all([p1,p2,p3])
        .then(([fd,fd1,size]) => {
            return this.copy(fd, fd1).then(() =>{
                if(ConvertFile.a || !ConvertFile.u.val){
                    console.log('the source file is absolutely ascii format');
                    fs.unlink(this.file,()=>{
                        fs.rename(this.tempFile, this.file,()=>{
                            console.log('completely convert file from ascii to utf8');
                        })
                    })
                }
                else if(ConvertFile.u.val){
                    console.log(`the source file seems to be utf8 format already, at least ${ConvertFile.u.count} pattern(s) found.\nif you want to force to convert, set 'force' parameter to true then run again.`);
                    if(this.force){
                        fs.unlink(this.file,()=>{
                            fs.rename(this.tempFile, this.file,()=>{
                                console.log('completely convert file from ascii to utf8');
                            })
                        })
                    }
                    else {
                        fs.unlink(this.tempFile, ()=>{
                            console.log('nothing changed');
                        })
                    }
                }

            })

        })
        .catch((err) =>{
            console.log('err occurs while processing file:', err.message);
            fd1 && fs.close(fd1,() =>{
                console.log('closed origin file, nothing changed');
            })
            fd2 && fs.close(fd2,()=>{
                fs.unlink(this.tempFile,()=>{
                    console.log('temp file cleared');
                })
            })
        })
    
    }
}
module.exports = ConvertFile