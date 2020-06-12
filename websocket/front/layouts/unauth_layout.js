import {Switch, Route} from 'react-router-dom';
import LoginPage from '../pages/login_pages.js';
import RegisterPage from '../pages/register_page.js';
import ForgotPasswordPage from '../pages/forgot_pwd_page.js';
import VerifyResetTokenPage from '../pages/verify_reset_token_page.js';
import ResetPasswordPage from '../pages/reset_pwd_pages.js';

const UnauthorizedLayout = ()=>{
    
    return(
        <div id = "unauth-layout">
            <Switch>
                <Route exact path = '/auth/login'>
                    <LoginPage/>
                </Route>
                <Route exact path = 'auth/register'>
                    <RegisterPage/>         
                </Route>
                <Route exact path = 'auth/reset-request'>
                    <ForgotPasswordPage/>         
                </Route>
                <Route exact path = 'auth/verify-token'>
                    <VerifyResetTokenPage/>         
                </Route>
                <Route exact path = 'auth/reset-password'>
                    <ResetPasswordPage/>         
                </Route>
            </Switch>
        </div>
    )
}
module.exports = UnauthorizedLayout;