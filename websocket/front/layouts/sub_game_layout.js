import React from 'react';
class ShootingGame extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            playersList: new Set([
                ['a', {
                    isAlive: true,
                    x: this.xmin + 5,
                    y: this.heigh / 2,
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
            a: {
                isAlive: true,
                x: this.xmin + 5,
                y: this.heigh / 2,
                alpha: 0,
                bulletsQty: 10,
                secret: undefined
            } ,
            b: {
                isAlive: true,
                x: this.xmax - 5,
                y: this.height / 2,
                alpha: Math.PI,
                bulletsQty: 10,
                secret: undefined  
            },
            bulletsList: new Map(),
            abooms: [],
            bbooms: []
        };
        this.height = 68;
        this.width = 98;
        this.playerSize = 2;
        this.xmin = 0; //left
        this.xmax = this.width; //left
        this.ymin = 0; //top
        this.ymax = this.height // top
        this.border = 0.5 * this.width; // left
        this.playerStep = this.playerSize / 4;
        this.bulletStep = this.bulletSize / 4;
        this.bulletSize = 0.5;
        this.bulletSpeed = 100 //ms
        this.mainPlayer = props.player;

    }
    vmin(val){
        return val + 'vmin'
    }
    percent(val){
        return val + "%"
    }

    playerGo(playerId, {x0, y0}, {xc, yc}){
        let deltaX = xc - x0;
        let deltaY = yc - y0;
        let dx, dy, x, y, alpha;
        let step = this.playerStep;
        let {sin, cos} = Math;
        let _alpha = Math.atan(Math.abs((deltaY / deltaX)));
        if(deltaX > 0){
            deltaY > 0 ? (alpha = -_alpha, dx = step * cos(_alpha), dy = step * sin(_alpha)) :
            (alpha = _alpha, dx = step * cos(_alpha), dy = -step * sin(_alpha));
        }
        else {
            deltaY > 0 ? alpha = (_alpha - Math.PI, dx = -step * cos(_alpha), dy = step * sin(_alpha)) :
            (alpha = Math.PI - _alpha, dx = -step * cos(_alpha), dy = -step * sin(_alpha));
        }
        let {xmin, xmax, ymin, playerSize, } = this;
        x = x0 + dx;
        y = y0 + dy;
        if(x < xmin + playerSize/2 || x > xmax - playerSize/2 || y < ymin + playerSize/2 || y > ymax - playerSize/2){
            x = x0; y = y0;
        }
        let playersList = this.state
        newPlayerState = Object.assign({}, playersList.get(playerId), {x, y, alpha});
        let newState = new Map([...playersList]);
        newState.set(playerId, newPlayerState);
        this.setState({playersList: newState})
    }
    shoot(playerId){
        let playerState = this.state[playerId]
        if(playerState.bulletsQty === 0){
            return;
        }
        let key = `${playerId}_playerState.bulletsQty`
        let {x, y, alpha} = playerState;
        let newBullet = {x0: x, y0: y, alpha, key, dxy: this.bulletDirect(x, y, alpha), isActive: true}
        let newBulletentries  = [...this.bulletsList];
        newBulletsList.push([key, newBullet]);
        this.setState({bulletsList: new Map(newBulletentries)}, this.bulletGo.bind(this, key))
    }
    bulletDirect(x0, y0, alpha, step){
        if(!step){
            step = this.bulletStep;
        }
        let type, _alpha, dx, dy, type;
        let {PI, sin, cos, tan} = Math
        alpha >= 0 && alpha <= PI/2 ? (dx = step * cos(alpha), dy = step * sin(alpha), type = 1) :
        alpha >= PI/2 && alpha <= PI ? (dx = step * -cos(PI - alpha), dy = step * sin(PI - alpha), type = 2) :
        alpha < -PI/2 && alpha > -PI ? (dx = step * -cos(PI + alpha), dy = step * -sin (PI + alpha), type = 3) :
        (dx = step * cos(-alpha), dy = step * -sin(-alpha), type = 4);
        return {dx, dy}

    }
    bulletGo(key,playerId){
        let {bulletsList, playersList} = this.state;

        function ifCollidePlayer(){
            let distance = this.distance(bulletsList.get(key), playersList.get(PlayerId));
            if(distance < (this.bulletSize + this.playerSize) / 2 ){
                let targetBullet = Object.assign({},bulletsList.get(key));
                let targetPlayer = Object.assign({}, playersList.get(PlayerId));
                targetBullet.isActive = false;
                targetPlayer.isAlive = false;
                let newPList = new Map([...playersList]);
                let newBList =  new Map([...bulletsList]);
                newPList.set(playerId, targetPlayer);
                newBullet.set(key, targetBullet);
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
            mutate.dxy = bulletDirect(x0, y0, newAlpha);
        }
        let itv = setInterval(() =>{
            let newBullet = Object.assign({}, bulletsList.get(key));
            if(ifCollidePlayer.bind(this)()){
                clearInterval(itv);
                return;
            }
            let type, {x0,y0}
            if(x < xmin + bulletSize/2 && (type = 1) || x > xmax - bulletSize/2 && (type = 1) || y < ymin + bulletSize/2 && (type = 2)|| y > ymax - bulletSize/2 && (type = 2)){
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
        let {sqrt, pow, abs} = Math
        return sqrt(pow(x - x0, 2) + pow(y - y0, 2));
    }

    render(){
        let Player = (props) =>{
            let playerState = this.state[props.playerId];
            let heart = {
                position: 'absolute',
                left: `${playerState.x}vmin`,
                top: `${playerState.y}vmin`,
                transform: `rotate(${playerState.alpha}deg)`,
                width: '0.01px',
                height: '0.01px'

            }
            let body = {
                position: 'absolute',
                width: '2vmin',
                height: '2vmin',
                borderRadius: '50%',
                left: '1vmin',
                top: '1vmin',
            }
            let hand = {
                position: 'absolute',
                width: '0vmin',
                height: '0vmin',
                borderTop: '0.5vmin solid transparent',
                borderBottom: '0.5vmin solid transparent',
                borderLeft: '0.5vmin solid #555',
                top: '0.5vmin',
                left: '1vmin'
            }
            return (
                <div class = 'player' id = {props.playerId} style = {heart}>
                    <div style = {body}></div>
                    <div style = {hand}></div>
                </div>
            )
        }
        let Bullet = (props) =>{

            return (
                <div></div>
            )
        }
        let bomm
        // let abooms = this.state.length ?
        return(
            <div id = 'shooting_game'>
                <div id = 'azone'></div>
                <div id = 'bzone'></div>
                <Player id = 'a'/>
                <Player id = 'b'/>
                {abooms}
                {bbooms}
                {aasset}
                {basset}
                {payera}
                {playerb}
                {bullets}
            </div>
        )
    }
}