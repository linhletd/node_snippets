import React from 'react';
import {withRouter} from 'react-router-dom';
import {connect} from 'react-redux';
class PoongGame extends React.Component{
    constructor(props){
        super(props);

        this.unit = 'vmin';
        this.hwratio = 0.6;
        let vmin = Math.min(innerWidth, innerHeight),
            vmax = Math.max(innerWidth, innerHeight);
        this.width = Math.floor((vmax/vmin) * 100 * 0.8);
        this.height = this.width * this.hwratio;
        this.xmin = 0; //left
        this.xmax = this.width; //left
        this.ymin = 0; //top
        this.ymax = this.height // top
        this.border = 0.5 * this.width; // left
        this.playerSize = 10;
        this.bulletSize = 4;
        this.playerStep = this.playerSize / 4;
        this.bulletStep = this.bulletSize/4;
        this.bulletSpeed = 50; //ms
        this.playerSpeed = 150;
        this.mainPlayer = 'a';
        this.subPlayer = this.mainPlayer === 'a' ? 'b' : 'a';
        this.state = {
            freeze: false,
            playersList: new Map([
                ['a', {
                    isAlive: true,
                    x: this.xmin + 5,
                    y: this.height / 2,
                    alpha: 0,
                    bulletsQty: 10,
                    secret: undefined,
                    id: 'a'
                }],
                ['b', {
                    isAlive: true,
                    x: this.xmax - 5,
                    y: this.height / 2,
                    alpha: Math.PI,
                    bulletsQty: 10,
                    secret: undefined,
                    id: 'b'  
                }]
            ]),
            bulletsList: new Map(),
            itv: {
                mainGo: undefined
            },
            abooms: [],
            bbooms: []
        };
    }
    handleMouseDown(ev){
        this.state.itv.mainGo && clearInterval(this.state.itv.mainGo);
        if(this.state.freeze){
            return;
        }
        let player = this.state.playersList.get(this.mainPlayer);
        if(!player.isAlive){
            return;
        }
        let vmin = Math.min(innerWidth, innerHeight);
        let rect = ev.currentTarget.getBoundingClientRect(),
        offsetX = ev.clientX - rect.left,
        offsetY = ev.clientY - rect.top;
        let xc = offsetX/vmin * 100, yc = offsetY/vmin * 100;
        let mainPlayerGo = () => {
            let {playersList} = this.state;
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
            // send type: go, alpha
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
            let newPlayerState = Object.assign({}, player, {x, y, alpha});
            let newState = new Map([...playersList]);
            newState.set(playerId, newPlayerState);
            this.setState({playersList: newState})
        }
        mainPlayerGo();
        this.state.itv.mainGo = setInterval(mainPlayerGo,this.playerSpeed);
    }
    handleMouseUp(ev){
        if(this.state.freeze){
            return;
        }
        this.state.itv.mainGo && clearInterval(this.state.itv.mainGo);
    }
    shootingClick(ev){
        // e.preventDefault()

    }

