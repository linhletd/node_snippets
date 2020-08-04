class HistoryStackManager {
    constructor(domNode){
        this.observer = new MutationObserver(this.observerCallback);
        this.trackedNode = domNode;
        this.isObserving = false;
        this.head = this.createNewHistoryNode(null);
        this.current = this.head;
        this.size = 100;
        this.length = 0;
    }
    observerCallback = (mutations, observer) =>{
        let change = mutations.map(m =>{
            let {addedNodes, attributeName, nextSibling, oldValue, previousSibling, removedNodes, target, type } = m;
            switch(type){
                case 'attributes':{
                    return {
                        type,
                        target,
                        attributeName,
                        oldValue,
                        newValue: target.attributes[attributeName].value
                    }
                }
                case 'characterData':{
                    return {
                        type,
                        target,
                        oldValue,
                        newValue: target.nodeValue
                    }
                }
                case 'childList':{
                    if(addedNodes.length && removedNodes.length){
                        return {
                            type: 'replaceNode',
                            addedNodes,
                            removedNodes,
                            target,
                            previousSibling,
                            nextSibling
                        }
                    }
                    else if(addedNodes.length){
                        return {
                            type: 'addNode',
                            addedNodes,
                            target,
                            previousSibling,
                            nextSibling
                        }
                    }
                    else{
                        return {
                            type: 'removeNode',
                            removedNodes,
                            target,
                            previousSibling,
                            nextSibling
                        }
                    } 
                }
            }
        });
        console.log(change)
        let newNode = this.createNewHistoryNode(change);
        this.addNewHistoryNode(newNode);
    }
    startObserving = ()=>{
        if(!this.isObserving){
            this.isObserving = true;
            this.observer.observe(this.trackedNode, {
                attributes: true,
                childList: true,
                subtree: false,
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
        if(this.current && this.current.next){
            return this.changeDirection(node);
        }
        if(this.length === this.size){
            this.head = this.head.next;
            this.head.change = null;
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
        this.length = this.distanceFromCurrentToTail() + 1;
        this.current.next = node;
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
    redo = () =>{
        if(!this.current.next){
            console.log('stop')
            return;
        }
        this.stopObserving();
        let actions = this.current.next.change;
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
        this.current = this.current.next;
        this.startObserving();
    }
    undo = ()=>{
        console.log(this.current.change)
        if(!this.current.change){
            console.log('stop');
            return;
        }
        this.stopObserving();
        let actions = this.current.change;
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
        this.current = this.current.prev;
        this.startObserving();
    }
}
export default HistoryStackManager;