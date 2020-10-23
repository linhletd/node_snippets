import React from 'react';
import {connect} from 'react-redux';
import {withRouter, Switch, Route, Redirect} from 'react-router-dom';
import TopicDetail from '../pages/topic_detail_comp.js';
import fetchReq from '../utils/xhr';
import PostNewTopic from '../pages/post_topic_comp'
import {TitleContext} from '../contexts/discusses';
import TopicTitle from '../pages/topic_title_comp';
import WaittingNotation from '../ui/waitting_notation';
import sendMsgViaSocket from '../utils/sendMsgViaSocket';
class TopicList extends React.Component{
    constructor(){
        super();
        this.checked = false;
    }
    componentDidUpdate(){
        if(this.props.state.topicList.size && this.checked){
            let f = document.getElementById('browse_topic').firstChild;
            f.classList.add('cmt_flash');
            setTimeout(()=>{
                f.classList.remove('cmt_flash');
            }, 4000)
        }
        else if(this.props.state.topicList.size && !this.checked){
            this.checked = true;
        }
    }
    render(){
        if(this.props.state.topicList.size){
            let list = [...this.props.state.topicList.values()];
            let topics = list.map(topic =>{
                return <TopicTitle topic = {topic} key = {topic._id.slice(18)} handleSelectTopic = {this.props.handleSelectTopic} />
            });
            return (
                <div id = 'browse_topic'>
                    {topics}
                </div>
            )
        }
        else{
            return <WaittingNotation autoStop = {true}/>
        }
    }
}
function mapTopicProps(state){
    return {
        title: state.discuss.titleList
    }
}
TopicList = connect(mapTopicProps, null)(TopicList);
class SubDiscussLayout extends React.Component{
    constructor(props){
        super();
        this.state = {
            topicList: new Map(),
        }
        this.selectedTitle = null;
    }
    shouldComponentUpdate(nextProps, nextState){
        let newSocket = nextProps.socket;
        if(newSocket && newSocket !== this.props.socket){
            this.navigateMessage();
            this.fetchInitialData(nextProps);
        }
        return true;
    }
    addToDisplay = (question, isNew) => {
        this.setState((prevState) => {
            if(!isNew){
                prevState.displayingPosts.delete(question._id);
            }
            let newState = [...prevState.displayingPosts];
            newState.unshift([question._id, question]);
            return {displayingPosts: new Map(newState)};

        });
    }
    addComment = (comment) =>{
        let id = comment.tid;
        let val = this.state.displayingPosts.get(id);
        val ? this.setState((prevState) => {
            let modified = Object.assign({},val);
            modified.Comments.push(comment);
            let newState = new Map([...prevState.displayingPosts]);
            newState.set(id, modified)
            return {displayingPosts: newState}
        }) : "";
        let val1 = this.state.topicList.get(id);
        val1 ? this.setState((prevState) =>{
            let modified = Object.assign({},val1);
            modified.Comment++;
            let newState = new Map([...prevState.displayingPosts]);
            newState.set(id, modified)
            return {topicList: newState}
        }) : ""
    }
    addToTitleBoard = (data) =>{
        if(Array.isArray(data)){
            // this.setState((prevState => {
                let entries = [];
                data.map((cur) =>{
                    entries.push([cur._id, cur])
                })
                this.state.topicList = new Map(entries)
            //     return {topicList: newState}
            // }));
        }
        else {
            // this.setState((prevState) => {
                let newEntries = [...this.state.topicList];
                newEntries.unshift([data._id, data]);
                this.state.topicList = new Map(newEntries)
            //     return {topicList: new Map(newEntries)};
            // })
        }
        this.props.updateStore({
            type: 'TITLEBOARD'
        })
    }
    selectTopic = (e) =>{
        let id;
        if(typeof e === 'string'){
            id = e;
        }
        else if(e.target.nodeName === 'a'){
            return;
        }
        else{
            e.preventDefault();
            let target = e.target;
            while(!target.id){
                target = target.parentNode;
            }
            if(target === this.selectedTitle){
                return;
            }
            id = target.id.slice(4); //id='list{id}'
            if(this.selectedTitle){
                this.selectedTitle.classList.remove('selected_title');
            }
            target.classList.add('selected_title');
            this.selectedTitle = target;
        }
        if(this.props.location.pathname !== '/discuss/detail'){
            this.props.history.push(`/discuss/detail?id=${id}`);
        }
        else{
            this.props.history.replace(`/discuss/detail?id=${id}`);
        }
    }
    fetchInitialData = (nextProps) =>{
        let path = '/discuss/data/titles';
        let {socket} = this.props;
        let url = path;
        if(socket && socket.id){
            url = path + `?s=${socket.id}`;
        }
        else{
            let msg =JSON.stringify({
                type: 'odiscuss',
            });
            sendMsgViaSocket(nextProps || this.props, msg)
        }
        fetchReq(url,{
            method: 'get'
        }).then(({data}) =>{
            if(data && !data.err){
                this.addToTitleBoard(data);
            }
            else {
                //
            }
        })
    }
    updateTitleIndex = (payload, _id) =>{
        let topic = this.state.topicList.get(_id);
        Object.keys(payload).map((key) =>{
            topic[key] += payload[key];
        })
    }
    navigateMessage = () =>{
        let socket = this.props.socket;
        socket.discuss = ({type, payload, _id}) => {
            switch(type){
                case 'update board':
                    return this.addToTitleBoard(payload);
                case 'topictitle':
                    console.log(type, 1);
                    this.updateTitleIndex(payload, _id)
                    this.props.updateStore({
                        type: 'TOPICTITLE',
                        data: {_id}
                    });
                    return;
                case 'topicbar':
                    if(this.state.topic && this.state.topic._id === _id && this.state.bar){
                        let {user, upvoted, downvoted} = payload;
                        let {topic: {UpVotes, DownVotes}} = this.state;
                        let idx1 = UpVotes.indexOf(user);
                        let idx2 = DownVotes.indexOf(user);
                        if(upvoted){
                            idx1 === -1 && UpVotes.push(user);
                            idx2 > -1 && DownVotes.splice(idx2, 1)
                        }
                        else if(downvoted){
                            idx1 > -1 && UpVotes.splice(idx1, 1);
                            idx2 === -1 && DownVotes.push(user)
                        }
                        else{
                            idx1 > -1 && UpVotes.splice(idx1, 1);
                            idx2 > -1 && DownVotes.splice(idx2, 1);
                        }
                        if(user === this.props.user._id){
                            delete payload.user;
                            Object.assign(this.state.bar, payload);
                            this.props.updateStore({
                                type: 'TOPICBAR',
                                data: {_id}
                            });
                        }
                    }
                    return;
                case 'comment':
                    if(this.state.topic && this.state.topic._id === _id){
                        this.state.topic.Comments.push(payload);
                        this.props.updateStore({
                            type: 'COMMENT'
                        })
                    }
                    return;
                case 'cmtbar':
                    if(this.state.topic){
                        let {Comments} = this.state.topic;
                        let comment = (()=>{
                            for(let i = 0; i < Comments.length; i++){
                                if(Comments[i]._id === _id){
                                    return Comments[i]
                                }
                            }
                        })();
                        if(!comment) return;
                        let {UpVotes, DownVotes} = comment;
                        let {user, upvoted, downvoted} = payload;
                        if(upvoted){
                            UpVotes.push(user);
                        }
                        if(downvoted){
                            DownVotes.push(user);
                        }
                        if(upvoted === false){
                            UpVotes.splice(UpVotes.indexOf(user), 1)
                        }
                        if(downvoted === false){
                            DownVotes.splice(DownVotes.indexOf(user), 1)
                        }
                        let action = {
                            type: 'COMMENTBAR',
                            data: {
                                _id
                            }
                        }
                        if(user === this.props.user._id){
                            action.data.o = true;
                        }
                        this.props.updateStore(action);
                        return;
                    }
                case 'reply':
                    if(this.state.topic){
                        let {Comments} = this.state.topic;
                        let comment = (()=>{
                            for(let i = 0; i < Comments.length; i++){
                                if(Comments[i]._id === _id){
                                    return Comments[i]
                                }
                            }
                        })();
                        if(comment){
                            comment.Replies.push(payload);
                            let data = {_id}
                            this.props.updateStore({
                                type: 'REPSEC',
                                data
                            });
                            this.props.updateStore({
                                type: 'COMMENTBAR',
                                data
                            })
                        }
                    }
                case 'repbar':
                    console.log(1)
                    if(this.state.topic){
                        let {Comments} = this.state.topic;
                        let {user, upvoted, downvoted, cmtId} = payload;
                        let reply = (()=>{
                            for(let i = 0; i < Comments.length; i++){
                                if(Comments[i]._id === cmtId){
                                    let replies = Comments[i].Replies;
                                    for(let j = 0; j < replies.length; j++){
                                        if(replies[j]._id === _id){
                                            return replies[j];
                                        }
                                    }
                                }
                            }
                        })();
                        if(!reply) return;
                        let {UpVotes, DownVotes} = reply;
                        if(upvoted){
                            UpVotes.push(user);
                        }
                        if(downvoted){
                            DownVotes.push(user);
                        }
                        if(upvoted === false){
                            UpVotes.splice(UpVotes.indexOf(user), 1)
                        }
                        if(downvoted === false){
                            DownVotes.splice(DownVotes.indexOf(user), 1)
                        }
                        let action = {
                            type: 'REPBAR',
                            data: {
                                _id
                            }
                        }
                        if(user === this.props.user._id){
                            action.data.o = true;
                        }
                        this.props.updateStore(action);
                        return;
                    }
            }
        }
    }
    componentDidMount(){
        this.fetchInitialData();
        this.navigateMessage();
    }
    componentWillUnmount(){
        let msg = JSON.stringify({
            type: 'xdiscuss'
        })
        sendMsgViaSocket(this.props, msg);
        delete this.props.socket.discuss;
    }
    render(){
        return (
            <TitleContext.Provider value = {this.state}>
                <div id = "discuss_layout">
                    <Switch>
                        <Route exact path = '/discuss'>
                            <PostNewTopic/>
                        </Route>
                        <Route path = '/discuss/detail'>
                            <TopicDetail/>
                        </Route>
                        <Redirect to = '/discuss'/>
                    </Switch>
                    <TopicList handleSelectTopic = {this.selectTopic} state = {this.state}/>
                </div>
            </TitleContext.Provider>
        )
    }

}
function mapDispatchToProps(dispatch){
    return {
        updateStore: function(action){
            dispatch(action);
        }
    }
}
function mapStateToProps(state, ownProp){
    return {
        user: state.main.user,
        socket: state.main.socket,
    }
}
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SubDiscussLayout));