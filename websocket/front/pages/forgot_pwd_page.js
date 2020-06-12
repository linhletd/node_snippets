import {useHistory} from 'react-router-dom';

const ForgotPasswordPage = () =>{
    let history = useHistory();
    function handleSendToken(e){
        //
    }
    function handleSendOtp(e){
        //
        history.push('/verify')
    }
    return (
        <div>
            <h1>Reset, Reset and Reset</h1>
            <input type = "email" name = "forgot-password"/>butt
            <button onClick = {handleSendToken}>Reset with token</button>
            <button onClick = {handleSendOtp}>Reset with otp</button>
        </div>
    )
}
module.exports = ForgotPasswordPage;