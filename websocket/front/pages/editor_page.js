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
        }
        this.traveler = new EditorNodeTraveler(props.editorNode, props.updateState);
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
        let sel = document.getSelection(),
            r = sel.getRangeAt(0);
        let {startContainer: start, startOffset: off} = r;
        let li, par;
        if(e.keyCode === 8 && r.collapsed && off === 0 &&
            this.isFirst(li = this.traveler.isBelongTag('LI', start), start) && li && li === li.parentNode.firstChild){
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
        else if(e.keyCode === 13 && off === 0 && (li = this.traveler.isBelongTag('LI', start))){
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
        this.currentRange = this.rememberRange();
    }
    updateRangeFromSelection = () =>{
        let sel = document.getSelection();
        this.currentRange = sel.getRangeAt(0);
        this.traveler.checkRange(this.currentRange);
    }
    rememberRange = ()=>{
        let r = document.getSelection().getRangeAt(0);
        let {startContainer, startOffset, endContainer, endOffset} = r;
        this.props.historyManager.updateRange({startContainer, startOffset, endContainer, endOffset});
        return r;
    }
    handleKeyPress = (e) =>{
        let {waitElem} = this.data;
        let r = document.getSelection().getRangeAt(0);
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
        if(waitElem){
            e.preventDefault();
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
    }
    handleClickBold = (e) =>{
        if(this.data.waitElem){
            this.waitElem.fontWeight = 'bold';
            return;
        }
        this.currentRange = this.traveler.modify(this.currentRange,{
            prop: 'fontWeight',
            val: 'bold'
        });
        this.repopulateSelection();
        let {commonAncestorContainer: common} = this.currentRange;
        if(this.currentRange.collapsed && common.nodeName === 'SPAN' && !common.hasChildNodes()){
            this.data.waitElem = common;
        }
    }
    handleClickList = () =>{
        this.currentRange = this.traveler.convertToList('UL', this.currentRange);
        this.repopulateSelection();
    }
    shouldComponentUpdate(){
        return false;
    }
    componentDidMount(){
        let {editorNode: editor} = this.props;
        editor.style.paddingLeft = '5px';
        let app = document.getElementById('editor_app');
        let toolbar = document.getElementById('tool_bar');
        toolbar.onselectstart = (e) =>{
            e.preventDefault();
        }
        app.appendChild(editor);
        editor.onselectstart = ()=>{
            this.data.waitElem && (this.data.waitElem.remove(), this.data.waitElem = null);

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
            handleClickList: this.handleClickList
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