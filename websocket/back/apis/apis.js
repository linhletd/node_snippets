const bcrypt = require('bcrypt');
const dotenv = require('dotenv').config({path: '../../../.env'});
const sendEmail = require('../utils/send_email');
const {generateToken, getPayloadFromToken} = require('../utils/generate_token');
module.exports = function(){
    
}