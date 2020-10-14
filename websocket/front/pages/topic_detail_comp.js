import React from 'react';
import TopicTitle from './topic_title_comp';
import fetchReq from '../utils/xhr';
import WaittingNotation from '../ui/waitting_notation';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
class Topic extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            data: null
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
        try{
            let {search} = nextProps ? nextProps.location : this.props.location;
            let id = search.match(/\?id=(\w{24})\b/)[1];
            if(id){
                fetchReq('/discuss/data/content/' + id, {method: 'get'})
                .then((data) => {
                    this.setState({data: id}, () =>{
                        document.getElementById('content_ctn').innerHTML = data.Content;
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
    componentDidMount(){
        if(!this.state.data){
            this.getTopicContent()
        }
    }
    shouldComponentUpdate(nextProps, nextState){
        if(nextState.data !== this.state.data){
            return true;
        }
        if(nextProps.location.search !== this.props.location.search){
            this.getTopicContent(nextProps);
        }
        return false;
    }
    handleClickUpvote = (e) =>{
        let upvote = e.target;
        let downvote = target.parentNode.nextSibling.firstChild;
        let state = 'set';
        if(downvote.classList.contain('voted')){
            downvote.classList.remove('voted');
            state = 'change'
        }
        upvote.classList.add('voted')
        fetchReq('/discuss/vote',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                level: 'topic',
                type: 'upvote',
                state,
                topic_id: this.state.data
            })
        })
    }
    render(){
        if(this.state.data){
            let bar = <div>
                <div><i className="fa fa-thumbs-o-up"></i>&nbsp;Upvote</div>
                <div><i className="fa fa-thumbs-o-down"></i>&nbsp;Downvote</div>
                <div><i className="fa fa-comments-o"></i>&nbsp;Comment</div>
            </div>
            return (
                <div id = 'topic_ctn' key = {1}>
                    <TopicTitle authorName = {true} topic = {{_id:this.state.data}}/>
                    <div id = 'content_ctn'/>
                    {bar}
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
function mapStateToProps(state){
    return {
        user: state.main.user
    }
}
export default withRouter(connect(mapStateToProps, null)(Topic))