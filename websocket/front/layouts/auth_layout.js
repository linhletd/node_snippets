import React from 'react';
import HomePage from '../pages/home_page.js';
import SubDiscussLayout from '../layouts/sub_discuss_layout';
import PrimaryHeader from '../ui/primary_header.js';
import SubUserLayout from '../layouts/sub_user_layout'
import {Route, Switch} from 'react-router-dom'
class AuthLayout extends React.Component{
    constructor(props){
        super(props);
    }
    handleIncomingMessage(){
        let socket = this.props.socket;
        socket.onopen = (e) =>{
            socket.send('hello');
            socket.onmessage = (event)=>{
                console.log(event)
                document.getElementById('message').innerText = event.data;
            }
        }
    }
    componentDidMount(){
        this.handleIncomingMessage();
    }
    render(){

        return(
            <div>
                <PrimaryHeader/>
                <Switch>
                    <Route exact path = '/'>
                        <HomePage/>
                    </Route>
                    <Route path = '/user'>
                        <SubUserLayout/>
                    </Route>
                    <Route path = '/discuss'>
                        <SubDiscussLayout user = {this.props.user} socket = {this.props.socket}/>
                    </Route>
                </Switch>
            </div>
        )
    }

}
export default AuthLayout;