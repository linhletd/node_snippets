import React from 'react';
import {Switch, Route, Redirect} from 'react-router-dom';
import LoginPage from '../pages/login_pages.js';
import RegisterPage from '../pages/register_page.js';
import ForgotPasswordPage from '../pages/forgot_pwd_page.js';
import {connect} from 'react-redux';

class UnauthLayout extends React.Component{
    componentDidMount(){
        let footer = document.getElementById('footer')
        footer.style.width = '100vw';
        footer.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
        if(window.atob && /^aW50ZW50VVJM=|;aW50ZW50VVJM=/.test(document.cookie)){
            console.log('hahahha')
            let intentURL = atob((';' + document.cookie +';').match(/;aW50ZW50VVJM=(.+?);/)[1].replace(/%2F/g,'/').replace(/%3D/g, '='));
            sessionStorage.setItem('inTentURL', intentURL);
        }
    }
    componentWillUnmount(){
        document.getElementById('footer').style.width = '';
    }
    render(){
        if(this.props.user){
            return <Redirect to = '/'/>
            
        }
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
function mapStateToProps(state){
    return {
        user: state.main.user
    }
}
export default connect(mapStateToProps)(UnauthLayout);