import React from 'react';
import {connect} from 'react-redux';
import HomePage from '../pages/home_page.js';
import UserStatus from '../pages/user_status';
import SubDiscussLayout from '../layouts/sub_discuss_layout';
import PrimaryHeader from '../ui/primary_header.js';
import SubUserLayout from '../layouts/sub_user_layout';
import SubGameLayout from '../layouts/sub_game_layout'
import {Route, Switch, withRouter} from 'react-router-dom';
import fetchReq from '../utils/xhr.js';
class AuthLayout extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            notice: undefined
        }
        this.getInitialUsersStatus();
    }
    handleNotice = ({type, payload}) =>{
        let notice = {
            inviteId: payload.socketId,
            user: this.props.usersStatus.get(payload.originatorId),
            info: 'invite game',
            time: new Date()
        }
        this.setState({notice})
    }
    handleAcceptGame = () =>{
        let subId = this.state.notice.user._id;
        let msg = {
            type: 'accept',
            payload: {
                socketId: this.state.notice.inviteId
            }
        };
        this.props.socket.send(JSON.stringify(msg));
        this.setState({notice: undefined});
        this.activeGame('b', subId);
    }
    handleAcceptMessage = ({payload})=>{
        this.activeGame('a', payload._id)
    }
    activeGame = (mainSide, subPlayerId) =>{
        let subSide = mainSide == 'a' ? 'b' : 'a',
            s = {side: mainSide, _id: this.props.user._id},
            m = {side: subSide, _id: subPlayerId},
            sideList = [m, s].sort((a,b) =>{
                return (a.side.codePointAt(0) - b.side.codePointAt(0))
              })
        this.props.updateStore({
            type: 'ACTIVEGAME',
            data: {
                mainSide,
                sideList
            }
        });
        this.props.history.push('/game/poong');
    }
    handleIncomingMessage = () =>{
        let socket = this.props.socket;
        socket.onopen = (e) =>{
            socket.send(JSON.stringify({
                type: 'hello',
                payload: {}
            }));
            socket.onmessage = (event)=>{
                let {type, payload} = JSON.parse(event.data);
                document.getElementById('message').innerText = event.data;
                (()=>{
                    switch(type){
                        case 'update board': case 'update comment':
                            return socket.discuss && socket.discuss || (()=>{});
                        case 'online': case 'offline':
                            return this.updateUsersStatusBoard;
                        case 'invite':
                            return this.handleNotice;
                        case 'accept':
                            return this.handleAcceptMessage;
                        case 'shoot': case 'go': case 'leave':
                            return socket.handleGame && socket.handleGame || (()=>{});
                        default: 
                            return () =>{console.log('default: ', type)};
                    }
                })()({type, payload})

            }
        }
    }
    updateUsersStatusBoard = ({type, payload}) =>{
        this.props.updateStore({
            type: 'UPDATEUSERSTATUS',
            data: payload
        })
        // let {usersStatus} = this.state;
        // if(!usersStatus) return;
        // let user = usersStatus.get(payload._id);
        // if(user && payload.isOnline == user.isOnline){
        //     return;
        // }
        // let newState = new Map([...usersStatus]);
        // let newUser = Object.assign({}, user);
        // if(user){
        //     newUser.isOnline = true;
        //     if(user.isOnline && type === 'offline'){
        //         newUser.isOnline = false; 
        //     }
        // }
        // else {
        //     newUser = payload;
        // }
        // newState.set(newUser._id, newUser);

        // this.setState((prevState) => {
        //     return {usersStatus: newState}
        // })
    }
    getInitialUsersStatus(){
        fetchReq('/users/status', {
            method: 'get'
        }).then(({data}) => {
            if(data && data.length){
                let entries = data.map(cur => {
                    return [cur._id, cur];
                })
                let map = new Map(entries);
                this.props.updateStore({
                    type: 'LOADUSERSTATUS',
                    data: map
                })
                // this.setState((prevState) => {
                //     return {usersStatus: map}
                // })
            }
            else {
                console.log(data);
            }

        })
    }
    componentDidMount(){
        this.handleIncomingMessage();
    }
    render(){
        let usersStatus = this.props.usersStatus && [...this.props.usersStatus.values()];
        let usersStatusBoard = usersStatus ? usersStatus.map(status => <UserStatus key = {status._id} status = {status}/>) : "";
        let notice = this.state.notice ? 
            <div>
                <p>{this.state.notice.Username} invite join poong game</p>
                <button><i className="fa fa-window-close"></i></button>
                <button onClick = {this.handleAcceptGame}>join</button>
            </div> : ""
        return(
            usersStatus ?
            <div>
                <PrimaryHeader/>
                {notice}
                {/* {usersStatusBoard} */}
                <Switch>
                    <Route exact path = '/'>
                        <HomePage/>
                    </Route>
                    <Route path = '/user'>
                        <SubUserLayout/>
                    </Route>
                    <Route path = '/discuss'>
                        <SubDiscussLayout {...this.props}/>
                    </Route>
                    <Route path = '/game'>
                        <SubGameLayout/>
                    </Route>
                </Switch>
            </div>:""
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
function mapStateToProps(state, ownProp){
    return {
        user: state.user,
        socket: state.socket,
        usersStatus: state.usersStatus
    }
}
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AuthLayout));