const crypto = require('crypto');
module.exports = function assignIcon(mail){
    let d = ['identicon', 'monsterid', 'wavartar', 'retro', 'robohash'];
    let randomIndex = Math.floor((d.length + 1) * Math.random());
    let hash = crypto.Hash('md5').update(mail).digest('hex');
    return `http://www.gravatar.com/avatar/${hash}?d=${d[randomIndex]}&s=45`
}