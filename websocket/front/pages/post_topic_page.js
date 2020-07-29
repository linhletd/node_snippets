import React from 'react';
import {connect} from 'react-redux'

class PostNewTopic extends React.Component {
    constructor(){
        super()
    }
    postTopic = (e) =>{
        let validated = this.validateForm();
        if(validated){
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
                // this.props.addToDisplay(question, true);
                //updateStore
            })
        }

    }
    validateForm = () =>{
        return true;
    }
    componentDidMount(){
        // document.getElementById('discuss_page').querySelector('#post_topic').querySelector('#submit_topic')
    }
    render(){
        let {user} = this.props;
        return (
            <div id = "post_topic">
                <img src = {user.Avartar} alt = {`${user.Username} avartar`} width = "45" heigh = "45"/>
                <input type = 'text' name = 'question' placeholder = "Ask an question" />
                {/* file: <input id = 'file_upload' type = 'file' name = 'file' /> */}
                <button id = 'submit_topic' onClick = {this.postTopic}>Ask</button>
            </div>
        )
    }
}
function mapStateToProps(state, ownProp){
    return {
        user: state.main.user
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateStore: function(action){
            dispatch(action);
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(PostNewTopic);