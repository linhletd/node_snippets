import React from 'react';
class WaittingNotation extends React.Component{
    constructor(props){
        super();
        this.notation = React.createRef();
    }
    componentDidMount(){
        this.props.run(this.notation.current);
    }
    componentDidUpdate(){
        this.props.run(this.notation.current);
    }
    render(){
        let waitChildren = [...Array(4)].map((cur,i) =>{
            return <span key = {i} className = 'wait_child'></span>
        })
        return(
            <div className = 'wait_ctn' ref = {this.notation}>
                {waitChildren}
            </div>
        )
    }
}
export default WaittingNotation;