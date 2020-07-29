import React from 'react';
import {connect} from 'react-redux';
class EditorApp extends React.Component{
    constructor(props){
        super(props);
        this.setToolbarState = undefined;
        this.currentRange = undefined;
    }
    modifyExistingRangeStyle(range, style){
        let {startContainer: start, endContainer: end, commonAncestorContainer: common, startOffset, endOffset} = range,
            {prop, val} = style,
            nodeList1 = [], nodeList2 = [], nodeList3 = [],
            d = document;
        function replaceWithSpanFromLeft(node, updateList = nodeList1){
            if(node.nodeType === 3){
                let value = node.nodeValue;
                if(node === start && value.length > startOffset){
                    let head = d.createTextNode(value.slice(0, startOffset)),
                        tail = d.createTextNode(value.slice(startOffset)),
                        parentSpan = d.createElement('span'),
                        childSpan = d.createElement('span');
                        childSpan.appendChild(tail);
                        childSpan.style[prop] = val;
                        parentSpan.appendChild(head);
                        parentSpan.appendChild(childSpan);
    
                    node.parentNode.replaceChild(parentSpan, node);
                    updateList.push(parentNode);
                    return parentSpan;
                }
                else {
                    let text = d.createTextNode(value),
                        span = d.createElement('span');
                    span.appendChild(text);
                    span.style[prop] = val;
                    node.parentNode.replaceChild(span, node);
                    return span;
                }
    
            }
            else node.style[prop] = val;
            return node;
        }
        function replaceWithSpanFromRight(node){
            if(node.nodeType === 3){
                let value = node.nodeValue;
                if(node === end && value.length > endOffset){
                    let head = d.createTextNode(value.slice(0, endOffset)),
                        tail = d.createTextNode(value.slice(endOffset))
                        parentSpan = d.createElement('span'),
                        childSpan = d.createElement('span');
                        childSpan.appendChild(head);
                        childSpan.style[prop] = val;
                        parentSpan.appendChild(childSpan);
                        parentSpan.appendChild(tail);
    
                    node.parentNode.replaceChild(parentSpan, node);
                    nodeList3.push(parentNode);
                    return parentSpan;
                }
                else {
                    let text = d.createTextNode(value),
                        span = d.createElement('span');
                    span.appendChild(text);
                    span.style[prop] = val;
                    node.parentNode.replaceChild(span, node);
                    return span;
                }
    
            }
            else node.style[prop] = val;
            return node;
        }
        function traverseFromLeft(cur){
            let par = cur.parentNode;
            let pre = cur.previousSibling;
            if(par === common){
                !nodeList1.length && nodeList1.push(cur) && (cur = replaceWithSpanFromLeft(cur))
                return {
                    nodeList1,
                    bigStart: cur
                };
            } 
            if(!pre && nodeList1.length === 0){
                return traverseFromLeft(par);
            }
            if(pre && nodeList1.length === 0) {
                nodeList1.push(cur) && (cur = replaceWithSpanFromLeft(cur))
            }
            let next = cur.nextSibling;
            while(next){
                nodeList1.push(next)&& (next = replaceWithSpanFromLeft(next));
                next = next.nextSibling;
            }
            return traverseFromLeft(par);
        }
        function traverseFromRight(cur){
            let par = cur.parentNode;
            let next = cur.nextSibling;
            if(par === common){
                !nodeList3.length && nodeList3.push(cur) && (cur = replaceWithSpanFromRight(cur))
                return {
                    nodeList3,
                    bigEnd: cur
                }
            } 
            if(!next && nodeList3.length === 0){
                return traverseFromRight(par);
            }
            if(next && nodeList3.length === 0) {
                nodeList3.push(cur) && (cur = replaceWithSpanFromRight(cur))
            }
            let pre = cur.previousSibling;
            while(pre){
                nodeList3.push(pre)&& (pre = replaceWithSpanFromRight(pre));
                pre = pre.previousSibling;
            }
            return traverseFromRight(par);
        }
        function traverseThroughMiddleNodes(start, end){
            let next = start.nextSibling;
            while(next && next !== end){
                nodeList2.push(next) && (next = replaceWithSpanFromLeft(next, nodeList2));
                next = next.nextSibling;
            }
        }
        traverseThroughMiddleNodes(traverseFromLeft(start).bigStart,traverseFromRight(end).bigEnd);
    }
    isBelongTag = (nodeName, node) =>{
        let editorNode = this.props.editorNode;
        if(node.nodeNome == nodeName) return true;
        while(node != editorNode && node.parentNode.nodeName == nodeName){
            node = node.parentNode;
        }
        return node.parentNode.nodeName == nodeName ? true : false;
    }

