import React from 'react';
import TopicTitle from './topic_title_comp';
import fetchReq from '../utils/xhr';
import WaittingNotation from '../ui/waitting_notation';
import CommentSection from './comment_section_comp';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import sendMsgViaSocket, {focusOnInput} from '../utils/sendMsgViaSocket';
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
        focusOnInput(input);
        input.scrollIntoView({behavior: "smooth", block: "start", inline: "nearest"})
    }
    render(){
        let {barInfo} = this.props;
        return(
            <div className = 'topic_thumb'>
                <div onClick = {this.handleClickUpvote}>{barInfo.upvoted ? <i className="fa fa-thumbs-up"></i> :<i className="fa fa-thumbs-o-up"></i>}&nbsp;Upvote</div>
                <div onClick = {this.handleClickDownvote}>{barInfo.downvoted ? <i className="fa fa-thumbs-down"></i> :<i className="fa fa-thumbs-o-down"></i>}&nbsp;Downvote</div>
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
            topic: null,
            err: null
        }
    }
    getTopicContent = (nextProps) =>{
        let {search} = nextProps ? nextProps.location : this.props.location;
        let match = search.match(/\?id=(\w{24})\b/);
        if(!match){
            return this.props.history.replace('/discuss')
        }
        let _getTopic = (socketId) =>{
            let id = match[1];
            if(id && (!this.state.topic || id !== this.state.topic._id)){
                let path = '/discuss/data/content/' + id;
                let url = socketId ? path + `?s=${socketId}`: path;
                fetchReq(url, {method: 'get'})
                .then((topic) => {
                    console.log(topic)
                    if(topic && topic.Content){
                        this.setState({topic, err: null}, () =>{
                            document.getElementById('content_ctn').innerHTML = topic.Content;
                            window.scrollTo(0, 0);
                        })
                    }
                    else{
                        this.setState({
                            topic: null,
                            err: topic.err
                        })
                    }
                })
            }
            else{
                throw new Error('error')
            }
        }
        let {socket} = this.props;
        if(socket && socket.id && socket.readyState === 1){
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
        if(nextState.topic !== this.state.topic || nextState.err !== this.state.err){
            return true;
        }
        if(nextProps.location.search !== this.props.location.search){
            this.setState({topic: null});
            this.context.topic = null;
            this.context.barInfo = null;
            this.getTopicContent(nextProps);
        }
        return false;
    }
    render(){
        let {topic, err} = this.state;
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
                <div id = 'topic_ctn'>
                    <TopicTitle authorName = {true} topic = {{_id: topic._id}}/>
                    <div id = 'content_ctn' className = 'editor_area'/>
                    <Bar barInfo = {barInfo} topic = {topic}/>
                    <CommentSection topic = {topic}/>
                </div>
            );
        }
        else if(err){
            return <p id = 'topic_err' className = 'fb_msg'>{err}</p>
        }
        else{
            return (
                <div id = 'topic_wait' key = {2}>
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