import React from 'react';
import {connect} from 'react-redux';
import UserStatus from '../pages/user_status';
class BrowseUserPage extends React.Component{
    constructor(props){
        //props: userStatus, mainProps, parProps, childProps
        super()
        this.state = {
            filterText: '',
        }
        this.textInput = React.createRef();
        this.list = React.createRef();
        this.inner = (props) =>{
            let {parProps, childProps, usersStatus} = props;
            if(usersStatus){
                let filtered = [...usersStatus.values()].filter(this.filter);
                if(!filtered.length && this.props.mainProps.InputComp){
                    this.state.empty = true
                    // this.list.current.classList.add('hide');
                    // console.log('hide')
                }
                else if(this.props.mainProps.InputComp && filtered.length){
                    this.state.empty = false;
                    // this.list.current.classList.contains('hide') && this.list.current.classList.remove('hide');
                }
                let sorted;
                if(this.props.mainProps.noSort){
                    sorted = filtered;
                }
                else{
                    sorted = filtered.sort((b,a)=>(a.isOnline - b.isOnline));
                }
                let {className, ...rest} = parProps;
                className = className || '';
                return (
                    <div {...rest} className = {this.state.empty ? className + ' hide' : className} ref = {this.list} >
                        {sorted.map(status => <UserStatus key = {status._id} status = {status} {...childProps}/>)}
                    </div>
                )
            }
            else{
                return '';
            }
        }
    }
    filter = (data)=>{
        if(!this.state.filterText && this.props.mainProps.filter !== data._id) return true;
        if(this.props.mainProps.filter === data._id || data.Username.length < this.state.filterText.length) return false;
        data = data.Username.toLowerCase();
        let pos, data1 = this.state.filterText.toLowerCase();
        for(let i = 0; i < data1.length; i++){
            if((pos = data.indexOf(data1[i])) > -1){
                data = data.slice(pos + 1)
                if(data1.length - (i+1) > data.length){
                    return false;
                }
            }
            else{
                return false
            }
        }
        return true
    }
    handleInputChange = (e)=>{
        this.setState({filterText: e.target.value.toLowerCase()});
    }
    foreignerSetState = (state, cb) =>{
        this.setState(state, cb)
    }
    shouldComponentUpdate(nextProps, nextState){
        if(this.props.mainProps.InputComp){
            return true;
        }
        if(nextState.filterText !== this.state.filterText || !this.props.usersStatus || this.props.usersStatus && nextProps.usersStatus.length !== this.props.usersStatus.length){
            return true;
        }
        return false;
    }
    componentDidMount(){
        !this.props.mainProps.InputComp && this.textInput.current.focus();
    }
    render(){
        let Inner = this.inner;
        let{mainProps: {closable, close, id, className, InputComp}, ...rest} = this.props;
        return(
            <div className = {`user_board${className ? ' ' + className : ''}`} id = {id}>
                {InputComp ? <InputComp setState = {this.foreignerSetState} state = {this.state}/>:
                    <div className = 'find_user'>
                        <i className="fa fa-search"></i>
                        <input type = 'text' ref = {this.textInput} value = {this.state.filterText} onChange = {this.handleInputChange} placeholder ='find someone...'/>
                        {closable ? <i onClick = {close} className="fa fa-window-close-o"></i> : ''}
                    </div>
                }
                {!InputComp || this.state.showBoard ? <Inner {...rest}/> : ''}
            </div>
        )
    }
}
function mapStateToProps(state, ownProp){
    return {
        usersStatus: state.main.usersStatus,
    }
}
export default connect(mapStateToProps, null)(BrowseUserPage);