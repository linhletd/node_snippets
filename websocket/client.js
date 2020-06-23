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
        this.state = {_ws: undefined}
        if(props.user && /\/auth/.test(props.location.pathname)){
            props.history.replace('/');
        }

    }
    handleLoginEvent(){
        let bc = new BroadcastChannel('bc1');
        bc.onmessage = ((event) =>{
            this.props.updateState({type: 'LOGIN', data: JSON.parse(event.data)});
            let ws = new window.WebSocket('ws://localhost:8080');
            this.props.updateState({type: 'OPENSOCKET', data: ws});
            this.props.history.replace('/');
        }).bind(this)
    }

    componentDidMount(){
        this.handleLoginEvent();
    }
    render(){
        return (
            <div id = 'app'>
                <Switch>
                    <Route path = '/auth'>
                        <UnauthLayout {...this.props}/>
                    </Route>
                    <Route path = '/'>
                        <AuthLayout {...this.props}/>
                    </Route>
                </Switch>
            </div>
        )
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateState: function(action){
            dispatch(action);
        }
    }
}
function mapStateToProps(state, ownProp){
    return {
        backUrl: state.backUrl,
        user: state.user,
        topics: state.topics,
        socket: state.socket
    }
}
const ConnectedApp = withRouter(connect(mapStateToProps, mapDispatchToProps)(App));
render(<BrowserRouter><Provider store = {store}><ConnectedApp/></Provider></BrowserRouter>, document.getElementById('root'))