import React from 'react';
class DiscussPage extends React.Component {
    constructor(props){
        super(props);
        this.state = ""
    }
    uploadTopic(e){
        e.preventDefault();
        let form = new FormData(document.getElementById('create_topic'));
        form.append('author', this.props.user);
        let key = [...form.keys()][0];
        let val = [...form.values()][0]
        let body = {};
        body[key] = val;
        fetch('/discuss/post_topic',{
            body: JSON.stringify(body),
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            }
        })
        .then((res) => {
            console.log(res);
            if(res.redirected){
                return {err: 'session ended'}
            }
            return res.json();
        })
        .then((data) =>{
            console.log(data)
            this.setState({data: data});
        })
    }
    componentDidMount(){

    }
    render() {
        let data = this.state;
        // const BrowseTopic
        
        const Topic = function(props){
            if(data){
                return (
                        <div id = 'topic_container'>
                            <div>
                                {/* <image src = {data.author.avartar} alt = {`${data.author.name} avartar`}></image>
                                <a href ='#'>{data.author.name}</a>
                                <p>{data.question}</p>
                                {data.topic.attach_image ? <image src = {data.author.avartar} alt = {`${data.author.name} avartar`}></image> : ""}
                                <p>{`Post by ${data.author.name} at ${(new Date(data.timestamp)).toString()}`}</p> */}
                            </div>
                            <input name = "comment" id = "comment" type ="text"/>
                            <button id = "post_comment">submit</button>
                        </div>
                    )
            }
            return ""
        }   
        return (
            <div id = 'topic'>
                <form id = 'create_topic'>
                    Question: <input type = 'text' name = 'question' />
                    {/* file: <input id = 'file_upload' type = 'file' name = 'file' /> */}
                </form>
                <button id = 'post_topic' onClick = {this.uploadTopic.bind(this)} >Submit</button>
                <Topic/>
            </div>
        )
    }
}
export default DiscussPage