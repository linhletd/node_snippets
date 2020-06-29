const crypto = require('crypto');
module.exports = function assignIcon(mail){
    let d = ['monsterid']//, 'identicon', 'wavartar', 'retro', 'robohash'];
    let randomIndex = Math.floor((d.length) * Math.random());
    let hash = crypto.Hash('md5').update(mail).digest('hex');
    return `http://www.gravatar.com/avatar/${hash}?d=${d[randomIndex]}&s=45`
}