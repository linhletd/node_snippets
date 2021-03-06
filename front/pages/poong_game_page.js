import React from 'react';
import UserStatus from '../pages/user_status';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
import PoongPopup from '../pages/poong_popup_page';
import sendMsgViaSocket from '../utils/sendMsgViaSocket';

class PoongGame extends React.Component{
    constructor(props){
        super();
        this.game = React.createRef();
        this.unit = 'vw';
        this.hwratio = 0.5;
        if( innerWidth < 600){
            this.wratio = 0.94;
            this.width = Math.floor(100 * this.wratio);
        }
        else if(innerWidth < 1199){
            this.wratio = 0.9;
            this.width = Math.floor((innerWidth - 240 - 20)/innerWidth * 100 * this.wratio);
        }
        else{
            this.wratio = 0.9;
            this.width = Math.floor((innerWidth - 240 * 2 - 20)/innerWidth * 100 * this.wratio);
        }
        this.height = this.width * this.hwratio;
        this.xmin = 0; //left
        this.xmax = this.width; //left
        this.ymin = 0; //top
        this.ymax = this.height // top
        this.border = 0.5 * this.width; // left
        this.playerSize = 0.05 * this.width;
        this.bulletSize = 0.02 * this.width;
        this.playerStep = this.playerSize / 4;
        this.bulletStep = this.bulletSize / 4;
        this.bulletSpeed = 30; //ms
        this.playerSpeed = 100;
        this.bulletsStock = 10;
        this.shootDelay = 160;
        this.startGame(props);
    }
    startGame(props){
        this.mainPlayer = props.gameStatus.mainSide;
        this.subPlayer = this.mainPlayer === 'a' ? 'b' : 'a';
        this.freezed = false;
        this.playersList = new Map([
            ['a', {
                isAlive: true,
                x: this.xmin + 5,
                y: this.height / 2,
                alpha: 0,
                bulletsQty: this.bulletsStock,
                secret: undefined,
                id: 'a',
                side: props.gameStatus.sides['a']
            }],
            ['b', {
                isAlive: true,
                x: this.xmax - 5,
                y: this.height / 2,
                alpha: Math.PI,
                bulletsQty: this.bulletsStock,
                secret: undefined,
                id: 'b',
                side: props.gameStatus.sides['b']
            }]
        ]);
        this.itv = {
            mainGoing: undefined
        }
        this.bulletsList = new Map();
    }
    mainGo = (ev) =>{
        this.itv.mainGoing && clearInterval(this.itv.mainGoing) && (this.itv.mainGoing = undefined);
        if(this.freezed){
            return;
        }
        let player = this.playersList.get(this.mainPlayer);
        if(!player.isAlive){
            return;
        }
        let vw = innerWidth;
        let rect = ev.currentTarget.getBoundingClientRect(),
        offsetX = ev.clientX - rect.left,
        offsetY = ev.clientY - rect.top;
        let xc = offsetX/vw * 100, yc = offsetY/vw * 100;
        let mainPlayerGo = () => {
            let {playersList} = this;
            let playerId = this.mainPlayer;
            let player = playersList.get(playerId);
            let {x, y, alpha} = player;
            let deltaX = xc - x;
            let deltaY = yc - y;
            let dx, dy, alpha0 = alpha;
            let step = this.playerStep;
            let {sin, cos, PI} = Math;
            let _alpha = Math.atan(Math.abs((deltaY / deltaX)));
            if(deltaX > 0){
                deltaY > 0 ? (alpha = _alpha, dx = step * cos(_alpha), dy = step * sin(_alpha)) :
                (alpha = - _alpha, dx = step * cos(_alpha), dy = -step * sin(_alpha));
            }
            else {
                deltaY > 0 ? (alpha = PI -_alpha, dx = -step * cos(_alpha), dy = step * sin(_alpha)) :
                (alpha = -PI + _alpha, dx = -step * cos(_alpha), dy = -step * sin(_alpha));
            }
            let x0 = x, y0 = y;
            x = x + dx;
            y = y + dy;
            let {xmin, xmax, ymin, ymax, playerSize} = this;
            if((x < xmin + playerSize/2 || x > xmax - playerSize/2 || y < ymin + playerSize/2 || y > ymax - playerSize/2)){
                x = x0;
                y = y0;
            }
            else if((this.distance({x0, y0}, {x:xc,y:yc}) <= this.playerStep)){
                x = xc;
                y = yc;
                alpha = alpha0;
            }
            let msg = {
                type: 'go',
                payload: {x: x/this.width, y: y/this.width, alpha, inviteId: this.props.mutateData.inviteId}
            }
            sendMsgViaSocket(this.props, JSON.stringify(msg));
            player.x = x; player.y = y; player.alpha = alpha;
            let elem = document.getElementById('shooting_yard').querySelector(`#${this.mainPlayer}`);
            elem.style.left = `${x}vw`; elem.style.top = `${y}vw`; elem.style.transform = `rotate(${alpha}rad)`;
        }
        mainPlayerGo();
        this.itv.mainGoing = setInterval(mainPlayerGo, this.playerSpeed);
    }
    mainStop = (ev) =>{
        this.itv.mainGoing && clearInterval(this.itv.mainGoing) && (this.itv.mainGoing = undefined);
    }

