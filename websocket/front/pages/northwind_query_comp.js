import React from 'react';
import  Guide from './guide_comp'
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
        <div className = 'pre_data'>
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
        this.showDia = false;
        this.guide = {
            header: 'sql_query app',
            id: 'sql_guide',
            array:[
                `"MySQL query app" - Đơn thuần cho phép truy vấn (chỉ đọc) data từ cơ sở dữ liệu nổi tiếng "Northwind", từ đó có thể xem, download định dạng .csv và .json`,
                `Điểm nổi bật của app là phần editor sử dụng thuật toán để chỉ re-render phần code đang thay đổi`,
                `Dữ liệu download được stream từng package từ  CSDL đến client, không lưu trữ trung gian tại server giúp giảm tiêu tốn bộ nhớ`,
                `Code trong phần editor được markup bởi việc sử dụng thư viện Prism như một web worker để tránh block main thread`,
                `Bạn hãy nhấp vào biểu tượng màu hồng góc trái màn hình để xem diagram của CSDL Northwind, và thử nhập một câu lệnh tương thích với mysql để load dữ liệu `,
                `Rất tiếc, do hạn chế thời gian nên một số tính năng như undo/redo tạm thời bị loại bỏ`
            ],
            closable: false
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
    focusIntoEditor(){
        this.editor.innerHTML = '<span class="token keyword">select</span> <span class="token operator">*</span> <span class="token keyword">from</span> categories';
        let r = new Range();
        r.setStart(this.editor.lastChild, this.editor.lastChild.nodeValue.length);
        r.collapse(true);
        let sel = document.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
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
        this.guide = document.getElementById('sql_guide');
        this.diagram = document.getElementById('diagram_ctn');
        this.toggle = document.getElementById('sql_toggle');
        this.opt = document.getElementById('sql_opt')
        this.focusIntoEditor();
    }
    componentWillUnmount(){
        this.worker.terminate();
    }
    getPreviewData = () =>{
        this.state.data && this.setState({data: null});
        this.opt.firstChild.disabled = true;
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
            .catch(e =>{
                return {err: e.message};
            })
            .then((data) =>{
                console.log(data)
                this.setState({data: data}, () =>{
                    this.opt.firstChild.disabled = false;
                })
            })
        }
    }
    jsonDownload = () =>{
        this.opt.firstChild.nextSibling.disabled = true;
        setTimeout(() => {
            this.opt.firstChild.nextSibling.disabled = false;
        }, 2000);
        this.state.data && this.setState({data: null});
        let query = `?${stringify({query: this.editor.innerText, format: 'json'})}`
        let link = document.createElement('a');
        link.href = '/sql_query/download' + query;
        link.download = 'data.json';
        link.click();
    } 
    csvDownload = () =>{
        this.opt.lastChild.disabled = true;
        setTimeout(() => {
            this.opt.lastChild.disabled = false;
        }, 2000);
        this.state.data && this.setState({data: null});
        let query = `?${stringify({query: this.editor.innerText, format: 'csv'})}`
        let link = document.createElement('a');
        link.href = '/sql_query/download' + query;
        link.download = 'data.csv';
        link.click();
    }
    clickToggle = () =>{
        if(this.showDia){
            !this.diagram.classList.contains('hide') && this.diagram.classList.add('hide');
            this.toggle.innerText = 'show';
            this.showDia = false;
        }
        else{
            this.diagram.classList.contains('hide') && this.diagram.classList.remove('hide');
            this.diagram.parentNode.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"})
            this.toggle.innerText = 'hide';
            this.showDia = true
        }
    }  
    render(){
        console.log('render')
        let {data} = this.state;
        let content = data ? data.err ? <p className = 'fb_msg'>{data.err}</p> : <Table data = {data.data}/> : '';
        return(
            <div id = 'sql_query'>
                <div id = 'sql_toggle' onClick = {this.clickToggle}>show</div>
                <div id = 'diagram_ctn' className = 'hide'>
                    <img src = '/image/northwind_diagram.png' alt = 'northwind database diagram'/>
                </div>
                <Guide data = {this.guide}/>
                <pre id = 'sql_editor' contentEditable = {true}></pre>
                <div id = 'sql_opt'>
                    <button onClick = {this.getPreviewData}><i className="fa fa-table"></i><span>Preview</span></button>
                    <button onClick = {this.jsonDownload}><i className="fa fa-download"></i>.json</button>
                    <button onClick = {this.csvDownload}><i className="fa fa-download"></i>.csv</button>
                </div>
                {content}
            </div>
        )
    }
}
export default NorthWinQuery;
