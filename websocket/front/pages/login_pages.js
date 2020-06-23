import React from 'react';
import {Link, useRouteMatch} from 'react-router-dom'
const LoginPage = ()=>{
    let match = useRouteMatch();
    function handleLogin(){
        //
    }
    return(
        <div id = "login-page">
        <h1>Login Page</h1>
        <p>You must login to use this app</p>
        <form id = "login-form">
            Email: <input type = "email" name = "login-mail" />
            Password: <input type = "password" name = "login-password"/>
        </form>
        <button onClick = {handleLogin}>Submit</button>
        <Link to = {`/auth/reset-password`}>Need reset password</Link>
        <Link to = {`/auth/register`}>Sign up an account</Link> <br/>
        <Link to = {`/auth/fb`}>login with facebook</Link>
        <a href = '/auth/github' onClick = {function(e){
            e.preventDefault();
            window.open('/auth/fb','popup','width=600,height=600');}}>
            login with facebook popup
        </a>
        <a href = '/auth/github' onClick = {function(e){
            e.preventDefault();
            window.open('/auth/github','popup','width=600,height=600');}}>
            login with github popup
        </a>
        </div>
    )
}
export default LoginPage;