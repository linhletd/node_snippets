const dotenv = require('dotenv').config();
const nodemailer = require('nodemailer');
const {generateToken} = require('./generate_token');
const qs = require('query-string')
let mailAddress = process.env.MAIL_ADDRESS,
    mailPass = process.env.MAIL_PWD,
    host = process.env.HOST;
let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: mailAddress,
        pass: mailPass
    }
})
module.exports = function sendMail({to, name, type}){
    let mailOption;
    switch(type){
        case 'verify':
            let token = generateToken(to, type, true);
            let url = `${host}/auth/${type}?${qs.stringify({token})}`
            mailOption = {
                subject: `verify account at ${host}`,
                html: `
                <p>Hi ${name},</p>
                <p>This mail is to verify your account at <a href = "${host}" target = '_blank'>${host}</a>, please click link below to continue</p>
                <a href = "${url}" target = '_blank'>${url}</a>
                <p>if not you, please ignore this email</p>
                <p>Thank you!</p>`
            }
            break;
        default:
            throw new Error('invalid email type');
    }
    Object.assign(mailOption,{from: mailAddress, to});
    return transporter.sendMail(mailOption);
}

