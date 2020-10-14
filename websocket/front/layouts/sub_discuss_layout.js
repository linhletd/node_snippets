import React from 'react';
import {connect} from 'react-redux';
import {withRouter, Switch, Route, Redirect} from 'react-router-dom';
import TopicDetail from '../pages/topic_detail_comp.js';
import fetchReq from '../utils/xhr';
import PostNewTopic from '../pages/post_topic_comp'
import DiscussContext from '../contexts/discusses';
import TopicTitle from '../pages/topic_title_comp';
import WaittingNotation from '../ui/waitting_notation';
class TopicList extends React.Component{
    shouldComponentUpdate(nextProps){
        if(nextProps.list.size === this.props.list.size){
            return false
        }
        return true;
    }
    render(){
        if(this.props.list.size){
            let list = [...this.props.list.values()];
            let topics = list.map(topic =>{
                return <TopicTitle topic = {topic} key = {topic._id.slice(18)} handleSelectTopic = {this.props.handleSelectTopic}/>
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
            this.fetchInitialData();
            this.refreshDisplayingPost();
            return true;
        }
        if(nextState.topicList.size !== this.state.topicList.size){
            return true
        }
        return false;
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
            this.setState((prevState => {
                let entries = [];
                data.map((cur) =>{
                    entries.push([cur._id, cur])
                })
                let newState = new Map(entries)
                return {topicList: newState}
            }));
        }
        else {
            this.setState((prevState) => {
                let newEntries = [...prevState.topicList];
                newEntries.unshift([data._id, data]);
                return {topicList: new Map(newEntries)};
            })
        }

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
    refreshDisplayingPost = () =>{
        if(!this.state.displayingPosts.size) return;
        let id = [...this.state.displayingPosts.keys()][0];
        this.selectTopic(id);
        //change state of topic board
    }
    fetchInitialData = () =>{
        fetchReq('/discuss/data/titles',{
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
    navigateMessage = () =>{
        let socket = this.props.socket;
            socket.discuss = ({type, payload}) => {

                switch(type){
                    case 'update board':
                        return this.addToTitleBoard(payload);
                    case 'update comment':
                        return this.addComment(payload);
                }
            }
    }
    componentDidMount(){
        this.fetchInitialData();
        this.navigateMessage();
    }
    componentWillUnmount(){
        delete this.props.socket.discuss;
    }
    render(){
        return (
            <DiscussContext.Provider value = {{topicList:this.state.topicList}}>
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
                    <TopicList handleSelectTopic = {this.selectTopic} list = {this.state.topicList}/>
                </div>
            </DiscussContext.Provider>
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