import {createStore, combineReducers} from 'redux';

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
      SOMEWHERE = 'SOMEWHERE';
    
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
function poong(state = {noticeList: new Map()}, {type, data}){
    switch(type){
        case ACTIVEGAME:
            {
                let {mainSide, mainUId, subUId, inviteId} = data;
                let subSide = mainSide == 'a' ? 'b' : 'a',
                    s = {side: mainSide, _id: mainUId},
                    m = {side: subSide, _id: subUId},
                    sideList = [m, s].sort((a,b) =>{
                        return (a.side.codePointAt(0) - b.side.codePointAt(0))
                    })
                return {...state, mainSide, sideList, active: true, waitingfor: null, noticeList: null};
            }
        case WAITPLAYER:
            return {...state, waitingfor: {_id: data._id}};
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
        default:
            return state;
    }
}
let reducer = combineReducers({
    main,
    poong
})
const store = createStore(reducer);
store.subscribe(()=>{
    console.log('dispatch')
})
export default store;