'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };

var _metalIncrementalDom = require('metal-incremental-dom');

var _metalIncrementalDom2 = _interopRequireDefault(_metalIncrementalDom);

var _JSXRenderer = require('./JSXRenderer');

var _JSXRenderer2 = _interopRequireDefault(_JSXRenderer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * These helpers are all from "babel-plugin-incremental-dom". See its README
 * file for more details:
 * https://github.com/jridgewell/babel-plugin-incremental-dom#runtime
 */

window.iDOMHelpers = window.iDOMHelpers || {};

window.iDOMHelpers.attr = function (value, attrName) {
	IncrementalDOM.attr(attrName, value);
};

window.iDOMHelpers.forOwn = function (object, iterator) {
	var hasOwn = Object.prototype.hasOwnProperty;
	for (var prop in object) {
		if (hasOwn.call(object, prop)) {
			iterator(object[prop], prop);
		}
	}
};

window.iDOMHelpers.jsxWrapper = function (elementClosure, args) {
	var wrapper = args ? function () {
		return elementClosure.apply(this, args);
	} : elementClosure;
	wrapper.__jsxDOMWrapper = true;
	return wrapper;
};

window.iDOMHelpers.renderArbitrary = function (child) {
	var type = typeof child === 'undefined' ? 'undefined' : _typeof(child);
	if (type === 'number' || type === 'string' || child && child instanceof String) {
		IncrementalDOM.text(child);
	} else if (type === 'function' && child.__jsxDOMWrapper) {
		child();
	} else if (Array.isArray(child)) {
		child.forEach(window.iDOMHelpers.renderArbitrary);
	} else if (String(child) === '[object Object]') {
		// Renders special incremental dom nodes in a special way :)
		if (_metalIncrementalDom2.default.isIncDomNode(child)) {
			_metalIncrementalDom2.default.renderChild(child);
		} else {
			window.iDOMHelpers.forOwn(child, window.iDOMHelpers.renderArbitrary);
		}
	} else if (!child) {
		_JSXRenderer2.default.skipChild();
	}
};

exports.default = window.iDOMHelpers;