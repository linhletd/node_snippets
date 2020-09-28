import React from 'react';
import {NavLink} from 'react-router-dom';
import UserStatus from '../pages/user_status';
class PrimaryHeader extends React.Component{
    render(){
        let user = {...this.props.user};
        user.isOnline = true;
        return (
            <div id = 'app_header'>
                <div><NavLink exact to = '/' activeClassName = 'active' ><i className="fa fa-home"></i></NavLink></div>
                <div><NavLink to = '/discuss' activeClassName = 'active'><i className="fa fa-newspaper-o"></i></NavLink></div>
                <div><NavLink to = '/game' activeClassName = 'active'><i className="fa fa-gamepad"></i></NavLink></div>
                <div><NavLink to = '/similarity' activeClassName = 'active'><i className="fa fa-exchange"></i></NavLink></div>
                <div><NavLink to = '/editor' activeClassName = 'active'><i className="fa fa-file-text-o"></i></NavLink></div>
                <div><NavLink to = '/sql_query' activeClassName = 'active'><i className="fa fa-database"></i></NavLink></div>
                <div className = 'large_hide'><i className="fa fa-bell"></i></div>
                <div className = 'small_hide'><i className="fa fa-users"></i></div>
                <div className = 'small_hide'><UserStatus noName = {true} childClass = 'user_tiny' status = {user}/></div>
                <div className = 'large_hide'><i className="fa fa-bars"></i></div>
            </div>
        )
    }
}
export default PrimaryHeader;