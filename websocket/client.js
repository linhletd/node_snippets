import React from 'react';
import {render} from 'react-dom';
import {connect, Provider} from 'react-redux';
import {BrowserRouter, Switch, Route, Redirect, NavLink, useHistory, useLocation, useParams, useRouteMatch, withRouter} from 'react-router-dom';
import store from './front/redux/store.js';
import AuthLayout from './front/layouts/auth_layout.js';
import UnauthLayout from './front/layouts/unauth_layout.js'

class App extends React.Component{
    constructor(props,context){
        super(props);
        this.handleLoginEvent = this.handleLoginEvent.bind(this);
        if(props.user && /\/auth/.test(props.location.pathname)){
            props.history.replace('/');
        }
    }
    handleLoginEvent(data){
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
            }).bind(this)
        }
        else {
            handle(data)
        }

    }

    componentDidMount(){
        this.handleLoginEvent();
        let tempContainer = document.createElement('div');
        tempContainer.id = 'temp_container';
        tempContainer.style.display = 'none';
        document.getElementsByTagName('body')[0].appendChild(tempContainer);

    }
    render(){
        return (
            <div id = 'app'>
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
render(<BrowserRouter><Provider store = {store}><RoutedApp/></Provider></BrowserRouter>, document.getElementById('root'))