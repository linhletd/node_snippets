import React from 'react';
import {connect} from 'react-redux';
import EditorNodeTraveler from '../utils/editor_node_traveler';
import ToolBar from './editor_toolbar'
class EditorApp extends React.Component{
    constructor(props){
        super(props);
        this.setToolbarState = undefined;
        this.currentRange = undefined;
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
        this.currentRange = new Range();
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
        let {startContainer: start, startOffset: off, endOffset: endOff, endContainer: end, collapsed, commonAncestorContainer: common} = r;
        let li, par;
        li = this.traveler.isBelongTag('LI', start);
        if(e.keyCode === 8){
            let span = this.traveler.isBelongTag('SPAN', common);
            if(span && span === span.parentNode.firstChild){
                if(this.traveler.hasRealText(span)){
                    if(collapsed && off === 1 && start.nodeValue.length === 1 || 
                        !collapsed && off === 0 && start === span.firstChild && endOff === end.nodeValue.length && end === span.lastChild){
                        e.preventDefault();
                        r.selectNodeContents(span);
                        r.deleteContents();
                        if(!span.hasChildNodes()){
                            let br = document.createElement('br');
                            span.appendChild(br);
                        }
                        this.currentRange.setStart(span, 0);
                        this.currentRange.collapse(true);
                    }
                }
                else if(span === span.parentNode.firstChild && span.parentNode.parentNode === this.props.editorNode.firstChild){
                    e.preventDefault();
                }

            }
            if(r.collapsed && off === 0 && li &&
            this.isFirst(li, start) && li === li.parentNode.firstChild){
                e.preventDefault();
                par = li.parentNode;
                if(par.parentNode.nodeName !== 'UL' || par.parentNode.nodeName !== 'OL'){
                    console.log('hahahhaaeee')
                    let p = document.createElement('p');
                    li.remove();
                    r.setStartBefore(par);
                    r.collapse(true);
                    r.insertNode(p);
                    r.selectNodeContents(li);
                    p.appendChild(r.extractContents());
                    this.traveler.handleUnacessedSpan(p.firstChild, true);
                    this.traveler.handleUnacessedSpan(p);
                    r.setStartBefore(p.firstChild)
                    r.collapse(true);
                }
                else{
                    li.remove();
                    par.parentNode.insertBefore(li, par);
                }
                if(!par.hasChildNodes()){
                    par.remove();
                }
            }
            // else if(li){
            //     if(li.firstChild && li.firstChild.nodeName !== 'SPAN'){
            //         //do nothing;
            //     }
            //     else{
            //         if(collapsed && off === 1 && this.traveler.hasRealText(li)){
            //             console.log('hahah')
            //             e.preventDefault();
            //             start.remove();
            //             let span = li.firstChild;
            //             r.selectNodeContents(li);
            //             r.deleteContents();
            //             if(!span.hasChildNodes()){
            //                 let br = document.createElement('br');
            //                 span.appendChild(br);
            //             }
            //             li.appendChild(span)
            //             this.currentRange.setStart(li.firstChild, 0);
            //             this.currentRange.collapse(true);
            //         }
            //         else if(!collapsed && off === 0 && endOff === start.length){
            //             e.preventDefault();
            //             let span = li.firstChild;
            //             let br = document.createElement('br');
            //             span.insertBefore(br, span.firstChild);
            //             r.setStartAfter(br);
            //             this.traveler.reassignRange(r)
            //             r.deleteContents();
            //             this.currentRange.setStartBefore(br);
            //             this.currentRange.collapse(true);
            //         }
            //     }
            // }
        }
        else if(e.keyCode === 13 && (li = this.traveler.isBelongTag('LI', common))){
            par = li.parentNode;
            let grand = par.parentNode;
            !r.collapsed && r.extractContents();
            if(this.traveler.hasRealText(li)){
                if(off === 0 && this.isFirst(li, start) && li === par.firstChild){
                    e.preventDefault();
                    r.setStartBefore(par);
                    r.collapse(true);
                    if(['UL', 'OL'].indexOf(par.parentNode.nodeName) === -1){
                        let br = document.createElement('br');
                        r.insertNode(br);
                    }
                    else{
                        let li1 = document.createElement('li');
                        r.insertNode(li1);
                    }
                    r.setStart(li, 0);
                    r.collapse(true);
                }
                //do nothing
            }
            else if(li === par.firstChild || li === par.lastChild){
                e.preventDefault();
                if(!(this.isBelongTag('UL', par) && this.isBelongTag('OL', par))){
                    let p = document.createElement('p');
                    li === par.firstChild ? r.setStartBefore(par) : r.setStartAfter(par);
                    r.collapse(true);
                    r.insertNode(p);
                    if(li.hasChildNodes()){
                        r.selectNodeContents(li)
                        p.appendChild(r.extractContents())
                    }
                    else {
                        p.appendChild(document.createElement('br'))
                    }
                    r.setStart(p, 0);
                    r.collapse(true);
                    li.remove();
                }
                else{
                    li.remove();
                    li === par.firstChild ? r.setStartBefore(par) : r.setStartAfter(par);
                    r.collapse(true);
                    r.insertNode(li);
                    r.setStart(li, 0);
                    r.collapse(true);
                }
                if(!this.traveler.isRemainLi(par)) par.remove();
            }
            else{
                e.preventDefault();
                r.selectNode(li);
                r.selectNode(this.traveler.splitNodeX(par, r));
                r.deleteContents();
                if(grand.nodeName === 'UL' || grand.nodeName === 'OL'){
                    r.appendChild(li);
                    r.setStart(li, 0);
                }
                else{
                    let p = document.createElement('p');
                    r.insertNode(p);
                    let span;
                    if(li.hasChildNodes() && (span = li.firstChild) && span.nodeName === 'SPAN'){
                        p.appendChild(span);
                        r.setStart(span, 0);
                    }
                    else{
                        p.appendChild(document.createElement('br'));
                        r.setStart(p, 0);
                    }
                }
                r.collapse(true);
            }

        }
        sel.removeAllRanges();
        sel.addRange(r);
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
    cutNode = (range) =>{
        let common = range.commonAncestorContainer;
        if(common.nodeName === 'SPAN' || common.nodeName === '#text'){
            let cc;
            if((cc = this.traveler.isBelongTag('SPAN', common))){
                common = cc;
            }
            !range.collapsed && range.deleteContents();
            let r1 = range.cloneRange();
            r1.setStartBefore(common);
            let ct1 = r1.extractContents()
            let r2 = range.cloneRange();
            r2.setEndAfter(common);
            let ct2 = r2.extractContents()
            if(ct1.firstChild){
                let lst = ct1.lastChild
                r1.insertNode(ct1);
                range.setStartAfter(lst);
                range.collapse(true)
            };
            if(ct2.firstChild){
                let fst = ct2.firstChild;
                r2.insertNode(ct2);
                range.setStartBefore(fst);
                range.collapse(true);
            }
            common.remove();
            return range;
        }
        else if(common.nodeName === 'P'){
            range.deleteContents();
            return range;
        }
        else if(range.collapsed){
            return range;
        }
        return false;
    }
    handleKeyPress = (e) =>{
        let {waitElem} = this.data;
        let sel = document.getSelection();
        if(!sel.rangeCount) return;
        let r = sel.getRangeAt(0);
        let {startContainer, startOffset, commonAncestorContainer: cm} = r;
        // if(startContainer.nodeName !== '#text'){
        //     let n11 = this.traveler.getNthChild(startContainer, startOffset);
        //     let n12 = n11 ? n11.nextSibling : null;
        //     let n01 = n11 ? n11.previousSibling : null;
        //     let n02 = n01 ? n01.previousSibling : null;
        //     setTimeout(()=>{
        //         if(n11 && n11.nodeName === 'BR' && (n12 && ['DIV', 'UL', 'OL'].indexOf(n12.nodeName) > -1)){
        //             n11.remove();
        //         }
        //         if(n01 && n01.nodeName === 'BR' && (n02 && ['DIV', 'UL', 'OL'].indexOf(n02.nodeName) > -1)){
        //             n01.remove();
        //         }
        //     }, 0)

        // }
        if(e.keyCode !== 13 && (startContainer === this.props.editorNode || startContainer.nodeName === 'BLOCKQUOTE')){
            !r.collapsed && this.traveler.reassignRange(r) && r.deleteContents();
            let p = document.createElement('p');
            p.appendChild(document.createElement('br'));
            r.insertNode(p);
            if(p.nextSibling && p.nextSibling.nodeName === 'BR'){
                p.nextSibling.remove();
            }
            r.setStart(p,0);
            r.collapse(true)
        }
        if(waitElem && waitElem.parentNode && e.keyCode !== 13){
            e.preventDefault();
            let text = document.createTextNode(e.key);
            waitElem.appendChild(text);
            let par = waitElem.parentNode;
            if(par.childNodes.length === 2 && par.lastChild.nodeName === 'BR'){
                par.lastChild.remove();
            }
            if(par === this.props.editorNode || par.nodeName === 'BLOCKQUOTE'){
                let p = document.createElement('p');
                par.replaceChild(p, waitElem);
                p.appendChild(waitElem)
            }
            this.currentRange.setStart(text, 1);
            this.currentRange.collapse(true);
            this.repopulateSelection();
            this.data.waitElem = null;
        }
        else if(e.keyCode === 13  && !this.traveler.isBelongTag('LI', startContainer)){
            let range = this.cutNode(r);
            if(range){
                e.preventDefault();
                let {startOffset: off, commonAncestorContainer: cm} = range;
                if(cm.nodeName === 'P'){
                    if(!cm.hasChildNodes() || cm.lastChild.nodeName === 'BR'){
                        let br = document.createElement('br');
                        cm.parentNode.replaceChild(br, cm);
                        range.setStartAfter(br);
                        range.collapse(true);
                        if(!br.nextSibling){
                            br.parentNode.appendChild(document.createElement('br'))
                        }
                    }
                    else{
                        let p = cm.cloneNode(false);
                        range.setEndAfter(cm.lastChild);
                        this.traveler.insertAfter(p, cm);
                        p.appendChild(range.extractContents());
                        this.traveler.handleUnacessedSpan(cm.lastChild, true);
                        this.traveler.handleUnacessedSpan(p.firstChild, true);
                        this.traveler.handleUnacessedSpan(cm);
                        this.traveler.handleUnacessedSpan(p);
                        range.setStart(p, 0);
                        range.collapse(true);
                    }
                }
                else{
                    let bef = this.traveler.getNthChild(cm, off - 1);
                    let af = this.traveler.getNthChild(cm, off);
                    bef = this.traveler.handleUnacessedSpan(bef, true);
                    af = this.traveler.handleUnacessedSpan(af, true);
                    let pr,nx,x,y;
                    if(!this.traveler.isBelongTag('PRE', cm)){
                        if((x = bef && bef.nodeName !== 'BR' && !this.traveler.isBlockElem(bef) && (!(pr = bef.previousSibling) || (pr.nodeName !== '#text' && pr.nodeName !== 'SPAN')))){
                            let p = document.createElement('p');
                            cm.replaceChild(p, bef);
                            p.appendChild(bef);
                            this.traveler.handleUnacessedSpan(p);
                            range.setStartAfter(p);
                            range.collapse(true);
                        }
                        if((y = af && af.nodeName !== 'BR' && !this.traveler.isBlockElem(af) && (!(nx = af.nextSibling) || (nx.nodeName !== '#text' && nx.nodeName !== 'SPAN')))){
                            let p = document.createElement('p');
                            cm.replaceChild(p, af);
                            p.appendChild(af);
                            this.traveler.handleUnacessedSpan(p);
                            range.setStart(p, 0);
                            range.collapse(true);
                        }
                    }
                    if(!y){
                        if(!x){
                            let br = document.createElement('br');
                            range.insertNode(br);
                            range.collapse(false);
                        }
                        if(af){
                            af.nodeName === 'BR' ? range.setStartBefore(af) : range.setStart(af, 0);
                            range.collapse(true)
                        }
                        else{
                            let br = document.createElement('br');
                            range.insertNode(br);
                            range.collapse(true); 
                        }
                    }                   
                }

                this.currentRange = range;
                this.repopulateSelection();
            }
        }


    }

    // addEventListenerForEditor = (editor) =>{
    //     editor.addEventListener('mouseup',this.updateRangeFromSelection);
    //     editor.addEventListener('keypress', this.handleKeyPress);
    //     editor.addEventListener('keydown', this.handleKeyDown);
    //     editor.addEventListener('input', this.handleInput)
    //     // editor.addEventListener('paste', this.handlePasteData);
    // }
    // removeEventListenerForEditor = (editor) =>{
    //     editor.removeEventListener('mouseup', this.updateRangeFromSelection);
    //     editor.removeEventListener('keypress', this.handleKeyPress);
    //     editor.removeEventListener('keydown', this.handleKeyDown);
    //     editor.removeEventListener('input', this.handleInput)
    //     // editor.removeEventListener('paste', this.handlePasteData)
    // }
    repopulateSelection = (bool) =>{
        this.props.editorNode.focus();
        if(!bool){
            let s = document.getSelection()
            s.removeAllRanges();
            s.addRange(this.currentRange);
        }
        this.traveler.checkRange(this.currentRange);
        setTimeout(() =>{
            this.rememberRange(this.currentRange)
        },0)
    }
    changeStyle = ({prop, val}) =>{
        if(!this.currentRange) return;
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
            this.data.waitElem = common;
            this.repopulateSelection(true);
        }
        else{
            this.repopulateSelection();
        }

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
        if(!this.currentRange) return;
        if(this.props.toolbarState.unorder === 2){
            return this.handleUnList()
        }
        if(this.data.waitElem){
            this.data.waitElem = null;
        }
        this.currentRange = this.traveler.convertToList('UL', this.currentRange).cloneRange();
        // let wt = this.data.waitElem, li;
        // if(wt && (li = wt.parentNode).nodeName === 'LI' && li.childNodes.length === 1){
        //     this.data.waitElem = null;
        //     let br = document.createElement('br');
        //     wt.appendChild(br);
        // }
        this.repopulateSelection();
    }
    handleClickOList = () =>{
        if(!this.currentRange) return;
        if(this.props.toolbarState.order === 2){
            return this.handleUnList()
        }
        if(this.data.waitElem){
            this.data.waitElem = null;
        }
        this.currentRange = this.traveler.convertToList('OL', this.currentRange).cloneRange();
        let wt = this.data.waitElem, li;
        // if(wt && (li = wt.parentNode).nodeName === 'LI' && li.childNodes.length === 1){
        //     this.data.waitElem = null;
        //     let br = document.createElement('br');
        //     wt.appendChild(br);
        // }
        this.repopulateSelection();
    }
    handleIncreaseListLevel = ()=>{
        if(!this.currentRange) return;
        let state = this.props.toolbarState;
        if(state.inclevel === 1){
            let type = state.unorder === 2 ? 'UL' : 'OL';
            this.currentRange = this.traveler.increaseListLevel(this.currentRange, type);
            this.repopulateSelection();
        }
    }
    handleDecreaseListLevel = () =>{
        if(!this.currentRange) return;
        let state = this.props.toolbarState;
        if(state.declevel === 1){
            this.currentRange = this.traveler.decreaseListLevel(this.currentRange);
            this.repopulateSelection();
        }
    }
    handleUnList = () =>{
        if(this.props.toolbarState.declevel === 1){
            return this.handleDecreaseListLevel();
        }
        else{
            this.currentRange = this.traveler.unlistMany(this.currentRange);
            this.repopulateSelection();
        }
    }
    handleBlockquote = () =>{
        if(this.props.toolbarState.quote === 2){
            this.currentRange = this.traveler.unQuote(this.currentRange);
        }
        else{
            this.currentRange = this.traveler.convertToBLockquote(this.currentRange);
        }
        this.repopulateSelection()
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
        editor.onmouseup = this.updateRangeFromSelection;
        editor.onkeypress = this.handleKeyPress;
        editor.onkeydown = this.handleKeyDown;
        editor.oninput = this.handleInput;
        // this.addEventListenerForEditor(editor);
        this.props.historyManager.startObserving();
    }
    componentWillUnmount(){
        // this.removeEventListenerForEditor(this.props.editorNode);
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
            handleClickOList: this.handleClickOList,
            handleIncreaseListLevel: this.handleIncreaseListLevel,
            handleDecreaseListLevel: this.handleDecreaseListLevel,
            handleBlockquote: this.handleBlockquote,
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