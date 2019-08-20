"use strict";

var _react = _interopRequireDefault(require("react"));

var _ink = require("ink");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const funcs = [{
  title: "function 1",
  id: 1
}, {
  title: "function 2",
  id: 2
}, {
  title: "function 3",
  id: 3
}];

const Demo = () => _react.default.createElement(_react.default.Fragment, null, _react.default.createElement(_ink.Static, null, funcs.map(func => func.title)));

(0, _ink.render)(_react.default.createElement(Demo, null));