import React from 'react';
import Guide from './guide_comp';
class GameOfLife extends React.Component{
    state = {
        matrix: [],
        
    };
    guide = {
            id: 'life_guide',
            array:[
                'aaaaa',
                'bbbbb',
                'ccccc',
            ]
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
                <p>GAME OF LIFE</p>
                <div>
                    <i onClick = {this.action} className={run ? "fa fa-pause" : "fa fa-play"}></i>
                    <i onClick = {this.reset} className="fa fa-refresh"></i>
                </div>
                <table>
                    <tbody>
                        {rows}
                    </tbody>
                </table>
            </div>
        )
    }
};
export default GameOfLife;