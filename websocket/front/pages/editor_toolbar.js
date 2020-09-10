import React from 'react';
import {connect} from 'react-redux';
class ToolBar extends React.PureComponent{
    constructor(props){
        super(props);  
    }
    selectFile(e){
        document.getElementById('img').click();
    }
    render(){
        let {click, state} = this.props;
        // console.log(2222, state)
        let emptyFontStyle = state.fontfamily === 'false' ? {display: 'none'} : {display: 'block'};
        let emptySizeStyle = state.fontsize === 'false' ? {display: 'none'} : {display: 'block'}
        return (
            <div id = 'tool_bar'>
                <div onClick = {click.undo} className = {state.undo ? '' : 'disabled'}><i className="fa fa-reply"></i></div>
                <div onClick = {click.redo} className = {state.redo ? 'space' : 'space disabled'}><i className="fa fa-share"></i></div>
                <div onClick = {click.handleClickBold} className = {state.bold === 0 ? 'disabled' : state.bold === 2 ? 'activated' : ''}><i className="fa fa-bold"></i></div>
                <div onClick = {click.handleClickItalic} className = {state.italic === 0 ? 'disabled' : state.italic === 2 ? 'activated' : ''}><i className="fa fa-italic"></i></div>
                <div onClick = {click.handleClickUnderline} className = {state.underline === 0 ? 'space disabled' : state.underline === 2 ? 'space activated' : 'space'}><i className="fa fa-underline"></i></div>
                <div onClick = {click.handleClickUList} className = {state.unorder === 2 ? 'activated' : ''}><i className="fa fa-list-ul"></i></div>
                <div onClick = {click.handleClickOList} className = {state.order === 2 ? 'activated' : ''}><i className="fa fa-list-ol"></i></div>
                <div onClick = {click.handleIncreaseListLevel} className = {state.inclevel === 0 ? 'disabled' : ''}><i className="fa fa-indent"></i></div>
                <div onClick = {click.handleDecreaseListLevel} className = {state.declevel === 0 ? 'space disabled' : 'space'}><i className="fa fa-outdent"></i></div>
                <div onClick = {click.handleBlockquote} className = {state.quote === 2 ? 'activated' : ''}><i className="fa fa-quote-left"></i></div>
                <div onClick = {click.handleBlockCode} className = {state.code === 0 ? 'disabled' : state.code === 2 ? 'activated' : ''}><i className="fa fa-code"></i></div>
                <div className = {state.bold === 0 ? 'disabled' : ''}>
                    <i className= "fa fa-file-image-o i-wrapper" onClick = {this.selectFile}>
                        <input type = 'file' name = 'img' id = 'img' accept = 'image/*'/>
                    </i>
                </div>                
                <div onClick = {click.handleLink}  className = {state.link === 0 ? 'disabled space' : state.link === 2 ? 'activated space' : 'space'}><i className="fa fa-link"></i></div>
                <div className = {state.bold === 0 ? 'disabled ctn colr' : 'ctn colr'}>
                    <div className = 'prev-i' onClick = {click.handleBgroundColor}>
                        <i className="fa fa-font" style = {{backgroundColor: state.fill}}></i>
                        <div style = {{backgroundColor: state.fill}}></div>
                    </div>
                    <i className="fa fa-caret-down i-wrapper">
                        <input type = 'color' className = 'color-select' onInput = {click.handleBgroundColor}/>
                    </i>
                </div>
                <div className = {state.bold === 0 ? 'disabled ctn colr space' : 'ctn colr space'}>
                    <div className = 'prev-i' onClick = {click.handleClickFontColor}>
                        <i className="fa fa-font" style = {{color: state.color}}></i>
                        <div style = {{backgroundColor: state.color}}></div>
                    </div>
                    <i className="fa fa-caret-down i-wrapper">
                        <input type = 'color' className = 'color-select' onInput = {click.handleSelectFontColor}/>
                    </i>
                </div>
                <div className = 'ctn select'>
                  <select onChange = {click.handleFont} value = {state.fontfamily} >
                        <option value = 'Georgia,serif' style = {{fontFamily: 'Georgia,serif'}}>Georgia</option>
                        <option value = '"Palatino Linotype","Book Antiqua",Palatino,serif' style = {{fontFamily: 'Palatino Linotype,Book Antiqua,Palatino,serif'}}>Palatino Linotype</option>
                        <option value = '"Times New Roman",Times,serif' style = {{fontFamily: '"Times New Roman",Times,serif'}}>Times New Roman</option>
                        <option value = 'Arial,Helvetica,sans-serif' style = {{fontFamily: 'Arial,Helvetica,sans-serif'}}>Arial</option>
                        <option value = '"Arial Black",Gadget,sans-serif' style = {{fontFamily: '"Arial Black", Gadget, sans-serif'}}>Arial Black</option>
                        <option value = '"Comic Sans MS",cursive,sans-serif' style = {{fontFamily: '"Comic Sans MS",cursive,sans-serif'}}>Comic Sans MS</option>
                        <option value = 'Impact,Charcoal,sans-serif' style = {{fontFamily: 'Impact,Charcoal,sans-serif'}}>Impact</option>
                        <option value = '"Lucida Sans Unicode","Lucida Grande",sans-serif' style = {{fontFamily: '"Lucida Sans Unicode","Lucida Grande",sans-serif'}}>Lucida Sans Unicode</option>
                        <option value = 'Tahoma,Geneva,sans-serif' style = {{fontFamily: 'Tahoma,Geneva,sans-serif'}}>Tahoma</option>
                        <option value = '"Trebuchet MS",Helvetica,sans-serif' style = {{fontFamily: '"Trebuchet MS",Helvetica,sans-serif'}}>Trebuchet MS</option>
                        <option value = 'Verdana,Geneva,sans-serif' style = {{fontFamily: 'Verdana,Geneva,sans-serif'}}>Verdana</option>
                        <option value = '"Courier New",Courier,monospace' style = {{fontFamily: '"Courier New",Courier,monospace'}}>Courier New</option>
                        <option value = '"Lucida Console",Monaco,monospace' style = {{fontFamily: '"Lucida Console",Monaco,monospace'}}>Lucida Console</option>
                        {state.fontfamily === 'false' ? <option value = 'false' style = {emptyFontStyle}></option> : ''}

                    </select>
                    <select onChange = {click.handleFontSize} value = {state.fontsize}>
                        <option value = '8px'>8</option>
                        <option value = '9px'>9</option>
                        <option value = '10px'>10</option>
                        <option value = '11px'>11</option>
                        <option value = '12px'>12</option>
                        <option value = '14px'>14</option>
                        <option value = '16px'>16</option>
                        <option value = '18px'>18</option>
                        <option value = '20px'>20</option>
                        <option value = '24px'>24</option>
                        <option value = '28px'>28</option>
                        <option value = '32px'>32</option>
                        <option value = '38px'>38</option>
                        <option value = '46px'>46</option>
                        <option value = '54px'>54</option>
                        <option value = '62px'>62</option>
                        <option value = '72px'>72</option>
                        {state.fontsize === 'false' ? <option value = 'false' style = {emptySizeStyle}></option> : ''}
                    </select>
                </div>
            </div>
        )
    }
}
function mapstateToProps(state){
    return {
        state: state.toolbar
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateState: function(action){
            dispatch(action);
        }
    }
}
export default connect(mapstateToProps, mapDispatchToProps)(ToolBar);