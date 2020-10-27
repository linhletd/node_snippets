const dotenv = require('dotenv').config();
let jwt = require('jwt-simple');
let crypt = require('./crypt');
function generateToken(sub, type){
    let payload = {
        iss: process.env.HOST,
        aud: [process.env.HOST],
        sub,
        type,
        iat: Date.now(),
        exp: Date.now() + 60*60*1000
    }
    let token = crypt.encrypt(jwt.encode(payload, process.env.JWT_SECRET));
    return token
}
function getPayloadFromToken(token){
    let payload
    try {
        payload = jwt.decode(crypt.decrypt(token));
        if(payload.exp > Date.now()){
            return payload;
        }
    }
    catch(e){
        console.log('invalid or expired token')
    }
}
module.exports = {generateToken, getPayloadFromToken}