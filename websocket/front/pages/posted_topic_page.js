import React from 'react';
import {connect} from 'react-redux'

class PostedTopic extends React.Component {
    constructor(props){
        super(props)
    }
    componentDidMount(){
        // document.getElementById('discuss_page').querySelector('#post_topic').querySelector('#submit_topic')
    }
    render(){
        let {user} = this.props;
        return (

        )
    }
}
function mapStateToProps(state, ownProp){
    return {
        user: state.main.user
    }
}
function mapDispatchToProps(dispatch){
    return {
        updateStore: function(action){
            dispatch(action);
        }
    }
}
export default connect(mapStateToProps, mapDispatchToProps)(PostNewTopic);