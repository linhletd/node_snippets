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
import InviteNoticeBoard from '../pages/notify_game_comp';
import {GlobalPopup} from '../pages/popup_comp';
import {Route, Switch, withRouter} from 'react-router-dom';
import fetchReq from '../utils/xhr.js';
let worker = new Worker('/js/worker.bundle.js');

class AuthLayout extends React.Component{
    shouldComponentUpdate(nextProps){
        let newSocket = nextProps.socket;
        if(newSocket && newSocket !== this.props.socket){
            this.copyFromOldToNewSocket(newSocket, this.props.socket);
            this.handleIncomingMsg(newSocket);
            this.getInitialUsersStatus();
        }
        return false;
    }
    handleInviteMsg = ({type, payload}) =>{
        let notice = {
            inviteId: payload.inviteId,
            userId: payload.originatorId,
            socketId: payload.socketId,
            info: 'invite game',
            time: (new Date()).toTimeString().slice(0,5),
        }
        this.props.updateStore({
            type: 'INVITENOTICE',
            data: notice
        })
    }
    copyFromOldToNewSocket(newSocket, oldSocket){
        ['discuss', 'waitinfo', 'handleGame', 'notify'].map((prop) =>{
            newSocket[prop] = oldSocket[prop]
        })
    }
    createAlternativeWs = () =>{
        let {socket: curSocket} = this.props;
        if(curSocket.readyState === 2 || curSocket.readyState === 3){
            let ws = new window.WebSocket('ws://localhost:8080');
            this.props.updateStore({type: 'OPENSOCKET', data: ws});
        }
    }
    detectMustAlternativeWs = () =>{
        this.props.socket.onclose = (e) =>{
            console.log('close');
            worker.postMessage('');
        }
        worker.onmessage = (e) =>{
            console.log('wake up')
            setTimeout(()=>{//development only
                this.createAlternativeWs();
            }, 15000)
        }
        window.ononline = ()=>{
            setTimeout(()=>{
                this.createAlternativeWs();
            }, 15000)
        }
    }
    handleIncomingMsg = (socket) =>{
        if(!socket){
            socket = this.props.socket;
        }
        socket.onmessage = (event)=>{
            let {type, payload} = JSON.parse(event.data);
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
        this.getInitialUsersStatus();
        this.handleIncomingMsg();
        this.detectMustAlternativeWs();
    }
    render(){
        return(
            <div id = 'main_app'>
                <GlobalPopup/>
                {/* <InviteBoard/> */}
                {/* <div id = 'main_app'> */}
                    <PrimaryHeader user = {this.props.user}/>
                    <div id = 'app_left'>
                        hahahahahhaah
                    </div>
                    <div id = 'app_body'>
                        <Switch>
                            <Route exact path = '/'>
                                <WeatherApp/>
                            </Route>
                            <Route path = '/user'>
                                <SubUserLayout/>
                            </Route>
                            <Route path = '/discuss'>
                                <SubDiscussLayout/>
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
                    </div>
                    <div id = 'app_right'>
                        <InviteNoticeBoard history = {this.props.history}/>
                    </div>
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