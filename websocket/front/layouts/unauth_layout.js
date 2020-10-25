import React from 'react';
import {Switch, Route, Redirect} from 'react-router-dom';
import LoginPage from '../pages/login_pages.js';
import RegisterPage from '../pages/register_page.js';
import ForgotPasswordPage from '../pages/forgot_pwd_page.js';

class UnauthLayout extends React.Component{
    componentDidMount(){
        let footer = document.getElementById('footer')
        footer.style.width = '100vw';
        footer.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"})
    }
    componentWillUnmount(){
        document.getElementById('footer').style.width = '';
    }
    render(){
        return(
            <div id = "unauth-layout">
                <Switch>
                    <Route exact path = '/auth/login'>
                        <LoginPage/>
                    </Route>
                    <Route exact path = '/auth/register'>
                        <RegisterPage handleLogin = {this.props.handleLogin}/>         
                    </Route>
                    <Route exact path = '/auth/reset-request'>
                        <ForgotPasswordPage/>         
                    </Route>
                    <Redirect to = '/auth/login'/>
                </Switch>
            </div>
        )
    }

}
export default UnauthLayout;