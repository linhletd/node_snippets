import React from 'react';
import {Link, withRouter} from 'react-router-dom';
import WaittingNotation from '../ui/waitting_notation';
import WaitingNotation from '../ui/waitting_notation';
class LoginPage extends React.Component{
    constructor(){
        super();
        this.state = {
            validity: [],
            email: 'linhletd.glitch@gmail.com',
            password: '123',
            waiting: false
        };
    }
    localLogin = (e) =>{
        e.preventDefault();
        let target = e.target;
        target.disabled = true;
        let body = {};
        let validity = [0];
        document.getElementById('login_form').querySelectorAll('input').forEach(node =>{
            if(!node.checkValidity()){
                validity.push(node.validationMessage)
            }
            else{
                validity.push(0)
            }
            body[node.name] = node.value;
        });
        if(validity.filter((cur) => cur !== 0).length >= 1){
            this.setState({
                validity
            });
            target.disabled = false;
            return;
        }
        this.setState({waiting: true});
        fetch('/auth/login',{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(body)
        }).then(res =>{
            return res.json();
        }).catch((e)=>{
            return {err: e.message}
        })
        .then(data =>{
            target.disabled = false;
            if(!data){
                this.setState({
                    waiting: false
                })
                return;
            }
            let {user, err} = data;
            if(user && user.Verified !== 0){
                this.props.handleLogin(user);
                return;
            }
            else if(user){
                this.props.data.pendingUser = user;
                this.props.history.push('/auth/verify');
            }
            if(err){
                let msg = data.err.message || data.err;
                if(msg === 'incorrect password'){
                    this.setState({
                        validity: [0, 0, msg],
                        password:'',
                        waiting: false
                    })
                }
                else if(msg === 'not registered'){
                    this.setState({
                        validity: [0, msg, 0],
                        password:'',
                        waiting: false
                    })
                }
                else{
                    this.setState({
                        validity: [msg, 0, 0],
                        waiting: false
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
                    {validity[0] ? <p className = 'validate'>{validity[0]}</p> : ''}
                    <input autoFocus = {innerWidth >= 600} type = "email" name = "login_email" placeholder = 'Email' value = {email} onChange = {this.handleInputChange} required = {true}/>
                    {validity[1] ? <p className = 'validate'>{validity[1]}</p> : ''}
                    <input type = "password" name = "login_password" placeholder = 'Password' value = {password} onChange = {this.handleInputChange} required = {true}/>
                    {validity[2] ? <p className = 'validate'>{validity[2]}</p> : ''}
                </form>
                <button onClick = {this.localLogin} className = 's_btn'>Submit</button>
                {this.state.waiting ? <WaittingNotation autoStop = {true}/> : ''}
                <div id = 'signup'>
                    <Link to = {`/auth/reset-request`}>Forgot password?</Link>
                    <Link to = {`/auth/register`}>Sign up an account</Link>
                </div>
                <div id = 'social_login'>
                    <a href = '/auth/github' onClick = {this.ghLogin} className ="github btn"><i className="fa fa-github fa-fw"></i>Login with Github</a>
                    <a href = '/auth/fb' onClick = {this.fbLogin} className ="fb btn" disabled = {true}><i className="fa fa-facebook fa-fw"></i>Login with Facebook</a>
                </div>
            </div>
            
        )
    }
}
export default withRouter(LoginPage);