import React from 'react';
import fetchReq from '../utils/xhr'

const RegisterPage = (props)=>{
    let {handleLogin} = props
    function handleRegist(e){
        let toObj = (fdata) =>{
            let entries = [...fdata];
            let obj = {};
            entries.map((cur) => {
                obj[cur[0]] = cur[1]
            });
            return obj;
        }
        e.preventDefault();
        let form = e.target.previousElementSibling;
        let body = JSON.stringify(toObj(new FormData(form)));
        console.log(body);
        //validate
        fetchReq('/auth/register', {
            method: 'post',
            headers: {
                'Content-Type': 'application/json'
            },
            body
        }).then(({err, result, user}) =>{
            console.log(err, result, user)
            if(err) console.log(err);
            else handleLogin(user);
        })
    }
    return (
        <div id = "regist_page">
        <h1>register!</h1>
        <form id = "regist_form" autoComplete = "off">
            Your name: <input type = "text" name = "regist_name" placeholder = "John Doe"/> <br/>
            Email: <input type = "email" name ="regist_email" placeholder = "example@mail.com"/> <br/>
            Password: <input type = "password" name = "regist_password"/><br/>
            Confirm password: <input type = "password" name = "regist_confirm"/>
        </form>
        <button onClick = {handleRegist}>submit</button>
        </div>
    )
}
export default RegisterPage;