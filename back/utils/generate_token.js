const dotenv = require('dotenv').config();
let jwt = require('jwt-simple');
let crypt = require('./crypt');
function generateToken(sub, type, bool){
    let payload = {
        exp: Date.now() + 60*60*1000,
        sub,
        type
    }
    if(!bool){
        Object.assign(payload, {
            iss: process.env.HOST,
            aud: [process.env.HOST],
            iat: Date.now(),
        })
    }
    let token = crypt.encrypt(jwt.encode(payload, process.env.JWT_SECRET));
    return token
}
function getPayloadFromToken(token){
    let payload
    try {
        payload = jwt.decode(crypt.decrypt(token), process.env.JWT_SECRET, false);
        if(payload.exp > Date.now()){
            return payload;
        }
    }
    catch(e){
        //
    }
}
module.exports = {generateToken, getPayloadFromToken}