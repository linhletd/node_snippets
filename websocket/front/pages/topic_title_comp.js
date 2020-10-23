import React from 'react';
import UserStatus from './user_status';
import TimeStamp from './time_stamp_comp';
import {TitleContext} from '../contexts/discusses';
import {connect} from 'react-redux';
class TopicTitle extends React.Component{
    // constructor(props){
    //     super();
    //     this.prev = {};
    //     this.currentSize = props.state.topicList.size;
    // }
    shouldComponentUpdate(nextProps){
        // if(nextProps.topic._id !== this.props.topic._id){
        //     return true;
        // }
        // if(nextProps.state.topicList.size !== this.currentSize){
        //     this.currentSize = nextProps.state.topicList.size;
        //     return false;
        // }
        // if(nextProps.state.topicList !== this.props.state.topicList){
        //     if(!this.topic){
        //         return true;
        //     }
        //     let checkKeys = ['Comment', 'UpVote', 'DownVote'];
        //     for(let i = 0; i < checkKeys.length; i++){
        //         if(this.prev[checkKeys[i]] !== this.topic[checkKeys[i]]){
        //             return true;
        //         }
        //     }
        // }
        if(nextProps.title._id === this.props.topic._id || nextProps.topic._id !== this.props.topic._id){
            return true;
        }
        return false;
    }
    render(){
        let {topic, state: {topicList}, authorName} = this.props;
        let t;
        if(!('Author' in topic)){
            t = topicList.get(topic._id);
            t && (topic = t);
        }
        // this.prev.Comment = topic.Comment;
        // this.prev.UpVote = topic.UpVote;
        // this.prev.DownVote = topic.DownVote;
        if(topic.Comment !== undefined){
            // this.topic = topic;
            let tag = topic.Category[0] === 'C' ? 'tag code_tag' : topic.Category[0] === 'L' ? 'tag life_tag' : topic.Category[0] === 'O' ? 'tag other_tag' : '';
            return (
                <div className = {`concise_tpc${this.props.handleSelectTopic ? '' : ' nolink'}`} id = {`list${topic._id}`} onClick = {this.props.handleSelectTopic}>
                    <UserStatus childClass = 'user_small' status = {{_id: topic.Author}} noName = {!authorName ? true : false}/>
                    <div>
                        <div className = 'topic_title'>{topic.Title}</div>
                        <div className = 'topic_info'>
                            <div className = 'topic_meta'>
                                <div><i className="fa fa-tag"></i><div className = {tag}>{topic.Category}</div></div>
                                <div><i className="fa fa-clock-o"></i><TimeStamp time = {topic.PostTime} normal = {true}/></div>
                                {/* {authorName ? <div><i className="fa fa-user-o"></i><Link to = {`/user?id=${topic._id}`}>{topic.Author}</Link></div> : ""} */}
                            </div>
                            <div className = 'topic_idx'>
                                <div><i className="fa fa-thumbs-o-up"></i>{topic.UpVote}&nbsp;{topic.UpVote > 1 ? 'Ups' : 'Up'}</div>
                                <div><i className="fa fa-thumbs-o-down"></i>{topic.DownVote}&nbsp;{topic.DownVote > 1 ? 'Downs' : 'Down'}</div>
                                <div><i className="fa fa-comments-o"></i>{topic.Comment}&nbsp;{topic.Comment > 1 ? 'Talks' : 'Talk'}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        }
        else{
            return ''
        }

    }
}
class WithContext extends React.Component{
    render(){
        return <TopicTitle {...this.props} state = {this.context}/>
    }
}
WithContext.contextType = TitleContext;
function mapTitleProps(state){
    return {
        title: state.discuss.title
    }
}
WithContext = connect(mapTitleProps, null)(WithContext);
export default WithContext;