import {useHistory} from 'react-router-dom'
const VerifyResetTokenPage = () =>{
    let history = useHistory();
    function handleVerify(){
        //
    }
    return (
        <div>
            <input type = "text" name = "verify-token"/>
            <button onClick = {handleVerify}>submit</button>
        </div>
    )
}
module.exports = VerifyResetTokenPage