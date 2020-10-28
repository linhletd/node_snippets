import React from 'react';
import EditorApp from './editor_page';
import {withRouter} from 'react-router-dom';
class PostNewTopic extends React.Component {
    constructor(){
        super();
        this.postButton = React.createRef();
        this.postCategory = null;
        this.content = null;
        this.title = null;
        this.validated = false;
    }
    flashPostSuccess = () =>{
        let ctn = document.getElementById('flash_popup');
        let div = document.createElement('div');
        div.innerText = 'Successfully posted';
        div.className = 'post_success';
        ctn.appendChild(div);
        ctn.classList.remove('hide');
        setTimeout(() =>{
            ctn.classList.add('hide');
            div.remove();
        }, 3000)
    }
    postTopic = (e) =>{
        let target = e.target;
        target.disabled = true;
        let bodyData = {
            title: this.title.innerText,
            category: this.postCategory.innerText,
            content: this.content.innerHTML
        };
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
        .catch(e =>{
            return {err: e.message}
        })
        .then((data) =>{
            if(data.err === 'session ended'){
                return this.props.history.replace('/auth/login');
            }
            else if(data.err){
                target.parentNode.nextSibling.innerText = data.err;
                target.disabled = false;
            }
            else{
                this.postCategory && this.postCategory.classList.remove('selected');
                this.postCategory = null;
                this.title.innerHTML = '';
                this.content.innerHTML = '';
                this.flashPostSuccess();

            }
        })

    }
    checkPostValidated = () =>{
        this.validated = this.postCategory && this.title.innerText.length >= 1 && this.content.innerText.length >= 1;
        if(this.validated){
            this.postButton.current.disabled && (this.postButton.current.disabled = false)
        }
        else{
            !this.postButton.current.disabled && (this.postButton.current.disabled = true)
        }
    }
    handleSelectCate = (e) =>{
        let par = e.target.parentNode;
        if(par !== this.postCategory){
            !par.className && (par.className = 'selected');
            this.postCategory && this.postCategory.classList.remove('selected');
            this.postCategory = par;
            this.checkPostValidated();
        }
    }
    componentDidMount(){
        this.title = document.getElementById('post_title');
        this.content = document.getElementById('topic_editor').querySelector('.editor_area');
        this.content.addEventListener('input', this.checkPostValidated);
        this.title.oninput = this.checkPostValidated;
        this.title.focus();
        this.postButton.current.disabled = true;
    }
    shouldComponentUpdate(){
        return false;
    }
    componentWillUnmount(){
        this.content.removeEventListener('input', this.checkPostValidated)
    }
    render(){
        return (
            <div id = 'post_topic'>
                <div id = 'post_head'>
                    <p>Title</p>
                    <div id = 'post_title' contentEditable = {true}/>
                </div>
                <EditorApp self = {true} id = "topic_editor" focus = {true}/>
                <div id = 'post_foot'>
                    <div id = 'post_category'>
                        <p>Category:</p>
                        <div>
                            <div>
                                <div onClick = {this.handleSelectCate} className = ' tag code_tag'>Coding</div>
                            </div>
                            <div>
                                <div onClick = {this.handleSelectCate} className = 'tag life_tag'>Life</div>
                            </div>
                            <div>
                                <div onClick = {this.handleSelectCate} className = ' tag other_tag'>Other</div>
                            </div>
                        </div>
                    </div>
                    <button ref = {this.postButton} onClick = {this.postTopic}>Post</button>
                </div>
                <p className = 'fb_msg'></p>
            </div>
        )
    }
}
export default withRouter(PostNewTopic);