    subPlayerGo = ({x, y, alpha}) =>{
        if(this.freezed){
            return;
        }
        let playerId = this.subPlayer;
        let player = this.playersList.get(playerId);
        player.x = x * this.width; player.y = y * this.width; player.alpha = alpha;
        let elem = document.getElementById('shooting_yard').querySelector(`#${playerId}`);
        elem.style.left = `${player.x}vw`; elem.style.top = `${player.y}vw`; elem.style.transform = `rotate(${alpha}rad)`;
    }
    shoot(playerId){
        if(this.freezed){
            return;
        }
        let player = this.playersList.get(playerId);
        if(!player.isAlive){
            return;
        }
        let {x, y, alpha, bulletsQty} = player;
        if(bulletsQty === 0){
            return;
        }
        if(playerId === this.mainPlayer){
            let msg = {
                type: 'shoot',
                payload: {
                    inviteId: this.props.mutateData.inviteId
                }
            }
            sendMsgViaSocket(this.props, JSON.stringify(msg))
        }

        let key = `${playerId}_${bulletsQty}`;
        let newBullet = {x0: x, y0: y, alpha, key, dxy: this.jump.bind(this)(alpha), isActive: true, owner: playerId};
        player.bulletsQty--;
        this.bulletsList.set(key, newBullet);
        this.setBoardState();
        let bullet = this.sampleBullet.cloneNode(true);
        bullet.style.left = `${x}vw`;
        bullet.style.top =  `${y}vw`;
        bullet.style.display = 'block';
        bullet.id = key;
        document.getElementById('bullets').appendChild(bullet);
        if(playerId === this.mainPlayer){
            setTimeout(()=>{
                this.bulletGo.bind(this, key)();
            }, this.shootDelay)
        }
        else{
            this.bulletGo.bind(this, key)();
        }
    }
    jump(alpha){
        let step = this.bulletStep;
        let dx, dy;
        let {PI, sin, cos} = Math
        alpha >= 0 && alpha <= PI/2 ? (dx = step * cos(alpha), dy = step * sin(alpha)) :
        alpha >= PI/2 && alpha <= PI ? (dx = step * -cos(PI - alpha), dy = step * sin(PI - alpha)) :
        alpha < -PI/2 && alpha > -PI ? (dx = step * -cos(PI + alpha), dy = step * -sin (PI + alpha)) :
        (dx = step * cos(-alpha), dy = step * -sin(-alpha));
        return {dx, dy}

    }
    bulletGo(key){
        if(this.freezed){
            return;
        }
        let {xmin, ymin, xmax, ymax, bulletSize} = this;
        let {playersList,bulletsList} = this;
        let bullet = bulletsList.get(key)
        function ifCollidePlayer(){
            let checked = false;
            playersList.forEach((player) => {
                if(bullet.owner === player.id || !player.isAlive){
                    return;
                }
                let distance = this.distance(bullet, player);
                if(distance < (this.bulletSize + this.playerSize) / 2 ){
                    checked = true;
                    player.isAlive = false;
                    let elem1 = document.getElementById('shooting_yard').querySelector(`#${player.id}`);
                    elem1.style.backgroundColor = 'grey';
                    this.freezed = true;
                    setTimeout(() =>{
                        this.props.updateStore({
                            type: 'FINISHGAME',
                            data:{
                                result: player.id === this.mainPlayer ? 'loose' : 'win',
                                subPlayer: {_id: this.mainPlayer === 'a' ? this.props.gameStatus.sides['b'] : this.props.gameStatus.sides['a']}
                            }
                        })
                    }, 800)
                    this.setBoardState()
                }
            })
            if(checked){
                bullet.isActive = false;
                let elem = document.getElementById('shooting_yard').querySelector(`#${key}`);
                elem.style.backgroundColor = 'grey';
                return true;
            }
        }
        function reflect(type){
            let alpha = bullet.alpha;
            let {PI, abs, sign} = Math;
            let newAlpha;
            if(alpha === 0){
                newAlpha = PI
            }
            else {
                switch(type){
                    case 1:
                        newAlpha = sign(alpha) * (PI - abs(alpha));
                        break;
                    case 2:
                        newAlpha = -alpha;
                        break;
                    case 3:
                        newAlpha = -sign(alpha) * (PI - abs(alpha));
                }
            }
            bullet.owner = null;
            bullet.alpha = newAlpha;
            bullet.dxy = this.jump.bind(this)(newAlpha);
        }
        let itv = setInterval(() =>{
            if(this.freezed) return clearInterval(itv);
            if(ifCollidePlayer.bind(this)()){
                clearInterval(itv);
                this.itv.mainGoing && clearInterval(this.itv.mainGoing) && (this.itv.mainGoing = undefined);
                return;
            }
            let type;

            let {dx, dy} = bullet.dxy,
                {x0, y0} = bullet,
                _x0 = bullet.x0 + dx,
                _y0 = bullet.y0 + dy;
            if (_x0 <= xmin + bulletSize/2 && (type = 1) && (_x0 = xmin + bulletSize/2) && (_y0 = y0 + (_x0 - x0) * dy/dx) ||
                _x0 >= xmax - bulletSize/2 && (type = 1) && (_x0 = xmax - bulletSize/2) && (_y0 = y0 + (_x0 - x0) * dy/dx)  ||
                _y0 <= ymin + bulletSize/2 && (type = 2) && (_y0 = ymin + bulletSize/2) && (_x0 = x0 + (_y0 - y0) * dx/dy) ||
                _y0 >= ymax - bulletSize/2 && (type = 2) && (_y0 = ymax - bulletSize/2) && (_x0 = x0 + (_y0 - y0) * dx/dy) 
                )
              {
                _x0 === _y0 ? type = 3: "";
                reflect.bind(this)(type);
                bullet.x0 = _x0;
                bullet.y0 = _y0;
            }
            else {
                bullet.x0 += dx;
                bullet.y0 += dy; 
            }
            let elem = document.getElementById('shooting_yard').querySelector(`#${key}`);
            elem.style.left = `${bullet.x0}vw`;
            elem.style.top = `${bullet.y0}vw`
        }, this.bulletSpeed)
    }
    distance({x0, y0}, {x, y}){
        let {sqrt, pow} = Math;
        return sqrt(pow(x - x0, 2) + pow(y - y0, 2));
    }
    leaveGame = () =>{
        this.setBoardState = () =>{};
        this.freeze()
        let {updateStore} = this.props, {inviteId} = this.props.mutateData;
        let msg = {
            type: 'leave',
            payload: {inviteId}
        }
        sendMsgViaSocket(this.props, JSON.stringify(msg));
        updateStore({
            type: 'ENDGAME',
            data: {}
        })
    }
    handleLeaveMsg = () =>{
        this.freezed = true;
        this.props.updateStore({
            type: 'LEAVEGAME',
            data: {}
        })
    }
    handleContinueMsg = () =>{
        this.props.updateStore({
            type: 'CONTINUEMSG',
            data: {}
        })
    }
    handleSocket(){
        if(this.freezed){
            return;
        }
        let socket = this.props.socket;
        socket.handleGame = ({type, payload}) => {
            switch(type){
                case 'go':
                    return this.subPlayerGo(payload);
                case 'shoot':
                    return this.shoot.bind(this,this.subPlayer)();
                case 'leave':
                    return this.handleLeaveMsg();
                case 'continue':
                    return this.handleContinueMsg()
                
            }
        }
    }
    handleClickZkey = (e) =>{
        if(this.mainPlayer && e.key.toLowerCase() === 'z'){
            this.shoot.bind(this)(this.mainPlayer);
        }
    }
    freeze = () =>{
        this.freezed = true;
        Object.keys(this.itv).map(cur =>{
            cur && clearInterval(cur)
        })
    }
    shouldComponentUpdate(nextProps){
        let newSocket = nextProps.socket;
        if(newSocket && newSocket !== this.props.socket){
            this.leaveGame();
            this.props.history.replace('/game');
            return false;
        }
        this.startGame(nextProps);
        return true;
    }
    componentDidMount(){
        this.handleSocket.bind(this)();
        this.sampleBullet = document.getElementById('shooting_yard').querySelector('#b_sample');
        window.addEventListener('keyup', this.handleClickZkey);

    }
    componentWillUnmount(){
        delete this.props.socket.handleGame;
        window.removeEventListener('keyup', this.handleClickZkey);
        this.leaveGame();
    }
    render(){
        let self = this;
        class PlayerBoard extends React.Component{
            constructor(props){
                super();
                this.state = {
                    x: true
                };
                self.setBoardState = (cb) =>{
                    this.setState({x: !this.state.x}, cb);
                };
            }
            render(){ 
                let ScoreStatus = (props) =>{
                    return (
                        <div className = 'score_status'>
                            <span>bullets:&nbsp;{props.bulletsQty}<span className = 'ibullet'/></span>
                            <span>alive:&nbsp;<i className={props.isAlive ? "fa fa-meh-o alive" : "fa fa-meh-o dead"}/></span>
                        </div>
                    )
                }
                return (
                    <div id = 'player_board'>
                        {[...self.playersList.values()].map(side => <UserStatus key = {side.side.slice(18)} status = {{_id: side.side}} childClass = 'user_small'
                         children = {<ScoreStatus bulletsQty = {side.bulletsQty} isAlive = {side.isAlive}/>}/>)}
                    </div>
                )
            }
        }
        let SampleBullet = () =>{
            let bulletHeart = {
                position: 'absolute',
                width: '0.01px',
                height: '0.01px',
                left: `0vw`,
                top: `0vw`,
                backgroundColor: 'orangered',
                display: 'none'

            }
            let bulletBody = {
                position: 'absolute',
                width: `${this.bulletSize}vw`,
                height: `${this.bulletSize}vw`,
                borderRadius: '50%',
                left: `-${this.bulletSize/2}vw`,
                top: `-${this.bulletSize/2}vw`,
                backgroundColor: 'inherit'
            }
            return (
                <div id = 'b_sample' style = {bulletHeart}>
                    <div style = {bulletBody}/>
                </div>
            )
        };
        let Players = () => {
            let {playersList} = this;
            let Player = (props) =>{
                let {player} = props;
                let heart = {
                    position: 'absolute',
                    left: `${player.x}vw`,
                    top: `${player.y}vw`,
                    transform: `rotate(${player.alpha}rad)`,
                    width: '0.01px',
                    height: '0.01px',
                    backgroundColor: player.isAlive ? player.id === 'a' ? 'green' : 'blue' : 'grey',
                    margin: '0px 0px',
                    padding: '0px 0px'
    
                }
                let body = {
                    position: 'absolute',
                    width: `${this.playerSize}vw`,
                    height: `${this.playerSize}vw`,
                    borderRadius: '50%',
                    left: `-${this.playerSize/2}vw`,
                    top: `-${this.playerSize/2}vw`,
                    backgroundColor: 'inherit',
                    opacity: 0.7,
                }
                let hand = {
                    position: 'absolute',
                    width: '0vw',
                    height: '0vw',
                    borderTop: `${this.playerSize/4}vw solid transparent`,
                    borderBottom: `${this.playerSize/4}vw solid transparent`,
                    borderLeft: `${this.playerSize/2}vw solid #555`,
                    top: `-${this.playerSize/4}vw`,
                    left: `${this.playerSize/4}vw`,
                    opacity: 0.7,
    
                }
                return (
                    <div className = 'player' id = {player.id} style = {heart}>
                        <div style = {body}></div>
                        <div style = {hand}></div>
                    </div>
                )
            }
            return (
                <div id = 'players'>
                    {[...playersList.values()].map((player) =>{
                        return  <Player player = {player} key = {player.id}/>
                    })}
                </div>
            )
        }
        let mainStyle = {
            border: '2px solid grey',
            position: 'relative',
            padding: '0px 0px',
            width: `${this.width}vw`,
            height: `${this.height}vw`,
        }
        const Game = () =>{
            return (
                <div>
                    <div id = 'shooting_yard' style = {mainStyle} onMouseDown = {this.mainGo} onMouseUp = {this.mainStop} onMouseLeave = {this.mainStop} >
                        <Players/>
                        <SampleBullet/>
                        <div id = 'bullets'/>
                        <div id = 'poong_popup' className = 'hide'>
                            <PoongPopup/>
                        </div>
                    </div>
                    <button id = "shoot" onClick = {this.shoot.bind(this,this.mainPlayer)}>shoot</button> {/*do not replace this.shoot... by other method that already binding, because of this.mainplayer*/}                    
                </div>

            )
        }
        return(
            <div id = 'poong_game' ref = {this.game}>
                <PlayerBoard/>
                <Game/>
            </div>
        )
    }
}
function mapStateToProps(state){
    return {
        socket: state.main.socket,
        gameStatus: state.poong.gameStatus,
        mutateData: state.poong.mutateData
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateStore: function(action){
            dispatch(action);
        }
    }
}
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(PoongGame));