import React from 'react';
import {NavLink} from 'react-router-dom'
let PrimaryHeader = (props) =>{

    return (
        <div id = 'app_header'>
            <NavLink exact to = '/' activeClassName = 'active' >Home</NavLink>
            <NavLink to = '/discuss' activeClassName = 'active'>Topic</NavLink>
            <NavLink to = '/game' activeClassName = 'active'>Game</NavLink>
            <NavLink to = '/similarity' activeClassName = 'active'>Similar App</NavLink>
            <NavLink to = '/sql_query' activeClassName = 'active'>SQL query</NavLink>
            <NavLink to = '/user' activeClassName = 'active'>User</NavLink>
            <NavLink to = '/editor' activeClassName = 'active'>editor</NavLink>


        </div>
    )
}
export default PrimaryHeader;