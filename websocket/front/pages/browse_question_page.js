import React from 'react';
const BrowseQuestionPage = (props) =>{
    let list = [...props.list.values()];
    let handleClick = props.select;
    var Question = (props) =>{
        let question = props.question;
        let author = question.Author;
    
        return (
            <div className = "displayed_question" onClick = {handleClick} id = {`side${question._id}`}>
                <img src = {author.Avartar} alt = {`${author.Username} avartar`} width = "45" heigh = "45"/>
                <div className = "question">
                    <a href = {`/user?id=${author._id}`}>{author.Username}</a>
                    <p>{question.Question}</p>
                </div>
                <div className = "question_info">
                    <p>{question.UpVote} upvote</p>
                    <p>{question.DownVote} down vote</p>
                    <p>{question.Comment} comments</p>
                    <p>{new Date(question.PostTime).toString()}</p>
                </div>
            </div>
        )
    }

    let questions = list.map(question =>(
        <Question key = {question._id.slice(18)} question = {question} />
    ))
    return (
        <div id = 'question_board'>
            <h3>Question list</h3>
            {questions}
        </div>
    )
}

export default BrowseQuestionPage