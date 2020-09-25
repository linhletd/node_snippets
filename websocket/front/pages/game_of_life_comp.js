import React from 'react';
import Guide from './guide_comp';
class GameOfLife extends React.Component{
    state = {
        matrix: [],
        
    };
    guide = {
            header: 'Game Of Life',
            id: 'life_guide',
            array:[
                `"Game Of Life" (trò đời), là game "không người chơi" hay giống như một dạng mô phỏng sự gia tăng dân số`,
                `Mỗi cell trong bảng là một người (sống - màu xanh, chết - màu trắng), các cell liền kề còn sống gọi là hàng xóm`,
                `Một cell đang sống có 2 hoặc 3 hàng xóm thì tiếp tục sống`,
                `Một cell đang sống có quá 3 hàng xóm, nó sẽ chết vì dân số quá đông, nếu có ít hơn 2 hàng xóm nó sẽ chết vì dân số quá thưa`,
                `Một cell đã chết sẽ sống lại nếu có 3 hàng xóm`,
                `Để bắt đầu chơi, hãy di chuyển chuột vào bảng và nhấn biểu tượng play!`
            ],
            closable: false
        }

    countNeighbor(arr,i,j){
        let arrLen = arr.length;
        let list = [[i-1, j-1], [i-1,j], [i-1, j+1], [i+1, j+1], [i+1, j], [i+1, j-1],[i, j-1], [i, j+1]];
            let neighbor = list.reduce((acc, cur) => {
            if(cur[0] >= 0 && cur[0] < arrLen && arr[cur[0]][cur[1]]){
                acc += 1;
            }
            return acc;
        },0);
        return neighbor === 2 && arr[i][j] === 1 || neighbor === 3 ? 1 : 0;
    }
    initialize = () =>{
        var matrix = [];
        let m = 50;
        let n = 50;
        for(let i = 0; i < m; i++){
            matrix[i] = new Array(m)
            for(let j = 0; j < n; j++){
            matrix[i][j] = Math.round(Math.random()*0.6);
            }
        }
        this.setState({
            matrix: matrix,
            run: false
        })
        return matrix;
    }
    reset = () =>{
        this.timerId && clearTimeout(this.timerId) && (this.timerId = undefined);
        this.initialize();
    }
    run = () =>{
        let m = this.state.matrix.length;
        let n = this.state.matrix[0].length;
        this.timerId = setInterval(()=>{
            var matrix = [...this.state.matrix].map((cur) => ([...cur]))
            for(let i = 0; i < m; i++){
            for(let j = 0; j < n; j++){
                matrix[i][j] = this.countNeighbor(this.state.matrix,i,j);
            }
            }
            this.setState({
                matrix: matrix,
                run: true
            });
        },500);
    }
    action = ()=>{
        if(this.state.run){
            return this.pause();
        }
        this.run();
    }
    pause = () =>{
        this.timerId && clearTimeout(this.timerId) && (this.timerId = undefined);
        this.setState({
            run: false
        })
    }
    componentDidMount(){
      this.initialize();
    }
    componentWillUnmount(){
        this.timerId && clearTimeout(this.timerId) && (this.timerId = undefined);
    }
    render(){
        let {matrix, run} = this.state;
        let rows = matrix.map((cur,i) => (<tr key = {`t1${i}`}>{cur.map((val,j) => <td className = {val === 1 ? 'alive' : 'dead'} key = {`t1${i}${j}`}></td>)}</tr>))
        return (
            <div id = 'life_game'>
                <Guide data = {this.guide}/>
                <div>
                    <table>
                        <tbody>
                            {rows}
                        </tbody>
                    </table>
                    <div id = 'run_stop'>
                        <i onClick = {this.action} className={run ? "fa fa-pause" : "fa fa-play"}></i>
                        <i onClick = {this.reset} className="fa fa-refresh"></i>
                    </div>
                </div>

            </div>
        )
    }
};
export default GameOfLife;