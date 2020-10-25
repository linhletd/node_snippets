import React from 'react';
import {render} from 'react-dom';
import {connect, Provider} from 'react-redux';
import {BrowserRouter, Switch, Route, Redirect, NavLink, useHistory, useLocation, useParams, useRouteMatch, withRouter} from 'react-router-dom';
import store from './front/redux/store.js';
import AuthLayout from './front/layouts/auth_layout.js';
import UnauthLayout from './front/layouts/unauth_layout.js'
window.addEventListener('offline', ()=>{
    console.log('offline', Date.now())
})
window.addEventListener('online', ()=>{
    console.log('online', Date.now())
})
class App extends React.Component{
    handleLoginEvent = (data) =>{
        let handle = (userData) =>{
            this.props.updateStore({type: 'LOGIN', data: userData});
            let ws = new window.WebSocket('ws://localhost:8080');
            this.props.updateStore({type: 'OPENSOCKET', data: ws});
            this.props.history.replace('/');
        }
        if(!data){
            let bc = new BroadcastChannel('bc1');
            bc.onmessage = ((event) =>{
                let udata = JSON.parse(event.data);
                handle(udata);
            })
        }
        else {
            handle(data)
        }

    }
    login = this.handleLoginEvent();
    render(){
        let style = {minHeight: '85vh'};
        if(this.props.user && /\/auth/.test(this.props.location.pathname)){
            this.props.history.replace('/');
        }
        return (
            <div id = 'app' style = {style}>
                <Switch>
                    <Route path = '/auth'>
                        <UnauthLayout {...this.props} handleLogin = {this.handleLoginEvent}/>
                    </Route>
                    <Route path = '/'>
                        <AuthLayout/>
                    </Route>
                </Switch>
            </div>
        )
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateStore: function(action){
            dispatch(action);
        }
    }
}
const RoutedApp = withRouter(connect(null, mapDispatchToProps)(App));
document.addEventListener('DOMContentLoaded',()=>{
    render(<BrowserRouter><Provider store = {store}><RoutedApp/></Provider></BrowserRouter>, document.getElementById('root'))
})