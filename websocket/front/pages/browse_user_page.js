import React from 'react';
import {connect} from 'react-redux';
import UserStatus from '../pages/user_status';
class BrowseUserPage extends React.Component{
    constructor(props){
        super()
        this.state = {
            filterText: ''
        }
        this.textInput = React.createRef();
        let self = this;
        this.inner = class X extends React.Component{
            filter = (data)=>{
                if(!self.state.filterText && this.props.filter !== data._id) return true;
                if(this.props.filter === data._id || data.Username.length < self.state.filterText.length) return false;
                data = data.Username.toLowerCase();
                let pos, data1 = self.state.filterText;
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
            render(){
                let {usersStatus, children, attr, childClass} = this.props;
                return (
                <div {...attr}>
                    {usersStatus ? [...usersStatus.values()].sort((b,a)=>(a.isOnline - b.isOnline)).filter(this.filter)
                    .map(status => <UserStatus key = {status._id} status = {status}
                     children = {children} childClass = {childClass}/>) : ""}
                </div>
                )
            }
        }
    }
    handleInputChange = (e)=>{
        this.setState({filterText: e.target.value.toLowerCase()});
    }
    componentDidMount(){
        this.textInput.current.focus();
    }
    render(){
        let Inner = this.inner;
        let{closable, close, id, className, ...rest} = this.props;
        return(
            <div className = {`user_board${className ? ' ' + className : ''}`} id = {id}>
                <div className = 'find_user'>
                    <i className="fa fa-search"></i>
                    <input type = 'text' ref = {this.textInput} value = {this.state.filterText} onChange = {this.handleInputChange} placeholder ='find someone...'/>
                    {this.props.closable ? <i onClick = {this.props.close} className="fa fa-window-close-o"></i> : ''}
                </div>
                <Inner {...rest}/>
            </div>
        )
    }
}
function mapStateToProps(state, ownProp){
    return {
        usersStatus: state.main.usersStatus
    }
}
export default connect(mapStateToProps, null)(BrowseUserPage);