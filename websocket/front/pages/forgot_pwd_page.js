import React from 'react';
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
    let back = () =>{
        history.push('/auth/login')
    }
    return (
        <div>
            <h3>Currently, This feature is not supported, please contact author linhletd</h3>
            <button onClick = {back}>Go to login</button>
            {/* <input type = "email" name = "forgot-password"/>butt
            <button onClick = {handleSendToken}>Reset with token</button>
            <button onClick = {handleSendOtp}>Reset with otp</button> */}
        </div>
    )
}
export default ForgotPasswordPage;