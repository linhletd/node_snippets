import React from 'react';
import {connect} from 'react-redux';
import SubDiscussLayout from '../layouts/sub_discuss_layout';
import PrimaryHeader from '../ui/primary_header.js';
import SubUserLayout from '../layouts/sub_user_layout';
import SubGameLayout from '../layouts/sub_game_layout';
import EditorApp from '../pages/editor_page';
import WeatherApp from '../pages/weather_comp';
import SimilarApp from '../pages/similar_comp';
import NorthWindQuery from '../pages/northwind_query_comp'
import InviteNoticeBoard from '../pages/notify_game_comp';
import BrowserUserPage from '../pages/browse_user_page';
import {GlobalPopup} from '../pages/popup_comp';
import EditorGuide from '../pages/editor_guide_comp';
import Welcome from '../pages/welcome_comp';
import {Redirect, Route, Switch, withRouter} from 'react-router-dom';
import fetchReq from '../utils/xhr.js';

class AuthLayout extends React.Component{
    constructor(props){
        super();
        this.left = React.createRef();
        this.right = React.createRef();
        if(window.Worker){
            this.worker = new Worker('/js/worker.bundle.js');
        }
    }
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
            let {protocol, host} = window.location;
            let ws = new window.WebSocket(`ws${protocol.match(/s/) ? 's' : ''}://${host}`);
            this.props.updateStore({type: 'OPENSOCKET', data: ws});
        }
    }
    detectMustAlternativeWs = () =>{
        let {worker} = this;
        if(worker){
            this.props.socket.onclose = (e) =>{
                worker.postMessage('');
            }
            worker.onmessage = (e) =>{
                this.createAlternativeWs();
            }
        }
        else{
            let lastTime = (new Date()).getTime();
            let checkTime = 5000;
            let delay = 2000;
            let itv = setInterval(()=>{
                let currentTime = (new Date()).getTime();
                if(currentTime - lastTime > checkTime + delay){
                    this.createAlternativeWs();
                    clearInterval(itv);
                }
            }, checkTime)
        }
        window.ononline = ()=>{
            this.createAlternativeWs();
        }
    }
    handleIncomingMsg = (socket) =>{
        if(!socket){
            socket = this.props.socket;
        }
        socket.onmessage = (event)=>{
            let parsedMsg = JSON.parse(event.data);
            let {type, payload} = parsedMsg;
            (()=>{
                switch(type){
                    case 'ws id':
                        socket.id = payload;
                        return () =>{}
                    case 'update board': case 'topictitle': case 'topicbar': case 'comment': 
                    case 'cmtbar': case 'reply': case 'repbar':
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
                            return ()=>{}
                        }
                        //all method below is for handle game message
                    case 'invite':
                        this.createFlashPopup();
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
                }
            })()(parsedMsg)

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
                //
            }

        })
    }
    componentDidMount(){
        this.getInitialUsersStatus();
        this.handleIncomingMsg();
        this.detectMustAlternativeWs();
        this.flashCtn = document.getElementById('flash_popup');
        
    }
    createFlashPopup = () =>{
        if(!this.flashCtn.hasChildNodes()){
            this.flashCtn.classList.remove('hide')
        }
        let div = document.createElement('div');
        let timer = setTimeout(()=>{
            div.remove();
            if(!this.flashCtn.hasChildNodes()){
                this.flashCtn.classList.add('hide')
            }
        }, 5000)
        let p = document.createElement('p');
        p.onclick = () =>{
            div.remove();
            clearTimeout(timer);
            if(innerWidth < 600 && this.right.current.style.display === ''){
                document.getElementById('app_header').querySelector('#h_bell').click();
            }
            if(!this.flashCtn.hasChildNodes()){
                this.flashCtn.classList.add('hide')
            }
        }
        let i = document.createElement('i');
        i.className = 'fa fa-times';
        i.onclick = ()=>{
            div.remove();
            clearTimeout(timer);
            if(!this.flashCtn.hasChildNodes()){
                this.flashCtn.classList.add('hide')
            }
        }
        p.innerText = 'You have new invitation';
        div.appendChild(p);
        div.appendChild(i);
        div.className = 'flash';
        div.onmouseover = () =>{
            clearTimeout(timer)
        }
        div.onmouseleave = () =>{
            timer = setTimeout(() =>{
                div.remove();
                if(!this.flashCtn.hasChildNodes()){
                    this.flashCtn.classList.add('hide')
                }
            }, 2000)
        }
        if(this.flashCtn.hasChildNodes()){
            this.flashCtn.insertBefore(div, this.flashCtn.firstChild)
        }
        else{
            this.flashCtn.appendChild(div);
        }
    }
    render(){
        return(
            <div id = 'main_app'>
                <GlobalPopup/>
                <PrimaryHeader user = {this.props.user}/>
                <div id = 'app_left'>
                    <BrowserUserPage 
                    mainProps = {{filter: this.props.user._id, id: 'status_board'}}
                    parProps = {{id: 'status_list', className: 'board'}}
                    childProps = {{childClass: 'user_tiny', activeTime: true}}
                    />
                </div>
                <div id = 'app_body'>
                <div id = 'flash_popup' className = 'hide'/>
                    <Switch>
                        <Route exact path = '/'>
                            <WeatherApp/>
                            <Welcome/>
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
                            <EditorGuide/>
                            <EditorApp/>
                        </Route>
                        <Route path = '/similarity'>
                            <SimilarApp/>
                        </Route>
                        <Route path = '/sql_query'>
                            <NorthWindQuery/>
                        </Route>
                        <Redirect to = '/'/>
                    </Switch>
                </div>
                <div id = 'app_right' ref = {this.right}>
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
        mutateData: state.poong.mutateData
    }
}
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AuthLayout));