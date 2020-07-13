import {createStore, combineReducers} from 'redux';

const LOGIN = 'LOGIN',
      LOGOUT = 'LOGOUT',
      JOINGAME = 'JOINGAME',
      OPENSOCKET = 'OPENSOCKET',
      ACTIVEGAME = 'ACTIVEGAME';

var user, socket , poong = {};
if(window.atob && /^InVzZXIi=|;InVzZXIi=/.test(document.cookie)){
    user = JSON.parse(atob((';' + document.cookie +';').match(/;InVzZXIi=(.+?);/)[1].replace(/%2F/g,'/').replace(/%3D/g, '=')));
    socket = new window.WebSocket('ws://localhost:8080');
}

const initialState = {user, socket, poong}

function reducer(state = initialState, action){
    console.log(action)
    switch(action.type){
        case LOGIN:
            return {...state, user: action.data};
        case LOGOUT:
            return {...state, user: undefined};
        case OPENSOCKET:
            return {...state, socket: action.data};
        case JOINGAME:
            state.poong.main = action.data;
            return state;
        case ACTIVEGAME:
            return {...state, poong: {...state.poong, active: true}}
        default:
            return state;
    }
}
const store = createStore(reducer);
export default store;