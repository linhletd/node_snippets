import React from 'react';
import {connect} from 'react-redux';
class GlobalPopup extends React.Component{
    constructor(props){
        super();
        this.popup = React.createRef();
    }
    componentDidUpdate(){
        console.log(this.props)
        this.popup.current.classList.remove('hide')
    }    
    render(){
        let data = this.props.data;
        return(
            <div ref = {this.popup} className = {`global_popup hide${data && data.className ? ' ' + data.className : ''}`}>
                {data && data.children ? data.children : ''}
            </div>
        )
    }
}
class FlashPopup extends React.Component{
    constructor(props){
        super();
        this.flashRef = React.createRef();
        this.timer = undefined;
    }
    click = () => {
    }
    close = () =>{
        !this.flashRef.current.classList.contains('hide') && (this.flashRef.current.classList.add('hide'),clearTimeout(this.timer), this.timer = undefined);
    }
    setTimer = () =>{
        this.timer = setTimeout(()=>{
            !this.flashRef.current.classList.contains('hide') && this.flashRef.current.classList.add('hide');
            this.timer = undefined;
        }, 5000);
    }
    componentDidMount(){
        this.setTimer
    }
    componentDidUpdate(){
        this.flashRef.current.classList.contains('hide') && this.flashRef.current.classList.remove('hide');
        this.setTimer();
    }
    render(){
        if(props.flash.message){
            return (
                <div ref = {this.flashRef} className = 'flash_popup' onClick = {props.flash.click ? props.flash.click : click}>
                    <i className="fa fa-times" onClick = {close}></i>
                    <p>{props.message}</p>
                </div>
            )
        }
    }
}
function mapStateToProps1(state){
    return{
        data: state.popup.global
    }
}
function mapStateToProps2(state){
    return{
        flash: state.popup.flash,
    }
}
function mapDispatchToProps(dispatch){
    return{
        updateStore: function(action){
            dispatch(action);
        }
    }
}
GlobalPopup = connect(mapStateToProps1, mapDispatchToProps)(GlobalPopup);
let FlashInvitePopup = connect(mapStateToProps2, mapDispatchToProps)(FlashPopup);
export {GlobalPopup, FlashInvitePopup}