    subPlayerGo(alpha){
        let playerId = this.mainPlayer === 'a' ? 'b' : 'a';
        let newPlayer = Object.assign({},this.playersList.get(playerId));
        let {dx, dy} = jump(alpha, this.playerStep)
        newPlayer.x += dx;
        newPlayer.y += dy;
        let newPlist = new Map([...this.state.playersList]);
        newPlist.set(playerId, newPlayer);
        this.setState({playersList: newPlist})
    }
    shoot(playerId){
        if(this.state.freeze){
            return;
        }
        let player = this.state.playersList.get(playerId);
        if(!player.isAlive){
            return;
        }
        let {x, y, alpha, bulletsQty} = player;
        if(bulletsQty === 0){
            return;
        }
        let key = `${playerId}_${bulletsQty}`
        let newBullet = {x0: x, y0: y, alpha, key, dxy: this.jump.bind(this)(alpha), isActive: true, owner: playerId}
        let newBulletentries  = [...this.state.bulletsList];
        player.bulletsQty--;
        newBulletentries.push([key, newBullet]);
        this.setState({bulletsList: new Map(newBulletentries)}, this.bulletGo.bind(this, key, this.subPlayer)) //, this.bulletGo.bind(this, key, playerId)
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
        let {xmin, ymin, xmax, ymax, bulletSize} = this;

        function ifCollidePlayer(){
        let {bulletsList, playersList} = this.state;
        let checked = false;
        playersList.forEach((player) => {
            if(bulletsList.get(key).owner === player.id || !player.isAlive){
                return;
            }
            let distance = this.distance(bulletsList.get(key), player);
            if(distance < (this.bulletSize + this.playerSize) / 2 ){
                checked = true;
                let targetPlayer = Object.assign({}, playersList.get(player.id));
                targetPlayer.isAlive = false;
                let newPList = new Map([...playersList]);
                newPList.set(player.id, targetPlayer);
                this.setState({playersList: newPList})
            }
        })
        if(checked){
            let targetBullet = Object.assign({},bulletsList.get(key));
            targetBullet.isActive = false;
            let newBList =  new Map([...bulletsList]);
            newBList.set(key, targetBullet);
            this.setState({bulletsList: newBList});
            return true;
        }
        }
        function reflect(type, mutate){
            let alpha = mutate.alpha;
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
            mutate.owner = null;
            mutate.alpha = newAlpha;
            mutate.dxy = this.jump.bind(this)(newAlpha);
        }
        let itv = setInterval(() =>{
            let {bulletsList} = this.state;
            let newBullet = Object.assign({}, bulletsList.get(key));
            if(ifCollidePlayer.bind(this)()){
                console.log('collid')
                clearInterval(itv);
                return;
            }
            let type;

            let {dx, dy} = newBullet.dxy,
                {x0, y0} = newBullet,
                _x0 = newBullet.x0 + dx,
                _y0 = newBullet.y0 + dy;
            if (_x0 <= xmin + bulletSize/2 && (type = 1) && (_x0 = xmin + bulletSize/2) && (_y0 = y0 + (_x0 - x0) * dy/dx) ||
                _x0 >= xmax - bulletSize/2 && (type = 1) && (_x0 = xmax - bulletSize/2) && (_y0 = y0 + (_x0 - x0) * dy/dx)  ||
                _y0 <= ymin + bulletSize/2 && (type = 2) && (_y0 = ymin + bulletSize/2) && (_x0 = x0 + (_y0 - y0) * dx/dy) ||
                _y0 >= ymax - bulletSize/2 && (type = 2) && (_y0 = ymax - bulletSize/2) && (_x0 = x0 + (_y0 - y0) * dx/dy) 
                )
              {
                _x0 === _y0 ? type = 3: "";
                reflect.bind(this)(type, newBullet);
                newBullet.x0 = _x0;
                newBullet.y0 = _y0;
            }
            else {
                newBullet.x0 += dx;
                newBullet.y0 += dy; 
            }
            let newState = new Map([...bulletsList])
            newState.set(key, newBullet);
            this.setState({bulletsList: newState})
        }, this.bulletSpeed)
    }
    distance({x0, y0}, {x, y}){
        let {sqrt, pow} = Math;
        return sqrt(pow(x - x0, 2) + pow(y - y0, 2));
    }
    handleSocket(){
        let socket = this.props.socket;
        socket.handleGame = ({type, payload}) => {
            switch(type){
                case 'go':
                    return this.subPlayerGo(payload.alpha);
                case 'shoot':
                    return this.shoot(this.subPlayer);
                
            }
        }
    }
    componentDidMount(){
        this.handleSocket.bind(this)();
    }
    componentWillUnmount(){
        delete this.props.socket.handleGame;
    }
    render(){
        let Player = (props) =>{
            let {player} = props;
            let heart = {
                position: 'absolute',
                left: `${player.x}vmin`,
                top: `${player.y}vmin`,
                transform: `rotate(${player.alpha}rad)`,
                width: '0.01px',
                height: '0.01px',
                backgroundColor: 'blue',
                margin: '0px 0px',
                padding: '0px 0px'

            }
            let body = {
                position: 'absolute',
                width: `${this.playerSize}vmin`,
                height: `${this.playerSize}vmin`,
                borderRadius: '50%',
                left: `-${this.playerSize/2}vmin`,
                top: `-${this.playerSize/2}vmin`,
                backgroundColor: player.isAlive ? 'green' : 'grey',
                opacity: 0.7,
            }
            let hand = {
                position: 'absolute',
                width: '0vmin',
                height: '0vmin',
                borderTop: `${this.playerSize/4}vmin solid transparent`,
                borderBottom: `${this.playerSize/4}vmin solid transparent`,
                borderLeft: `${this.playerSize/2}vmin solid #555`,
                top: `-${this.playerSize/4}vmin`,
                left: `${this.playerSize/4}vmin`,
                opacity: 0.7,

            }
            return (
                <div className = 'player' id = {player.id} style = {heart}>
                    <div style = {body}></div>
                    <div style = {hand}></div>
                </div>
            )
        }
        let Bullet = (props) =>{
            let {key, x0, y0, isActive} = props.bullet;
            let bulletHeart = {
                position: 'absolute',
                width: '0.01px',
                height: '0.01px',
                left: `${x0}vmin`,
                top: `${y0}vmin`,
            }
            let bulletBody = {
                position: 'absolute',
                width: `${this.bulletSize}vmin`,
                height: `${this.bulletSize}vmin`,
                borderRadius: '50%',
                left: `-${this.bulletSize/2}vmin`,
                top: `-${this.bulletSize/2}vmin`,
                backgroundColor: isActive ? 'red' : 'grey'
            }
            return (
                <div id = {key} style = {bulletHeart}>
                    <div style = {bulletBody}/>
                </div>
            )
        }
        let {playersList, bulletsList} = this.state;
        let players = [...playersList.values()].map((player) =>{
            return  <Player player = {player} key = {player.id}/>
        })
        let bullets = [...bulletsList.values()].map((bullet) =>{ 
           return <Bullet bullet = {bullet} key = {bullet.key}/>
        })
        let mainStyle = {
            backgroundColor: 'pink',
            border: '1px solid grey',
            position: 'relative',
            padding: '0px 0px',
            width: `${this.width}vmin`,
            height: `${this.height}vmin`,
        }
        return(
            <div>
                <p>{this.props.main}</p>
                <div id = 'shooting_game' style = {mainStyle} onMouseDown = {this.handleMouseDown.bind(this)} onMouseUp = {this.handleMouseUp.bind(this)} onMouseLeave = {this.handleMouseUp.bind(this)} >
                    {players}
                    {bullets}
                </div>
                <button id = "shoot" onClick = {this.shoot.bind(this,this.mainPlayer)}>shoot</button>
            </div>

        )
    }
}
function mapStateToProps(state, ownProp){
    return {
        user: state.user,
        socket: state.socket
    }
}
export default withRouter(connect(mapStateToProps, null)(PoongGame));