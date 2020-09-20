import React from 'react';
import {connect} from 'react-redux';
import UserStatus from '../pages/user_status';
const BrowseUserPage = (props) =>{
    let {usersStatus, children, filter, attr, childClass} = props;
    return (
    <div {...attr}>
        {usersStatus ? [...usersStatus.values()].sort((b,a)=>(a.isOnline - b.isOnline)).filter(cur =>(cur._id !== filter))
        .map(status => <UserStatus key = {status._id} status = {status}
         children = {children} childClass = {childClass}/>) : ""}
    </div>
    )
}
function mapStateToProps(state, ownProp){
    return {
        usersStatus: state.main.usersStatus
    }
}
export default connect(mapStateToProps, null)(BrowseUserPage);