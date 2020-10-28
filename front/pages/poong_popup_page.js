import React from 'react';
import UserStatus from '../pages/user_status';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import {runNotation, stopRunNotation} from '../utils/operateNotationWait';
import WaittingNotation from '../ui/waitting_notation';
import sendMsgViaSocket from '../utils/sendMsgViaSocket';
class PoongPopup extends React.Component {
    constructor(props){
        super();
        this.runNotation = runNotation.bind(this);
        this.stopRunNotation = stopRunNotation.bind(this);

        this.popup = React.createRef();
        this.state = {
            continuable: false
        }
    }
    confirmContinueGame = () =>{
        let {updateStore} = this.props, {inviteId} = this.props.mutateData;
        let msg = {
            type: 'continue',
            payload: {inviteId}
        }
        sendMsgViaSocket(this.props, JSON.stringify(msg));
        this.setState({continuable: true});
        updateStore({
            type: 'CONTINUEGAME',
            data: {}
        })
    }
    confirmLeaveGame = () =>{
        this.stopRunNotation();
        this.props.history.replace('/game');
    }
    componentDidUpdate(){
        document.getElementById('poong_popup').classList.remove('hide')
    }
    componentWillUnmount(){
        this.stopRunNotation();
    }
    render(){
        let wrapper = document.getElementById('poong_popup');
        if(!this.props.popup){
            wrapper && !wrapper.classList.contains('hide') && wrapper.classList.add('hide');
            return '';
        }
        wrapper && wrapper.classList.contains('hide') && wrapper.classList.remove('hide');
        let {type, title, graspedInfo, subPlayer} = this.props.popup, user = this.props.user;
        switch(type){
            case 'leave':
                return (
                    <div className = 'poong_popup'>
                        <p>{title}</p>
                        <button onClick = {this.confirmLeaveGame}>OK</button>
                    </div>
                )
            case 'finish':
                let header = <p>{title === 'win' ? 'Congratulation! you win : )' : 'Sorry! you loose :('}</p>
                if(this.state.continuable){
                    return (
                        <div ref = {this.popup} className = 'poong_popup'>
                            <div className = 'wait_player'>
                                <UserStatus status = {user} childClass = 'user_small'/>
                                <WaittingNotation run = {this.runNotation}/>
                                <UserStatus status = {subPlayer} childClass = 'user_small'/>
                            </div>
                            <button onClick = {this.confirmLeaveGame}>Cancel</button> 
                        </div>
                    )
                }
                else{
                    return (
                        <div ref = {this.popup} className = 'poong_popup'>
                            {title === 'win' ? <i className="fa fa-universal-access win_ico"></i> : 
                            <i className="fa fa-wheelchair loose_ico"></i>}
                            {graspedInfo ? 
                            <div className = 'wait_player'>
                                <UserStatus status = {subPlayer} childClass = 'user_small' noName = {true}/>
                                <div>
                                    <WaittingNotation run = {this.runNotation}/>
                                    <p className = 'fb_msg'>{graspedInfo}</p>
                                </div>
                            </div> : header}
                            <div id = 'btn_ctn'>
                                <button onClick = {this.confirmContinueGame}>continue</button>
                                <button onClick = {this.confirmLeaveGame}>quit</button>
                            </div>
                        </div>
                    )
                }
            default: return ''
        }
    }
}
function mapStateToProps(state, ownProp){
    return {
        user: state.main.user,
        mutateData: state.poong.mutateData,
        popup: state.poong.popup,
        socket: state.main.socket
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