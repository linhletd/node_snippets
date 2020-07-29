import React from 'react';
import UserStatus from '../pages/user_status';
import {Redirect, withRouter} from 'react-router-dom';
import {connect} from 'react-redux'
class PoongPopup extends React.Component {
    constructor(props){
        super(props)
        this.state = {
            continuable: false
        }
    }
    confirmContinueGame = () =>{
        let {socket, updateStore} = this.props, {inviteId} = this.props.mutateData;
        let msg = {
            type: 'continue',
            payload: {inviteId}
        }
        socket.send(JSON.stringify(msg));
        this.setState({continuable: true}, ()=>{
            this.state.continuable = false;
        })
        updateStore({
            type: 'CONTINUEGAME',
            data: {}
        })
    }
    confirmLeaveGame = () =>{
        this.props.history.replace('/game')
    }
    render(){
        if(!this.props.popup) return '';
        let {type, title, graspedInfo} = this.props.popup;
        let style = {
            width: '300px',
            height: '200px',
            border: '1px solid yellow',
            position: 'fixed',
            top: '50%',
            left: '50%',
            backgroundColor: 'cyan'

        }
        switch(type){
            case 'leave':
                return (
                    <div id = 'leave_game_popup' style = {style}>
                        <p>{title}</p>
                        <button onClick = {this.confirmLeaveGame}>ok</button>
                    </div>
                )
            case 'finish':
                return (
                    <div id = 'end_game_popup' style = {style}>
                        <p>{title}</p>
                        {
                            this.state.continuable ?
                            <button onClick = {this.confirmLeaveGame}>cancel</button> :
                            <div>
                                {graspedInfo ? <p style = {{color: 'red'}}>{graspedInfo}</p> : ""}
                                <button onClick = {this.confirmContinueGame.bind(this)}>continue</button>
                                <button onClick = {this.confirmLeaveGame}>quit</button>
                            </div>
                        }
                    </div>
                )
            default: return ''
        }
    }
}
function mapStateToProps(state, ownProp){
    return {
        user: state.main.user,
        socket: state.main.socket,
        gameStatus: state.poong.gameStatus,
        mutateData: state.poong.mutateData,
        popup: state.poong.popup
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateStore: function(action){
            dispatch(action);
        }
    }
}
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PoongPopup));