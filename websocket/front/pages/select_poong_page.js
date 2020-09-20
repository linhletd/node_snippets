import React from 'react';
import {connect} from 'react-redux';
import BrowseUserPage from '../pages/browse_user_page';
import WaitingPlayer from '../pages/waiting_player_page';
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
        let _id = e.target.parentNode.className.slice(0, 24);
        let inviteId = `${_id.slice(18, 24)}${Math.floor(Math.random()*6)}${Date.now()}`;
        this.props.updateStore({
            type: 'WAITPLAYER',
            data: {_id, inviteId}
        })
        let msg = {
            type: 'invite',
            payload: {_id, inviteId}
        }
        this.props.socket.send(JSON.stringify(msg))
        this.closeInviteBoard.bind(this)();
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
                    <BrowseUserPage children = {this.InviteButton} filter = {this.props.user._id} 
                    attr = {{id: 'invite_list', className: 'board'}} childClass = 'small' closable = {true} close = {this.closeInviteBoard}/>
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