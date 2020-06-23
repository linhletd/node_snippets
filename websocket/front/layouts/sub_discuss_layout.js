import React from 'react';
import DiscussPage from '../pages/discuss_page.js';
import BrowseQuestionPage from '../pages/browse_question_page.js'
const SubDiscussLayout = (props)=>{
    return (
        <div>
            <DiscussPage {...props}/>
            <BrowseQuestionPage/>
        </div>
    )
}
export default SubDiscussLayout