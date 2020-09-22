onmessage = (e) =>{
    let lastTime = (new Date()).getTime();
    let checkTime = 5000;
    let delay = 2000;
    let itv = setInterval(()=>{
        let currentTime = (new Date()).getTime();
        if(currentTime - lastTime > checkTime + delay){
            postMessage('wakup');
            clearInterval(itv);
        }
    }, checkTime)
}