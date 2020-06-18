import React from 'react';
import HomePage from '../pages/home_page.js';
import SubDiscussLayout from '../layouts/sub_discuss_layout';
// import PrimaryHeader from '../ui/primary_header.js';
import SubUserLayout from '../layouts/sub_user_layout'
import {Route, Switch} from 'react-router-dom'
const AuthLayout = function(props){

    return(
        <div>
            {/* <PrimaryHeader/> */}
            <Switch>
                <Route exact path = '/'>
                    <HomePage/>
                </Route>
                <Route path = '/user'>
                    <SubUserLayout/>
                </Route>
                <Route path = '/discuss'>
                    <SubDiscussLayout/>
                </Route>
            </Switch>
        </div>
    )
}
export default AuthLayout;