import React from 'react';
import {connect} from 'react-redux';
import UserStatus from './user_status';
import BrowseUserPage from './browse_user_page';
import TimeStamp from './time_stamp_comp';
import sendMsgViaSocket from '../utils/sendMsgViaSocket';
class CommentOrReply extends React.Component{
    constructor(props){
        super();
        this.postBtn = React.createRef();
    }
    componentDidMount(){
        this.postBtn.current.disabled = true;
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
                    if(editorNode.innerText.length){
                        self.postBtn.current.disabled && (self.postBtn.current.disabled = false);
                    }
                    else{
                        !self.postBtn.current.disabled && (self.postBtn.current.disabled = true);
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
                                this.replaceWithText(r.startContainer.parentNode, r);
                                r = document.getSelection().rangeCount && document.getSelection().getRangeAt(0);
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
                return <div ref = {self.commentEdit} className = {self.props.inputClass ? `comment_edit ${self.props.inputClass}` : 'comment_edit'} contentEditable = {true} />
            }
        }
        let mainProps = {filter: this.props.user._id, className: 'tag_board', InputComp: Input};
        let parProps = {className: 'tag_list'};
        let childProps = {childClass: 'user_tiny', click: this.clickTagList};
        return(
            <div className = {'cor'}>
                <UserStatus status = {this.props.user} noName = {true} childClass = {this.props.childClass}/>
                <BrowseUserPage mainProps = {mainProps} parProps = {parProps} childProps = {childProps}/>
                <button ref = {this.postBtn} onClick = {this.props.handlePost}>post</button>
            </div>
        )
    }
}
function mapStateToProps(state){
    return {
        user: state.main.user
    }
}
CommentOrReply = connect(mapStateToProps, null)(CommentOrReply);

class CommentedOrReplied extends React.Component{
    constructor(props){
        super();
        this.node = React.createRef();
    }
    componentDidMount(){
        this.node.current.innerHTML = this.props.data.Content;
    }
    shouldComponentUpdate(){
        return false;
    }
    render(){
        let content = <div ref = {this.node} className = 'comment_cnt'/>;
        return (
            <UserStatus children = {content} status = {{_id: this.props.data.PostedBy}} childClass = {`cored ${this.props.childClass}`}/>
        )
    }
}

class CommentBar extends React.Component{
    constructor(props){
        super();
        this.state = {};
        this.updateState(props.comment);
        this.updateState1(props);
    }
    updateState = (comment) =>{
        this.state.upvoted = comment.UpVotes.length;
        this.state.downvoted = comment.DownVotes.length;
        this.state.replied = comment.Replies.length;
    }
    updateState1 = (props) =>{
        let {comment: {UpVotes, DownVotes}, user: {_id}} = props;
        if(UpVotes.indexOf(_id) > -1){
            this.state.up = true;
            this.state.down = false;
        }
        else if(DownVotes.indexOf(_id) > -1){
            this.state.up = false;
            this.state.down = true;
        }
        else{
            this.state.up = false;
            this.state.down = false;
        }
    }
    upvoteComment = () =>{
        let obj = {
            type: 'c_up',
            payload: {
                topicId: this.props.topic._id,
                commentId: this.props.comment._id
            }
        }
        
        if(this.state.up){
            obj.type = 'c_unup';
            this.state.up = false;
        }
        else if(this.state.down){
            obj.type = 'c_toup';
            this.state.up = true;
            this.state.down = false;
        }
        else{
            this.state.up = true
        }
        sendMsgViaSocket(this.props, JSON.stringify(obj));
    }
    downvoteComment = () =>{
        let obj = {
            type: 'c_down',
            payload: {
                topicId: this.props.topic._id,
                commentId: this.props.comment._id
            }
        }
        if(this.state.down){
            obj.type = 'c_undown';
            this.state.down = false;
        }
        else if(this.state.up){
            obj.type = 'c_todown';
            this.state.down = true;
            this.state.up = false;
        }
        else{
            this.state.down = true;
        }
        sendMsgViaSocket(this.props, JSON.stringify(obj));
    }
    handleClickReplyIcon = (e) =>{
        if(this.props.showReply(true)){
            this.props.showReply();
        }
        else{
            let target = e.target.nodeName === 'I' ? e.target.parentNode : e.target;
            this.props.showReply(()=>{
                let input = target.parentNode.parentNode.querySelector('.comment_edit');
                input.focus();
            })
        }
    }
    shouldComponentUpdate(nextProps){
        if(nextProps.cmtBar && nextProps.cmtBar._id === this.props.comment._id){
            this.updateState(nextProps.comment);
            if(nextProps.cmtBar.o){
                this.updateState1(nextProps);
            }
            return true
        }
        return false;
    }
    render(){
        let {upvoted, downvoted, replied, up, down} = this.state;
        return (
            <div className = 'cmt_idx'>
                <div onClick = {this.upvoteComment}>{up ? <i className="fa fa-thumbs-up"></i> :<i className="fa fa-thumbs-o-up"></i>}{upvoted}</div>
                <div onClick = {this.downvoteComment}>{down ? <i className="fa fa-thumbs-down"></i> :<i className="fa fa-thumbs-o-down"></i>}{downvoted}</div>
                <div onClick = {this.handleClickReplyIcon}><i className="fa fa-reply"></i>{replied}</div>
                <TimeStamp time = {this.props.comment.PostTime}/>
            </div>
        )
    }
}
function mapStateToCMBar(state){
    return {
        cmtBar: state.discuss.cmtBar,
        socket: state.main.socket,
        user: state.main.user
    }
}
CommentBar = connect(mapStateToCMBar, null)(CommentBar);

