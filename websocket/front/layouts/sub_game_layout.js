import React from 'react';
import {Route, Switch, NavLink, withRouter, Redirect} from 'react-router-dom';
import {connect} from 'react-redux';
import PoongGame from '../pages/poong_game_page';
import GameOfLife from '../pages/game_of_life_comp';
import SelectPoong from '../pages/select_poong_page';

class SubGameLayout extends React.Component{
    clickLife = () =>{
        this.props.history.push(`/game/life`)
    }
    render(){
        const SelectLife = () => (<button onClick = {this.clickLife}>game of life</button>)
        let {path} = this.props.match;

        return (
            <div id = 'game_layout'>
                <nav id = 'game_nav'>
                    <NavLink to = {`${path}/life`} activeClassName = 'active'>life</NavLink>
                    <NavLink to = {`${path}/poong`} activeClassName = 'active'>poong</NavLink>
                </nav>
                <Switch>
                    <Route exact path = {path}>
                        <SelectPoong/>
                        <SelectLife/>
                    </Route>
                    <Route path = {`${path}/life`}>
                        <GameOfLife/>
                    </Route>
                    <Route path = {`${path}/poong`}>
                        {this.props.active ? <PoongGame/> : <Redirect to = '/game'/>}
                    </Route>
                    <Redirect to = {path}/>
                </Switch>
            </div>
        )
    }
}
function mapStateToProps(state, ownProp){
    return {
        user: state.main.user,
        socket: state.main.socket,
        active: !!state.poong.gameStatus,
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