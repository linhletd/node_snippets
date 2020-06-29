import {createStore} from 'redux';

const LOGIN = 'LOGIN',
      LOGOUT = 'LOGOUT',
      SAVELOC = 'SAVELOC',
      POSTTOPIC = 'POSTTOPIC',
      OPENSOCKET = 'OPENSOCKET';

var user, socket;
if(window.atob && /^InVzZXIi=|;InVzZXIi=/.test(document.cookie)){
    user = JSON.parse(atob((';' + document.cookie +';').match(/;InVzZXIi=(.+?);/)[1].replace(/%2F/g,'/').replace(/%3D/g, '=')));
    socket = new window.WebSocket('ws://localhost:8080');
}

const initialState = {user, socket}

function reducer(state = initialState, action){
    switch(action.type){
        case LOGIN:
            return {...state, user: action.data};
        case LOGOUT:
            return {...state, user: undefined};
        case OPENSOCKET:
            console.log('dispatch')
            return {...state, socket: action.data};
        case SAVELOC:
            return {...state, backUrl: action.data};
        // case POSTTOPIC:
        //     return Object.assign({topics:})
        default:
            return state;
    }
}
const store = createStore(reducer);
export default store;