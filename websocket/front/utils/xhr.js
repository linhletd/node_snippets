function fetchReq(url,option){
    return fetch(url,option)
    .then((res) =>{
        if(res.redirected){
            return {err: 'session ended'}
        }
        return res.json();
    })
    .catch((err) =>{
        return {err: err.message}
    })
}
export default fetchReq;