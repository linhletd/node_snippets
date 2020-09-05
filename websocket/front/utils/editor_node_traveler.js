/*
target: to optimize dom tree:
    each span node has only textnode & <br> inside;
    no textnode right after textnode;
    no span right after a span that it 'isEqualTo';
*/
class EditorNodeTraveler{
    constructor(root, updateState, observer){
        this.root = root;
        this.updateStore = updateState;
        this.observer = observer;
        this.state = {
            range: null,
            modifyingStyle: null,
            posL: 0,
            posR: 0,
            bigLeft: null,
            bigRight: null,
            originRange: null

        }
    }
    createSampleSpan(prop, val){
        let span = document.createElement('span');
        span.style[prop] = val;
        return span;
    }
    isSpanEmpty = (span) =>{
        if(!span) return true;
        if(span.nodeName === '#text'){
            if(span.nodeValue === '') return true;
            return false;
        }
        return !span.hasChildNodes() || span.childNodes.length === 1 && (span.firstChild.nodeName === span.nodeName || this.isSpanEmpty(span.firstChild));
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
    modify = (range, {prop, val}) => {
        this.state.range = range.cloneRange();
        // this.state.range = this.reassignRange(range.cloneRange());

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
            t && (this.state.t = t);
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
                    console.log(n1, o1, n2, o2)
                o1 === true ? this.state.range.setStartBefore(n1): this.state.range.setStart(n1, o1);
                o2 === true ? this.state.range.setEndAfter(n2): this.state.range.setEnd(n2, o2);
                console.log(this.state.range);
                //continue...
            }
            else{
                let span = this.splitNode(range);
                span.style[prop] = val;
                range.selectNodeContents(span);
                range.deleteContents();
                return range
            }
        }
        else{this.state.collapsed = false}
        this.modifyStyleX(this.state.range, {prop, val})
        // let {commonAncestorContainer: common} = this.state.range;
        // let x;
        // if(common.nodeName === 'SPAN' || (x = common.nodeName === '#text')){
        //     if(x && x.parentNode.style[prop] === val || !x && common.style[prop] === val){
        //         return this.state.range;
        //     }
        //     console.log('split', x, common)
        //     x && (x = this.isBelongTag('SPAN', common)) && (common = x)
        //     common = this.splitNodeX(common, this.state.range, true);
        //     console.log(common)
        //     if(common.nodeName === '#text'){
        //         let span = document.createElement('span');
        //         common.parentNode.replaceChild(span, common);
        //         span.appendChild(common);
        //         common = span;
        //     }
        //     common.style[prop] = val;
        //     this.state.range.selectNodeContents(common);
        // }
        // else {
        //     this.state.common = common;
        //     this.handleGeneralCase();
        // }
        // if(this.state.range.startContainer != this.root && this.state.range.startOffset === 0){
        //     this.state.range.setStartBefore(this.state.range.startContainer);
        // }
        // if(this.state.range.endContainer != this.root && this.state.range.endOffset === this.state.range.endContainer.childNodes.length){
        //     this.state.range.setEndAfter(this.state.range.endContainer);
        // }
        if(this.state.collapsed){
            // let _restoreCollapsedRange;
            // (_restoreCollapsedRange = () =>{
            //     let count = 0;
            //     let {commonAncestorContainer, startOffset} = this.state.range;
            //     console.log(this.state.range)
            //     parent = this.getNthChild(commonAncestorContainer, startOffset);
            //     let _restore = (node) =>{
            //         if(!node) return;
            //         if(node.nodeValue && count + node.nodeValue.length >= this.state.posL){
            //             this.state.range.setStart(node, this.state.posL - count);
            //             this.state.range.collapse(true);
            //         }
            //         else{
            //             count += node.nodeValue.length;
            //             _restore(this.findNext(node));
            //         }
            //     };
            //     _restore(node)
            // })()
            let {commonAncestorContainer, startOffset} = this.state.range;
            let _restoreCollapsedRange, node = this.getNthChild(commonAncestorContainer, startOffset), count = 0;
            (_restoreCollapsedRange = (cur) =>{
                if(cur.nodeName === '#text'){
                    if(cur.nodeValue && count + cur.nodeValue.length >= this.state.posL){
                        this.state.range.setStart(cur, this.state.posL - count);
                        this.state.range.collapse(true);
                        return;
                    }
                    else{
                        count += cur.nodeValue.length;
                    }
                }
                else if(cur.hasChildNodes()){
                    _restoreCollapsedRange(cur.firstChild);
                }
                else if(cur.nextSibling){
                    _restoreCollapsedRange(cur.nextSibling)
                }
                else{
                    let par = cur.parentNode;
                    while(count < this.state.posL){
                        if(par.nextSibling){
                            _restoreCollapsedRange(par.nextSibling);
                            break;
                        }
                        else{
                            par = par.parentNode;
                        }
                    }
                }
            })(node)
        }
        if(this.state.t){
            this.state.t.remove();
            this.state.t = null;
        }
        // if(prop === 'color'){
        //     console.log('coloer')
        //     let li;
        //     if((li = this.isBelongTag('LI', common))){
        //         this._replayStyle(li);
        //     }
        //     else {
        //         if((li = this.isBelongTag('LI', this.state.range.startContainer))){
        //             this._replayStyle(li);
        //         }
        //         if((li = this.isBelongTag('LI', this.state.range.endContainer))){
        //             this._replayStyle(li);
        //         }
        //     }
        // }
        return this.state.range;
    }
    reassignRange(range, constraint){
        if(constraint === true) constraint = this.root;
        let {startContainer: start, endContainer: end, commonAncestorContainer: common, startOffset, endOffset} = range;
        if(startOffset === 0 && (start !== common || constraint && start !== constraint)){
            let cur = start;
            while(cur.parentNode !== this.root && (cur.parentNode !== common || cur !== constraint)){
                let par = cur.parentNode;
                if(cur === par.firstChild){
                    range.setStartBefore(cur);
                    cur = par;
                }
                else{
                    break;
                }
            }
        }
        let br;
        if((end !== common || constraint && end !== constraint) && (end.hasChildNodes && endOffset === end.childNodes.length || end.nodeValue && endOffset === end.nodeValue.length || (br = this.getNthChild(end, endOffset)) && br.nodeName === 'BR' && br === end.lastChild)){
            let cur = end;
            while(cur.parentNode !== this.root && (cur.parentNode !== common || cur !== constraint)){
                let par = cur.parentNode;
                if(cur === par.lastChild){
                    range.setEndAfter(cur);
                    cur = par;
                }
                else{
                    break;
                }
            }
        }
        return range
    }
    checkRange = (range) =>{
        let font = {
            'Georgia': 'Georgia,serif',
            'Palatino Linotype':'"Palatino Linotype","Book Antiqua",Palatino,serif',
            'Times New Roman':'"Times New Roman",Times,serif',
            'Arial': 'Arial,Helvetica,sans-serif',
            'Arial Black': '"Arial Black",Gadget,sans-serif',
            'Comic Sans MS': '"Comic Sans MS",cursive,sans-serif',
            'Impact': 'Impact,Charcoal,sans-serif',
            'Lucida Sans Unicode': '"Lucida Sans Unicode","Lucida Grande",sans-serif',
            'Tahoma': 'Tahoma,Geneva,sans-serif',
            'Trebuchet MS': '"Trebuchet MS",Helvetica,sans-serif',
            'Verdana': 'Verdana,Geneva,sans-serif',
            'Courier New': '"Courier New",Courier,monospace',
            'Lucida Console': '"Lucida Console",Monaco,monospace'
        }
        let size = ['8px', '9px', '10px', '11px', '12px', '14px', '16px', '18px', '20px', '24px', 
        '28px', '32px', '38px', '46px', '54px', '62px', '72px'];

        let state = {
            bold: 1, 
            italic: 1,
            underline: 1,
            order: 1,
            unorder: 1,
            inclevel: 0,
            declevel: 0,
            link: 1,
            quote: 0,
            code: 0,
            fontsize: '16px',
            fontfamily: 'Arial,Helvetica,sans-serif'
        
        };
        let {startContainer: start, endContainer: end, commonAncestorContainer: common, startOffset, endOffset, collapsed} = range;
        if(this.isBelongTag('A', common)){
            state.link = 2;
        }
        else{
            state.link = 1;
        }
        if(this.isBelongTag('OL', common) || this.isBelongTag('UL', common)){
            state.inclevel = 1;
            state.declevel = 1;
        }
        else{
            state.inclevel = 0;
            state.declevel = 0;
        };
        // let checkNearestStyle = (cur, prop) =>{
        //     if(cur.nodeName !== '#text' && cur.style[prop] === undefined){
        //         return false;
        //     }
        //     else if(cur.nodeName === '#text'){
        //         cur = cur.parentNode;
        //     }
        //     while(!cur.style[prop]){
        //         cur = cur.parentNode;
        //     }
        //     return cur.style[prop];
        // }
        let checkList, checkBIU, checkQuote, checkCode, test;
        (checkBIU = ()=>{
            if(common.nodeName === 'SPAN' || collapsed || common.nodeName === '#text'){
                if(common.nodeName === '#text') common = common.parentNode;
                console.log(common, 3)
                common.style.fontWeight === 'bold' ? state.bold = 2 : state.bold = 1;
                common.style.fontStyle === 'italic' ? state.italic = 2 : state.italic = 1;
                common.style.textDecoration === 'underline' ? state.underline = 2 : state.underline = 1;
                let fnt;
                if(common.style.fontSize === ''){
                    //do nothing
                }
                else if(size.indexOf(common.style.fontSize) === -1){
                    state.fontsize = 'false';
                }
                else{
                    state.fontsize = common.style.fontSize;
                }
                if(common.style.fontFamily === ''){
                    //do nothing
                }
                else if(!(fnt = font[common.style.fontFamily.match(/^\"?(.*?)\"?\,/)[1]])){
                    state.fontfamily = 'false';
                }
                else{
                    state.fontfamily = fnt;
                }
            }
            else{
                let _check, head, tail;
                let neededCheck = {
                    bold: 'fontWeight',
                    italic: 'fontStyle',
                    underline: 'textDecoration',
                    fontsize: 'fontSize',
                    fontfamily: 'fontFamily'
                }
                let temp = {
                    fontsize: undefined,
                    fontfamily: undefined
                }
                if(start.nodeName === '#text'){
                    head = start;
                }
                else{
                    head = this.getNthChild(start, startOffset)
                }
                if(end.nodeName === '#text'){
                    tail = end;
                }
                else{
                    tail = this.getNthChild(end, endOffset - 1);
                }
                this._getInitialLeftNode(range);
                this._getInitialRightNode(range);
                let _verify = (cur)=>{
                    let keys = Object.keys(neededCheck);
                    if(!keys.length || cur.hasChildNodes() && cur.nodeName !== 'SPAN') return;
                    !test && (test = true);
                    keys.map((val) =>{
                        let prop = neededCheck[val];
                        let actual = cur.nodeName === '#text' ? cur.parentNode.style[prop] : cur.style[prop];
                        if(val === 'fontsize'){
                            actual === '' && (actual = state.fontsize);
                            !temp.fontsize && (temp.fontsize = actual);
                            if(size.indexOf(actual) === -1 || actual !== temp.fontsize){
                                state.fontsize = 'false';
                                delete neededCheck.fontsize
                            }
                        }
                        else if(val === 'fontfamily'){
                            actual === '' && (actual = state.fontfamily);
                            !temp.fontfamily && (temp.fontfamily = actual.match(/^\"?(.*?)\"?\,/)[1]);
                            if(!font[temp.fontfamily] ||actual.match(/^\"?(.*?)\"?\,/)[1] !== temp.fontfamily){
                                state.fontfamily = 'false';
                                delete neededCheck.fontfamily
                            }
                        }
                        else if(actual !== val){
                            state[val] = 1;
                            delete neededCheck[val];
                        }
                    })
                };
                (_check = (cur, side) =>{
                    if(!cur || side === 'nextSibling' && cur === this.state.bigRight || side === 'previousSibling' && this.state.bigRight && (cur === this.state.bigRight.previousSibling)){
                        return;
                    }
                    if(['IMG', 'HR', 'BR', 'PRE'].indexOf(cur.nodeName) > -1){
                        //do nothing
                    }
                    else{
                        _verify(cur);
                        if(!Object.keys(neededCheck).length){
                            return;
                        }
                    }
                    if(cur.hasChildNodes() && cur.nodeName !== 'SPAN'){
                        return _check(cur.firstChild, side);
                    }
                    else if(cur[side]){
                        return _check(cur[side], side);
                    }
                    else{
                        let par = cur.parentNode;
                        while(par !== common){
                            if(par[side]){
                                return _check(par[side], side);
                            }
                            par = par.parentNode;
                        }
                        // endChecked = true;
                    }
                })(head, 'nextSibling');
                if(Object.keys(neededCheck).length && (this.state.initRight)){
                    _check(tail, 'previousSibling')
                }
                Object.keys(neededCheck).map(key => {
                    if(test){
                        state[key] = 2;
                    }
                    key === 'fontfamily' && (state.fontfamily = font[temp.fontfamily]);
                    key === 'fontsize' && (state.fontsize = temp.fontsize);
                })
            }
        })();
        (checkList = ()=>{
            if(common.nodeName === 'UL'){
                state.unorder = 2;
                return;
            }
            else if(common.nodeName === 'OL'){
                state.order = 2;
                return;
            }
            let li, li1, li2;
            if(li = this.isBelongTag('LI', common)){
                li.parentNode.nodeName === 'UL' ? state.unorder = 2 : state.order = 2;
                return;
            }
            else if(!(li1 = this.isBelongTag('LI', start)) || !(li2 = this.isBelongTag('LI', end)) || li1 && li2 && li1.parentNode.nodeName !== li2.parentNode.nodeName){
                state.order = 1;
                state.unorder = 1;
                return;
            }
            else{
                let tempType = li1.parentNode.nodeName;
                let _checkLeft, _checkRight;
                (_checkLeft = (cur) =>{
                    if(cur === this.state.bigRight){
                        return;
                    }
                    else if(cur.nodeName !== 'LI' && cur.nodeName !== tempType){
                        state.order = 1;
                        state.unorder = 1;
                        tempType = undefined;
                        return;
                    }
                    else if(cur.nextSibling){
                        _checkLeft(cur.nextSibling);
                    }
                    else{
                        while(!cur.parentNode.nextSibling){
                            if(cur.parentNode === this.root) return;
                            cur = cur.parentNode;
                        }
                        _checkLeft(cur.parentNode.nextSibling);
                    }
                })(li1);
                (_checkRight = (cur) =>{
                    if(!tempType || cur === this.state.bigRight.previousSibling){
                        return;
                    }
                    else if(cur.nodeName !== 'LI' && cur.nodeName !== tempType){
                        state.order = 1;
                        state.unorder = 1;
                        tempType = undefined;
                        return;
                    }
                    else if(cur.previousSibling){
                        _checkLeft(cur.previousSibling);
                    }
                    else{
                        while(!cur.parentNode.previousSibling){
                            cur = cur.parentNode;
                        }
                        _checkLeft(cur.parentNode.previousSibling);
                    }
                })(li2);
                if(tempType){
                    tempType === 'UL' ? state.unorder = 2 : state.order = 2;
                }
            }
        })();
        (checkCode = checkQuote = (type, stateName) =>{
            let a;
            this.state[stateName] = [];
            if((a = this.isBelongTag(type, common))){
                state[stateName] = 2;
                this.state[stateName].push(a)
                return;
            }
            a = this.isBelongTag(type, start);
            if(!a){
                state[stateName] = 1;
                return;
            }
            let b = this.isBelongTag(type, end);
            if(!b){
                state[stateName] = 1;
                return;
            }
            let stop = b.nextSibling;
            let cur = a;

            state[stateName] = 2;
            while(cur && cur !== stop){
                if(cur.nodeName !== type){
                    state[stateName] = 1;
                    return;
                }
                else{this.state[stateName].push(cur)}
                cur = cur.nextSibling;
            }
        })('BLOCKQUOTE', 'quote');
        checkCode('PRE', 'code');
        this.updateStore({
            type: 'TOOLBARCHANGE',
            data: state
        });
    }
    OULWrapper(li, limit){
        let par = li.parentNode;
        if(this.isBelongTag('LI', limit)){
            return par;
        }
        let check = par.nodeName;
        let _find;
        return (_find = (cur) =>{
            if(cur.nodeName !== check){
                return false;
            }
            else if(cur.parentNode.nodeName !== 'UL' && cur.parentNode.nodeName !== 'OL' || cur === common){
                return cur;
            }
            return _find(cur.parentNode);
        })(par)
    }
    handleGeneralCase = () =>{
        // let {startContainer: start, endContainer: end, startOffset, endOffset, commonAncestorContainer: common} = this.state.range;
        this._getInitialLeftNode();
        this._getInitialRightNode();
        console.log(this.state)
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
        //alternative: broad search first
        let {prop, val} = this.state.modifyingStyle;
        if(!cur || cur === stop) return;
        let par = cur.parentNode,
        prev = cur.previousSibling,
        next = cur.nextSibling;
        if(['IMG', 'HR', 'BR', 'PRE'].indexOf(cur.nodeName) > -1) return this.goDownAndNextToModify(next, stop);
        if(cur.nodeName !== '#text' && cur.nodeName !== 'SPAN'){
            prop === 'color' && cur.nodeName === 'LI' && (cur.style[prop] = val);
            this.goDownAndNextToModify(cur.firstChild, stop);
            this.goDownAndNextToModify(next, stop);
            return;
        }
        if(cur.nodeName == '#text'){
            // if(par.style[prop] == val){
            //     if(prev && prev.nodeName == '#text'){
            //         prev.nodeValue += cur.nodeValue;
            //         cur.remove();
            //         cur = prev;
            //     }
            //     else{
            //         //keep there!
            //     }
            // }
            // else if(prev && prev.nodeName == 'SPAN' && this.createSampleSpan(prop, val).isEqualNode(prev.cloneNode(false))){
            //     prev.appendChild(cur);
            //     prev.normalize();
            //     cur.remove();
            //     cur = prev;
            // }
            // else{
                let span = this.createSampleSpan(prop, val);
                par.replaceChild(span, cur);
                span.appendChild(cur);
                cur = span;
            // }
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
        cur && this.goDownAndNextToModify(cur.nextSibling, stop);
    }
    getNthChild(par, n){
        if(n >= par.childNodes.length || n < 0) return null;
        let x = 0;
        let node = par.firstChild;
        while(x < n){
            node = node.nextSibling;
            x++;
        };
        return node
    }
    _getInitialLeftNode = (range) =>{
        let {startContainer: start, commonAncestorContainer: common, startOffset} = range || this.state.range;
        if(start == common){
            this.state.bigLeft = this.getNthChild(common, startOffset);
            this.state.initLeft = null;
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
    _getInitialRightNode = (range) =>{
        let {endContainer: end, commonAncestorContainer: common, endOffset} = range || this.state.range;
        if(end == common){
            this.state.bigRight = this.getNthChild(common, endOffset);
            this.state.initRight = null;
            return;
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
            bigRight ? this.state.range.setEndBefore(bigRight) : this.state.range.setEndAfter(this.state.common.lastChild);
            this.state.common = null;
            return;
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
        this.reassignRange(r);
        let div = parNode.cloneNode(false);
        div.appendChild(r.extractContents());
        this.goDownAndNextToModify(div.firstChild);
        let r1 = new Range();
        r1.selectNodeContents(div);
        let ct = r1.extractContents();
        let end = ct.lastChild;
        end && r.insertNode(ct);
        this.state.range.setEndAfter(end);
        if(end.nextSibling && this.isSpanEmpty(end.nextSibling)){
            end.nextSibling.remove();
        }
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
        if(initLeft.hasChildNodes() && initLeft.nodeName !== 'SPAN'){
            parNode = initLeft;
            r.setEndAfter(parNode.lastChild);
        }
        else{
            parNode = initLeft.parentNode;
            r.setEndAfter(initLeft);
        }
        this.reassignRange(r);
        let div = parNode.cloneNode(false);
        div.appendChild(r.extractContents());
        this.goDownAndNextToModify(div.firstChild);
        let r1 = new Range();
        r1.selectNodeContents(div);
        let ct = r1.extractContents();
        let start = ct.firstChild;
        start && r.insertNode(ct);
        this.state.range.setStartBefore(start);
        if(start.previousSibling && this.isSpanEmpty(start.previousSibling)){
            start.previousSibling.remove();
        }
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
        if(!node) throw new Error('invalid second arg');
        if(node.nodeName === nodeName) return node;
        try{
            while(node !== this.root && node.nodeName !== '#document-fragment' && node.nodeName !== nodeName){
            node = node.parentNode;
            } 
        }
        catch(e){
            console.log(e);
            return false;
        }
        return node.nodeName == nodeName ? node : false;
    }
    isContain(par, node){
        if(node.parentNode === par) return true;
        let p = node.parentNode;
        while(p !== this.root){
            if(p === par){
                return par;
            }
            p = p.parentNode;
        }
        return false;
    }
    isTempSpan(node){
        if(node.nodeName === 'SPAN' && node.lastChild && node.lastChild.nodeName === 'BR' 
        || node.nodeName === 'PRE'
        || node.nodeName === 'P'){
            return node;
        }
        return false;
    }
    insertAfter(newNode, cur){
        let next, par = cur.parentNode;
        if((next = cur.nextSibling)){
            par.insertBefore(newNode, next);
            return;
        }
        par.appendChild(newNode);
    }
    hasOnlyOneBr(node){
        return node.childNodes.length === 1 && node.firstChild.nodeName === 'BR';
    }
    isBlockElem(node){
        if(!node || ['UL', 'OL', 'P', 'BLOCKQUOTE', 'PRE', 'IMG'].indexOf(node.nodeName) > -1){
            return node;
        };
        return false;
    }
    handleUnacessedSpan(span, bool){
        if(!span) return span;
        if((span.nodeName === 'SPAN' || span.nodeName === 'P') && (!span.hasChildNodes() || span.childNodes.length === 1 && span.firstChild.nodeName === '#text' && span.firstChild.nodeValue === '')){
            let r1 = new Range();
            r1.selectNodeContents(span);
            r1.deleteContents();
            span.appendChild(document.createElement('br'));
            return span;
        }
        if(bool && span.nodeName === '#text' && span.nodeValue === ''){
            span.remove()
            return undefined;
        }
        return span;
    }
    unwrapBlockquote = (quote) =>{
        if(!quote.hasChildNodes() || this.hasOnlyOneBr(quote)){
            let p = document.createElement('p');
            p.appendChild(document.createElement('br'));
            quote.parentNode.replaceChild(p, quote);
            return
        }
        else if(!this.isBlockElem(quote.firstChild) && !this.isBlockElem(quote.previousSibling)){
            quote.insertBefore(document.createElement('br'), quote.firstChild);
        }
        else if(!this.isBlockElem(quote.lastChild) && !this.isBlockElem(quote.nextSibling)){
            quote.appendChild(document.createElement('br'));
        }
        let r1 = new Range();
        r1.selectNodeContents(quote);
        let ct = r1.extractContents();
        let {firstChild: first, lastChild: last} = ct;
        r1.selectNode(quote);
        quote.remove();
        r1.insertNode(ct);
        return {first, last}
    }
    findBreak = (range, check)=>{
        if(check){
            this.observer.stopObserving();
        }
        let list = [],
            completed = false;
        let {startContainer: start, endContainer: end, commonAncestorContainer: common, collapsed} = range;
        let p1, p2, pre, block, block1, block2, epre;
        if((pre = this.isBelongTag('PRE', common) || this.isBelongTag('P', common))){
            list.push(pre);
            return {list};
        }
        else if((block = this.isBelongTag('BLOCKQUOTE', common))){
            if(!block.hasChildNodes() || !this.isBlockElem(block.firstChild)){
                this.state.br1 = document.createElement('br');
                block.firstChild ?  block.insertBefore(this.state.br1, block.firstChild) : block.appendChild(this.state.br1);
            }
            if(!this.isBlockElem(block.lastChild) || this.hasOnlyOneBr(block)){
                this.state.br2 = document.createElement('br');
                block.appendChild(this.state.br2);
            }
        }
        let b, c, d, e;
        if(!block && (block1 = this.isBelongTag('BLOCKQUOTE', start) && (b = !block1.hasChildNodes() || (c = this.hasOnlyOneBr(block1))))||
        (pre = (this.isBelongTag('PRE', start) || this.isBelongTag('P', start) || this.isBelongTag('SPAN', start)))){
            if(b || c){
                let span = document.createElement('span');
                b ? span.appendChild(document.createElement('br')): '';
                block1.parentNode.replaceChild(p, block1);
                pre = span;
                block1 = null;
            }
            start = pre;
        }
        else if(start.nodeName === '#text'){start = start}
        else {
            let r1 = range.cloneRange();
            r1.collapse(true);
            p1 = document.createTextNode('');
            r1.insertNode(p1);
            start = p1;
        }
        if(!block && (block2 = this.isBelongTag('BLOCKQUOTE', end) && (d = !block2.hasChildNodes() || (e = this.hasOnlyOneBr(block2))))||
        (epre = (this.isBelongTag('PRE', end) || this.isBelongTag('P', end) || this.isBelongTag('SPAN', end)))){
            if(d || e){
                let span = document.createElement('span');
                d ? span.appendChild(document.createElement('br')): '';
                block2.parentNode.replaceChild(p, block2);
                epre = span;
                block2 = null;
            }
            end = epre;
        }
        else{
            if(end.nodeName === '#text'){
                end = end;
            }
            else{
                if(!collapsed){
                    let r2 = range.cloneRange();
                    r2.collapse(false);
                    p2 = document.createTextNode('');
                    r2.insertNode(p2);
                    end = p2;
                }
                else{
                    end = start;
                } 
            }
        }
        if(!block){
            if(block1){
                let li;
                if((li = this.isBelongTag('LI', start))){
                    let r = new Range();
                    r.setStartBefore(li);
                    r.setEndAfter(block1)
                    this.reassignRange(r);
                    let ct = r.extractContents();
                    let node = ct.firstChild;
                    r.insertNode(node);
                    this.unwrapBlockquote(node);
                    block1 = null;
                }
                else if(!this.isBlockElem(block1.firstChild) && block1.firstChild.nodeName !== 'BR'){
                    this.state.br1 = document.createElement('br');
                    block1.insertBefore(this.state.br1, block1.firstChild);
                }
            };
            if(block2){
                let li;
                if((li = this.isBelongTag('LI', end))){
                    let r = new Range();
                    r.setStartBefore(block2);
                    r.setEndAfter(li)
                    this.reassignRange(r);
                    let ct = r.extractContents();
                    let node = ct.firstChild;
                    r.insertNode(node);
                    this.unwrapBlockquote(node);
                    block2 = null;
                }
                else if(!this.isBlockElem(block2.lastChild) && block2.lastChild.nodeName !== 'BR'){
                    this.state.br2 = document.createElement('br');
                    block2.appendChild(this.state.br2);
                }
            };
        }

        let findLeft = (cur) =>{
            let par = cur.parentNode,
                prev = cur.previousSibling,
                li = this.isBelongTag('LI', cur);
            if(li){
                cur = li;
                list.push(cur);
                if(this.isBelongTag('LI', common)) completed = true; 
                start = cur.parentNode;
                return;
            }
            if(this.isBlockElem(cur) || cur.nodeName === 'BR' ||
            !cur.previousSibling && cur.parentNode === this.root && !cur.hasChildNodes()){
                list.push(cur);
                return;
            }
            if(cur.hasChildNodes() && cur.nodeName !== 'SPAN'){
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
            if(cur.nodeName === 'BLOCKQUOTE'){
                cur = this.unwrapBlockquote(cur).first;
            }
            let par = cur.parentNode;
            let next = cur.nextSibling;
            if(!bool){
                let li = this.isBelongTag('LI', cur);
                li && (cur = li);
                if(cur.nodeName !== 'BLOCKQUOTE' && (this.isBlockElem(cur) || cur.nodeName === 'BR') ||
                    !cur.nextSibling && cur.parentNode === this.root && !cur.hasChildNodes()){
                    let endx;
                    list.push(cur);
                    if(endChecked || !endChecked && cur.hasChildNodes() && ((endx = this.isContain(cur, end) && (end = endx)))){
                        completed = true;
                    }
                    if(!completed){
                        //continue
                    }
                    else{
                        return;
                    }
                }
                else if(cur.hasChildNodes() && cur.nodeName !== 'SPAN'){
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
        if(block1){
            let r = new Range();
            let first0 = list[0];
            first0.remove();
            this.state.br1 = null;
            if(first0 === this.state.br1){
                first0.remove();
                let {first} = this.unwrapBlockquote(block1);
                list[0] = first;
            }
            else{
                r.setStartBefore(first0);
                r.setEndAfter(block1);
                this.reassignRange(r);
                let ct = r.extractContents();
                let node = ct.firstChild;
                r.insertNode(node);
                this.unwrapBlockquote(node);
            }
        }
        if(block2){
            findRight(end);
            endChecked = false;
            let r = new Range();
            let last0 = list[1];
            last0.remove();
            this.state.br2 = null;
            if(last0 === this.state.br2){
                this.unwrapBlockquote(block2);
                list.pop();
            }
            else{
                r.setStartBefore(block1);
                r.setEndAfter(last0);
                this.reassignRange(r);
                let ct = r.extractContents();
                let node = ct.firstChild;
                r.insertNode(node);
                this.unwrapBlockquote(node);
            }
        }
        let eli = this.isBelongTag('LI', end);
        if(eli) end = eli;
        findRight(start, true);
        // console.log('p1, p2', p1, p2)
        setTimeout(()=>{
            if(check){
                this.observer.startObserving()
            }
        },0)
        if(this.isBlockElem(list[0]) && start !== list[0]){
            let br = document.createElement('br');
            this.insertAfter(br, list[0]);
            list[0] = br;
        }
        if(this.isBlockElem(list[list.length - 1]) && end !== list[list.length - 1]){
            let br = document.createElement('br');
            let x = list[list.length - 1];
            x.parentNode.insertBefore(br, x);
            list[list.length - 1] = br;
        }
        console.log(list, start, p1, p2)
        return {list, end, p1, p2}
    }
    _replayStyle(li){
        if(!li.hasChildNodes()){
            return;
        }
        let color;
        let childNodes = [...li.childNodes];
        for(let i = 0; i < childNodes.length; i++){
            if(!childNodes[i].style){
                return;
            }
            else if(color === undefined && childNodes[i].style.color){
                color = childNodes[i].style.color;
            }
            else if(childNodes[i].style.color !== color){
                return;
            }
        }
        li.style.color = color;
    }
    convertToList = (type, range) =>{
        let {startContainer, endContainer, startOffset, endOffset, collapsed, commonAncestorContainer: common} = range;
        let newPar = document.createElement(type);
        if(collapsed && (common === this.root || common.nodeName === 'BLOCKQUOTE')){
            range.insertNode(newPar);
            newPar.appendChild(document.createElement('li'));
            if(newPar.nextSibling && newPar.nextSibling.nodeName === 'BR'){
                newPar.nextSibling.remove();
            };
            range.setStart(newPar.firstChild, 0);
            range.collapse(true);
            return range;
        }
        let {list, end, p1, p2} = this.findBreak(range);
        console.log(list)
        let start;
        let r = new Range();
        if(list.length === 2 && list.filter((cur) =>(!this.isBlockElem(cur) && cur.nodeName !== 'LI' && cur.nodeName !== 'BR')).length === 2){
            r.setStartBefore(list[0]);
            r.setEndAfter(list[1]);
            let ct = r.extractContents();
            let li = document.createElement('li');
            r.insertNode(newPar);
            newPar.appendChild(li);
            li.appendChild(ct);
            this.handleUnacessedSpan(li.firstChild)
            this._replayStyle(li);
            start = newPar;
        }
        else {
            list.map((elem, idx) => {
                if(idx === 0){
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
                        if(elem.nodeName === 'P'){
                            elem.remove();
                            r.selectNodeContents(elem);
                            elem = r.extractContents();
                        }
                        let li = document.createElement('li');
                        newPar.appendChild(li);
                        li.appendChild(elem);
                        this.handleUnacessedSpan(li.firstChild)
                        this._replayStyle(li);
                    }
                    newPar.parentNode && (par = newPar);
                    start = par;
                    return;
                }
                r.setStartAfter(start);
                r.setEndBefore(elem);
                let test1;
                if(!r.collapsed || (test1 = (r.collapsed && elem.nodeName === 'BR' && list[idx -1] && list[idx -1].nodeName === 'BR'))){
                    let ct = r.extractContents();
                    let li = document.createElement('li');
                    start.appendChild(li);
                    !test1 ? li.appendChild(ct) : li.appendChild(document.createElement('br'));
                    this._replayStyle(li);
                }
                if(elem.nodeName === 'BR'){
                    if(this.isBlockElem(list[idx -1])){
                        let li = document.createElement('li');
                        start.appendChild(li);
                    }
                    elem.remove() 
                } 
                else if(elem.nodeName === 'UL' || elem.nodeName === 'OL'){
                    if(idx === list.length - 1 && end !== elem.lastChild){
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
                    r.setStartBefore(elem);
                    r.collapse(true);
                    r.insertNode(newPar);
                    if(elem.nodeName === 'P'){
                        elem.remove();
                        r.selectNodeContents(elem);
                        elem = r.extractContents();
                    }
                    let li = document.createElement('li');
                    start.appendChild(li);
                    li.appendChild(elem);
                    this.handleUnacessedSpan(li.firstChild)
                    this._replayStyle(li);
                }
    
            });
            let n1 = start.previousSibling, n2 = start.nextSibling;
            if(n1 && list[0].nodeName === 'BR' && n1.previousSibling){
                n1.remove();
            }
            if(n2 && list[list.length -1].nodeName === 'BR' && n2.nextSibling){
                n2.remove();
            }
        }
        let fst = start.firstChild, lst = start.lastChild;
        this.reunion(start, true);
        console.log(startContainer, startOffset, endContainer, endOffset)
        if(p1){
            range.setStartBefore(p1);
            let li = this.isBelongTag('LI', p1);
            if(li && li.childNodes.length === 1){
                li.appendChild(document.createElement('br'));
                p1.remove();
            }
            collapsed ? range.collapse(true) : '';
        }
        else{
            if(startContainer.nodeName === 'SPAN' || startContainer.nodeName === '#text'){
                range.setStart(startContainer, startOffset);
                collapsed ? range.collapse(true) : '';                
            }
            else{
                range.setStartBefore(fst);
            }
        }
        if(p2){
            range.setEndBefore(p2);
            let li = this.isBelongTag('LI', p2);
            if(li && li.childNodes.length === 1){
                p2.remove();
            }
        }
        else if(!collapsed){
            if(endContainer.nodeName === 'SPAN' || endContainer.nodeName === '#text'){
                range.setEnd(endContainer, endOffset);
            }
            else{
                lst === fst ? (range.setEndAfter(lst), range.collapse(false)) : range.setEndAfter(lst);
            }
        }
        if(this.state.br1){
            this.state.br1.remove();
            this.state.br1 = null;
        }
        if(this.state.br2){
            this.state.br2.remove();
            this.state.br2 = null;
        }
        return range
    }
    isRemainLi(OUL){
        let _findLi, queue = [OUL];
        return (_findLi = () =>{
            if(queue.length === 0){
                return false;
            }
            let node = queue.shift();
            if(node.nodeName === 'LI'){
                return true;
            }
            if(node.hasChildNodes && node.hasChildNodes()){
                queue = [queue, ...node.childNodes];
            } 
            return _findLi();
        })()
    }
    hasRealText(node){
        let _findText, queue = [node];
        return (_findText = () =>{
            if(queue.length === 0){
                return false;
            }
            let node = queue.shift();
            if(node.nodeName === '#text' && node.nodeValue.length > 0){
                return true;
            }
            if(node.hasChildNodes && node.hasChildNodes()){
                queue = [queue, ...node.childNodes];
            } 
            return _findText();
        })()
    }
    reunion = (node, bool) =>{
        if(!node || node.nodeName !== 'UL' && node.nodeName !== 'OL'){
            return;
        }
        let prev = node.previousSibling, next = node.nextSibling;
        if(prev && prev.nodeName === node.nodeName){
            let r = new Range();
            r.selectNodeContents(node);
            let ct = r.extractContents();
            node.remove();
            prev.appendChild(ct);
        }
        if(bool && next){
            return this.reunion(next);
        }
    }
    increaseListLevel = (range, type) =>{
        let li1 = this.isBelongTag('LI', range.startContainer);
        let li2 = this.isBelongTag('LI', range.endContainer);
        let r = new Range();
        li1 && r.setStartBefore(li1);
        li2 && r.setEndAfter(li2);
        // r = this.reassignRange(r);
        let ct = r.extractContents();
        let elem = document.createElement(type);
        r.insertNode(elem);
        // this.resideRange(elem, r);
        r.collapse(true);
        elem.appendChild(ct);
        this.reunion(elem, true);
        return r;
    }
    decreaseListLevel =(range) =>{
        let li1 = this.isBelongTag('LI', range.startContainer);
        let li2 = this.isBelongTag('LI', range.endContainer);
        let r = new Range();
        li1 && r.setStartBefore(li1);
        li2 && r.setEndAfter(li2);
        r = this.reassignRange(r);
        let ct = r.extractContents();
        let common = r.commonAncestorContainer;
        r.setEndAfter(common);
        let ct2 = r.extractContents();
        if(this.isRemainLi(ct2.firstChild)){
            r.insertNode(ct2);
            r.collapse(true);
        }
        let grand = common.parentNode;
        if(!this.isRemainLi(common)){
            common.remove();
        }
        if(grand.nodeName === 'UL' || grand.nodeName === 'OL'){
            let f = ct.firstChild;
            let l = ct.lastChild && ct.lastChild.nextSibling;
            r.insertNode(ct);
            this.reunion(f);
            this.reunion(l);
        }
        else{
            let childNodes = ct.childNodes;
            let nodes = [...childNodes];
            r = this.unListOne(nodes, r, grand);
        }
        return r;
    }
    unListOne(nodes, r, grand){
        !r.collapsed && r.deleteContents();
        if(!grand) grand = r.commonAncestorContainer;
        let len = nodes.length;
        let r1 = new Range();
        let r0 = r.cloneRange();
        nodes.map((node, idx) =>{
            if(node.nodeName === 'UL' || node.nodeName === 'OL'){
                r0.insertNode(node);
                r0.setStartAfter(node);

                if(idx !== len - 1){
                    this.reunion(node)
                }
                else{
                    this.reunion(node, true);
                    r.setStartAfter(node.lastChild);
                    r.collapse(true);  
                }
            }
            else{
                let ct1;
                if(node.firstChild && node.firstChild.nodeName === 'BR' || !node.hasChildNodes()){
                    ct1 = document.createElement('br');
                    r0.insertNode(ct1);
                    idx === len - 1 && (r.setStartBefore(ct1), r.collapse(true));
                }
                else if(node.firstChild.nodeName === 'PRE'){
                    ct1 = node.firstChild;
                    if(!ct1.hasChildNodes()){
                        ct1.appendChild(document.createElement('br'));
                    }
                    r0.insertNode(ct1);
                    idx === len - 1 && (r.setStartBefore(ct1.firstChild), r.collapse(true));
                }
                // else if(node.childNodes.length === 1 && node.firstChild.nodeName === 'SPAN'){
                //     ct1 = node.firstChild;
                //     ct1.appendChild(document.createElement('br'));
                // }
                else{
                    r1.selectNodeContents(node);
                    let p = document.createElement('p');
                    r0.insertNode(p);
                    p.appendChild(r1.extractContents());
                    this.handleUnacessedSpan(p.firstChild);
                    idx === len - 1 && (r.setStartAfter(p.lastChild), r.collapse(true));
                }
                // if(first.previousSibling && ['IMG', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'P'].indexOf(first.previousSibling.nodeName) === -1
                // && ['IMG', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'P'].indexOf(first.nodeName) === -1){
                //     grand.insertBefore(br, first)
                // }
                // if(idx === len -1 && last.nextSibling && ['IMG', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'P'].indexOf(last.nextSibling.nodeName) === -1
                // && ['IMG', 'BLOCKQUOTE', 'PRE', 'UL', 'OL', 'P'].indexOf(last.nodeName) === -1){
                //     let r2 = new Range();
                //     r2.setStartAfter(last);
                //     r2.collapse(true)
                //     let br1 = document.createElement('br');
                //     r2.insertNode(br1);
                // }
            }
            r0.collapse(false);
        })
        return r;
    }
    unlistMany = (range) =>{
        let li1 = this.isBelongTag('LI', range.startContainer);
        let li2 = this.isBelongTag('LI', range.endContainer);
        let r = new Range();
        r.setStartBefore(li1);
        r.setEndAfter(li2);
        r = this.reassignRange(r);
        let ct = r.extractContents();
        let nodes = [...ct.childNodes].reduce((acc, cur) =>{
            acc = acc.concat([...cur.childNodes]);
            return acc;
        },[])
        r = this.unListOne(nodes, r); 
        return r;
    }
    findMostOuterOUL(li){
        while(li.parentNode.nodeName === 'UL' || li.parentNode.nodeName === 'OL'){
            li = li.parentNode;
        }
        return li;
    }
    splitNodeX = (node, range, bool) =>{
        range = range.cloneRange();
        !bool && (range = this.reassignRange(range));
        let r1 = range.cloneRange();
        r1.collapse(true);
        r1.setStartBefore(node);
        let ct1 = r1.extractContents()
        let r2 = range.cloneRange();
        r2.collapse(false)
        r2.setEndAfter(node);
        let ct2 = r2.extractContents()
        if(!this.isSpanEmpty(ct1.firstChild)){
            console.log('ct1', ct1.firstChild)
            r1.insertNode(ct1);
        };
        if(!this.isSpanEmpty(ct2.firstChild)){
            console.log('ct2', ct2.firstChild)
            r2.insertNode(ct2);
        }
        if(node.nodeName !== '#text' && !node.hasChildNodes()) node.appendChild(document.createElement('br'));
        return node;
    }
    createBlq(){
        let blq = document.createElement('BLOCKQUOTE');
        blq.style.fn = '16px';
        return blq;
    }
    checkForUOPCommon = (r) =>{
        let common= r.commonAncestorContainer;
        let xnode;
        if((xnode = this.isBelongTag('UL', common) || this.isBelongTag('OL', common) || this.isBelongTag('PRE', common))){
            if(xnode.nodeName !== 'PRE'){
                xnode = this.findMostOuterOUL(xnode);
                this.reassignRange(r, xnode);
            }
            xnode = this.splitNodeX(xnode, r);
            r.selectNode(xnode);
        }
        return xnode;
    }
    convertToBLockquote(range){
        // range = range.cloneRange();
        let {startContainer: start, endContainer: end, commonAncestorContainer: common, startOffset, endOffset} = range, x;
        // if((x = this.isBelongTag('P', start) || this.isBelongTag('LI', start) || this.isBelongTag('PRE', start))){
        //     range.setStartBefore(start);
        // }
        // if((x = this.isBelongTag('P', end) || this.isBelongTag('LI', end) || this.isBelongTag('PRE', end))){
        //     range.setEndAfter(end);
        // }
        this.roundUpRange(range);
        this.findPreBreakPoint(range);

        let xnode;
        let blq = this.createBlq();
        // if((xnode = this.isBelongTag('UL', common) || this.isBelongTag('OL', common) || this.isBelongTag('PRE', common))){
        //     console.log(xnode, 0)
        //     if(xnode.nodeName !== 'PRE'){
        //         xnode = this.findMostOuterOUL(xnode);
        //         this.reassignRange(range, xnode);
        //     }
        //     xnode = this.splitNodeX(xnode, range);
        //     xnode.parentNode.replaceChild(blq, xnode);
        // }
        if((xnode = this.checkForUOPCommon(range))){
            xnode.parentNode.replaceChild(blq, xnode);
        }
        else{
            let px;
            if((end !== this.root && end.hasChildNodes() && endOffset === end.childNodes.length - 1) && end.lastChild.nodeName === 'BR' || (px = this.isBelongTag('P', end))){
                px && (end = px);
                range.setEndAfter(end);
            }
            this.reassignRange(range);
            xnode = range.extractContents();
            range.insertNode(blq);
        }
        blq.appendChild(xnode);
        if(blq.nextSibling && blq.nextSibling.nodeName === 'BR'){blq.nextSibling.remove()}
        if(!blq.hasChildNodes){
            blq.appendChild(document.createElement('br'));
        }
        range.selectNodeContents(blq);
        return range;
    }
    unQuoteOne =  (quote, r)=>{
        if(!r) r = new Range();
        if(!quote.hasChildNodes() || this.hasOnlyOneBr(quote)){
            r.selectNode(quote);
            quote.parentNode.replaceChild(document.createElement('br'), quote);
            r.collapse(false);
            return r;
        }
        else{
            if(quote.lastChild.nodeName === 'BR'){
                quote.lastChild.remove();
            }
            r.selectNodeContents(quote);
            let ct = r.extractContents();
            r.selectNode(quote);
            quote.remove();
            r.insertNode(ct);
            r.collapse(false);
            return r;
        }
    }
    unQuote = (r) =>{
        let {startContainer: start, endContainer: end} = r, nodes = this.state.quote;
        let x;
        if((x = this.isBelongTag('P', start) || this.isBelongTag('LI', start) || this.isBelongTag('PRE', start))){
            r.setStartBefore(start);
        }
        if((x = this.isBelongTag('P', end) || this.isBelongTag('LI', end) || this.isBelongTag('PRE', end))){
            r.setEndAfter(end);
        }
        if(nodes.length === 1){
            let node;
            console.log('mot')
            if(nodes[0].hasChildNodes() && !this.hasOnlyOneBr(nodes[0])){
                let r1 = r.cloneRange();
                r1.setEndAfter(nodes[0].lastChild);
                this.reassignRange(r1);
                console.log(r1)
                r.setStart(r1.startContainer, r1.startOffset);
                r1 = r.cloneRange();
                console.log(r)
                r1.setStartBefore(nodes[0].firstChild);
                this.reassignRange(r1);
                r.setEnd(r1.endContainer, r1.endOffset);
                console.log('ro', r)
                node = this.splitNodeX(nodes[0], r);
            }
            else{
                node = nodes[0];
            }
            return this.unQuoteOne(node, r);
        }
        this.reassignRange(r);
        let r1 = r.cloneRange();
        r1.setEndAfter(nodes[0]);
        nodes[0] = this.splitNodeX(nodes[0], r1);
        r.setStartBefore(nodes[nodes.length - 1]);
        nodes[nodes.length - 1] = this.splitNodeX(nodes[nodes.length - 1], r);
        nodes.map(quote =>{
            this.unQuoteOne(quote, r)
        });
        return r;
    }
    normalizeText(frag){
        // let div = document.createElement('div');
        // div.appendChild(frag);
        // let r = new Range(); 
        // r.selectNodeContents(div);

        let text = '';
        let _add;
        (_add = (cur) =>{
            if(!cur) return;
            if(cur.nodeName === '#text'){
                text += cur.nodeValue;
            }
            if(cur.hasChildNodes()){
                _add(cur.firstChild);
            }
            // if(!cur.nextSibling && cur.parentNode.nodeName === '#document-fragment'){
            //     return;
            // }
            if(cur.nextSibling){
                _add(cur.nextSibling)
            }
            // else{    
            //     let par = cur.parentNode;
            //     while(par.nodeName !== '#document-fragment'){
            //         if(par.nextSibling){
            //             _add(par.nextSibling);
            //             break;
            //         }
            //         else{
            //             par = par.parentNode;
            //         }
            //     }
            // }
        })(frag.firstChild)
        return text.length ? document.createTextNode(text): document.createElement('br')
    }
    convertToBlockCode = (r)=>{
        this.roundUpRange(r)
        this.findPreBreakPoint(r);
        this.checkForUOPCommon(r)
        this.reassignRange(r, true);
        console.log('...', r)
        let frag = r.extractContents();
        let pre = document.createElement('pre');
        r.insertNode(pre);
        if(pre.nextSibling && pre.nextSibling.nodeName === 'BR'){
            pre.nextSibling.remove();
        }
        if(!frag.firstChild){
            r.setStart(pre, 0);
            r.collapse(true);
            return r;
        }
        let _handle, r1 = new Range(), completed = false;
        (_handle = (cur) =>{
            if(completed) return;
            let found = false;
            if(cur.childNodes.length > 1 && cur.lastChild.nodeName === 'BR'){
                cur.lastChild.remove();
            }
            switch(cur.nodeName){
                case 'BR':
                    pre.appendChild(cur);
                    found = true;
                    break;
                case 'P': case 'PRE':
                    found = true;
                    r1.selectNodeContents(cur);
                    pre.appendChild(this.normalizeText(r1.extractContents()));
                    break;
                case 'LI':
                    if(cur.hasChildNodes() && cur.firstChild.nodeName === 'PRE'){
                        _handle(cur.firstChild);
                    }
                    else if(!cur.hasChildNodes()){
                    found = true;
                    pre.appendChild(document.createElement('br'));
                    }
                    else{
                        found = true;
                        r.selectNodeContents(cur);
                        pre.appendChild(this.normalizeText(r.extractContents()));
                    }
                    break;
                case 'UL': case 'OL':
                    _handle(cur.firstChild);
                    break;
                case 'BLOCKQUOTE':
                    if(cur.hasChildNodes()){
                        _handle(cur.firstChild);
                    }
                    else{
                        found = true;
                        pre.appendChild(document.createElement('br'));
                    }
            }
            if(!cur.nextSibling && cur.parentNode.nodeName === '#document-fragment'){
                completed = true;
                return;
            }
            if(found){
                pre.appendChild(document.createElement('br'));
            }
            if(cur.nextSibling){
                _handle(cur.nextSibling)
            }
            else{
                let par = cur.parentNode;
                while(par.nodeName !== '#document-fragment'){
                    if(par.nextSibling){
                        _handle(par.nextSibling);
                        break;
                    }
                    else{
                        par = par.parentNode;
                    }
                }
            }
        })(frag.firstChild);
        r.setStartAfter(pre.lastChild);
        r.collapse(true);
        return r;
    }
    unCodeOne = (pre, r) =>{
        if(!r) r = new Range();
        // r.selectNode(pre);
        // pre.remove();
        // let r1 = new Range();
        r.setStart(pre, 0);
        r.collapse(true);
        // if(pre.childNodes.length > 1 && pre.lastChild.nodeName === 'BR'){
        //     pre.lastChild.remove();
        // }
        let brs = pre.querySelectorAll('br');
        let par = pre.parentNode;
        brs.forEach((br) =>{
            r.setEndAfter(br);
            let ct = r.extractContents();
            if(ct.childNodes.length === 1){
                par.insertBefore(ct, pre);
            }
            else{
                br.remove();
                let p = document.createElement('p');
                par.insertBefore(p, pre);
                p.appendChild(ct);
            }
        });
        if(pre.hasChildNodes()){
            r.selectNodeContents(pre);
            let p = document.createElement('p');
            par.insertBefore(p, pre);
            p.appendChild(r.extractContents());
        }
        let prev = pre.previousSibling;
        r.selectNode(pre);
        r.deleteContents();
        return prev;
    }
    findPreBreakPoint = (r) =>{
        let {startContainer: start, startOffset: startOff, endContainer: end, endOffset: endOff} = r, a, b;
        console.log(start)
        if((a = this.isBelongTag('PRE', start))){
            let cur, span;
           if(start === a){cur = this.getNthChild(start, startOff)}
           else if(span = this.isBelongTag('SPAN', start)){
               cur = span;
           }
           else{
            cur = start;
           }
           while(cur && cur.nodeName !== 'BR'){
               cur = cur.previousSibling;
           }
           if(!cur){
               r.setStartBefore(a);
           }
           else{
               r.setStartAfter(cur);
           }
        }
        if((b = this.isBelongTag('PRE', end))){
            let cur, span;
           if(end === b){cur = this.getNthChild(end, endOff)}
           else if(span = this.isBelongTag('SPAN', end)){
               cur = span;
           }
           else{
            cur = end;
           }
           while(cur && cur.nodeName !== 'BR'){
               cur = cur.nextSibling;
           }
           if(!cur){
               r.setEndAfter(b);
           }
           else{
               r.setEndAfter(cur);
           }
        }
    }
    unCode = (r) =>{
        let nodes = this.state.code;
        this.findPreBreakPoint(r);
        let constraint = nodes.length === 1 ? nodes[0].parentNode : r.commonAncestorContainer;
        this.reassignRange(r, constraint);
        if(nodes.length === 1){
            nodes[0] = this.splitNodeX(nodes[0], r);
        }
        else{
            let r1 = r.cloneRange();
            r1.setEndAfter(nodes[0]);
            nodes[0] = this.splitNodeX(nodes[0], r1);
            r1 = r.cloneRange();
            r1.setStartBefore(nodes[nodes.length - 1]);
            nodes[nodes[length - 1]] = this.splitNodeX(nodes[nodes.length - 1], r1)
        }
        nodes.map((pre, idx) =>{
            let prev = this.unCodeOne(pre, r);
            if(idx === nodes.length - 1){
                if(prev.nodeName === 'BR'){
                    r.setStartBefore(prev);
                }
                else if(prev.hasChildNodes() && prev.lastChild.nodeName === 'BR'){
                    r.setStartBefore(prev.lastChild)
                }
                else{
                    r.setStartAfter(prev.lastChild);
                }
                r.collapse(true);
            }

        });
        return r;
    }
    codeToList = (pre,list) =>{
        if(!pre.hasChildNodes()){
            list.appendChild(document.createElement('li'));
            return;
        }
        let r = new Range();
        r.setStart(pre, 0);
        r.collapse(true);
        let brs = pre.querySelectorAll('br');
        brs.forEach((br) =>{
            r.setEndAfter(br);
            let ct = r.extractContents();
            let li = document.createElement('li');
            if(ct.childNodes.length === 1){
                list.appendChild(li);
                li.appendChild(ct);
            }
            else{
                br.remove();
                list.appendChild(li);
                li.appendChild(ct);
            }
        });
        if(pre.hasChildNodes()){
            r.selectNodeContents(pre);
            let li = document.createElement('li');
            list.appendChild(li)
            li.appendChild(r.extractContents());
        }
    }
    roundUpRange(r){
        let {startContainer: start, endContainer: end} = r, x;
        if((x = this.isBelongTag('P', start) || this.isBelongTag('LI', start))){
            r.setStartBefore(x);
        }
        if((x = this.isBelongTag('P', end) || this.isBelongTag('LI', end))){
            r.setEndAfter(x);
        }
    }
    convertToListX = (tagName, r) =>{
        let {startContainer: start, endContainer: end, startOffset: startOff, endOffset: endOff, collapsed} = r;
        this.findPreBreakPoint(r);
        this.roundUpRange(r);
        let blq;
        let constraint = (blq = this.isBelongTag('BLOCKQUOTE', r.commonAncestorContainer)) ? blq : true;
        this.reassignRange(r, constraint);
        let frag = r.extractContents();
        console.log(frag.firstChild)
        let list = document.createElement(tagName);
        r.insertNode(list);
        if(list.nextSibling && list.nextSibling.nodeName === 'BR'){
            list.nextSibling.remove();
        }
        if(!frag.firstChild){
            list.appendChild(document.createElement('li'));
            list.firstChild.appendChild(document.createElement('br'));
            r.setStart(list.firstChild, 0);
            r.collapse(true);
            return r;
        }
        console.log(frag.firstChild,'fra')
        let _handle, completed = false;
        (_handle = (cur) =>{
            if(completed || !cur) return;
            if(cur.childNodes.length > 1 && cur.lastChild.nodeName === 'BR'){
                cur.lastChild.remove();
            }
            switch(cur.nodeName){
                case 'BR':{
                    let li = document.createElement('li');
                    list.appendChild(li);
                    li.appendChild(cur);
                    break;
                }
                case 'P':{
                    let li = document.createElement('li');
                    list.appendChild(li);
                    r.selectNodeContents(cur);
                    li.appendChild(r.extractContents());
                    break;
                }
                case 'PRE':
                    this.codeToList(cur, list);
                    break;
                case 'UL': case 'OL':
                    r.selectNodeContents(cur);
                    list.appendChild(r.extractContents())
                    break;
                case 'BLOCKQUOTE':
                    if(!cur.hasChildNodes()){
                        list.appendChild(document.createElement('li'));
                        return;
                    }
                    else{
                        _handle(cur.firstChild);
                    }
            }
            if(!cur.nextSibling && cur.parentNode.nodeName === '#document-fragment'){
                completed = true;
                return;
            }
            if(cur.nextSibling){
                _handle(cur.nextSibling)
            }
            // else{
            //     let par = cur.parentNode;
            //     while(par.nodeName !== '#document-fragment'){
            //         if(par.nextSibling){
            //             _handle(par.nextSibling);
            //             break
            //         }
            //         else{
            //             par = par.parentNode;
            //         }
            //     }
            // }
        })(frag.firstChild);
        // if(start.nodeName === '#text'){
        //     r.setStart(start, startOff);
        //     if(collapsed){
        //         r.collapse(true);
        //     }
        // }
        // else{
        //     collapsed ? (r.setStartAfter(list.firstChild), r.collapse(true)) : r.setStartBefore(list.firstChild);
        // }
        // if(end.nodeName === '#text' && !collapsed){
        //     r.setEnd(end, endOff);
        //     if(collapsed){
        //         r.collapse(true);
        //     }
        // }
        // else if(!collapsed){
        //     r.setEndAfter(list.lastChild)
        // }
        this.resideRange(list, r);
        return r;
    }
    resideRange(list, r){
        r.setStart(list.firstChild, 0);
        list.lastChild.lastChild ? r.setEndAfter(list.lastChild.lastChild) : r.setEnd(list.lastChild, 0)
    }
    modifyStyleX = (r, {prop, val}) =>{
        let a, b;
        if((a = this.isBelongTag('PRE', r.startContainer) || this.isBelongTag('CODE', r.startContainer))){
            r.setStartAfter(a);
        }
        if((a = this.isBelongTag('PRE', r.endContainer) || this.isBelongTag('CODE', r.endContainer))){
            r.setEndBefore(a);
        }
        this.reassignRange(r, true);
        let {startContainer: start, endContainer: end, startOffset: startOff, endOffset: endOff} = r, c = false, d = false;
        if((a = start.nodeName === '#text') || start.nodeName === 'SPAN'){
            if(a && (b = this.isBelongTag('SPAN', start))){
                start = b;
            }
            if(a && !b || b && start.style[prop] !== val){
                let r1 = r.cloneRange();
                r1.setEndAfter(start)
                start = this.splitNodeX(start, r1);
                c = true;
                // r.setStartBefore(start);
                
            }
        }
        else{
            start = this.getNthChild(start, startOff);
            c = true;
        }
        if((a = end.nodeName === '#text') || end.nodeName === 'SPAN'){
            if(a && (b = this.isBelongTag('SPAN', end))){
                end = b;
            }
            if(a && !b || b && end.style[prop] !== val){
                let r1 = r.cloneRange();
                r1.setStartBefore(end)
                end = this.splitNodeX(end, r1);
                d = true;
                // r.setEndAfter(end);
            }
        }
        else{
            end = this.getNthChild(end, endOff - 1);
            d = true;
        }
        console.log(start, end, r)
        let _modify, completed = false;
        (_modify = (cur) =>{
            console.log(1,cur)
            if(completed) return;
            if(cur.nodeName === '#text'){
                let span = this.createSampleSpan(prop, val);
                cur.parentNode.replaceChild(span, cur);
                span.appendChild(cur);
            }
            else if(cur.nodeName === 'SPAN'){
                if(cur.style[prop] !== val){
                    cur.style[prop] = val;
                }
            }
            else if(cur.hasChildNodes() && cur.nodeName !== 'PRE'){
                if(cur.nodeName === 'LI' && prop === 'color'){
                    cur.style.color = val;
                }
                _modify(cur.firstChild)
            }
            if(cur === end){
                completed = true;
                return;
            }
            else if(cur.nextSibling){
                _modify(cur.nextSibling);
            }
            else{
                let par = cur.parentNode;
                while(par !== end && par !== this.root){
                    if(par.nextSibling){
                        _modify(par.nextSibling);
                        break;
                    }
                    else{
                        par = par.parentNode;
                    }
                }
            }
        })(start);
        c && r.setStartBefore(start);
        d && r.setEndAfter(end);
        return r;
    }
}
export default EditorNodeTraveler;