/*
target: to optimize dom tree:
    each span node has only textnode & <br> inside;
    no textnode right after textnode;
    no span right after a span that it 'isEqualTo';
*/
class EditorNodeTraveler{
    constructor(root){
        this.root = root;
        this.state = {
            range: null,
            modifyingStyle: null,
            posL: 0,
            posR: 0,
            bigLeft: null,
            bigRight: null,

        }
    }
    createSampleSpan(prop, val){
        let span = document.createElement('span');
        span.style[prop] = val;
        return span;
    }
    isSpanEmpty(span){
        return span.childNodes.length === 0 || span.children.length === 1 && [...span.children][0].nodeName == 'BR' && span.innerText === '';
    }
    splitNode = (range) =>{
        let common = range.commonAncestorContainer;
        let r = new Range();
        r.selectNode(common);
        let div = this._transfer(r);
        range.setEndBefore(common);
        range.insertNode(range.extractContents());
        range.collape(false);
        range.setEndAfter(common);
        range.insertNode(range.extractContents());
        if(this.isSpanEmpty(div.firstChild)){
            div.firstChild.remove();
        };
        if(this.isSpanEmpty(div.lastChild)){
            div.lastChild.remove();
        }
        range.selectNodeContents(div);
        r.insertNode(range.extractContents());
        range.selectNode(common);
        return range;
    }
    findNext = (cur) =>{
        let next = cur.nextSibling;
        let par = cur.parentNode;
        let result
        if(next){
            if(next.nodeName === '#text') result = next;
            if(next.nodeName === 'SPAN') result = next.firstChild;
        }
        else if(par.nodeName === 'SPAN'){
            let next = par.nextSibling;
            next && next.nodeName === '#text' && (result = next);
            next && next.nodeName === 'SPAN' && (result = next.firstChild);
        }
        if(result){
            if(result.nodeName !== '#text' || result.nodeName !== 'SPAN'){
                return false;
            }
            else if(result.nodeName === '#text' && result.nodeValue === '' || result.nodeName === 'SPAN' && this.isSpanEmpty(result)){
                result.remove();
                return this.findNext(cur);
            }
            return result;
        }
        return false;
    }
    findPrev = (cur) =>{
        let prev = cur.previousSibling;
        let par = cur.parentNode;
        let result
        if(prev){
            if(prev.nodeName === '#text') result = prev;
            if(prev.nodeName === 'SPAN') result = prev.lastChild;
        }
        else if(par.nodeName === 'SPAN'){
            let prev = par.nextSibling;
            prev && prev.nodeName === '#text' && (result = prev);
            prev && prev.nodeName === 'SPAN' && (result = prev.lastChild);
        }
        if(result){
            if(result.nodeName !== '#text' || result.nodeName !== 'SPAN'){
                return false;
            }
            else if(result.nodeName === '#text' && result.nodeValue === '' || result.nodeName === 'SPAN' && this.isSpanEmpty(result)){
                result.remove();
                return this.findPrev(cur);
            }
            return result;
        }
        return false;
    }
    findRightMostSpace = (node, i) =>{
        let str = node.nodeValue;
        if(i === undefined) i = 0;
        let off;
        for(let j = i; j < str.length; j ++){
            this.state.posR++;
            if(/\W|_/.test(str[j])){
                off = j;
                break;
            }
        }
        if(off){
            return {node, off}
        }
        else{
            let next = this.findNext(node);
            if(next){
                return this.findRightMostSpace(next);
            }
            return {node}
        }
    }
    findLeftMostSpace = (node, i) =>{
        let str = node.nodeValue;
        if(i === undefined) i = str.length;
        let off;
        for(let j = i - 1; j >= 0; j--){
            this.state.posL++;
            if(/\W|_/.test(str[j])){
                off = j;
                break;
            }
        }
        if(off){
            return {node, off}
        }
        else{
            let next = this.findPrev(node);
            if(next){
                return this.findLeftMostSpace(next);
            }
            return {node}
        }
      }
    reassignRangeToStyle = (range) =>{
        if(!range.collapsed) return false;
        let {startContainer: start} = range;
        if(start.nodeName != 'SPAN' && start.nodeName != '#text'){
            let span = document.createElement('span');
            range.insertNode(span);
        }
        else if(start.nodeName == 'SPAN'){
            if(this.isSpanEmpty(start)){
                range.selectNodeContents(start);
                range.deleteContents();
                range.selectNode(start);
            }
            else{
                range = this.splitNode(range);
            }
        }

        return range;
    }
    modify = (range, {prop, val}) => {
        this.state.range = range.cloneRange();
        this.state.modifyingStyle = {prop, val};
        let {startContainer: start, endContainer: end, startOffset, endOffset, commonAncestorContainer: common} = this.state.range;
        if(range.collapsed){
            if(start.nodeName != 'SPAN' && start.nodeName != '#text'){
                let span = document.createElement('span');
                range.insertNode(span);
            }
            else if(start.nodeName == 'SPAN'){
                if(this.isSpanEmpty(start)){
                    range.selectNodeContents(start);
                    range.deleteContents();
                    range.selectNode(start);
                }
                else{
                    range = this.splitNode(range);
                }
            } 
        }
        if(common.parentNode.nodeName == 'SPAN'){
            common = common.parentNode;
        }
        if(common.nodeName == '#text'){
            this.handleTextCommonNode(common, prop, val)
        }
        else if(common.nodeName == 'SPAN'){
            this.handleSpanCommonNode(common, prop, val)
        }
        else {
            this.handleGeneralCase();
        }
        return this.state.range;
    }
    handleGeneralCase = () =>{
        let {startContainer: start, endContainer: end, startOffset, endOffset, commonAncestorContainer: common} = this.state.range;
        this._getInitialLeftNode();
        this._getInitialRightNode();
        let {bigLeft, bigRight} =  this.state;
        let r = new Range();
        r.setStartBefore(bigLeft);
        if(end == common){
            r.setEndBefore(bigRight)
        }
        else {
            r.setEndAfter(bigRight)
        }
        let div = this._transfer(r);
        this._handleLeftBranch();
        this._handleRightBranch();
        this._reverse(r, div);
        return this.state.range;
    }
    handleTextCommonNode = (common, prop, val) =>{
        if(common.parentNode.style[prop] == val){
            return this.state.range;
        }
        let r = new Range();
        r.selectNode(common);
        let div = this._transfer(r);
        let sample = this.createSampleSpan(prop, val);
        sample.appendChild(this.state.range.extractContents());
        this.state.range.insertNode(sample);
        div.normalize();
        console.log(div);
        this._reverse(r, div);
        return this.state.range;
    }
    handleSpanCommonNode = (span, prop, val) =>{
        if(span.style[prop] == val){
            return this.state.range;
        }
        let r = new Range();
        r.selectNode(span);
        let div = this._transfer(r);
        let mfrg = this.state.range.extractContents();
        let mspan = this.createSampleSpan(prop, val);
        mspan.appendChild(mfrg);
        this.state.range.setStartBefore(span);
        let lfrg = this.state.range.extractContents();
        div.insertBefore(mspan, span);
        div.insertBefore(lfrg, mspan );
        let lspan = mspan.previousSibling;
        [span, lspan].map(cur =>{
            if(!cur.children.length && !cur.innerText == ''){
                cur.remove();
            }
        })
        this.state.range.selectNode(mspan);
        this._reverse(r, div);
        return this.state.range;
    }
    goDownAndNextToModify = (cur, stop) =>{
        let {prop, val} = this.state.modifyingStyle;
        if(!cur || cur === stop) return;
        let par = cur.parentNode,
        prev = cur.previousSibling,
        next = cur.nextSibling;
        console.log(par)
        if(['IMG', 'HR', 'BR', 'PRE'].indexOf(cur.nodeName) > -1) return this.goDownAndNextToModify(next, stop);
        if(cur.nodeName != '#text' && cur.nodeName != 'SPAN'){
            cur.style[prop] = val;
            this.goDownAndNextToModify(cur.firstChild, stop);
            this.goDownAndNextToModify(next, stop);
            return;
        }
        if(cur.nodeName == '#text'){

            if(par.style[prop] == val){
                if(prev && prev.nodeName == '#text'){
                    prev.nodeValue += cur.nodeValue;
                    cur.remove();
                    cur = prev;
                }
                else{
                    //keep there!
                }
            }
            else if(prev && prev.nodeName == 'SPAN' && this.createSampleSpan(prop, val).isEqualNode(prev.cloneNode(false))){
                prev.appendChild(cur);
                prev.normalize();
                cur.remove();
                cur = prev;
            }
            else{
                let span = this.createSampleSpan(prop, val);
                par.replaceChild(span, cur);
                span.appendChild(cur);
                cur = span;
            }
        }
        else if(cur.nodeName == 'SPAN'){
            let r0 = new Range();
            let cloned = cur.cloneNode(false);
            cloned.style[prop] = val;
            if(cloned.isEqualNode(this.createSampleSpan(prop, val)) && par.style[prop] == val){
                //convert to text node
                if(prev && prev.nodeName == '#text'){
                    prev.remove();
                    cur.insertBefore(prev,cur.firstChild);
                    cur.normalize();
                    r0.selectNodeContents(cur);
                    par.replaceChild(cur, r0.extractContents());
                    cur = cur.lastChild;
                }
                else{
                    r0.selectNodeContents(cur);
                    let content = r0.extractContents()
                    par.replaceChild(content, cur);
                    cur = content.lastChild;
                }
            }
            else{
                //wether it can be merged into previous node
                let clonedPrev = prev && prev.cloneNode(false);
                if(clonedPrev && clonedPrev.isEqualNode(cloned)){
                    r0.selectNodeContents(cur);
                    let content = r0.extractContents();
                    prev.appendChild(content);
                    prev.normalize();
                    cur.remove();
                    cur = prev;
                }
                else{
                    cur.style[prop] = val;
                }
            }
        }
        return this.goDownAndNextToModify(cur.nextSibling, stop);
    }
    getNthChild(par, n){
        let x = 0;
        let node = par.firstChild;
        while(x < n){
            try{
                node = node.nextSibling;
            }
            catch{
                break;
            }
        };
        return node
    }
    _getInitialLeftNode = () =>{
        let {startContainer: start, commonAncestorContainer: common, startOffset} = this.state.range;
        if(start == common){
            return this.state.bigLeft = this.getNthChild(common, startOffset);
        }
        let initLeft = start.parentNode.nodeName == 'SPAN'? start.parentNode : start;
        let bigLeft = initLeft;
        while(bigLeft != common && bigLeft.parentNode != common){
            bigLeft = bigLeft.parentNode;
        }
        Object.assign(this.state, {
            initLeft,
            bigLeft,
        })
    }
    _getInitialRightNode = () =>{
        let {endContainer: end, commonAncestorContainer: common, endOffset} = this.state.range;
        if(end == common){
            return this.state.bigRight = this.getNthChild(common, endOffset);
        }
        let initRight = end.parentNode.nodeName == 'SPAN'? end.parentNode : end;
        let bigRight = initRight;
        while(bigRight.parentNode != common){
            bigRight = bigRight.parentNode;
        }
        Object.assign(this.state, {
            initRight,
            bigRight,
        })
    }
    _handleRightBranch = ()=>{
        let {bigRight, initRight} = this.state;
        if(!initRight){
            return this.state.range.setEndBefore(bigRight)
        }
        let par = initRight;
        while(par != bigRight){
            this.goDownAndNextToModify(par.parentNode.firstChild, par);
            par = par.parentNode;
        }
        let parNode;
        let r = this.state.range.cloneRange();
        if(initRight.hasChildNodes() && initRight.nodeName != 'SPAN'){
            parNode = initRight;
            r.setStartBefore(parNode.firstChild);
        }
        else{
            parNode = initRight.parentNode;
            r.setStartBefore(initRight);
        }
        let div = parNode.cloneNode(false);
        div.appendChild(r.extractContents());
        this.goDownAndNextToModify(div.firstChild);
        let r1 = new Range();
        r1.selectNodeContents(div);
        r.insertNode(r1.extractContents());
        this.state.range.setEndAfter(initRight.previousSibling);
        
        if((initRight.children && !initRight.children.length || !initRight.children) && initRight.innerText == '') return initRight.remove();
        initRight.normalize();
    }

