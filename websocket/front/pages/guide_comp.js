import React from 'react';
class Guide extends React.Component{
    constructor(props){
        super();
        this.curIndex = 0;
        this.p = React.createRef();
    }
    shouldComponentUpdate(){
        return false;
    }
    close = () =>{
        this.p.current.parentNode.parentNode.classList.add('hide');
    }
    goNext = () =>{
        let {array} = this.props.data;
        let len = array.length;
        if(this.curIndex === len - 1){
            this.curIndex = 0
        }
        else{
            this.curIndex++
        }
        this.p.current.innerText = array[this.curIndex]
        this.setIdxState({curIndex: this.curIndex})
    }
    goPrev = () =>{
        let {array} = this.props.data;
        let len = array.length;
        if(this.curIndex === 0){
            this.curIndex = len -1;
        }
        else{
            this.curIndex--;
        }
        this.p.current.innerText = array[this.curIndex]
        this.setIdxState({curIndex: this.curIndex})
    }
    render(){
        let {data} = this.props, {curIndex} = this;
        let content = data.array[0];
        let len = data.array.length;
        let self = this;
        class Idx extends React.Component{
            state = {
                curIndex: 0
            }
            setIdxState = (state, cb) =>{
                this.setState(state, cb);
            }
            componentDidMount(){
                self.setIdxState = this.setIdxState;
            }
            render(){
                let idx = (data.array).map((cur, i) =>{
                    return <span key = {i} className = {`guide_index${this.state.curIndex === i ? ' current' : ''}`}></span>
                })
                return(
                    <div>
                        {idx}
                    </div>
                )
            }
        }
        return(
            <div className = {`guide${data.hide ? ' hide' : ''}`} id = {data.id}>
                {data.closable ? <i className="fa fa-window-close-o" onClick = {this.close}></i> : ''}
                <div className = 'guide_content'>
                    <i className="fa fa-chevron-left" onClick = {this.goPrev}></i>
                    <p ref = {this.p}>{content}</p>
                    <i className="fa fa-chevron-right" onClick = {this.goNext}></i>
                </div>
                <Idx/>
            </div>
        )
    }
}
export default Guide;