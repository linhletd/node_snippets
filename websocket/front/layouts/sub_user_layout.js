import React from 'react';
import {Switch, Route, useRouteMatch} from 'react-router-dom';
import UserNotePage from '../pages/user_note_page.js';
// import UserNav from '../ui/user_nav';
import ChangePasswordPage from '../pages/change_pwd_page.js';
const SubUserLayout = () =>{
    let match = useRouteMatch();
    return(
        <div>
            {/* <UserNav/> */}
            {/* <h1>Sub user layout</h1> */}
            <p>This content is not available right now, it will come soon...</p>
            {/* <Switch>
                <Route exact path = {`${match.path}/change-password`}>
                    <ChangePasswordPage/>
                </Route>
                <Route exact path = {`${match.path}/note`}>
                    <UserNotePage/>
                </Route>
            </Switch> */}
        </div>
    )
}
export default SubUserLayout