    _handleLeftBranch = () => {
        let {bigLeft, initLeft,initRight, bigRight} = this.state;
        if(!initLeft){
            !(bigLeft == bigRight && initRight) && this.goDownAndNextToModify(bigLeft, bigRight);
            this.state.range.setEndBefore(bigLeft);
            return;
        } 
        let par = initLeft;
        while(par != bigLeft.parentNode){
            this.goDownAndNextToModify(par.nextSibling, bigRight);
            par = par.parentNode;
        }
        let parNode;
        let r = this.state.range.cloneRange();
        if(initLeft.hasChildNodes() && initLeft.nodeName != 'SPAN'){
            parNode = initLeft;
            r.setEndAfter(parNode.lastChild);
        }
        else{
            parNode = initLeft.parentNode;
            r.setEndAfter(initLeft);
        }
        let div = parNode.cloneNode(false);
        div.appendChild(r.extractContents());
        this.goDownAndNextToModify(div.firstChild);
        let r1 = new Range();
        r1.selectNodeContents(div);
        r.insertNode(r1.extractContents());
        let start = initLeft.nextSibling;
        this.state.range.setStartBefore(start);
        if((initLeft.children && !initLeft.children.length || !initLeft.children) && initLeft.innerText == '') return initLeft.remove();
        initLeft.normalize();
    }
    _transfer = (extRange) =>{
        let {startContainer: start, endContainer: end, startOffset, endOffset} = this.state.range;
        let common = extRange.commonAncestorContainer;
        let div = common.cloneNode(false);
        let content = extRange.extractContents();
        
        div.appendChild(content);
        this.state.range.setStart(start == common ? div : start, start == common ? 0 : startOffset);
        this.state.range.setEnd(end == common ? div : end, end == common ? div.childNodes.length : endOffset);
        return div;
    }
    _reverse = (extRange, div) => {
        let {startContainer: start, endContainer: end, startOffset, endOffset} = this.state.range,
            {commonAncestorContainer: common} = extRange;
        let r = new Range();
        r.selectNodeContents(div);
        extRange.insertNode(r.extractContents())
        this.state.range.setStart(start == div ? common : start, start == div ? r.startOffset + startOffset : startOffset);
        this.state.range.setEnd(end == div ? common : end, end == div ? r.endOffset + endOffset : endOffset);
    }
}
export default EditorNodeTraveler;