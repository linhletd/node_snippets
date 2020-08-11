import React, { createElement } from 'react';
import {connect} from 'react-redux';
import EditorNodeTraveler from '../utils/editor_node_traveler'
class EditorApp extends React.Component{
    constructor(props){
        super(props);
        this.setToolbarState = undefined;
        this.currentRange = new Range();
        this.data = {
            waitRange: undefined,
        }
        this.traveler = new EditorNodeTraveler(props.editorNode);
        this.undo = props.historyManager.undo.bind(props.historyManager, this);
        this.redo = props.historyManager.redo.bind(props.historyManager, this);

    }

    handlePasteData = (e) => {
        let clipboard = e.clipboarData
    }
    isBelongTag = (nodeName, node) =>{
        if(node.nodeNome == nodeName) return true;
        while(node != this.root && node.parentNode.nodeName == nodeName){
            node = node.parentNode;
        }
        return node.parentNode.nodeName == nodeName ? true : false;
    }
    restoreRange = ({startContainer, endContainer, startOffset, endOffset}) =>{
        this.currentRange.setStart(startContainer, startOffset);
        this.currentRange.setEnd(endContainer, endOffset);
    }
    preserveRange(){
        let {startContainer, endContainer, startOffset, endOffset, commonAncestorContainer} = this.currentRange;
        this.preserveRange = {startContainer, endContainer, startOffset, endOffset, commonAncestorContainer};
    }
    handleEditorKeyPress = (e) =>{
        if(this.data.waitRange && this.data.waitRange != document.getSelection().getRangeAt(0)){
            let {startContainer} = this.data.waitRange;
            startContainer.remove();
        }
        let r = this.data.waitRange || document.getSelection().getRangeAt(0);
        if(this.data.waitRange == document.getSelection().getRangeAt(0) && e.keyCode !== 13){
            e.preventDefault();
            let char = String.fromCodePoint(e.charCode);
            r.insertNode(document.createTextNode(char));
            r.collapse(false);
        }
        if(e.keyCode === 13  && !this.isBelongTag('LI', startContainer)){
            e.preventDefault();
            if(!r.collapsed){
                r.deleteContents();
            }
            let br1 = document.createElement('br');
            let br2 = document.createElement('br');
            r.insertNode(br1);
            r.setStartAfter(br1);
            if(br1.nextSibling && br1.nextSibling.nodeName != 'BR' || br1.previousSibling && br1.previousSibling.nodeName != 'BR'){
                r.insertNode(br2);
            }
            r.collapse(true);
        }
        this.data.waitRange && (this.data.waitRange = undefined);
    }
    handleEditorMouseUp = (e) =>{
        this.currentRange = this.rememberRange();
    }
    rememberRange = ()=>{
        let sel = document.getSelection().getRangeAt(0);
        console.log('haizze',sel)
        let {startContainer, startOffset, endContainer, endOffset} = sel
        this.props.historyManager.updateRange({startContainer, startOffset, endContainer, endOffset});
        return sel;
    }
    handleInputData = () =>{
        this.rememberRange();
        setTimeout(this.rememberRange,0)
    }
    spaceAround = () =>{
        
    }
    addEventListenerForEditor = (editor) =>{
        editor.addEventListener('keydown', this.handleEditorKeyPress);
        editor.addEventListener('mouseup',this.handleEditorMouseUp);
        editor.addEventListener('keypress', this.handleInputData);
        // editor.addEventListener('paste', this.handlePasteData);
    }
    removeEventListenerForEditor = (editor) =>{
        editor.removeEventListener('keydown', this.handleEditorKeyPress);
        editor.removeEventListener('mouseup', this.handleEditorMouseUp);
        editor.removeEventListener('keypress', this.handleInputData);
        // editor.removeEventListener('paste', this.handlePastData)
    }
    repopulateSelection = () =>{
        this.props.editorNode.focus();
        let s = document.getSelection()
        s.removeAllRanges();
        s.addRange(this.currentRange);
    }
    handleClickBold = (e) =>{
        // this.rememberRange();
        this.currentRange = this.traveler.modify(this.currentRange,{
            prop: 'color',
            val: 'red'
        });
        this.repopulateSelection()
        console.log(10, this.props.editorNode.childNodes.length)
        // this.rememberRange();
        console.log(this.props.editorNode)
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
        this.addEventListenerForEditor(editor);
        this.props.historyManager.startObserving();
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
                        <button onClick = {self.undo}>undo</button>
                        <button onClick = {self.redo}>redo</button>
                        <button>order list</button>
                        <button onClick = {self.handleClickBold}>bold</button>
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