import React from 'react';
import {connect} from 'react-redux';
import EditorNodeTraveler from '../utils/editor_node_traveler';
import ToolBar from './editor_toolbar'
class EditorApp extends React.Component{
    constructor(props){
        super(props);
        this.setToolbarState = undefined;
        this.currentRange = new Range();
        this.data = {
            waitElem: null,
            focused: false
        }
        this.traveler = new EditorNodeTraveler(props.editorNode, props.updateState, props.historyManager);
        props.historyManager.props = props;
        this.undo = props.historyManager.undo.bind(props.historyManager, this);
        this.redo = props.historyManager.redo.bind(props.historyManager, this);

    }

    handlePasteData = (e) => {
        let clipboard = e.clipboarData
    }
    isBelongTag = (nodeName, node) =>{
        if(node.nodeNome == nodeName) return true;
        while(node != this.props.editorNode && node.nodeName !== nodeName){
            node = node.parentNode;
        }
        return node.nodeName == nodeName ? true : false;
    }
    restoreRange = ({startContainer, endContainer, startOffset, endOffset}) =>{
        this.currentRange.setStart(startContainer, startOffset);
        this.currentRange.setEnd(endContainer, endOffset);
    }
    preserveRange(){
        let {startContainer, endContainer, startOffset, endOffset, commonAncestorContainer} = this.currentRange;
        this.preserveRange = {startContainer, endContainer, startOffset, endOffset, commonAncestorContainer};
    }
    isFirst(par, node){
        if(!par || node === par) return true;
        while(node === node.parentNode.firstChild && node !== par && node !== this.root){
            node = node.parentNode;
        }
        return node === par ? node : false;
    }
    isLast(par, node){
        if(!par || node === par) return true;
        while(node === node.parentNode.lastChild && node !== par && node !== this.root){
            node = node.parentNode;
        }
        return node === par ? node : false;
    }
    isRemainLi(OUL){
        let _findLi, queue = [OUL];
        return (_findLi = () =>{
            if(queue.length === 0){
                return false;
            }
            let node = queue.shift();
            if(node.nodeName === 'LI'){
                return true;
            }
            if(node.hasChildNodes()){
                queue = [queue, ...node.childNodes];
                return _findLi;
            } 
            
        })()
    }
    lastFindOUL = (cur)=>{
        cur = this.traveler.isBelongTag('LI', cur);
        if(!cur) return false;
        let _find;
        return (_find = (cur) =>{
            let par = cur.parentNode;
            if(par.nodeName !== 'UL' && par.nodeName !== 'OL'){
                return cur;
            }
            else if((par.nodeName === 'UL' || par.nodeName === 'OL') && par.lastChild === cur){
                return _find(par);
            }
            return false;
        })(cur)
    }
    firstFindOUL = (cur) => {
        cur = this.traveler.isBelongTag('LI', cur);
        if(!cur) return false;
        let _find;
        return (_find = (cur) =>{
            let par = cur.parentNode;
            if(par.nodeName !== 'UL' && par.nodeName !== 'OL'){
                return cur;
            }
            else if((par.nodeName === 'UL' || par.nodeName === 'OL') && par.firstChild === cur){
                return _find(par);
            }
            return false;
        })(cur)
    }
    handleKeyDown = (e) =>{
        let sel = document.getSelection();
        if(!sel.rangeCount) return;
        let r = sel.getRangeAt(0);
            if([8, 13, 37, 38, 39, 40].indexOf(e.keyCode) > -1){
                setTimeout(() =>{
                    let s = document.getSelection(), r1;
                    s.rangeCount && this.traveler.checkRange((r1 = s.getRangeAt(0)));
                    e.keyCode !== 13 && r1 && (this.currentRange = r1);
                    
                },0)
            }
        let {startContainer: start, startOffset: off, endOffset: endOff, endContainer: end, collapsed} = r;
        let li, par;
        if(e.keyCode === 8){
            li = this.traveler.isBelongTag('LI', start)
            if(r.collapsed && off === 0 && li &&
            this.isFirst(li, start) && li === li.parentNode.firstChild){
                e.preventDefault();
                par = li.parentNode;
                if(!this.traveler.isBelongTag('UL', par) || !this.traveler.isBelongTag('OL', par)){
                    let br = document.createElement('br');
                    li.remove();
                    let ok = li.hasChildNodes() && li.innerText;
                    r.setStartBefore(par);
                    r.collapse(true);
                    r.insertNode(br);
                    if(!par.hasChildNodes()){
                        par.remove();
                    }
                    r.selectNodeContents(li);
                    let ct = r.extractContents();
                    r.selectNode(br);
                    if(ok){
                        r.extractContents();
                        r.insertNode(ct);
                    }
                    r.collapse(true);
                }
                else{
                    li.remove();
                    par.parentNode.insertBefore(li, par);
                    if(!par.hasChildNodes()){
                        par.remove();
                    }
                }
                sel.removeAllRanges();
                sel.addRange(r);
            }
            else if(li){
                console.log(567, li.firstChild)
                if(li.firstChild.nodeName !== 'SPAN'){
                    //do nothing;
                }
                else if(collapsed && off === 1 && li.innerText.length === 1){
                    console.log('here here')
                    e.preventDefault();
                    start.remove();
                    let br = document.createElement('br');
                    li.firstChild.appendChild(br);
                    this.currentRange.setStartBefore(br);
                    this.currentRange.collapse(true);
                }
                else if(!collapsed && off === 0 && (this.isLast(li) && endOff === end.nodeValue.length || this.traveler.isBelongTag('LI', end) !== li)){
                    e.preventDefault();
                    r.setStart(li.firstChild,0);
                    r.extractContents();
                    let br = document.createElement('br');
                    li.firstChild.appendChild(br);
                    this.currentRange.setStartBefore(br);
                    this.currentRange.collapse(true);
                }
            }
        }
        else if(e.keyCode === 13 && (li = this.traveler.isBelongTag('LI', start)) && li.innerText === ''){
            let firstOUL, lastOUL
            let prev, next;
            if((firstOUL = this.firstFindOUL(li)) && (!firstOUL.previousSibling || (prev = firstOUL.previousSibling) && 
            prev.nodeName !== 'BR' && prev.nodeName !== '#text')){
                e.preventDefault();
                firstOUL.parentNode.insertBefore(document.createElement('BR'), firstOUL);
            }
            else if((!li.hasChildNodes() || li.childNodes.length === 1 && li.firstChild.nodeName === 'BR') && (lastOUL = this.lastFindOUL(li)) && (!lastOUL.nextSibling || (next = lastOUL.nextSibling) && 
            next.nodeName !== 'BR' && next.nodeName !== '#text')){
                e.preventDefault();
                li.remove();
                r.setStartAfter(lastOUL);
                r.collapse(true);
                r.insertNode(document.createElement('br'))
                r.collapse(true);
                if(!this.isRemainLi(lastOUL)){
                    lastOUL.remove();
                }
            }
        }
        this.rememberRange();
        // setTimeout(this.rememberRange,0)
    }
    handleInput = (e) =>{
        setTimeout(() => {
            this.currentRange = this.rememberRange()   
        },0)
    }
    updateRangeFromSelection = () =>{
        // let sel = document.getSelection();
        setTimeout(()=>{
            this.currentRange = this.rememberRange();//sel.getRangeAt(0);
            this.traveler.checkRange(this.currentRange);
        }, 0)
        // this.currentRange = this.rememberRange();//sel.getRangeAt(0);
        // this.traveler.checkRange(this.currentRange);
        
    }
    rememberRange = (range)=>{
        let sel;
        let r = range ? range : (sel = document.getSelection()) && sel.rangeCount ? sel.getRangeAt(0) : false;
        if(r){
            let {startContainer, startOffset, endContainer, endOffset} = r;
            this.props.historyManager.updateRange({startContainer, startOffset, endContainer, endOffset});                
            return r;
        }
        return this.currentRange;
    }
    handleKeyPress = (e) =>{
        let {waitElem} = this.data;
        let sel = document.getSelection();
        if(!sel.rangeCount) return;
        let r = sel.getRangeAt(0);
        let {startContainer, startOffset} = r;
        if(startContainer.nodeName !== '#text'){
            let n11 = this.traveler.getNthChild(startContainer, startOffset);
            let n12 = n11 ? n11.nextSibling : null;
            let n01 = n11 ? n11.previousSibling : null;
            let n02 = n01 ? n01.previousSibling : null;
            setTimeout(()=>{
                if(n11 && n11.nodeName === 'BR' && (n12 && ['DIV', 'UL', 'OL'].indexOf(n12.nodeName) > -1)){
                    n11.remove();
                }
                if(n01 && n01.nodeName === 'BR' && (n02 && ['DIV', 'UL', 'OL'].indexOf(n02.nodeName) > -1)){
                    n01.remove();
                }
            }, 0)

        }
        if(waitElem && waitElem.parentNode){
            e.preventDefault();
            waitElem.firstChild.remove();
            if(e.keyCode === 13 && !this.traveler.isBelongTag('LI', this.currentRange.startContainer)){
                this.currentRange.insertNode(document.createElement('br'));
                this.currentRange.insertNode(document.createElement('br'));
                this.currentRange.setStart(waitElem, 1);
                this.currentRange.collapse(true);
            }
            else {
                let text = document.createTextNode(e.key);
                waitElem.appendChild(text);
                this.currentRange.setStart(text, 1);
                this.currentRange.collapse(true);
            }
            this.repopulateSelection();
            this.data.waitElem = null;
        }
        else if(e.keyCode === 13  && !this.traveler.isBelongTag('LI', startContainer)){

            e.preventDefault();
            if(!r.collapsed){
                r.deleteContents();
            }
            let br1 = document.createElement('br');
            let br2 = document.createElement('br');
            r.insertNode(br1);
            r.setStartAfter(br1);
            r.collapse(true);
            if(!br1.nextSibling || !br1.previousSibling || br1.nextSibling && br1.nextSibling.nodeName !== 'BR' || br1.previousSibling && br1.previousSibling.nodeName !== 'BR'){
                r.insertNode(br2);
                r.setStartBefore(br2);
                r.collapse(true);
            }
            this.currentRange = r;
            this.repopulateSelection();
        }


    }

