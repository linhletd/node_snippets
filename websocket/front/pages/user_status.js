import React from 'react';
const UserStatus = (props) => {
    let status = props.status
    return (
        <div className = "stat">
            <div className = "icon">
                <img src = {status.Avartar} alt = {`${status.Username} avartar`} width = "45" heigh = "45"/>
                <div className = {status.isOnline ? "signal online" : "signal offline"}/>
            </div>
            <a href = {`/user?id=${status._id}`}>{status.Username}</a>
            {props.children ? props.children : ""}
        </div>
    )
}
export default UserStatus;