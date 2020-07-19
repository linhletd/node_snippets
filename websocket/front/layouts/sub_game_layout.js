import React from 'react';
import {Route, Switch, NavLink, withRouter, Redirect} from 'react-router-dom';
import {connect} from 'react-redux';
import PoongGame from '../pages/poong_game_page';
import BrowseUserPage from '../pages/browse_user_page';
import WaitingPlayer from '../pages/waiting_player_page';
//import LifeGame from '../pages/life_game_page';

class SubGameLayout extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            life: "",
            poong: {
                showList: false,
            }
        }  
        
    }
    openInviteBoard(){
        let newPoong = Object.assign({},this.state.poong,{showList: true})
        this.setState({poong: newPoong})
    }
    invite(e){
        let _id = e.target.parentNode.className.slice(0, 24);
        this.props.updateStore({
            type: 'WAITPLAYER',
            data: {_id}
        })
        let msg = {
            type: 'invite',
            payload: {
                _id,
            }
        }
        this.props.socket.send(JSON.stringify(msg))
        this.closeInviteBoard.bind(this)();
    }
    closeInviteBoard(){
        let newPoong = Object.assign({},this.state.poong,{showList: false})
        this.setState({poong: newPoong})
    }
    componentDidMount(){

    }
    render(){
        let {path} = this.props.match;
        let InviteButton = (props) =>{
            return <button disabled ={!props.isOnline} onClick = {this.invite.bind(this)}>Invite</button>
        }
        InviteButton.attr = 'isOnline';//parent will pass this attribute
        let listStyle = {
            position: 'absolute',
            top: '50%',
            left: '50%',
            border: '1px solid green'
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
                        {this.state.poong.showList ? 
                        <BrowseUserPage children = {InviteButton} filter = {this.props.user._id} attr = {{id: 'invite_list', style: listStyle, onMouseLeave: this.closeInviteBoard.bind(this)}}/> : ""}
                        <button>game of life</button>
                    </Route>
                    {/* <Route exact path = '/game/life' component = {LifeGame}/> */}
                    {this.props.active ? 
                    <Route path = {`${path}/poong`}>
                        <PoongGame {...this.props}/>
                    </Route> :
                    <Redirect to = {`${path}`}/>
                     } 
                </Switch>
                <WaitingPlayer/>
            </div>
        )
    }
}
function mapStateToProps(state, ownProp){
    return {
        user: state.main.user,
        socket: state.main.socket,
        usersStatus: state.main.usersStatus,
        active: state.poong.active,
        mainSide: state.poong.mainSide,
        sideList: state.poong.sideList,
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