    handlePasteData = (e) => {
        let clipboard = e.clipboarData
    }
    handleEditorKeyDown = (e) =>{
        this.currentRange = window.getSelection().getRangeAt(0);
        let {startContainer} = this.currentRange;
        if(e.keyCode === 13  && !this.isBelongTag('LI', startContainer)){
            e.preventDefault();
            if(!this.currentRange.collapsed){
                this.currentRange.deleteContents();
            }
            let br1 = document.createElement('br');
            let br2 = document.createElement('br');
            this.currentRange.insertNode(br1);
            this.currentRange.setEndAfter(br1);
            if(br1.nextSibling.nodeName != 'BR' || br1.previousSibling.nodeName != 'BR'){
                this.currentRange.insertNode(br2);
            }
            let s = document.getSelection();
            s.removeAllRanges();
            s.addRange(this.currentRange);
        }
    }
    handleEditorMouseUp = (e) =>{
        this.currentRange = window.getSelection().getRangeAt(0);
    }
    addEventListenerForEditor = (editor) =>{
        editor.addEventListener('keydown', this.handleEditorKeyDown);
        editor.addEventListener('mouseup',this.handleEditorMouseUp);
        editor.addEventListener('paste', this.handlePasteData);
    }
    removeEventListenerForEditor = (editor) =>{
        editor.removeEventListener('keydown', this.handleEditorKeyDown);
        editor.removeEventListener('mouseup', this.handleEditorMouseUp);
        editor.removeEventListener('paste', this.handlePastData)
    }
    componentDidMount(){
        let {editorNode: editor} = this.props;
        let app = document.getElementById('editor_app');
        app.appendChild(editor);
        this.addEventListenerForEditor(editor);
        this.props.historyManager.startObserving();


        // this.handleEditAction();
    }
    componentWillUnmount(){
        this.removeEventListenerForEditor(this.props.editorNode);
    }
    render(){
        let self = this;
        class ToolBar extends React.Component{
            constructor(props){
                super(props);
                this.state = {
                    undo: false,
                    redo: false,
                    italic: false,
                    underline: false,
                    bold: false,
                    font: undefined,
                    fontSize: undefined,
                    fontColor: undefined,
                    fontBackground: undefined,
                    orderList: false,
                    unorderList: false
                }
            }
            render(){
                return (
                    <div id = 'tool_bar'>
                        <button onClick = {self.props.historyManager.undo}>undo</button>
                        <button onClick = {self.props.historyManager.redo}>redo</button>
                        <button>order list</button>
                        <button>bold</button>
                        <label>font</label>
                        <select>
                            <option value = '1'>1</option>
                            <option value = '2'>2</option>
                            <option value = '3'>3</option>
                            <option value = '4'>4</option>
                        </select>
                    </div>
                )
            }
        }
        return (
            <div id = 'editor_app'>
                <ToolBar/>
            </div>
        )
    }

}
function mapstateToProps(state){
    return {
        historyManager: state.editor.historyManager,
        editorNode: state.editor.editorNode
    }
}
export default connect(mapstateToProps, null)(EditorApp);