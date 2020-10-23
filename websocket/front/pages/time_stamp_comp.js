import React from 'react';
import timeago from '../utils/timeago';
class TimeStamp extends React.Component{
    constructor(props){
        super();
        this.timer = undefined;
        this.timeStamp = React.createRef();
        this.idx = !props.normal ? 1 : 0;
    }
    calcInterval(){
        let gap = Date.now() - this.props.time;
        if(this.props.time && gap < 36 * 3600 * 1000){
            let interval;
            if(gap < 60 * 1000){
                interval = (1 + Math.floor(Math.random()* 150)/100)*60/3 * 1000;//1-1.5 min
            }
            else if(gap < 30 * 60 * 1000){
                interval = (1 + Math.floor(Math.random()* 150)/100)*60 * 1000;//1-1.5 min
            }
            else if(gap < 3600 * 1000){
                interval = (2 + Math.floor(Math.random()* 500)/100)*60 * 1000;//2-5 min

            }
            else{
                interval = (1 + Math.floor(Math.random()* 200)/100)* 3600 * 1000; // 1-2hr
            }
            return interval;
        }
    }
    setRefreshTime = () =>{
        this.timer = setTimeout(() => {
            let x;
            if(this.timeStamp.current && (x = timeago(this.props.time, this.idx)) !== this.timeStamp.current.innerText){
                this.timeStamp.current.innerText = x;
            }
            this.setRefreshTime()
        }, this.calcInterval());
    }
    componentDidMount(){
        this.setRefreshTime();
    }
    componentWillUnmount(){
        if(this.timer){
            clearTimeout(this.timer)
        }
    }
    render(){
        if(this.props.time === undefined){
            return <span className = 'now'>now</span>
        }
        else{
            return <span ref = {this.timeStamp} className = 'ago'>{timeago(this.props.time, this.idx)}</span>
        }
    }

}
export default TimeStamp;