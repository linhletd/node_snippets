import React from 'react';
import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom';
import BrowseUserPage from '../pages/browse_user_page';
import Guide from './guide_comp';
import WaitPlayerPopupContent from '../pages/wait_player_content_comp'
class GameNav extends React.Component{
    constructor(props){
        super();
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
                'Để bắn đối phương, nhấn nút phía dưới "sân chơi" hoặc nhấn phím z',
            ],
            header: 'About Poong Game',
            closable: true,
            hide: true
        }
    }
    clickLife = () =>{
        this.props.history.replace('/game/life');
    }
    shouldComponentUpdate(nextProps, nextState){
        console.log(nextProps.location.pathname, this.props.location.pathname)
        if(nextProps.location.pathname === '/game/poong' && nextProps.location.pathname !== this.props.location.pathname){
            !this.poong.current.classList.contains('game_selected') && this.poong.current.classList.add('game_selected');
            this.life.current.classList.contains('game_selected') && this.life.current.classList.remove('game_selected');
            this.closeInviteBoard();
            this.closePoongGuide();
            return false;
        }
        if(nextProps.location.pathname === '/game/life' && nextProps.location.pathname !== this.props.location.pathname){
            !this.life.current.classList.contains('game_selected') && this.life.current.classList.add('game_selected');
            this.poong.current.classList.contains('game_selected') && this.poong.current.classList.remove('game_selected');
            return false;
        }
        if(nextProps.location.pathname === '/game' && ['/game/poong', '/game/life'].indexOf(this.props.location.pathname) > -1){
            this.life.current.classList.contains('game_selected') && this.life.current.classList.remove('game_selected');
            this.poong.current.classList.contains('game_selected') && this.poong.current.classList.remove('game_selected');
        }
        return false;
    }
    componentDidMount(){
        this.props.location.pathname === '/game/life' && !this.life.current.classList.contains('game_selected') && this.life.current.classList.add('game_selected');
    }
    openInviteBoard = () =>{
        let node = document.getElementById('invite_board');
        if(node){
            node.classList.contains('hide') && node.classList.remove('hide');
        }
    }
    closePopup(){
        let global = document.querySelector('.global_popup');
        !global.classList.contains('hide') && global.classList.add('hide');
    }
    invite = (e) =>{
        let _id = e.target.parentNode.parentNode.className.slice(0, 24);
        let inviteId = `${_id.slice(18, 24)}${Math.floor(Math.random()*6)}${Date.now()}`;
        let global = document.querySelector('.global_popup');
        let popupData = {
            waittingFor: {_id, inviteId},
            close: this.closePopup,
            history: this.props.history,
        }
        global.classList.contains('hide') && global.classList.remove('hide');
        this.props.updateStore({
            type: 'WAITPLAYER',
            data: {
                className: 'wait_poong',
                children: <WaitPlayerPopupContent data = {popupData}/>
            }
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
            let ws = new window.WebSocket('wss://linhletd.glitch.me');
            this.props.updateStore({type: 'OPENSOCKET', data: ws});
            ws.onopen = (e) =>{
                ws.send(msg);
            }
        }
        else{
            try{
                socket.send(msg);
            }
            catch(e){
                if(socket.readyState === 0){
                    socket.addEventListener('open', () =>{
                    socket.send(msg);
                    })
                }
            }
        }
        
    }
    openInviteBoard = () =>{
        let node = document.getElementById('invite_board');
        if(node){
            node.classList.contains('hide') && node.classList.remove('hide');
            node.querySelector('input').focus();
        }
    }
    closeInviteBoard = () =>{
        let node = document.getElementById('invite_board');
        if(node){
            !node.classList.contains('hide') && node.classList.add('hide');
        }
    }
    showPoongGuide(){
        let node = document.getElementById('poong_guide');
        if(node){
            node.classList.contains('hide') && node.classList.remove('hide');
        }
    }
    closePoongGuide(){
        let node = document.getElementById('poong_guide');
        if(node){
            !node.classList.contains('hide') && node.classList.add('hide');
        }
    }
    render(){
        let rows = this.matrix.map((cur,i) => (<tr key = {`t1${i}`}>{cur.map((val,j) => <td className = {val === 1 ? 'alive' : 'dead'} key = {`t1${i}${j}`}></td>)}</tr>))
        let mainProps = {filter: this.props.user._id, id: 'invite_board', className: 'hide', closable: true, close: this.closeInviteBoard};
        let parProps = {id: 'invite_list', className: 'board'};
        let childProps = {childClass: 'user_small', children: this.InviteButton};
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
                            <i id = "play_poong" className="fa fa-user-plus" onClick = {this.openInviteBoard}></i>
                            <i className="fa fa-info-circle" onClick = {this.showPoongGuide}></i>
                        </div>
                    </div>
                    <BrowseUserPage mainProps = {mainProps} parProps = {parProps} childProps = {childProps}/>
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