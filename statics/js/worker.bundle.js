/*
 * ATTENTION: The "eval" devtool has been used (maybe by default in mode: "development").
 * This devtool is not neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
/******/ (() => { // webpackBootstrap
/*!****************************************!*\
  !*** ./front/workers/detect_wakeup.js ***!
  \****************************************/
/*! unknown exports (runtime-defined) */
/*! runtime requirements:  */
eval("onmessage = function onmessage(e) {\n  var lastTime = new Date().getTime();\n  var checkTime = 5000;\n  var delay = 2000;\n  var itv = setInterval(function () {\n    var currentTime = new Date().getTime();\n\n    if (currentTime - lastTime > checkTime + delay) {\n      postMessage('wakeup');\n      clearInterval(itv);\n    }\n  }, checkTime);\n};\n\n//# sourceURL=webpack://masteringnode/./front/workers/detect_wakeup.js?");
/******/ })()
;