class Reply extends React.Component{
    constructor(props){
        super();
        this.state = {};
        this.updateState(props.reply);
        this.updateState1(props);
    }
    updateState = (reply) =>{
        this.state.upvoted = reply.UpVotes.length;
        this.state.downvoted = reply.DownVotes.length;
    }
    updateState1 = (props) =>{
        let {reply: {UpVotes, DownVotes}, user: {_id}} = props;
        if(UpVotes.indexOf(_id) > -1){
            this.state.up = true;
            this.state.down = false;
        }
        else if(DownVotes.indexOf(_id) > -1){
            this.state.up = false;
            this.state.down = true;
        }
        else{
            this.state.up = false;
            this.state.down = false;
        }
    }
    upvoteReply = () =>{
        let obj = {
            type: 'r_up',
            payload: {
                replyId: this.props.reply._id,
                topicId: this.props.topic._id,
                commentId: this.props.comment._id
            }
        }
        
        if(this.state.up){
            obj.type = 'r_unup';
            this.state.up = false;
        }
        else if(this.state.down){
            obj.type = 'r_toup';
            this.state.up = false;
            this.state.down = true;
        }
        else{
            this.state.up = true;
        }
        sendMsgViaSocket(this.props, JSON.stringify(obj));
    }
    downvoteReply = () =>{
        let obj = {
            type: 'r_down',
            payload: {
                replyId: this.props.reply._id,
                topicId: this.props.topic._id,
                commentId: this.props.comment._id
            }
        }
        if(this.state.down){
            obj.type = 'r_undown';
        }
        else if(this.state.up){
            obj.type = 'r_todown';
        }
        sendMsgViaSocket(this.props, JSON.stringify(obj));
    }
    shouldComponentUpdate(nextProps){
        if(nextProps.repBar !== this.props.repBar && nextProps.repBar && nextProps.repBar._id === this.props.reply._id){
            this.updateState(nextProps.reply);
            if(nextProps.repBar.o){
                this.updateState1(nextProps);
            }
            return true
        }
        return false;
    }
    render(){
        let {reply} = this.props;
        let {up, down, upvoted, downvoted} = this.state;
        return(
            <div className = {this.props.childClass ? `reply ${this.props.childClass}`: 'reply'}>
                <CommentedOrReplied data = {reply} childClass = 'user_tiny'/>
                <div>
                    <div onClick = {this.upvoteReply}>{up ? <i className="fa fa-thumbs-up"></i> :<i className="fa fa-thumbs-o-up"></i>}{upvoted}</div>
                    <div onClick = {this.downvoteReply}>{down ? <i className="fa fa-thumbs-down"></i> :<i className="fa fa-thumbs-o-down"></i>}{downvoted}</div>
                    <TimeStamp time = {reply.PostTime}/>
                </div>
            </div>
        )
    }
}
function mapStateToReply(state){
    return {
        user: state.main.user,
        socket: state.main.socket,
        repBar: state.discuss.repBar
    }
}
Reply = connect(mapStateToReply, null)(Reply);

