import React from 'react';
import {useHistory} from 'react-router-dom';

const ForgotPasswordPage = () =>{
    let history = useHistory();
    let back = () =>{
        history.push('/auth/login')
    }
    return (
        <div id = 'forgotten'>
            <p>Currently, This feature is not supported, please contact author linhletd by using <a href = '/feedback'>link</a></p>
            <button onClick = {back} className = 'btn_blue'>Go to login</button>
        </div>
    )
}
export default ForgotPasswordPage;