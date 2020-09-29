import React from 'react';
import {connect} from 'react-redux';
import UserStatus from '../pages/user_status';
import WaittingNotation from '../ui/waitting_notation';
import sendMsgViaSocket from '../utils/sendMsgViaSocket';
let InviteContent = (props) =>{
    
    return (
        <div>
            <p>Invite you game - &nbsp;<span>{props.time}</span></p>
            <WaittingNotation autoStop = {true}/>
            <div>
                <button onClick = {props.clickJoin}>Join</button>
                <button onClick = {props.clickDecline}>Decline</button>
            </div>
        </div>
    )
}
class InviteNoticeBoard extends React.Component{
    handleAcceptGame = (notice) =>{
        let {noticeList, updateStore, history, user} = this.props;
        let {inviteId, socketId} = notice;
        noticeList.delete(inviteId);
        let msg = {
            type: 'accept',
            payload: {
                socketId,
                declined: [...noticeList.values()]
                .map(cur=>({inviteId: cur.inviteId, socketId: cur.socketId})),
                inviteId
            }
        };
        sendMsgViaSocket(this.props,JSON.stringify(msg));
        updateStore({
            type: 'ACTIVEGAME',
            data: {
                inviteId,
                mainSide: 'b',
                mainUId: user._id,
                subUId: notice.userId
            }
        });
        history.push('/game/poong');
    }
    handleDeclineGame = (notice)=>{
        let {updateStore} = this.props;
        let msg = {
            type: 'decline',
            payload: {
                inviteId: notice.inviteId,
                socketId: notice.socketId
            }
        }
        sendMsgViaSocket(this.props,JSON.stringify(msg));
        updateStore({
            type: 'DECLINEGAME',
            data: {inviteId: notice.inviteId}
        })
    }
    navigateToGame = () =>{
        this.props.history.push('/game');
    }
    render(){
        let {socket, noticeList, updateStore} = this.props;
        let list = noticeList ? [...noticeList.values()] : null;
        if(list && list.length){
            socket.notify = {
                handleTouchedSomewhere: () => {
                    updateStore({
                        type: 'SOMEWHERE',
                        data: {}
                    })
                },
                handleCancelMsg: ({payload}) => {
                    updateStore({
                        type: 'CANCELMSG',
                        data: payload
                    })
                }
            }
            let notices = list.map((notice) => {
                return (
                    <UserStatus status = {{_id: notice.userId}} childClass = 'user_small'  key = {notice.inviteId}
                    children = {<InviteContent time = {notice.time} clickJoin = {this.handleAcceptGame.bind({},notice)} clickDecline = {this.handleDeclineGame.bind({}, notice)}/>}/>
                )
            })
            return (
                <div id = 'notice_board' className = 'list_board'>
                    {notices}
                </div>
            )
        }
        else {
            let notify = socket.notify;
            notify && delete socket.notify;
            return (
                <div>
                    <p>You have no game invitation right now</p>
                    <button onClick = {this.navigateToGame} className = 'btn_blue'>Go to invite</button>
                </div>
            )
        }
    }
}
function mapStateToProps(state, ownProp){
    return {
        socket: state.main.socket,
        user: state.main.user,
        noticeList: state.poong.noticeList
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateStore: function(action){
            dispatch(action);
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(InviteNoticeBoard);