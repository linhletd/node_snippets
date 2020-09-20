import React from 'react';
import {connect} from 'react-redux';
import HomePage from '../pages/home_page.js';
import UserStatus from '../pages/user_status';
import InviteBoard from '../pages/notify_page';
import SubDiscussLayout from '../layouts/sub_discuss_layout';
import PrimaryHeader from '../ui/primary_header.js';
import SubUserLayout from '../layouts/sub_user_layout';
import SubGameLayout from '../layouts/sub_game_layout';
import EditorApp from '../pages/editor_page';
import WeatherApp from '../pages/weather_comp';
import SimilarApp from '../pages/similar_comp';
import {Route, Switch, withRouter} from 'react-router-dom';
import fetchReq from '../utils/xhr.js';
class AuthLayout extends React.Component{
    handleInviteMsg = ({type, payload}) =>{
        let notice = {
            inviteId: payload.inviteId,
            userId: payload.originatorId,
            socketId: payload.socketId,
            info: 'invite game',
            time: new Date(),
        }
        this.props.updateStore({
            type: 'INVITENOTICE',
            data: notice
        })
    }
    handleIncomingMsg = () =>{
        let socket = this.props.socket;
        socket.onopen = (e) =>{
            socket.send(JSON.stringify({
                type: 'hello',
                payload: {}
            }));
            socket.onmessage = (event)=>{
                let {type, payload} = JSON.parse(event.data);
                // document.getElementById('message').innerText = type + JSON.stringify(payload);
                (()=>{
                    switch(type){
                        case 'update board': case 'update comment':
                            return socket.discuss && socket.discuss || (()=>{});
                        case 'online': case 'offline':
                            return this.updateUsersStatusBoard;
                        case 'somewhere':
                            {
                                let notify = socket.notify
                                return notify && notify.handleTouchedSomewhere || (()=>{})
                            }
                        default:
                            console.log(payload, this.props)
                            if(payload.inviteId !== this.props.mutateData.inviteId){
                                console.log('different inviteId');
                                return ()=>{}
                            }
                            //all method below is for handle game message
                        case 'invite':
                            return this.handleInviteMsg;
                            //method below come from waiting_player_page
                        case 'accept':
                            {
                                let handleAcceptMsg = socket.waitinfo.handleAcceptMsg
                                return handleAcceptMsg && handleAcceptMsg || (()=>{});
                            }
                        case 'decline':
                            {
                                let handleDeclineMsg = socket.waitinfo.handleDeclineMsg
                                return handleDeclineMsg && handleDeclineMsg || (()=>{});
                            }
                            //method below come from notify_page
                        case 'cancel':
                            {
                                let notify = socket.notify
                                return notify && notify.handleCancelMsg || (()=>{})
                            }
                            //method below come from poong_game_page                    
                        case 'shoot': case 'go': case 'leave': case 'continue':
                            {
                                let handleGame = socket.handleGame
                                return handleGame && handleGame || (()=>{});
                            }

                        // default: 
                        //     return () =>{console.log('default: ', type)};
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
            console.log(data)
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
        this.getInitialUsersStatus();
        this.handleIncomingMsg();
    }
    render(){
        // let usersStatus = this.props.usersStatus && [...this.props.usersStatus.values()];
        // let usersStatusBoard = usersStatus ? usersStatus.map(status => <UserStatus key = {status._id} status = {status}/>) : "";
        return(
            <div>
                <PrimaryHeader/>
                {/* {usersStatusBoard} */}
                <Switch>
                    <Route exact path = '/'>
                        <HomePage/>
                        <WeatherApp/>
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
                    <Route path = '/editor'>
                        <EditorApp/>
                    </Route>
                    <Route path = '/similarity'>
                        <SimilarApp/>
                    </Route>
                </Switch>
                <InviteBoard/>
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
function mapStateToProps(state, ownProp){
    return {
        user: state.main.user,
        socket: state.main.socket,
        // usersStatus: state.main.usersStatus,
        mutateData: state.poong.mutateData //never change but mutable
    }
}
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AuthLayout));