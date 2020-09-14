import React from 'react';
import {connect} from 'react-redux';
class LinkPromt extends React.PureComponent{
    constructor(props){
        super(props);
        let {as} = this.props.prompt;
        this.state = {
            urlValidated: as ? true : false,
            url: as ? as[0].href : ''
        } 
    }
    validatedUrl = (text) => {
        if(text[text.length - 1]) text = text + '/';
        return /[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}((:[0-9]{1,5}\b)?(\.[a-z]{2,6}\b)|(?!(\.[a-z]{2,6}\b))(:[0-9]{1,5}\b)[^\.])([-na-zA-Z0-9@:%_\+.~#?&//=]*)?/ig.test(text);
    }
    link = () =>{
        let {it} = this.props.prompt;
        it && it.next(this.state.url)
        this.props.updateState({
            type: 'CLOSEPROMPT',
        })
    }
    unlink = () =>{
        let {it} = this.props.prompt;
        it && it.next(false);
        this.props.updateState({
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
            position: 'sticky',
            top: '29px',
            display: !prompt.closed ? 'flex' : 'none',
            flexDirection: 'row',
            flexWrap: 'wrap',
            zIndex: 1,
            marginBottom: '3px',
            backgroundColor: 'white'
        }
        let inputStyle = {
            backgroundColor: this.state.urlValidated ? '#9fdf9f' : '#ffbb99',
            opacity: this.state.urlValidated ? 1 : 0.5,
            outline: 'none',
            border: 'solid 1px grey',
            borderRadius: '3px',
            widthMin: '100px',
        }
        setTimeout(()=>{
            document.querySelector('#link_prompt>input').focus();
        },100);
        return (
            <div id = 'link_prompt' style = {style}>
                <input type = 'url' value = {this.state.url} style = {inputStyle} onChange = {this.handleChange} autoFocus = {true}/>
                <button onClick = {this.link} disabled = {this.state.urlValidated ? false : true}>link</button>
                <button onClick = {this.unlink}>unlink</button>
            </div>
        )
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