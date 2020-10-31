import React from 'react';
import UserStatus from './user_status';
import {Redirect} from 'react-router-dom';
class SignupVerify extends React.Component{
    constructor(){
        super();
        this.timer = undefined;
        this.clock = React.createRef();
    }
    requestNewToken = (e) =>{
        this.startCounting(e.target)
        fetch('/auth/invoke-token',{
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                type: 'verify',
                to: this.props.data.pendingUser.Email,
                name: this.props.data.pendingUser.Username
            })
        })
    }
    startCounting = (button) =>{
        button.disabled = true;
        let init = 60;
        let {current} = this.clock;
        current.parentNode.className = '';
        current.innerText = `${init} secs`;
        this.timer = setInterval(() =>{
            init--;
            if(init === 0){
                clearTimeout(this.timer)
                current.parentNode.className = 'hide';
                button.disabled = false;
                return;
            }
            if(init < 10){
                current.innerText = `0${init} secs`;
            }
            else{
                current.innerText = `${init} secs`;
            }
        }, 1000)

    }
    componentWillUnmount(){
        clearTimeout(this.timer);
    }
    render(){
        let {pendingUser} = this.props.data;
        if(!pendingUser){
            return <Redirect to = '/auth/login'/>
        }
        pendingUser.isOnline = false;
        return(
            <div id = 'signup_ver'>
                <UserStatus status = {pendingUser} noName = {true} childClass = 'user_xl'/>
                <p>Hi&nbsp;{pendingUser.Username},<br/>Your brand new avatar is so cool!</p>
                <p>Just one more step, turn your online signal to green, discover all features</p>
                <p>I have sent you an email to verify your account, please check your email</p>
                <div>
                    <button onClick = {this.requestNewToken}>resend verification email</button>
                    <p className = 'hide'>You should re-invoke after <span className = 'clock_face' ref = {this.clock}></span></p>
                </div>
            </div>
        )
    }
}
export default SignupVerify;