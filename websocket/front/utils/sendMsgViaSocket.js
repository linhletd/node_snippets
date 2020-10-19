function sendMsgViaSocket(props, msg, cb){
    let {socket} = props;
    if(socket.readyState === 2 || socket.readyState === 3){
        let ws = new window.WebSocket('ws://localhost:8080');
        props.updateStore({type: 'OPENSOCKET', data: ws});
        ws.onopen = (e) =>{
            ws.send(msg);
        }
    }
    else{
        try{
            socket.send(msg);
        }
        catch(e){
            if(socket.readyState === 0){
                socket.addEventListener('open', () =>{
                socket.send(msg);
                if(cb){
                    cb()
                }
                })
            }
        }
    }
}
export default sendMsgViaSocket;