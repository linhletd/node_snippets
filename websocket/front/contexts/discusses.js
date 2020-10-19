import React from 'react';
let TitleContext =  React.createContext({topicList: new Map()});
let BarContext = React.createContext({});
let CommentContext = React.createContext({});
let CIndexContext = React.createContext({});
let ReplyContext = React.createContext({});
let RIndexContext = React.createContext({});
export {TitleContext, BarContext, CommentContext, CIndexContext, ReplyContext, RIndexContext};