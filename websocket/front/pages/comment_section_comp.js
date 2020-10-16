import React from 'react';
import {connect} from 'react-redux';
import UserStatus from './user_status';
import BrowseUserPage from './browse_user_page';
import { render } from 'timeago.js';
class PostOrReplyComment extends React.Component{
    constructor(props){
        super()
    }
    componentDidMount(){

    }
    selectTotag = (node) =>{
        if(node === this.selecting) return;
        else if(this.selecting){
            this.selecting.classList.remove('tag_select');
        }
        this.selecting = node;
        node.classList.add('tag_select');
        node.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"})
    }
    clickTagList = (e) =>{
        let target = e.target;
        if(target.nodeName === 'a'){
            return;
        }
        while(!target.parentNode.classList.contains('tag_list')){
            target = target.parentNode;
        }
        this.selectTotag(target);
        this.tagSelectedUser();
    }
    tagSelectedUser = () =>{
        let a = this.selecting.querySelector('a').cloneNode(true);
        a.className = 'tag_name';
        a.innerText = '@' + a.innerText;
        let {start, off, strLen} = this.pos;
        let r = new Range();
        if(strLen === start.nodeValue.length){
            r.selectNode(start);
        }
        else{
            if(off === start.nodeValue.length){
                r.setEndAfter(start);
            }
            else{
                r.setEnd(start, off)
            }
            r.setStart(start, off - strLen);
        }
        r.extractContents();
        r.insertNode(a);
        r.collapse(false);
        let sel = document.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
        this.selecting = null;
        this.foreignerSetState({filterText: '', showBoard: false})

    }
    render(){
        let self = this;
        class Input extends React.Component{
            constructor(props){
                super();
                self.commentEdit = React.createRef();
                this.tagging = null;
            }
            replaceWithText(node, r){
                if(!node.parentNode){
                    return;
                }
                let a;
                let text = document.createTextNode(node.innerText),
                    off = r.startOffset;
                if((a = node.previousSibling) && a.nodeName === '#text'){
                    off = a.nodeValue.length + off;
                    a.nodeValue += text.nodeValue;
                    text = a;
                }
                if((a = node.nextSibling) && a.nodeName === '#text'){
                    text.nodeValue += a.nodeValue;
                    a.remove();
                }
                if(!text.parentNode){
                    node.parentNode.replaceChild(text, node);
                }
                else{
                    node.remove();
                }
                r.setStart(text, off);
                r.collapse(true);
                let sel = document.getSelection();
                sel.removeAllRanges();
                sel.addRange(r)
                
            }
            showTagList(text){
                let sel = document.getSelection();
                if(sel.rangeCount){
                    let r = sel.getRangeAt(0);
                    !r.collapsed && r.collapse(false);
                    let rect = r.getBoundingClientRect();
                    let rect1 = self.commentEdit.current.getBoundingClientRect();
                    self.foreignerSetState({filterText: text, showBoard: true},()=>{
                        let x = rect.x - rect1.x,
                            y = rect.y - rect1.y,
                            adjusted = 0;
                        if(innerWidth - rect.x < 190){
                            adjusted = 190 - (innerWidth - rect.x)
                        }
                        self.commentEdit.current.nextSibling.style.top = (y + 20) + 'px';
                        self.commentEdit.current.nextSibling.style.left = (x - adjusted) + 'px';
                    })
                }
            }
            insertTempAnchor = (r) =>{
                let a = document.createElement('span');
                a.className = 'temp_tag';
                let text = r.extractContents();
                a.appendChild(text);
                r.insertNode(a);
                r.setStart(a.firstChild, a.firstChild.nodeValue.length);
                r.collapse(true);
                let sel = document.getSelection();
                sel.removeAllRanges();
                sel.addRange(r)
                this.showTagList(a.innerText.slice(1))
            }
            taggingIdentify = () =>{
                let sel = document.getSelection();
                if(sel.rangeCount){
                    let r = sel.getRangeAt(0);
                    r.collapse(false);
                    let {startContainer: start, startOffset: off} = r;
                    if(start.nodeName === '#text' && start.parentNode === self.commentEdit.current){
                        let str;
                        if(off > 50){
                            str = start.nodeValue.slice(off - 50, off);
                        }
                        else{
                            str = start.nodeValue.slice(0, off);
                        }
                        if(str = str.match(/@([^@]+)$/)){
                            self.foreignerSetState({filterText: str[1], showBoard: true},()=>{
                                let next;
                                if((next = self.commentEdit.current.nextSibling) && next.hasChildNodes()){
                                    self.selectTotag(next.firstChild);
                                    !r.collapsed && r.collapse(false);
                                    let rect = r.getBoundingClientRect();
                                    let rect1 = self.commentEdit.current.getBoundingClientRect();
                                    let x = rect.x - rect1.x,
                                        y = rect.y - rect1.y,
                                        adjusted = 0;
                                    if(innerWidth - rect.x < 190){
                                        adjusted = 190 - (innerWidth - rect.x)
                                    }
                                    self.commentEdit.current.nextSibling.style.top = (y + 20) + 'px';
                                    self.commentEdit.current.nextSibling.style.left = (x - adjusted) + 'px';
                                    self.pos = {
                                        start,
                                        strLen: str[1].length + 1,
                                        off
                                    };
                                }
                                else{
                                    self.selecting = null;
                                }
                            })
                        }
                        else if(this.props.state.showBoard){
                            self.foreignerSetState({filterText: '', showBoard: false})
                        }
                    }
                    return r;
                }
            }
            escapeTagList = (e) =>{
                if(this.props.state.showBoard && e.key === 'Escape'){
                    self.foreignerSetState({showBoard: false});
                    return;
                }
            }
            componentWillUnmount(){
                window.removeEventListener('keydown', this.escapeTagList)
            }
            componentDidMount(){
                window.addEventListener('keydown', this.escapeTagList)
                let changeTagBoard = this.props.setState;
                self.foreignerSetState = changeTagBoard;
                let editorNode = self.commentEdit.current;
                editorNode.onpaste = (e) =>{
                    let clipboard = e.clipboardData;
                    let types = clipboard.types;
                    if(types.indexOf('Files') > -1){
                        e.preventDefault();
                    }
                }
                editorNode.oninput = (e) =>{
                    let r = this.taggingIdentify();
                    if(r && r.startContainer.parentNode.nodeName === 'A'){
                        this.replaceWithText(r.startContainer.parentNode, r);
                    }
                }
                editorNode.onkeydown = (e) =>{
                    if(self.selecting && (e.key === 'ArrowUp' || e.key === 'ArrowDown')){
                        e.preventDefault();
                        if(e.key === 'ArrowUp'){
                            let up;
                            if(self.selecting.previousSibling){
                                up = self.selecting.previousSibling;
                            }
                            else{
                                up = self.selecting.parentNode.lastChild;
                            }
                            self.selectTotag(up);
                        }
                        if(e.key === 'ArrowDown'){
                            let down;
                            if(self.selecting.nextSibling){
                                down = self.selecting.nextSibling;
                            }
                            else{
                                down = self.selecting.parentNode.firstChild;
                            }
                            self.selectTotag(down);
                        }
                        return;
                    }
                    if(e.key === 'Enter'){
                        e.preventDefault();
                        if(self.selecting){
                            self.selecting.click();
                        }
                        else{
                            let r = document.getSelection().rangeCount && document.getSelection().getRangeAt(0);
                            if(r && r.startContainer.parentNode.className === 'tag_name'){
                                console.log('ahahha')
                                this.replaceWithText(r.startContainer.parentNode, r);
                                r = document.getSelection().rangeCount && document.getSelection().getRangeAt(0);
                                console.log(r)
                            }
                            if(r){
                                r.deleteContents();
                                let text = r.startContainer;
                                if(text.nodeName === '#text' && r.startOffset === text.nodeValue.length){
                                    r.setStartAfter(text);
                                    r.collapse(true);
                                }
                                let br1 = document.createElement('br');
                                r.insertNode(br1);
                                r.collapse(false)
                                if(!br1.nextSibling){
                                    r.insertNode(br1.cloneNode())
                                    r.collapse(true)
                                }
                            }
                        }
                        return;
                    }
                    if(e.key.slice(0, 5) === 'Arrow'){
                        setTimeout(()=>{
                            this.taggingIdentify()
                        }, 0)
                    }
                }
                editorNode.onclick = this.taggingIdentify
            }
            shouldComponentUpdate(){
                return false;
            }
            render(){
                return <div ref = {self.commentEdit} className = 'comment_edit' contentEditable = {true}/>
            }
        }
        let mainProps = {filter: this.props.user._id, className: 'tag_board', InputComp: Input};
        let parProps = {className: 'tag_list'};
        let childProps = {childClass: 'user_tiny', click: this.clickTagList};
        return(
            <div className = {'porc' + ' ' + this.props.type}>
                <UserStatus status = {this.props.user} noName = {true} childClass = 'user_xsmall'/>
                <BrowseUserPage mainProps = {mainProps} parProps = {parProps} childProps = {childProps}/>
                <button>post</button>
            </div>
        )
    }
}
class PostedCommentIndex extends React.Component{
    render(){
        return (
            <div>
                <button>up</button>
                <button>down</button>
                <button>reply</button>
            </div>
        )
    }
}
class PostedCommentContent extends React.Component{
    constructor(props){
        super();
        this.comment = React.createRef();
    }
    componentDidMount(){
        this.comment.current.innerHTML = this.props.comment.Content;
    }
    shouldComponentUpdate(){
        return false;
    }
    render(){
        return(
            <div ref = {this.comment} className = 'comment_cnt'/>
        )
    }
}
class PostedComment extends React.Component{
    render(){
        return (
            <div>
                <UserStatus children = {PostedCommentContent} status = {{_id: this.props.comment.PostedBy}}/>
                <PostedCommentIndex comment = {this.props.comment}/>
            </div>
        )
    }
}
function mapStateToProps(state){
    return {
        user: state.main.user
    }
}
export default connect(mapStateToProps, null)(CommentSection)