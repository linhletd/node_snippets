import React from 'react';
import {connect} from 'react-redux';
import BrowseUserPage from '../pages/browse_user_page';
import {withRouter} from 'react-router-dom';
import Guide from './guide_comp';
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
        this.guide = {
            id: 'poong_guide',
            array: [
                '"Poong Game" là game online dành cho 2 người chơi. Đươc xây dựng dựa trên các lý thuyết vật lý phổ thông về vector',
                'Websocket được sử dụng để giao tiếp 2 chiều, cho phép người chơi điều khiển đối tượng của mình',
                'Để bắt đầu chơi, hãy nhấn vào biểu tượng "add user" để mời một người bạn khác (đang online) tham gia',
                'Để điều khiển đối tượng di chuyển/ quay đến vị trí mong muốn, hãy nhấp chuột lên vị trí đó trên "sân chơi"',
                'Để bắn đối phương, nhấn nút phía dưới "sân chơi" hoặc nhấn phím shift',
            ],
            header: 'About Poong Game',
            closable: true,
            hide: true
        }
    }
    clickLife = () =>{
        if(this.life.current.className === ''){
            this.life.current.className = 'game_selected';
            this.props.history.replace('/game/life');
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
        // if(this.poong.current.className === ''){
            this.setState({showList: true})
        // }
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
    showPoongGuide(){
        document.getElementById('poong_guide').classList.remove('hide');
    }
    render(){
        let rows = this.matrix.map((cur,i) => (<tr key = {`t1${i}`}>{cur.map((val,j) => <td className = {val === 1 ? 'alive' : 'dead'} key = {`t1${i}${j}`}></td>)}</tr>))
        return(
            <div id = 'game_nav'>
                <div id = 'select_poong' ref = {this.poong}>
                    <div>
                        <div className = 'yard'>
                            <div className = 'iplayer'>
                                <div className = 'p_body' ></div>
                                <div className = 'p_hand'></div>
                            </div>
                            <span className = 'ibullet'/>
                        </div>
                        <div>
                            <i className="fa fa-user-plus" onClick = {this.openInviteBoard}></i>
                            <i className="fa fa-info-circle" onClick = {this.showPoongGuide}></i>
                        </div>
                    </div>
                    <BrowseUserPage children = {this.InviteButton} filter = {this.props.user._id} id = 'invite_board' className = 'hide'
                    attr = {{id: 'invite_list', className: 'board'}} childClass = 'user_small' closable = {true} close = {this.closeInviteBoard}/>
                    <Guide data = {this.guide}/>
                </div>
                <div id = 'select_life' ref = {this.life}>
                    <table>
                        <tbody>
                            {rows}
                        </tbody>
                    </table>
                    <i className="fa fa-play" onClick = {this.clickLife}></i>
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
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(GameNav));