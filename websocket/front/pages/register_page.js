const RegisterPage = ()=>{
    function handleRegist(){
        //
    }
    return (
        <div id = "regist_page">
        <h1>Being with me, register!</h1>
        <form id = "regist_form" autoComplete = "off">
            Your name: <input type = "text" name = "regist_name" placeholder = "John Doe"/> <br/>
            Email: <input type = "email" name ="regist_email" placeholder = "example@mail.com"/> <br/>
            Password: <input type = "password" name = "regist_password"/><br/>
            confirm password: <input type = "password" name = "regist_confirm"/>
        </form>
        <button onClick = {handleRegist}>submit</button>
        </div>
    )
}
module.exports = RegisterPage;