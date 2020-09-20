import React from 'react';
import {connect} from 'react-redux'
const UserStatus = (props) => {
    let {childClass} = props;
    let status;
    if(!('isOnline' in props.status)){
        status = props.usersStatus.get(props.status._id);
    }
    else{
        status = props.status;
    }
    let Child = props.children;
    if(Child){
        if(typeof Child === 'function'){
            let attr = {};
            let a = Child.attr;
            a && status.hasOwnProperty(a) ? (attr[a] = status[a], Child = <Child {...attr}/>): Child = <Child/>;
        }
    }
    else Child = "";
    return (
        <div className = {status._id + (childClass ? " " + childClass : '')}>
            <div className = "icon">
                <img src = {status.Avartar} alt = {`${status.Username} avartar`} width = "45" heigh = "45"/>
                <div className = {status.isOnline ? "signal online" : "signal offline"}/>
            </div>
            <a href = {`/user?id=${status._id}`}>{status.Username}</a>
            {Child}
        </div>
    )
}
function mapStateToProps(state, ownProp){
    return {
        usersStatus: state.main.usersStatus
    }
}
export default connect(mapStateToProps, null)(UserStatus);