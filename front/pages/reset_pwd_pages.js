import React from 'react';
import {useHistory} from 'react-router-dom';

const ResetPassword = () =>{
    let history = useHistory();
    function handleReset(){
        //
    }
    return (
        <div>
            <form>
            New password: <input type = "password" name = "reset-pwd-1"/>
            Confirm password: <input type = "password" name = "reset-pwd-2"/>
            </form>
            <button id = "enter-reset" onClick = {handleReset}>Submit</button>
        </div>
    )
}
export default ResetPassword;