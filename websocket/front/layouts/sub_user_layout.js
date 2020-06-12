import {Switch, Route} from 'react-router-dom';
import UserNotePage from '../pages/user_note_page.js';
import UserNav from '../ui/user_nav';
import ChangePasswordPage from '../pages/change_pwd_page.js';
const SubUserLayout = () =>{

    return(
        <div>
            <UserNav/>
            <Switch>
                <Route exact path = '/user/change-password'>
                    <ChangePasswordPage/>
                </Route>
                <Route exact path = '/user/note'>
                    <UserNotePage/>
                </Route>
            </Switch>
        </div>
    )
}
module.exports = SubUserLayout