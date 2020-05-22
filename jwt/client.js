import React from 'react';
import {createStore} from 'redux';
import {connect, Provider} from 'react-redux';
import {render} from 'react-dom';
import {Route, Redirect, BrowserRouter, NavLink, Switch, withRouter} from 'react-router-dom';

const LOGIN = 'LOGIN';
const REFRESH = 'REFRESH';
const LOGOUT = 'LOGOUT';

const Navbar = (props) =>{
    return (
        <div style = {{display: "inline-block"}}>
        <NavLink exact to = "/" activeClassName = "active">Home</NavLink>
        {props.authenticated ? <NavLink to = "/userstory" activeClassName = "active">User Info</NavLink> : <NavLink to = "/login" activeClassName = "active">Login</NavLink>}
        </div>
    )
}
const Home = () =>{
    return (
        <h1>Home Sweet Home</h1>
    )
}
let Login = (props) => {
  return (
    <div>
        <p id = 'login-message'></p>
        <form id = "login-form">
            Username: <input type = "text" name = "username"/><br/>
            Password: <input tpe = "password" name = "password"/><br/>
        </form>
        <button id = 'login' onClick = {props.login}>Submit</button>
    </div>
  )
}

class UserInfo extends React.Component{
    getCurrentToken(){
        document.getElementById('info').innerText = JSON.stringify({"current token": this.props.token})
    }
    getRefreshToken(){
        document.getElementById('info').innerText = JSON.stringify({"refresh token": this.props.refresh})
    }
    getNewToken(){
        this.props.refreshToken().then((result) =>{
            if(result.err === 'expired token'){
                this.props.history.push('/login');
                return;

            }
            document.getElementById('info').innerText = JSON.stringify(result);
        })
    }
    getUserHobby(){
        fetch('/userstory/hobby',{
            method: 'get',
            headers:{
                'authorization': `Bearer ${this.props.token}`
            }
        }).then((data) =>{
            return Promise.resolve(data.json())
        }).catch((err) =>{
            return Promise.resolve({err})
        }).then((result) =>{
            document.getElementById('info').innerText = JSON.stringify(result);
        })
    }
    signout(){
        this.props.updateState({type: LOGOUT});
        this.props.history.push('/')
    }
    render(){
        if(this.props.token){
            return (
                <div id = "user-info">
                    <button onClick = {this.getCurrentToken.bind(this)}>Current Token</button>
                    <button onClick = {this.getRefreshToken.bind(this)}>Current refresh token</button>
                    <button onClick = {this.getNewToken.bind(this)}>Get new token</button>
                    <button onClick = {this.getUserHobby.bind(this)}>User Hobby</button>
                    <button onClick = {this.signout.bind(this)}>Logout</button>
                    <div id = "info"></div>
                </div>
            )
        }
        else{
            return <Redirect to = '/login'/>
        }
    }
}

class App extends React.Component{
    login(e){
        e.preventDefault();
        let form = new FormData(document.getElementById('login-form'));
        let body = [...form.entries()].reduce((acc, cur, idx) =>{
            idx === 0 ? acc = acc + `${cur[0]}=${cur[1]}` : acc = acc + `&${cur[0]}=${cur[1]}`;
            return acc;
        },'');
        fetch('/authenticate',{
            method: 'post',
            body: body,
            headers:{
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then((result)=>{
            return Promise.resolve(result.json())
        }).catch((err) =>{
            return Promise.resolve({err})
        }).then((result) =>{
            if(!result.err){
                let action = {type: LOGIN, data: Object.assign(result.data, {history: this.props.history})};
                this.props.updateState(action);
                this.props.history.push('/userstory');
            }
            else {
                document.getElementById('login-message').innerText = result.err;
            }
        })
    }
    refreshToken(){
        return fetch('/refresh_token',{
                method: 'post',
                body: `refreshToken=${this.props.refresh}`,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                }
            }). then((data) =>{
                return Promise.resolve(data.json());
            }).catch(err =>{
                return Promise.resolve({err});
            }).then((result) =>{
                if(result.err === 'expired token'){
                    this.props.updateState({type: LOGOUT});
                }
                else if(!result.err){
                    this.props.updateState({type: REFRESH, data: {token: result.token}})
                }
                return result;
            })
    }
    componentDidMount(){
        setInterval(() => {
            this.refreshToken.bind(this)()
        }, 80000);
    }
    render(){
        return (
            <>
                <Navbar authenticated = {this.props.token ? true : false}/>
                <Switch>
                    <Login exact path = '/login' login = {this.login.bind(this)}/>
                    <UserInfo exact path = '/userstory' refreshToken = {this.refreshToken.bind(this)} {...this.props}/>
                    <Route exact path = '/'>
                        <Home/>
                        <button onClick = {()=>{this.props.history.push('/userstory')}}>check</button>
                    </Route>
                </Switch>
            </>
        )
    }
}

function reducer(state ={},action){
    switch(action.type){
        case LOGIN:
            return Object.assign({token: action.data.token, refresh: action.data.refresh, history: action.data.history},state);
        case REFRESH:
            return Object.assign({token: action.data.token},state);
        case LOGOUT:
            return {};
        default:
            return state;
    }
}
function mapStateToProps(state, ownProp){
    return state;
}
function mapDispatchToProps(dispatch){
    return {updateState: function(action){
        dispatch(action);
    }}
}
var store = createStore(reducer);
let ConnectedApp = withRouter(connect(mapStateToProps, mapDispatchToProps)(App));

render(<BrowserRouter><Provider store = {store}><ConnectedApp/></Provider></BrowserRouter>, document.getElementById('root'));

