import React from 'react';
import {connect} from 'react-redux';
class LinkPromt extends React.PureComponent{
    constructor(props){
        super(props);
        let {as, it} = this.props.prompt;
        this.state = {
            urlValidated: as ? true : false,
            url: as ? as[0].href : ''
        } 
    }
    validatedUrl = (text) => {
        return /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}((:[0-9]{1,5}\b)|(\.[a-z]{2,6}\b))([-a-zA-Z0-9@:%_\+.~#?&/=]*)/ig.test(text);
    }
    link = () =>{
        if(this.state.urlValidated){
            if(as){
                as.map(a =>{
                    a.href = this.state.url
                })
            }
            else{
                this.props.prompt.it.next(this.state.url)
            }
        }
        this.updateState({
            type: 'CLOSEPROMPT',
        })
    }
    unlink = () =>{
        let r = new Range(), ct, {as, it} = this.props.prompt;
        as && as.map(a =>{
            r.selectNodeContents(a);
            ct = r.extractContents();
            r.selectNode(a);
            a.remove();
            r.insertNode(ct);
        })
        it && it.next(false);
        this.updateState({
            type: 'CLOSEPROMPT',
        })
    }
    handleChange = (e) =>{
        let text = e.target.value;
        if(this.validatedUrl(text)){
            this.setState({
                url: text,
                urlValidated: true
            })
        }
        else this.setState({
            url: text,
            urlValidated: false
        })
    }
    render(){
        let {prompt} = this.props;
        let style = {
            position: 'fixed',
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',
            zIndex: 1,
        }
        let inputStyle = {
            backgroundColor: this.state.urlValidated ? 'green' : 'pink',
            outline: 'none'
        }
        if(!prompt.closed){
            return (
                <div id = 'link_prompt' style = {style}>
                    <input type = 'url' value = {this.state.url} style = {inputStyle} onChange = {this.handleChange}/>
                    <button onClick = {this.link} disabled = {this.state.urlValidated ? true : false}>link</button>
                    <button onClick = {this.unlink}>unlink</button>
                </div>
            )
        }
        return '';
    }
}
function mapstateToProps(state){
    return {
        prompt: state.linkPrompt//as, it
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateState: function(action){
            dispatch(action);
        }
    }
}
export default connect(mapstateToProps, mapDispatchToProps)(LinkPromt);