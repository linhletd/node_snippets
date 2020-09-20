import React from 'react';
import {Link, withRouter} from 'react-router-dom'
class LoginPage extends React.Component{
    state = {
        validity: [],
        email: '',
        password: ''
    }
    localLogin = (e) =>{
        e.preventDefault();
        let body = {};
        let validity = [0];
        document.getElementById('login_form').querySelectorAll('input').forEach(node =>{
            if(!node.checkValidity()){
                validity.push(node.validationMessage)
            }
            body[node.name] = node.value;
        });
        if(validity.length > 1){
            this.setState({
                validity
            });
            return;
        }
        fetch('/auth/login',{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body)
        }).then(res =>{
            if(res.headers.get('content-type') === 'text/html'){
                window.open('/','_self')
            }
            else{
                return res.json();
            }
        })
        .then(data =>{
            if(!data) return;
            if(data.err){
                let msg = data.err.message || data.err;
                if(msg === 'incorrect password'){
                    this.setState({
                        validity: [0, 0, msg],
                        password:'',
                    })
                }
                else if(msg === 'not registered'){
                    this.setState({
                        validity: [0, msg, 0],
                        password:'',
                    })
                }
                else{
                    this.setState({
                        validity: [msg, 0, 0]
                    })
                }
            }
        })
    }
    fbLogin(e){
        if(window.BroadcastChannel){
            e.preventDefault();
            window.open('/auth/fb','popup','width=600,height=600')
        }
    }
    ghLogin(e){
        if(window.BroadcastChannel){
            e.preventDefault();
            window.open('/auth/github','popup','width=600,height=600')
        }
    }
    handleInputChange = (e)=>{
        let newState = {};
        if(this.state.validity.length){
            newState.validity = [];
        }
        newState[e.target.type] = e.target.value;
        this.setState(newState);
    }
    render(){
        let {validity, email, password} = this.state;
        return(
            <div id = "login_page">
                <p>You must login to use this app</p>
                <form id = "login_form">
                    {validity[0] ? <p style = {{color: '#ff3333'}}>{validity[0]}</p> : ''}
                    <input type = "email" name = "login_email" placeholder = 'Email' value = {email} onChange = {this.handleInputChange} required = {true}/>
                    {validity[1] ? <p style = {{color: '#ff3333'}}>{validity[1]}</p> : ''}
                    <input type = "password" name = "login_password" placeholder = 'Password' value = {password} onChange = {this.handleInputChange} required = {true}/>
                    {validity[2] ? <p style = {{color: '#ff3333'}}>{validity[2]}</p> : ''}
                </form>
                <button type = 'submit'  onClick = {this.localLogin}>Submit</button>
                <div id = 'signup'>
                    <Link to = {`/auth/reset-password`}>Forgot password?</Link>
                    <Link to = {`/auth/register`}>Sign up an account</Link>
                </div>
                <div id = 'social_login'>
                    <a href = '/auth/fb' onClick = {this.fbLogin} className ="fb btn"><i className="fa fa-facebook fa-fw"></i>Login with Facebook</a>
                    <a href = '/auth/github' onClick = {this.ghLogin} className ="github btn"><i className="fa fa-github fa-fw"></i>Login with Github</a>
                </div>
            </div>
            
        )
    }
}
export default withRouter(LoginPage);