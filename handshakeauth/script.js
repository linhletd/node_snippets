
document.getElementById('submit').addEventListener('click', async (e) =>{
    e.preventDefault();
    document.getElementById('submit').setAttribute("disabled", "")
    let username = document.getElementsByName('username')[0].value
    let responseText = await new Promise((resolve, reject) => {
        let req = new XMLHttpRequest();
        req.open('post','/check', true);
        req.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
        req.send('username='+ username);
        req.onreadystatechange = (function(){
            if(this.readyState === 4 && this.status === 200){
                resolve(this.responseText)
            }
        }).bind(req)
    }).catch((err) =>{console.log("err",err)})
    let result;
    if(responseText === 'no user'){
        result = responseText;
    }
    else{
        let pw = document.getElementsByName('password')[0].value;
        let hash = Sha256.hash(responseText+pw);
        result = await fetch('/login',{
            method: "post",
            headers:{
                "Content-Type": "application/x-www-form-urlencoded"
            },
            body: `username=${username}&hash=${hash}`
        }).then((data) =>(data.text()))
        .catch((err) => {
            console.log(err)
        })

    }
    document.getElementById('root').innerText = result;
    document.getElementById('submit').removeAttribute('disabled')

})