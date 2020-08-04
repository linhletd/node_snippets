import React, { createElement } from 'react';
import {connect} from 'react-redux';
import EditorNodeTraveler from '../utils/editor_node_traveler'
class EditorApp extends React.Component{
    constructor(props){
        super(props);
        this.setToolbarState = undefined;
        this.currentRange = undefined;
        this.traveler = new EditorNodeTraveler(props.editorNode);
    }
    handlePasteData = (e) => {
        let clipboard = e.clipboarData
    }
    handleEditorKeyDown = (e) =>{
        this.currentRange = window.getSelection().getRangeAt(0);
        let {startContainer} = this.currentRange;
        if(e.keyCode === 13  && !this.isBelongTag('LI', startContainer)){
            console.log('enter');
            e.preventDefault();
            if(!this.currentRange.collapsed){
                this.currentRange.deleteContents();
            }
            let br1 = document.createElement('br');
            let br2 = document.createElement('br');
            this.currentRange.insertNode(br1);
            this.currentRange.setStartAfter(br1);
            if(br1.nextSibling.nodeName != 'BR' || br1.previousSibling.nodeName != 'BR'){
                this.currentRange.insertNode(br2);
            }
            this.currentRange.collapse(true);
            console.log(this.props.editorNode)
            // let s = document.getSelection();
            // s.removeAllRanges();
            // s.addRange(this.currentRange);
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
    repopulateSelection = () =>{
        this.editorNode.focus();
        let s = document.getSelection().removeAllRanges();
        s.addRange(this.currentRange);
    }
    handleClickBold = (e) =>{
        // let r = new Range();
        // r.selectNodeContents(this.props.editorNode);
        // let content = r.extractContents();
        // r.insertNode(content)
        this.traveler.modify(this.currentRange,{
            prop: 'color',
            val: 'red'
        });
        console.log(this.props.editorNode)
    }
    componentDidMount(){
        let {editorNode: editor} = this.props;
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
                        <button onClick = {self.props.historyManager.undo}>undo</button>
                        <button onClick = {self.props.historyManager.redo}>redo</button>
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