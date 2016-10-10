'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _get = function get(object, property, receiver) { if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } };

var _metal = require('metal');

var _metalComponent = require('metal-component');

var _metalState = require('metal-state');

var _metalState2 = _interopRequireDefault(_metalState);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var JSXDataManager = function (_ComponentDataManager) {
	_inherits(JSXDataManager, _ComponentDataManager);

	function JSXDataManager() {
		_classCallCheck(this, JSXDataManager);

		return _possibleConstructorReturn(this, (JSXDataManager.__proto__ || Object.getPrototypeOf(JSXDataManager)).apply(this, arguments));
	}

	_createClass(JSXDataManager, [{
		key: 'add',

		/**
   * Overrides the original method so we can add properties to `props` by default.
   * @param {string} name
   * @param {!Object} config
   * @param {*} opt_initialValue
   * @override
   */
		value: function add() {
			var _props_;

			(_props_ = this.props_).addToState.apply(_props_, arguments);
		}

		/**
   * Manually adds props that weren't configured via `PROPS`.
   * @param {!Object} data
   * @protected
   */

	}, {
		key: 'addUnconfiguredProps_',
		value: function addUnconfiguredProps_(data) {
			var keys = Object.keys(data);
			for (var i = 0; i < keys.length; i++) {
				if (!this.props_.hasStateKey(keys[i])) {
					this.component_.props[keys[i]] = data[keys[i]];
				}
			}
		}

		/**
   * Overrides the original method so that the main `State` instance's data can
   * come from `PROPS` instead of `STATE`.
   * @param {!Object} data
   * @return {!Object}
   * @protected
   * @override
   */

	}, {
		key: 'buildStateInstanceData_',
		value: function buildStateInstanceData_(data) {
			var ctor = this.component_.constructor;
			(0, _metal.mergeSuperClassesProperty)(ctor, 'PROPS', _metalState2.default.mergeState);
			return _metal.object.mixin({}, data, this.component_.constructor.PROPS_MERGED);
		}

		/**
   * Overrides the original method so that we can have two separate `State`
   * instances: one responsible for `state` and another for `props`.
   * @param {!Object} data
   * @protected
   * @override
   */

	}, {
		key: 'createState_',
		value: function createState_(data) {
			var _this2 = this;

			this.component_.props = {};
			_get(JSXDataManager.prototype.__proto__ || Object.getPrototypeOf(JSXDataManager.prototype), 'createState_', this).call(this, data, this.component_.props);
			this.props_ = this.state_;
			this.addUnconfiguredProps_(this.component_.getInitialConfig());

			this.component_.state = {};
			this.state_ = new _metalState2.default({}, this.component_.state, this.component_, {
				internal: true
			});
			this.state_.addToState(this.component_.constructor.STATE_MERGED);

			var listener = function listener() {
				for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
					args[_key] = arguments[_key];
				}

				return _this2.emit_.apply(_this2, args.concat(['state']));
			};
			this.state_.on('stateChanged', listener);
			this.state_.on('stateKeyChanged', listener);
		}

		/**
   * @inheritDoc
   */

	}, {
		key: 'disposeInternal',
		value: function disposeInternal() {
			_get(JSXDataManager.prototype.__proto__ || Object.getPrototypeOf(JSXDataManager.prototype), 'disposeInternal', this).call(this);

			this.props_.dispose();
			this.props_ = null;
		}

		/**
   * Overrides the original method so we can add the data type to the event.
   * @param {!Object} data
   * @param {!Object} event
   * @param {string=} opt_type Either 'props' or 'state'.
   * @protected
   * @override
   */

	}, {
		key: 'emit_',
		value: function emit_(data, event) {
			var opt_type = arguments.length <= 2 || arguments[2] === undefined ? 'props' : arguments[2];

			data.type = opt_type;
			_get(JSXDataManager.prototype.__proto__ || Object.getPrototypeOf(JSXDataManager.prototype), 'emit_', this).call(this, data, event);
		}

		/**
   * Overrides the original method so we can get properties from `props` by
   * default.
   * @param {string} name
   * @return {*}
   * @override
   */

	}, {
		key: 'get',
		value: function get(name) {
			return this.props_.get(name);
		}

		/**
   * Gets the `State` instance being used for "props".
   * @return {!Object}
   */

	}, {
		key: 'getPropsInstance',
		value: function getPropsInstance() {
			return this.props_;
		}

		/**
   * Overrides the original method so we can enable "sync" methods just for
   * `props`.
   * @return {!Array<string>}
   * @override
   */

	}, {
		key: 'getSyncKeys',
		value: function getSyncKeys() {
			return this.props_.getStateKeys();
		}

		/**
   * Overrides the original method so we can replace values in `props`.
   * @param {!Object} data
   * @override
   */

	}, {
		key: 'replaceNonInternal',
		value: function replaceNonInternal(data) {
			var prevProps = _metal.object.mixin({}, this.component_.props);
			_metalComponent.ComponentDataManager.replaceNonInternal(data, this.props_);
			this.addUnconfiguredProps_(data);
			if (this.component_.propsChanged) {
				this.component_.propsChanged(prevProps);
			}
		}
	}]);

	return JSXDataManager;
}(_metalComponent.ComponentDataManager);

JSXDataManager.BLACKLIST = {};

exports.default = JSXDataManager;