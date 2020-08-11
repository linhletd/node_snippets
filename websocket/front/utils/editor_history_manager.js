class HistoryStackManager {
    constructor(domNode){
        this.observer = new MutationObserver(this.observerCallback);
        this.trackedNode = domNode;
        this.isObserving = false;
        this.head = this.createNewHistoryNode({});
        this.current = this.head;
        this.size = 100;
        this.length = 0;
        this.data = {
            textTimer: undefined,
            waitState: undefined,
            waitRecord: undefined,
        }
    }
    observerCallback = (mutations, observer) =>{
        let record = [];
        if(this.data.mergeHistory){
            let m = mutations[0];
            let {addedNodes, nextSibling, previousSibling, target} = m;
            this.current.record.push({
                type: 'addNode',
                addedNodes,
                target,
                previousSibling,
                nextSibling
            });
            this.data.mergeHistory = undefined;
            return;
        }
        mutations.map((m) =>{
            let {addedNodes, attributeName, nextSibling, oldValue, previousSibling, removedNodes, target, type } = m;
            switch(type){
                case 'attributes':{
                    record.push({
                        type,
                        target,
                        attributeName,
                        oldValue,
                        newValue: target.attributes[attributeName].value
                    });
                    break;
                }
                case 'characterData':{
                    let prevChange;
                    this.current.change.record && (prevChange = this.current.change.record) 
                    // console.log(prevChange, prevChange.length == 1, prevChange[0].type == type, prevChange[0].target == target, this.data.textTimer, mutations.length == 1)
                    if(prevChange && prevChange.length == 1 && prevChange[0].type == type && prevChange[0].target == target && this.data.textTimer && mutations.length == 1) {
                        prevChange[0].newValue = target.nodeValue;
                        return;
                    }
                    else {
                        record.push({
                            type,
                            target,
                            oldValue,
                            newValue: target.nodeValue
                        })  
                    this.setTextTimeOut();
                    }
                    break;
                }
                case 'childList':{
                    if(addedNodes.length && removedNodes.length){
                        record.push({
                            type: 'replaceNode',
                            addedNodes,
                            removedNodes,
                            target,
                            previousSibling,
                            nextSibling
                        });
                    }
                    else if(addedNodes.length){
                        record.push({
                            type: 'addNode',
                            addedNodes,
                            target,
                            previousSibling,
                            nextSibling
                        })
                    }
                    else{
                        record.push({
                            type: 'removeNode',
                            removedNodes,
                            target,
                            previousSibling,
                            nextSibling
                        })
                    }
                    break; 
                }
            }
        });
        console.log('recorded');
        let change, newNode;
        record.length && (change = {range: undefined, record}) && (newNode = this.createNewHistoryNode(change));
        this.addNewHistoryNode(newNode);
        console.log(212,this.current)

    }
    updateRange = (range) =>{
        this.current.change.range = range;
    };
    updatePendingState = (type) =>{
        this.data.waitState = type;
    }
    reApplyRange = (range) =>{
        if(!range) return;
        console.log(12, range)
        let {startContainer, startOffset, endContainer, endOffset} = range;
        let r = new Range();
        r.setStart(startContainer, startOffset);
        r.setEnd(endContainer, endOffset);
        let sel = document.getSelection();
        sel.removeAllRanges();
        sel.addRange(r);
    }
    clearTextTimeOut = () =>{
        this.data.textTimer && clearTimeout(this.data.textTimer);
        this.data.textTimer = undefined;
    }
    setTextTimeOut = () =>{
        this.clearTextTimeOut()
        this.data.textTimer = setTimeout(() => {
            this.clearTextTimeOut();
        }, 5000);
    }
    startObserving = ()=>{
        if(!this.isObserving){
            this.isObserving = true;
            this.observer.observe(this.trackedNode, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true,
                attributeOldValue: true,
                characterDataOldValue: true
            });
        }
    }
    stopObserving = ()=>{
        if(this.isObserving){
            this.isObserving = false;
            this.observer.disconnect();
        }
    }
    createNewHistoryNode(change){
        return {
            prev: null,
            next: null,
            change
        };
    }
    addNewHistoryNode = (node) =>{
        if(!node) return;
        if(this.current && this.current.next){
            return this.changeDirection(node);
        }
        if(this.length === this.size){
            this.head = this.head.next;
            this.head.change.record = null;
            this.head.prev = null;
        }
        this.current.next = node;
        node.prev = this.current;
        this.current = node;
        this.length++;
    }
    distanceFromCurrentToTail = () => {
        let distance = 0;
        let traversal = this.current;
        while(traversal.next){
            distance++;
            traversal = traversal.next;
        }
        return distance;
    }
    goBackward = () => {
        if(!this.current.prev){
            return;
        }
        this.current = this.current.prev;
    }
    goForward = () =>{
        if(!this.current.next){
            return;
        }
        this.current = this.current.next;
    }
    changeDirection = (node) => {
        this.length = this.length - this.distanceFromCurrentToTail() + 1;
        this.current.next = node;
        node.prev = this.current;
        this.current = node;
    }
    setRange(target, prev, next){
        let r = new Range();
        if(prev && next){
            r.setStartAfter(prev);
            r.setEndBefore(next);
        }
        else if(prev){
            r.setStartAfter(prev);
            r.setEndAfter(target.lastChild);
        }
        else if(next){
            r.setStartBefore(target.firstChild);
            r.setEndBefore(next);
        }
        else{
            r.selectNodeContents(target);
        }
        return r;
    }
    replaceWithNodeList(r, list){
        r.deleteContents();
        let fragment = new DocumentFragment();
        list.forEach(node => {fragment.appendChild(node)});
        r.insertNode(fragment);
    }
    redo = (sub) =>{
        if(!this.current.next){
            console.log('stop')
            return;
        }
        this.stopObserving();
        let actions = this.current.next.change.record;
        actions.map(action => {
            switch(action.type){
                case 'attributes':{
                    let {attributeName: attr, target, newValue} = action;
                    target[attr] = newValue;
                    break;
                }
                case 'characterData':{
                    let {target, newValue} = action;
                    target.nodeValue = newValue;
                    break;
                }
                case 'replaceNode': case 'addNode': {
                    let {addedNodes, target, previousSibling: prev, nextSibling: next} = action;
                    let r = this.setRange(target, prev, next);
                    this.replaceWithNodeList(r, addedNodes);
                    break;
                }
                case 'removeNode': {
                    let {target, previousSibling: prev, nextSibling: next} = action;
                    let r = this.setRange(target, prev, next);
                    r.deleteContents();
                    break;
                }    
            }
        })
        this.startObserving();
        this.reApplyRange(this.current.next.change.range);
        this.current = this.current.next;

    }
    undo = (sub)=>{
        if(!this.current.change.record){
            console.log('stop');
            return;
        }
        this.stopObserving();
        let actions = this.current.change.record;
        for(let i = actions.length - 1; i >= 0; i--){
            let action = actions[i];
            switch(action.type){
                case 'attributes':{
                    let {attributeName: attr, target, oldValue} = action;
                    target[attr] = oldValue;
                    continue;
                }
                case 'characterData':{
                    let {target, oldValue} = action;
                    target.nodeValue = oldValue;
                    continue;
                }
                case 'replaceNode': case 'removeNode': {
                    let {removedNodes, target, previousSibling: prev, nextSibling: next} = action;
                    let r = this.setRange(target, prev, next);
                    this.replaceWithNodeList(r, removedNodes);
                    continue;
                }
                case 'addNode': {
                    let {target, previousSibling: prev, nextSibling: next} = action;
                    let r = this.setRange(target, prev, next);
                    r.deleteContents();
                    continue;
                }    
            }
        }
        this.startObserving();
        this.current = this.current.prev;
        this.reApplyRange(this.current.change.range);
    }
}
export default HistoryStackManager;