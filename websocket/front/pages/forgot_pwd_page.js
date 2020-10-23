import React from 'react';
import {useHistory} from 'react-router-dom';

const ForgotPasswordPage = () =>{
    let history = useHistory();
    let back = () =>{
        history.push('/auth/login')
    }
    return (
        <div>
            <h3>Currently, This feature is not supported, please contact author linhletd</h3>
            <button onClick = {back}>Go to login</button>
        </div>
    )
}
export default ForgotPasswordPage;