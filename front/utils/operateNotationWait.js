function runNotation(parNode){
    if(!parNode || !parNode.children.length){
        //
    }
    let run;
    (run = (cur)=>{
        if(cur.classList.contains('lowlight')){
            cur.classList.remove('lowlight');
        }
        cur.classList.add('highlight');
        this.waitTimer = setTimeout(() =>{
            cur.classList.remove('highlight');
            if(cur.nextSibling){
                cur = cur.nextSibling;
            }
            else{
                cur = parNode.firstChild;
            }
            run(cur)
        },800)
    })(parNode.firstChild)
};
function stopRunNotation(){
    clearTimeout(this.waitTimer);
    this.waitTimer = undefined;
    if(!this.popup.current){
        return;
    }
    let parNode = this.popup.current.querySelector('.wait_ctn');
    if(!parNode || !parNode.children.length){
        return;
    }
    parNode.childNodes.forEach(elem => {
        if(elem.classList.contains('highlight')){
            elem.classList.remove('highlight');
        }
        elem.classList.add('lowlight');
    });
}
export {runNotation, stopRunNotation};