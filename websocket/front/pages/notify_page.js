import React from 'react';
import {connect} from 'react-redux';
import {useHistory} from 'react-router-dom';
import UserStatus from '../pages/user_status';
const InviteBoard = (props) => {
    let {socket, noticeList, updateStore, user} = props;
    let history = useHistory();
    let sendMsgViaSocket = (msg) =>{
        let {socket} = props;
        if(socket.readyState === 2 || socket.readyState === 3){
            let ws = new window.WebSocket('ws://localhost:8080');
            props.updateStore({type: 'OPENSOCKET', data: ws});
            ws.onopen = (e) =>{
                ws.send(msg);
            }
        }
        else{
            socket.send(msg);
        }
    }
    const handleAcceptGame = (notice) =>{
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
        console.log(msg)
        sendMsgViaSocket(JSON.stringify(msg));
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
    const handleDeclineGame = (notice)=>{
        let msg = {
            type: 'decline',
            payload: {
                inviteId: notice.inviteId,
                socketId: notice.socketId
            }
        }
        sendMsgViaSocket(JSON.stringify(msg));
        updateStore({
            type: 'DECLINEGAME',
            data: {inviteId: notice.inviteId}
        })
    }
    let list = noticeList ? [...noticeList.values()] : null
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
        let style = {
            width: '300px',
            height: '200px',
            border: '1px solid yellow',
            position: 'fixed',
            top: '50%',
            left: '50%',
            backgroundColor: 'cyan'

        }
        let notices = list.map((notice) => {
            console.log(notice)
            return (
                <div key = {notice.inviteId}>
                    <UserStatus status = {{_id: notice.userId}} children = {<p>{notice.Username} invite you join poong game</p>}/>
                    <button onClick = {handleAcceptGame.bind({},notice)}>join</button>
                    <button onClick = {handleDeclineGame.bind({}, notice)}>decline</button>
                </div>
            )
        })
        return (
            <div id = 'notice_board' style = {style}>
                {notices}
            </div>
        )
    }
    else {
        let notify = socket.notify;
        notify && delete socket.notify;
        return ""
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
export default connect(mapStateToProps, mapDispatchToProps)(InviteBoard);