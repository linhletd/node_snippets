import React from 'react';
import {NavLink} from 'react-router-dom';
import UserStatus from '../pages/user_status';
import fetchReq from '../utils/xhr';
import {connect} from 'react-redux';
import {withRouter} from 'react-router-dom'
let Logout = () =>{
    let handleLogout = () =>{
        fetchReq('/logout')
        .then(({result}) =>{
            if(result){
                window.open('auth/login','_self');
            }
        })
    }
    return(
        <div className = 'option logout'  onClick = {handleLogout}>
            <i className="fa fa-power-off"></i><span>Sign out</span>
        </div>
    )
}
let Users = (props) =>{
    return (
        <div className = 'small_hide large_hide hdr_ico' id = 'h_users'>
            <i className="fa fa-users" onClick = {props.handleClickUsers}></i>
        </div>
    )
}
class Bell extends React.Component{
    shouldComponentUpdate(nextProps){
        if(nextProps.noti.size === 0){
            if(document.getElementById('app_right').style.display !== ''){
                document.getElementById('h_bell').click();
            }
        }
        return true;
    }
    render(){
        return (
            <div className = 'large_hide medium_hide hdr_ico' id = 'h_bell' onClick = {this.props.handleClickBell}>
                <i className="fa fa-bell"></i>
                {this.props.noti.size ? <span id = 'noti_num'>{this.props.noti.size}</span> : ''}
            </div>
        )
    }
}
function mapStateToProps(state){
    return {
        noti: state.poong.noticeList
    }
}
let ConnectedBell = connect(mapStateToProps, null)(Bell);
class PrimaryHeader extends React.Component{
    constructor(){
        super();
        this.header = React.createRef();
        this.alist = null;
        this.active = document.createElement('span');
        this.pseudo = null;
        this.transiUp = false;
        this.transiDown = false;
        this.user = undefined;
        this.users = undefined;
        this.person = undefined;
        this.bell = undefined;
    }
    handleclickHead(){
        window.scrollTo(0, 0);
    }
    shouldComponentUpdate(nextProps){
        if(this.pseudo && nextProps.location.pathname !== this.props.location.pathname){
            this.pseudo.click();
        }
        return false;
    }
    handleWindowResize = () =>{
        if((innerWidth >= 1200 || innerWidth < 600 && !this.transiUp) && this.left.style.display === 'flex' ||
        innerWidth >= 600 && this.right.style.display === 'flex'){
            this.pseudo.click();
        }
        if(innerWidth >= 600){
            if(this.transiUp && this.pseudo){
                this.transiUp = false;
                this.users.firstChild.click();
            }
            if(this.transiDown && this.pseudo){
                let person = this.person;
                if(!person.classList.contains('show_drop')){
                    person.click();
                }
            }
        }
        if(innerWidth < 600 && this.transiDown && !this.pseudo){
            this.user.firstChild.click();
        }
    }
    componentDidMount(){
        this.alist = [...this.header.current.querySelectorAll('a')];
        this.checkActiveRoute();
        this.left = document.getElementById('app_left');
        this.right = document.getElementById('app_right');
        this.user = this.header.current.querySelector('#h_user');
        this.person = this.header.current.querySelector('#h_person');
        this.users = this.header.current.querySelector('#h_users');
        this.bell = this.header.current.querySelector('#h_bell');
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
        if(this.props.location.pathname !== '/user' && !this.active.classList.contains('active')){
            this.active.classList.add('active');
        }
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
            this.left.style.display = 'flex';
        }
    }
    handleClickBell = () =>{
        let bell = this.bell;
        if(this.pseudo === bell){
            this.removePseudo();
            this.right.style.display = '';
            this.restoreOrAddActiveRoute();
        }
        else{
            if(this.pseudo && this.pseudo !== bell){
                this.pseudo.click();
            }
            this.addActiveToPseudo(bell);
            this.right.style.display = 'flex';
        }
    }
    handleClickPerson = () =>{
        if(this.pseudo === this.user.firstChild){
            this.restoreOrAddActiveRoute();
        }
        let person = this.person;
        if(person.classList.contains('show_drop')){
            person.classList.remove('show_drop');
            this.transiDown = false;
        }
        else{
            person.classList.add('show_drop');
            this.transiDown = true;
        }
    }
    handleClickUser = (e) =>{
        let user = this.user;
        if(this.pseudo === e.target){
            if(this.left.style.display === 'flex'){
                this.left.style.display = '';
            }
            this.transiDown = false;
            this.transiUp = false;
            user.classList.remove('show_drop');
            this.removePseudo();
            this.restoreOrAddActiveRoute();
            this.person.classList.contains('show_drop') && this.person.classList.remove('show_drop')
        }
        else{
            if(this.pseudo && this.pseudo !== e.target){
                this.pseudo.click();
            }
            this.addActiveToPseudo(e.target);
            user.classList.add('show_drop');
            this.transiDown = true;
        }
    }
    render(){
        let user = {...this.props.user};
        let Person = () =>{
            return (
                <div id = 'h_person' className = 'small_hide hdr_ico' onClick = {this.handleClickPerson}>
                    <UserStatus noName = {true} childClass = 'user_tiny' status = {user}/>
                    <div className = 'drop arrow'/>
                    <div id = 'p_option' className = 'drop set'>
                        <Logout/>
                    </div>
                </div>
            )
        }
        let User = () =>{
            let handleClick = () =>{
                this.left.style.display = 'flex';
                let user = this.user;
                user.classList.remove('show_drop');
                this.transiUp = true;
                this.transiDown = false;
                this.person.classList.contains('show_drop') && this.person.classList.remove('show_drop')
            }
            return(
                <div id = 'h_user' className = 'large_hide medium_hide hdr_ico'>
                    <i className="fa fa-user" onClick = {this.handleClickUser}></i>
                    <div className = 'drop arrow'/>
                    <div id = 'u_option' className = 'drop set'>
                        <Logout/>
                        <div onClick = {handleClick}><i className="fa fa-users"></i><span>People</span></div>
                    </div>
                </div>
            )
        }
        return (
            <div id = 'app_header' ref = {this.header} onClick = {this.handleclickHead}>
                <Users handleClickUsers = {this.handleClickUsers}/>
                <div className = 'hdr_ico'><NavLink exact to = '/' activeClassName = 'active'><i className="fa fa-home" onClick = {this.handleCLickLink}></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/discuss' activeClassName = 'active'><i className="fa fa-newspaper-o" onClick = {this.handleCLickLink}></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/game' activeClassName = 'active'><i className="fa fa-gamepad" onClick = {this.handleCLickLink}></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/similarity' activeClassName = 'active'><i className="fa fa-exchange" onClick = {this.handleCLickLink}></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/editor' activeClassName = 'active'><i className="fa fa-file-text-o" onClick = {this.handleCLickLink}></i></NavLink></div>
                <div className = 'hdr_ico'><NavLink to = '/sql_query' activeClassName = 'active'><i className="fa fa-database" onClick = {this.handleCLickLink}></i></NavLink></div>
                <ConnectedBell handleClickBell = {this.handleClickBell}/>
                <Person/>
                <User/>
            </div>
        )
    }
}
export default withRouter(PrimaryHeader);