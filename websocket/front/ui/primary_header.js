import React from 'react';
import {NavLink} from 'react-router-dom'
let PrimaryHeader = (props) =>{

    return (
        <div id = 'primary-header'>
            <NavLink exact to = '/' activeClassName = 'active' >Home</NavLink>
            <NavLink to = '/discuss' activeClassName = 'active'>Topic</NavLink>
            <NavLink to = '/game' activeClassName = 'active'>Game</NavLink>
            <NavLink to = '/similar_app' activeClassName = 'active'>Similar App</NavLink>
            <NavLink to = '/sql_query' activeClassName = 'active'>SQL query</NavLink>
            <NavLink to = '/user' activeClassName = 'active'>User</NavLink>

        </div>
    )
}
export default PrimaryHeader;