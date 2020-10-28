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

      TOPICTITLE = 'TOPICTITLE',
      TITLEBOARD = 'TITLEBOARD',
      TOPICBAR = 'TOPICBAR',
      COMMENT = 'COMMENT',
      COMMENTBAR = 'COMMENTBAR',
      REPSEC = 'REPSEC',
      REPBAR = 'REPBAR'

    
var user, socket, usersStatus = undefined;
if(window.atob && /^InVzZXIi=|;InVzZXIi=/.test(document.cookie)){
    user = JSON.parse(atob((';' + document.cookie +';').match(/;InVzZXIi=(.+?);/)[1].replace(/%2F/g,'/').replace(/%3D/g, '=')));
    let {protocol, host, port} = window.location;
    socket = new window.WebSocket(`ws${protocol.match(/s/) ? 's' : ''}://${host}`);
}

function main(state = {user, socket, usersStatus, mutateStore: {}},{type, data}){
    switch(type){
        case LOGIN:
            return {...state, user: data.user, socket: data.socket};
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
            if(user){
                user.isOnline = true;
                if(user.isOnline && data.isOnline === false){
                    user.isOnline = false; 
                    user.LastActive = Date.now()  - 60 * 1000;
                }
            }
            else {
                let newUser = data;
                newState.set(newUser._id, newUser);
            }
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
                    sides = {}
                sides[mainSide] = mainUId;
                sides[subSide] = subUId;
                state.mutateData.inviteId = inviteId;
                return {...state, gameStatus: {mainSide, sides, active: true}, waitingfor: null, noticeList: new Map()};
            }
        case FINISHGAME:
            {
                let popup = {
                    type: 'finish',
                    title: data.result,
                    subPlayer: data.subPlayer,
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
                    let newPopup = {...state.popup, continuable: true, graspedInfo: 'Your friend want to continue game...'};
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
editorNode.className = 'editor_area';
let initialEditor = {
    editorNode,
    historyManager: new HistoryStackManager(editorNode)
}
function editor(state = initialEditor){
    return state;
}
function popup(state = {}, action){
    switch(action.type){
        case WAITPLAYER: 
            return {...state, global: action.data}
        case INVITENOTICE:
            return {...state, flash: action.data}
    }
    return state;
}
function viewPost(state = {}, action){
    if(action.type === 'GETTOPIC'){
        return action.data;//_id
    }
    return state;
}
let initialDiscuss = {
    title: {},
    titleList: true,
    topicBar: true,
    comment: true,
    cmtBar: {},
    repSec: {}
}
function discuss(state = initialDiscuss, action){
    switch(action.type){
        case TOPICTITLE:
            return {...state, title: action.data};
        case TITLEBOARD:
            return {...state, titleList: !state.titleList};
        case TOPICBAR:
            return {...state, topicBar: !state.topicBar};
        case COMMENT:
            return {...state, comment: !state.comment};
        case COMMENTBAR:
            return {...state, cmtBar: action.data};
        case REPSEC:
            return {...state, repSec: action.data};
        case REPBAR:
            return {...state, repBar: action.data}
    }
    return state;
}
let reducer = combineReducers({
    main,
    poong,
    editor,
    popup,
    viewPost,
    discuss
})
const store = createStore(reducer);
export default store;