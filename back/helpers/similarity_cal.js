class Similarity {
    constructor(){
      this.src;
      this.des;
      this.arr;
      this.generate = this.generate.bind(this);
    }
    findMin(...args){
      return args.reduce((acc, cur) => {
        if(typeof cur == 'number' && cur < acc){
          return cur
        }
        else {
          return acc;
        }
      },Number.POSITIVE_INFINITY)
    };
    optimizePath(i,j){
      if(i === undefined || j === undefined){
        var i = this.arr.length - 1;
        var j = this.arr[0].length - 1;
      }
      let optPath = [[i,j, this.arr[i][j]]];
      while (j >= 0 && i >= 0){
        if(i=== 0 && j === 0){
          break;
        }
        let i1 = i - 1 >= 0 ? i - 1 : i;
        let j1 = j - 1 >= 0 ? j - 1 : j;
        let min = this.findMin(this.arr[i][j1], this.arr[i1][j1], this.arr[i1][j]);
          if( this.arr[i1][j1] === min){
            i = i1;
            j = j1;
          }
          else if(this.arr[i][j1] === min){
            j = j1;
            if(j === 0){
              i = i1;
            }
          }
          else if(this.arr[i1][j] === min){
            i = i1;
            if(i === 0){
              j = j1
            }
          }
        optPath.push([i,j, this.arr[i][j]])
      }
      return optPath.reverse().map((cur,idx)=>{
      cur = [...cur];
      if(idx >0){
        cur[2]-=optPath[idx-1][2]
      }
      return cur;
      });
    }
  
    same(i,j){
      if(this.des[i] !== this.src[j]){
        return false;
      }
      let countai = this.des.slice(0, i+1).filter((cur) => (cur == this.des[i])).length;
      let countbj =this.src.slice(0, j+1).filter((cur)=>(cur ===this.src[j])).length;
      if((countai <= Math.min(i, j)+1 && countbj <= Math.min(i, j)+1)){
        if(countbj <= countai){
          return true;
        }
        else if(countbj > countai){
          let x = i -1 >= 0 ? this.optimizePath(i-1, j): this.optimizePath(i, j-1) ;
          
          let check = x.filter((cur) =>{
            if(cur[2] === 0 && cur[0] === i){
            //   console.log(cur,i,j)
            }
            return (cur[2] === 0 && cur[0] === i)
          }).length;
          return !check;
        }
        else {
          return false;
        }
      }
    }
  
    generate(a2,a1){
      if (typeof a1 != 'string' || typeof a2 != 'string' || a1.length === 0 || a2.length === 0){
        throw new Error('arguments must be the not empty strings')
      }
      let a = [...a1]; //des
      let b = [...a2]; //src
      
      let m = a.length;
      let n = b.length;
      let arr = [];
      this.des = a;
      this.src = b;
      this.arr = arr;
  
      for(let i = 0; i < m; i++){
        arr.push(new Array(n))
      }
      for(let i = 0; i < m; i++){
        for(let j = 0; j < n; j++){
          if(i == 0){
             if(this.same(i,j)){
              arr[i][j] = arr[i][j-1]||0;
            }
            else{
              arr[i][j] = arr[i][j-1]+1||1;
            }
          }
          else {
            if(this.same(i,j)){
              arr[i][j] = this.findMin(arr[i][j-1], arr[i-1][j-1], arr[i-1][j] );
            }
            else {
              arr[i][j] = this.findMin(arr[i][j-1], arr[i-1][j-1], arr[i-1][j] ) + 1;
            }
          }
      
        }
      }
  
      let optpath = this.optimizePath();
      let aIndx = [];
      let bIndx = [];
      let path = optpath.map((cur) =>{
        if(cur[2] === 0){
          aIndx.push(cur[0]);
          bIndx.push(cur[1]);
          cur.push('match','');
        }
        return cur;
      }).map((cur, idx) =>{
        if(cur[2] !== 0){
          if(aIndx.indexOf(cur[0]) === -1){
            if(bIndx.indexOf(cur[1]) === -1){
              cur.push('substitute','substitute '+ "\'"+ b[cur[1]] +"\'" + " by " + "\'" + a[cur[0]] + "\'");
            }
            else if(bIndx.indexOf(cur[1]) !== -1){
              cur.push('insert','insert '+ "\'"+ a[cur[0]] + "\'");
            }
          }
          else if(aIndx.indexOf(cur[0]) !== -1 && bIndx.indexOf(cur[1]) === -1){
            cur.push('delete','delete ' + "\'" +b[cur[1]] + "\'");
          }
          aIndx.push(cur[0]);
          bIndx.push(cur[1])
        }
      
        return cur;
      })
      return {
        src: a2,
        des: a1,
        matrix: arr,
        path: path
      }
      }
  
  }
  module.exports  = (new Similarity()).generate