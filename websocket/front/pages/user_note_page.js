import {useEffect} from 'react';
import {useHistory} from 'react-router-dom'
const UserNotePage = ()=>{
    useEffect(()=>{
        document.getElementById('note')//..
    })
    return(
        <div>
            <h1>Browse note</h1>
            <ul id = "note-list">
                <li>test</li>
            </ul>
        </div>
    )
}
module.exports = UserNotePage;