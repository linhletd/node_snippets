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
        if(span.nodeName !== 'SPAN' && span.nodeName !== '#text'){
            throw new Error('only check text or span node')
        }
        if(span.nodeName === '#text'){
            if(span.nodeValue === '') return true;
            return false;
        }
        return span.children.length === 0 && span.innerText === '';
    }
    splitNode = (range) =>{
        let common = range.commonAncestorContainer;
        if(common.nodeName !== 'SPAN' && common.nodeName !== '#text'){
            throw new Error('only split text or span node')
        }
        if(!this.isSpanEmpty(common)){
            let r1 = range.cloneRange();
            r1.collapse(true);
            r1.setStartBefore(common);
            let ct1 = r1.extractContents()
            let r2 = range.cloneRange();
            r2.collapse(false)
            r2.setEndAfter(common);
            let ct2 = r2.extractContents()
            if(!this.isSpanEmpty(ct1.firstChild)){
                r1.insertNode(ct1);
            };
            if(!this.isSpanEmpty(ct2.firstChild)){
                r2.insertNode(ct2);
            }
        }
        range.selectNode(common);
        if(common.nodeName === '#text'){
            if(common.parentNode.nodeName !== 'SPAN'){
                let span = document.createElement('span'),
                    ct0 = range.extractContents();
                range.insertNode(span);
                span.appendChild(ct0);
                return span
            }
            else{
                return this.splitNode(range);
            }
        }

        return common;
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
            if(result.nodeName !== '#text' && result.nodeName !== 'SPAN'){
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
            let prev = par.previousSibling;
            prev && prev.nodeName === '#text' && (result = prev);
            prev && prev.nodeName === 'SPAN' && (result = prev.lastChild);
        }
        if(result){
            if(result.nodeName !== '#text' && result.nodeName !== 'SPAN'){
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
    findRightMostSpace = (function*(node, i){
        let str = node.nodeValue;
        if(i === undefined) i = 0;
        let off;
        for(let j1 = i; j1 < str.length; j1 ++){
            if(/\s/.test(str[j1])){
                off = j1;
                break;
            }
            this.state.posR++;
            if(this.state.posR === 1){
                yield 111;
            }
        }
        if(off >= 0){
            return {node, off}
        }
        else{
            let next = this.findNext(node);
            if(next){
                return yield *this.findRightMostSpace(next);
            }
            return {node, off: true}
        }
    }).bind(this);
    findLeftMostSpace = (function*(node, i){
        let str = node.nodeValue;
        if(i === undefined) i = str.length;
        let off;
        for(let j = i - 1; j >= 0; j--){
            this.state.posL++;
            if(/\s/.test(str[j])){
                off = j;
                break;
            }
            if(this.state.posL === 1){
                yield 111;
            }
        }
        if(off >= 0){
            return {node, off}
        }
        else{
            let prev = this.findPrev(node);
            if(prev){
                return yield *this.findLeftMostSpace(prev);
            }
            return {node, off: true}
        }
    }).bind(this)
    _restoreCollapsedRange = () =>{
        let count = 0;
        let {commonAncestorContainer, startOffset} = this.state.range;
        let node = this.getNthChild(commonAncestorContainer, startOffset).firstChild;
        let _restore = (node) =>{
            if(count + node.nodeValue.length >= this.state.posL){
                this.state.range.setStart(node, this.state.posL - count);
                this.state.range.collapse(true);
            }
            else{
                count += node.nodeValue.length;
                _restore(this.findNext(node));
            }
        };
        _restore(node)
    }
    modify = (range, {prop, val}) => {
        this.state.range = range.cloneRange();
        this.state.modifyingStyle = {prop, val};
        if(range.collapsed){
            this.state.collapsed = true;
            this.state.posL = 0;
            this.state.posR = 0;
            let {startContainer: start, startOffset} = range;
            let c = start.nodeName === '#text' ? start.parentNode : start;
            // if(c.style[prop] === val) return range;
            let be = this.getNthChild(start, startOffset -1),
                af = this.getNthChild(start, startOffset),
                t;
            start.nodeName === '#text' ? '' : (be && be.nodeName === '#text' ?
            (range.setStart(be, be.nodeValue.length), range.collapse(true)) : 
            af && af.nodeName === '#text' ? (range.setStart(af, 0), range.collapse(false)) : 
            (t = document.createTextNode(''), range.insertNode(t), range.setStart(t, 0), range.collapse(true)), start = range.startContainer, startOffset = range.startOffset);

            let it1 = this.findLeftMostSpace(start, startOffset),
                it2 = this.findRightMostSpace(start, startOffset),
                x1, x2;
            x1 = it1.next();
            x2 = it2.next();
            // console.log(2, x1, x2, this.state.posL, this.state.posR)
            if(!x1.done && !x2.done){
                x1 = it1.next();
                while(!x1.done){
                x1 = it1.next();
                };
                x2 = it2.next();
                while(!x2.done){
                    x2 = it2.next();
                }
                let {node: n1, off: o1} = x1.value,
                    {node: n2, off: o2} = x2.value;
                    // console.log(n1, o1, n2, o2)
                o1 === true ? this.state.range.setStartBefore(n1): this.state.range.setStart(n1, o1);
                o2 === true ? this.state.range.setEndAfter(n2): this.state.range.setEnd(n2, o2);
                //continue...
            }
            else{
                // let r = new Range();
                // start.parentNode.nodeName === 'SPAN' ? r.selectNode(start.parentNode) : r.selectNode(start);
                // this.state.range = range;
                // let div = this._transfer(r);
                // let common = 
                let span = this.splitNode(range);
                span.style[prop] = val;
                // let br = document.createElement('br');
                // let text = document.createTextNode('');
                range.selectNodeContents(span);
                range.deleteContents();
                // this._reverse(r, div);
                // console.log(1, range)
                return range
            }
            // } 
        }
        else{this.state.collapsed = false}
        let {commonAncestorContainer: common} = this.state.range;
        // if(common.parentNode.nodeName == 'SPAN'){
        //     common = common.parentNode;
        // }
        if(common.nodeName == '#text'){
            common = common.parentNode;
            this.handleTextSpanCommonNode(common, prop, val)
        }
        else if(common.nodeName == 'SPAN'){
            this.handleTextSpanCommonNode(common,prop, val)
        }
        else {
            this.handleGeneralCase();
        }
        if(this.state.range.startContainer != this.root && this.state.range.startOffset === 0){
            this.state.range.setStartBefore(this.state.range.startContainer);
        }
        if(this.state.range.endContainer != this.root && this.state.range.endOffset === this.state.range.endContainer.childNodes.length){
            this.state.range.setEndAfter(this.state.range.endContainer);
        }
        if(this.state.collapsed){
            this._restoreCollapsedRange();
        }
        return this.state.range;
    }
    handleGeneralCase = () =>{
        // let {startContainer: start, endContainer: end, startOffset, endOffset, commonAncestorContainer: common} = this.state.range;
        this._getInitialLeftNode();
        this._getInitialRightNode();
        // let {bigLeft, bigRight} =  this.state;
        // let r = new Range();
        // r.setStartBefore(bigLeft);
        // if(end == common){
        //     bigRight ? r.setEndBefore(bigRight) : r.setEndAfter(common.lastChild);
        // }
        // else {
        //     r.setEndAfter(bigRight)
        // }
        // let div = this._transfer(r);
        this._handleLeftBranch();
        this._handleRightBranch();
        // this._reverse(r, div);
        return this.state.range;
    }
    handleTextSpanCommonNode = (parent, prop, val) =>{
        if(parent.style[prop] == val){
            return this.state.range;
        }
        // let r = new Range();
        // r.selectNode(common);
        // let div = this._transfer(r);
        let span = this.splitNode(this.state.range);
        span.style[prop] = val;
        // let sample = this.createSampleSpan(prop, val);
        // sample.appendChild(this.state.range.extractContents());
        // this.state.range.insertNode(sample);
        // this.state.range.selectNode(sample);
        // div.normalize();
        // this._reverse(r, div);
        this.state.range.selectNode(span);
        return this.state.range;
    }
    handleSpanCommonNode = (span, prop, val) =>{
        if(span.style[prop] == val){
            return this.state.range;
        }
        // let r = new Range();
        // r.selectNode(span);
        // let div = this._transfer(r);
        // let mfrg = this.state.range.extractContents();
        // let mspan = this.createSampleSpan(prop, val);
        // mspan.appendChild(mfrg);
        // this.state.range.setStartBefore(span);
        // let lfrg = this.state.range.extractContents();
        // div.insertBefore(mspan, span);
        // div.insertBefore(lfrg, mspan );
        // let lspan = mspan.previousSibling;
        // [span, lspan].map(cur =>{
        //     if(!cur.children.length && !cur.innerText == ''){
        //         cur.remove();
        //     }
        // })

        this.state.range.selectNode(span);
        // this._reverse(r, div);
        return this.state.range;
    }
    goDownAndNextToModify = (cur, stop) =>{
        let {prop, val} = this.state.modifyingStyle;
        if(!cur || cur === stop) return;
        let par = cur.parentNode,
        prev = cur.previousSibling,
        next = cur.nextSibling;
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
        if(n >= par.childNodes.length) return null;
        let x = 0;
        let node = par.firstChild;
        while(x < n){
            node = node.nextSibling;
            x++;
        };
        return node
    }
    _getInitialLeftNode = () =>{
        let {startContainer: start, commonAncestorContainer: common, startOffset} = this.state.range;
        if(start == common){
            this.state.bigLeft = this.getNthChild(common, startOffset);
            return;
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
        if(!bigRight || !initRight){
            return this.state.range;
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
            !(bigLeft === bigRight && initRight) && this.goDownAndNextToModify(bigLeft, bigRight);
            this.state.range.setStartBefore(bigLeft);
            return;
        } 
        let par = initLeft;
        while(par !== bigLeft.parentNode){
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
            {commonAncestorContainer: common, startOffset: extStartOff, endOffset: extEndOff } = extRange;
        let r = new Range();
        r.selectNodeContents(div);
        extRange.insertNode(r.extractContents())
        this.state.range.setStart(start == div ? common : start, start == div ? extStartOff + startOffset : startOffset);
        this.state.range.setEnd(end == div ? common : end, end == div ? extEndOff + endOffset : endOffset);
    }
    isBelongTag = (nodeName, node) =>{
        if(node.nodeNome == nodeName) return node;
        while(node != this.root && node.nodeName !== nodeName){
            node = node.parentNode;
        }
        return node.parentNode.nodeName == nodeName ? node : false;
    }
    isContain(par, node){
        if(node.parentNode === par) return true;
        let p = node.parentNode;
        while(p !== this.root){
            if(p === par){
                return true;
            }
            p = p.parentNode;
        }
        return false;
    }
    findBreak(range){
        let list = [],
            completed = false;
        let {startContainer: start, endContainer: end, commonAncestorContainer: common} = range;
        let p1, p2;
        if(common.nodeName === '#text'){

        }
        else if(range.collapsed){
            p1 = document.createTextNode('');
            range.insertNode(p1);
            start = p1;
            end = start;
        }
        else{
            if(start.nodeName === '#text') start = start
            else {
                let r1 = range.cloneRange();
                r1.collapse(true);
                p1 = document.createTextNode('');
                r1.insertNode(p1);
                start = p1;
            }
            if(end.nodeName === '#text') end = end
            else {
                let r2 = range.cloneRange();
                r2.collapse(false);
                p2 = document.createTextNode('');
                r2.insertNode(p2);
                end = p2;
            }
        }
        let findLeft = (cur) =>{
            let par = cur.parentNode,
                prev = cur.previousSibling,
                li = this.isBelongTag('LI', cur);
            if(li || cur.nodeName === 'LI'){
                cur = li || cur;
                let x = list.push(cur);
                if(end === start || li && this.isBelongTag('LI', end) === li) completed = true; 
                start = cur.parentNode;
                return x;
            }
            if(cur.nodeName === 'BR' || cur.nodeName === 'UL' || cur.nodeName === 'OL' || 
            !cur.previousSibling && cur.parentNode === this.root && !cur.hasChildNodes()){
                return list.push(cur);
            }
            if(cur.hasChildNodes()){
                return findLeft(cur.lastChild);
            }
            if(prev){
                return findLeft(prev);
            }
            while(par !== this.root){
                if(par.previousSibling){
                    return findLeft(par.previousSibling);
                }
                par = par.parentNode;
            }
            return list.push(par.firstChild);
        }
        let endChecked;
        let findRight = (cur, bool) =>{
            if(completed) return list;
            if(cur === end) endChecked = true;
            let par = cur.parentNode;
            let next = cur.nextSibling;
            if(!bool){
                let li = this.isBelongTag('LI', cur);
                li && (cur = li);
                if(cur.nodeName === 'LI' || cur.nodeName === 'BR' || cur.nodeName === 'UL' || cur.nodeName === 'OL' || 
                    !cur.nextSibling && cur.parentNode === this.root && !cur.hasChildNodes()){
                    list.push(cur);
                    if(endChecked || !endChecked && cur.hasChildNodes() && this.isContain(cur, end)) completed = true;
                    if(!completed){
                        //continue
                    }
                    else{
                        return;
                    }
                }
                else if(cur.hasChildNodes()){
                    return findRight(cur.firstChild);
                }
            }
            if(next){
                return findRight(next);
            }
            else{
                while(par !== this.root){
                    if(par.nextSibling){
                        return findRight(par.nextSibling);
                    }
                    par = par.parentNode;
                }
                list.push(par.lastChild);
                return;
            }
        }
        let sli = this.isBelongTag('LI', start);
        if(sli) start = sli;
        findLeft(start);
        let eli = this.isBelongTag('LI', end);
        if(eli) end = eli;
        findRight(start, true);
        setTimeout(()=>{
            p2 && p2.remove();
            p1 && p1.remove();
        },0)
        console.log(3, list);
        return list
    }
    convertToList = (type, range) =>{
        let list = this.findBreak(range);
        let start;
        let r = new Range();
        list.map((elem, idx) => {
            if(idx === 0){
                let newPar = document.createElement(type);
                let par = elem.parentNode;
                if(elem.nodeName == 'LI'){
                    newPar.style = Object.assign(newPar.style, par.style);
                    if(par.nodeName !== type && elem === par.firstChild){
                        par.parentNode.replaceChild(newPar, par);
                        r.selectNodeContents(par);
                        let ct = r.extractContents();
                        newPar.appendChild(ct);
                    }
                    else if(par.nodeName === type && elem !== par.firstChild || elem !== par.firstChild){
                        r.setStartBefore(elem);
                        r.setEndAfter(par.lastChild);
                        let ct = r.extractContents();
                        r.setStartAfter(par);
                        r.collapse(true);
                        r.insertNode(newPar);
                        newPar.appendChild(ct);
                    }
                }
                else if(elem.nodeName === 'UL' || elem.nodeName === 'OL' ){
                    r.setStartAfter(elem);
                    r.collapse(true);
                    r.insertNode(newPar);

                }
                else if(elem.nodeName === 'BR'){
                    elem.parentNode.replaceChild(newPar, elem);
                }
                else{
                    r.setStartBefore(elem);
                    r.collapse(true);
                    r.insertNode(newPar);
                }
                newPar.parentNode && (par = newPar);
                start = par;
                return;
            }
            r.setStartAfter(start);
            r.setEndBefore(elem);
            if(!r.collapsed){
                let ct = r.extractContents();
                let li = document.createElement('li');
                start.appendChild(li);
                li.appendChild(ct);
            }
            if(elem.nodeName === 'BR') elem.remove()
            else if(elem.nodeName === 'UL' || elem.nodeName === 'OL'){
                if(idx = list.length - 1 && end !== elem.lastChild){
                    r.setStartBefore(elem.firstChild);
                    r.setEndAfter(end);
                }
                else{
                    elem.remove();
                    r.selectNodeContents(elem);
                }
                let ct = r.extractContents();
                start.appendChild(ct);
            }
            else{
                let li = start.firstChild.cloneNode(false) || document.createElement('li');
                start.appendChild(li);
                elem.remove();
                start.lastChild.appendChild(elem);
            }

        });

    }
}
export default EditorNodeTraveler;