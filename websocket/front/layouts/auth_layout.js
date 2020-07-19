import React from 'react';
import {connect} from 'react-redux';
import HomePage from '../pages/home_page.js';
import UserStatus from '../pages/user_status';
import InviteBoard from '../pages/notify_page';
import SubDiscussLayout from '../layouts/sub_discuss_layout';
import PrimaryHeader from '../ui/primary_header.js';
import SubUserLayout from '../layouts/sub_user_layout';
import SubGameLayout from '../layouts/sub_game_layout'
import {Route, Switch, withRouter} from 'react-router-dom';
import fetchReq from '../utils/xhr.js';
class AuthLayout extends React.Component{
    constructor(props){
        super(props);
        this.getInitialUsersStatus();
    }
    handleInviteMsg = ({type, payload}) =>{
        let notice = {
            inviteId: payload.socketId,
            userId: payload.originatorId,
            raceId: payload.raceId,
            info: 'invite game',
            time: new Date(),
        }
        this.props.updateStore({
            type: 'INVITENOTICE',
            data: notice
        })
    }
    handleAcceptMsg = ({payload})=>{
        this.props.updateStore({
            type: 'ACTIVEGAME',
            data: {
                mainSide: 'a',
                mainUId: this.props.user._id,
                subUId: payload._id
            }
        });
        this.props.history.push('/game/poong');
    }
    // requestTouchedSomeWhere = ()=>{
    //     this.props.updateStore({
    //         type: 'SOMEWHERE',
    //         data: {inviteId: ''}
    //     })
    // }
    handleIncomingMsg = () =>{
        let socket = this.props.socket;
        socket.onopen = (e) =>{
            socket.send(JSON.stringify({
                type: 'hello',
                payload: {}
            }));
            socket.onmessage = (event)=>{
                let {type, payload} = JSON.parse(event.data);
                document.getElementById('message').innerText = type + JSON.stringify(payload);
                (()=>{
                    switch(type){
                        case 'update board': case 'update comment':
                            return socket.discuss && socket.discuss || (()=>{});
                        case 'online': case 'offline':
                            return this.updateUsersStatusBoard;
                        case 'invite':
                            return this.handleInviteMsg;
                        case 'accept':
                            return this.handleAcceptMsg;
                        case 'decline':
                            {
                                let handleDeclineMsg = socket.handleDeclineMsg
                                return handleDeclineMsg && handleDeclineMsg || (()=>{});
                            }
                        case 'somewhere':
                            {
                                let notify = socket.notify
                                return notify && notify.handleTouchedSomewhere || (()=>{})
                            }
                        case 'cancel':
                            {
                                let notify = socket.notify
                                return notify && notify.handleCancelMsg || (()=>{})
                            }                    
                        case 'shoot': case 'go': case 'leave':
                            {
                                let handleGame = socket.handleGame
                                return handleGame && handleGame || (()=>{});
                            }

                        default: 
                            return () =>{console.log('default: ', type)};
                    }
                })()({type, payload})

            }
        }
    }
    updateUsersStatusBoard = ({type, payload}) =>{
        if(type === 'online'){
            payload.isOnline = true;
        }
        else{
            payload.isOnline = false;
        }
        this.props.updateStore({
            type: 'UPDATEUSERSTATUS',
            data: payload
        })
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
            }
            else {
                console.log(data);
            }

        })
    }
    componentDidMount(){
        this.handleIncomingMsg();
    }
    render(){
        let usersStatus = this.props.usersStatus && [...this.props.usersStatus.values()];
        // let usersStatusBoard = usersStatus ? usersStatus.map(status => <UserStatus key = {status._id} status = {status}/>) : "";
        return(
            usersStatus ?
            <div>
                <PrimaryHeader/>
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
                <InviteBoard/>
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
        user: state.main.user,
        socket: state.main.socket,
        usersStatus: state.main.usersStatus
    }
}
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AuthLayout));