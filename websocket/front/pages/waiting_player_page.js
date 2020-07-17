import React from 'react';
import {connect} from 'react-redux';
import {useHistory} from 'react-router-dom';
import UserStatus from '../pages/user_status';
const WaitingPlayer = (props) => {
    let {waitingfor, updateStore, user, socket} = props;
    let history = useHistory();
    let handleCancel = () =>{
        updateStore({
            type: 'CANCELWAITGAME',
            data: {}
        });
        let msg = {
            type: 'cancel wait',
            payload: waitingfor
        }
        socket.send(JSON.stringify(msg));
        history.replace('/game');
    }
    if(waitingfor){
        return (
            <div >
                <UserStatus status = {user}/>
                <div>Wait for ...</div>
                <UserStatus status = {waitingfor}/>
                <button onClick = {handleCancel}>cancel</button>
            </div>
        )
    }
    else{
        return ""
    }

}
function mapStateToProps(state, ownProp){
    return {
        waitingfor: state.waitingfor,
        socket: state.socket,
        user: state.user
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