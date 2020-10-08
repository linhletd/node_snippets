import React from 'react';
import {stringify} from 'query-string';
const Table = (props) =>{
    let {data} = props;
    let title = Object.keys(data[0]);
    let thr = <tr>{title.map((cur,i) =>(<td key = {`htd${i}`}>{cur}</td>))}</tr>;
    let preview = data.length <= 10 ? data : data.slice(0,10);
    let num = data.length - 10;
    let remain = num === 1 ? 'And one more row...' : num > 1 ? `And ${num} more rows...` : '';
    let tbrs = preview.map((cur, i) =><tr key = {`btr${i}`}>{title.map((key,j) => <td key = {`btd${i}${j}`}>{cur[key]}</td>)}</tr>)
    return (
        <div>
            <table>
                <thead>{thr}</thead>
                <tbody>{tbrs}</tbody>
            </table>
            {remain ? <p>{remain}</p> : ''}
        </div>
    )
}
class NorthWinQuery extends React.Component{
    constructor(props){
        super();
        this.pos = 0;
        this.range = null;
        this.test = false;
        this.it = null;
        this.available = true; //worker status
        this.state = {
            data: null
        }
    }
    getNthChild(par, n){
        if(n >= par.childNodes.length || n < 0) return null;
        let x = 0;
        let node = par.firstChild;
        while(x < n){
            node = node.nextSibling;
            x++;
        };
        return node
    }
    runWorker = (r) =>{
        if(!this.code.innerText.length){
            return;
        }
        let {startContainer: start, endContainer: end, startOffset: startOff, endOffset: endOff} = r;
        if(start === this.code){
            return;
        }
        let a, b;
        if(start.nodeName === '#text'){
            let val = start.nodeValue;
            if((val[0] === '\n' || val[0] === ' ') && start.parentNode === this.code && 
            (!start.previousSibling || start.previousSibling.nodeName !== '#text' )){
                a = true;
            }
            if((val[val.length - 1] === '\n' || val[val.length -1] === ' ') && start.parentNode === this.code && val.length !== 1 &&
            (!start.nextSibling || start.nextSibling.nodeName !== '#text')){
                b = true;
            }
        }
        let reAssignRange = () =>{
        let {startContainer: start, endContainer: end, startOffset: startOff, endOffset: endOff} = r;
            this.range = new Range();
            if(end === this.code){
                if(endOff !== end.childNodes.length && !b && end.nodeName === '#text'){
                    endOff = endOff + 1;
                }
                this.range.setEnd(end, endOff)
            }
            else{
                while(end.parentNode !== this.code){
                    end = end.parentNode;
                }
                if(end.nextSibling && !b && end.nodeName === '#text'){
                    end = end.nextSibling;
                }
                this.range.setEndAfter(end);
            }
            if(start === this.code){
                if(startOff !== 0 && !a && start.nodeName === '#text'){
                    startOff = startOff - 1;
                }
                this.range.setStart(start, startOff)
            }
            else{
                while(start.parentNode !== this.code){
                    start = start.parentNode;
                }
                if(start.previousSibling && !a && start.nodeName === '#text'){
                    start = start.previousSibling;
                }
                this.range.setStartBefore(start);
            }
            return this.range;
        }
        let self = this;
        function *gen(){
            let data;
            if((a || start === self.code.firstChild) && (b || start === self.code.lastChild)){
                let message = {
                    language: 'sql',
                    code: start.nodeValue,
                    immediateClose: false,
                }
                self.test = true;
                self.available = false;
                data = yield self.worker.postMessage(JSON.stringify(message));
                self.test = false;
                self.it = null;
            }
            if(!data || data !== start.nodeValue){
                reAssignRange();
                let sel = document.getSelection();
                sel.removeAllRanges();
                if(start.nodeName !== '#text'){
                    let x = document.createTextNode('');
                    r.insertNode(x);
                    start = x;
                    console.log('insert x');
                    setTimeout(() =>{
                        x.remove();
                    }, 0)
                }
                let frag = self.range.extractContents();
                let text = '';
                let _add;
                (_add = (cur) =>{
                    if(!cur) return;
                    if(cur.nodeName === '#text'){
                        if(cur === start){
                            if(start.nodeValue.length === 0){
                                self.pos = text.length;
                            }
                            else{
                                self.pos = text.length + startOff
                            }
                        }
                        text += cur.nodeValue;
                    }
                    if(cur.hasChildNodes()){
                        _add(cur.firstChild);
                    }
                    if(cur.nextSibling){
                        _add(cur.nextSibling)
                    }
                })(frag.firstChild);
                let message = {
                    language: 'sql',
                    code: text,
                    immediateClose: false,
                }
                self.available = false;
                self.worker.postMessage(JSON.stringify(message));
            }
        }
        this.it = gen();
        this.it.next();
    }
    restoreRange = (startNode) =>{
        let r = new Range()
        let _restoreCollapsedRange, count = 0;
        (_restoreCollapsedRange = (cur) =>{
            if(cur.nodeName === '#text'){
                if(cur.nodeValue && count + cur.nodeValue.length >= this.pos){
                    r.setStart(cur, this.pos - count);
                    this.pos = 0;
                    r.collapse(true);
                    return;
                }
                else{
                    count += cur.nodeValue.length;
                }
            }
            if(cur.hasChildNodes()){
                _restoreCollapsedRange(cur.firstChild);
            }
            if(cur.nextSibling){
                _restoreCollapsedRange(cur.nextSibling)
            }
        })(startNode);
        return r;
    }
    insertText = (str, r) =>{
        let {startContainer: text, startOffset: startOff} = r;
        if(startOff === text.nodeValue.length){
            text.nodeValue += str;
            r.setStart(text, text.nodeValue.length);
            r.collapse(true);
        }
        else{
            let a1 = text.nodeValue.slice(0, startOff);
            let a2 = text.nodeValue.slice(startOff);
            text.nodeValue = a1 + str + a2;
            r.setStart(text, a1.length + str.length);
            r.collapse(true);
        }
    }
    handlePasteData = (e) => {
        if(!this.available){
            e.preventDefault();
        }
        let clipboard = e.clipboardData;
        let types = clipboard.types;

        if(types.indexOf('text/plain') > -1){
            e.preventDefault();
            let r = document.getSelection().rangeCount && document.getSelection().getRangeAt(0);
            if(r){
                let str = clipboard.getData('text/plain');
                r.deleteContents();
                let {startContainer: start, endContainer: end, startOffset: startOff, endOffset: endOff} = r;
                if(start.nodeName === '#text'){
                    this.insertText(str, r)
                }
                else{
                    let textNode = document.createTextNode(str);
                    r.insertNode(textNode);
                    r.setStart(textNode, textNode.nodeValue.length);
                    r.collapse(true)
                    start = textNode;
                }
                this.runWorker(r);
            }
        }
    }
    handleWorkerMessage = (e) =>{
        if(this.test){
            this.it.next(e.data);
            this.available = true;
            return;
        }
        let div = document.createElement('div')
        div.innerHTML = e.data;
        let startNode = div.firstChild;
        let r = new Range();
        r.selectNodeContents(div);
        this.range.insertNode(r.extractContents());
        this.range.collapse(false);
        let sel = document.getSelection();
        sel.removeAllRanges();
        r = this.restoreRange(startNode);
        sel.addRange(r);
        this.available = true; 
    }
    handleKeyDown = (e) =>{
        if(e.key === 'z' && e.ctrlKey || !this.available){
            e.preventDefault();
            return;
        }
        if(e.key === 'Enter'){
            let r = document.getSelection().rangeCount && document.getSelection().getRangeAt(0);
            if(r){
                e.preventDefault();
                r.deleteContents();
                if(r.startContainer.nodeName === '#text'){
                    let text = r.startContainer;
                    if(r.startOffset === text.nodeValue.length){
                        text.nodeValue += '\n\n';
                        r.setStart(text, text.nodeValue.length - 1);
                        r.collapse(true);
                    }
                    else{
                        let a1 = text.nodeValue.slice(0, r.startOffset);
                        let a2 = text.nodeValue.slice(r.startOffset);
                        text.nodeValue = a1 + '\n' + a2;
                        r.setStart(text, a1.length + 1);
                        r.collapse(true);
                        this.runWorker(r)
                    }
                }
                else{
                    let textNode = document.createTextNode('\n');
                    r.insertNode(textNode);
                    if(!textNode.nextSibling){
                        textNode.nodeValue += '\n';
                    }
                    r.setStart(textNode, 1);
                    r.collapse(true);
                }
            }
        }
    }
    handleInput = (e) =>{
        let text = this.code.innerText
        if(text.length){
            let r = document.getSelection().rangeCount && document.getSelection().getRangeAt(0);
            if(r){
                this.runWorker(r);
            }
    }
    }
    componentDidMount(){
        this.code = document.getElementById('sql_editor');
        this.worker = new Worker('/js/Prism.js');
        this.code.ondragstart = (e) =>{
            e.preventDefault();
        }
        this.code.ondrop = (e) =>{
            e.preventDefault();
        }
        this.code.onpaste = this.handlePasteData;
        this.code.onkeydown = this.handleKeyDown;
        this.code.oninput = this.handleInput;
        this.worker.onmessage = this.handleWorkerMessage;
        this.editor = document.getElementById('sql_editor');
    }
    componentWillUnmount(){
        this.worker.terminate();
    }
    getPreviewData = () =>{
        //change button state
        let query = `?${stringify({query: this.editor.innerText})}`
        if(this.editor.innerText.length){
            fetch('/sql_query/preview' + query,{
                method: 'GET'
            })
            .then((res) =>{
                if(/text\/html/.test(res.headers.get('Content-Type'))){
                    return {err: 'unauthorized'}
                }
                else return res.json();
                
            })
            .then((data) =>{
                console.log(data)
                this.setState({data: data})
            })
        }
    }
    jsonDownload = () =>{
        let query = `?${stringify({query: this.editor.innerText, format: 'json'})}`
        let link = document.createElement('a');
        link.href = '/sql_query/download' + query;
        link.download = 'data.json';
        link.click();
    } 
    csvDownload = () =>{
        let query = `?${stringify({query: this.editor.innerText, format: 'csv'})}`
        let link = document.createElement('a');
        link.href = '/sql_query/download' + query;
        link.download = 'data.csv';
        link.click();
    }  
    render(){
        console.log('render')
        let {data} = this.state;
        let content = data ? data.err ? <p className = 'fb_msg'>{data.err}</p> : <Table data = {data.data}/> : '';
        return(
            <div id = 'sql_query'>
                <pre id = 'sql_editor' contentEditable = {true}>
                </pre>
                <div>
                <button onClick = {this.getPreviewData}><i className="fa fa-eye"></i><span>Preview</span></button>
                <button onClick = {this.jsonDownload}><i className="fa fa-download"></i>.json</button>
                <button onClick = {this.csvDownload}><i className="fa fa-download"></i>.csv</button>
                </div>
                {content}
            </div>
        )
    }
}
export default NorthWinQuery;
