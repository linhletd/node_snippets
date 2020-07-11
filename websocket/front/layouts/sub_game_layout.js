import React from 'react';
import {Route, Switch, NavLink, withRouter, Redirect} from 'react-router-dom';
import {connect} from 'react-redux';
import UserStatus from '../pages/user_status';
import PoongGame from '../pages/poong_game_page';
//import LifeGame from '../pages/life_game_page';
class SubGameLayout extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            life: "",
            poong: {
                showList: false,
                busy: false,
            }
        }  
        
    }
    openInviteBoard(){
        let newPoong = Object.assign({},this.state.poong,{showList: true})
        this.setState({poong: newPoong})
    }
    invite(e){
        let _id = e.target.id.slice(0, 18);
        let message = {
            type: 'invite game',
            payload: {
                _id,
            }
        }
        this.props.socket.send(JSON.stringify(message))
        this.props.updateStore({
            type: 'JOINGAME',
            data: 'a'
        })
        this.closeInviteBoard.bind(this)();
        this.props.history.push(`${this.props.match.path}/poong`);
    }
    closeInviteBoard(){
        let newPoong = Object.assign({},this.state.poong,{showList: false})
        this.setState({poong: newPoong})
    }
    componentDidMount(){

    }
    render(){
        let {path} = this.props.match;
        let {usersStatus} = this.props;
        let InviteButton = (props) =>(
            <button disabled ={!props.isOnline} id = {`${props.id}_invt`} onClick = {this.invite.bind(this)}>Invite</button>
        )
        let PlayerList = () => {
            let listStyle = {
                position: 'absolute',
                top: '50%',
                left: '50%',
                border: '1px solid green'
            }
            return (
                <div id = 'invite_list' style = {listStyle} onMouseLeave = {this.closeInviteBoard.bind(this)}>
                    {usersStatus ? usersStatus.filter(cur =>(cur._id !== this.props.user._id)).map(status => <UserStatus key = {status._id} status = {status}
                     children = {<InviteButton id = {status._id} isOnline = {status.isOnline}/>}/>) : ""}
                </div> 
            )
        }
        // let Invitation
        return (
            <div id = 'game_layout' style = {{position: 'relative'}}>
                <nav id = 'game_nav'>
                    <NavLink to = {`${path}/life`} activeClassName = 'active'>life</NavLink>
                    <NavLink to = {`${path}/poong`} activeClassName = 'active'>poong</NavLink>
                </nav>

                <Switch>
                    <Route exact path = {`${path}`}>
                        <button onClick = {this.openInviteBoard.bind(this)}>click to call friend</button>
                        {this.state.poong.showList ? <PlayerList/> : ""}
                        <button>game of life</button>
                    </Route>
                    {/* <Route exact path = '/game/life' component = {LifeGame}/> */}
                    {this.props.main ? 
                    <Route path = {`${path}/poong`}>
                        <PoongGame user = {this.props.user} main = {this.state.poong.main}/>
                    </Route> :
                    <Redirect to = {`${path}`}/>
                     } 
                </Switch>
            </div>
        )
    }
}
function mapStateToProps(state, ownProp){
    return {
        user: state.user,
        socket: state.socket,
        main: state.mainpoong
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateStore: function(action){
            dispatch(action);
        }
    }
}
export default withRouter(connect(mapStateToProps, mapDispatchToProps)(SubGameLayout));