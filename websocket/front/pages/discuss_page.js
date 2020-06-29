import React from 'react';
class DiscussPage extends React.Component{
    constructor(props){
        super(props);
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
    handleInputChange(){

    }
    componentDidMount(){
        
    }
    render(){
        let post = [...this.props.post.values()][0];
        let author = post.Author
        let user = this.props.user;

        let main = (
            <div>
                <div className = 'author'>
                    <img src = {author.Avartar} alt = {`${author.Username} avartar`} width = "45" heigh = "45"/>
                    <a href = {`/user?id=${author._id}`}>{author.Username}</a>
                    <p>{new Date(post.PostTime).toString()}</p>
                </div>
                <h4>{post.Question}</h4>
            </div>
        );
        let comments = post.Comments.length ? post.Comments.map(comment =>(
            <Comment comment = {comment} key = {comment._id.slice(18)}/>
        )) : "";

        let postNewComment = (
            <div className = "write_comment">
                <img src = {user.Avartar} alt = {`${user.Username} avartar`}  width = "45" heigh = "45"/>
                <input type ="text" placeholder = "Write an answer..."/>
                <button onClick = {this.handleComment.bind(this)}>Post</button>
            </div>
        )
        return (
            <div className = 'topic_container' id = {post._id}>
                {main}
                {comments}
                {postNewComment}                
            </div>
        );
    }
}
var Comment = function (props){
    let comment = props.comment;
    let user = comment.PostBy;
    return (
        <div className = "displayed_comment">
            <img src = {user.Avartar} alt = {`${user.Username} avartar`} width = "45" heigh = "45"/>
            <div>
                <a href = {`/user?id=${user._id}`}>{user.Username}</a>
                <p>{comment.Content}</p>
            </div>
            <p>{new Date(comment.PostTime).toString()}</p>
        </div>
    )
}
export default DiscussPage