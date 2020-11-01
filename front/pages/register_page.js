import React from 'react';
import fetchReq from '../utils/xhr';
import {Redirect, withRouter} from 'react-router-dom';

class RegisterPage extends React.Component{
    constructor(props){
        super();
        this.state = {
            validity: []
        };
    }
    handleRegist = (e)=>{
        e.preventDefault();
        let target = e.target;
        let body = {};
        let validity = [0];
        let inputs = [...document.getElementById('regist_form').querySelectorAll('input')]
        inputs.map(node =>{
            if(!node.checkValidity()){
                validity.push(node.validationMessage)
            }
            else{
                validity.push(0)
            }
            body[node.name] = node.value;
        });
        if(inputs[3].value && inputs[3].value !== inputs[2].value){
            validity[4] = 'Confirm password must equal to password'
        }
        if(validity.filter((cur) => cur != 0).length >= 1){
            this.setState({
                validity
            });
            return;
        }
        target.disabled = true;
        fetchReq('/auth/register', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).catch((e) =>{
            return {err: e.message}
        })
        .then(({err, user}) =>{
            target.disabled = false;
            if(err){
                validity = [];
               if(err === 'Already registered'){
                   validity = [];
                   validity[2] = err;
                   this.setState({
                       validity
                   });
                }
                else{
                    validity[0] = err;
                    this.setState({
                        validity
                    })
                }
            }
            else{
            this.props.data.pendingUser = user;
            this.props.history.push('/auth/verify');
            }
        })
    }
    render(){
        let {validity} = this.state;
        return (
            <div id = "regist_page">
                <p>Register information</p>
                <form id = "regist_form" autoComplete = "off">
                    {validity[0] ? <p className = 'validate'>{validity[0]}</p> : ''}
                    <input autoFocus = {true} type = "text" name = "regist_name" placeholder = "Name" required = {true}/>
                    {validity[1] ? <p className = 'validate'>{validity[1]}</p> : ''}
                    <input type = "email" name ="regist_email" placeholder = "Email" required = {true}/>
                    {validity[2] ? <p className = 'validate'>{validity[2]}</p> : ''}
                    <input type = "password" name = "regist_password" placeholder = 'Password' required = {true}/>
                    {validity[3] ? <p className = 'validate'>{validity[3]}</p> : ''}
                    <input type = "password" name = "regist_confirm" placeholder = 'Confirm Password' required = {true}/>
                    {validity[4] ? <p className = 'validate'>{validity[4]}</p> : ''}
                </form>
                <button onClick = {this.handleRegist} className = 's_btn'>Submit</button>
            </div>
        )
    }
}
export default withRouter(RegisterPage);