class Replies extends React.Component{
    constructor(props){
        super();
        this.endHighLight = false;
    }
    handleReply = (e) =>{
        let button = e.target;
        button.disabled = true;
        let input = button.previousSibling.firstChild;
        let msg = JSON.stringify({
            type: 'reply',
            payload: {
                topicId: this.props.topic._id,
                commentId: this.props.comment._id,
                content: input.innerHTML
            }
        })
        input.innerHTML = '';
        input.focus();
        sendMsgViaSocket(this.props, msg);
    }
    shouldComponentUpdate(nextProps){
        if(nextProps.repSec && nextProps.repSec._id === this.props.comment._id){
            this.endHighLight = true;
            return true;
        }
        return false;
    }
    render(){
        let replies = this.props.replies.map((reply, idx) =>{
            return (
                <Reply topic = {this.props.topic} comment = {this.props.comment} reply = {reply} key = {reply._id.slice(18)} childClass = {this.endHighLight && this.props.replies.length - 1 === idx ? 'cmt_flash': ''}/>
            )
        });
        return(
            <div className = 'reply_section'>
                {replies}
                <CommentOrReply handlePost = {this.handleReply} childClass = {'user_tiny'}/>
            </div>
        )
    }
}
function mapStateToReplies(state){
    return {
        repSec: state.discuss.repSec,
        socket: state.main.socket
    }
}
Replies = connect(mapStateToReplies, null)(Replies);

class Comment extends React.Component{
    constructor(props){
        super();
        this.state = {
            showReply: false
        }
    }
    showReply = (cb) =>{
        if(typeof cb === 'boolean'){
            return this.state.showReply;
        }
        if(this.state.showReply){
            this.setState({showReply: false}, cb)
            return false;
        }
        this.setState({showReply: true}, cb);
        return true;
    }
    render(){   
        return(
            <div className = {this.props.childClass ? `comment ${this.props.childClass}`: 'comment'}>
                <CommentedOrReplied data = {this.props.comment} childClass = 'user_xsmall'/>
                <CommentBar comment = {this.props.comment} showReply = {this.showReply} topic = {this.props.topic}/>
                {this.state.showReply ? <Replies replies = {this.props.comment.Replies} comment = {this.props.comment} topic = {this.props.topic}/> : ''}
            </div>
        )
    }
}

class CommentSection extends React.Component{
    constructor(props){
        super();
        this.state = {
            showAll: false
        }
        this.endHighLight = false;
        this.comment = React.createRef();
        this.show = 2;
    }
    handlePostComment = (e) =>{
        let button = e.target;
        button.disabled = true;
        let input = button.previousSibling.firstChild;
        let msg = JSON.stringify({
            type: 'comment',
            payload: {
                topicId: this.props.topic._id,
                content: input.innerHTML
            }
        })
        sendMsgViaSocket(this.props, msg);
        input.innerHTML = '';
        input.focus();
    }
    handleClickShowAll = () =>{
        this.setState({
            showAll: true
        })
    }
    shouldComponentUpdate(nextProps){
        if(nextProps.comment !== this.props.comment){
            this.endHighLight = true;
            this.show++;
        }
        else{
            this.endHighLight = false;
        }
        return true;
    }
    render(){
        let {Comments} = this.props.topic;
        let x;
        if((x = Comments.length - this.show) > 0 && !this.state.showAll){
            Comments = Comments.slice(x)
        }
        else{
            this.state.showAll = true;
        }
        let comments = Comments.map((comment, idx) =>{
            if(idx === Comments.length - 1){
                return <Comment comment = {comment} topic = {this.props.topic} key = {comment._id.slice(18)} childClass = {this.endHighLight ? 'cmt_flash': ''}/>
            }
            return <Comment comment = {comment} topic = {this.props.topic} key = {comment._id.slice(18)}/>
        })
        return(
            <div className = 'comment_section' ref = {this.comment}>
                {x >= 1 && !this.state.showAll ? <div className = 'cmt_plus' onClick = {this.handleClickShowAll}>{x > 1 ? `Show all (+${x} comments)` : `Show all (+${x} comment)`}</div> : ''}
                {comments}
                <CommentOrReply handlePost = {this.handlePostComment} inputClass = 'comment_input' childClass = {'user_xsmall'}/>
            </div>
        )
    }
}
function mapStateToCSProps(state){
    return {
        comment: state.discuss.comment,
        socket: state.main.socket
    }
}
export default connect(mapStateToCSProps, null)(CommentSection);