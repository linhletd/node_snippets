import React from 'react';
import {connect} from 'react-redux';
import {Link} from 'react-router-dom';
import TimeStamp from '../pages/time_stamp_comp';
class UserStatus extends React.Component{
    constructor(props){
        super();
        this.prevStatus = false;
        this.currentStatus = false;
    }
    handleOffline = () =>{
        if(!this.currentStatus && this.prevStatus && this.props.handleOffline){
            this.props.handleOffline();
        }
    }
    shouldComponentUpdate(nextProps){
        if(this.props.usersStatus && nextProps.usersStatus.size !== this.props.usersStatus.size){
            return false;
        }
        let user;
        if((user = nextProps.usersStatus.get(this.props.status._id))
            && user.isOnline === this.currentStatus){
                return false
        }
        return true;
    }
    componentDidMount(){
        this.handleOffline();
        this.prevStatus = this.currentStatus;
    }
    componentDidUpdate(){
        this.handleOffline();
        this.prevStatus = this.currentStatus;
    }
    render(){
        let {props} = this;
        let {childClass, activeTime, click} = props, status = props.status;
        if(!('isOnline' in props.status) && props.usersStatus){
            status = props.usersStatus.get(props.status._id);
        }
        else{
            status = props.status;
        }
        this.currentStatus = status.isOnline;
        let Child = props.children;
        let onlineTimeStamp = activeTime === true ? <TimeStamp time = {status.isOnline ? 0 : status.LastActive}/> : '';
        if(Child){
            if(typeof Child === 'function'){
                let attr = {};
                let a = Child.attr;
                a && status.hasOwnProperty(a) ? (attr[a] = status[a], Child = <Child {...attr}/>): Child = <Child/>;
            }
        }
        else Child = "";
        return (
            <div onClick = {click} className = {status._id + ' user' +(childClass ? " " + childClass : '')}>
                <div className = "icon">
                    <img src = {status.Avartar} alt = {`${status.Username} avartar`}/>
                    <div className = {status.isOnline ? "signal online" : "signal offline"}/>
                </div>
                <div>
                    {props.noName ? '' : <Link to = {`/user?id=${status._id}`}>{status.Username}</Link>}
                    {Child}
                    {onlineTimeStamp}
                </div>
            </div>
        )
    }
}
function mapStateToProps(state){
    return {
        usersStatus: state.main.usersStatus
    }
}
export default connect(mapStateToProps, null)(UserStatus);