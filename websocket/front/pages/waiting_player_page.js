import React from 'react';
import {connect} from 'react-redux';
import UserStatus from '../pages/user_status';
const WaitingPlayer = (props) =>{
    let {waitingfor, updateStore, socket, user} = props;
    let handleCancel = () =>{
        updateStore({
            type: 'CANCELWAIT',
            data: {}
        });
        let msg = {
            type: 'cancel',
            payload: {_id: waitingfor._id}
        }
        socket.send(JSON.stringify(msg));
    }
    if(waitingfor){
        socket.handleDeclineMsg = ({type, payload})=>{
            if(payload._id === waitingfor._id){
                let elem = document.getElementById('game_layout')
                elem.querySelector('#w_msg').innerHTML = `<p style = 'color: red'>Player declined your request: ${payload.reason}</p>`;
                elem.querySelector('#w_btn').disabled = true;

                setTimeout(()=>{
                    updateStore({
                        type: 'CANCELWAIT',
                        data: {}
                    })
                },2000)
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
        return (
            <div style = {style}>
                <UserStatus status = {user}/>
                <div>Wait for ...</div>
                <UserStatus status = {waitingfor}/>
                <div id = 'w_msg'/>
                <button id = 'w_btn' onClick = {handleCancel}>cancel</button>
            </div>
        )
    }
    else{
        socket.handleDeclineMsg ? delete socket.handleDeclineMsg : "";
        return "";
    }

}
function mapStateToProps(state, ownProp){
    return {
        waitingfor: state.poong.waitingfor,
        socket: state.main.socket,
        user: state.main.user
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateStore: function(action){
            dispatch(action);
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(WaitingPlayer);