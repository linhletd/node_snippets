import {useHistory} from 'react-router-dom';
const ChangePasswordPage = ()=>{
    let history = useHistory();
    function handleChangePwd(e){
        e.preventDefault();
        return history.push('/')
    }
    return (
        <div>
            <h1>Change your password</h1>
            <input type = "password" name = "change-pwd-1"/>
            <input type = "password" name = "change-pwd-2"/>
            <button id = "submit-chg-pwd" onClick = {handleChangePwd}>Submit</button>
        </div>
    )
}
module.exports = ChangePasswordPage;