import {createStore, combineReducers} from 'redux';

const LOGIN = 'LOGIN',
      LOGOUT = 'LOGOUT',
      JOINGAME = 'JOINGAME',
      OPENSOCKET = 'OPENSOCKET',
      ACTIVEGAME = 'ACTIVEGAME',
      LOADUSERSTATUS = 'LOADUSERSTATUS',
      UPDATEUSERSTATUS = 'UPDATEUSERSTATUS';

var user, socket , poong = {}, usersStatus = undefined;
if(window.atob && /^InVzZXIi=|;InVzZXIi=/.test(document.cookie)){
    user = JSON.parse(atob((';' + document.cookie +';').match(/;InVzZXIi=(.+?);/)[1].replace(/%2F/g,'/').replace(/%3D/g, '=')));
    socket = new window.WebSocket('ws://localhost:8080');
}

const initialState = {user, socket, poong, usersStatus}

function reducer(state = initialState, {type, data}){
    switch(type){
        case LOGIN:
            return {...state, user: data};
        case LOGOUT:
            return {...state, user: undefined};
        case OPENSOCKET:
            return {...state, socket: data};
        case ACTIVEGAME:
            data.active = true;
            return {...state, poong: data};
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
                if(user.isOnline && type === 'offline'){
                    newUser.isOnline = false; 
                }
            }
            else {
                newUser = data;
            }
            newState.set(newUser._id, newUser);
            return {...state, usersStatus: newState}
        default:
            return state;
    }
}
const store = createStore(reducer);
export default store;