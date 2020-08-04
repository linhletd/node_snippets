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
            pos: null,
            bigLeft: null,
            bigRight: null,
        }
    }
    createSampleSpan(prop, val){
        let span = document.createElement('span');
        span.style[prop] = val;
        return span;
    }
    isBelongTag = (nodeName, node) =>{
        if(node.nodeNome == nodeName) return true;
        while(node != this.root && node.parentNode.nodeName == nodeName){
            node = node.parentNode;
        }
        return node.parentNode.nodeName == nodeName ? true : false;
    }
    identifyNodeToProcess = () =>{
        let {startContainer: start, endContainer: end, commonAncestorContainer: common, startOffset, endOffset} = this.state.range;
        if(common.parentNode.nodeName == 'SPAN'){
            common = common.parentNode
        }
        this.state.pos = {
            par: common.parentNode,
            next: common.nextSibling
        }
        return common;
    }
    modify = (range, {prop, val}) => {
        this.state.range = range.cloneRange();
        this.state.modifyingStyle = {prop, val};
        let {startContainer: start, endContainer: end, startOffset, endOffset, commonAncestorContainer: common} = this.state.range;
        if(common.parentNode.nodeName == 'SPAN'){
            common = common.parentNode;
        }
        this.state.pos = {
            par: common.parentNode,
            next: common.nextSibling
        }
        // if(common == this.root){
        //     let div = document.createElement('div');
        //     let r = new Range();
        //     this.state.pos = null;
        //     let content = this.state.range.extractContents();
        //     div.appendChild(content);
        //     this.goDownAndNextToModify(div.firstChild);
        //     r.setStartBefore(div.firstChild);
        //     r.setEndAfter(div.lastChild);
        //     this.root.appendChild(r.extractContents());
        //     this.state.range.selectNodeContents(this.root);
        //     return this.state.range;
        // }
        if(common.nodeName == '#text'){
            return this.handleTextCommonNode(common, prop, val)
        }
        else if(common.nodeName == 'SPAN'){
            return this.handleSpanCommonNode(common, prop, val)
        }
        // else if(start == end){
        //     let next = this.getNthChild(start, this.state.range.endOffset);
        //     let content = this.state.range.extractContents();
        //     this.goDownAndNextToModify(content.firstChild);
        //     next ? start.insertBefore(content, next) : start.appendChild(content);
        //     this.state.range.setStart(start, startOffset);
        //     this.state.range.setEndBefore(next);
        //     return this.state.range;
        // }
        else {
            return this.handleGeneralCase();
        }

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
        this.state.bigLeft = div.firstChild;
        this.state.initLeft == bigLeft ? this.state.initLeft = this.state.bigLeft : '';
        this.state.range.endContainer == div ? (this.state.bigRight = undefined, this.state.initRight = undefined) :
        (this.state.bigRight = div.lastChild, this.state.initRight == bigRight ? this.state.initRight = this.state.bigRight : '');
            // let div = common.cloneNode(false);
            // this._getInitialLeftNode();
            // this._getInitialRightNode();
            // console.log(1111,div)
            // this.state.range.setStart(start == common ? div : start, start == common ? 0 : startOffset);
            // this.state.range.setEnd(end == common ? div : end, end == common ? div.childNodes.length : endOffset);
        this._handleLeftBranch();
        this._handleRightBranch();
            // {
            // let {startContainer: start, endContainer: end, startOffset, endOffset} = this.state.range;
            // let r1 = new Range();
            // r1.selectNodeContents(div);
            // let content = r1.extractContents();
            // r.insertNode(content);
            // this.state.range.setStart(start == div ? r.commonAncestorContainer : start, start == div ? r.startOffset : startOffset);
            // this.state.range.setEnd(end == div ? r.commonAncestorContainer : end, end == div ? r.endOffset : endOffset);
            // }
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



        // let {startOffset, endOffset} = this.state.range;
        // let div = common.parentNode.cloneNode(false);
        // let sample = this.createSampleSpan(prop, val);
        // let co = common.cloneNode(false);
        // // let r0 = new Range();
        // // r0.selectNode(common);
        // // r0.deleteContents();
        // div.appendChild(co);
        // let r = new Range();
        // r.setStart(co, startOffset);
        // r.setEnd(co, endOffset);
        // sample.appendChild(r.extractContents());
        // r.insertNode(sample)
        // div.normalize();
        // r.selectNodeContents(div)
        // // r0.insertNode(r.extractContents())
        // common.parentNode.replaceChild(r.extractContents(), common);
        // this.state.range.selectNode(sample);
        // return this.state.range;

        // let {endOffset, startOffset} =  this.state.range;
        // if(startOffset == 0 && endOffset == common.nodeValue.length){
        //     let prev = common.previousSibling;
        //     let next = common.nextSibling;
        //     let div = common.parentNode.cloneNode();
        //     let sample = this.createSampleSpan(prop, val);
        //     let clonedPrev = prev && prev.cloneNode(false);
        //     let clonedNext = next && prev.cloneNode(false);
        //     let r0 = new Range();
        //     r0.setStartBefore(prev ? prev : common);
        //     r0.setEndBefore(next ? next : common);
        //     let next1 = next ? next.nextSibling : null;
        //     div.appendChild(r0.extractContents());
        //     let a = prev && clonedPrev.isEqualNode(sample);
        //     let b = next && clonedNext.isEqualNode(sample)
        //     if(a){
        //         prev.appendChild(common);
        //         common.remove();
        //         prev.normalize();
        //         let len1 = prev.lastChild.nodeValue.length;
        //         let len2 = common.nodeValue.length;
        //         this.state.range.setStart(prev.lastChild, len1 - len2);
        //         this.state.range.setEnd(prev.lastChild, len1);
        //     }
        //     if(a && a == b){
        //         let fnext = next.firstChild;
        //         let r = new Range();
        //         if(fnext.nodeName == '#text'){
        //             prev.lastChild.nodeValue += fnext.nodeValue;
        //             r.setStartAfter(fnext);
        //             r.setEndAfter(next.lastChild);
        //             !r.collapsed && prev.appendChild(r.extractContents())
        //         }
        //         else{
        //             r.selectNodeContents(next);
        //             prev.appendChild(r.extractContents())
        //         }
        //         next.remove();
        //         prev.normalize();
        //     }
        //     else if(b){
        //         prev.insertBefore(prev.firstChild);
        //         prev.normalize();
        //         let len = common.nodeValue.length;
        //         this.state.range.setStart(prev.firstChild, 0);
        //         this.state.range.setEnd(prev.firstChild, len);
        //         common.remove();
        //     }
        //     else {
        //         sample.appendChild(common.cloneNode());
        //         common.parentNode.replaceChild(sample, common);
        //         this.state.range.selectNode(sample);
        //     }
        //     let {startContainer} = this.state.range;
        //     let r1 = new Range();
        //     r1.selectNodeContents(div);
        //     r0.insertNode(r1.extractContents());
        //     if(startContainer == div) this.state.range.selectNode(sample)
        // }
        // else{
        //     let sample = this.createSampleSpan(prop, val);
        //     sample.appendChild(this.state.range.extractContents());
        //     this.state.range.insertNode(sample);
        //     this.state.range.selectNode(sample);
        // }

    }
    handleSpanCommonNode = (span, prop, val) =>{
        if(span.style[prop] == val){
            return this.state.range;
        }
        let r = new Range();
        r.selectNode(span);
        let div = this._transfer(r);
        // let content = r.extractContents()
        let mfrg = this.state.range.extractContents();
        // if(!span.children.length && !span.innerText == ''){
        //     span.style[prop] = val;
        //     span.appendChild(mfrg);
        //     span.normalize();
        //     r0.insertNode(span);
        //     this.state.range.selectNode(span);
        //     return this.state.range;
        // }

        // let div = span.parentNode.cloneNode();
        // div.appendChild(content);
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
        // next = start.nextSibling;
        // if (start.nodeName == 'SPAN' && next && start.cloneNode(false).isEqualNode(next.cloneNode(false))){
        //     r1.selectNodeContents(start);
        //     next.insertBefore(r1.extractContents(), next.firstChild);
        //     start.remove();
        //     start = next;
        // }
        this.state.range.setStartBefore(start);
        if((initLeft.children && !initLeft.children.length || !initLeft.children) && initLeft.innerText == '') return initLeft.remove();
        initLeft.normalize();
    }
    _transfer = (extRange) =>{
        let {startContainer: start, endContainer: end, startOffset, endOffset} = this.state.range;
        let common = extRange.commonAncestorContainer;
        let div = common.cloneNode(false);
        let content = extRange.extractContents();
        let firstMain = content.firstChild;
        let lastMain = content.lastChild;
        let r = new Range();
        content.childNodes.forEach(node => {
            let copied = node.cloneNode(false);
            if(node.hasChildNodes()){
                r.selectNodeContents(node)
                copied.appendChild(r.extractContents())
            }
            div.appendChild(copied);
        });
        if(start == common){
            this.state.range.setStart(div, 0);
        }
        else if(start == firstMain){
            this.state.range.setStart(div.firstChild, startOffset);
        }
        if(end == common){
            this.state.range.setEndAfter(div.lastChild);
        }
        else if(end == lastMain){
            this.state.range.setEnd(div.lastChild, endOffset);
        }
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