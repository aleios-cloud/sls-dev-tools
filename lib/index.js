"use strict";

var _react = _interopRequireDefault(require("react"));

var _ink = require("ink");

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const Demo = () => _react.default.createElement(_ink.Box, null, "Hello World");

(0, _ink.render)(_react.default.createElement(Demo, null));