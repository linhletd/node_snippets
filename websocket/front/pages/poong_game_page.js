import React from 'react';
import UserStatus from '../pages/user_status';

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
        this.playerSize = 0.05 * this.width;
        this.bulletSize = 0.02 * this.width;
        this.playerStep = this.playerSize / 4;
        this.bulletStep = this.bulletSize / 4;
        this.bulletSpeed = 30; //ms
        this.playerSpeed = 150;
        this.bulletsStock = 10;
        this.x = <div></div>;
        this.startGame();
        // this.changeChildState
    }
    startGame(){
        this.mainPlayer = this.props.mainSide;
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
            }],
            ['b', {
                isAlive: true,
                x: this.xmax - 5,
                y: this.height / 2,
                alpha: Math.PI,
                bulletsQty: this.bulletsStock,
                secret: undefined,
                id: 'b',
            }]
        ]);
        this.itv = {
            mainGoing: undefined
        }
        this.bulletsList = new Map();
    }
    mainGo(ev){
        this.itv.mainGoing && clearInterval(this.itv.mainGoing) && (this.itv.mainGoing = undefined);
        if(this.freezed){
            return;
        }
        let player = this.playersList.get(this.mainPlayer);
        if(!player.isAlive){
            return;
        }
        let vmin = Math.min(innerWidth, innerHeight);
        let rect = ev.currentTarget.getBoundingClientRect(),
        offsetX = ev.clientX - rect.left,
        offsetY = ev.clientY - rect.top;
        let xc = offsetX/vmin * 100, yc = offsetY/vmin * 100;
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
                payload: {x: x/this.width, y: y/this.width, alpha}
            }
            this.props.socket.send(JSON.stringify(msg));
            player.x = x; player.y = y; player.alpha = alpha;
            let elem = document.getElementById('shooting_game').querySelector(`#${this.mainPlayer}`);
            elem.style.left = `${x}vmin`; elem.style.top = `${y}vmin`; elem.style.transform = `rotate(${alpha}rad)`;
        }
        mainPlayerGo();
        this.itv.mainGoing = setInterval(mainPlayerGo, this.playerSpeed);
    }
    mainStop(ev){
        this.itv.mainGoing && clearInterval(this.itv.mainGoing) && (this.itv.mainGoing = undefined);
    }

    subPlayerGo = ({x, y, alpha}) =>{
        if(this.freezed){
            return;
        }
        let playerId = this.subPlayer;
        let player = this.playersList.get(playerId);
        player.x = x * this.width; player.y = y * this.width; player.alpha = alpha;
        let elem = document.getElementById('shooting_game').querySelector(`#${playerId}`);
        elem.style.left = `${player.x}vmin`; elem.style.top = `${player.y}vmin`; elem.style.transform = `rotate(${alpha}rad)`;
    }
    shoot = (playerId) => {
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
                type: 'shoot'
            }
            this.props.socket.send(JSON.stringify(msg))
        }

        let key = `${playerId}_${bulletsQty}`;
        let newBullet = {x0: x, y0: y, alpha, key, dxy: this.jump.bind(this)(alpha), isActive: true, owner: playerId};
        player.bulletsQty--;
        this.bulletsList.set(key, newBullet);
        this.setBoardState((prevState) =>{
            let newState = new Map(prevState.sideList), newSide = {...newState.get(player.id)};
            newSide.bulletNum = player.bulletsQty;
            newState.set(player.id,newSide);
            return {sideList: newState};
        });
        let bullet = this.sampleBullet.cloneNode(true);
        bullet.style.left = `${x}vmin`;
        bullet.style.top =  `${y}vmin`;
        bullet.style.display = 'block';
        bullet.id = key;
        document.getElementById('bullets').appendChild(bullet);
        this.bulletGo.bind(this, key)();
        // this.setBulletsState(this.bulletGo.bind(this, key)) //, this.bulletGo.bind(this, key, playerId)
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
                    let elem1 = document.getElementById('shooting_game').querySelector(`#${player.id}`);
                    elem1.style.backgroundColor = 'grey';
                    this.setBoardState((prevState) =>{
                        let newState = new Map(prevState.sideList), newSide = {...newState.get(player.id)};
                        newSide.isAlive = player.isAlive;
                        newState.set(player.id,newSide);
                        return {sideList: newState};
                    })
                }
            })
            if(checked){
                bullet.isActive = false;
                let elem = document.getElementById('shooting_game').querySelector(`#${key}`);
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
                console.log('collid')
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
            let elem = document.getElementById('shooting_game').querySelector(`#${key}`);
            elem.style.left = `${bullet.x0}vmin`;
            elem.style.top = `${bullet.y0}vmin`
        }, this.bulletSpeed)
    }
    distance({x0, y0}, {x, y}){
        let {sqrt, pow} = Math;
        return sqrt(pow(x - x0, 2) + pow(y - y0, 2));
    }
    leaveGame = () =>{
        if(this.freezed){
            return;
        }
        let msg = {
            type: 'leave',
            payload: {}
        }
        this.props.socket.send(JSON.stringify(msg))
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
                    return this.shoot(this.subPlayer);
                case 'leave':
                    return this.freezed = true
                
            }
        }
    }
    freeze = () =>{
        this.freezed = true;
        Object.keys(this.itv).map(cur =>{
            cur && clearInterval(cur)
        })
    }
    componentDidMount(){
        this.handleSocket.bind(this)();
        this.sampleBullet = document.getElementById('shooting_game').querySelector('#b_sample');
    }
    componentWillUnmount(){
        delete this.props.socket.handleGame;
        this.leaveGame();
    }
    render(){
        let self = this;
        // class Bullets extends React.Component{
        //     constructor(props){
        //         super(props);
        //         this.state = {
        //             shooted: 0
        //         }
        //     self.setBulletsState = (cb)=>{
        //         if(self.isBulletsMounted){
        //             let shooted = this.state.shooted++
        //             this.setState({shooted}, cb)
        //         }
        //     }
        //     }
        //     componentDidMount(){
        //         self.isBulletsMounted = true;
        //     }
        //     componentWillUnmount(){
        //         self.isBulletsMounted = false;
        //     }
        //     render(){
        //         let Bullet = (props) =>{
        //             let {key, x0, y0, isActive} = props.bullet;
        //             let bulletHeart = {
        //                 position: 'absolute',
        //                 width: '0.01px',
        //                 height: '0.01px',
        //                 left: `${x0}vmin`,
        //                 top: `${y0}vmin`,
        //                 backgroundColor: 'red'
        
        //             }
        //             let bulletBody = {
        //                 position: 'absolute',
        //                 width: `${self.bulletSize}vmin`,
        //                 height: `${self.bulletSize}vmin`,
        //                 borderRadius: '50%',
        //                 left: `-${self.bulletSize/2}vmin`,
        //                 top: `-${self.bulletSize/2}vmin`,
        //                 backgroundColor: 'inherit'
        //             }
        //             return (
        //                 <div id = {key} style = {bulletHeart}>
        //                     <div style = {bulletBody}/>
        //                 </div>
        //             )
        //         }
        //         let bullets = [...self.bulletsList.values()].map((bullet) =>{ 
        //             console.log(bullet.key)
        //             return <Bullet bullet = {bullet} key = {bullet.key}/>
        //          });
        //         return (
        //             <div id = 'bullets'>
        //                 {bullets}
        //             </div>
        //         )
        //     }
        // }
        class PlayerBoard extends React.Component{
            constructor(props){
                super(props);
                let state = new Map();
                self.props.sideList.map((side) =>{
                    side = {...side};
                    side.user = self.props.usersStatus.get(side._id);
                    let player = self.playersList.get(side.side);
                    side.bulletNum = player.bulletsQty;
                    side.isAlive = player.isAlive;
                    state.set(side.side, side)
                })
                this.state = {
                    sideList: state
                };
                self.setBoardState = (obj,cb) =>{
                    if(self.isBoardMounted){
                        this.setState(obj, cb);
                    }
                };
            }
            componentDidMount(){
                self.isBoardMounted = true;
            }
            componentWillUnmount(){
                self.isBoardMounted = false;
            }
            render(){
                let ScoreStatus = (props) =>{
                    return (
                        <ul className = 'score_status'>
                            <li id = {`bullnum_${props.side}`}>Remaining bullets: {props.bulletNum}</li>
                            <li id = {`status_${props.side}`}>Status: {props.isAlive ? 'Alive' : 'Dead'}</li>
                        </ul>
                    )
                }
                return (
                    <div id = 'player_board'>
                        {[...this.state.sideList.values()].map(side => <UserStatus key = {side.user._id} status = {side.user}
                         children = {ScoreStatus.bind(this,{bulletNum: side.bulletNum, isAlive: side.isAlive, side: side.side})}/>)}
                    </div>
                )
            }
        }
        let SampleBullet = () =>{
            let bulletHeart = {
                position: 'absolute',
                width: '0.01px',
                height: '0.01px',
                left: `0vmin`,
                top: `0vmin`,
                backgroundColor: 'red',
                display: 'none'

            }
            let bulletBody = {
                position: 'absolute',
                width: `${this.bulletSize}vmin`,
                height: `${this.bulletSize}vmin`,
                borderRadius: '50%',
                left: `-${this.bulletSize/2}vmin`,
                top: `-${this.bulletSize/2}vmin`,
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
                    left: `${player.x}vmin`,
                    top: `${player.y}vmin`,
                    transform: `rotate(${player.alpha}rad)`,
                    width: '0.01px',
                    height: '0.01px',
                    backgroundColor: player.isAlive ? player.id === 'a' ? 'green' : 'blue' : 'grey',
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
                    backgroundColor: 'inherit',
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
            return (
                <div id = 'players'>
                    {[...playersList.values()].map((player) =>{
                        return  <Player player = {player} key = {player.id}/>
                    })}
                </div>
            )
        }
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
                <PlayerBoard/>
                <div id = 'shooting_game' style = {mainStyle} onMouseDown = {this.mainGo.bind(this)} onMouseUp = {this.mainStop.bind(this)} onMouseLeave = {this.mainStop.bind(this)} >
                    <Players/>
                    <SampleBullet/>
                    <div id = 'bullets'/>
                </div>
                <button id = "shoot" onClick = {this.shoot.bind(this,this.mainPlayer)}>shoot</button>
            </div>

        )
    }
}
export default PoongGame;