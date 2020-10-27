const dotenv = require('dotenv').config();
const nodemailer = require('nodemailer');
const generateToken = require('./generate_token')
let mailAdress = process.env.MAIL_ADDRESS,
    mailPass = process.env.MAIL_PWD,
    host = process.env.HOST;
let transporter = nodemailer.createTransport({
    host: 'smtp.google.com',
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
        user: mailAdress,
        pass: mailPass
    }
})
module.exports = function sendMail(to, type){
    if(!Object.keys(emailType).indexOf(type)){
        throw new Error('invalid type');
    }
    let token = generateToken(to, type);
    var emailType = {
        verify: function(){
            let url = `${host}/auth/${type}/${token}`
            return {
                subject: `verify account at ${host}`,
                html: `<p>You 're trying to regist your email for a new account or reset password at ${host} </p>
                <a href = "${url}" id = "popup">${url}</a>
                <p>if not you, please ignore this email\n
                Thank you!</p>`
            }
        },
        resetpwd:{}
    
    
    }
    let mailOption = emailType[type]();
    Object.setPrototypeOf(mailOption,{from: mailAdress, to});
    return transporter.sendMail(mailOption);
}

