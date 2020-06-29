import React from 'react';
import DiscussPage from '../pages/discuss_page.js';
import BrowseQuestionPage from '../pages/browse_question_page.js';
import fetchReq from '../utils/xhr'
class SubDiscussLayout extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            displayingPosts: new Map(),
            questionsList: new Map(),
        }
        this.addToDisplay = this.addToDisplay.bind(this);
        this.addToTitleBoard = this.addToTitleBoard.bind(this);
        this.addComment = this.addComment.bind(this);
    }
    static timer = undefined
    postTopic(e){
        e.preventDefault();
        let clickedButton = e.target;
        let inputField = clickedButton.previousElementSibling;
        let bodyData = {question: inputField.value};
        fetch('/discuss/post_topic',{
            body: JSON.stringify(bodyData),
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then((res) => {
            if(res.redirected){
                return {err: 'session ended'}
            }
            return res.json();
        })
        .then((question) =>{
            if(question.err === 'session ended'){
               return this.props.history.replace('/auth/login');
            }
            this.addToDisplay(question, true);
        })
    }
    addToDisplay(question, isNew){
        this.setState((prevState) => {
            if(!isNew){
                prevState.displayingPosts.delete(question._id);
            }
            let newState = [...prevState.displayingPosts];
            newState.unshift([question._id, question]);
            return {displayingPosts: new Map(newState)};

        });
    }
    addComment(comment){
        let id = comment.tid;
        let val = this.state.displayingPosts.get(id);
        val ? this.setState((prevState) => {
            let modified = Object.assign({},val);
            modified.Comments.push(comment);
            let newState = new Map([...prevState.displayingPosts]);
            newState.set(id, modified)
            return {displayingPosts: newState}
        }) : "";
        let val1 = this.state.questionsList.get(id);
        val1 ? this.setState((prevState) =>{
            let modified = Object.assign({},val1);
            modified.Comment++;
            let newState = new Map([...prevState.displayingPosts]);
            newState.set(id, modified)
            return {questionsList: newState}
        }) : ""
    }
    addToTitleBoard(data){
        if(Array.isArray(data)){
            this.setState((prevState => {
                let entries = [];
                data.map((cur) =>{
                    entries.push([cur._id, cur])
                })
                let newState = new Map(entries)
                return {questionsList: newState}
            }));
        }
        else {
            this.setState((prevState) => {
                let newEntries = [...prevState.questionsList];
                newEntries.unshift([data._id, data]);
                return {questionsList: new Map(newEntries)};
            })
        }

    }
    selectTopic(e){
        e.preventDefault();
        let target = e.target;
        let id = (target.id || target.parentNode.id || target.parentNode.parentNode.id).slice(4); //id='side{id}'
        fetchReq('/discuss/data/content/' + id, {method: 'get'})
        .then((data) => {
            this.addToDisplay(data);
        })
    }
    fetchInitialData(){
        fetchReq('/discuss/data/titles',{
            method: 'get'
        }).then(({data}) =>{
            if(data && !data.err){
                this.addToTitleBoard(data);
                // SubDiscussLayout.timer && clearTimeout(SubDiscussLayout.timer);
            }
            else {
                // SubDiscussLayout.timer = setTimeout(()=>{
                //     this.fetchInitialData()
                // }, 100)
            }
        })
    }
    navigateMessage(){
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
        this.fetchInitialData.bind(this)();
        this.navigateMessage.bind(this)();
    }
    componentWillUnmount(){
        delete this.props.socket.discuss;
        // clearTimeout(SubDiscussLayout.timer);
    }
    render(){
        let user = this.props.user;
        let postBox = (
            <div id = "post_topic">
                <img src = {user.Avartar} alt = {`${user.Username} avartar`} width = "45" heigh = "45"/>
                <input type = 'text' name = 'question' placeholder = "Ask an question" />
                {/* file: <input id = 'file_upload' type = 'file' name = 'file' /> */}
                <button id = 'submit_topic' onClick = {this.postTopic.bind(this)}>Ask</button>
            </div>
        )

        let post = this.state.displayingPosts;
        let displayedPost = post.size ? <DiscussPage post = {post} user = {user}/> : "";

        let list = this.state.questionsList;
        let displayedQuestionList = list.size ? <BrowseQuestionPage list = {list} select = {this.selectTopic.bind(this)}/> : "";
        return (
            <div id = "discuss_layout">
                {postBox}
                {displayedPost}
                {displayedQuestionList}
            </div>
        )
    }

}

export default SubDiscussLayout;