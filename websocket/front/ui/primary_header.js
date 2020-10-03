import React from 'react';
import {NavLink} from 'react-router-dom';
import UserStatus from '../pages/user_status';
import fetchReq from '../utils/xhr'
let Logout = (props) =>{
    let handleLogout = () =>{
        fetchReq('/logout')
        .then(({result}) =>{
            if(result){
                props.updateStore({
                    type: 'LOGOUT',
                    data: {}
                });
                props.history.push('/auth/login');
            }
        })
    }
    let style = {
        display: 'none',
    }
    return(
        <div className = 'logout' id = 'xxxx' style = {style}>
            <i className="fa fa-power-off" onClick = {handleLogout}></i><span>Sign out</span>
        </div>
    )
}
let Users = (props) =>{
    return (
        <div className = 'small_hide large_hide navi hdr_ico'>
            <i className="fa fa-users" onClick = {props.handleClickUsers}></i>
        </div>
    )
}
let Bell = (props) =>{
    return (
        <div className = 'large_hide medium_hide navi hdr_ico'>
            <i className="fa fa-bell navi" onClick = {props.handleClickBell}></i>
        </div>
    )
}
let Person = (props) =>{
    return (
        <div className = 'small_hide navi hdr_ico' onClick = {props.handleClickPerson}>
            <UserStatus noName = {true} childClass = 'user_tiny' status = {user}/>
            <Logout/>
        </div>
    )
}
let User = (props) =>{
    return(
        <div className = 'large_hide medium_hide navi hdr_ico'>
            <i className="fa fa-user" onClick = {props.handleClickUser}></i>
        </div>
    )
}
class PrimaryHeader extends React.Component{
    constructor(){
        super();
        this.header = React.createRef();
        this.alist = null;
        this.active = null;
        this.pseudo = null;
    }
    handleWindowResize = () =>{
        if((innerWidth >= 1200 || innerWidth < 600) && this.left.style.display === 'block' ||
        innerWidth >= 600 && this.right.style.display === 'block'){
            this.pseudo.click();
        }
    }
    componentDidMount(){
        this.alist = [...this.header.current.querySelectorAll('a')];
        this.checkActiveRoute();
        this.left = document.getElementById('app_left');
        this.right = document.getElementById('app_right');
        window.addEventListener('resize', this.handleWindowResize);
    }
    componentWillUnmount(){
        window.removeEventListener('resize', this.handleWindowResize);
    }
    checkActiveRoute = () =>{
        let as = this.alist;
        for(let i = 0; i < as.length; i++){
            if(as[i].classList.contains('active')){
                this.active = as[i];
                return as[i]
            }
        }
    }
    ignoreActiveRoute = () =>{
        let a = this.checkActiveRoute() || this.active;
        a.classList.remove('active');
    }
    restoreOrAddActiveRoute = () =>{
        if(this.pseudo){
            this.pseudo.click();
        }
        !this.active.classList.contains('active') && this.active.classList.add('active');
    }
    addActiveToPseudo = (target) =>{
        this.ignoreActiveRoute();
        this.pseudo = target;
        target.classList.add('active');
    }
    removePseudo = () =>{
        if(this.pseudo){
            this.pseudo.classList.remove('active');
            this.pseudo = null;
        }
    }
    handleCLickLink = (e) =>{
        this.active = e.target.parentNode;
        this.restoreOrAddActiveRoute();
    }
    handleClickUsers = (e) =>{
        if(this.pseudo === e.target){
            this.removePseudo();
            this.left.style.display = '';
            this.restoreOrAddActiveRoute();
        }
        else{
            if(this.pseudo && this.pseudo !== e.target){
                this.pseudo.click();
            }
            this.addActiveToPseudo(e.target);
            e.target.parentNode.parentNode.lastChild.classList.add('active')
            this.left.style.display = 'block';
        }
    }
    handleClickBell = (e) =>{
        if(this.pseudo === e.target){
            this.removePseudo();
            this.right.style.display = '';
            this.restoreOrAddActiveRoute();
        }
        else{
            if(this.pseudo && this.pseudo !== e.target){
                this.pseudo.click();
            }
            this.addActiveToPseudo(e.target);
            this.right.style.display = 'block';
        }
    }
    handleClickPerson = () =>{
        document.getElementById('xxxx').style.display = 'block'
    }
    render(){
        let user = {...this.props.user};
        user.isOnline = true;
        let Person = (props) =>{
            return (
                <div className = 'small_hide navi hdr_ico' onClick = {this.handleClickPerson}>
                    <UserStatus noName = {true} childClass = 'user_tiny' status = {user}/>
                    <div id = 'yyyy'/>
                    <Logout/>
                </div>
            )
        }
        return (
            <div id = 'app_header' ref = {this.header}>
                {/* <div className = 'small_hide large_hide navi hdr_ico'><i className="fa fa-users"></i></div> */}
                <Users handleClickUsers = {this.handleClickUsers}/>
                <div className = 'hdr_ico'><NavLink exact to = '/' activeClassName = 'active'><i className="fa fa-home" onClick = {this.handleCLickLink}></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/discuss' activeClassName = 'active'><i className="fa fa-newspaper-o" onClick = {this.handleCLickLink}></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/game' activeClassName = 'active'><i className="fa fa-gamepad" onClick = {this.handleCLickLink}></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/similarity' activeClassName = 'active'><i className="fa fa-exchange" onClick = {this.handleCLickLink}></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/editor' activeClassName = 'active'><i className="fa fa-file-text-o" onClick = {this.handleCLickLink}></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/sql_query' activeClassName = 'active'><i className="fa fa-database" onClick = {this.handleCLickLink}></i></NavLink></div>
                {/* <div className = 'large_hide medium_hide navi hdr_ico'><i className="fa fa-bell navi"></i></div> */}
                <Bell handleClickBell = {this.handleClickBell}/>
                {/* <div className = 'small_hide navi hdr_ico'><UserStatus noName = {true} childClass = 'user_tiny' status = {user}/></div> */}
                <Person/>
                <div className = 'large_hide medium_hide navi hdr_ico'><i className="fa fa-user"></i></div>
            </div>
        )
    }
}
export default PrimaryHeader;