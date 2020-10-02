import React from 'react';
import {NavLink} from 'react-router-dom';
import UserStatus from '../pages/user_status';
class PrimaryHeader extends React.Component{
    render(){
        let user = {...this.props.user};
        user.isOnline = true;
        return (
            <div id = 'app_header'>
                <div className = 'small_hide large_hide navi hdr_ico'><i className="fa fa-users"></i></div>
                <div className = 'hdr_ico'><NavLink exact to = '/' ><i className="fa fa-home"></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/discuss'><i className="fa fa-newspaper-o"></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/game'><i className="fa fa-gamepad"></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/similarity'><i className="fa fa-exchange"></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/editor'><i className="fa fa-file-text-o"></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/sql_query'><i className="fa fa-database"></i></NavLink></div>
                <div className = 'large_hide medium_hide navi hdr_ico'><i className="fa fa-bell navi"></i></div>
                <div className = 'small_hide navi hdr_ico'><UserStatus noName = {true} childClass = 'user_tiny' status = {user}/></div>
                <div className = 'large_hide medium_hide navi hdr_ico'><i className="fa fa-user"></i></div>
            </div>
        )
    }
}
export default PrimaryHeader;