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
export function focusOnInput(input){
    if(!input) return;
    if(!input.hasChildNodes()){
        input.focus();
    }
    else{
        let r = new Range();
        let sel = document.getSelection();
        sel.removeAllRanges();
        let last = input.lastChild;
        if(last.nodeName === 'BR' && last.previousSibling && last.previousSibling.nodeName !== 'BR'){
            last = last.previousSibling;
        }
        else if(last.nodeName === 'BR'){
            r.setStartBefore(last);
            r.collapse(true);
            sel.addRange(r);
            return;
        }
        if(last.nodeName === '#text'){
            r.setStart(last, last.nodeValue.length);
        }
        else if(last.nodeName === 'A'){
            r.setStartAfter(last);
        }
        else{
            try{
                r.setStart(last.lastChild, last.lastChild.nodeValue.length)
            }
            catch{
                r.setStartAfter(last);
            }
        }
        r.collapse(true);
        sel.addRange(r);
    }
}
export default sendMsgViaSocket;