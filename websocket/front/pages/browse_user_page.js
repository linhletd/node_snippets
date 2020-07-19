import React from 'react';
import {connect} from 'react-redux';
import UserStatus from '../pages/user_status';
const BrowseUserPage = (props) =>{
    let {usersStatus, children, filter, attr} = props;
    return (
    <div {...attr}>
        {usersStatus ? [...usersStatus.values()].filter(cur =>(cur._id !== filter))
        .map(status => <UserStatus key = {status._id} status = {status}
         children = {children}/>) : ""}
    </div>
    )
}
function mapStateToProps(state, ownProp){
    return {
        usersStatus: state.main.usersStatus
    }
}
export default connect(mapStateToProps, null)(BrowseUserPage);