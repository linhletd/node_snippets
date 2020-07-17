import React from 'react';
import {connect} from 'react-redux'
const UserStatus = (props) => {
    let {style} = props;
    let status;
    if(!('isOnline' in props.status)){
        status = props.usersStatus.get(props.status._id);
    }
    else{
        status = props.status;
    }
    let Child = props.children;
    return (
        <div className = {status._id + " " + style}>
            <div className = "icon">
                <img src = {status.Avartar} alt = {`${status.Username} avartar`} width = "45" heigh = "45"/>
                <div className = {status.isOnline ? "signal online" : "signal offline"}/>
            </div>
            <a href = {`/user?id=${status._id}`}>{status.Username}</a>
            {Child ? <Child isOnline = {status.isOnline}/> : ""}
        </div>
    )
}
function mapStateToProps(state, ownProp){
    return {
        usersStatus: state.usersStatus
    }
}
export default connect(mapStateToProps, null)(UserStatus);