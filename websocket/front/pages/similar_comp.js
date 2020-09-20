import React from 'react';
class SimilarApp extends React.Component{
    shouldComponentUpdate(){
        return false;
    }
    render(){
        console.log('render')
        let self = this;
        class SimilarInput extends React.Component{
            state = {
                src: '',
                des: '',
            }
            handleInputChange = (e) =>{
                let newState = {};
                newState[e.target.name] = e.target.value;
                this.setState(newState);
            }
            handleSubmitData = (e) =>{
                e.preventDefault();
                if(!self.updateResultState){
                    return;
                }
                this.setState({
                    src: '',
                    des: '',
                    result: false
                })
                let body = {};
                let fields = document.getElementById('input_data').querySelectorAll('input');
                fields.forEach((elem) =>{
                    body[elem.name] = elem.value;
                })
                fetch('/others/similarity',{
                    method: 'POST',
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(body)
                }).then((res) => (res.json()))
                .then((data) => {
                    if(data.err){
                        throw new Error(data.err);
                    }
                    this.setState({
                        result: true
                    })
                    self.updateResultState({data})
                })
                .catch((err) => {
                    self.updateResultState({err: err.message ||'error'})
                })
            }
            render(){
                let {src, des, result} = this.state;
                let valid = src !== '' && des !== '';
                return(
                    <div id = "input_data" style = {{height: result ? '' : '80vh'}}>
                        <p>SIMIMLARITY APP</p>
                        <div>
                            <div>
                                <label htmlFor = "src">From:</label>
                                <input name = "src" type = "text" value = {src} onChange = {this.handleInputChange} required = {true} autoFocus = {true} className = {src !== '' ? 'valid' : 'invalid'}/>
                            </div>
                            <div>
                                <label htmlFor = "des">To:</label>
                                <input name = "des" type = "text" value = {des} onChange = {this.handleInputChange} required = {true} des = {des !== '' ? 'valid' : 'invalid'}/>
                            </div>
                        </div>
                        {valid ? <button onClick = {this.handleSubmitData} className = 'btn btn-info' ><i className="fa fa-magic"></i></button> : ''}
                        {/* <button onClick = {this.handleSubmitData} disabled = {valid ? false : true} className = {valid ? 'btn btn-info' : ''} ><i className="fa fa-magic"></i></button> */}
                    </div>
                )

            }
        }
        class DisplayResult extends React.Component{
            state = {
                data: null
            }
            builder(data){
                let src = data.src;
                let des = data.des;
                let result = data.path.filter((cur) =>(cur[3] !== 'match')).map((cur) =>{
                    let type = cur[3];
                    let change, className, head;
                    if(type === 'delete'){
                        head = des.slice(0, cur[0] + 1);
                        change = src[cur[1]];
                        className = 'delete';
                    }
                    else if(type === 'substitute'){
                        head = des.slice(0, cur[0]);
                        change = des[cur[0]];
                        className = 'substitute';
                    }
                    else if(type === 'insert'){
                        head = des.slice(0, cur[0]);
                        change = des[cur[0]];
                        className = 'insert';
                    }
                    let commentParts = cur[4].match(/^(\w+)(.+)$/);
                    let verb = commentParts[1], verbOb = commentParts[2];
                    return {
                        head,
                        tail: src.slice(cur[1] + 1),
                        verb,
                        verbOb,
                        change,
                        className
                    }
                });
                return result;
            }
            updateResultState = (state, cb) =>{
                this.setState(state, cb)
            }
            componentDidMount(){
                self.updateResultState = this.updateResultState;
            }
            render(){
                let {data} = this.state;
                if(data && data.des){
                    let optmz = data.path.map(cur =>{
                        cur = cur.slice(0,2).join(",");
                        return cur;
                    })
                    let td = ((matrix)=>{
                        let _td = matrix.map((cur, idx) =>{
                        cur = [...cur];
                        cur.unshift(data.des[idx] == " " ? `'${data.des[idx]}'` : `${data.des[idx]}`);
                        cur.unshift(idx + 1);
                        return cur;
                        })
                        let idxRow = ['', ''];
                        let charRow = ['', ''];
                        data.src.split("").map((cur,idx) =>{
                            charRow.push(cur == " " ? `'${cur}'` : `${cur}`);
                            idxRow.push(idx + 1);
                        })
                        _td.unshift(charRow);
                        _td.unshift(idxRow);
                        return _td
                    })(data.matrix)
                    let illustrate = this.builder(data);
                    return (
                        <div id = 'display_result'>
                            <p>Result of edit distance from &nbsp;<span className = 'src-des'>{data.src}</span>&nbsp;to&nbsp;<span className = 'src-des'>{data.des}</span></p>    
                            <div>
                                <table>
                                    <tbody>
                                        {
                                        td.map((cur,i) =>(<tr key = {`t2${i}`}>{cur.map((val,j) => {
                                        if(optmz.indexOf([i-2,j-2].join(",")) !== -1){
                                            return (<td className = 'best' key = {`t2${i}${j}`}>{val}</td>)
                                        }
                                        else {
                                            return (<td key = {`t2${i}${j}`}>{val}</td>)
                                        }
                                        })}</tr>))
                                        }
                                    </tbody>
                                </table>
                                <ol>
                                    <span style = {{"listStyleType": "none"}}><span className = 'illustrate tail'>{data.src}</span><span>&larr;</span><span>start</span></span>
                                    {
                                        illustrate.map((cur,i) => (<li key = {`l1${i}`}><span className = 'illustrate'>{cur.head}<span className = {cur.className}>{cur.change}</span><span className = 'tail'>{cur.tail}</span></span><span>&larr;</span><span className = {cur.className}>{cur.verb}</span><span>{cur.verbOb}</span></li>))
                                    }
                                    <li style = {{"listStyleType": "none"}}><span className = 'illustrate'>{data.des}</span><span>&larr;</span><span>complete</span></li>
                                </ol>
                            </div>
                        </div>
                    )
                }
                else if(data && data.err){
                    return <p>{data.err}</p>
                }
                else{
                    return '';
                }
            }
        }
        return(
            <div id = 'similar_app'>
                <SimilarInput/>
                <DisplayResult/>
            </div>
        )
    }

}
export default SimilarApp