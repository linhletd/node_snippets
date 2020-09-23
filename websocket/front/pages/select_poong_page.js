import React from 'react';
import {connect} from 'react-redux';
import BrowseUserPage from '../pages/browse_user_page';
class SelectPoong extends React.Component {
    constructor(){
        super()
        this.state = {
            showList: false,
        }
        this.InviteButton = (props) =>{
            return <button disabled ={!props.isOnline} onClick = {this.invite}>Invite</button>
        }
        this.InviteButton.attr = 'isOnline';//parent will pass this attribute
    }
    openInviteBoard = () =>{
        this.setState({showList: true})
    }
    invite = (e) =>{
        let _id = e.target.parentNode.parentNode.className.slice(0, 24);
        let inviteId = `${_id.slice(18, 24)}${Math.floor(Math.random()*6)}${Date.now()}`;
        this.props.updateStore({
            type: 'WAITPLAYER',
            data: {_id, inviteId}
        })
        let msg = {
            type: 'invite',
            payload: {_id, inviteId}
        }
        this.sendMsgViaSocket(JSON.stringify(msg))
        this.closeInviteBoard.bind(this)();
    }
    sendMsgViaSocket = (msg) =>{
        let {socket} = this.props;
        console.log(socket.readyState)
        if(socket.readyState === 2 || socket.readyState === 3){
            let ws = new window.WebSocket('ws://localhost:8080');
            this.props.updateStore({type: 'OPENSOCKET', data: ws});
            ws.onopen = (e) =>{
                ws.send(msg);
            }
        }
        else{
            socket.send(msg);
        }
        
    }
    closeInviteBoard = () =>{
        if(this.state.showList){
            this.setState({showList: false})
        }
    }
    render(){
        let SelectPoongBtn = () => (<button onClick = {this.openInviteBoard}>click to call friend</button>)
        return (
            <div id = 'select_poong'>
                <SelectPoongBtn/>
                {
                    this.state.showList ? 
                    <BrowseUserPage children = {this.InviteButton} filter = {this.props.user._id} id = 'invite_board'
                    attr = {{id: 'invite_list', className: 'board'}} childClass = 'user_small' closable = {true} close = {this.closeInviteBoard}/>
                    : ""
                }
                 <WaitingPlayer/>
            </div>
        )
    }

}
function mapStateToProps(state, ownProp){
    return {
        user: state.main.user,
        socket: state.main.socket,
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateStore: function(action){
            dispatch(action);
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(SelectPoong);