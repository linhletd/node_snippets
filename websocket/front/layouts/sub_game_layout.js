import React from 'react';
class SubGameLayout extends React.Component{
    constructor(props){
        super(props);

        this.unit = 'vmin';
        this.hwratio = 0.6;
        let vmin = Math.min(innerWidth, innerHeight),
            vmax = Math.max(innerWidth, innerHeight);
        this.width = Math.floor((vmax/vmin) * 100 * 0.5);
        this.height = this.width * this.hwratio;
        this.xmin = 0; //left
        this.xmax = this.width; //left
        this.ymin = 0; //top
        this.ymax = this.height // top
        this.border = 0.5 * this.width; // left
        this.playerSize = 10;
        this.bulletSize = 0.5;
        this.playerStep = this.playerSize / 4;
        this.bulletStep = this.bulletSize / 4;
        this.bulletSpeed = 100 //ms
        this.mainPlayer = 'a' //props.player;
        this.subPlayer = this.mainPlayer === 'a' ? 'b' : 'a';
        this.socket = new WebSocket('ws://localhost:8080/')
        this.state = {
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
            abooms: [],
            bbooms: []
        };
    }
    mainPlayerGo(ev){
        let {playersList} = this.state;
        let vmin = Math.min(innerWidth, innerHeight);
        let rect = ev.currentTarget.getBoundingClientRect(),
        offsetX = ev.clientX - rect.left,
        offsetY = ev.clientY - rect.top;
        let xc = offsetX/vmin * 100, yc = offsetY/vmin * 100, playerId = this.mainPlayer;
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
    shoot(){
        let playerId = this.mainPlayer;
        let player = this.state.playersList.get(playerId);
        let {x, y, alpha, bulletsQty} = player
        if(bulletsQty === 0){
            return;
        }
        console.log(x,y)
        let key = `${playerId}_${bulletsQty}`
        let newBullet = {x0: x, y0: y, alpha, key, dxy: this.jump(alpha, this.bulletStep), isActive: true}
        let newBulletentries  = [...this.state.bulletsList];
        player.bulletsQty--;
        newBulletentries.push([key, newBullet]);
        this.setState({bulletsList: new Map(newBulletentries)}) //, this.bulletGo.bind(this, key, playerId)
    }
    jump(alpha, step){
        let dx, dy;
        let {PI, sin, cos} = Math
        alpha >= 0 && alpha <= PI/2 ? (dx = step * cos(alpha), dy = step * sin(alpha)) :
        alpha >= PI/2 && alpha <= PI ? (dx = step * -cos(PI - alpha), dy = step * sin(PI - alpha)) :
        alpha < -PI/2 && alpha > -PI ? (dx = step * -cos(PI + alpha), dy = step * -sin (PI + alpha)) :
        (dx = step * cos(-alpha), dy = step * -sin(-alpha));
        return {dx, dy}

    }
    bulletGo(key,playerId){
        let {bulletsList, playersList} = this.state,
        {xmin, ymin, xmax, ymax, bulletSize} = this;

        function ifCollidePlayer(){
            let distance = this.distance(bulletsList.get(key), playersList.get(playerId));
            if(distance < (this.bulletSize + this.playerSize) / 2 ){
                let targetBullet = Object.assign({},bulletsList.get(key));
                let targetPlayer = Object.assign({}, playersList.get(playerId));
                targetBullet.isActive = false;
                targetPlayer.isAlive = false;
                let newPList = new Map([...playersList]);
                let newBList =  new Map([...bulletsList]);
                newPList.set(playerId, targetPlayer);
                newBList.set(key, targetBullet);
                this.setState({
                        playersList: newPList,
                        bulletsList: newBList
                    })
                return true;
            }
        }
        function reflect(type, mutate){
            let alpha = mutate.alpha;
            let {PI, abs, sign} = Math;
            let newAlpha;
            switch(type){
                case 1:
                    newAlpha = sign(alpha) * PI - abs(alpha);
                    break;
                case 2:
                    newAlpha = -alpha;
                    break;
                case 3:
                    newAlpha = -sign(alpha) * PI - abs(alpha);
            }
            mutate.alpha = newAlpha;
            mutate.dxy = jump(newAlpha, this.bulletStep);
        }
        let itv = setInterval(() =>{
            console.log('go')
            let newBullet = Object.assign({}, bulletsList.get(key));
            // if(ifCollidePlayer.bind(this)()){
            //     console.log('collid')
            //     clearInterval(itv);
            //     return;
            // }
            let type, {x0,y0} = newBullet;
            if(x0 < xmin + bulletSize/2 && (type = 1) || x0 > xmax - bulletSize/2 && (type = 1) || y0 < ymin + bulletSize/2 && (type = 2)|| y0 > ymax - bulletSize/2 && (type = 2)){
                x0 === y0 ? type = 3: ""
                reflect.bind(this)(type, newBullet);
            }
            let dxy = newBullet.dxy
            newBullet.x0 += dxy.dx;
            newBullet.y0 += dxy.dy;
            let newState = new Map([...bulletsList])
            newState.set(key, newBullet);
            this.setState({bulletsList: newState})
        }, this.bulletSpeed)
    }
    distance({x0, y0}, {x, y}){
        let {sqrt, pow} = Math
        return sqrt(pow(x - x0, 2) + pow(y - y0, 2));
    }
    componentDidMount(){
        this.socket.onopen = (ev) =>{
            this.socket.onmessage = ({data}) => {
                let {type, payload} = data;
                switch(type){
                    case 'go':
                        return this.subPlayerGo(payload.alpha);
                    case 'shoot':
                        return this.shoot(this.subPlayer);
                    
                }
            }
        }
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
                backgroundColor: 'green',
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
            let bulletStyle = {
                position: 'absolute',
                width: `${this.bulletSize}vmin`,
                height: `${this.bulletSize}vmin`,
                borderRadius: '50%',
                left: `${x0}vmin`,
                top: `${y0}vmin`,
                backgroundColor: isActive ? 'red' : 'grey'
            }
            return (
                <div id = {key} style = {bulletStyle}/>
            )
        }
        let {playersList, bulletsList} = this.state;
        console.log(bulletsList)
        let players = [...playersList.values()].map((player) =>{
            return  <Player player = {player} key = {player.id}/>
        })
        let bullets = [...bulletsList.values()].map((bullet) =>{ 
            console.log(bullet)
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
                <div id = 'shooting_game' style = {mainStyle} onClick = {this.mainPlayerGo.bind(this)}>
                    {players}
                    {bullets}
                </div>
                <button onClick = {this.shoot.bind(this)}>shoot</button>
            </div>

        )
    }
}
export default SubGameLayout;