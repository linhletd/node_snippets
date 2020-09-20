import {createStore, combineReducers} from 'redux';
import HistoryStackManager from '../utils/editor_history_manager'


const LOGIN = 'LOGIN',
      LOGOUT = 'LOGOUT',
      OPENSOCKET = 'OPENSOCKET',
      LOADUSERSTATUS = 'LOADUSERSTATUS',
      UPDATEUSERSTATUS = 'UPDATEUSERSTATUS',
      WAITPLAYER = 'WAITPLAYER',
      INVITENOTICE = 'INVITENOTICE',
      CANCELWAIT = 'CANCELWAIT',
      CANCELMSG = 'CANCELMSG',
      ACTIVEGAME = 'ACTIVEGAME',
      DECLINEGAME = 'DECLINEGAME',
      SOMEWHERE = 'SOMEWHERE',
      FINISHGAME = 'FINISHGAME',
      CONTINUEGAME = 'CONTINUEGAME',
      CONTINUEMSG = 'CONTINUEMSG',
      LEAVEGAME = 'LEAVEGAME',
      ENDGAME = 'ENDGAME',

      TOOLBARCHANGE = 'TOOLBARCHANGE',

      OPENPROMPT = 'OPENPROMPT',
      CLOSEPROMPT = 'CLOSEPROMPT'
    
var user, socket, usersStatus = undefined;
if(window.atob && /^InVzZXIi=|;InVzZXIi=/.test(document.cookie)){
    user = JSON.parse(atob((';' + document.cookie +';').match(/;InVzZXIi=(.+?);/)[1].replace(/%2F/g,'/').replace(/%3D/g, '=')));
    socket = new window.WebSocket('ws://localhost:8080');
}

function main(state = {user, socket, usersStatus},{type, data}){
    switch(type){
        case LOGIN:
            return {...state, user: data};
        case LOGOUT:
            return {...state, user: undefined};
        case OPENSOCKET:
            return {...state, socket: data};
        case LOADUSERSTATUS:
            return {...state, usersStatus: data};
        case UPDATEUSERSTATUS:
            let {usersStatus} = state;
            if(!usersStatus) return state;
            let user = usersStatus.get(data._id);
            if(user && data.isOnline == user.isOnline){
                return state;
            }
            let newState = new Map([...usersStatus]);
            let newUser = Object.assign({}, user);
            if(user){
                newUser.isOnline = true;
                if(user.isOnline && data.isOnline === false){
                    newUser.isOnline = false; 
                }
            }
            else {
                newUser = {...data};
            }
            newState.set(newUser._id, newUser);
            return {...state, usersStatus: newState}
        default:
            return state;
    }
}
let initialPoong = {
    watingFor: null,
    noticeList: new Map(),
    gameStatus: null,
    mutateData: {},
    popup: null
}
function poong(state = initialPoong, {type, data}){
    switch(type){
        case WAITPLAYER:
            return {...state, waitingfor: {_id: data._id, inviteId: data.inviteId}};
        case CANCELWAIT:
            return {...state, waitingfor: null};
        //notice
        case INVITENOTICE:
            {
                let newEntries = [...state.noticeList];
                newEntries.unshift([data.inviteId, data]);
                return {...state, noticeList: new Map(newEntries)};
            }

        case DECLINEGAME: case CANCELMSG:
            {
                let newNoticeList = new Map(state.noticeList);
                newNoticeList.delete(data.inviteId);
                return {...state, noticeList: newNoticeList}
            }
        case SOMEWHERE:
            {
                return {...state, noticeList: new Map()}
            }
        case ACTIVEGAME:
            {
                let {mainSide, mainUId, subUId, inviteId} = data;
                let subSide = mainSide == 'a' ? 'b' : 'a',
                    s = {side: mainSide, _id: mainUId},
                    m = {side: subSide, _id: subUId},
                    sideList = [m, s].sort((a,b) =>{
                        return (a.side.codePointAt(0) - b.side.codePointAt(0))
                    })
                    state.mutateData.inviteId = inviteId;
                return {...state, gameStatus: {mainSide, sideList, active: true}, waitingfor: null, noticeList: new Map()};
            }
        case FINISHGAME:
            {
                let popup = {
                    type: 'finish',
                    title: data.result,
                    continuable: false,
                }
                return {...state, popup}
            }
        case LEAVEGAME:
            {
                let popup = {
                    type: 'leave',
                    title: 'your friend has left game :('
                }
                return {...state, popup}
            }
        case CONTINUEGAME: case CONTINUEMSG:
            {
                let {continuable} = state.popup;
                if(continuable){
                    let newGameStatus = {...state.gameStatus}
                    return {...state, popup: null, gameStatus: newGameStatus }
                }
                else if(type === CONTINUEMSG){
                    let newPopup = {...state.popup, continuable: true, graspedInfo: 'Your friend want you to continue playing game...'};
                    return {...state, popup: newPopup}
                }
                else {
                    state.popup.continuable = true;
                    return state;
                }
            }
        case ENDGAME:
            {
                return {...initialPoong, noticeList: state.noticeList}
            }
        default:
            return state;
    }
}

let editorNode = document.createElement('div');
editorNode.contentEditable = true;
editorNode.id = 'editor_area';
// editorNode.style.color = 'orange';
// editorNode.style.backgroundColor = 'grey';
editorNode.style.minHeight = '100vh';
editorNode.style.width = '100%';
editorNode.style.outline = 'none';
editorNode.style.border = '1px solid grey';
editorNode.style.borderRadius = '5px';
editorNode.style.fontSize = '16px';
editorNode.style.padding = '10px 10px';
editorNode.style.fontFamily = 'Arial, Helvetica, sans-serif'
editorNode.style.overflow = 'scroll';
editorNode.style.display = 'flex';
editorNode.style.flexDirection = 'column';
editorNode.style.alignItems = 'flex-start';


let initialEditor = {
    editorNode,
    historyManager: new HistoryStackManager(editorNode)
}
function editor(state = initialEditor){
    return state;
}
let initialEditorToolbar = {
    undo: 0,//0 disabled, 1 normal, 2 activated
    redo: 0,
    bold: 1, 
    italic: 1,
    underline: 1,
    order: 1,
    unorder: 1,
    inclevel: 0,
    declevel: 0,
    link: 1,
    quote: 1,
    code: 1,
    img: 1,
    fill: 'yellow',
    color: 'red',
    fontsize: '16px',
    fontfamily: 'Arial,Helvetica,sans-serif'

}
function toolbar(state = initialEditorToolbar, {type, data}){
    if(type === TOOLBARCHANGE){
        return {...state, ...data}
    }
    return state;
}

function linkPrompt(state = {closed: true}, {type, data}){
    switch(type){
        case OPENPROMPT:
            return data; //{it, as}
        case CLOSEPROMPT:
            return {closed: true};
    }
    return state;
} 
let reducer = combineReducers({
    main,
    poong,
    editor,
    toolbar,
    linkPrompt
})
const store = createStore(reducer);
export default store;