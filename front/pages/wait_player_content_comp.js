import React from 'react';
import {connect} from 'react-redux';
import UserStatus from '../pages/user_status';
import WaittingNotation from '../ui/waitting_notation';
import sendMsgViaSocket from '../utils/sendMsgViaSocket';
class WaitPlayerPopupContent extends React.Component{
    constructor(props){
        super();
        this.waitTimer = undefined;
        this.popup = React.createRef();
    }
    runNotation = (parNode) =>{
        if(!parNode || !parNode.children.length){
            return;
        }
        let run;
        (run = (cur)=>{
            if(cur.classList.contains('lowlight')){
                cur.classList.remove('lowlight');
            }
            cur.classList.add('highlight');
            this.waitTimer = setTimeout(() =>{
                cur.classList.remove('highlight');
                if(cur.nextSibling){
                    cur = cur.nextSibling;
                }
                else{
                    cur = parNode.firstChild;
                }
                run(cur)
            },800)
        })(parNode.firstChild)
    }
    stopRunNotation = () =>{
        clearTimeout(this.waitTimer);
        this.waitTimer = undefined;
        let parNode = this.popup.current.querySelector('.wait_ctn');
        if(!parNode || !parNode.children.length){
            return;
        }
        parNode.childNodes.forEach(elem => {
            if(elem.classList.contains('highlight')){
                elem.classList.remove('highlight');
            }
            elem.classList.add('lowlight');
        });
    }
    handleCancel = () =>{
        clearTimeout(this.waitTimer)
        this.props.data.close();
        let {waittingFor} = this.props.data;
        let msg = {
            type: 'cancel',
            payload: {_id: waittingFor._id}
        }
        sendMsgViaSocket(this.props, JSON.stringify(msg));
    }
    handlePlayerOffline = () =>{
        this.stopRunNotation();
        let p = this.popup.current.querySelector('.fb_msg');
        p.innerText = 'Your Invitation has been terminated';
        p.classList.remove('hide');
        setTimeout(()=>{
            this.props.data.close();
        },5000)
    }
    shouldComponentUpdate(){
        this.popup.current.querySelector('.w_btn').innerText = 'Cancel';
        let p = this.popup.current.querySelector('.fb_msg');
        p.classList.add('hide');
        p.innerText = 'Your friend has declined your invitation';
        return true;
    }
    componentWillUnmount(){
        this.props.socket.handleDeclineMsg && delete this.props.socket.handleDeclineMsg;
    }
    render(){
        let {user, data, socket, updateStore} = this.props;
        let {waittingFor, history} = data;
        socket.waitinfo = {
            handleDeclineMsg: ({type, payload})=>{ 
                if(payload._id === waittingFor._id){
                    this.stopRunNotation();
                    this.popup.current.querySelector('.w_btn').innerText = 'OK';
                    this.popup.current.querySelector('.fb_msg').classList.remove('hide');
                    setTimeout(()=>{
                        this.props.data.close();
                    },5000)
                }
            },
            handleAcceptMsg: ({payload})=>{
                if(payload.inviteId === waittingFor.inviteId){
                    updateStore({
                        type: 'ACTIVEGAME',
                        data: {
                            inviteId: waittingFor.inviteId,
                            mainSide: 'a',
                            mainUId: user._id,
                            subUId: payload._id
                        }
                    });
                    this.stopRunNotation();
                    this.props.data.close();
                    history.push('/game/poong');
                }
            }
        }
        return (
            <div ref = {this.popup}>
                <div className = 'wait_player'>
                    <UserStatus status = {user} childClass = 'user_small'/>
                    <WaittingNotation run = {this.runNotation}/>
                    <UserStatus status = {waittingFor} childClass = 'user_small' handleOffline = {this.handlePlayerOffline}/>
                </div>
                <p className = 'fb_msg hide'>Your friend has declined your invitation</p>
                <button className = 'w_btn' onClick = {this.handleCancel}>Cancel</button>
            </div>
        )
    }

}
function mapStateToProps(state, ownProp){
    return {
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
export default connect(mapStateToProps, mapDispatchToProps)(WaitPlayerPopupContent);