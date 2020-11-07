function delimiterParser(delimiter, string){
    let reGex = new RegExp('\\'+ delimiter + '+$')
    let a = string.replace(reGex,"");
    let pos = 0;
    let b = a.split("").reduce((acc,cur, idx) => {
      if(cur === '"' && (a[idx - 1] === delimiter||a[idx + 1] === delimiter )){
        pos++;
      }
      if(cur === delimiter && pos % 2 == 0){
        acc = acc.concat(idx);
      }
      return acc;
    },[]);
    b.unshift(-1);
    b.push(undefined);
    let result = [];
    let i = 0;
    while(b[i] !== undefined){
      result.push(a.slice(b[i]+1,b[i+1||undefined]));
      i++;
    }
    return result.map((cur) => (/^""\r?\n?$/.test(cur) || cur === "" ? null : cur.replace(/^"|"$|\,(?=\d)|"?\r?\n?$/g,"")));
}

module.exports = delimiterParser;