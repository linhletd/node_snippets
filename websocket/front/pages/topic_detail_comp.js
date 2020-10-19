import React from 'react';
import TopicTitle from './topic_title_comp';
import fetchReq from '../utils/xhr';
import WaittingNotation from '../ui/waitting_notation';
import CommentSection from './comment_section_comp';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import sendMsgViaSocket from '../utils/sendMsgViaSocket';
import { TitleContext } from '../contexts/discusses';
class Bar extends React.Component{
    constructor(){
        super();
        this.state = {
            x: true
        }
    }
    handleClickUpvote = () =>{
        let {barInfo} = this.props;
        let obj = {
            type: 'upvote',
            payload: this.props.topic._id
        }
        
        if(barInfo.upvoted){
            obj.type = 'unupvote';
            barInfo.upvoted = false;
        }
        else if(barInfo.downvoted){
            obj.type = 'toupvote';
            barInfo.downvoted = false;
            barInfo.upvoted = true;
        }
        else{
            barInfo.upvoted = true;
        }
        this.setState({x: !this.state.x})
        sendMsgViaSocket(this.props, JSON.stringify(obj))
    }
    handleClickDownvote = () =>{
        let {barInfo} = this.props;
        let obj = {
            type: 'downvote',
            payload: this.props.topic._id
        }
        
        if(barInfo.downvoted){
            obj.type = 'undownvote';
            barInfo.downvoted = false;
        }
        else if(barInfo.upvoted){
            obj.type = 'todownvote';
            barInfo.upvoted = false;
            barInfo.downvoted = true;
        }
        else{
            barInfo.downvoted = true;
        }
        this.setState({x: !this.state.x})
        sendMsgViaSocket(this.props, JSON.stringify(obj))
    }
    handleClickComment = () =>{
        let input = document.querySelector('.comment_input');
        if(!input.hasChildNodes()){
            input.focus();
        }
        else{
            let r = new Range();
            let sel = document.getSelection();
            sel.removeAllRanges();
            let last = input.lastChild;
            if(last.nodeName === 'BR' && last.previousSibling && last.previousSibling.nodeName !== 'BR'){
                last = last.previousSibling;
            }
            else if(last.nodeName === 'BR'){
                r.setStartBefore(last);
                r.collapse(true);
                sel.addRange(r);
                return;
            }
            if(last.nodeName === '#text'){
                r.setStart(last, last.nodeValue.length);
            }
            else if(last.nodeName === 'A'){
                r.setStartAfter(last);
            }
            else{
                try{
                    r.setStart(last.lastChild, last.lastChild.nodeValue.length)
                }
                catch{
                    r.setStartAfter(last);
                }
            }
            r.collapse(true);
            sel.addRange(r);
        }

        input.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"})
    }
    render(){
        let {barInfo} = this.props;
        return(
            <div className = 'topic_thumb'>
                <div onClick = {this.handleClickUpvote}>{barInfo.upvoted ? <i style = {{color: 'green'}} className="fa fa-thumbs-up"></i> :<i className="fa fa-thumbs-o-up"></i>}&nbsp;Upvote</div>
                <div onClick = {this.handleClickDownvote}>{barInfo.downvoted ? <i style = {{color: 'green'}} className="fa fa-thumbs-down"></i> :<i className="fa fa-thumbs-o-down"></i>}&nbsp;Downvote</div>
                <div onClick = {this.handleClickComment}><i className="fa fa-comment-o"></i>&nbsp;Comment</div>
            </div>
        )
    }
}
function mapStateToBarProps(state){
    return {
        bar: state.discuss.topicBar,
        socket: state.main.socket,
        user: state.main.user,
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateStore: function(action){
            dispatch(action);
        }
    }
}
Bar = connect(mapStateToBarProps, mapDispatchToProps)(Bar);
class Topic extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            topic: null
        }
    }
    handleComment(e){
        e.preventDefault();
        let clickedButton = e.target;
        let questionID = clickedButton.parentNode.parentNode.id;
        let inputField = clickedButton.previousElementSibling;
        let body = `comment=${inputField.value}&id=${questionID}`;
        fetch('/discuss/comment',{
            method: 'post',
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body
        }).then((res) => {
            if(res.redirected){
                return {err: 'session ended'}
            }
            return res.json();
        })
        .catch(e =>({err: e.message}))
        .then((data) =>{
            if(data.err === 'session ended'){
               return this.props.history.replace('/auth/login');
            }
        })
    }
    getTopicContent = (nextProps) =>{
        let {search} = nextProps ? nextProps.location : this.props.location;
        let match = search.match(/\?id=(\w{24})\b/);
        let _getTopic = (socketId) =>{
            try{
                let id = match[1];
                if(id && (!this.state.topic || id !== this.state.topic._id)){
                    let path = '/discuss/data/content/' + id;
                    let url = socketId ? path + `?s=${socketId}`: path;
                    fetchReq(url, {method: 'get'})
                    .then((topic) => {
                        this.setState({topic}, () =>{
                            document.getElementById('content_ctn').innerHTML = topic.Content;
                        })
                    })
                    document.getElementById('topic_ctn').scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"})
                }
                else{
                    throw new Error('error')
                }
            }
            catch(e){
                console.log(e)
                this.props.history.replace('/discuss')
            }
        }
        let {socket} = this.props;
        if(socket && socket.id){
            _getTopic(socket.id)
        }
        else if(match && match[1]){
            let msg = JSON.stringify({
                type: 'otopic',
                payload: match[1]
            });
            sendMsgViaSocket(nextProps || this.props, msg, _getTopic);
        }
    }
    componentDidMount(){
        if(!this.state.topic){
            this.getTopicContent()
        }
    }
    componentWillUnmount(){
        let msg = JSON.stringify({
            type: 'xtopic'
        })
        sendMsgViaSocket(this.props, msg)
    }
    shouldComponentUpdate(nextProps, nextState){
        let newSocket = nextProps.socket;
        if(newSocket && newSocket !== this.props.socket){
            this.getTopicContent();
            this.state.topic = null;
        }
        if(nextState.topic && (!this.state.topic || nextState.topic._id !== this.state.topic._id)){
            return true;
        }
        if(nextProps.location.search !== this.props.location.search){
            this.getTopicContent(nextProps);
        }
        return false;
    }
    render(){
        let {topic} = this.state;
        if(topic){
            this.context.topic = topic;
            let barInfo = {};
            if(topic.UpVotes.indexOf(this.props.user._id) > -1){
                barInfo.upvoted = true;
            }
            else if(topic.DownVotes.indexOf(this.props.user._id) > -1){
                barInfo.downvoted = true;
            }
            this.context.bar = barInfo;
            return (
                <div id = 'topic_ctn' key = {1}>
                    <TopicTitle authorName = {true} topic = {{_id: topic._id}}/>
                    <div id = 'content_ctn'/>
                    <Bar barInfo = {barInfo} topic = {topic}/>
                    <CommentSection topic = {topic}/>
                </div>
            );
        }
        else{
            return (
                <div id = 'topic_ctn' key = {2}>
                    <WaittingNotation autoStop = {true}/>
                </div>
            );
        }

    }
}
Topic.contextType = TitleContext;
function mapStateToProps(state){
    return {
        user: state.main.user,
        socket: state.main.socket
    }
}
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Topic))