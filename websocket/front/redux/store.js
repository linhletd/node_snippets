import {createStore} from 'redux';

const LOGIN = 'LOGIN',
      LOGOUT = 'LOGOUT',
      SAVELOC = 'SAVELOC',
      OPENSOCKET = 'OPENSOCKET';

var user, socket;
if(window.atob && /^InVzZXIi=|;InVzZXIi=/.test(document.cookie)){
    user = atob((';' + document.cookie +';').match(/;InVzZXIi=(.+?);/)[1].replace(/%2F/g,'/').replace(/%3D/g, '='));
    socket = new window.WebSocket('ws://localhost:8080');
}

const initialState = {user, socket}

function reducer(state = initialState, action){
    switch(action.type){
        case LOGIN:
            return Object.assign({user: action.data},state);
        case LOGOUT:
            return Object.assign({user: undefined, state});
        case OPENSOCKET:
            return Object.assign({socket: action.data}, state);
        case SAVELOC:
            return Object.assign({backUrl: action.data},state);
        default:
            return state;
    }
}
const store = createStore(reducer);
export default store;