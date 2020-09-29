import React from 'react';
import {runNotation} from '../utils/operateNotationWait'
class WaittingNotation extends React.Component{
    constructor(props){
        super();
        this.notation = React.createRef();
        this.run = runNotation;
    }
    componentDidMount(){
        if(this.props.run){
            this.props.run(this.notation.current);
        }
        else{
            this.run(this.notation.current);
        }
    }
    componentDidUpdate(){
        if(this.props.run){
            this.props.run(this.notation.current);
        }
        else{
            this.run(this.notation.current);
        }
    }
    componentWillUnmount(){
        if(this.props.autoStop){
            clearTimeout(this.waitTimer);
            this.waitTimer = undefined;
        }
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