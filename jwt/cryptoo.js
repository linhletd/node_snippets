const crypto = require('crypto');
const dotenv = require('dotenv').config()
function Cryptoo(){
    let iv = crypto.createHash('md5').update(process.env.IV).digest();
    let key = crypto.createHash('sha256').update(process.env.CRYPT_KEY).digest();
    let alg = 'aes-256-gcm'
    this.encrypt = function(plainText){
       let cipher =  crypto.createCipheriv(alg, key, iv);
       let encrypted = cipher.update(plainText, 'utf8');//Buffer
       encrypted = Buffer.concat([encrypted]);
       return encrypted.toString('hex')
    };
    this.decrypt = function(cipherText){
        let encryptedData = Buffer.from(cipherText, 'hex')
        let decipher = crypto.createDecipheriv(alg, key, iv);
        let decrypted = decipher.update(encryptedData); //must call .final() if in 'cbc - cipher block chaining mode'
        return decrypted.toString()

    }
}
module.exports = new Cryptoo()