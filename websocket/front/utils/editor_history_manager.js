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
                        newValue: target.data
                    }
                }
                case 'childList':{
                    if(addedNodes.length && removedNodes.length){
                        return {
                            type: 'replaceNode',
                            addedNode: addedNodes[0],
                            removedNode: removedNodes[0],
                            target
                        }
                    }
                    else if(addedNodes.length){
                        return {
                            type: 'addNode',
                            addedNode: addedNodes[0],
                            nextSibling,
                            target
                        }
                    }
                    else{
                        return {
                            type: 'removeNode',
                            removedNode: removedNodes[0],
                            target
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
                case 'replaceNode': {
                    let {addedNode, removedNode, target} = action;
                    target.replaceChild(addedNode, removedNode);
                    break;
                }
                case 'addNode': {
                    let {nextSibling: next, target, addedNode} = action;
                    if(next){
                        target.insertBefore(addedNode, next);
                    }
                    else {
                        target.appendChild(addedNode)
                    }
                    break;
                }
                case 'removeNode': {
                    let {target, removedNode} = action;
                    target.removeChild(removedNode);
                    break;
                }    
            }
        })
        this.current = this.current.next;
        this.startObserving();
    }
    undo = ()=>{
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
                case 'replaceNode': {
                    let {addedNode, removedNode, target} = action;
                    target.replaceChild(removedNode, addedNode);
                    continue;
                }
                case 'addNode': {
                    let {target, addedNode} = action;
                    target.removeChild(addedNode);
                    continue;
                }
                case 'removeNode': {
                    let {nextSibling: next, target, removedNode} = action;
                    if(next){
                        target.insertBefore(removedNode, next);
                    }
                    else {
                        target.appendChild(removedNode)
                    }
                }    
            }
        }
        this.current = this.current.prev;
        this.startObserving();
    }
}
export default HistoryStackManager;