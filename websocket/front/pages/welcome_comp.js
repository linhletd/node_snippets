import React from 'react';
import UserStatus from './user_status';
let msg0 = <p>Hey! Wait a second...</p>
let msg1 = <p>Hi, I am Linh - Author of this site, did you check your current weather through above app? Is it correct?</p>
let msg2 = <p>Did you resize the viewport? Layout and navbar, are they responsive?</p>
let msg3 = <p>Did you notice that many things kind of 'just now' or '1 minute ago' automatically updated without hanging your device?</p>
let msg4 = <p>Did you notice that this website is also very interactive or real time in some part? And so on...</p>
let msg5 = <div>
    <p>If you feel my app is worth your visiting, i recommend you enjoy all features before check further info below</p>
    <div id = 'ext_info'>
        <a href = '/cv' target = '_blank' download><button>Download My CV</button></a>
        <a href = 'https://github.com/linhletd/node_snippets.git' target = '_blank'><button><i className="fa fa-github"></i><span>&nbsp;&nbsp;App Repository</span></button></a>
    </div>
</div>
let msg6 = <p>If you have any thought about this app, don't hesitate to tell me by using this <a href = '/feedback' target="_blank">link</a></p>
class Welcome extends React.Component{
    constructor(){
        super();
        this.state = {
            len: 0
        };
        this.data = [msg0, msg1, msg2, msg3, msg4, msg5, msg6];
    }
    componentDidMount(){
        let self = this;
        let it;
        function *gen(){
            for(let i = 1; i < self.data.length; i++){
                yield (self.timer = setTimeout(()=>{
                    self.setState({len: self.state.len + 1}, ()=>{
                        it.next();
                    })
                }, 2500))
            }
        }
        it = gen();
        this.timer = setTimeout(() =>{
            this.setState({len: 1},()=>{
                it.next();
            })
        },1000)
    }
    componentWillUnmount(){
        clearTimeout(this.timer)
    }
    render(){
        let Msg = (props) =>{
            return (
                <div className = 'wel_msg'>
                    <UserStatus status = {{_id: '5ee805341320a90df8e07fe7'}} childClass = 'user_small' noName = {true}/>
                    <div>
                        {props.child}
                    </div>
                </div>
            )
        }
        if(this.state.len){
            let messages = this.data.slice(0, this.state.len).map((msg, i) =>{
                return <Msg child = {msg} key = {i}/>
            })
            return(
                <div id = 'welcome'>
                    {messages}
                </div>
            )
        }
        else{
            return '';
        }
    }
}
export default Welcome;