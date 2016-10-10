'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _metal = require('metal');

var _metalIncrementalDom = require('metal-incremental-dom');

var _metalIncrementalDom2 = _interopRequireDefault(_metalIncrementalDom);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var childrenCount = [];

/**
 * Renderer that handles JSX.
 */

var JSXRenderer = function (_IncrementalDomRender) {
	_inherits(JSXRenderer, _IncrementalDomRender);

	/**
  * @inheritDoc
  */
	function JSXRenderer(comp) {
		_classCallCheck(this, JSXRenderer);

		var _this = _possibleConstructorReturn(this, (JSXRenderer.__proto__ || Object.getPrototypeOf(JSXRenderer)).call(this, comp));

		_this.on(_metalIncrementalDom2.default.ELEMENT_OPENED, _this.handleJSXElementOpened_);
		_this.on(_metalIncrementalDom2.default.ELEMENT_CLOSED, _this.handleJSXElementClosed_);
		return _this;
	}

	/**
  * @inheritDoc
  */


	_createClass(JSXRenderer, [{
		key: 'buildShouldUpdateArgs_',
		value: function buildShouldUpdateArgs_() {
			return [this.changes_, this.propChanges_];
		}

		/**
   * @inheritDoc
   */

	}, {
		key: 'clearChanges_',
		value: function clearChanges_() {
			_get(JSXRenderer.prototype.__proto__ || Object.getPrototypeOf(JSXRenderer.prototype), 'clearChanges_', this).call(this);
			this.propChanges_ = {};
		}

		/**
   * @inheritDoc
   */

	}, {
		key: 'handleDataPropChanged_',
		value: function handleDataPropChanged_(data) {
			if (data.type === 'props') {
				this.propChanges_[data.key] = data;
			} else {
				_get(JSXRenderer.prototype.__proto__ || Object.getPrototypeOf(JSXRenderer.prototype), 'handleDataPropChanged_', this).call(this, data);
			}
		}

		/**
   * Called when an element is opened during render via incremental dom. Adds
   * keys to elements that don't have one yet, according to their position in
   * the parent. This helps use cases that use conditionally rendered elements,
   * which is very common in JSX.
   * @param {!{args: !Array}} data
   * @protected
   */

	}, {
		key: 'handleJSXElementOpened_',
		value: function handleJSXElementOpened_(_ref) {
			var args = _ref.args;

			var count = 0;
			if (childrenCount.length > 0) {
				count = ++childrenCount[childrenCount.length - 1];
			}

			if (!(0, _metal.isDefAndNotNull)(args[1])) {
				if (count) {
					args[1] = JSXRenderer.KEY_PREFIX + count;
				} else {
					// If this is the first node being patched, just repeat the key it
					// used before (if it has been used before).
					var node = IncrementalDOM.currentPointer();
					if (node && node.__incrementalDOMData) {
						args[1] = node.__incrementalDOMData.key;
					}
				}
			}
			childrenCount.push(0);
		}

		/**
   * Called when an element is closed during render via incremental dom.
   * @protected
   */

	}, {
		key: 'handleJSXElementClosed_',
		value: function handleJSXElementClosed_() {
			childrenCount.pop();
		}

		/**
   * @inheritDoc
   */

	}, {
		key: 'hasDataChanged_',
		value: function hasDataChanged_() {
			return _get(JSXRenderer.prototype.__proto__ || Object.getPrototypeOf(JSXRenderer.prototype), 'hasDataChanged_', this).call(this) || Object.keys(this.propChanges_).length > 0;
		}

		/**
   * Overrides the original method from `IncrementalDomRenderer` to handle the
   * case where developers return a child node directly from the "render"
   * function.
   * @override
   */

	}, {
		key: 'renderIncDom',
		value: function renderIncDom() {
			if (this.component_.render) {
				iDOMHelpers.renderArbitrary(this.component_.render());
			} else {
				_get(JSXRenderer.prototype.__proto__ || Object.getPrototypeOf(JSXRenderer.prototype), 'renderIncDom', this).call(this);
			}
		}

		/**
   * Skips the current child in the count (used when a conditional render
   * decided not to render anything).
   */

	}], [{
		key: 'skipChild',
		value: function skipChild() {
			if (childrenCount.length > 0) {
				childrenCount[childrenCount.length - 1]++;
			}
		}
	}]);

	return JSXRenderer;
}(_metalIncrementalDom2.default);

JSXRenderer.KEY_PREFIX = '_metal_jsx_';
JSXRenderer.RENDERER_NAME = 'jsx';

exports.default = JSXRenderer;