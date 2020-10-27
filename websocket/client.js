import React from 'react';
import {render} from 'react-dom';
import {connect, Provider} from 'react-redux';
import {BrowserRouter, Switch, Route,withRouter} from 'react-router-dom';
import store from './front/redux/store.js';
import AuthLayout from './front/layouts/auth_layout.js';
import UnauthLayout from './front/layouts/unauth_layout.js'
class App extends React.Component{
    constructor(props){
        super(props);
        this.handleLoginEvent();
    }
    handleLoginEvent = (data) =>{
        let handle = (userData) =>{
            let ws = new window.WebSocket('ws://localhost:8080');
            this.props.updateStore({type: 'LOGIN', data: {user: userData, socket: ws}});
            let intentURL = sessionStorage.getItem('inTentURL');
            sessionStorage.removeItem('inTentURL');
            this.props.history.replace(intentURL || '/');
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
    render(){
        return (
            <div id = 'app'>
                {
                    this.props.user ?
                    <AuthLayout/> :
                    <UnauthLayout handleLogin = {this.handleLoginEvent}/>
                }
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
function mapStateToProps(state){
    return {
        user: state.main.user
    }
}
const RoutedApp = withRouter(connect(mapStateToProps, mapDispatchToProps)(App));
document.addEventListener('DOMContentLoaded',()=>{
    render(<BrowserRouter><Provider store = {store}><RoutedApp/></Provider></BrowserRouter>, document.getElementById('root'))
})