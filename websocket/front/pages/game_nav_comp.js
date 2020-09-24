import React from 'react';
import {connect} from 'react-redux';
import BrowseUserPage from '../pages/browse_user_page';
class GameNav extends React.Component{
    constructor(props){
        super();
        this.state = {
            showList: false,
        }
        this.InviteButton = (props) =>{
            return <button disabled ={!props.isOnline} onClick = {this.invite}>Invite</button>
        }
        this.InviteButton.attr = 'isOnline';//parent will pass this attribute
        let matrix = [];
        let m = 9;
        let n = 16;
        for(let i = 0; i < m; i++){
            matrix[i] = new Array(m)
            for(let j = 0; j < n; j++){
            matrix[i][j] = Math.round(Math.random()*0.6);
            }
        }
        this.matrix = matrix;
        this.life = React.createRef();
        this.poong = React.createRef();
        this.userBoard
    }
    clickLife = () =>{
        if(this.life.current.className === ''){
            this.life.current.className = 'game_selected';
            this.props.history.push('/game/life')
        }
    }
    shouldComponentUpdate(nextProps, nextState){
        if(nextProps.waitingFor || nextState.showList){
            this.life.current.className = 'game_disabled';
            this.poong.current.className = 'game_disabled';
        }
        else if(!nextProps.waitingFor && !nextState.showList){
            if(nextProps.gameStatus){
                this.poong.current.className = 'game_selected';
            }
            else{
                this.life.current.className = '';
                this.poong.current.className = '';
            }
        }
        if(nextState.showList !== this.state.showList){
            let node = document.getElementById('invite_board');
            if(node){
                nextState.showList && node.classList.remove('hide');
                !nextState.showList && !node.classList.contains('hide') && node.classList.add('hide');
            }
        }
        return false;
    }
    openInviteBoard = () =>{
        console.log(this.poong.current)
        if(this.poong.current.className === ''){
            this.setState({showList: true})
        }
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
        let rows = this.matrix.map((cur,i) => (<tr key = {`t1${i}`}>{cur.map((val,j) => <td className = {val === 1 ? 'alive' : 'dead'} key = {`t1${i}${j}`}></td>)}</tr>))
        return(
            <div id = 'game_nav'>
                <div id = 'select_life' ref = {this.life}>
                    <table>
                        <tbody>
                            {rows}
                        </tbody>
                    </table>
                    <i className="fa fa-play" onClick = {this.clickLife}></i>
                </div>
                <div id = 'select_poong' ref = {this.poong}>
                    <div>
                        <div className = 'yard'>
                            <div className = 'iplayer'>
                                <div className = 'p_body' ></div>
                                <div className = 'p_hand'></div>
                            </div>
                            <span className = 'ibullet'/>
                        </div>
                        <i className="fa fa-user-plus" onClick = {this.openInviteBoard}></i>
                    </div>
                    <BrowseUserPage children = {this.InviteButton} filter = {this.props.user._id} id = 'invite_board' className = 'hide'
                    attr = {{id: 'invite_list', className: 'board'}} childClass = 'user_small' closable = {true} close = {this.closeInviteBoard}/>
                </div>
            </div>
        )

    }
}
function mapStateToProps(state, ownProp){
    return {
        user: state.main.user,
        socket: state.main.socket,
        waitingFor: state.poong.waitingFor,
        gameStatus: state.poong.gameStatus,
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateStore: function(action){
            dispatch(action);
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(GameNav);