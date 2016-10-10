'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.JSXComponent = exports.Config = exports.validators = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

require('./iDOMHelpers');

var _metalState = require('metal-state');

var _metalComponent = require('metal-component');

var _metalComponent2 = _interopRequireDefault(_metalComponent);

var _metalIncrementalDom = require('metal-incremental-dom');

var _metalIncrementalDom2 = _interopRequireDefault(_metalIncrementalDom);

var _JSXDataManager = require('./JSXDataManager');

var _JSXDataManager2 = _interopRequireDefault(_JSXDataManager);

var _JSXRenderer = require('./JSXRenderer');

var _JSXRenderer2 = _interopRequireDefault(_JSXRenderer);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

/**
 * A component that has built-in integration with JSX templates. Example:
 *
 * <code>
 * class MyComponent extends JSXComponent {
 *   render() {
 *     return <div>Hello World</div>
 *   }
 * }
 * </code>
 */
var JSXComponent = function (_Component) {
	_inherits(JSXComponent, _Component);

	function JSXComponent() {
		_classCallCheck(this, JSXComponent);

		return _possibleConstructorReturn(this, (JSXComponent.__proto__ || Object.getPrototypeOf(JSXComponent)).apply(this, arguments));
	}

	_createClass(JSXComponent, null, [{
		key: 'render',

		/**
   * Creates and renders the given function, which can either be a simple
   * JSX function or a component constructor.
   * @param {!function()} fnOrCtor Either be a simple jsx dom function or a
   *     component constructor.
   * @param {Object=} opt_data Optional config data for the function.
   * @param {Element=} opt_element Optional parent for the rendered content.
   * @return {!Component} The rendered component's instance.
   * @override
   */
		value: function render() {
			return _metalIncrementalDom2.default.render.apply(_metalIncrementalDom2.default, arguments);
		}
	}]);

	return JSXComponent;
}(_metalComponent2.default);

JSXComponent.DATA_MANAGER = _JSXDataManager2.default;
JSXComponent.RENDERER = _JSXRenderer2.default;

exports.default = JSXComponent;
exports.validators = _metalState.validators;
exports.Config = _metalState.Config;
exports.JSXComponent = JSXComponent;