    addEventListenerForEditor = (editor) =>{
        editor.addEventListener('mouseup',this.updateRangeFromSelection);
        editor.addEventListener('keypress', this.handleKeyPress);
        editor.addEventListener('keydown', this.handleKeyDown);
        editor.addEventListener('input', this.handleInput)
        // editor.addEventListener('paste', this.handlePasteData);
    }
    removeEventListenerForEditor = (editor) =>{
        editor.removeEventListener('mouseup', this.updateRangeFromSelection);
        editor.removeEventListener('keypress', this.handleKeyPress);
        editor.removeEventListener('keydown', this.handleKeyDown);
        editor.removeEventListener('input', this.handleInput)
        // editor.removeEventListener('paste', this.handlePasteData)
    }
    repopulateSelection = () =>{
        this.props.editorNode.focus();
        let s = document.getSelection()
        s.removeAllRanges();
        s.addRange(this.currentRange);
        this.traveler.checkRange(this.currentRange);
        setTimeout(() =>{
            this.rememberRange(this.currentRange)
        },0)
    }
    changeStyle = ({prop, val}) =>{
        if(!this.currentRange.startContainer) return;
        let state = this.props.toolbarState;
        (prop === 'fontWeight' && state.bold === 2 ||
        prop === 'fontStyle' && state.italic === 2 ||
        prop === 'textDecoration' && state.underline === 2) && (val = '');
        if(this.data.waitElem){
            this.data.waitElem.style[prop] = val; // add more style to waiting span element
            this.repopulateSelection();
            return;
        }
        this.currentRange = this.traveler.modify(this.currentRange,{
            prop,
            val
        }).cloneRange();
        let {commonAncestorContainer: common} = this.currentRange;
        if(this.currentRange.collapsed && common.nodeName === 'SPAN' && !common.hasChildNodes()){
            let br = document.createElement('br');
            common.appendChild(br);
            this.data.waitElem = common;
        }
        this.repopulateSelection();

    }
    handleClickBold = (e)=>{
        this.changeStyle({prop: 'fontWeight', val: 'bold'});
    }
    handleClickItalic = (e) =>{
       this.changeStyle({prop: 'fontStyle', val: 'italic'}); 
    }
    handleClickUnderline = (e) =>{
        this.changeStyle({prop: 'textDecoration', val: 'underline'})
    }
    handleClickFontColor = (e) =>{
        let target = e.target;
        let colr = target.firstChild ? target.firstChild.style.color : target.tagName === 'I' ? target.style.color : target.style.backgroundColor;
        this.changeStyle({prop: 'color', val: colr})
    }
    handleSelectFontColor = (e) =>{
        let target = e.target;
        this.changeStyle({prop: 'color', val: target.value});
        this.props.updateState({
            type: 'TOOLBARCHANGE',  
            data: {
                color: target.value
            }
        })
    }
    handleBgroundColor = (e) =>{
        let target = e.target;
        let val = target.value ? target.value : target.firstChild ? target.firstChild.style.backgroundColor : target.style.backgroundColor;
        this.changeStyle({prop: 'backgroundColor', val});
        if(target.value){
            this.props.updateState({
                type: 'TOOLBARCHANGE',
                data: {
                    fill: target.value
                }
            })
        }
    }
    handleFont = (e) =>{
        let target = e.target;
        this.changeStyle({prop: 'fontFamily', val: target.value});
    }
    handleFontSize = (e) =>{
        let target = e.target;
        this.changeStyle({prop: 'fontSize', val: target.value});
    }
    handleClickUList = () =>{
        if(!this.currentRange.startContainer) return;
        this.currentRange = this.traveler.convertToList('UL', this.currentRange);
        let wt = this.data.waitElem, li;
        if(wt && (li = wt.parentNode).nodeName === 'LI' && li.childNodes.length === 1){
            this.data.waitElem = null;
            let br = document.createElement('br');
            wt.appendChild(br);
        }
        this.repopulateSelection();
    }
    handleClickOList = () =>{
        if(!this.currentRange.startContainer) return;
        this.currentRange = this.traveler.convertToList('OL', this.currentRange);
        let wt = this.data.waitElem, li;
        if(wt && (li = wt.parentNode).nodeName === 'LI' && li.childNodes.length === 1){
            this.data.waitElem = null;
            let br = document.createElement('br');
            wt.appendChild(br);
        }
        this.repopulateSelection();
    }
    shouldComponentUpdate(){
        return false;
    }
    componentDidMount(){
        let {editorNode: editor} = this.props;
        let app = document.getElementById('editor_app');
        let toolbar = document.getElementById('tool_bar');
        toolbar.onselectstart = (e) =>{
            e.preventDefault();
        }
        app.appendChild(editor);
        editor.onselectstart = ()=>{
            this.data.waitElem && (this.data.waitElem.remove(), this.data.waitElem = null);

        }
        editor.onfocus = () =>{
            this.data.focused = true;
        }
        editor.onblur = () =>{
            this.data.focused = false;
        }
        this.addEventListenerForEditor(editor);
        this.props.historyManager.startObserving();
    }
    componentWillUnmount(){
        this.removeEventListenerForEditor(this.props.editorNode);
    }
    render(){
        let click = {
            undo: this.undo,
            redo: this.redo,
            handleClickBold: this.handleClickBold,
            handleClickItalic: this.handleClickItalic,
            handleClickUnderline: this.handleClickUnderline,
            handleBgroundColor: this.handleBgroundColor,
            handleClickFontColor: this.handleClickFontColor,
            handleSelectFontColor: this.handleSelectFontColor,
            handleFont: this.handleFont,
            handleFontSize: this.handleFontSize,
            handleClickUList: this.handleClickUList,
            handleClickOList: this.handleClickOList
        }
        return (
            <div id = 'editor_app'>
                <ToolBar click = {click}/>
            </div>
        )
    }

}
function mapstateToProps(state){
    return {
        historyManager: state.editor.historyManager,
        editorNode: state.editor.editorNode,
        toolbarState: state.toolbar
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateState: function(action){
            dispatch(action);
        }
    }
}
export default connect(mapstateToProps, mapDispatchToProps)(EditorApp);