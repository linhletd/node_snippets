import {Link} from 'react-router-dom'
const LoginPage = ()=>{
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
        <Link to = '/reset-password'>Need reset password</Link>
        <Link to = '/register'>Sign up an account</Link> <br/>
        <Link to = '/login-with-fb'>login with facebook</Link>
        </div>
    )
}
module.exports = LoginPage;