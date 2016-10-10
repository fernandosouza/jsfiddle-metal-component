/******/ (function(modules) { // webpackBootstrap
/******/  // The module cache
/******/  var installedModules = {};

/******/  // The require function
/******/  function __webpack_require__(moduleId) {

/******/    // Check if module is in cache
/******/    if(installedModules[moduleId])
/******/      return installedModules[moduleId].exports;

/******/    // Create a new module (and put it into the cache)
/******/    var module = installedModules[moduleId] = {
/******/      exports: {},
/******/      id: moduleId,
/******/      loaded: false
/******/    };

/******/    // Execute the module function
/******/    modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/    // Flag the module as loaded
/******/    module.loaded = true;

/******/    // Return the exports of the module
/******/    return module.exports;
/******/  }


/******/  // expose the modules object (__webpack_modules__)
/******/  __webpack_require__.m = modules;

/******/  // expose the module cache
/******/  __webpack_require__.c = installedModules;

/******/  // __webpack_public_path__
/******/  __webpack_require__.p = "";

/******/  // Load entry module and return exports
/******/  return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  exports.default = function (_ref) {
    var t = _ref.types;
    var _traverse = _ref.traverse;

    function traverse(path, visitor, state) {
      _traverse.explode(visitor);

      var node = path.node;

      if (!node) {
        return;
      }

      var type = node.type;

      var _ref2 = visitor[type] || {};

      var _ref2$enter = _ref2.enter;
      var enter = _ref2$enter === undefined ? [] : _ref2$enter;
      var _ref2$exit = _ref2.exit;
      var exit = _ref2$exit === undefined ? [] : _ref2$exit;


      enter.forEach(function (fn) {
        return fn.call(state, path, state);
      });
      if (!path.shouldSkip) {
        path.traverse(visitor, state);
        exit.forEach(function (fn) {
          return fn.call(state, path, state);
        });
      }
      path.shouldSkip = false;
    }

    var elementVisitor = {
      JSXNamespacedName: function JSXNamespacedName(path) {
        if (!this.opts.namespaceAttributes || path.parentPath.isJSXOpeningElement()) {
          throw path.buildCodeFrameError("JSX Namespaces aren't supported.");
        }
      },


      JSXElement: {
        enter: function enter(path) {
          var secondaryTree = this.secondaryTree;
          var root = this.root;
          var closureVarsStack = this.closureVarsStack;

          var needsWrapper = secondaryTree || root !== path && !(0, _isChildElement2.default)(path, this);

          // If this element needs to be wrapped in a closure, we need to transform
          // it's children without wrapping them.
          if (needsWrapper) {
            // If this element needs a closure wrapper, we need a new array of
            // closure parameters.
            closureVarsStack.push([]);

            var state = Object.assign({}, this, { secondaryTree: false, root: path });
            path.traverse(_extractExpressions2.default, state);
            path.traverse(elementVisitor, state);
          }
        },
        exit: function exit(path) {
          var root = this.root;
          var secondaryTree = this.secondaryTree;
          var replacedElements = this.replacedElements;
          var closureVarsStack = this.closureVarsStack;
          var hoist = this.opts.hoist;

          var childAncestorPath = (0, _isChildElement2.default)(path, this);
          var needsWrapper = secondaryTree || root !== path && !childAncestorPath;

          var parentPath = path.parentPath;

          var explicitReturn = parentPath.isReturnStatement();
          var implicitReturn = parentPath.isArrowFunctionExpression();

          var openingElement = (0, _elementOpenCall2.default)(path.get("openingElement"), this);
          var closingElement = (0, _elementCloseCall2.default)(path.get("openingElement"), this);
          var children = (0, _buildChildren2.default)(path.get("children"), this);

          var elements = [openingElement].concat(_toConsumableArray(children));
          if (closingElement) {
            elements.push(closingElement);
          }

          // Expressions Containers must contain an expression and not statements.
          // This will be flattened out into statements later.
          if (!needsWrapper && parentPath.isJSX()) {
            var sequence = t.sequenceExpression(elements);
            // Mark this sequence as a JSX Element so we can avoid an unnecessary
            // renderArbitrary call.
            replacedElements.add(sequence);
            path.replaceWith(sequence);
            return;
          }

          if (explicitReturn || implicitReturn || needsWrapper) {
            // Transform (recursively) any sequence expressions into a series of
            // statements.
            elements = (0, _flattenExpressions2.default)(elements);

            // Ensure the last statement returns the DOM element.
            elements = (0, _statementsWithReturnLast2.default)(elements);
          }

          if (needsWrapper) {
            // Create a wrapper around our element, and mark it as a one so later
            // child expressions can identify and "render" it.
            var closureVars = closureVarsStack.pop();
            var params = closureVars.map(function (e) {
              return e.id;
            });
            var wrapper = t.functionExpression(null, params, t.blockStatement(elements));

            if (hoist) {
              wrapper = (0, _hoist.addHoistedDeclarator)(path.scope, "wrapper", wrapper, this);
            }

            var args = [wrapper];
            if (closureVars.length) {
              var paramArgs = closureVars.map(function (e) {
                return e.init;
              });
              args.push(t.arrayExpression(paramArgs));
            }

            var wrapperCall = (0, _toFunctionCall2.default)((0, _jsxWrapper2.default)(this), args);
            replacedElements.add(wrapperCall);
            path.replaceWith(wrapperCall);
            return;
          }

          if (childAncestorPath) {
            replacedElements.add(childAncestorPath.node);
          }

          // This is the main JSX element. Replace the return statement
          // with all the nested calls, returning the main JSX element.
          if (explicitReturn) {
            parentPath.replaceWithMultiple(elements);
          } else {
            path.replaceWithMultiple(elements);
          }
        }
      }
    };

    var rootElementVisitor = {
      JSXElement: function JSXElement(path) {
        var previousRoot = this.root;
        var sameLevel = !previousRoot || previousRoot.getFunctionParent() === path.getFunctionParent();

        if (sameLevel && (0, _isRootJsx2.default)(path)) {
          this.root = path;
          var state = Object.assign({}, this, {
            secondaryTree: !(0, _isReturned2.default)(path)
          });

          traverse(path, elementVisitor, state);
          return;
        }

        this.elements++;
        path.skip();
      }
    };

    // This visitor first finds the root element, and ignores all the others.
    return {
      inherits: _babelPluginSyntaxJsx2.default,

      visitor: {
        Program: {
          enter: function enter(path) {
            if (this.opts.inlineExpressions) {
              path.traverse(_inlineExpressions2.default);
            }
            (0, _inject.setupInjector)(this);
            (0, _hoist.setupHoists)(this);
          },
          exit: function exit(path) {
            path.traverse(elementVisitor, {
              secondaryTree: true,
              root: null,
              replacedElements: new Set(),
              closureVarsStack: [],
              file: this.file,
              opts: this.opts
            });

            (0, _hoist.hoist)(path, this);
            (0, _inject.injectHelpers)(this);
          }
        },

        Function: {
          exit: function exit(path) {
            var state = {
              elements: 0,
              secondaryTree: false,
              root: null,
              replacedElements: new Set(),
              closureVarsStack: [],
              file: this.file,
              opts: this.opts
            };

            path.traverse(rootElementVisitor, state);

            if (state.elements > 0 && state.root) {
              state.secondaryTree = true;
              path.traverse(elementVisitor, state);
            }
          }
        }
      }
    };
  };

  var _isRootJsx = __webpack_require__(1);

  var _isRootJsx2 = _interopRequireDefault(_isRootJsx);

  var _isReturned = __webpack_require__(2);

  var _isReturned2 = _interopRequireDefault(_isReturned);

  var _isChildElement = __webpack_require__(3);

  var _isChildElement2 = _interopRequireDefault(_isChildElement);

  var _inject = __webpack_require__(4);

  var _hoist = __webpack_require__(276);

  var _extractExpressions = __webpack_require__(277);

  var _extractExpressions2 = _interopRequireDefault(_extractExpressions);

  var _inlineExpressions = __webpack_require__(279);

  var _inlineExpressions2 = _interopRequireDefault(_inlineExpressions);

  var _jsxWrapper = __webpack_require__(280);

  var _jsxWrapper2 = _interopRequireDefault(_jsxWrapper);

  var _toFunctionCall = __webpack_require__(281);

  var _toFunctionCall2 = _interopRequireDefault(_toFunctionCall);

  var _flattenExpressions = __webpack_require__(282);

  var _flattenExpressions2 = _interopRequireDefault(_flattenExpressions);

  var _statementsWithReturnLast = __webpack_require__(284);

  var _statementsWithReturnLast2 = _interopRequireDefault(_statementsWithReturnLast);

  var _elementOpenCall = __webpack_require__(285);

  var _elementOpenCall2 = _interopRequireDefault(_elementOpenCall);

  var _elementCloseCall = __webpack_require__(319);

  var _elementCloseCall2 = _interopRequireDefault(_elementCloseCall);

  var _buildChildren = __webpack_require__(320);

  var _buildChildren2 = _interopRequireDefault(_buildChildren);

  var _babelPluginSyntaxJsx = __webpack_require__(323);

  var _babelPluginSyntaxJsx2 = _interopRequireDefault(_babelPluginSyntaxJsx);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = isRootJSX;

  var _isReturned = __webpack_require__(2);

  var _isReturned2 = _interopRequireDefault(_isReturned);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  var rootElementFinder = {
    JSXElement: function JSXElement(path, state) {
      var jsx = state.jsx;
      var crossedFunction = state.crossedFunction;

      // No need to traverse our JSX element.

      if (path === jsx) {
        path.skip();
        return;
      }

      var returned = (0, _isReturned2.default)(jsx);
      var otherIsReturned = (0, _isReturned2.default)(path);

      // We're looking for a root element, which must be returned by the function.
      if (otherIsReturned && (crossedFunction || !returned)) {
        state.root = false;
        path.stop();
      }
    },


    // Don't traverse into other functions, since they cannot contain the root.
    Function: function Function(path) {
      path.skip();
    }
  };

  // Detects if this JSX element is the root element.
  // It is not the root if there is another root element in this
  // or a higher function scope.
  function isRootJSX(path) {
    var state = {
      root: true,
      crossedFunction: false,
      jsx: path
    };

    path.findParent(function (path) {
      if (path.isJSXElement()) {
        state.root = false;
      } else if (path.isFunction() || path.isProgram()) {
        path.traverse(rootElementFinder, state);
        state.crossedFunction = true;
      }

      // End early if another JSXElement is found.
      return !state.root;
    });

    return state.root;
  }

/***/ },
/* 2 */
/***/ function(module, exports) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = isReturned;
  // This node is returned if it's parent is explicitly or
  // implicitly returned.
  function isReturned(path) {
    var parent = path.parentPath;
    return parent.isReturnStatement() || parent.isArrowFunctionExpression();
  }

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = childAncestor;

  var _isRootJsx = __webpack_require__(1);

  var _isRootJsx2 = _interopRequireDefault(_isRootJsx);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // It is only a child if it is a descendant of a JSX element but not a
  // JSX Attribute.
  function descendant(path) {
    var isChild = false;

    var direct = directChild(path);
    if (direct) {
      return direct;
    }

    path.findParent(function (path) {
      if (path.isJSXAttribute()) {
        // Stop traversing, we are not a child.
        return true;
      }

      if (path.isJSXElement()) {
        if (!directChild(path)) {
          // This element is the top of a tree of JSX elements
          // If it's the root tree, we are a child.
          isChild = (0, _isRootJsx2.default)(path);
          return true;
        }
      }
    });

    if (!isChild) {
      return null;
    }

    return path.findParent(function (path) {
      return !path.parentPath || path.parentPath.isJSX();
    });
  }

  // It is only a child if it's immediate parent is a JSX element,
  // or it is an ExpressionContainer who's parent is.
  function directChild(path) {
    var isChild = false;
    var child = path;
    var last = path;

    while (path = path.parentPath) {
      if (path.isJSXElement()) {
        isChild = true;
        break;
      }

      if (path.isJSXExpressionContainer()) {
        // Defer to what the parent is.
        continue;
      }

      if (path.isSequenceExpression()) {
        var expressions = path.get("expressions");
        // If we didn't traverse up from the last expression, we're not really
        // a child.
        if (expressions[expressions.length - 1] !== last) {
          break;
        }

        // Sequence expressions can be considered a child JSX element if the element
        // was the last expression.
        if (last.isJSXElement()) {
          child = path;
        }
      } else if (!(path.isConditionalExpression() || path.isLogicalExpression())) {
        break;
      }

      last = path;
    }

    return isChild ? child : null;
  }

  function useFastRoot(path, _ref) {
    var _ref$fastRoot = _ref.fastRoot;
    var fastRoot = _ref$fastRoot === undefined ? false : _ref$fastRoot;

    path.find(function (path) {
      var comments = path.node.leadingComments;

      return comments && comments.find(function (comment) {
        var match = /@incremental-dom.+(enable|disable)-fastRoot/.exec(comment.value);

        if (match) {
          fastRoot = match[1] === "enable";
          return true;
        }
      });
    });

    return fastRoot;
  }

  // Detects if this element is not a child of another JSX element
  function childAncestor(path, _ref2) {
    var opts = _ref2.opts;

    return (useFastRoot(path, opts) ? descendant : directChild)(path);
  }

/***/ },
/* 4 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.setupInjector = setupInjector;
  exports.injectHelpers = injectHelpers;
  exports.default = inject;

  var _toReference = __webpack_require__(5);

  var _toReference2 = _interopRequireDefault(_toReference);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  var namespace = "incremental-dom-helpers";

  function getHelperRef(_ref, helper) {
    var file = _ref.file;
    var opts = _ref.opts;

    var runtime = opts.runtime;
    if (runtime) {
      return (0, _toReference2.default)(runtime + "." + helper);
    }

    var injectedHelper = file.get(namespace)[helper];
    return injectedHelper ? injectedHelper.ref : null;
  }

  function setHelper(_ref2, helper, value) {
    var file = _ref2.file;

    return file.get(namespace)[helper] = value;
  }

  // Sets up the needed data maps for injecting runtime helpers.
  function setupInjector(_ref3) {
    var file = _ref3.file;

    // A map to store helper variable references
    // for each file
    file.set(namespace, Object.create(null));
  }

  function injectHelpers(_ref4) {
    var file = _ref4.file;

    var injectedHelpers = file.get(namespace);

    for (var helper in injectedHelpers) {
      var _injectedHelpers$help = injectedHelpers[helper];
      var ref = _injectedHelpers$help.ref;
      var expression = _injectedHelpers$help.expression;

      file.scope.push({
        id: ref,
        init: expression,
        unique: true
      });
    }
  }

  // Injects a helper function defined by helperAstFn into the current file at
  // the top scope.
  function inject(plugin, helper, helperAstFn) {
    var dependencyInjectors = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};

    var ref = getHelperRef(plugin, helper);
    if (ref) {
      return ref;
    }

    ref = plugin.file.scope.generateUidIdentifier(helper);
    var expression = null;

    var injectedHelper = { ref: ref, expression: expression };
    setHelper(plugin, helper, injectedHelper);

    var dependencyRefs = {};

    for (var dependency in dependencyInjectors) {
      var dependencyRef = getHelperRef(plugin, dependency);

      if (!dependencyRef) {
        dependencyRef = dependencyInjectors[dependency](plugin);
      }

      dependencyRefs[dependency] = dependencyRef;
    }

    injectedHelper.expression = helperAstFn(plugin, injectedHelper.ref, dependencyRefs);

    return ref;
  }

/***/ },
/* 5 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = toReference;

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  // Helper to transform a JSX identifier into a normal reference.
  function toReference(node) {
    var identifier = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    if (typeof node === "string") {
      return node.split(".").map(function (s) {
        return t.identifier(s);
      }).reduce(function (obj, prop) {
        return t.memberExpression(obj, prop);
      });
    }

    if (t.isJSXIdentifier(node)) {
      return identifier ? t.identifier(node.name) : t.stringLiteral(node.name);
    }

    if (t.isJSXMemberExpression(node)) {
      return t.memberExpression(toReference(node.object, true), toReference(node.property, true));
    }

    return node;
  }

/***/ },
/* 6 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  exports.__esModule = true;
  exports.createTypeAnnotationBasedOnTypeof = exports.removeTypeDuplicates = exports.createUnionTypeAnnotation = exports.valueToNode = exports.toBlock = exports.toExpression = exports.toStatement = exports.toBindingIdentifierName = exports.toIdentifier = exports.toKeyAlias = exports.toSequenceExpression = exports.toComputedKey = exports.isImmutable = exports.isScope = exports.isSpecifierDefault = exports.isVar = exports.isBlockScoped = exports.isLet = exports.isValidIdentifier = exports.isReferenced = exports.isBinding = exports.getOuterBindingIdentifiers = exports.getBindingIdentifiers = exports.TYPES = exports.react = exports.DEPRECATED_KEYS = exports.BUILDER_KEYS = exports.NODE_FIELDS = exports.ALIAS_KEYS = exports.VISITOR_KEYS = exports.NOT_LOCAL_BINDING = exports.BLOCK_SCOPED_SYMBOL = exports.INHERIT_KEYS = exports.UNARY_OPERATORS = exports.STRING_UNARY_OPERATORS = exports.NUMBER_UNARY_OPERATORS = exports.BOOLEAN_UNARY_OPERATORS = exports.BINARY_OPERATORS = exports.NUMBER_BINARY_OPERATORS = exports.BOOLEAN_BINARY_OPERATORS = exports.COMPARISON_BINARY_OPERATORS = exports.EQUALITY_BINARY_OPERATORS = exports.BOOLEAN_NUMBER_BINARY_OPERATORS = exports.UPDATE_OPERATORS = exports.LOGICAL_OPERATORS = exports.COMMENT_KEYS = exports.FOR_INIT_KEYS = exports.FLATTENABLE_KEYS = exports.STATEMENT_OR_BLOCK_KEYS = undefined;

  var _getOwnPropertySymbols = __webpack_require__(7);

  var _getOwnPropertySymbols2 = _interopRequireDefault(_getOwnPropertySymbols);

  var _getIterator2 = __webpack_require__(58);

  var _getIterator3 = _interopRequireDefault(_getIterator2);

  var _keys = __webpack_require__(74);

  var _keys2 = _interopRequireDefault(_keys);

  var _stringify = __webpack_require__(78);

  var _stringify2 = _interopRequireDefault(_stringify);

  var _constants = __webpack_require__(80);

  Object.defineProperty(exports, "STATEMENT_OR_BLOCK_KEYS", {
    enumerable: true,
    get: function get() {
      return _constants.STATEMENT_OR_BLOCK_KEYS;
    }
  });
  Object.defineProperty(exports, "FLATTENABLE_KEYS", {
    enumerable: true,
    get: function get() {
      return _constants.FLATTENABLE_KEYS;
    }
  });
  Object.defineProperty(exports, "FOR_INIT_KEYS", {
    enumerable: true,
    get: function get() {
      return _constants.FOR_INIT_KEYS;
    }
  });
  Object.defineProperty(exports, "COMMENT_KEYS", {
    enumerable: true,
    get: function get() {
      return _constants.COMMENT_KEYS;
    }
  });
  Object.defineProperty(exports, "LOGICAL_OPERATORS", {
    enumerable: true,
    get: function get() {
      return _constants.LOGICAL_OPERATORS;
    }
  });
  Object.defineProperty(exports, "UPDATE_OPERATORS", {
    enumerable: true,
    get: function get() {
      return _constants.UPDATE_OPERATORS;
    }
  });
  Object.defineProperty(exports, "BOOLEAN_NUMBER_BINARY_OPERATORS", {
    enumerable: true,
    get: function get() {
      return _constants.BOOLEAN_NUMBER_BINARY_OPERATORS;
    }
  });
  Object.defineProperty(exports, "EQUALITY_BINARY_OPERATORS", {
    enumerable: true,
    get: function get() {
      return _constants.EQUALITY_BINARY_OPERATORS;
    }
  });
  Object.defineProperty(exports, "COMPARISON_BINARY_OPERATORS", {
    enumerable: true,
    get: function get() {
      return _constants.COMPARISON_BINARY_OPERATORS;
    }
  });
  Object.defineProperty(exports, "BOOLEAN_BINARY_OPERATORS", {
    enumerable: true,
    get: function get() {
      return _constants.BOOLEAN_BINARY_OPERATORS;
    }
  });
  Object.defineProperty(exports, "NUMBER_BINARY_OPERATORS", {
    enumerable: true,
    get: function get() {
      return _constants.NUMBER_BINARY_OPERATORS;
    }
  });
  Object.defineProperty(exports, "BINARY_OPERATORS", {
    enumerable: true,
    get: function get() {
      return _constants.BINARY_OPERATORS;
    }
  });
  Object.defineProperty(exports, "BOOLEAN_UNARY_OPERATORS", {
    enumerable: true,
    get: function get() {
      return _constants.BOOLEAN_UNARY_OPERATORS;
    }
  });
  Object.defineProperty(exports, "NUMBER_UNARY_OPERATORS", {
    enumerable: true,
    get: function get() {
      return _constants.NUMBER_UNARY_OPERATORS;
    }
  });
  Object.defineProperty(exports, "STRING_UNARY_OPERATORS", {
    enumerable: true,
    get: function get() {
      return _constants.STRING_UNARY_OPERATORS;
    }
  });
  Object.defineProperty(exports, "UNARY_OPERATORS", {
    enumerable: true,
    get: function get() {
      return _constants.UNARY_OPERATORS;
    }
  });
  Object.defineProperty(exports, "INHERIT_KEYS", {
    enumerable: true,
    get: function get() {
      return _constants.INHERIT_KEYS;
    }
  });
  Object.defineProperty(exports, "BLOCK_SCOPED_SYMBOL", {
    enumerable: true,
    get: function get() {
      return _constants.BLOCK_SCOPED_SYMBOL;
    }
  });
  Object.defineProperty(exports, "NOT_LOCAL_BINDING", {
    enumerable: true,
    get: function get() {
      return _constants.NOT_LOCAL_BINDING;
    }
  });
  exports.is = is;
  exports.isType = isType;
  exports.validate = validate;
  exports.shallowEqual = shallowEqual;
  exports.appendToMemberExpression = appendToMemberExpression;
  exports.prependToMemberExpression = prependToMemberExpression;
  exports.ensureBlock = ensureBlock;
  exports.clone = clone;
  exports.cloneWithoutLoc = cloneWithoutLoc;
  exports.cloneDeep = cloneDeep;
  exports.buildMatchMemberExpression = buildMatchMemberExpression;
  exports.removeComments = removeComments;
  exports.inheritsComments = inheritsComments;
  exports.inheritTrailingComments = inheritTrailingComments;
  exports.inheritLeadingComments = inheritLeadingComments;
  exports.inheritInnerComments = inheritInnerComments;
  exports.inherits = inherits;
  exports.assertNode = assertNode;
  exports.isNode = isNode;
  exports.traverseFast = traverseFast;
  exports.removeProperties = removeProperties;
  exports.removePropertiesDeep = removePropertiesDeep;

  var _retrievers = __webpack_require__(83);

  Object.defineProperty(exports, "getBindingIdentifiers", {
    enumerable: true,
    get: function get() {
      return _retrievers.getBindingIdentifiers;
    }
  });
  Object.defineProperty(exports, "getOuterBindingIdentifiers", {
    enumerable: true,
    get: function get() {
      return _retrievers.getOuterBindingIdentifiers;
    }
  });

  var _validators = __webpack_require__(87);

  Object.defineProperty(exports, "isBinding", {
    enumerable: true,
    get: function get() {
      return _validators.isBinding;
    }
  });
  Object.defineProperty(exports, "isReferenced", {
    enumerable: true,
    get: function get() {
      return _validators.isReferenced;
    }
  });
  Object.defineProperty(exports, "isValidIdentifier", {
    enumerable: true,
    get: function get() {
      return _validators.isValidIdentifier;
    }
  });
  Object.defineProperty(exports, "isLet", {
    enumerable: true,
    get: function get() {
      return _validators.isLet;
    }
  });
  Object.defineProperty(exports, "isBlockScoped", {
    enumerable: true,
    get: function get() {
      return _validators.isBlockScoped;
    }
  });
  Object.defineProperty(exports, "isVar", {
    enumerable: true,
    get: function get() {
      return _validators.isVar;
    }
  });
  Object.defineProperty(exports, "isSpecifierDefault", {
    enumerable: true,
    get: function get() {
      return _validators.isSpecifierDefault;
    }
  });
  Object.defineProperty(exports, "isScope", {
    enumerable: true,
    get: function get() {
      return _validators.isScope;
    }
  });
  Object.defineProperty(exports, "isImmutable", {
    enumerable: true,
    get: function get() {
      return _validators.isImmutable;
    }
  });

  var _converters = __webpack_require__(92);

  Object.defineProperty(exports, "toComputedKey", {
    enumerable: true,
    get: function get() {
      return _converters.toComputedKey;
    }
  });
  Object.defineProperty(exports, "toSequenceExpression", {
    enumerable: true,
    get: function get() {
      return _converters.toSequenceExpression;
    }
  });
  Object.defineProperty(exports, "toKeyAlias", {
    enumerable: true,
    get: function get() {
      return _converters.toKeyAlias;
    }
  });
  Object.defineProperty(exports, "toIdentifier", {
    enumerable: true,
    get: function get() {
      return _converters.toIdentifier;
    }
  });
  Object.defineProperty(exports, "toBindingIdentifierName", {
    enumerable: true,
    get: function get() {
      return _converters.toBindingIdentifierName;
    }
  });
  Object.defineProperty(exports, "toStatement", {
    enumerable: true,
    get: function get() {
      return _converters.toStatement;
    }
  });
  Object.defineProperty(exports, "toExpression", {
    enumerable: true,
    get: function get() {
      return _converters.toExpression;
    }
  });
  Object.defineProperty(exports, "toBlock", {
    enumerable: true,
    get: function get() {
      return _converters.toBlock;
    }
  });
  Object.defineProperty(exports, "valueToNode", {
    enumerable: true,
    get: function get() {
      return _converters.valueToNode;
    }
  });

  var _flow = __webpack_require__(110);

  Object.defineProperty(exports, "createUnionTypeAnnotation", {
    enumerable: true,
    get: function get() {
      return _flow.createUnionTypeAnnotation;
    }
  });
  Object.defineProperty(exports, "removeTypeDuplicates", {
    enumerable: true,
    get: function get() {
      return _flow.removeTypeDuplicates;
    }
  });
  Object.defineProperty(exports, "createTypeAnnotationBasedOnTypeof", {
    enumerable: true,
    get: function get() {
      return _flow.createTypeAnnotationBasedOnTypeof;
    }
  });

  var _toFastProperties = __webpack_require__(111);

  var _toFastProperties2 = _interopRequireDefault(_toFastProperties);

  var _compact = __webpack_require__(112);

  var _compact2 = _interopRequireDefault(_compact);

  var _clone = __webpack_require__(113);

  var _clone2 = _interopRequireDefault(_clone);

  var _each = __webpack_require__(206);

  var _each2 = _interopRequireDefault(_each);

  var _uniq = __webpack_require__(249);

  var _uniq2 = _interopRequireDefault(_uniq);

  __webpack_require__(259);

  var _definitions = __webpack_require__(260);

  var _react2 = __webpack_require__(275);

  var _react = _interopRequireWildcard(_react2);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }newObj.default = obj;return newObj;
    }
  }

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var t = exports;

  function registerType(type) {
    var is = t["is" + type];
    if (!is) {
      is = t["is" + type] = function (node, opts) {
        return t.is(type, node, opts);
      };
    }

    t["assert" + type] = function (node, opts) {
      opts = opts || {};
      if (!is(node, opts)) {
        throw new Error("Expected type " + (0, _stringify2.default)(type) + " with option " + (0, _stringify2.default)(opts));
      }
    };
  }

  exports.VISITOR_KEYS = _definitions.VISITOR_KEYS;
  exports.ALIAS_KEYS = _definitions.ALIAS_KEYS;
  exports.NODE_FIELDS = _definitions.NODE_FIELDS;
  exports.BUILDER_KEYS = _definitions.BUILDER_KEYS;
  exports.DEPRECATED_KEYS = _definitions.DEPRECATED_KEYS;
  exports.react = _react;

  for (var type in t.VISITOR_KEYS) {
    registerType(type);
  }

  t.FLIPPED_ALIAS_KEYS = {};

  (0, _each2.default)(t.ALIAS_KEYS, function (aliases, type) {
    (0, _each2.default)(aliases, function (alias) {
      var types = t.FLIPPED_ALIAS_KEYS[alias] = t.FLIPPED_ALIAS_KEYS[alias] || [];
      types.push(type);
    });
  });

  (0, _each2.default)(t.FLIPPED_ALIAS_KEYS, function (types, type) {
    t[type.toUpperCase() + "_TYPES"] = types;
    registerType(type);
  });

  var TYPES = exports.TYPES = (0, _keys2.default)(t.VISITOR_KEYS).concat((0, _keys2.default)(t.FLIPPED_ALIAS_KEYS)).concat((0, _keys2.default)(t.DEPRECATED_KEYS));

  function is(type, node, opts) {
    if (!node) return false;

    var matches = isType(node.type, type);
    if (!matches) return false;

    if (typeof opts === "undefined") {
      return true;
    } else {
      return t.shallowEqual(node, opts);
    }
  }

  function isType(nodeType, targetType) {
    if (nodeType === targetType) return true;

    if (t.ALIAS_KEYS[targetType]) return false;

    var aliases = t.FLIPPED_ALIAS_KEYS[targetType];
    if (aliases) {
      if (aliases[0] === nodeType) return true;

      for (var _iterator = aliases, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : (0, _getIterator3.default)(_iterator);;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var alias = _ref;

        if (nodeType === alias) return true;
      }
    }

    return false;
  }

  (0, _each2.default)(t.BUILDER_KEYS, function (keys, type) {
    function builder() {
      if (arguments.length > keys.length) {
        throw new Error("t." + type + ": Too many arguments passed. Received " + arguments.length + " but can receive " + ("no more than " + keys.length));
      }

      var node = {};
      node.type = type;

      var i = 0;

      for (var _iterator2 = keys, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : (0, _getIterator3.default)(_iterator2);;) {
        var _ref2;

        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          _ref2 = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          _ref2 = _i2.value;
        }

        var _key = _ref2;

        var field = t.NODE_FIELDS[type][_key];

        var arg = arguments[i++];
        if (arg === undefined) arg = (0, _clone2.default)(field.default);

        node[_key] = arg;
      }

      for (var key in node) {
        validate(node, key, node[key]);
      }

      return node;
    }

    t[type] = builder;
    t[type[0].toLowerCase() + type.slice(1)] = builder;
  });

  var _loop = function _loop(_type) {
    var newType = t.DEPRECATED_KEYS[_type];

    function proxy(fn) {
      return function () {
        console.trace("The node type " + _type + " has been renamed to " + newType);
        return fn.apply(this, arguments);
      };
    }

    t[_type] = t[_type[0].toLowerCase() + _type.slice(1)] = proxy(t[newType]);
    t["is" + _type] = proxy(t["is" + newType]);
    t["assert" + _type] = proxy(t["assert" + newType]);
  };

  for (var _type in t.DEPRECATED_KEYS) {
    _loop(_type);
  }

  function validate(node, key, val) {
    if (!node) return;

    var fields = t.NODE_FIELDS[node.type];
    if (!fields) return;

    var field = fields[key];
    if (!field || !field.validate) return;
    if (field.optional && val == null) return;

    field.validate(node, key, val);
  }

  function shallowEqual(actual, expected) {
    var keys = (0, _keys2.default)(expected);

    for (var _iterator3 = keys, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : (0, _getIterator3.default)(_iterator3);;) {
      var _ref3;

      if (_isArray3) {
        if (_i3 >= _iterator3.length) break;
        _ref3 = _iterator3[_i3++];
      } else {
        _i3 = _iterator3.next();
        if (_i3.done) break;
        _ref3 = _i3.value;
      }

      var key = _ref3;

      if (actual[key] !== expected[key]) {
        return false;
      }
    }

    return true;
  }

  function appendToMemberExpression(member, append, computed) {
    member.object = t.memberExpression(member.object, member.property, member.computed);
    member.property = append;
    member.computed = !!computed;
    return member;
  }

  function prependToMemberExpression(member, prepend) {
    member.object = t.memberExpression(prepend, member.object);
    return member;
  }

  function ensureBlock(node) {
    var key = arguments.length <= 1 || arguments[1] === undefined ? "body" : arguments[1];

    return node[key] = t.toBlock(node[key], node);
  }

  function clone(node) {
    var newNode = {};
    for (var key in node) {
      if (key[0] === "_") continue;
      newNode[key] = node[key];
    }
    return newNode;
  }

  function cloneWithoutLoc(node) {
    var newNode = clone(node);
    delete newNode.loc;
    return newNode;
  }

  function cloneDeep(node) {
    var newNode = {};

    for (var key in node) {
      if (key[0] === "_") continue;

      var val = node[key];

      if (val) {
        if (val.type) {
          val = t.cloneDeep(val);
        } else if (Array.isArray(val)) {
          val = val.map(t.cloneDeep);
        }
      }

      newNode[key] = val;
    }

    return newNode;
  }

  function buildMatchMemberExpression(match, allowPartial) {
    var parts = match.split(".");

    return function (member) {
      if (!t.isMemberExpression(member)) return false;

      var search = [member];
      var i = 0;

      while (search.length) {
        var node = search.shift();

        if (allowPartial && i === parts.length) {
          return true;
        }

        if (t.isIdentifier(node)) {
          if (parts[i] !== node.name) return false;
        } else if (t.isStringLiteral(node)) {
          if (parts[i] !== node.value) return false;
        } else if (t.isMemberExpression(node)) {
          if (node.computed && !t.isStringLiteral(node.property)) {
            return false;
          } else {
            search.push(node.object);
            search.push(node.property);
            continue;
          }
        } else {
          return false;
        }

        if (++i > parts.length) {
          return false;
        }
      }

      return true;
    };
  }

  function removeComments(node) {
    for (var _iterator4 = t.COMMENT_KEYS, _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : (0, _getIterator3.default)(_iterator4);;) {
      var _ref4;

      if (_isArray4) {
        if (_i4 >= _iterator4.length) break;
        _ref4 = _iterator4[_i4++];
      } else {
        _i4 = _iterator4.next();
        if (_i4.done) break;
        _ref4 = _i4.value;
      }

      var key = _ref4;

      delete node[key];
    }
    return node;
  }

  function inheritsComments(child, parent) {
    inheritTrailingComments(child, parent);
    inheritLeadingComments(child, parent);
    inheritInnerComments(child, parent);
    return child;
  }

  function inheritTrailingComments(child, parent) {
    _inheritComments("trailingComments", child, parent);
  }

  function inheritLeadingComments(child, parent) {
    _inheritComments("leadingComments", child, parent);
  }

  function inheritInnerComments(child, parent) {
    _inheritComments("innerComments", child, parent);
  }

  function _inheritComments(key, child, parent) {
    if (child && parent) {
      child[key] = (0, _uniq2.default)((0, _compact2.default)([].concat(child[key], parent[key])));
    }
  }

  function inherits(child, parent) {
    if (!child || !parent) return child;

    for (var _iterator5 = t.INHERIT_KEYS.optional, _isArray5 = Array.isArray(_iterator5), _i5 = 0, _iterator5 = _isArray5 ? _iterator5 : (0, _getIterator3.default)(_iterator5);;) {
      var _ref5;

      if (_isArray5) {
        if (_i5 >= _iterator5.length) break;
        _ref5 = _iterator5[_i5++];
      } else {
        _i5 = _iterator5.next();
        if (_i5.done) break;
        _ref5 = _i5.value;
      }

      var _key2 = _ref5;

      if (child[_key2] == null) {
        child[_key2] = parent[_key2];
      }
    }

    for (var key in parent) {
      if (key[0] === "_") child[key] = parent[key];
    }

    for (var _iterator6 = t.INHERIT_KEYS.force, _isArray6 = Array.isArray(_iterator6), _i6 = 0, _iterator6 = _isArray6 ? _iterator6 : (0, _getIterator3.default)(_iterator6);;) {
      var _ref6;

      if (_isArray6) {
        if (_i6 >= _iterator6.length) break;
        _ref6 = _iterator6[_i6++];
      } else {
        _i6 = _iterator6.next();
        if (_i6.done) break;
        _ref6 = _i6.value;
      }

      var _key3 = _ref6;

      child[_key3] = parent[_key3];
    }

    t.inheritsComments(child, parent);

    return child;
  }

  function assertNode(node) {
    if (!isNode(node)) {
      throw new TypeError("Not a valid node " + (node && node.type));
    }
  }

  function isNode(node) {
    return !!(node && _definitions.VISITOR_KEYS[node.type]);
  }

  (0, _toFastProperties2.default)(t);
  (0, _toFastProperties2.default)(t.VISITOR_KEYS);

  function traverseFast(node, enter, opts) {
    if (!node) return;

    var keys = t.VISITOR_KEYS[node.type];
    if (!keys) return;

    opts = opts || {};
    enter(node, opts);

    for (var _iterator7 = keys, _isArray7 = Array.isArray(_iterator7), _i7 = 0, _iterator7 = _isArray7 ? _iterator7 : (0, _getIterator3.default)(_iterator7);;) {
      var _ref7;

      if (_isArray7) {
        if (_i7 >= _iterator7.length) break;
        _ref7 = _iterator7[_i7++];
      } else {
        _i7 = _iterator7.next();
        if (_i7.done) break;
        _ref7 = _i7.value;
      }

      var key = _ref7;

      var subNode = node[key];

      if (Array.isArray(subNode)) {
        for (var _iterator8 = subNode, _isArray8 = Array.isArray(_iterator8), _i8 = 0, _iterator8 = _isArray8 ? _iterator8 : (0, _getIterator3.default)(_iterator8);;) {
          var _ref8;

          if (_isArray8) {
            if (_i8 >= _iterator8.length) break;
            _ref8 = _iterator8[_i8++];
          } else {
            _i8 = _iterator8.next();
            if (_i8.done) break;
            _ref8 = _i8.value;
          }

          var _node = _ref8;

          traverseFast(_node, enter, opts);
        }
      } else {
        traverseFast(subNode, enter, opts);
      }
    }
  }

  var CLEAR_KEYS = ["tokens", "start", "end", "loc", "raw", "rawValue"];

  var CLEAR_KEYS_PLUS_COMMENTS = t.COMMENT_KEYS.concat(["comments"]).concat(CLEAR_KEYS);

  function removeProperties(node, opts) {
    opts = opts || {};
    var map = opts.preserveComments ? CLEAR_KEYS : CLEAR_KEYS_PLUS_COMMENTS;
    for (var _iterator9 = map, _isArray9 = Array.isArray(_iterator9), _i9 = 0, _iterator9 = _isArray9 ? _iterator9 : (0, _getIterator3.default)(_iterator9);;) {
      var _ref9;

      if (_isArray9) {
        if (_i9 >= _iterator9.length) break;
        _ref9 = _iterator9[_i9++];
      } else {
        _i9 = _iterator9.next();
        if (_i9.done) break;
        _ref9 = _i9.value;
      }

      var _key4 = _ref9;

      if (node[_key4] != null) node[_key4] = undefined;
    }

    for (var key in node) {
      if (key[0] === "_" && node[key] != null) node[key] = undefined;
    }

    var syms = (0, _getOwnPropertySymbols2.default)(node);
    for (var _iterator10 = syms, _isArray10 = Array.isArray(_iterator10), _i10 = 0, _iterator10 = _isArray10 ? _iterator10 : (0, _getIterator3.default)(_iterator10);;) {
      var _ref10;

      if (_isArray10) {
        if (_i10 >= _iterator10.length) break;
        _ref10 = _iterator10[_i10++];
      } else {
        _i10 = _iterator10.next();
        if (_i10.done) break;
        _ref10 = _i10.value;
      }

      var sym = _ref10;

      node[sym] = null;
    }
  }

  function removePropertiesDeep(tree, opts) {
    traverseFast(tree, removeProperties, opts);
    return tree;
  }

/***/ },
/* 7 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  module.exports = { "default": __webpack_require__(8), __esModule: true };

/***/ },
/* 8 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  __webpack_require__(9);
  module.exports = __webpack_require__(15).Object.getOwnPropertySymbols;

/***/ },
/* 9 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';
  // ECMAScript 6 symbols shim

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  var global = __webpack_require__(10),
      has = __webpack_require__(11),
      DESCRIPTORS = __webpack_require__(12),
      $export = __webpack_require__(14),
      redefine = __webpack_require__(26),
      META = __webpack_require__(27).KEY,
      $fails = __webpack_require__(13),
      shared = __webpack_require__(29),
      setToStringTag = __webpack_require__(30),
      uid = __webpack_require__(28),
      wks = __webpack_require__(31),
      wksExt = __webpack_require__(32),
      wksDefine = __webpack_require__(33),
      keyOf = __webpack_require__(35),
      enumKeys = __webpack_require__(48),
      isArray = __webpack_require__(51),
      anObject = __webpack_require__(20),
      toIObject = __webpack_require__(38),
      toPrimitive = __webpack_require__(24),
      createDesc = __webpack_require__(25),
      _create = __webpack_require__(52),
      gOPNExt = __webpack_require__(55),
      $GOPD = __webpack_require__(57),
      $DP = __webpack_require__(19),
      $keys = __webpack_require__(36),
      gOPD = $GOPD.f,
      dP = $DP.f,
      gOPN = gOPNExt.f,
      $Symbol = global.Symbol,
      $JSON = global.JSON,
      _stringify = $JSON && $JSON.stringify,
      PROTOTYPE = 'prototype',
      HIDDEN = wks('_hidden'),
      TO_PRIMITIVE = wks('toPrimitive'),
      isEnum = {}.propertyIsEnumerable,
      SymbolRegistry = shared('symbol-registry'),
      AllSymbols = shared('symbols'),
      OPSymbols = shared('op-symbols'),
      ObjectProto = Object[PROTOTYPE],
      USE_NATIVE = typeof $Symbol == 'function',
      QObject = global.QObject;
  // Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
  var setter = !QObject || !QObject[PROTOTYPE] || !QObject[PROTOTYPE].findChild;

  // fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
  var setSymbolDesc = DESCRIPTORS && $fails(function () {
    return _create(dP({}, 'a', {
      get: function get() {
        return dP(this, 'a', { value: 7 }).a;
      }
    })).a != 7;
  }) ? function (it, key, D) {
    var protoDesc = gOPD(ObjectProto, key);
    if (protoDesc) delete ObjectProto[key];
    dP(it, key, D);
    if (protoDesc && it !== ObjectProto) dP(ObjectProto, key, protoDesc);
  } : dP;

  var wrap = function wrap(tag) {
    var sym = AllSymbols[tag] = _create($Symbol[PROTOTYPE]);
    sym._k = tag;
    return sym;
  };

  var isSymbol = USE_NATIVE && _typeof($Symbol.iterator) == 'symbol' ? function (it) {
    return (typeof it === 'undefined' ? 'undefined' : _typeof(it)) == 'symbol';
  } : function (it) {
    return it instanceof $Symbol;
  };

  var $defineProperty = function defineProperty(it, key, D) {
    if (it === ObjectProto) $defineProperty(OPSymbols, key, D);
    anObject(it);
    key = toPrimitive(key, true);
    anObject(D);
    if (has(AllSymbols, key)) {
      if (!D.enumerable) {
        if (!has(it, HIDDEN)) dP(it, HIDDEN, createDesc(1, {}));
        it[HIDDEN][key] = true;
      } else {
        if (has(it, HIDDEN) && it[HIDDEN][key]) it[HIDDEN][key] = false;
        D = _create(D, { enumerable: createDesc(0, false) });
      }return setSymbolDesc(it, key, D);
    }return dP(it, key, D);
  };
  var $defineProperties = function defineProperties(it, P) {
    anObject(it);
    var keys = enumKeys(P = toIObject(P)),
        i = 0,
        l = keys.length,
        key;
    while (l > i) {
      $defineProperty(it, key = keys[i++], P[key]);
    }return it;
  };
  var $create = function create(it, P) {
    return P === undefined ? _create(it) : $defineProperties(_create(it), P);
  };
  var $propertyIsEnumerable = function propertyIsEnumerable(key) {
    var E = isEnum.call(this, key = toPrimitive(key, true));
    if (this === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return false;
    return E || !has(this, key) || !has(AllSymbols, key) || has(this, HIDDEN) && this[HIDDEN][key] ? E : true;
  };
  var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(it, key) {
    it = toIObject(it);
    key = toPrimitive(key, true);
    if (it === ObjectProto && has(AllSymbols, key) && !has(OPSymbols, key)) return;
    var D = gOPD(it, key);
    if (D && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) D.enumerable = true;
    return D;
  };
  var $getOwnPropertyNames = function getOwnPropertyNames(it) {
    var names = gOPN(toIObject(it)),
        result = [],
        i = 0,
        key;
    while (names.length > i) {
      if (!has(AllSymbols, key = names[i++]) && key != HIDDEN && key != META) result.push(key);
    }return result;
  };
  var $getOwnPropertySymbols = function getOwnPropertySymbols(it) {
    var IS_OP = it === ObjectProto,
        names = gOPN(IS_OP ? OPSymbols : toIObject(it)),
        result = [],
        i = 0,
        key;
    while (names.length > i) {
      if (has(AllSymbols, key = names[i++]) && (IS_OP ? has(ObjectProto, key) : true)) result.push(AllSymbols[key]);
    }return result;
  };

  // 19.4.1.1 Symbol([description])
  if (!USE_NATIVE) {
    $Symbol = function _Symbol() {
      if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor!');
      var tag = uid(arguments.length > 0 ? arguments[0] : undefined);
      var $set = function $set(value) {
        if (this === ObjectProto) $set.call(OPSymbols, value);
        if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
        setSymbolDesc(this, tag, createDesc(1, value));
      };
      if (DESCRIPTORS && setter) setSymbolDesc(ObjectProto, tag, { configurable: true, set: $set });
      return wrap(tag);
    };
    redefine($Symbol[PROTOTYPE], 'toString', function toString() {
      return this._k;
    });

    $GOPD.f = $getOwnPropertyDescriptor;
    $DP.f = $defineProperty;
    __webpack_require__(56).f = gOPNExt.f = $getOwnPropertyNames;
    __webpack_require__(50).f = $propertyIsEnumerable;
    __webpack_require__(49).f = $getOwnPropertySymbols;

    if (DESCRIPTORS && !__webpack_require__(34)) {
      redefine(ObjectProto, 'propertyIsEnumerable', $propertyIsEnumerable, true);
    }

    wksExt.f = function (name) {
      return wrap(wks(name));
    };
  }

  $export($export.G + $export.W + $export.F * !USE_NATIVE, { Symbol: $Symbol });

  for (var symbols =
  // 19.4.2.2, 19.4.2.3, 19.4.2.4, 19.4.2.6, 19.4.2.8, 19.4.2.9, 19.4.2.10, 19.4.2.11, 19.4.2.12, 19.4.2.13, 19.4.2.14
  'hasInstance,isConcatSpreadable,iterator,match,replace,search,species,split,toPrimitive,toStringTag,unscopables'.split(','), i = 0; symbols.length > i;) {
    wks(symbols[i++]);
  }for (var symbols = $keys(wks.store), i = 0; symbols.length > i;) {
    wksDefine(symbols[i++]);
  }$export($export.S + $export.F * !USE_NATIVE, 'Symbol', {
    // 19.4.2.1 Symbol.for(key)
    'for': function _for(key) {
      return has(SymbolRegistry, key += '') ? SymbolRegistry[key] : SymbolRegistry[key] = $Symbol(key);
    },
    // 19.4.2.5 Symbol.keyFor(sym)
    keyFor: function keyFor(key) {
      if (isSymbol(key)) return keyOf(SymbolRegistry, key);
      throw TypeError(key + ' is not a symbol!');
    },
    useSetter: function useSetter() {
      setter = true;
    },
    useSimple: function useSimple() {
      setter = false;
    }
  });

  $export($export.S + $export.F * !USE_NATIVE, 'Object', {
    // 19.1.2.2 Object.create(O [, Properties])
    create: $create,
    // 19.1.2.4 Object.defineProperty(O, P, Attributes)
    defineProperty: $defineProperty,
    // 19.1.2.3 Object.defineProperties(O, Properties)
    defineProperties: $defineProperties,
    // 19.1.2.6 Object.getOwnPropertyDescriptor(O, P)
    getOwnPropertyDescriptor: $getOwnPropertyDescriptor,
    // 19.1.2.7 Object.getOwnPropertyNames(O)
    getOwnPropertyNames: $getOwnPropertyNames,
    // 19.1.2.8 Object.getOwnPropertySymbols(O)
    getOwnPropertySymbols: $getOwnPropertySymbols
  });

  // 24.3.2 JSON.stringify(value [, replacer [, space]])
  $JSON && $export($export.S + $export.F * (!USE_NATIVE || $fails(function () {
    var S = $Symbol();
    // MS Edge converts symbol values to JSON as {}
    // WebKit converts symbol values to JSON as null
    // V8 throws on boxed symbols
    return _stringify([S]) != '[null]' || _stringify({ a: S }) != '{}' || _stringify(Object(S)) != '{}';
  })), 'JSON', {
    stringify: function stringify(it) {
      if (it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
      var args = [it],
          i = 1,
          replacer,
          $replacer;
      while (arguments.length > i) {
        args.push(arguments[i++]);
      }replacer = args[1];
      if (typeof replacer == 'function') $replacer = replacer;
      if ($replacer || !isArray(replacer)) replacer = function replacer(key, value) {
        if ($replacer) value = $replacer.call(this, key, value);
        if (!isSymbol(value)) return value;
      };
      args[1] = replacer;
      return _stringify.apply($JSON, args);
    }
  });

  // 19.4.3.4 Symbol.prototype[@@toPrimitive](hint)
  $Symbol[PROTOTYPE][TO_PRIMITIVE] || __webpack_require__(18)($Symbol[PROTOTYPE], TO_PRIMITIVE, $Symbol[PROTOTYPE].valueOf);
  // 19.4.3.5 Symbol.prototype[@@toStringTag]
  setToStringTag($Symbol, 'Symbol');
  // 20.2.1.9 Math[@@toStringTag]
  setToStringTag(Math, 'Math', true);
  // 24.3.3 JSON[@@toStringTag]
  setToStringTag(global.JSON, 'JSON', true);

/***/ },
/* 10 */
/***/ function(module, exports) {

  'use strict';

  // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
  var global = module.exports = typeof window != 'undefined' && window.Math == Math ? window : typeof self != 'undefined' && self.Math == Math ? self : Function('return this')();
  if (typeof __g == 'number') __g = global; // eslint-disable-line no-undef

/***/ },
/* 11 */
/***/ function(module, exports) {

  "use strict";

  var hasOwnProperty = {}.hasOwnProperty;
  module.exports = function (it, key) {
    return hasOwnProperty.call(it, key);
  };

/***/ },
/* 12 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // Thank's IE8 for his funny defineProperty
  module.exports = !__webpack_require__(13)(function () {
    return Object.defineProperty({}, 'a', { get: function get() {
        return 7;
      } }).a != 7;
  });

/***/ },
/* 13 */
/***/ function(module, exports) {

  "use strict";

  module.exports = function (exec) {
    try {
      return !!exec();
    } catch (e) {
      return true;
    }
  };

/***/ },
/* 14 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var global = __webpack_require__(10),
      core = __webpack_require__(15),
      ctx = __webpack_require__(16),
      hide = __webpack_require__(18),
      PROTOTYPE = 'prototype';

  var $export = function $export(type, name, source) {
    var IS_FORCED = type & $export.F,
        IS_GLOBAL = type & $export.G,
        IS_STATIC = type & $export.S,
        IS_PROTO = type & $export.P,
        IS_BIND = type & $export.B,
        IS_WRAP = type & $export.W,
        exports = IS_GLOBAL ? core : core[name] || (core[name] = {}),
        expProto = exports[PROTOTYPE],
        target = IS_GLOBAL ? global : IS_STATIC ? global[name] : (global[name] || {})[PROTOTYPE],
        key,
        own,
        out;
    if (IS_GLOBAL) source = name;
    for (key in source) {
      // contains in native
      own = !IS_FORCED && target && target[key] !== undefined;
      if (own && key in exports) continue;
      // export native or passed
      out = own ? target[key] : source[key];
      // prevent global pollution for namespaces
      exports[key] = IS_GLOBAL && typeof target[key] != 'function' ? source[key]
      // bind timers to global for call from export context
      : IS_BIND && own ? ctx(out, global)
      // wrap global constructors for prevent change them in library
      : IS_WRAP && target[key] == out ? function (C) {
        var F = function F(a, b, c) {
          if (this instanceof C) {
            switch (arguments.length) {
              case 0:
                return new C();
              case 1:
                return new C(a);
              case 2:
                return new C(a, b);
            }return new C(a, b, c);
          }return C.apply(this, arguments);
        };
        F[PROTOTYPE] = C[PROTOTYPE];
        return F;
        // make static versions for prototype methods
      }(out) : IS_PROTO && typeof out == 'function' ? ctx(Function.call, out) : out;
      // export proto methods to core.%CONSTRUCTOR%.methods.%NAME%
      if (IS_PROTO) {
        (exports.virtual || (exports.virtual = {}))[key] = out;
        // export proto methods to core.%CONSTRUCTOR%.prototype.%NAME%
        if (type & $export.R && expProto && !expProto[key]) hide(expProto, key, out);
      }
    }
  };
  // type bitmap
  $export.F = 1; // forced
  $export.G = 2; // global
  $export.S = 4; // static
  $export.P = 8; // proto
  $export.B = 16; // bind
  $export.W = 32; // wrap
  $export.U = 64; // safe
  $export.R = 128; // real proto method for `library` 
  module.exports = $export;

/***/ },
/* 15 */
/***/ function(module, exports) {

  'use strict';

  var core = module.exports = { version: '2.4.0' };
  if (typeof __e == 'number') __e = core; // eslint-disable-line no-undef

/***/ },
/* 16 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // optional / simple context binding
  var aFunction = __webpack_require__(17);
  module.exports = function (fn, that, length) {
    aFunction(fn);
    if (that === undefined) return fn;
    switch (length) {
      case 1:
        return function (a) {
          return fn.call(that, a);
        };
      case 2:
        return function (a, b) {
          return fn.call(that, a, b);
        };
      case 3:
        return function (a, b, c) {
          return fn.call(that, a, b, c);
        };
    }
    return function () /* ...args */{
      return fn.apply(that, arguments);
    };
  };

/***/ },
/* 17 */
/***/ function(module, exports) {

  'use strict';

  module.exports = function (it) {
    if (typeof it != 'function') throw TypeError(it + ' is not a function!');
    return it;
  };

/***/ },
/* 18 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var dP = __webpack_require__(19),
      createDesc = __webpack_require__(25);
  module.exports = __webpack_require__(12) ? function (object, key, value) {
    return dP.f(object, key, createDesc(1, value));
  } : function (object, key, value) {
    object[key] = value;
    return object;
  };

/***/ },
/* 19 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var anObject = __webpack_require__(20),
      IE8_DOM_DEFINE = __webpack_require__(22),
      toPrimitive = __webpack_require__(24),
      dP = Object.defineProperty;

  exports.f = __webpack_require__(12) ? Object.defineProperty : function defineProperty(O, P, Attributes) {
    anObject(O);
    P = toPrimitive(P, true);
    anObject(Attributes);
    if (IE8_DOM_DEFINE) try {
      return dP(O, P, Attributes);
    } catch (e) {/* empty */}
    if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported!');
    if ('value' in Attributes) O[P] = Attributes.value;
    return O;
  };

/***/ },
/* 20 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isObject = __webpack_require__(21);
  module.exports = function (it) {
    if (!isObject(it)) throw TypeError(it + ' is not an object!');
    return it;
  };

/***/ },
/* 21 */
/***/ function(module, exports) {

  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  module.exports = function (it) {
    return (typeof it === 'undefined' ? 'undefined' : _typeof(it)) === 'object' ? it !== null : typeof it === 'function';
  };

/***/ },
/* 22 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  module.exports = !__webpack_require__(12) && !__webpack_require__(13)(function () {
    return Object.defineProperty(__webpack_require__(23)('div'), 'a', { get: function get() {
        return 7;
      } }).a != 7;
  });

/***/ },
/* 23 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isObject = __webpack_require__(21),
      document = __webpack_require__(10).document
  // in old IE typeof document.createElement is 'object'
  ,
      is = isObject(document) && isObject(document.createElement);
  module.exports = function (it) {
    return is ? document.createElement(it) : {};
  };

/***/ },
/* 24 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // 7.1.1 ToPrimitive(input [, PreferredType])
  var isObject = __webpack_require__(21);
  // instead of the ES6 spec version, we didn't implement @@toPrimitive case
  // and the second argument - flag - preferred type is a string
  module.exports = function (it, S) {
    if (!isObject(it)) return it;
    var fn, val;
    if (S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
    if (typeof (fn = it.valueOf) == 'function' && !isObject(val = fn.call(it))) return val;
    if (!S && typeof (fn = it.toString) == 'function' && !isObject(val = fn.call(it))) return val;
    throw TypeError("Can't convert object to primitive value");
  };

/***/ },
/* 25 */
/***/ function(module, exports) {

  "use strict";

  module.exports = function (bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value
    };
  };

/***/ },
/* 26 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  module.exports = __webpack_require__(18);

/***/ },
/* 27 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  var META = __webpack_require__(28)('meta'),
      isObject = __webpack_require__(21),
      has = __webpack_require__(11),
      setDesc = __webpack_require__(19).f,
      id = 0;
  var isExtensible = Object.isExtensible || function () {
    return true;
  };
  var FREEZE = !__webpack_require__(13)(function () {
    return isExtensible(Object.preventExtensions({}));
  });
  var setMeta = function setMeta(it) {
    setDesc(it, META, { value: {
        i: 'O' + ++id, // object ID
        w: {} // weak collections IDs
      } });
  };
  var fastKey = function fastKey(it, create) {
    // return primitive with prefix
    if (!isObject(it)) return (typeof it === 'undefined' ? 'undefined' : _typeof(it)) == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
    if (!has(it, META)) {
      // can't set metadata to uncaught frozen object
      if (!isExtensible(it)) return 'F';
      // not necessary to add metadata
      if (!create) return 'E';
      // add missing metadata
      setMeta(it);
      // return object ID
    }return it[META].i;
  };
  var getWeak = function getWeak(it, create) {
    if (!has(it, META)) {
      // can't set metadata to uncaught frozen object
      if (!isExtensible(it)) return true;
      // not necessary to add metadata
      if (!create) return false;
      // add missing metadata
      setMeta(it);
      // return hash weak collections IDs
    }return it[META].w;
  };
  // add metadata on freeze-family methods calling
  var onFreeze = function onFreeze(it) {
    if (FREEZE && meta.NEED && isExtensible(it) && !has(it, META)) setMeta(it);
    return it;
  };
  var meta = module.exports = {
    KEY: META,
    NEED: false,
    fastKey: fastKey,
    getWeak: getWeak,
    onFreeze: onFreeze
  };

/***/ },
/* 28 */
/***/ function(module, exports) {

  'use strict';

  var id = 0,
      px = Math.random();
  module.exports = function (key) {
    return 'Symbol('.concat(key === undefined ? '' : key, ')_', (++id + px).toString(36));
  };

/***/ },
/* 29 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var global = __webpack_require__(10),
      SHARED = '__core-js_shared__',
      store = global[SHARED] || (global[SHARED] = {});
  module.exports = function (key) {
    return store[key] || (store[key] = {});
  };

/***/ },
/* 30 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var def = __webpack_require__(19).f,
      has = __webpack_require__(11),
      TAG = __webpack_require__(31)('toStringTag');

  module.exports = function (it, tag, stat) {
    if (it && !has(it = stat ? it : it.prototype, TAG)) def(it, TAG, { configurable: true, value: tag });
  };

/***/ },
/* 31 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var store = __webpack_require__(29)('wks'),
      uid = __webpack_require__(28),
      _Symbol = __webpack_require__(10).Symbol,
      USE_SYMBOL = typeof _Symbol == 'function';

  var $exports = module.exports = function (name) {
    return store[name] || (store[name] = USE_SYMBOL && _Symbol[name] || (USE_SYMBOL ? _Symbol : uid)('Symbol.' + name));
  };

  $exports.store = store;

/***/ },
/* 32 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  exports.f = __webpack_require__(31);

/***/ },
/* 33 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var global = __webpack_require__(10),
      core = __webpack_require__(15),
      LIBRARY = __webpack_require__(34),
      wksExt = __webpack_require__(32),
      defineProperty = __webpack_require__(19).f;
  module.exports = function (name) {
    var $Symbol = core.Symbol || (core.Symbol = LIBRARY ? {} : global.Symbol || {});
    if (name.charAt(0) != '_' && !(name in $Symbol)) defineProperty($Symbol, name, { value: wksExt.f(name) });
  };

/***/ },
/* 34 */
/***/ function(module, exports) {

  "use strict";

  module.exports = true;

/***/ },
/* 35 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var getKeys = __webpack_require__(36),
      toIObject = __webpack_require__(38);
  module.exports = function (object, el) {
    var O = toIObject(object),
        keys = getKeys(O),
        length = keys.length,
        index = 0,
        key;
    while (length > index) {
      if (O[key = keys[index++]] === el) return key;
    }
  };

/***/ },
/* 36 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // 19.1.2.14 / 15.2.3.14 Object.keys(O)
  var $keys = __webpack_require__(37),
      enumBugKeys = __webpack_require__(47);

  module.exports = Object.keys || function keys(O) {
    return $keys(O, enumBugKeys);
  };

/***/ },
/* 37 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var has = __webpack_require__(11),
      toIObject = __webpack_require__(38),
      arrayIndexOf = __webpack_require__(42)(false),
      IE_PROTO = __webpack_require__(46)('IE_PROTO');

  module.exports = function (object, names) {
    var O = toIObject(object),
        i = 0,
        result = [],
        key;
    for (key in O) {
      if (key != IE_PROTO) has(O, key) && result.push(key);
    } // Don't enum bug & hidden keys
    while (names.length > i) {
      if (has(O, key = names[i++])) {
        ~arrayIndexOf(result, key) || result.push(key);
      }
    }return result;
  };

/***/ },
/* 38 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // to indexed object, toObject with fallback for non-array-like ES3 strings
  var IObject = __webpack_require__(39),
      defined = __webpack_require__(41);
  module.exports = function (it) {
    return IObject(defined(it));
  };

/***/ },
/* 39 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // fallback for non-array-like ES3 and non-enumerable old V8 strings
  var cof = __webpack_require__(40);
  module.exports = Object('z').propertyIsEnumerable(0) ? Object : function (it) {
    return cof(it) == 'String' ? it.split('') : Object(it);
  };

/***/ },
/* 40 */
/***/ function(module, exports) {

  "use strict";

  var toString = {}.toString;

  module.exports = function (it) {
    return toString.call(it).slice(8, -1);
  };

/***/ },
/* 41 */
/***/ function(module, exports) {

  "use strict";

  // 7.2.1 RequireObjectCoercible(argument)
  module.exports = function (it) {
    if (it == undefined) throw TypeError("Can't call method on  " + it);
    return it;
  };

/***/ },
/* 42 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // false -> Array#indexOf
  // true  -> Array#includes
  var toIObject = __webpack_require__(38),
      toLength = __webpack_require__(43),
      toIndex = __webpack_require__(45);
  module.exports = function (IS_INCLUDES) {
    return function ($this, el, fromIndex) {
      var O = toIObject($this),
          length = toLength(O.length),
          index = toIndex(fromIndex, length),
          value;
      // Array#includes uses SameValueZero equality algorithm
      if (IS_INCLUDES && el != el) while (length > index) {
        value = O[index++];
        if (value != value) return true;
        // Array#toIndex ignores holes, Array#includes - not
      } else for (; length > index; index++) {
        if (IS_INCLUDES || index in O) {
          if (O[index] === el) return IS_INCLUDES || index || 0;
        }
      }return !IS_INCLUDES && -1;
    };
  };

/***/ },
/* 43 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // 7.1.15 ToLength
  var toInteger = __webpack_require__(44),
      min = Math.min;
  module.exports = function (it) {
    return it > 0 ? min(toInteger(it), 0x1fffffffffffff) : 0; // pow(2, 53) - 1 == 9007199254740991
  };

/***/ },
/* 44 */
/***/ function(module, exports) {

  "use strict";

  // 7.1.4 ToInteger
  var ceil = Math.ceil,
      floor = Math.floor;
  module.exports = function (it) {
    return isNaN(it = +it) ? 0 : (it > 0 ? floor : ceil)(it);
  };

/***/ },
/* 45 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var toInteger = __webpack_require__(44),
      max = Math.max,
      min = Math.min;
  module.exports = function (index, length) {
    index = toInteger(index);
    return index < 0 ? max(index + length, 0) : min(index, length);
  };

/***/ },
/* 46 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var shared = __webpack_require__(29)('keys'),
      uid = __webpack_require__(28);
  module.exports = function (key) {
    return shared[key] || (shared[key] = uid(key));
  };

/***/ },
/* 47 */
/***/ function(module, exports) {

  'use strict';

  // IE 8- don't enum bug keys
  module.exports = 'constructor,hasOwnProperty,isPrototypeOf,propertyIsEnumerable,toLocaleString,toString,valueOf'.split(',');

/***/ },
/* 48 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // all enumerable object keys, includes symbols
  var getKeys = __webpack_require__(36),
      gOPS = __webpack_require__(49),
      pIE = __webpack_require__(50);
  module.exports = function (it) {
    var result = getKeys(it),
        getSymbols = gOPS.f;
    if (getSymbols) {
      var symbols = getSymbols(it),
          isEnum = pIE.f,
          i = 0,
          key;
      while (symbols.length > i) {
        if (isEnum.call(it, key = symbols[i++])) result.push(key);
      }
    }return result;
  };

/***/ },
/* 49 */
/***/ function(module, exports) {

  "use strict";

  exports.f = Object.getOwnPropertySymbols;

/***/ },
/* 50 */
/***/ function(module, exports) {

  "use strict";

  exports.f = {}.propertyIsEnumerable;

/***/ },
/* 51 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // 7.2.2 IsArray(argument)
  var cof = __webpack_require__(40);
  module.exports = Array.isArray || function isArray(arg) {
    return cof(arg) == 'Array';
  };

/***/ },
/* 52 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
  var anObject = __webpack_require__(20),
      dPs = __webpack_require__(53),
      enumBugKeys = __webpack_require__(47),
      IE_PROTO = __webpack_require__(46)('IE_PROTO'),
      Empty = function Empty() {/* empty */},
      PROTOTYPE = 'prototype';

  // Create object with fake `null` prototype: use iframe Object with cleared prototype
  var _createDict = function createDict() {
    // Thrash, waste and sodomy: IE GC bug
    var iframe = __webpack_require__(23)('iframe'),
        i = enumBugKeys.length,
        lt = '<',
        gt = '>',
        iframeDocument;
    iframe.style.display = 'none';
    __webpack_require__(54).appendChild(iframe);
    iframe.src = 'javascript:'; // eslint-disable-line no-script-url
    // createDict = iframe.contentWindow.Object;
    // html.removeChild(iframe);
    iframeDocument = iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(lt + 'script' + gt + 'document.F=Object' + lt + '/script' + gt);
    iframeDocument.close();
    _createDict = iframeDocument.F;
    while (i--) {
      delete _createDict[PROTOTYPE][enumBugKeys[i]];
    }return _createDict();
  };

  module.exports = Object.create || function create(O, Properties) {
    var result;
    if (O !== null) {
      Empty[PROTOTYPE] = anObject(O);
      result = new Empty();
      Empty[PROTOTYPE] = null;
      // add "__proto__" for Object.getPrototypeOf polyfill
      result[IE_PROTO] = O;
    } else result = _createDict();
    return Properties === undefined ? result : dPs(result, Properties);
  };

/***/ },
/* 53 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var dP = __webpack_require__(19),
      anObject = __webpack_require__(20),
      getKeys = __webpack_require__(36);

  module.exports = __webpack_require__(12) ? Object.defineProperties : function defineProperties(O, Properties) {
    anObject(O);
    var keys = getKeys(Properties),
        length = keys.length,
        i = 0,
        P;
    while (length > i) {
      dP.f(O, P = keys[i++], Properties[P]);
    }return O;
  };

/***/ },
/* 54 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  module.exports = __webpack_require__(10).document && document.documentElement;

/***/ },
/* 55 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  // fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
  var toIObject = __webpack_require__(38),
      gOPN = __webpack_require__(56).f,
      toString = {}.toString;

  var windowNames = (typeof window === 'undefined' ? 'undefined' : _typeof(window)) == 'object' && window && Object.getOwnPropertyNames ? Object.getOwnPropertyNames(window) : [];

  var getWindowNames = function getWindowNames(it) {
    try {
      return gOPN(it);
    } catch (e) {
      return windowNames.slice();
    }
  };

  module.exports.f = function getOwnPropertyNames(it) {
    return windowNames && toString.call(it) == '[object Window]' ? getWindowNames(it) : gOPN(toIObject(it));
  };

/***/ },
/* 56 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // 19.1.2.7 / 15.2.3.4 Object.getOwnPropertyNames(O)
  var $keys = __webpack_require__(37),
      hiddenKeys = __webpack_require__(47).concat('length', 'prototype');

  exports.f = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
    return $keys(O, hiddenKeys);
  };

/***/ },
/* 57 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var pIE = __webpack_require__(50),
      createDesc = __webpack_require__(25),
      toIObject = __webpack_require__(38),
      toPrimitive = __webpack_require__(24),
      has = __webpack_require__(11),
      IE8_DOM_DEFINE = __webpack_require__(22),
      gOPD = Object.getOwnPropertyDescriptor;

  exports.f = __webpack_require__(12) ? gOPD : function getOwnPropertyDescriptor(O, P) {
    O = toIObject(O);
    P = toPrimitive(P, true);
    if (IE8_DOM_DEFINE) try {
      return gOPD(O, P);
    } catch (e) {/* empty */}
    if (has(O, P)) return createDesc(!pIE.f.call(O, P), O[P]);
  };

/***/ },
/* 58 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  module.exports = { "default": __webpack_require__(59), __esModule: true };

/***/ },
/* 59 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  __webpack_require__(60);
  __webpack_require__(69);
  module.exports = __webpack_require__(71);

/***/ },
/* 60 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  __webpack_require__(61);
  var global = __webpack_require__(10),
      hide = __webpack_require__(18),
      Iterators = __webpack_require__(64),
      TO_STRING_TAG = __webpack_require__(31)('toStringTag');

  for (var collections = ['NodeList', 'DOMTokenList', 'MediaList', 'StyleSheetList', 'CSSRuleList'], i = 0; i < 5; i++) {
    var NAME = collections[i],
        Collection = global[NAME],
        proto = Collection && Collection.prototype;
    if (proto && !proto[TO_STRING_TAG]) hide(proto, TO_STRING_TAG, NAME);
    Iterators[NAME] = Iterators.Array;
  }

/***/ },
/* 61 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var addToUnscopables = __webpack_require__(62),
      step = __webpack_require__(63),
      Iterators = __webpack_require__(64),
      toIObject = __webpack_require__(38);

  // 22.1.3.4 Array.prototype.entries()
  // 22.1.3.13 Array.prototype.keys()
  // 22.1.3.29 Array.prototype.values()
  // 22.1.3.30 Array.prototype[@@iterator]()
  module.exports = __webpack_require__(65)(Array, 'Array', function (iterated, kind) {
    this._t = toIObject(iterated); // target
    this._i = 0; // next index
    this._k = kind; // kind
    // 22.1.5.2.1 %ArrayIteratorPrototype%.next()
  }, function () {
    var O = this._t,
        kind = this._k,
        index = this._i++;
    if (!O || index >= O.length) {
      this._t = undefined;
      return step(1);
    }
    if (kind == 'keys') return step(0, index);
    if (kind == 'values') return step(0, O[index]);
    return step(0, [index, O[index]]);
  }, 'values');

  // argumentsList[@@iterator] is %ArrayProto_values% (9.4.4.6, 9.4.4.7)
  Iterators.Arguments = Iterators.Array;

  addToUnscopables('keys');
  addToUnscopables('values');
  addToUnscopables('entries');

/***/ },
/* 62 */
/***/ function(module, exports) {

  "use strict";

  module.exports = function () {/* empty */};

/***/ },
/* 63 */
/***/ function(module, exports) {

  "use strict";

  module.exports = function (done, value) {
    return { value: value, done: !!done };
  };

/***/ },
/* 64 */
/***/ function(module, exports) {

  "use strict";

  module.exports = {};

/***/ },
/* 65 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var LIBRARY = __webpack_require__(34),
      $export = __webpack_require__(14),
      redefine = __webpack_require__(26),
      hide = __webpack_require__(18),
      has = __webpack_require__(11),
      Iterators = __webpack_require__(64),
      $iterCreate = __webpack_require__(66),
      setToStringTag = __webpack_require__(30),
      getPrototypeOf = __webpack_require__(67),
      ITERATOR = __webpack_require__(31)('iterator'),
      BUGGY = !([].keys && 'next' in [].keys()) // Safari has buggy iterators w/o `next`
  ,
      FF_ITERATOR = '@@iterator',
      KEYS = 'keys',
      VALUES = 'values';

  var returnThis = function returnThis() {
    return this;
  };

  module.exports = function (Base, NAME, Constructor, next, DEFAULT, IS_SET, FORCED) {
    $iterCreate(Constructor, NAME, next);
    var getMethod = function getMethod(kind) {
      if (!BUGGY && kind in proto) return proto[kind];
      switch (kind) {
        case KEYS:
          return function keys() {
            return new Constructor(this, kind);
          };
        case VALUES:
          return function values() {
            return new Constructor(this, kind);
          };
      }return function entries() {
        return new Constructor(this, kind);
      };
    };
    var TAG = NAME + ' Iterator',
        DEF_VALUES = DEFAULT == VALUES,
        VALUES_BUG = false,
        proto = Base.prototype,
        $native = proto[ITERATOR] || proto[FF_ITERATOR] || DEFAULT && proto[DEFAULT],
        $default = $native || getMethod(DEFAULT),
        $entries = DEFAULT ? !DEF_VALUES ? $default : getMethod('entries') : undefined,
        $anyNative = NAME == 'Array' ? proto.entries || $native : $native,
        methods,
        key,
        IteratorPrototype;
    // Fix native
    if ($anyNative) {
      IteratorPrototype = getPrototypeOf($anyNative.call(new Base()));
      if (IteratorPrototype !== Object.prototype) {
        // Set @@toStringTag to native iterators
        setToStringTag(IteratorPrototype, TAG, true);
        // fix for some old engines
        if (!LIBRARY && !has(IteratorPrototype, ITERATOR)) hide(IteratorPrototype, ITERATOR, returnThis);
      }
    }
    // fix Array#{values, @@iterator}.name in V8 / FF
    if (DEF_VALUES && $native && $native.name !== VALUES) {
      VALUES_BUG = true;
      $default = function values() {
        return $native.call(this);
      };
    }
    // Define iterator
    if ((!LIBRARY || FORCED) && (BUGGY || VALUES_BUG || !proto[ITERATOR])) {
      hide(proto, ITERATOR, $default);
    }
    // Plug for library
    Iterators[NAME] = $default;
    Iterators[TAG] = returnThis;
    if (DEFAULT) {
      methods = {
        values: DEF_VALUES ? $default : getMethod(VALUES),
        keys: IS_SET ? $default : getMethod(KEYS),
        entries: $entries
      };
      if (FORCED) for (key in methods) {
        if (!(key in proto)) redefine(proto, key, methods[key]);
      } else $export($export.P + $export.F * (BUGGY || VALUES_BUG), NAME, methods);
    }
    return methods;
  };

/***/ },
/* 66 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var create = __webpack_require__(52),
      descriptor = __webpack_require__(25),
      setToStringTag = __webpack_require__(30),
      IteratorPrototype = {};

  // 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
  __webpack_require__(18)(IteratorPrototype, __webpack_require__(31)('iterator'), function () {
    return this;
  });

  module.exports = function (Constructor, NAME, next) {
    Constructor.prototype = create(IteratorPrototype, { next: descriptor(1, next) });
    setToStringTag(Constructor, NAME + ' Iterator');
  };

/***/ },
/* 67 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // 19.1.2.9 / 15.2.3.2 Object.getPrototypeOf(O)
  var has = __webpack_require__(11),
      toObject = __webpack_require__(68),
      IE_PROTO = __webpack_require__(46)('IE_PROTO'),
      ObjectProto = Object.prototype;

  module.exports = Object.getPrototypeOf || function (O) {
    O = toObject(O);
    if (has(O, IE_PROTO)) return O[IE_PROTO];
    if (typeof O.constructor == 'function' && O instanceof O.constructor) {
      return O.constructor.prototype;
    }return O instanceof Object ? ObjectProto : null;
  };

/***/ },
/* 68 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // 7.1.13 ToObject(argument)
  var defined = __webpack_require__(41);
  module.exports = function (it) {
    return Object(defined(it));
  };

/***/ },
/* 69 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var $at = __webpack_require__(70)(true);

  // 21.1.3.27 String.prototype[@@iterator]()
  __webpack_require__(65)(String, 'String', function (iterated) {
    this._t = String(iterated); // target
    this._i = 0; // next index
    // 21.1.5.2.1 %StringIteratorPrototype%.next()
  }, function () {
    var O = this._t,
        index = this._i,
        point;
    if (index >= O.length) return { value: undefined, done: true };
    point = $at(O, index);
    this._i += point.length;
    return { value: point, done: false };
  });

/***/ },
/* 70 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var toInteger = __webpack_require__(44),
      defined = __webpack_require__(41);
  // true  -> String#at
  // false -> String#codePointAt
  module.exports = function (TO_STRING) {
    return function (that, pos) {
      var s = String(defined(that)),
          i = toInteger(pos),
          l = s.length,
          a,
          b;
      if (i < 0 || i >= l) return TO_STRING ? '' : undefined;
      a = s.charCodeAt(i);
      return a < 0xd800 || a > 0xdbff || i + 1 === l || (b = s.charCodeAt(i + 1)) < 0xdc00 || b > 0xdfff ? TO_STRING ? s.charAt(i) : a : TO_STRING ? s.slice(i, i + 2) : (a - 0xd800 << 10) + (b - 0xdc00) + 0x10000;
    };
  };

/***/ },
/* 71 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var anObject = __webpack_require__(20),
      get = __webpack_require__(72);
  module.exports = __webpack_require__(15).getIterator = function (it) {
    var iterFn = get(it);
    if (typeof iterFn != 'function') throw TypeError(it + ' is not iterable!');
    return anObject(iterFn.call(it));
  };

/***/ },
/* 72 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var classof = __webpack_require__(73),
      ITERATOR = __webpack_require__(31)('iterator'),
      Iterators = __webpack_require__(64);
  module.exports = __webpack_require__(15).getIteratorMethod = function (it) {
    if (it != undefined) return it[ITERATOR] || it['@@iterator'] || Iterators[classof(it)];
  };

/***/ },
/* 73 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // getting tag from 19.1.3.6 Object.prototype.toString()
  var cof = __webpack_require__(40),
      TAG = __webpack_require__(31)('toStringTag')
  // ES3 wrong here
  ,
      ARG = cof(function () {
    return arguments;
  }()) == 'Arguments';

  // fallback for IE11 Script Access Denied error
  var tryGet = function tryGet(it, key) {
    try {
      return it[key];
    } catch (e) {/* empty */}
  };

  module.exports = function (it) {
    var O, T, B;
    return it === undefined ? 'Undefined' : it === null ? 'Null'
    // @@toStringTag case
    : typeof (T = tryGet(O = Object(it), TAG)) == 'string' ? T
    // builtinTag case
    : ARG ? cof(O)
    // ES3 arguments fallback
    : (B = cof(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : B;
  };

/***/ },
/* 74 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  module.exports = { "default": __webpack_require__(75), __esModule: true };

/***/ },
/* 75 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  __webpack_require__(76);
  module.exports = __webpack_require__(15).Object.keys;

/***/ },
/* 76 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // 19.1.2.14 Object.keys(O)
  var toObject = __webpack_require__(68),
      $keys = __webpack_require__(36);

  __webpack_require__(77)('keys', function () {
    return function keys(it) {
      return $keys(toObject(it));
    };
  });

/***/ },
/* 77 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // most Object methods by ES6 should accept primitives
  var $export = __webpack_require__(14),
      core = __webpack_require__(15),
      fails = __webpack_require__(13);
  module.exports = function (KEY, exec) {
    var fn = (core.Object || {})[KEY] || Object[KEY],
        exp = {};
    exp[KEY] = exec(fn);
    $export($export.S + $export.F * fails(function () {
      fn(1);
    }), 'Object', exp);
  };

/***/ },
/* 78 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  module.exports = { "default": __webpack_require__(79), __esModule: true };

/***/ },
/* 79 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var core = __webpack_require__(15),
      $JSON = core.JSON || (core.JSON = { stringify: JSON.stringify });
  module.exports = function stringify(it) {
    // eslint-disable-line no-unused-vars
    return $JSON.stringify.apply($JSON, arguments);
  };

/***/ },
/* 80 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  exports.__esModule = true;
  exports.NOT_LOCAL_BINDING = exports.BLOCK_SCOPED_SYMBOL = exports.INHERIT_KEYS = exports.UNARY_OPERATORS = exports.STRING_UNARY_OPERATORS = exports.NUMBER_UNARY_OPERATORS = exports.BOOLEAN_UNARY_OPERATORS = exports.BINARY_OPERATORS = exports.NUMBER_BINARY_OPERATORS = exports.BOOLEAN_BINARY_OPERATORS = exports.COMPARISON_BINARY_OPERATORS = exports.EQUALITY_BINARY_OPERATORS = exports.BOOLEAN_NUMBER_BINARY_OPERATORS = exports.UPDATE_OPERATORS = exports.LOGICAL_OPERATORS = exports.COMMENT_KEYS = exports.FOR_INIT_KEYS = exports.FLATTENABLE_KEYS = exports.STATEMENT_OR_BLOCK_KEYS = undefined;

  var _for = __webpack_require__(81);

  var _for2 = _interopRequireDefault(_for);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var STATEMENT_OR_BLOCK_KEYS = exports.STATEMENT_OR_BLOCK_KEYS = ["consequent", "body", "alternate"];
  var FLATTENABLE_KEYS = exports.FLATTENABLE_KEYS = ["body", "expressions"];
  var FOR_INIT_KEYS = exports.FOR_INIT_KEYS = ["left", "init"];
  var COMMENT_KEYS = exports.COMMENT_KEYS = ["leadingComments", "trailingComments", "innerComments"];

  var LOGICAL_OPERATORS = exports.LOGICAL_OPERATORS = ["||", "&&"];
  var UPDATE_OPERATORS = exports.UPDATE_OPERATORS = ["++", "--"];

  var BOOLEAN_NUMBER_BINARY_OPERATORS = exports.BOOLEAN_NUMBER_BINARY_OPERATORS = [">", "<", ">=", "<="];
  var EQUALITY_BINARY_OPERATORS = exports.EQUALITY_BINARY_OPERATORS = ["==", "===", "!=", "!=="];
  var COMPARISON_BINARY_OPERATORS = exports.COMPARISON_BINARY_OPERATORS = [].concat(EQUALITY_BINARY_OPERATORS, ["in", "instanceof"]);
  var BOOLEAN_BINARY_OPERATORS = exports.BOOLEAN_BINARY_OPERATORS = [].concat(COMPARISON_BINARY_OPERATORS, BOOLEAN_NUMBER_BINARY_OPERATORS);
  var NUMBER_BINARY_OPERATORS = exports.NUMBER_BINARY_OPERATORS = ["-", "/", "%", "*", "**", "&", "|", ">>", ">>>", "<<", "^"];
  var BINARY_OPERATORS = exports.BINARY_OPERATORS = ["+"].concat(NUMBER_BINARY_OPERATORS, BOOLEAN_BINARY_OPERATORS);

  var BOOLEAN_UNARY_OPERATORS = exports.BOOLEAN_UNARY_OPERATORS = ["delete", "!"];
  var NUMBER_UNARY_OPERATORS = exports.NUMBER_UNARY_OPERATORS = ["+", "-", "++", "--", "~"];
  var STRING_UNARY_OPERATORS = exports.STRING_UNARY_OPERATORS = ["typeof"];
  var UNARY_OPERATORS = exports.UNARY_OPERATORS = ["void"].concat(BOOLEAN_UNARY_OPERATORS, NUMBER_UNARY_OPERATORS, STRING_UNARY_OPERATORS);

  var INHERIT_KEYS = exports.INHERIT_KEYS = {
    optional: ["typeAnnotation", "typeParameters", "returnType"],
    force: ["start", "loc", "end"]
  };

  var BLOCK_SCOPED_SYMBOL = exports.BLOCK_SCOPED_SYMBOL = (0, _for2.default)("var used to be block scoped");
  var NOT_LOCAL_BINDING = exports.NOT_LOCAL_BINDING = (0, _for2.default)("should not be considered a local binding");

/***/ },
/* 81 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  module.exports = { "default": __webpack_require__(82), __esModule: true };

/***/ },
/* 82 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  __webpack_require__(9);
  module.exports = __webpack_require__(15).Symbol['for'];

/***/ },
/* 83 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  exports.__esModule = true;

  var _create = __webpack_require__(84);

  var _create2 = _interopRequireDefault(_create);

  exports.getBindingIdentifiers = getBindingIdentifiers;
  exports.getOuterBindingIdentifiers = getOuterBindingIdentifiers;

  var _index = __webpack_require__(6);

  var t = _interopRequireWildcard(_index);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }newObj.default = obj;return newObj;
    }
  }

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  function getBindingIdentifiers(node, duplicates, outerOnly) {
    var search = [].concat(node);
    var ids = (0, _create2.default)(null);

    while (search.length) {
      var id = search.shift();
      if (!id) continue;

      var keys = t.getBindingIdentifiers.keys[id.type];

      if (t.isIdentifier(id)) {
        if (duplicates) {
          var _ids = ids[id.name] = ids[id.name] || [];
          _ids.push(id);
        } else {
          ids[id.name] = id;
        }
        continue;
      }

      if (t.isExportDeclaration(id)) {
        if (t.isDeclaration(node.declaration)) {
          search.push(node.declaration);
        }
        continue;
      }

      if (outerOnly) {
        if (t.isFunctionDeclaration(id)) {
          search.push(id.id);
          continue;
        }

        if (t.isFunctionExpression(id)) {
          continue;
        }
      }

      if (keys) {
        for (var i = 0; i < keys.length; i++) {
          var key = keys[i];
          if (id[key]) {
            search = search.concat(id[key]);
          }
        }
      }
    }

    return ids;
  }

  getBindingIdentifiers.keys = {
    DeclareClass: ["id"],
    DeclareFunction: ["id"],
    DeclareModule: ["id"],
    DeclareVariable: ["id"],
    InterfaceDeclaration: ["id"],
    TypeAlias: ["id"],

    CatchClause: ["param"],
    LabeledStatement: ["label"],
    UnaryExpression: ["argument"],
    AssignmentExpression: ["left"],

    ImportSpecifier: ["local"],
    ImportNamespaceSpecifier: ["local"],
    ImportDefaultSpecifier: ["local"],
    ImportDeclaration: ["specifiers"],

    ExportSpecifier: ["exported"],
    ExportNamespaceSpecifier: ["exported"],
    ExportDefaultSpecifier: ["exported"],

    FunctionDeclaration: ["id", "params"],
    FunctionExpression: ["id", "params"],

    ClassDeclaration: ["id"],
    ClassExpression: ["id"],

    RestElement: ["argument"],
    UpdateExpression: ["argument"],

    RestProperty: ["argument"],
    ObjectProperty: ["value"],

    AssignmentPattern: ["left"],
    ArrayPattern: ["elements"],
    ObjectPattern: ["properties"],

    VariableDeclaration: ["declarations"],
    VariableDeclarator: ["id"]
  };

  function getOuterBindingIdentifiers(node, duplicates) {
    return getBindingIdentifiers(node, duplicates, true);
  }

/***/ },
/* 84 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  module.exports = { "default": __webpack_require__(85), __esModule: true };

/***/ },
/* 85 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  __webpack_require__(86);
  var $Object = __webpack_require__(15).Object;
  module.exports = function create(P, D) {
    return $Object.create(P, D);
  };

/***/ },
/* 86 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var $export = __webpack_require__(14);
  // 19.1.2.2 / 15.2.3.5 Object.create(O [, Properties])
  $export($export.S, 'Object', { create: __webpack_require__(52) });

/***/ },
/* 87 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  exports.__esModule = true;

  var _getIterator2 = __webpack_require__(58);

  var _getIterator3 = _interopRequireDefault(_getIterator2);

  exports.isBinding = isBinding;
  exports.isReferenced = isReferenced;
  exports.isValidIdentifier = isValidIdentifier;
  exports.isLet = isLet;
  exports.isBlockScoped = isBlockScoped;
  exports.isVar = isVar;
  exports.isSpecifierDefault = isSpecifierDefault;
  exports.isScope = isScope;
  exports.isImmutable = isImmutable;

  var _retrievers = __webpack_require__(83);

  var _esutils = __webpack_require__(88);

  var _esutils2 = _interopRequireDefault(_esutils);

  var _index = __webpack_require__(6);

  var t = _interopRequireWildcard(_index);

  var _constants = __webpack_require__(80);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }newObj.default = obj;return newObj;
    }
  }

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  function isBinding(node, parent) {
    var keys = _retrievers.getBindingIdentifiers.keys[parent.type];
    if (keys) {
      for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var val = parent[key];
        if (Array.isArray(val)) {
          if (val.indexOf(node) >= 0) return true;
        } else {
          if (val === node) return true;
        }
      }
    }

    return false;
  }

  function isReferenced(node, parent) {
    switch (parent.type) {
      case "BindExpression":
        return parent.object === node || parent.callee === node;

      case "MemberExpression":
      case "JSXMemberExpression":
        if (parent.property === node && parent.computed) {
          return true;
        } else if (parent.object === node) {
          return true;
        } else {
          return false;
        }

      case "MetaProperty":
        return false;

      case "ObjectProperty":
        if (parent.key === node) {
          return parent.computed;
        }

      case "VariableDeclarator":
        return parent.id !== node;

      case "ArrowFunctionExpression":
      case "FunctionDeclaration":
      case "FunctionExpression":
        for (var _iterator = parent.params, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : (0, _getIterator3.default)(_iterator);;) {
          var _ref;

          if (_isArray) {
            if (_i >= _iterator.length) break;
            _ref = _iterator[_i++];
          } else {
            _i = _iterator.next();
            if (_i.done) break;
            _ref = _i.value;
          }

          var param = _ref;

          if (param === node) return false;
        }

        return parent.id !== node;

      case "ExportSpecifier":
        if (parent.source) {
          return false;
        } else {
          return parent.local === node;
        }

      case "ExportNamespaceSpecifier":
      case "ExportDefaultSpecifier":
        return false;

      case "JSXAttribute":
        return parent.name !== node;

      case "ClassProperty":
        if (parent.key === node) {
          return parent.computed;
        } else {
          return parent.value === node;
        }

      case "ImportDefaultSpecifier":
      case "ImportNamespaceSpecifier":
      case "ImportSpecifier":
        return false;

      case "ClassDeclaration":
      case "ClassExpression":
        return parent.id !== node;

      case "ClassMethod":
      case "ObjectMethod":
        return parent.key === node && parent.computed;

      case "LabeledStatement":
        return false;

      case "CatchClause":
        return parent.param !== node;

      case "RestElement":
        return false;

      case "AssignmentExpression":
        return parent.right === node;

      case "AssignmentPattern":
        return parent.right === node;

      case "ObjectPattern":
      case "ArrayPattern":
        return false;
    }

    return true;
  }

  function isValidIdentifier(name) {
    if (typeof name !== "string" || _esutils2.default.keyword.isReservedWordES6(name, true)) {
      return false;
    } else {
      return _esutils2.default.keyword.isIdentifierNameES6(name);
    }
  }

  function isLet(node) {
    return t.isVariableDeclaration(node) && (node.kind !== "var" || node[_constants.BLOCK_SCOPED_SYMBOL]);
  }

  function isBlockScoped(node) {
    return t.isFunctionDeclaration(node) || t.isClassDeclaration(node) || t.isLet(node);
  }

  function isVar(node) {
    return t.isVariableDeclaration(node, { kind: "var" }) && !node[_constants.BLOCK_SCOPED_SYMBOL];
  }

  function isSpecifierDefault(specifier) {
    return t.isImportDefaultSpecifier(specifier) || t.isIdentifier(specifier.imported || specifier.exported, { name: "default" });
  }

  function isScope(node, parent) {
    if (t.isBlockStatement(node) && t.isFunction(parent, { body: node })) {
      return false;
    }

    return t.isScopable(node);
  }

  function isImmutable(node) {
    if (t.isType(node.type, "Immutable")) return true;

    if (t.isIdentifier(node)) {
      if (node.name === "undefined") {
        return true;
      } else {
        return false;
      }
    }

    return false;
  }

/***/ },
/* 88 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  /*
    Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

      * Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
      * Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
    ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
    THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  */

  (function () {
    'use strict';

    exports.ast = __webpack_require__(89);
    exports.code = __webpack_require__(90);
    exports.keyword = __webpack_require__(91);
  })();
  /* vim: set sw=4 ts=4 et tw=80 : */

/***/ },
/* 89 */
/***/ function(module, exports) {

  'use strict';

  /*
    Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

      * Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
      * Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS'
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
    ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
    THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  */

  (function () {
      'use strict';

      function isExpression(node) {
          if (node == null) {
              return false;
          }
          switch (node.type) {
              case 'ArrayExpression':
              case 'AssignmentExpression':
              case 'BinaryExpression':
              case 'CallExpression':
              case 'ConditionalExpression':
              case 'FunctionExpression':
              case 'Identifier':
              case 'Literal':
              case 'LogicalExpression':
              case 'MemberExpression':
              case 'NewExpression':
              case 'ObjectExpression':
              case 'SequenceExpression':
              case 'ThisExpression':
              case 'UnaryExpression':
              case 'UpdateExpression':
                  return true;
          }
          return false;
      }

      function isIterationStatement(node) {
          if (node == null) {
              return false;
          }
          switch (node.type) {
              case 'DoWhileStatement':
              case 'ForInStatement':
              case 'ForStatement':
              case 'WhileStatement':
                  return true;
          }
          return false;
      }

      function isStatement(node) {
          if (node == null) {
              return false;
          }
          switch (node.type) {
              case 'BlockStatement':
              case 'BreakStatement':
              case 'ContinueStatement':
              case 'DebuggerStatement':
              case 'DoWhileStatement':
              case 'EmptyStatement':
              case 'ExpressionStatement':
              case 'ForInStatement':
              case 'ForStatement':
              case 'IfStatement':
              case 'LabeledStatement':
              case 'ReturnStatement':
              case 'SwitchStatement':
              case 'ThrowStatement':
              case 'TryStatement':
              case 'VariableDeclaration':
              case 'WhileStatement':
              case 'WithStatement':
                  return true;
          }
          return false;
      }

      function isSourceElement(node) {
          return isStatement(node) || node != null && node.type === 'FunctionDeclaration';
      }

      function trailingStatement(node) {
          switch (node.type) {
              case 'IfStatement':
                  if (node.alternate != null) {
                      return node.alternate;
                  }
                  return node.consequent;

              case 'LabeledStatement':
              case 'ForStatement':
              case 'ForInStatement':
              case 'WhileStatement':
              case 'WithStatement':
                  return node.body;
          }
          return null;
      }

      function isProblematicIfStatement(node) {
          var current;

          if (node.type !== 'IfStatement') {
              return false;
          }
          if (node.alternate == null) {
              return false;
          }
          current = node.consequent;
          do {
              if (current.type === 'IfStatement') {
                  if (current.alternate == null) {
                      return true;
                  }
              }
              current = trailingStatement(current);
          } while (current);

          return false;
      }

      module.exports = {
          isExpression: isExpression,
          isStatement: isStatement,
          isIterationStatement: isIterationStatement,
          isSourceElement: isSourceElement,
          isProblematicIfStatement: isProblematicIfStatement,

          trailingStatement: trailingStatement
      };
  })();
  /* vim: set sw=4 ts=4 et tw=80 : */

/***/ },
/* 90 */
/***/ function(module, exports) {

  'use strict';

  /*
    Copyright (C) 2013-2014 Yusuke Suzuki <utatane.tea@gmail.com>
    Copyright (C) 2014 Ivan Nikulin <ifaaan@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

      * Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
      * Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
    ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
    THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  */

  (function () {
      'use strict';

      var ES6Regex, ES5Regex, NON_ASCII_WHITESPACES, IDENTIFIER_START, IDENTIFIER_PART, ch;

      // See `tools/generate-identifier-regex.js`.
      ES5Regex = {
          // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierStart:
          NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2E2F\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/,
          // ECMAScript 5.1/Unicode v7.0.0 NonAsciiIdentifierPart:
          NonAsciiIdentifierPart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19D9\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2119-\u211D\u2124\u2126\u2128\u212A-\u212D\u212F-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u2E2F\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099\u309A\u309D-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]/
      };

      ES6Regex = {
          // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierStart:
          NonAsciiIdentifierStart: /[\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u05D0-\u05EA\u05F0-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u08A0-\u08B2\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58\u0C59\u0C60\u0C61\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D60\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1877\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19C1-\u19C7\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDE00-\uDE11\uDE13-\uDE2B\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF5D-\uDF61]|\uD805[\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDE00-\uDE2F\uDE44\uDE80-\uDEAA]|\uD806[\uDCA0-\uDCDF\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50\uDF93-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]/,
          // ECMAScript 6/Unicode v7.0.0 NonAsciiIdentifierPart:
          NonAsciiIdentifierPart: /[\xAA\xB5\xB7\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0300-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u0483-\u0487\u048A-\u052F\u0531-\u0556\u0559\u0561-\u0587\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u05D0-\u05EA\u05F0-\u05F2\u0610-\u061A\u0620-\u0669\u066E-\u06D3\u06D5-\u06DC\u06DF-\u06E8\u06EA-\u06FC\u06FF\u0710-\u074A\u074D-\u07B1\u07C0-\u07F5\u07FA\u0800-\u082D\u0840-\u085B\u08A0-\u08B2\u08E4-\u0963\u0966-\u096F\u0971-\u0983\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BC-\u09C4\u09C7\u09C8\u09CB-\u09CE\u09D7\u09DC\u09DD\u09DF-\u09E3\u09E6-\u09F1\u0A01-\u0A03\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A59-\u0A5C\u0A5E\u0A66-\u0A75\u0A81-\u0A83\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABC-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AD0\u0AE0-\u0AE3\u0AE6-\u0AEF\u0B01-\u0B03\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3C-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B5C\u0B5D\u0B5F-\u0B63\u0B66-\u0B6F\u0B71\u0B82\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD0\u0BD7\u0BE6-\u0BEF\u0C00-\u0C03\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C58\u0C59\u0C60-\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBC-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CDE\u0CE0-\u0CE3\u0CE6-\u0CEF\u0CF1\u0CF2\u0D01-\u0D03\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D-\u0D44\u0D46-\u0D48\u0D4A-\u0D4E\u0D57\u0D60-\u0D63\u0D66-\u0D6F\u0D7A-\u0D7F\u0D82\u0D83\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E01-\u0E3A\u0E40-\u0E4E\u0E50-\u0E59\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB9\u0EBB-\u0EBD\u0EC0-\u0EC4\u0EC6\u0EC8-\u0ECD\u0ED0-\u0ED9\u0EDC-\u0EDF\u0F00\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E-\u0F47\u0F49-\u0F6C\u0F71-\u0F84\u0F86-\u0F97\u0F99-\u0FBC\u0FC6\u1000-\u1049\u1050-\u109D\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u135D-\u135F\u1369-\u1371\u1380-\u138F\u13A0-\u13F4\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1714\u1720-\u1734\u1740-\u1753\u1760-\u176C\u176E-\u1770\u1772\u1773\u1780-\u17D3\u17D7\u17DC\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u1820-\u1877\u1880-\u18AA\u18B0-\u18F5\u1900-\u191E\u1920-\u192B\u1930-\u193B\u1946-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u19D0-\u19DA\u1A00-\u1A1B\u1A20-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AA7\u1AB0-\u1ABD\u1B00-\u1B4B\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1BF3\u1C00-\u1C37\u1C40-\u1C49\u1C4D-\u1C7D\u1CD0-\u1CD2\u1CD4-\u1CF6\u1CF8\u1CF9\u1D00-\u1DF5\u1DFC-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u200C\u200D\u203F\u2040\u2054\u2071\u207F\u2090-\u209C\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D7F-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u2DE0-\u2DFF\u3005-\u3007\u3021-\u302F\u3031-\u3035\u3038-\u303C\u3041-\u3096\u3099-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312D\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FCC\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA62B\uA640-\uA66F\uA674-\uA67D\uA67F-\uA69D\uA69F-\uA6F1\uA717-\uA71F\uA722-\uA788\uA78B-\uA78E\uA790-\uA7AD\uA7B0\uA7B1\uA7F7-\uA827\uA840-\uA873\uA880-\uA8C4\uA8D0-\uA8D9\uA8E0-\uA8F7\uA8FB\uA900-\uA92D\uA930-\uA953\uA960-\uA97C\uA980-\uA9C0\uA9CF-\uA9D9\uA9E0-\uA9FE\uAA00-\uAA36\uAA40-\uAA4D\uAA50-\uAA59\uAA60-\uAA76\uAA7A-\uAAC2\uAADB-\uAADD\uAAE0-\uAAEF\uAAF2-\uAAF6\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB5F\uAB64\uAB65\uABC0-\uABEA\uABEC\uABED\uABF0-\uABF9\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE00-\uFE0F\uFE20-\uFE2D\uFE33\uFE34\uFE4D-\uFE4F\uFE70-\uFE74\uFE76-\uFEFC\uFF10-\uFF19\uFF21-\uFF3A\uFF3F\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDDFD\uDE80-\uDE9C\uDEA0-\uDED0\uDEE0\uDF00-\uDF1F\uDF30-\uDF4A\uDF50-\uDF7A\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCA0-\uDCA9\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00-\uDE03\uDE05\uDE06\uDE0C-\uDE13\uDE15-\uDE17\uDE19-\uDE33\uDE38-\uDE3A\uDE3F\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE6\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48]|\uD804[\uDC00-\uDC46\uDC66-\uDC6F\uDC7F-\uDCBA\uDCD0-\uDCE8\uDCF0-\uDCF9\uDD00-\uDD34\uDD36-\uDD3F\uDD50-\uDD73\uDD76\uDD80-\uDDC4\uDDD0-\uDDDA\uDE00-\uDE11\uDE13-\uDE37\uDEB0-\uDEEA\uDEF0-\uDEF9\uDF01-\uDF03\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3C-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF5D-\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC80-\uDCC5\uDCC7\uDCD0-\uDCD9\uDD80-\uDDB5\uDDB8-\uDDC0\uDE00-\uDE40\uDE44\uDE50-\uDE59\uDE80-\uDEB7\uDEC0-\uDEC9]|\uD806[\uDCA0-\uDCE9\uDCFF\uDEC0-\uDEF8]|\uD808[\uDC00-\uDF98]|\uD809[\uDC00-\uDC6E]|[\uD80C\uD840-\uD868\uD86A-\uD86C][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDE60-\uDE69\uDED0-\uDEED\uDEF0-\uDEF4\uDF00-\uDF36\uDF40-\uDF43\uDF50-\uDF59\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDF00-\uDF44\uDF50-\uDF7E\uDF8F-\uDF9F]|\uD82C[\uDC00\uDC01]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB\uDFCE-\uDFFF]|\uD83A[\uDC00-\uDCC4\uDCD0-\uDCD6]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D]|\uD87E[\uDC00-\uDE1D]|\uDB40[\uDD00-\uDDEF]/
      };

      function isDecimalDigit(ch) {
          return 0x30 <= ch && ch <= 0x39; // 0..9
      }

      function isHexDigit(ch) {
          return 0x30 <= ch && ch <= 0x39 || // 0..9
          0x61 <= ch && ch <= 0x66 || // a..f
          0x41 <= ch && ch <= 0x46; // A..F
      }

      function isOctalDigit(ch) {
          return ch >= 0x30 && ch <= 0x37; // 0..7
      }

      // 7.2 White Space

      NON_ASCII_WHITESPACES = [0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006, 0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF];

      function isWhiteSpace(ch) {
          return ch === 0x20 || ch === 0x09 || ch === 0x0B || ch === 0x0C || ch === 0xA0 || ch >= 0x1680 && NON_ASCII_WHITESPACES.indexOf(ch) >= 0;
      }

      // 7.3 Line Terminators

      function isLineTerminator(ch) {
          return ch === 0x0A || ch === 0x0D || ch === 0x2028 || ch === 0x2029;
      }

      // 7.6 Identifier Names and Identifiers

      function fromCodePoint(cp) {
          if (cp <= 0xFFFF) {
              return String.fromCharCode(cp);
          }
          var cu1 = String.fromCharCode(Math.floor((cp - 0x10000) / 0x400) + 0xD800);
          var cu2 = String.fromCharCode((cp - 0x10000) % 0x400 + 0xDC00);
          return cu1 + cu2;
      }

      IDENTIFIER_START = new Array(0x80);
      for (ch = 0; ch < 0x80; ++ch) {
          IDENTIFIER_START[ch] = ch >= 0x61 && ch <= 0x7A || // a..z
          ch >= 0x41 && ch <= 0x5A || // A..Z
          ch === 0x24 || ch === 0x5F; // $ (dollar) and _ (underscore)
      }

      IDENTIFIER_PART = new Array(0x80);
      for (ch = 0; ch < 0x80; ++ch) {
          IDENTIFIER_PART[ch] = ch >= 0x61 && ch <= 0x7A || // a..z
          ch >= 0x41 && ch <= 0x5A || // A..Z
          ch >= 0x30 && ch <= 0x39 || // 0..9
          ch === 0x24 || ch === 0x5F; // $ (dollar) and _ (underscore)
      }

      function isIdentifierStartES5(ch) {
          return ch < 0x80 ? IDENTIFIER_START[ch] : ES5Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
      }

      function isIdentifierPartES5(ch) {
          return ch < 0x80 ? IDENTIFIER_PART[ch] : ES5Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
      }

      function isIdentifierStartES6(ch) {
          return ch < 0x80 ? IDENTIFIER_START[ch] : ES6Regex.NonAsciiIdentifierStart.test(fromCodePoint(ch));
      }

      function isIdentifierPartES6(ch) {
          return ch < 0x80 ? IDENTIFIER_PART[ch] : ES6Regex.NonAsciiIdentifierPart.test(fromCodePoint(ch));
      }

      module.exports = {
          isDecimalDigit: isDecimalDigit,
          isHexDigit: isHexDigit,
          isOctalDigit: isOctalDigit,
          isWhiteSpace: isWhiteSpace,
          isLineTerminator: isLineTerminator,
          isIdentifierStartES5: isIdentifierStartES5,
          isIdentifierPartES5: isIdentifierPartES5,
          isIdentifierStartES6: isIdentifierStartES6,
          isIdentifierPartES6: isIdentifierPartES6
      };
  })();
  /* vim: set sw=4 ts=4 et tw=80 : */

/***/ },
/* 91 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  /*
    Copyright (C) 2013 Yusuke Suzuki <utatane.tea@gmail.com>

    Redistribution and use in source and binary forms, with or without
    modification, are permitted provided that the following conditions are met:

      * Redistributions of source code must retain the above copyright
        notice, this list of conditions and the following disclaimer.
      * Redistributions in binary form must reproduce the above copyright
        notice, this list of conditions and the following disclaimer in the
        documentation and/or other materials provided with the distribution.

    THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
    AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
    IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
    ARE DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
    DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
    (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
    LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
    ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
    (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
    THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  */

  (function () {
      'use strict';

      var code = __webpack_require__(90);

      function isStrictModeReservedWordES6(id) {
          switch (id) {
              case 'implements':
              case 'interface':
              case 'package':
              case 'private':
              case 'protected':
              case 'public':
              case 'static':
              case 'let':
                  return true;
              default:
                  return false;
          }
      }

      function isKeywordES5(id, strict) {
          // yield should not be treated as keyword under non-strict mode.
          if (!strict && id === 'yield') {
              return false;
          }
          return isKeywordES6(id, strict);
      }

      function isKeywordES6(id, strict) {
          if (strict && isStrictModeReservedWordES6(id)) {
              return true;
          }

          switch (id.length) {
              case 2:
                  return id === 'if' || id === 'in' || id === 'do';
              case 3:
                  return id === 'var' || id === 'for' || id === 'new' || id === 'try';
              case 4:
                  return id === 'this' || id === 'else' || id === 'case' || id === 'void' || id === 'with' || id === 'enum';
              case 5:
                  return id === 'while' || id === 'break' || id === 'catch' || id === 'throw' || id === 'const' || id === 'yield' || id === 'class' || id === 'super';
              case 6:
                  return id === 'return' || id === 'typeof' || id === 'delete' || id === 'switch' || id === 'export' || id === 'import';
              case 7:
                  return id === 'default' || id === 'finally' || id === 'extends';
              case 8:
                  return id === 'function' || id === 'continue' || id === 'debugger';
              case 10:
                  return id === 'instanceof';
              default:
                  return false;
          }
      }

      function isReservedWordES5(id, strict) {
          return id === 'null' || id === 'true' || id === 'false' || isKeywordES5(id, strict);
      }

      function isReservedWordES6(id, strict) {
          return id === 'null' || id === 'true' || id === 'false' || isKeywordES6(id, strict);
      }

      function isRestrictedWord(id) {
          return id === 'eval' || id === 'arguments';
      }

      function isIdentifierNameES5(id) {
          var i, iz, ch;

          if (id.length === 0) {
              return false;
          }

          ch = id.charCodeAt(0);
          if (!code.isIdentifierStartES5(ch)) {
              return false;
          }

          for (i = 1, iz = id.length; i < iz; ++i) {
              ch = id.charCodeAt(i);
              if (!code.isIdentifierPartES5(ch)) {
                  return false;
              }
          }
          return true;
      }

      function decodeUtf16(lead, trail) {
          return (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
      }

      function isIdentifierNameES6(id) {
          var i, iz, ch, lowCh, check;

          if (id.length === 0) {
              return false;
          }

          check = code.isIdentifierStartES6;
          for (i = 0, iz = id.length; i < iz; ++i) {
              ch = id.charCodeAt(i);
              if (0xD800 <= ch && ch <= 0xDBFF) {
                  ++i;
                  if (i >= iz) {
                      return false;
                  }
                  lowCh = id.charCodeAt(i);
                  if (!(0xDC00 <= lowCh && lowCh <= 0xDFFF)) {
                      return false;
                  }
                  ch = decodeUtf16(ch, lowCh);
              }
              if (!check(ch)) {
                  return false;
              }
              check = code.isIdentifierPartES6;
          }
          return true;
      }

      function isIdentifierES5(id, strict) {
          return isIdentifierNameES5(id) && !isReservedWordES5(id, strict);
      }

      function isIdentifierES6(id, strict) {
          return isIdentifierNameES6(id) && !isReservedWordES6(id, strict);
      }

      module.exports = {
          isKeywordES5: isKeywordES5,
          isKeywordES6: isKeywordES6,
          isReservedWordES5: isReservedWordES5,
          isReservedWordES6: isReservedWordES6,
          isRestrictedWord: isRestrictedWord,
          isIdentifierNameES5: isIdentifierNameES5,
          isIdentifierNameES6: isIdentifierNameES6,
          isIdentifierES5: isIdentifierES5,
          isIdentifierES6: isIdentifierES6
      };
  })();
  /* vim: set sw=4 ts=4 et tw=80 : */

/***/ },
/* 92 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  exports.__esModule = true;

  var _maxSafeInteger = __webpack_require__(93);

  var _maxSafeInteger2 = _interopRequireDefault(_maxSafeInteger);

  var _stringify = __webpack_require__(78);

  var _stringify2 = _interopRequireDefault(_stringify);

  var _getIterator2 = __webpack_require__(58);

  var _getIterator3 = _interopRequireDefault(_getIterator2);

  exports.toComputedKey = toComputedKey;
  exports.toSequenceExpression = toSequenceExpression;
  exports.toKeyAlias = toKeyAlias;
  exports.toIdentifier = toIdentifier;
  exports.toBindingIdentifierName = toBindingIdentifierName;
  exports.toStatement = toStatement;
  exports.toExpression = toExpression;
  exports.toBlock = toBlock;
  exports.valueToNode = valueToNode;

  var _isPlainObject = __webpack_require__(96);

  var _isPlainObject2 = _interopRequireDefault(_isPlainObject);

  var _isNumber = __webpack_require__(100);

  var _isNumber2 = _interopRequireDefault(_isNumber);

  var _isRegExp = __webpack_require__(101);

  var _isRegExp2 = _interopRequireDefault(_isRegExp);

  var _isString = __webpack_require__(108);

  var _isString2 = _interopRequireDefault(_isString);

  var _index = __webpack_require__(6);

  var t = _interopRequireWildcard(_index);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }newObj.default = obj;return newObj;
    }
  }

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  function toComputedKey(node) {
    var key = arguments.length <= 1 || arguments[1] === undefined ? node.key || node.property : arguments[1];

    if (!node.computed) {
      if (t.isIdentifier(key)) key = t.stringLiteral(key.name);
    }
    return key;
  }

  function toSequenceExpression(nodes, scope) {
    if (!nodes || !nodes.length) return;

    var declars = [];
    var bailed = false;

    var result = convert(nodes);
    if (bailed) return;

    for (var i = 0; i < declars.length; i++) {
      scope.push(declars[i]);
    }

    return result;

    function convert(nodes) {
      var ensureLastUndefined = false;
      var exprs = [];

      for (var _iterator = nodes, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : (0, _getIterator3.default)(_iterator);;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var node = _ref;

        if (t.isExpression(node)) {
          exprs.push(node);
        } else if (t.isExpressionStatement(node)) {
          exprs.push(node.expression);
        } else if (t.isVariableDeclaration(node)) {
          if (node.kind !== "var") return bailed = true;

          for (var _iterator2 = node.declarations, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : (0, _getIterator3.default)(_iterator2);;) {
            var _ref2;

            if (_isArray2) {
              if (_i2 >= _iterator2.length) break;
              _ref2 = _iterator2[_i2++];
            } else {
              _i2 = _iterator2.next();
              if (_i2.done) break;
              _ref2 = _i2.value;
            }

            var declar = _ref2;

            var bindings = t.getBindingIdentifiers(declar);
            for (var key in bindings) {
              declars.push({
                kind: node.kind,
                id: bindings[key]
              });
            }

            if (declar.init) {
              exprs.push(t.assignmentExpression("=", declar.id, declar.init));
            }
          }

          ensureLastUndefined = true;
          continue;
        } else if (t.isIfStatement(node)) {
          var consequent = node.consequent ? convert([node.consequent]) : scope.buildUndefinedNode();
          var alternate = node.alternate ? convert([node.alternate]) : scope.buildUndefinedNode();
          if (!consequent || !alternate) return bailed = true;

          exprs.push(t.conditionalExpression(node.test, consequent, alternate));
        } else if (t.isBlockStatement(node)) {
          exprs.push(convert(node.body));
        } else if (t.isEmptyStatement(node)) {
          ensureLastUndefined = true;
          continue;
        } else {
          return bailed = true;
        }

        ensureLastUndefined = false;
      }

      if (ensureLastUndefined || exprs.length === 0) {
        exprs.push(scope.buildUndefinedNode());
      }

      if (exprs.length === 1) {
        return exprs[0];
      } else {
        return t.sequenceExpression(exprs);
      }
    }
  }

  function toKeyAlias(node) {
    var key = arguments.length <= 1 || arguments[1] === undefined ? node.key : arguments[1];

    var alias = void 0;

    if (node.kind === "method") {
      return toKeyAlias.increment() + "";
    } else if (t.isIdentifier(key)) {
      alias = key.name;
    } else if (t.isStringLiteral(key)) {
      alias = (0, _stringify2.default)(key.value);
    } else {
      alias = (0, _stringify2.default)(t.removePropertiesDeep(t.cloneDeep(key)));
    }

    if (node.computed) {
      alias = "[" + alias + "]";
    }

    if (node.static) {
      alias = "static:" + alias;
    }

    return alias;
  }

  toKeyAlias.uid = 0;

  toKeyAlias.increment = function () {
    if (toKeyAlias.uid >= _maxSafeInteger2.default) {
      return toKeyAlias.uid = 0;
    } else {
      return toKeyAlias.uid++;
    }
  };

  function toIdentifier(name) {
    name = name + "";

    name = name.replace(/[^a-zA-Z0-9$_]/g, "-");

    name = name.replace(/^[-0-9]+/, "");

    name = name.replace(/[-\s]+(.)?/g, function (match, c) {
      return c ? c.toUpperCase() : "";
    });

    if (!t.isValidIdentifier(name)) {
      name = "_" + name;
    }

    return name || "_";
  }

  function toBindingIdentifierName(name) {
    name = toIdentifier(name);
    if (name === "eval" || name === "arguments") name = "_" + name;
    return name;
  }

  function toStatement(node, ignore) {
    if (t.isStatement(node)) {
      return node;
    }

    var mustHaveId = false;
    var newType = void 0;

    if (t.isClass(node)) {
      mustHaveId = true;
      newType = "ClassDeclaration";
    } else if (t.isFunction(node)) {
      mustHaveId = true;
      newType = "FunctionDeclaration";
    } else if (t.isAssignmentExpression(node)) {
      return t.expressionStatement(node);
    }

    if (mustHaveId && !node.id) {
      newType = false;
    }

    if (!newType) {
      if (ignore) {
        return false;
      } else {
        throw new Error("cannot turn " + node.type + " to a statement");
      }
    }

    node.type = newType;

    return node;
  }

  function toExpression(node) {
    if (t.isExpressionStatement(node)) {
      node = node.expression;
    }

    if (t.isExpression(node)) {
      return node;
    }

    if (t.isClass(node)) {
      node.type = "ClassExpression";
    } else if (t.isFunction(node)) {
      node.type = "FunctionExpression";
    }

    if (!t.isExpression(node)) {
      throw new Error("cannot turn " + node.type + " to an expression");
    }

    return node;
  }

  function toBlock(node, parent) {
    if (t.isBlockStatement(node)) {
      return node;
    }

    if (t.isEmptyStatement(node)) {
      node = [];
    }

    if (!Array.isArray(node)) {
      if (!t.isStatement(node)) {
        if (t.isFunction(parent)) {
          node = t.returnStatement(node);
        } else {
          node = t.expressionStatement(node);
        }
      }

      node = [node];
    }

    return t.blockStatement(node);
  }

  function valueToNode(value) {
    if (value === undefined) {
      return t.identifier("undefined");
    }

    if (value === true || value === false) {
      return t.booleanLiteral(value);
    }

    if (value === null) {
      return t.nullLiteral();
    }

    if ((0, _isString2.default)(value)) {
      return t.stringLiteral(value);
    }

    if ((0, _isNumber2.default)(value)) {
      return t.numericLiteral(value);
    }

    if ((0, _isRegExp2.default)(value)) {
      var pattern = value.source;
      var flags = value.toString().match(/\/([a-z]+|)$/)[1];
      return t.regExpLiteral(pattern, flags);
    }

    if (Array.isArray(value)) {
      return t.arrayExpression(value.map(t.valueToNode));
    }

    if ((0, _isPlainObject2.default)(value)) {
      var props = [];
      for (var key in value) {
        var nodeKey = void 0;
        if (t.isValidIdentifier(key)) {
          nodeKey = t.identifier(key);
        } else {
          nodeKey = t.stringLiteral(key);
        }
        props.push(t.objectProperty(nodeKey, t.valueToNode(value[key])));
      }
      return t.objectExpression(props);
    }

    throw new Error("don't know how to turn this value into a node");
  }

/***/ },
/* 93 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  module.exports = { "default": __webpack_require__(94), __esModule: true };

/***/ },
/* 94 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  __webpack_require__(95);
  module.exports = 0x1fffffffffffff;

/***/ },
/* 95 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  // 20.1.2.6 Number.MAX_SAFE_INTEGER
  var $export = __webpack_require__(14);

  $export($export.S, 'Number', { MAX_SAFE_INTEGER: 0x1fffffffffffff });

/***/ },
/* 96 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var getPrototype = __webpack_require__(97),
      isObjectLike = __webpack_require__(99);

  /** `Object#toString` result references. */
  var objectTag = '[object Object]';

  /** Used for built-in method references. */
  var funcProto = Function.prototype,
      objectProto = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /** Used to infer the `Object` constructor. */
  var objectCtorString = funcToString.call(Object);

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /**
   * Checks if `value` is a plain object, that is, an object created by the
   * `Object` constructor or one with a `[[Prototype]]` of `null`.
   *
   * @static
   * @memberOf _
   * @since 0.8.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a plain object, else `false`.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   * }
   *
   * _.isPlainObject(new Foo);
   * // => false
   *
   * _.isPlainObject([1, 2, 3]);
   * // => false
   *
   * _.isPlainObject({ 'x': 0, 'y': 0 });
   * // => true
   *
   * _.isPlainObject(Object.create(null));
   * // => true
   */
  function isPlainObject(value) {
    if (!isObjectLike(value) || objectToString.call(value) != objectTag) {
      return false;
    }
    var proto = getPrototype(value);
    if (proto === null) {
      return true;
    }
    var Ctor = hasOwnProperty.call(proto, 'constructor') && proto.constructor;
    return typeof Ctor == 'function' && Ctor instanceof Ctor && funcToString.call(Ctor) == objectCtorString;
  }

  module.exports = isPlainObject;

/***/ },
/* 97 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var overArg = __webpack_require__(98);

  /** Built-in value references. */
  var getPrototype = overArg(Object.getPrototypeOf, Object);

  module.exports = getPrototype;

/***/ },
/* 98 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Creates a unary function that invokes `func` with its argument transformed.
   *
   * @private
   * @param {Function} func The function to wrap.
   * @param {Function} transform The argument transform.
   * @returns {Function} Returns the new function.
   */
  function overArg(func, transform) {
    return function (arg) {
      return func(transform(arg));
    };
  }

  module.exports = overArg;

/***/ },
/* 99 */
/***/ function(module, exports) {

  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  /**
   * Checks if `value` is object-like. A value is object-like if it's not `null`
   * and has a `typeof` result of "object".
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is object-like, else `false`.
   * @example
   *
   * _.isObjectLike({});
   * // => true
   *
   * _.isObjectLike([1, 2, 3]);
   * // => true
   *
   * _.isObjectLike(_.noop);
   * // => false
   *
   * _.isObjectLike(null);
   * // => false
   */
  function isObjectLike(value) {
    return value != null && (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object';
  }

  module.exports = isObjectLike;

/***/ },
/* 100 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isObjectLike = __webpack_require__(99);

  /** `Object#toString` result references. */
  var numberTag = '[object Number]';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /**
   * Checks if `value` is classified as a `Number` primitive or object.
   *
   * **Note:** To exclude `Infinity`, `-Infinity`, and `NaN`, which are
   * classified as numbers, use the `_.isFinite` method.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a number, else `false`.
   * @example
   *
   * _.isNumber(3);
   * // => true
   *
   * _.isNumber(Number.MIN_VALUE);
   * // => true
   *
   * _.isNumber(Infinity);
   * // => true
   *
   * _.isNumber('3');
   * // => false
   */
  function isNumber(value) {
    return typeof value == 'number' || isObjectLike(value) && objectToString.call(value) == numberTag;
  }

  module.exports = isNumber;

/***/ },
/* 101 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseIsRegExp = __webpack_require__(102),
      baseUnary = __webpack_require__(104),
      nodeUtil = __webpack_require__(105);

  /* Node.js helper references. */
  var nodeIsRegExp = nodeUtil && nodeUtil.isRegExp;

  /**
   * Checks if `value` is classified as a `RegExp` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a regexp, else `false`.
   * @example
   *
   * _.isRegExp(/abc/);
   * // => true
   *
   * _.isRegExp('/abc/');
   * // => false
   */
  var isRegExp = nodeIsRegExp ? baseUnary(nodeIsRegExp) : baseIsRegExp;

  module.exports = isRegExp;

/***/ },
/* 102 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isObject = __webpack_require__(103);

  /** `Object#toString` result references. */
  var regexpTag = '[object RegExp]';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /**
   * The base implementation of `_.isRegExp` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a regexp, else `false`.
   */
  function baseIsRegExp(value) {
    return isObject(value) && objectToString.call(value) == regexpTag;
  }

  module.exports = baseIsRegExp;

/***/ },
/* 103 */
/***/ function(module, exports) {

  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  /**
   * Checks if `value` is the
   * [language type](http://www.ecma-international.org/ecma-262/7.0/#sec-ecmascript-language-types)
   * of `Object`. (e.g. arrays, functions, objects, regexes, `new Number(0)`, and `new String('')`)
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an object, else `false`.
   * @example
   *
   * _.isObject({});
   * // => true
   *
   * _.isObject([1, 2, 3]);
   * // => true
   *
   * _.isObject(_.noop);
   * // => true
   *
   * _.isObject(null);
   * // => false
   */
  function isObject(value) {
    var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    return value != null && (type == 'object' || type == 'function');
  }

  module.exports = isObject;

/***/ },
/* 104 */
/***/ function(module, exports) {

  "use strict";

  /**
   * The base implementation of `_.unary` without support for storing metadata.
   *
   * @private
   * @param {Function} func The function to cap arguments for.
   * @returns {Function} Returns the new capped function.
   */
  function baseUnary(func) {
    return function (value) {
      return func(value);
    };
  }

  module.exports = baseUnary;

/***/ },
/* 105 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(module) {'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  var freeGlobal = __webpack_require__(107);

  /** Detect free variable `exports`. */
  var freeExports = ( false ? 'undefined' : _typeof(exports)) == 'object' && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && ( false ? 'undefined' : _typeof(module)) == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Detect free variable `process` from Node.js. */
  var freeProcess = moduleExports && freeGlobal.process;

  /** Used to access faster Node.js helpers. */
  var nodeUtil = function () {
    try {
      return freeProcess && freeProcess.binding('util');
    } catch (e) {}
  }();

  module.exports = nodeUtil;
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(106)(module)))

/***/ },
/* 106 */
/***/ function(module, exports) {

  "use strict";

  module.exports = function (module) {
    if (!module.webpackPolyfill) {
      module.deprecate = function () {};
      module.paths = [];
      // module.parent = undefined by default
      module.children = [];
      module.webpackPolyfill = 1;
    }
    return module;
  };

/***/ },
/* 107 */
/***/ function(module, exports) {

  /* WEBPACK VAR INJECTION */(function(global) {'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  /** Detect free variable `global` from Node.js. */
  var freeGlobal = (typeof global === 'undefined' ? 'undefined' : _typeof(global)) == 'object' && global && global.Object === Object && global;

  module.exports = freeGlobal;
  /* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }())))

/***/ },
/* 108 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isArray = __webpack_require__(109),
      isObjectLike = __webpack_require__(99);

  /** `Object#toString` result references. */
  var stringTag = '[object String]';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /**
   * Checks if `value` is classified as a `String` primitive or object.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a string, else `false`.
   * @example
   *
   * _.isString('abc');
   * // => true
   *
   * _.isString(1);
   * // => false
   */
  function isString(value) {
    return typeof value == 'string' || !isArray(value) && isObjectLike(value) && objectToString.call(value) == stringTag;
  }

  module.exports = isString;

/***/ },
/* 109 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Checks if `value` is classified as an `Array` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an array, else `false`.
   * @example
   *
   * _.isArray([1, 2, 3]);
   * // => true
   *
   * _.isArray(document.body.children);
   * // => false
   *
   * _.isArray('abc');
   * // => false
   *
   * _.isArray(_.noop);
   * // => false
   */
  var isArray = Array.isArray;

  module.exports = isArray;

/***/ },
/* 110 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  exports.__esModule = true;
  exports.createUnionTypeAnnotation = createUnionTypeAnnotation;
  exports.removeTypeDuplicates = removeTypeDuplicates;
  exports.createTypeAnnotationBasedOnTypeof = createTypeAnnotationBasedOnTypeof;

  var _index = __webpack_require__(6);

  var t = _interopRequireWildcard(_index);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }newObj.default = obj;return newObj;
    }
  }

  function createUnionTypeAnnotation(types) {
    var flattened = removeTypeDuplicates(types);

    if (flattened.length === 1) {
      return flattened[0];
    } else {
      return t.unionTypeAnnotation(flattened);
    }
  }

  function removeTypeDuplicates(nodes) {
    var generics = {};
    var bases = {};

    var typeGroups = [];

    var types = [];

    for (var i = 0; i < nodes.length; i++) {
      var node = nodes[i];
      if (!node) continue;

      if (types.indexOf(node) >= 0) {
        continue;
      }

      if (t.isAnyTypeAnnotation(node)) {
        return [node];
      }

      if (t.isFlowBaseAnnotation(node)) {
        bases[node.type] = node;
        continue;
      }

      if (t.isUnionTypeAnnotation(node)) {
        if (typeGroups.indexOf(node.types) < 0) {
          nodes = nodes.concat(node.types);
          typeGroups.push(node.types);
        }
        continue;
      }

      if (t.isGenericTypeAnnotation(node)) {
        var name = node.id.name;

        if (generics[name]) {
          var existing = generics[name];
          if (existing.typeParameters) {
            if (node.typeParameters) {
              existing.typeParameters.params = removeTypeDuplicates(existing.typeParameters.params.concat(node.typeParameters.params));
            }
          } else {
            existing = node.typeParameters;
          }
        } else {
          generics[name] = node;
        }

        continue;
      }

      types.push(node);
    }

    for (var type in bases) {
      types.push(bases[type]);
    }

    for (var _name in generics) {
      types.push(generics[_name]);
    }

    return types;
  }

  function createTypeAnnotationBasedOnTypeof(type) {
    if (type === "string") {
      return t.stringTypeAnnotation();
    } else if (type === "number") {
      return t.numberTypeAnnotation();
    } else if (type === "undefined") {
      return t.voidTypeAnnotation();
    } else if (type === "boolean") {
      return t.booleanTypeAnnotation();
    } else if (type === "function") {
      return t.genericTypeAnnotation(t.identifier("Function"));
    } else if (type === "object") {
      return t.genericTypeAnnotation(t.identifier("Object"));
    } else if (type === "symbol") {
      return t.genericTypeAnnotation(t.identifier("Symbol"));
    } else {
      throw new Error("Invalid typeof value");
    }
  }

/***/ },
/* 111 */
/***/ function(module, exports) {

  'use strict';

  module.exports = function toFastProperties(obj) {
    function f() {}
    f.prototype = obj;
    new f();
    return;
    eval(obj);
  };

/***/ },
/* 112 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Creates an array with all falsey values removed. The values `false`, `null`,
   * `0`, `""`, `undefined`, and `NaN` are falsey.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Array
   * @param {Array} array The array to compact.
   * @returns {Array} Returns the new array of filtered values.
   * @example
   *
   * _.compact([0, 1, false, 2, '', 3]);
   * // => [1, 2, 3]
   */
  function compact(array) {
    var index = -1,
        length = array ? array.length : 0,
        resIndex = 0,
        result = [];

    while (++index < length) {
      var value = array[index];
      if (value) {
        result[resIndex++] = value;
      }
    }
    return result;
  }

  module.exports = compact;

/***/ },
/* 113 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseClone = __webpack_require__(114);

  /**
   * Creates a shallow clone of `value`.
   *
   * **Note:** This method is loosely based on the
   * [structured clone algorithm](https://mdn.io/Structured_clone_algorithm)
   * and supports cloning arrays, array buffers, booleans, date objects, maps,
   * numbers, `Object` objects, regexes, sets, strings, symbols, and typed
   * arrays. The own enumerable properties of `arguments` objects are cloned
   * as plain objects. An empty object is returned for uncloneable values such
   * as error objects, functions, DOM nodes, and WeakMaps.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to clone.
   * @returns {*} Returns the cloned value.
   * @see _.cloneDeep
   * @example
   *
   * var objects = [{ 'a': 1 }, { 'b': 2 }];
   *
   * var shallow = _.clone(objects);
   * console.log(shallow[0] === objects[0]);
   * // => true
   */
  function clone(value) {
    return baseClone(value, false, true);
  }

  module.exports = clone;

/***/ },
/* 114 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var Stack = __webpack_require__(115),
      arrayEach = __webpack_require__(153),
      assignValue = __webpack_require__(154),
      baseAssign = __webpack_require__(157),
      cloneBuffer = __webpack_require__(174),
      copyArray = __webpack_require__(175),
      copySymbols = __webpack_require__(176),
      getAllKeys = __webpack_require__(179),
      getTag = __webpack_require__(182),
      initCloneArray = __webpack_require__(188),
      initCloneByTag = __webpack_require__(189),
      initCloneObject = __webpack_require__(204),
      isArray = __webpack_require__(109),
      isBuffer = __webpack_require__(164),
      isObject = __webpack_require__(103),
      keys = __webpack_require__(159);

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      genTag = '[object GeneratorFunction]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      symbolTag = '[object Symbol]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to identify `toStringTag` values supported by `_.clone`. */
  var cloneableTags = {};
  cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag] = cloneableTags[dataViewTag] = cloneableTags[boolTag] = cloneableTags[dateTag] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[mapTag] = cloneableTags[numberTag] = cloneableTags[objectTag] = cloneableTags[regexpTag] = cloneableTags[setTag] = cloneableTags[stringTag] = cloneableTags[symbolTag] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
  cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[weakMapTag] = false;

  /**
   * The base implementation of `_.clone` and `_.cloneDeep` which tracks
   * traversed objects.
   *
   * @private
   * @param {*} value The value to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @param {boolean} [isFull] Specify a clone including symbols.
   * @param {Function} [customizer] The function to customize cloning.
   * @param {string} [key] The key of `value`.
   * @param {Object} [object] The parent object of `value`.
   * @param {Object} [stack] Tracks traversed objects and their clone counterparts.
   * @returns {*} Returns the cloned value.
   */
  function baseClone(value, isDeep, isFull, customizer, key, object, stack) {
    var result;
    if (customizer) {
      result = object ? customizer(value, key, object, stack) : customizer(value);
    }
    if (result !== undefined) {
      return result;
    }
    if (!isObject(value)) {
      return value;
    }
    var isArr = isArray(value);
    if (isArr) {
      result = initCloneArray(value);
      if (!isDeep) {
        return copyArray(value, result);
      }
    } else {
      var tag = getTag(value),
          isFunc = tag == funcTag || tag == genTag;

      if (isBuffer(value)) {
        return cloneBuffer(value, isDeep);
      }
      if (tag == objectTag || tag == argsTag || isFunc && !object) {
        result = initCloneObject(isFunc ? {} : value);
        if (!isDeep) {
          return copySymbols(value, baseAssign(result, value));
        }
      } else {
        if (!cloneableTags[tag]) {
          return object ? value : {};
        }
        result = initCloneByTag(value, tag, baseClone, isDeep);
      }
    }
    // Check for circular references and return its corresponding clone.
    stack || (stack = new Stack());
    var stacked = stack.get(value);
    if (stacked) {
      return stacked;
    }
    stack.set(value, result);

    var props = isArr ? undefined : (isFull ? getAllKeys : keys)(value);
    arrayEach(props || value, function (subValue, key) {
      if (props) {
        key = subValue;
        subValue = value[key];
      }
      // Recursively populate clone (susceptible to call stack limits).
      assignValue(result, key, baseClone(subValue, isDeep, isFull, customizer, key, value, stack));
    });
    return result;
  }

  module.exports = baseClone;

/***/ },
/* 115 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var ListCache = __webpack_require__(116),
      stackClear = __webpack_require__(124),
      stackDelete = __webpack_require__(125),
      stackGet = __webpack_require__(126),
      stackHas = __webpack_require__(127),
      stackSet = __webpack_require__(128);

  /**
   * Creates a stack cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Stack(entries) {
    var data = this.__data__ = new ListCache(entries);
    this.size = data.size;
  }

  // Add methods to `Stack`.
  Stack.prototype.clear = stackClear;
  Stack.prototype['delete'] = stackDelete;
  Stack.prototype.get = stackGet;
  Stack.prototype.has = stackHas;
  Stack.prototype.set = stackSet;

  module.exports = Stack;

/***/ },
/* 116 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var listCacheClear = __webpack_require__(117),
      listCacheDelete = __webpack_require__(118),
      listCacheGet = __webpack_require__(121),
      listCacheHas = __webpack_require__(122),
      listCacheSet = __webpack_require__(123);

  /**
   * Creates an list cache object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function ListCache(entries) {
      var index = -1,
          length = entries ? entries.length : 0;

      this.clear();
      while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
      }
  }

  // Add methods to `ListCache`.
  ListCache.prototype.clear = listCacheClear;
  ListCache.prototype['delete'] = listCacheDelete;
  ListCache.prototype.get = listCacheGet;
  ListCache.prototype.has = listCacheHas;
  ListCache.prototype.set = listCacheSet;

  module.exports = ListCache;

/***/ },
/* 117 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Removes all key-value entries from the list cache.
   *
   * @private
   * @name clear
   * @memberOf ListCache
   */
  function listCacheClear() {
    this.__data__ = [];
    this.size = 0;
  }

  module.exports = listCacheClear;

/***/ },
/* 118 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var assocIndexOf = __webpack_require__(119);

  /** Used for built-in method references. */
  var arrayProto = Array.prototype;

  /** Built-in value references. */
  var splice = arrayProto.splice;

  /**
   * Removes `key` and its value from the list cache.
   *
   * @private
   * @name delete
   * @memberOf ListCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function listCacheDelete(key) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    if (index < 0) {
      return false;
    }
    var lastIndex = data.length - 1;
    if (index == lastIndex) {
      data.pop();
    } else {
      splice.call(data, index, 1);
    }
    --this.size;
    return true;
  }

  module.exports = listCacheDelete;

/***/ },
/* 119 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var eq = __webpack_require__(120);

  /**
   * Gets the index at which the `key` is found in `array` of key-value pairs.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} key The key to search for.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function assocIndexOf(array, key) {
    var length = array.length;
    while (length--) {
      if (eq(array[length][0], key)) {
        return length;
      }
    }
    return -1;
  }

  module.exports = assocIndexOf;

/***/ },
/* 120 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Performs a
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * comparison between two values to determine if they are equivalent.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   * @example
   *
   * var object = { 'a': 1 };
   * var other = { 'a': 1 };
   *
   * _.eq(object, object);
   * // => true
   *
   * _.eq(object, other);
   * // => false
   *
   * _.eq('a', 'a');
   * // => true
   *
   * _.eq('a', Object('a'));
   * // => false
   *
   * _.eq(NaN, NaN);
   * // => true
   */
  function eq(value, other) {
    return value === other || value !== value && other !== other;
  }

  module.exports = eq;

/***/ },
/* 121 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var assocIndexOf = __webpack_require__(119);

  /**
   * Gets the list cache value for `key`.
   *
   * @private
   * @name get
   * @memberOf ListCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function listCacheGet(key) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    return index < 0 ? undefined : data[index][1];
  }

  module.exports = listCacheGet;

/***/ },
/* 122 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var assocIndexOf = __webpack_require__(119);

  /**
   * Checks if a list cache value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf ListCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function listCacheHas(key) {
    return assocIndexOf(this.__data__, key) > -1;
  }

  module.exports = listCacheHas;

/***/ },
/* 123 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var assocIndexOf = __webpack_require__(119);

  /**
   * Sets the list cache `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf ListCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the list cache instance.
   */
  function listCacheSet(key, value) {
    var data = this.__data__,
        index = assocIndexOf(data, key);

    if (index < 0) {
      ++this.size;
      data.push([key, value]);
    } else {
      data[index][1] = value;
    }
    return this;
  }

  module.exports = listCacheSet;

/***/ },
/* 124 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var ListCache = __webpack_require__(116);

  /**
   * Removes all key-value entries from the stack.
   *
   * @private
   * @name clear
   * @memberOf Stack
   */
  function stackClear() {
    this.__data__ = new ListCache();
    this.size = 0;
  }

  module.exports = stackClear;

/***/ },
/* 125 */
/***/ function(module, exports) {

  'use strict';

  /**
   * Removes `key` and its value from the stack.
   *
   * @private
   * @name delete
   * @memberOf Stack
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function stackDelete(key) {
    var data = this.__data__,
        result = data['delete'](key);

    this.size = data.size;
    return result;
  }

  module.exports = stackDelete;

/***/ },
/* 126 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Gets the stack value for `key`.
   *
   * @private
   * @name get
   * @memberOf Stack
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function stackGet(key) {
    return this.__data__.get(key);
  }

  module.exports = stackGet;

/***/ },
/* 127 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Checks if a stack value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Stack
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function stackHas(key) {
    return this.__data__.has(key);
  }

  module.exports = stackHas;

/***/ },
/* 128 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var ListCache = __webpack_require__(116),
      Map = __webpack_require__(129),
      MapCache = __webpack_require__(138);

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /**
   * Sets the stack `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Stack
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the stack cache instance.
   */
  function stackSet(key, value) {
    var data = this.__data__;
    if (data instanceof ListCache) {
      var pairs = data.__data__;
      if (!Map || pairs.length < LARGE_ARRAY_SIZE - 1) {
        pairs.push([key, value]);
        this.size = ++data.size;
        return this;
      }
      data = this.__data__ = new MapCache(pairs);
    }
    data.set(key, value);
    this.size = data.size;
    return this;
  }

  module.exports = stackSet;

/***/ },
/* 129 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var getNative = __webpack_require__(130),
      root = __webpack_require__(135);

  /* Built-in method references that are verified to be native. */
  var Map = getNative(root, 'Map');

  module.exports = Map;

/***/ },
/* 130 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseIsNative = __webpack_require__(131),
      getValue = __webpack_require__(137);

  /**
   * Gets the native function at `key` of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {string} key The key of the method to get.
   * @returns {*} Returns the function if it's native, else `undefined`.
   */
  function getNative(object, key) {
    var value = getValue(object, key);
    return baseIsNative(value) ? value : undefined;
  }

  module.exports = getNative;

/***/ },
/* 131 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isFunction = __webpack_require__(132),
      isMasked = __webpack_require__(133),
      isObject = __webpack_require__(103),
      toSource = __webpack_require__(136);

  /**
   * Used to match `RegExp`
   * [syntax characters](http://ecma-international.org/ecma-262/7.0/#sec-patterns).
   */
  var reRegExpChar = /[\\^$.*+?()[\]{}|]/g;

  /** Used to detect host constructors (Safari). */
  var reIsHostCtor = /^\[object .+?Constructor\]$/;

  /** Used for built-in method references. */
  var funcProto = Function.prototype,
      objectProto = Object.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /** Used to detect if a method is native. */
  var reIsNative = RegExp('^' + funcToString.call(hasOwnProperty).replace(reRegExpChar, '\\$&').replace(/hasOwnProperty|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');

  /**
   * The base implementation of `_.isNative` without bad shim checks.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a native function,
   *  else `false`.
   */
  function baseIsNative(value) {
    if (!isObject(value) || isMasked(value)) {
      return false;
    }
    var pattern = isFunction(value) ? reIsNative : reIsHostCtor;
    return pattern.test(toSource(value));
  }

  module.exports = baseIsNative;

/***/ },
/* 132 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isObject = __webpack_require__(103);

  /** `Object#toString` result references. */
  var funcTag = '[object Function]',
      genTag = '[object GeneratorFunction]',
      proxyTag = '[object Proxy]';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /**
   * Checks if `value` is classified as a `Function` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a function, else `false`.
   * @example
   *
   * _.isFunction(_);
   * // => true
   *
   * _.isFunction(/abc/);
   * // => false
   */
  function isFunction(value) {
    // The use of `Object#toString` avoids issues with the `typeof` operator
    // in Safari 9 which returns 'object' for typed array and other constructors.
    var tag = isObject(value) ? objectToString.call(value) : '';
    return tag == funcTag || tag == genTag || tag == proxyTag;
  }

  module.exports = isFunction;

/***/ },
/* 133 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var coreJsData = __webpack_require__(134);

  /** Used to detect methods masquerading as native. */
  var maskSrcKey = function () {
    var uid = /[^.]+$/.exec(coreJsData && coreJsData.keys && coreJsData.keys.IE_PROTO || '');
    return uid ? 'Symbol(src)_1.' + uid : '';
  }();

  /**
   * Checks if `func` has its source masked.
   *
   * @private
   * @param {Function} func The function to check.
   * @returns {boolean} Returns `true` if `func` is masked, else `false`.
   */
  function isMasked(func) {
    return !!maskSrcKey && maskSrcKey in func;
  }

  module.exports = isMasked;

/***/ },
/* 134 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var root = __webpack_require__(135);

  /** Used to detect overreaching core-js shims. */
  var coreJsData = root['__core-js_shared__'];

  module.exports = coreJsData;

/***/ },
/* 135 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  var freeGlobal = __webpack_require__(107);

  /** Detect free variable `self`. */
  var freeSelf = (typeof self === 'undefined' ? 'undefined' : _typeof(self)) == 'object' && self && self.Object === Object && self;

  /** Used as a reference to the global object. */
  var root = freeGlobal || freeSelf || Function('return this')();

  module.exports = root;

/***/ },
/* 136 */
/***/ function(module, exports) {

  'use strict';

  /** Used for built-in method references. */
  var funcProto = Function.prototype;

  /** Used to resolve the decompiled source of functions. */
  var funcToString = funcProto.toString;

  /**
   * Converts `func` to its source code.
   *
   * @private
   * @param {Function} func The function to process.
   * @returns {string} Returns the source code.
   */
  function toSource(func) {
    if (func != null) {
      try {
        return funcToString.call(func);
      } catch (e) {}
      try {
        return func + '';
      } catch (e) {}
    }
    return '';
  }

  module.exports = toSource;

/***/ },
/* 137 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Gets the value at `key` of `object`.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {string} key The key of the property to get.
   * @returns {*} Returns the property value.
   */
  function getValue(object, key) {
    return object == null ? undefined : object[key];
  }

  module.exports = getValue;

/***/ },
/* 138 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var mapCacheClear = __webpack_require__(139),
      mapCacheDelete = __webpack_require__(147),
      mapCacheGet = __webpack_require__(150),
      mapCacheHas = __webpack_require__(151),
      mapCacheSet = __webpack_require__(152);

  /**
   * Creates a map cache object to store key-value pairs.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function MapCache(entries) {
      var index = -1,
          length = entries ? entries.length : 0;

      this.clear();
      while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
      }
  }

  // Add methods to `MapCache`.
  MapCache.prototype.clear = mapCacheClear;
  MapCache.prototype['delete'] = mapCacheDelete;
  MapCache.prototype.get = mapCacheGet;
  MapCache.prototype.has = mapCacheHas;
  MapCache.prototype.set = mapCacheSet;

  module.exports = MapCache;

/***/ },
/* 139 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var Hash = __webpack_require__(140),
      ListCache = __webpack_require__(116),
      Map = __webpack_require__(129);

  /**
   * Removes all key-value entries from the map.
   *
   * @private
   * @name clear
   * @memberOf MapCache
   */
  function mapCacheClear() {
    this.size = 0;
    this.__data__ = {
      'hash': new Hash(),
      'map': new (Map || ListCache)(),
      'string': new Hash()
    };
  }

  module.exports = mapCacheClear;

/***/ },
/* 140 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var hashClear = __webpack_require__(141),
      hashDelete = __webpack_require__(143),
      hashGet = __webpack_require__(144),
      hashHas = __webpack_require__(145),
      hashSet = __webpack_require__(146);

  /**
   * Creates a hash object.
   *
   * @private
   * @constructor
   * @param {Array} [entries] The key-value pairs to cache.
   */
  function Hash(entries) {
      var index = -1,
          length = entries ? entries.length : 0;

      this.clear();
      while (++index < length) {
          var entry = entries[index];
          this.set(entry[0], entry[1]);
      }
  }

  // Add methods to `Hash`.
  Hash.prototype.clear = hashClear;
  Hash.prototype['delete'] = hashDelete;
  Hash.prototype.get = hashGet;
  Hash.prototype.has = hashHas;
  Hash.prototype.set = hashSet;

  module.exports = Hash;

/***/ },
/* 141 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var nativeCreate = __webpack_require__(142);

  /**
   * Removes all key-value entries from the hash.
   *
   * @private
   * @name clear
   * @memberOf Hash
   */
  function hashClear() {
    this.__data__ = nativeCreate ? nativeCreate(null) : {};
    this.size = 0;
  }

  module.exports = hashClear;

/***/ },
/* 142 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var getNative = __webpack_require__(130);

  /* Built-in method references that are verified to be native. */
  var nativeCreate = getNative(Object, 'create');

  module.exports = nativeCreate;

/***/ },
/* 143 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Removes `key` and its value from the hash.
   *
   * @private
   * @name delete
   * @memberOf Hash
   * @param {Object} hash The hash to modify.
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function hashDelete(key) {
    var result = this.has(key) && delete this.__data__[key];
    this.size -= result ? 1 : 0;
    return result;
  }

  module.exports = hashDelete;

/***/ },
/* 144 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var nativeCreate = __webpack_require__(142);

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * Gets the hash value for `key`.
   *
   * @private
   * @name get
   * @memberOf Hash
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function hashGet(key) {
    var data = this.__data__;
    if (nativeCreate) {
      var result = data[key];
      return result === HASH_UNDEFINED ? undefined : result;
    }
    return hasOwnProperty.call(data, key) ? data[key] : undefined;
  }

  module.exports = hashGet;

/***/ },
/* 145 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var nativeCreate = __webpack_require__(142);

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * Checks if a hash value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf Hash
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function hashHas(key) {
    var data = this.__data__;
    return nativeCreate ? data[key] !== undefined : hasOwnProperty.call(data, key);
  }

  module.exports = hashHas;

/***/ },
/* 146 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var nativeCreate = __webpack_require__(142);

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';

  /**
   * Sets the hash `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf Hash
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the hash instance.
   */
  function hashSet(key, value) {
    var data = this.__data__;
    this.size += this.has(key) ? 0 : 1;
    data[key] = nativeCreate && value === undefined ? HASH_UNDEFINED : value;
    return this;
  }

  module.exports = hashSet;

/***/ },
/* 147 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var getMapData = __webpack_require__(148);

  /**
   * Removes `key` and its value from the map.
   *
   * @private
   * @name delete
   * @memberOf MapCache
   * @param {string} key The key of the value to remove.
   * @returns {boolean} Returns `true` if the entry was removed, else `false`.
   */
  function mapCacheDelete(key) {
    var result = getMapData(this, key)['delete'](key);
    this.size -= result ? 1 : 0;
    return result;
  }

  module.exports = mapCacheDelete;

/***/ },
/* 148 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isKeyable = __webpack_require__(149);

  /**
   * Gets the data for `map`.
   *
   * @private
   * @param {Object} map The map to query.
   * @param {string} key The reference key.
   * @returns {*} Returns the map data.
   */
  function getMapData(map, key) {
    var data = map.__data__;
    return isKeyable(key) ? data[typeof key == 'string' ? 'string' : 'hash'] : data.map;
  }

  module.exports = getMapData;

/***/ },
/* 149 */
/***/ function(module, exports) {

  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  /**
   * Checks if `value` is suitable for use as unique object key.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is suitable, else `false`.
   */
  function isKeyable(value) {
    var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    return type == 'string' || type == 'number' || type == 'symbol' || type == 'boolean' ? value !== '__proto__' : value === null;
  }

  module.exports = isKeyable;

/***/ },
/* 150 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var getMapData = __webpack_require__(148);

  /**
   * Gets the map value for `key`.
   *
   * @private
   * @name get
   * @memberOf MapCache
   * @param {string} key The key of the value to get.
   * @returns {*} Returns the entry value.
   */
  function mapCacheGet(key) {
    return getMapData(this, key).get(key);
  }

  module.exports = mapCacheGet;

/***/ },
/* 151 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var getMapData = __webpack_require__(148);

  /**
   * Checks if a map value for `key` exists.
   *
   * @private
   * @name has
   * @memberOf MapCache
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function mapCacheHas(key) {
    return getMapData(this, key).has(key);
  }

  module.exports = mapCacheHas;

/***/ },
/* 152 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var getMapData = __webpack_require__(148);

  /**
   * Sets the map `key` to `value`.
   *
   * @private
   * @name set
   * @memberOf MapCache
   * @param {string} key The key of the value to set.
   * @param {*} value The value to set.
   * @returns {Object} Returns the map cache instance.
   */
  function mapCacheSet(key, value) {
    var data = getMapData(this, key),
        size = data.size;

    data.set(key, value);
    this.size += data.size == size ? 0 : 1;
    return this;
  }

  module.exports = mapCacheSet;

/***/ },
/* 153 */
/***/ function(module, exports) {

  "use strict";

  /**
   * A specialized version of `_.forEach` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns `array`.
   */
  function arrayEach(array, iteratee) {
    var index = -1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (iteratee(array[index], index, array) === false) {
        break;
      }
    }
    return array;
  }

  module.exports = arrayEach;

/***/ },
/* 154 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseAssignValue = __webpack_require__(155),
      eq = __webpack_require__(120);

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * Assigns `value` to `key` of `object` if the existing value is not equivalent
   * using [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * for equality comparisons.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function assignValue(object, key, value) {
    var objValue = object[key];
    if (!(hasOwnProperty.call(object, key) && eq(objValue, value)) || value === undefined && !(key in object)) {
      baseAssignValue(object, key, value);
    }
  }

  module.exports = assignValue;

/***/ },
/* 155 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var defineProperty = __webpack_require__(156);

  /**
   * The base implementation of `assignValue` and `assignMergeValue` without
   * value checks.
   *
   * @private
   * @param {Object} object The object to modify.
   * @param {string} key The key of the property to assign.
   * @param {*} value The value to assign.
   */
  function baseAssignValue(object, key, value) {
    if (key == '__proto__' && defineProperty) {
      defineProperty(object, key, {
        'configurable': true,
        'enumerable': true,
        'value': value,
        'writable': true
      });
    } else {
      object[key] = value;
    }
  }

  module.exports = baseAssignValue;

/***/ },
/* 156 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var getNative = __webpack_require__(130);

  var defineProperty = function () {
    try {
      var func = getNative(Object, 'defineProperty');
      func({}, '', {});
      return func;
    } catch (e) {}
  }();

  module.exports = defineProperty;

/***/ },
/* 157 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var copyObject = __webpack_require__(158),
      keys = __webpack_require__(159);

  /**
   * The base implementation of `_.assign` without support for multiple sources
   * or `customizer` functions.
   *
   * @private
   * @param {Object} object The destination object.
   * @param {Object} source The source object.
   * @returns {Object} Returns `object`.
   */
  function baseAssign(object, source) {
    return object && copyObject(source, keys(source), object);
  }

  module.exports = baseAssign;

/***/ },
/* 158 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var assignValue = __webpack_require__(154),
      baseAssignValue = __webpack_require__(155);

  /**
   * Copies properties of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy properties from.
   * @param {Array} props The property identifiers to copy.
   * @param {Object} [object={}] The object to copy properties to.
   * @param {Function} [customizer] The function to customize copied values.
   * @returns {Object} Returns `object`.
   */
  function copyObject(source, props, object, customizer) {
    var isNew = !object;
    object || (object = {});

    var index = -1,
        length = props.length;

    while (++index < length) {
      var key = props[index];

      var newValue = customizer ? customizer(object[key], source[key], key, object, source) : undefined;

      if (newValue === undefined) {
        newValue = source[key];
      }
      if (isNew) {
        baseAssignValue(object, key, newValue);
      } else {
        assignValue(object, key, newValue);
      }
    }
    return object;
  }

  module.exports = copyObject;

/***/ },
/* 159 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var arrayLikeKeys = __webpack_require__(160),
      baseKeys = __webpack_require__(170),
      isArrayLike = __webpack_require__(173);

  /**
   * Creates an array of the own enumerable property names of `object`.
   *
   * **Note:** Non-object values are coerced to objects. See the
   * [ES spec](http://ecma-international.org/ecma-262/7.0/#sec-object.keys)
   * for more details.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Object
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   * @example
   *
   * function Foo() {
   *   this.a = 1;
   *   this.b = 2;
   * }
   *
   * Foo.prototype.c = 3;
   *
   * _.keys(new Foo);
   * // => ['a', 'b'] (iteration order is not guaranteed)
   *
   * _.keys('hi');
   * // => ['0', '1']
   */
  function keys(object) {
    return isArrayLike(object) ? arrayLikeKeys(object) : baseKeys(object);
  }

  module.exports = keys;

/***/ },
/* 160 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseTimes = __webpack_require__(161),
      isArguments = __webpack_require__(162),
      isArray = __webpack_require__(109),
      isBuffer = __webpack_require__(164),
      isIndex = __webpack_require__(166),
      isTypedArray = __webpack_require__(167);

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * Creates an array of the enumerable property names of the array-like `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @param {boolean} inherited Specify returning inherited property names.
   * @returns {Array} Returns the array of property names.
   */
  function arrayLikeKeys(value, inherited) {
    var isArr = isArray(value),
        isArg = !isArr && isArguments(value),
        isBuff = !isArr && !isArg && isBuffer(value),
        isType = !isArr && !isArg && !isBuff && isTypedArray(value),
        skipIndexes = isArr || isArg || isBuff || isType,
        result = skipIndexes ? baseTimes(value.length, String) : [],
        length = result.length;

    for (var key in value) {
      if ((inherited || hasOwnProperty.call(value, key)) && !(skipIndexes && (
      // Safari 9 has enumerable `arguments.length` in strict mode.
      key == 'length' ||
      // Node.js 0.10 has enumerable non-index properties on buffers.
      isBuff && (key == 'offset' || key == 'parent') ||
      // PhantomJS 2 has enumerable non-index properties on typed arrays.
      isType && (key == 'buffer' || key == 'byteLength' || key == 'byteOffset') ||
      // Skip index properties.
      isIndex(key, length)))) {
        result.push(key);
      }
    }
    return result;
  }

  module.exports = arrayLikeKeys;

/***/ },
/* 161 */
/***/ function(module, exports) {

  "use strict";

  /**
   * The base implementation of `_.times` without support for iteratee shorthands
   * or max array length checks.
   *
   * @private
   * @param {number} n The number of times to invoke `iteratee`.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the array of results.
   */
  function baseTimes(n, iteratee) {
    var index = -1,
        result = Array(n);

    while (++index < n) {
      result[index] = iteratee(index);
    }
    return result;
  }

  module.exports = baseTimes;

/***/ },
/* 162 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseIsArguments = __webpack_require__(163),
      isObjectLike = __webpack_require__(99);

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /** Built-in value references. */
  var propertyIsEnumerable = objectProto.propertyIsEnumerable;

  /**
   * Checks if `value` is likely an `arguments` object.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   *  else `false`.
   * @example
   *
   * _.isArguments(function() { return arguments; }());
   * // => true
   *
   * _.isArguments([1, 2, 3]);
   * // => false
   */
  var isArguments = baseIsArguments(function () {
      return arguments;
  }()) ? baseIsArguments : function (value) {
      return isObjectLike(value) && hasOwnProperty.call(value, 'callee') && !propertyIsEnumerable.call(value, 'callee');
  };

  module.exports = isArguments;

/***/ },
/* 163 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isObjectLike = __webpack_require__(99);

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /**
   * The base implementation of `_.isArguments`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is an `arguments` object,
   */
  function baseIsArguments(value) {
    return isObjectLike(value) && objectToString.call(value) == argsTag;
  }

  module.exports = baseIsArguments;

/***/ },
/* 164 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(module) {'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  var root = __webpack_require__(135),
      stubFalse = __webpack_require__(165);

  /** Detect free variable `exports`. */
  var freeExports = ( false ? 'undefined' : _typeof(exports)) == 'object' && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && ( false ? 'undefined' : _typeof(module)) == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Built-in value references. */
  var Buffer = moduleExports ? root.Buffer : undefined;

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeIsBuffer = Buffer ? Buffer.isBuffer : undefined;

  /**
   * Checks if `value` is a buffer.
   *
   * @static
   * @memberOf _
   * @since 4.3.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a buffer, else `false`.
   * @example
   *
   * _.isBuffer(new Buffer(2));
   * // => true
   *
   * _.isBuffer(new Uint8Array(2));
   * // => false
   */
  var isBuffer = nativeIsBuffer || stubFalse;

  module.exports = isBuffer;
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(106)(module)))

/***/ },
/* 165 */
/***/ function(module, exports) {

  "use strict";

  /**
   * This method returns `false`.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {boolean} Returns `false`.
   * @example
   *
   * _.times(2, _.stubFalse);
   * // => [false, false]
   */
  function stubFalse() {
    return false;
  }

  module.exports = stubFalse;

/***/ },
/* 166 */
/***/ function(module, exports) {

  'use strict';

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER = 9007199254740991;

  /** Used to detect unsigned integer values. */
  var reIsUint = /^(?:0|[1-9]\d*)$/;

  /**
   * Checks if `value` is a valid array-like index.
   *
   * @private
   * @param {*} value The value to check.
   * @param {number} [length=MAX_SAFE_INTEGER] The upper bounds of a valid index.
   * @returns {boolean} Returns `true` if `value` is a valid index, else `false`.
   */
  function isIndex(value, length) {
    length = length == null ? MAX_SAFE_INTEGER : length;
    return !!length && (typeof value == 'number' || reIsUint.test(value)) && value > -1 && value % 1 == 0 && value < length;
  }

  module.exports = isIndex;

/***/ },
/* 167 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseIsTypedArray = __webpack_require__(168),
      baseUnary = __webpack_require__(104),
      nodeUtil = __webpack_require__(105);

  /* Node.js helper references. */
  var nodeIsTypedArray = nodeUtil && nodeUtil.isTypedArray;

  /**
   * Checks if `value` is classified as a typed array.
   *
   * @static
   * @memberOf _
   * @since 3.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   * @example
   *
   * _.isTypedArray(new Uint8Array);
   * // => true
   *
   * _.isTypedArray([]);
   * // => false
   */
  var isTypedArray = nodeIsTypedArray ? baseUnary(nodeIsTypedArray) : baseIsTypedArray;

  module.exports = isTypedArray;

/***/ },
/* 168 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isLength = __webpack_require__(169),
      isObjectLike = __webpack_require__(99);

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      funcTag = '[object Function]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      objectTag = '[object Object]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      weakMapTag = '[object WeakMap]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /** Used to identify `toStringTag` values of typed arrays. */
  var typedArrayTags = {};
  typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
  typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dataViewTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /**
   * The base implementation of `_.isTypedArray` without Node.js optimizations.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a typed array, else `false`.
   */
  function baseIsTypedArray(value) {
      return isObjectLike(value) && isLength(value.length) && !!typedArrayTags[objectToString.call(value)];
  }

  module.exports = baseIsTypedArray;

/***/ },
/* 169 */
/***/ function(module, exports) {

  'use strict';

  /** Used as references for various `Number` constants. */
  var MAX_SAFE_INTEGER = 9007199254740991;

  /**
   * Checks if `value` is a valid array-like length.
   *
   * **Note:** This method is loosely based on
   * [`ToLength`](http://ecma-international.org/ecma-262/7.0/#sec-tolength).
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a valid length, else `false`.
   * @example
   *
   * _.isLength(3);
   * // => true
   *
   * _.isLength(Number.MIN_VALUE);
   * // => false
   *
   * _.isLength(Infinity);
   * // => false
   *
   * _.isLength('3');
   * // => false
   */
  function isLength(value) {
    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
  }

  module.exports = isLength;

/***/ },
/* 170 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isPrototype = __webpack_require__(171),
      nativeKeys = __webpack_require__(172);

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * The base implementation of `_.keys` which doesn't treat sparse arrays as dense.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names.
   */
  function baseKeys(object) {
    if (!isPrototype(object)) {
      return nativeKeys(object);
    }
    var result = [];
    for (var key in Object(object)) {
      if (hasOwnProperty.call(object, key) && key != 'constructor') {
        result.push(key);
      }
    }
    return result;
  }

  module.exports = baseKeys;

/***/ },
/* 171 */
/***/ function(module, exports) {

  'use strict';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /**
   * Checks if `value` is likely a prototype object.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a prototype, else `false`.
   */
  function isPrototype(value) {
    var Ctor = value && value.constructor,
        proto = typeof Ctor == 'function' && Ctor.prototype || objectProto;

    return value === proto;
  }

  module.exports = isPrototype;

/***/ },
/* 172 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var overArg = __webpack_require__(98);

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeKeys = overArg(Object.keys, Object);

  module.exports = nativeKeys;

/***/ },
/* 173 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isFunction = __webpack_require__(132),
      isLength = __webpack_require__(169);

  /**
   * Checks if `value` is array-like. A value is considered array-like if it's
   * not a function and has a `value.length` that's an integer greater than or
   * equal to `0` and less than or equal to `Number.MAX_SAFE_INTEGER`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is array-like, else `false`.
   * @example
   *
   * _.isArrayLike([1, 2, 3]);
   * // => true
   *
   * _.isArrayLike(document.body.children);
   * // => true
   *
   * _.isArrayLike('abc');
   * // => true
   *
   * _.isArrayLike(_.noop);
   * // => false
   */
  function isArrayLike(value) {
    return value != null && isLength(value.length) && !isFunction(value);
  }

  module.exports = isArrayLike;

/***/ },
/* 174 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(module) {'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  var root = __webpack_require__(135);

  /** Detect free variable `exports`. */
  var freeExports = ( false ? 'undefined' : _typeof(exports)) == 'object' && exports && !exports.nodeType && exports;

  /** Detect free variable `module`. */
  var freeModule = freeExports && ( false ? 'undefined' : _typeof(module)) == 'object' && module && !module.nodeType && module;

  /** Detect the popular CommonJS extension `module.exports`. */
  var moduleExports = freeModule && freeModule.exports === freeExports;

  /** Built-in value references. */
  var Buffer = moduleExports ? root.Buffer : undefined,
      allocUnsafe = Buffer ? Buffer.allocUnsafe : undefined;

  /**
   * Creates a clone of  `buffer`.
   *
   * @private
   * @param {Buffer} buffer The buffer to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Buffer} Returns the cloned buffer.
   */
  function cloneBuffer(buffer, isDeep) {
    if (isDeep) {
      return buffer.slice();
    }
    var length = buffer.length,
        result = allocUnsafe ? allocUnsafe(length) : new buffer.constructor(length);

    buffer.copy(result);
    return result;
  }

  module.exports = cloneBuffer;
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(106)(module)))

/***/ },
/* 175 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Copies the values of `source` to `array`.
   *
   * @private
   * @param {Array} source The array to copy values from.
   * @param {Array} [array=[]] The array to copy values to.
   * @returns {Array} Returns `array`.
   */
  function copyArray(source, array) {
    var index = -1,
        length = source.length;

    array || (array = Array(length));
    while (++index < length) {
      array[index] = source[index];
    }
    return array;
  }

  module.exports = copyArray;

/***/ },
/* 176 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var copyObject = __webpack_require__(158),
      getSymbols = __webpack_require__(177);

  /**
   * Copies own symbol properties of `source` to `object`.
   *
   * @private
   * @param {Object} source The object to copy symbols from.
   * @param {Object} [object={}] The object to copy symbols to.
   * @returns {Object} Returns `object`.
   */
  function copySymbols(source, object) {
    return copyObject(source, getSymbols(source), object);
  }

  module.exports = copySymbols;

/***/ },
/* 177 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var overArg = __webpack_require__(98),
      stubArray = __webpack_require__(178);

  /* Built-in method references for those with the same name as other `lodash` methods. */
  var nativeGetSymbols = Object.getOwnPropertySymbols;

  /**
   * Creates an array of the own enumerable symbol properties of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of symbols.
   */
  var getSymbols = nativeGetSymbols ? overArg(nativeGetSymbols, Object) : stubArray;

  module.exports = getSymbols;

/***/ },
/* 178 */
/***/ function(module, exports) {

  "use strict";

  /**
   * This method returns a new empty array.
   *
   * @static
   * @memberOf _
   * @since 4.13.0
   * @category Util
   * @returns {Array} Returns the new empty array.
   * @example
   *
   * var arrays = _.times(2, _.stubArray);
   *
   * console.log(arrays);
   * // => [[], []]
   *
   * console.log(arrays[0] === arrays[1]);
   * // => false
   */
  function stubArray() {
    return [];
  }

  module.exports = stubArray;

/***/ },
/* 179 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseGetAllKeys = __webpack_require__(180),
      getSymbols = __webpack_require__(177),
      keys = __webpack_require__(159);

  /**
   * Creates an array of own enumerable property names and symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function getAllKeys(object) {
    return baseGetAllKeys(object, keys, getSymbols);
  }

  module.exports = getAllKeys;

/***/ },
/* 180 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var arrayPush = __webpack_require__(181),
      isArray = __webpack_require__(109);

  /**
   * The base implementation of `getAllKeys` and `getAllKeysIn` which uses
   * `keysFunc` and `symbolsFunc` to get the enumerable property names and
   * symbols of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @param {Function} symbolsFunc The function to get the symbols of `object`.
   * @returns {Array} Returns the array of property names and symbols.
   */
  function baseGetAllKeys(object, keysFunc, symbolsFunc) {
    var result = keysFunc(object);
    return isArray(object) ? result : arrayPush(result, symbolsFunc(object));
  }

  module.exports = baseGetAllKeys;

/***/ },
/* 181 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Appends the elements of `values` to `array`.
   *
   * @private
   * @param {Array} array The array to modify.
   * @param {Array} values The values to append.
   * @returns {Array} Returns `array`.
   */
  function arrayPush(array, values) {
    var index = -1,
        length = values.length,
        offset = array.length;

    while (++index < length) {
      array[offset + index] = values[index];
    }
    return array;
  }

  module.exports = arrayPush;

/***/ },
/* 182 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var DataView = __webpack_require__(183),
      Map = __webpack_require__(129),
      Promise = __webpack_require__(184),
      Set = __webpack_require__(185),
      WeakMap = __webpack_require__(186),
      baseGetTag = __webpack_require__(187),
      toSource = __webpack_require__(136);

  /** `Object#toString` result references. */
  var mapTag = '[object Map]',
      objectTag = '[object Object]',
      promiseTag = '[object Promise]',
      setTag = '[object Set]',
      weakMapTag = '[object WeakMap]';

  var dataViewTag = '[object DataView]';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /** Used to detect maps, sets, and weakmaps. */
  var dataViewCtorString = toSource(DataView),
      mapCtorString = toSource(Map),
      promiseCtorString = toSource(Promise),
      setCtorString = toSource(Set),
      weakMapCtorString = toSource(WeakMap);

  /**
   * Gets the `toStringTag` of `value`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  var getTag = baseGetTag;

  // Fallback for data views, maps, sets, and weak maps in IE 11 and promises in Node.js < 6.
  if (DataView && getTag(new DataView(new ArrayBuffer(1))) != dataViewTag || Map && getTag(new Map()) != mapTag || Promise && getTag(Promise.resolve()) != promiseTag || Set && getTag(new Set()) != setTag || WeakMap && getTag(new WeakMap()) != weakMapTag) {
      getTag = function getTag(value) {
          var result = objectToString.call(value),
              Ctor = result == objectTag ? value.constructor : undefined,
              ctorString = Ctor ? toSource(Ctor) : undefined;

          if (ctorString) {
              switch (ctorString) {
                  case dataViewCtorString:
                      return dataViewTag;
                  case mapCtorString:
                      return mapTag;
                  case promiseCtorString:
                      return promiseTag;
                  case setCtorString:
                      return setTag;
                  case weakMapCtorString:
                      return weakMapTag;
              }
          }
          return result;
      };
  }

  module.exports = getTag;

/***/ },
/* 183 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var getNative = __webpack_require__(130),
      root = __webpack_require__(135);

  /* Built-in method references that are verified to be native. */
  var DataView = getNative(root, 'DataView');

  module.exports = DataView;

/***/ },
/* 184 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var getNative = __webpack_require__(130),
      root = __webpack_require__(135);

  /* Built-in method references that are verified to be native. */
  var Promise = getNative(root, 'Promise');

  module.exports = Promise;

/***/ },
/* 185 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var getNative = __webpack_require__(130),
      root = __webpack_require__(135);

  /* Built-in method references that are verified to be native. */
  var Set = getNative(root, 'Set');

  module.exports = Set;

/***/ },
/* 186 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var getNative = __webpack_require__(130),
      root = __webpack_require__(135);

  /* Built-in method references that are verified to be native. */
  var WeakMap = getNative(root, 'WeakMap');

  module.exports = WeakMap;

/***/ },
/* 187 */
/***/ function(module, exports) {

  "use strict";

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /**
   * The base implementation of `getTag`.
   *
   * @private
   * @param {*} value The value to query.
   * @returns {string} Returns the `toStringTag`.
   */
  function baseGetTag(value) {
    return objectToString.call(value);
  }

  module.exports = baseGetTag;

/***/ },
/* 188 */
/***/ function(module, exports) {

  'use strict';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * Initializes an array clone.
   *
   * @private
   * @param {Array} array The array to clone.
   * @returns {Array} Returns the initialized clone.
   */
  function initCloneArray(array) {
    var length = array.length,
        result = array.constructor(length);

    // Add properties assigned by `RegExp#exec`.
    if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
      result.index = array.index;
      result.input = array.input;
    }
    return result;
  }

  module.exports = initCloneArray;

/***/ },
/* 189 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var cloneArrayBuffer = __webpack_require__(190),
      cloneDataView = __webpack_require__(192),
      cloneMap = __webpack_require__(193),
      cloneRegExp = __webpack_require__(197),
      cloneSet = __webpack_require__(198),
      cloneSymbol = __webpack_require__(201),
      cloneTypedArray = __webpack_require__(203);

  /** `Object#toString` result references. */
  var boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      symbolTag = '[object Symbol]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]',
      float32Tag = '[object Float32Array]',
      float64Tag = '[object Float64Array]',
      int8Tag = '[object Int8Array]',
      int16Tag = '[object Int16Array]',
      int32Tag = '[object Int32Array]',
      uint8Tag = '[object Uint8Array]',
      uint8ClampedTag = '[object Uint8ClampedArray]',
      uint16Tag = '[object Uint16Array]',
      uint32Tag = '[object Uint32Array]';

  /**
   * Initializes an object clone based on its `toStringTag`.
   *
   * **Note:** This function only supports cloning values with tags of
   * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
   *
   * @private
   * @param {Object} object The object to clone.
   * @param {string} tag The `toStringTag` of the object to clone.
   * @param {Function} cloneFunc The function to clone values.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the initialized clone.
   */
  function initCloneByTag(object, tag, cloneFunc, isDeep) {
    var Ctor = object.constructor;
    switch (tag) {
      case arrayBufferTag:
        return cloneArrayBuffer(object);

      case boolTag:
      case dateTag:
        return new Ctor(+object);

      case dataViewTag:
        return cloneDataView(object, isDeep);

      case float32Tag:case float64Tag:
      case int8Tag:case int16Tag:case int32Tag:
      case uint8Tag:case uint8ClampedTag:case uint16Tag:case uint32Tag:
        return cloneTypedArray(object, isDeep);

      case mapTag:
        return cloneMap(object, isDeep, cloneFunc);

      case numberTag:
      case stringTag:
        return new Ctor(object);

      case regexpTag:
        return cloneRegExp(object);

      case setTag:
        return cloneSet(object, isDeep, cloneFunc);

      case symbolTag:
        return cloneSymbol(object);
    }
  }

  module.exports = initCloneByTag;

/***/ },
/* 190 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var Uint8Array = __webpack_require__(191);

  /**
   * Creates a clone of `arrayBuffer`.
   *
   * @private
   * @param {ArrayBuffer} arrayBuffer The array buffer to clone.
   * @returns {ArrayBuffer} Returns the cloned array buffer.
   */
  function cloneArrayBuffer(arrayBuffer) {
    var result = new arrayBuffer.constructor(arrayBuffer.byteLength);
    new Uint8Array(result).set(new Uint8Array(arrayBuffer));
    return result;
  }

  module.exports = cloneArrayBuffer;

/***/ },
/* 191 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var root = __webpack_require__(135);

  /** Built-in value references. */
  var Uint8Array = root.Uint8Array;

  module.exports = Uint8Array;

/***/ },
/* 192 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var cloneArrayBuffer = __webpack_require__(190);

  /**
   * Creates a clone of `dataView`.
   *
   * @private
   * @param {Object} dataView The data view to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned data view.
   */
  function cloneDataView(dataView, isDeep) {
    var buffer = isDeep ? cloneArrayBuffer(dataView.buffer) : dataView.buffer;
    return new dataView.constructor(buffer, dataView.byteOffset, dataView.byteLength);
  }

  module.exports = cloneDataView;

/***/ },
/* 193 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var addMapEntry = __webpack_require__(194),
      arrayReduce = __webpack_require__(195),
      mapToArray = __webpack_require__(196);

  /**
   * Creates a clone of `map`.
   *
   * @private
   * @param {Object} map The map to clone.
   * @param {Function} cloneFunc The function to clone values.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned map.
   */
  function cloneMap(map, isDeep, cloneFunc) {
    var array = isDeep ? cloneFunc(mapToArray(map), true) : mapToArray(map);
    return arrayReduce(array, addMapEntry, new map.constructor());
  }

  module.exports = cloneMap;

/***/ },
/* 194 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Adds the key-value `pair` to `map`.
   *
   * @private
   * @param {Object} map The map to modify.
   * @param {Array} pair The key-value pair to add.
   * @returns {Object} Returns `map`.
   */
  function addMapEntry(map, pair) {
    // Don't return `map.set` because it's not chainable in IE 11.
    map.set(pair[0], pair[1]);
    return map;
  }

  module.exports = addMapEntry;

/***/ },
/* 195 */
/***/ function(module, exports) {

  "use strict";

  /**
   * A specialized version of `_.reduce` for arrays without support for
   * iteratee shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {*} [accumulator] The initial value.
   * @param {boolean} [initAccum] Specify using the first element of `array` as
   *  the initial value.
   * @returns {*} Returns the accumulated value.
   */
  function arrayReduce(array, iteratee, accumulator, initAccum) {
    var index = -1,
        length = array ? array.length : 0;

    if (initAccum && length) {
      accumulator = array[++index];
    }
    while (++index < length) {
      accumulator = iteratee(accumulator, array[index], index, array);
    }
    return accumulator;
  }

  module.exports = arrayReduce;

/***/ },
/* 196 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Converts `map` to its key-value pairs.
   *
   * @private
   * @param {Object} map The map to convert.
   * @returns {Array} Returns the key-value pairs.
   */
  function mapToArray(map) {
    var index = -1,
        result = Array(map.size);

    map.forEach(function (value, key) {
      result[++index] = [key, value];
    });
    return result;
  }

  module.exports = mapToArray;

/***/ },
/* 197 */
/***/ function(module, exports) {

  "use strict";

  /** Used to match `RegExp` flags from their coerced string values. */
  var reFlags = /\w*$/;

  /**
   * Creates a clone of `regexp`.
   *
   * @private
   * @param {Object} regexp The regexp to clone.
   * @returns {Object} Returns the cloned regexp.
   */
  function cloneRegExp(regexp) {
    var result = new regexp.constructor(regexp.source, reFlags.exec(regexp));
    result.lastIndex = regexp.lastIndex;
    return result;
  }

  module.exports = cloneRegExp;

/***/ },
/* 198 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var addSetEntry = __webpack_require__(199),
      arrayReduce = __webpack_require__(195),
      setToArray = __webpack_require__(200);

  /**
   * Creates a clone of `set`.
   *
   * @private
   * @param {Object} set The set to clone.
   * @param {Function} cloneFunc The function to clone values.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned set.
   */
  function cloneSet(set, isDeep, cloneFunc) {
    var array = isDeep ? cloneFunc(setToArray(set), true) : setToArray(set);
    return arrayReduce(array, addSetEntry, new set.constructor());
  }

  module.exports = cloneSet;

/***/ },
/* 199 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Adds `value` to `set`.
   *
   * @private
   * @param {Object} set The set to modify.
   * @param {*} value The value to add.
   * @returns {Object} Returns `set`.
   */
  function addSetEntry(set, value) {
    // Don't return `set.add` because it's not chainable in IE 11.
    set.add(value);
    return set;
  }

  module.exports = addSetEntry;

/***/ },
/* 200 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Converts `set` to an array of its values.
   *
   * @private
   * @param {Object} set The set to convert.
   * @returns {Array} Returns the values.
   */
  function setToArray(set) {
    var index = -1,
        result = Array(set.size);

    set.forEach(function (value) {
      result[++index] = value;
    });
    return result;
  }

  module.exports = setToArray;

/***/ },
/* 201 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var _Symbol = __webpack_require__(202);

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = _Symbol ? _Symbol.prototype : undefined,
      symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

  /**
   * Creates a clone of the `symbol` object.
   *
   * @private
   * @param {Object} symbol The symbol object to clone.
   * @returns {Object} Returns the cloned symbol object.
   */
  function cloneSymbol(symbol) {
    return symbolValueOf ? Object(symbolValueOf.call(symbol)) : {};
  }

  module.exports = cloneSymbol;

/***/ },
/* 202 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var root = __webpack_require__(135);

  /** Built-in value references. */
  var _Symbol = root.Symbol;

  module.exports = _Symbol;

/***/ },
/* 203 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var cloneArrayBuffer = __webpack_require__(190);

  /**
   * Creates a clone of `typedArray`.
   *
   * @private
   * @param {Object} typedArray The typed array to clone.
   * @param {boolean} [isDeep] Specify a deep clone.
   * @returns {Object} Returns the cloned typed array.
   */
  function cloneTypedArray(typedArray, isDeep) {
    var buffer = isDeep ? cloneArrayBuffer(typedArray.buffer) : typedArray.buffer;
    return new typedArray.constructor(buffer, typedArray.byteOffset, typedArray.length);
  }

  module.exports = cloneTypedArray;

/***/ },
/* 204 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseCreate = __webpack_require__(205),
      getPrototype = __webpack_require__(97),
      isPrototype = __webpack_require__(171);

  /**
   * Initializes an object clone.
   *
   * @private
   * @param {Object} object The object to clone.
   * @returns {Object} Returns the initialized clone.
   */
  function initCloneObject(object) {
      return typeof object.constructor == 'function' && !isPrototype(object) ? baseCreate(getPrototype(object)) : {};
  }

  module.exports = initCloneObject;

/***/ },
/* 205 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isObject = __webpack_require__(103);

  /** Built-in value references. */
  var objectCreate = Object.create;

  /**
   * The base implementation of `_.create` without support for assigning
   * properties to the created object.
   *
   * @private
   * @param {Object} proto The object to inherit from.
   * @returns {Object} Returns the new object.
   */
  var baseCreate = function () {
    function object() {}
    return function (proto) {
      if (!isObject(proto)) {
        return {};
      }
      if (objectCreate) {
        return objectCreate(proto);
      }
      object.prototype = proto;
      var result = new object();
      object.prototype = undefined;
      return result;
    };
  }();

  module.exports = baseCreate;

/***/ },
/* 206 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  module.exports = __webpack_require__(207);

/***/ },
/* 207 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var arrayEach = __webpack_require__(153),
      baseEach = __webpack_require__(208),
      baseIteratee = __webpack_require__(213),
      isArray = __webpack_require__(109);

  /**
   * Iterates over elements of `collection` and invokes `iteratee` for each element.
   * The iteratee is invoked with three arguments: (value, index|key, collection).
   * Iteratee functions may exit iteration early by explicitly returning `false`.
   *
   * **Note:** As with other "Collections" methods, objects with a "length"
   * property are iterated like arrays. To avoid this behavior use `_.forIn`
   * or `_.forOwn` for object iteration.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @alias each
   * @category Collection
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function} [iteratee=_.identity] The function invoked per iteration.
   * @returns {Array|Object} Returns `collection`.
   * @see _.forEachRight
   * @example
   *
   * _.forEach([1, 2], function(value) {
   *   console.log(value);
   * });
   * // => Logs `1` then `2`.
   *
   * _.forEach({ 'a': 1, 'b': 2 }, function(value, key) {
   *   console.log(key);
   * });
   * // => Logs 'a' then 'b' (iteration order is not guaranteed).
   */
  function forEach(collection, iteratee) {
    var func = isArray(collection) ? arrayEach : baseEach;
    return func(collection, baseIteratee(iteratee, 3));
  }

  module.exports = forEach;

/***/ },
/* 208 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseForOwn = __webpack_require__(209),
      createBaseEach = __webpack_require__(212);

  /**
   * The base implementation of `_.forEach` without support for iteratee shorthands.
   *
   * @private
   * @param {Array|Object} collection The collection to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array|Object} Returns `collection`.
   */
  var baseEach = createBaseEach(baseForOwn);

  module.exports = baseEach;

/***/ },
/* 209 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseFor = __webpack_require__(210),
      keys = __webpack_require__(159);

  /**
   * The base implementation of `_.forOwn` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Object} Returns `object`.
   */
  function baseForOwn(object, iteratee) {
    return object && baseFor(object, iteratee, keys);
  }

  module.exports = baseForOwn;

/***/ },
/* 210 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var createBaseFor = __webpack_require__(211);

  /**
   * The base implementation of `baseForOwn` which iterates over `object`
   * properties returned by `keysFunc` and invokes `iteratee` for each property.
   * Iteratee functions may exit iteration early by explicitly returning `false`.
   *
   * @private
   * @param {Object} object The object to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @param {Function} keysFunc The function to get the keys of `object`.
   * @returns {Object} Returns `object`.
   */
  var baseFor = createBaseFor();

  module.exports = baseFor;

/***/ },
/* 211 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Creates a base function for methods like `_.forIn` and `_.forOwn`.
   *
   * @private
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */
  function createBaseFor(fromRight) {
    return function (object, iteratee, keysFunc) {
      var index = -1,
          iterable = Object(object),
          props = keysFunc(object),
          length = props.length;

      while (length--) {
        var key = props[fromRight ? length : ++index];
        if (iteratee(iterable[key], key, iterable) === false) {
          break;
        }
      }
      return object;
    };
  }

  module.exports = createBaseFor;

/***/ },
/* 212 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isArrayLike = __webpack_require__(173);

  /**
   * Creates a `baseEach` or `baseEachRight` function.
   *
   * @private
   * @param {Function} eachFunc The function to iterate over a collection.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {Function} Returns the new base function.
   */
  function createBaseEach(eachFunc, fromRight) {
    return function (collection, iteratee) {
      if (collection == null) {
        return collection;
      }
      if (!isArrayLike(collection)) {
        return eachFunc(collection, iteratee);
      }
      var length = collection.length,
          index = fromRight ? length : -1,
          iterable = Object(collection);

      while (fromRight ? index-- : ++index < length) {
        if (iteratee(iterable[index], index, iterable) === false) {
          break;
        }
      }
      return collection;
    };
  }

  module.exports = createBaseEach;

/***/ },
/* 213 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  var baseMatches = __webpack_require__(214),
      baseMatchesProperty = __webpack_require__(229),
      identity = __webpack_require__(245),
      isArray = __webpack_require__(109),
      property = __webpack_require__(246);

  /**
   * The base implementation of `_.iteratee`.
   *
   * @private
   * @param {*} [value=_.identity] The value to convert to an iteratee.
   * @returns {Function} Returns the iteratee.
   */
  function baseIteratee(value) {
    // Don't store the `typeof` result in a variable to avoid a JIT bug in Safari 9.
    // See https://bugs.webkit.org/show_bug.cgi?id=156034 for more details.
    if (typeof value == 'function') {
      return value;
    }
    if (value == null) {
      return identity;
    }
    if ((typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'object') {
      return isArray(value) ? baseMatchesProperty(value[0], value[1]) : baseMatches(value);
    }
    return property(value);
  }

  module.exports = baseIteratee;

/***/ },
/* 214 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseIsMatch = __webpack_require__(215),
      getMatchData = __webpack_require__(226),
      matchesStrictComparable = __webpack_require__(228);

  /**
   * The base implementation of `_.matches` which doesn't clone `source`.
   *
   * @private
   * @param {Object} source The object of property values to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatches(source) {
    var matchData = getMatchData(source);
    if (matchData.length == 1 && matchData[0][2]) {
      return matchesStrictComparable(matchData[0][0], matchData[0][1]);
    }
    return function (object) {
      return object === source || baseIsMatch(object, source, matchData);
    };
  }

  module.exports = baseMatches;

/***/ },
/* 215 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var Stack = __webpack_require__(115),
      baseIsEqual = __webpack_require__(216);

  /** Used to compose bitmasks for comparison styles. */
  var UNORDERED_COMPARE_FLAG = 1,
      PARTIAL_COMPARE_FLAG = 2;

  /**
   * The base implementation of `_.isMatch` without support for iteratee shorthands.
   *
   * @private
   * @param {Object} object The object to inspect.
   * @param {Object} source The object of property values to match.
   * @param {Array} matchData The property names, values, and compare flags to match.
   * @param {Function} [customizer] The function to customize comparisons.
   * @returns {boolean} Returns `true` if `object` is a match, else `false`.
   */
  function baseIsMatch(object, source, matchData, customizer) {
    var index = matchData.length,
        length = index,
        noCustomizer = !customizer;

    if (object == null) {
      return !length;
    }
    object = Object(object);
    while (index--) {
      var data = matchData[index];
      if (noCustomizer && data[2] ? data[1] !== object[data[0]] : !(data[0] in object)) {
        return false;
      }
    }
    while (++index < length) {
      data = matchData[index];
      var key = data[0],
          objValue = object[key],
          srcValue = data[1];

      if (noCustomizer && data[2]) {
        if (objValue === undefined && !(key in object)) {
          return false;
        }
      } else {
        var stack = new Stack();
        if (customizer) {
          var result = customizer(objValue, srcValue, key, object, source, stack);
        }
        if (!(result === undefined ? baseIsEqual(srcValue, objValue, customizer, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG, stack) : result)) {
          return false;
        }
      }
    }
    return true;
  }

  module.exports = baseIsMatch;

/***/ },
/* 216 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseIsEqualDeep = __webpack_require__(217),
      isObject = __webpack_require__(103),
      isObjectLike = __webpack_require__(99);

  /**
   * The base implementation of `_.isEqual` which supports partial comparisons
   * and tracks traversed objects.
   *
   * @private
   * @param {*} value The value to compare.
   * @param {*} other The other value to compare.
   * @param {Function} [customizer] The function to customize comparisons.
   * @param {boolean} [bitmask] The bitmask of comparison flags.
   *  The bitmask may be composed of the following flags:
   *     1 - Unordered comparison
   *     2 - Partial comparison
   * @param {Object} [stack] Tracks traversed `value` and `other` objects.
   * @returns {boolean} Returns `true` if the values are equivalent, else `false`.
   */
  function baseIsEqual(value, other, customizer, bitmask, stack) {
    if (value === other) {
      return true;
    }
    if (value == null || other == null || !isObject(value) && !isObjectLike(other)) {
      return value !== value && other !== other;
    }
    return baseIsEqualDeep(value, other, baseIsEqual, customizer, bitmask, stack);
  }

  module.exports = baseIsEqual;

/***/ },
/* 217 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var Stack = __webpack_require__(115),
      equalArrays = __webpack_require__(218),
      equalByTag = __webpack_require__(224),
      equalObjects = __webpack_require__(225),
      getTag = __webpack_require__(182),
      isArray = __webpack_require__(109),
      isBuffer = __webpack_require__(164),
      isTypedArray = __webpack_require__(167);

  /** Used to compose bitmasks for comparison styles. */
  var PARTIAL_COMPARE_FLAG = 2;

  /** `Object#toString` result references. */
  var argsTag = '[object Arguments]',
      arrayTag = '[object Array]',
      objectTag = '[object Object]';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * A specialized version of `baseIsEqual` for arrays and objects which performs
   * deep comparisons and tracks traversed objects enabling objects with circular
   * references to be compared.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Function} [customizer] The function to customize comparisons.
   * @param {number} [bitmask] The bitmask of comparison flags. See `baseIsEqual`
   *  for more details.
   * @param {Object} [stack] Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function baseIsEqualDeep(object, other, equalFunc, customizer, bitmask, stack) {
    var objIsArr = isArray(object),
        othIsArr = isArray(other),
        objTag = arrayTag,
        othTag = arrayTag;

    if (!objIsArr) {
      objTag = getTag(object);
      objTag = objTag == argsTag ? objectTag : objTag;
    }
    if (!othIsArr) {
      othTag = getTag(other);
      othTag = othTag == argsTag ? objectTag : othTag;
    }
    var objIsObj = objTag == objectTag,
        othIsObj = othTag == objectTag,
        isSameTag = objTag == othTag;

    if (isSameTag && isBuffer(object)) {
      if (!isBuffer(other)) {
        return false;
      }
      objIsArr = true;
      objIsObj = false;
    }
    if (isSameTag && !objIsObj) {
      stack || (stack = new Stack());
      return objIsArr || isTypedArray(object) ? equalArrays(object, other, equalFunc, customizer, bitmask, stack) : equalByTag(object, other, objTag, equalFunc, customizer, bitmask, stack);
    }
    if (!(bitmask & PARTIAL_COMPARE_FLAG)) {
      var objIsWrapped = objIsObj && hasOwnProperty.call(object, '__wrapped__'),
          othIsWrapped = othIsObj && hasOwnProperty.call(other, '__wrapped__');

      if (objIsWrapped || othIsWrapped) {
        var objUnwrapped = objIsWrapped ? object.value() : object,
            othUnwrapped = othIsWrapped ? other.value() : other;

        stack || (stack = new Stack());
        return equalFunc(objUnwrapped, othUnwrapped, customizer, bitmask, stack);
      }
    }
    if (!isSameTag) {
      return false;
    }
    stack || (stack = new Stack());
    return equalObjects(object, other, equalFunc, customizer, bitmask, stack);
  }

  module.exports = baseIsEqualDeep;

/***/ },
/* 218 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var SetCache = __webpack_require__(219),
      arraySome = __webpack_require__(222),
      cacheHas = __webpack_require__(223);

  /** Used to compose bitmasks for comparison styles. */
  var UNORDERED_COMPARE_FLAG = 1,
      PARTIAL_COMPARE_FLAG = 2;

  /**
   * A specialized version of `baseIsEqualDeep` for arrays with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Array} array The array to compare.
   * @param {Array} other The other array to compare.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Function} customizer The function to customize comparisons.
   * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
   *  for more details.
   * @param {Object} stack Tracks traversed `array` and `other` objects.
   * @returns {boolean} Returns `true` if the arrays are equivalent, else `false`.
   */
  function equalArrays(array, other, equalFunc, customizer, bitmask, stack) {
    var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
        arrLength = array.length,
        othLength = other.length;

    if (arrLength != othLength && !(isPartial && othLength > arrLength)) {
      return false;
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(array);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var index = -1,
        result = true,
        seen = bitmask & UNORDERED_COMPARE_FLAG ? new SetCache() : undefined;

    stack.set(array, other);
    stack.set(other, array);

    // Ignore non-index properties.
    while (++index < arrLength) {
      var arrValue = array[index],
          othValue = other[index];

      if (customizer) {
        var compared = isPartial ? customizer(othValue, arrValue, index, other, array, stack) : customizer(arrValue, othValue, index, array, other, stack);
      }
      if (compared !== undefined) {
        if (compared) {
          continue;
        }
        result = false;
        break;
      }
      // Recursively compare arrays (susceptible to call stack limits).
      if (seen) {
        if (!arraySome(other, function (othValue, othIndex) {
          if (!cacheHas(seen, othIndex) && (arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))) {
            return seen.push(othIndex);
          }
        })) {
          result = false;
          break;
        }
      } else if (!(arrValue === othValue || equalFunc(arrValue, othValue, customizer, bitmask, stack))) {
        result = false;
        break;
      }
    }
    stack['delete'](array);
    stack['delete'](other);
    return result;
  }

  module.exports = equalArrays;

/***/ },
/* 219 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var MapCache = __webpack_require__(138),
      setCacheAdd = __webpack_require__(220),
      setCacheHas = __webpack_require__(221);

  /**
   *
   * Creates an array cache object to store unique values.
   *
   * @private
   * @constructor
   * @param {Array} [values] The values to cache.
   */
  function SetCache(values) {
      var index = -1,
          length = values ? values.length : 0;

      this.__data__ = new MapCache();
      while (++index < length) {
          this.add(values[index]);
      }
  }

  // Add methods to `SetCache`.
  SetCache.prototype.add = SetCache.prototype.push = setCacheAdd;
  SetCache.prototype.has = setCacheHas;

  module.exports = SetCache;

/***/ },
/* 220 */
/***/ function(module, exports) {

  'use strict';

  /** Used to stand-in for `undefined` hash values. */
  var HASH_UNDEFINED = '__lodash_hash_undefined__';

  /**
   * Adds `value` to the array cache.
   *
   * @private
   * @name add
   * @memberOf SetCache
   * @alias push
   * @param {*} value The value to cache.
   * @returns {Object} Returns the cache instance.
   */
  function setCacheAdd(value) {
    this.__data__.set(value, HASH_UNDEFINED);
    return this;
  }

  module.exports = setCacheAdd;

/***/ },
/* 221 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Checks if `value` is in the array cache.
   *
   * @private
   * @name has
   * @memberOf SetCache
   * @param {*} value The value to search for.
   * @returns {number} Returns `true` if `value` is found, else `false`.
   */
  function setCacheHas(value) {
    return this.__data__.has(value);
  }

  module.exports = setCacheHas;

/***/ },
/* 222 */
/***/ function(module, exports) {

  "use strict";

  /**
   * A specialized version of `_.some` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} predicate The function invoked per iteration.
   * @returns {boolean} Returns `true` if any element passes the predicate check,
   *  else `false`.
   */
  function arraySome(array, predicate) {
    var index = -1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (predicate(array[index], index, array)) {
        return true;
      }
    }
    return false;
  }

  module.exports = arraySome;

/***/ },
/* 223 */
/***/ function(module, exports) {

  "use strict";

  /**
   * Checks if a `cache` value for `key` exists.
   *
   * @private
   * @param {Object} cache The cache to query.
   * @param {string} key The key of the entry to check.
   * @returns {boolean} Returns `true` if an entry for `key` exists, else `false`.
   */
  function cacheHas(cache, key) {
    return cache.has(key);
  }

  module.exports = cacheHas;

/***/ },
/* 224 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var _Symbol = __webpack_require__(202),
      Uint8Array = __webpack_require__(191),
      eq = __webpack_require__(120),
      equalArrays = __webpack_require__(218),
      mapToArray = __webpack_require__(196),
      setToArray = __webpack_require__(200);

  /** Used to compose bitmasks for comparison styles. */
  var UNORDERED_COMPARE_FLAG = 1,
      PARTIAL_COMPARE_FLAG = 2;

  /** `Object#toString` result references. */
  var boolTag = '[object Boolean]',
      dateTag = '[object Date]',
      errorTag = '[object Error]',
      mapTag = '[object Map]',
      numberTag = '[object Number]',
      regexpTag = '[object RegExp]',
      setTag = '[object Set]',
      stringTag = '[object String]',
      symbolTag = '[object Symbol]';

  var arrayBufferTag = '[object ArrayBuffer]',
      dataViewTag = '[object DataView]';

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = _Symbol ? _Symbol.prototype : undefined,
      symbolValueOf = symbolProto ? symbolProto.valueOf : undefined;

  /**
   * A specialized version of `baseIsEqualDeep` for comparing objects of
   * the same `toStringTag`.
   *
   * **Note:** This function only supports comparing values with tags of
   * `Boolean`, `Date`, `Error`, `Number`, `RegExp`, or `String`.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {string} tag The `toStringTag` of the objects to compare.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Function} customizer The function to customize comparisons.
   * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
   *  for more details.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalByTag(object, other, tag, equalFunc, customizer, bitmask, stack) {
    switch (tag) {
      case dataViewTag:
        if (object.byteLength != other.byteLength || object.byteOffset != other.byteOffset) {
          return false;
        }
        object = object.buffer;
        other = other.buffer;

      case arrayBufferTag:
        if (object.byteLength != other.byteLength || !equalFunc(new Uint8Array(object), new Uint8Array(other))) {
          return false;
        }
        return true;

      case boolTag:
      case dateTag:
      case numberTag:
        // Coerce booleans to `1` or `0` and dates to milliseconds.
        // Invalid dates are coerced to `NaN`.
        return eq(+object, +other);

      case errorTag:
        return object.name == other.name && object.message == other.message;

      case regexpTag:
      case stringTag:
        // Coerce regexes to strings and treat strings, primitives and objects,
        // as equal. See http://www.ecma-international.org/ecma-262/7.0/#sec-regexp.prototype.tostring
        // for more details.
        return object == other + '';

      case mapTag:
        var convert = mapToArray;

      case setTag:
        var isPartial = bitmask & PARTIAL_COMPARE_FLAG;
        convert || (convert = setToArray);

        if (object.size != other.size && !isPartial) {
          return false;
        }
        // Assume cyclic values are equal.
        var stacked = stack.get(object);
        if (stacked) {
          return stacked == other;
        }
        bitmask |= UNORDERED_COMPARE_FLAG;

        // Recursively compare objects (susceptible to call stack limits).
        stack.set(object, other);
        var result = equalArrays(convert(object), convert(other), equalFunc, customizer, bitmask, stack);
        stack['delete'](object);
        return result;

      case symbolTag:
        if (symbolValueOf) {
          return symbolValueOf.call(object) == symbolValueOf.call(other);
        }
    }
    return false;
  }

  module.exports = equalByTag;

/***/ },
/* 225 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var keys = __webpack_require__(159);

  /** Used to compose bitmasks for comparison styles. */
  var PARTIAL_COMPARE_FLAG = 2;

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /** Used to check objects for own properties. */
  var hasOwnProperty = objectProto.hasOwnProperty;

  /**
   * A specialized version of `baseIsEqualDeep` for objects with support for
   * partial deep comparisons.
   *
   * @private
   * @param {Object} object The object to compare.
   * @param {Object} other The other object to compare.
   * @param {Function} equalFunc The function to determine equivalents of values.
   * @param {Function} customizer The function to customize comparisons.
   * @param {number} bitmask The bitmask of comparison flags. See `baseIsEqual`
   *  for more details.
   * @param {Object} stack Tracks traversed `object` and `other` objects.
   * @returns {boolean} Returns `true` if the objects are equivalent, else `false`.
   */
  function equalObjects(object, other, equalFunc, customizer, bitmask, stack) {
    var isPartial = bitmask & PARTIAL_COMPARE_FLAG,
        objProps = keys(object),
        objLength = objProps.length,
        othProps = keys(other),
        othLength = othProps.length;

    if (objLength != othLength && !isPartial) {
      return false;
    }
    var index = objLength;
    while (index--) {
      var key = objProps[index];
      if (!(isPartial ? key in other : hasOwnProperty.call(other, key))) {
        return false;
      }
    }
    // Assume cyclic values are equal.
    var stacked = stack.get(object);
    if (stacked && stack.get(other)) {
      return stacked == other;
    }
    var result = true;
    stack.set(object, other);
    stack.set(other, object);

    var skipCtor = isPartial;
    while (++index < objLength) {
      key = objProps[index];
      var objValue = object[key],
          othValue = other[key];

      if (customizer) {
        var compared = isPartial ? customizer(othValue, objValue, key, other, object, stack) : customizer(objValue, othValue, key, object, other, stack);
      }
      // Recursively compare objects (susceptible to call stack limits).
      if (!(compared === undefined ? objValue === othValue || equalFunc(objValue, othValue, customizer, bitmask, stack) : compared)) {
        result = false;
        break;
      }
      skipCtor || (skipCtor = key == 'constructor');
    }
    if (result && !skipCtor) {
      var objCtor = object.constructor,
          othCtor = other.constructor;

      // Non `Object` object instances with different constructors are not equal.
      if (objCtor != othCtor && 'constructor' in object && 'constructor' in other && !(typeof objCtor == 'function' && objCtor instanceof objCtor && typeof othCtor == 'function' && othCtor instanceof othCtor)) {
        result = false;
      }
    }
    stack['delete'](object);
    stack['delete'](other);
    return result;
  }

  module.exports = equalObjects;

/***/ },
/* 226 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isStrictComparable = __webpack_require__(227),
      keys = __webpack_require__(159);

  /**
   * Gets the property names, values, and compare flags of `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @returns {Array} Returns the match data of `object`.
   */
  function getMatchData(object) {
      var result = keys(object),
          length = result.length;

      while (length--) {
          var key = result[length],
              value = object[key];

          result[length] = [key, value, isStrictComparable(value)];
      }
      return result;
  }

  module.exports = getMatchData;

/***/ },
/* 227 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isObject = __webpack_require__(103);

  /**
   * Checks if `value` is suitable for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` if suitable for strict
   *  equality comparisons, else `false`.
   */
  function isStrictComparable(value) {
    return value === value && !isObject(value);
  }

  module.exports = isStrictComparable;

/***/ },
/* 228 */
/***/ function(module, exports) {

  "use strict";

  /**
   * A specialized version of `matchesProperty` for source values suitable
   * for strict equality comparisons, i.e. `===`.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function matchesStrictComparable(key, srcValue) {
    return function (object) {
      if (object == null) {
        return false;
      }
      return object[key] === srcValue && (srcValue !== undefined || key in Object(object));
    };
  }

  module.exports = matchesStrictComparable;

/***/ },
/* 229 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseIsEqual = __webpack_require__(216),
      get = __webpack_require__(230),
      hasIn = __webpack_require__(242),
      isKey = __webpack_require__(240),
      isStrictComparable = __webpack_require__(227),
      matchesStrictComparable = __webpack_require__(228),
      toKey = __webpack_require__(241);

  /** Used to compose bitmasks for comparison styles. */
  var UNORDERED_COMPARE_FLAG = 1,
      PARTIAL_COMPARE_FLAG = 2;

  /**
   * The base implementation of `_.matchesProperty` which doesn't clone `srcValue`.
   *
   * @private
   * @param {string} path The path of the property to get.
   * @param {*} srcValue The value to match.
   * @returns {Function} Returns the new spec function.
   */
  function baseMatchesProperty(path, srcValue) {
    if (isKey(path) && isStrictComparable(srcValue)) {
      return matchesStrictComparable(toKey(path), srcValue);
    }
    return function (object) {
      var objValue = get(object, path);
      return objValue === undefined && objValue === srcValue ? hasIn(object, path) : baseIsEqual(srcValue, objValue, undefined, UNORDERED_COMPARE_FLAG | PARTIAL_COMPARE_FLAG);
    };
  }

  module.exports = baseMatchesProperty;

/***/ },
/* 230 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseGet = __webpack_require__(231);

  /**
   * Gets the value at `path` of `object`. If the resolved value is
   * `undefined`, the `defaultValue` is returned in its place.
   *
   * @static
   * @memberOf _
   * @since 3.7.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @param {*} [defaultValue] The value returned for `undefined` resolved values.
   * @returns {*} Returns the resolved value.
   * @example
   *
   * var object = { 'a': [{ 'b': { 'c': 3 } }] };
   *
   * _.get(object, 'a[0].b.c');
   * // => 3
   *
   * _.get(object, ['a', '0', 'b', 'c']);
   * // => 3
   *
   * _.get(object, 'a.b.c', 'default');
   * // => 'default'
   */
  function get(object, path, defaultValue) {
    var result = object == null ? undefined : baseGet(object, path);
    return result === undefined ? defaultValue : result;
  }

  module.exports = get;

/***/ },
/* 231 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var castPath = __webpack_require__(232),
      isKey = __webpack_require__(240),
      toKey = __webpack_require__(241);

  /**
   * The base implementation of `_.get` without support for default values.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path of the property to get.
   * @returns {*} Returns the resolved value.
   */
  function baseGet(object, path) {
    path = isKey(path, object) ? [path] : castPath(path);

    var index = 0,
        length = path.length;

    while (object != null && index < length) {
      object = object[toKey(path[index++])];
    }
    return index && index == length ? object : undefined;
  }

  module.exports = baseGet;

/***/ },
/* 232 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isArray = __webpack_require__(109),
      stringToPath = __webpack_require__(233);

  /**
   * Casts `value` to a path array if it's not one.
   *
   * @private
   * @param {*} value The value to inspect.
   * @returns {Array} Returns the cast property path array.
   */
  function castPath(value) {
    return isArray(value) ? value : stringToPath(value);
  }

  module.exports = castPath;

/***/ },
/* 233 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var memoizeCapped = __webpack_require__(234),
      toString = __webpack_require__(236);

  /** Used to match property names within property paths. */
  var reLeadingDot = /^\./,
      rePropName = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;

  /** Used to match backslashes in property paths. */
  var reEscapeChar = /\\(\\)?/g;

  /**
   * Converts `string` to a property path array.
   *
   * @private
   * @param {string} string The string to convert.
   * @returns {Array} Returns the property path array.
   */
  var stringToPath = memoizeCapped(function (string) {
    string = toString(string);

    var result = [];
    if (reLeadingDot.test(string)) {
      result.push('');
    }
    string.replace(rePropName, function (match, number, quote, string) {
      result.push(quote ? string.replace(reEscapeChar, '$1') : number || match);
    });
    return result;
  });

  module.exports = stringToPath;

/***/ },
/* 234 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var memoize = __webpack_require__(235);

  /** Used as the maximum memoize cache size. */
  var MAX_MEMOIZE_SIZE = 500;

  /**
   * A specialized version of `_.memoize` which clears the memoized function's
   * cache when it exceeds `MAX_MEMOIZE_SIZE`.
   *
   * @private
   * @param {Function} func The function to have its output memoized.
   * @returns {Function} Returns the new memoized function.
   */
  function memoizeCapped(func) {
    var result = memoize(func, function (key) {
      if (cache.size === MAX_MEMOIZE_SIZE) {
        cache.clear();
      }
      return key;
    });

    var cache = result.cache;
    return result;
  }

  module.exports = memoizeCapped;

/***/ },
/* 235 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var MapCache = __webpack_require__(138);

  /** Error message constants. */
  var FUNC_ERROR_TEXT = 'Expected a function';

  /**
   * Creates a function that memoizes the result of `func`. If `resolver` is
   * provided, it determines the cache key for storing the result based on the
   * arguments provided to the memoized function. By default, the first argument
   * provided to the memoized function is used as the map cache key. The `func`
   * is invoked with the `this` binding of the memoized function.
   *
   * **Note:** The cache is exposed as the `cache` property on the memoized
   * function. Its creation may be customized by replacing the `_.memoize.Cache`
   * constructor with one whose instances implement the
   * [`Map`](http://ecma-international.org/ecma-262/7.0/#sec-properties-of-the-map-prototype-object)
   * method interface of `delete`, `get`, `has`, and `set`.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Function
   * @param {Function} func The function to have its output memoized.
   * @param {Function} [resolver] The function to resolve the cache key.
   * @returns {Function} Returns the new memoized function.
   * @example
   *
   * var object = { 'a': 1, 'b': 2 };
   * var other = { 'c': 3, 'd': 4 };
   *
   * var values = _.memoize(_.values);
   * values(object);
   * // => [1, 2]
   *
   * values(other);
   * // => [3, 4]
   *
   * object.a = 2;
   * values(object);
   * // => [1, 2]
   *
   * // Modify the result cache.
   * values.cache.set(object, ['a', 'b']);
   * values(object);
   * // => ['a', 'b']
   *
   * // Replace `_.memoize.Cache`.
   * _.memoize.Cache = WeakMap;
   */
  function memoize(func, resolver) {
    if (typeof func != 'function' || resolver && typeof resolver != 'function') {
      throw new TypeError(FUNC_ERROR_TEXT);
    }
    var memoized = function memoized() {
      var args = arguments,
          key = resolver ? resolver.apply(this, args) : args[0],
          cache = memoized.cache;

      if (cache.has(key)) {
        return cache.get(key);
      }
      var result = func.apply(this, args);
      memoized.cache = cache.set(key, result) || cache;
      return result;
    };
    memoized.cache = new (memoize.Cache || MapCache)();
    return memoized;
  }

  // Expose `MapCache`.
  memoize.Cache = MapCache;

  module.exports = memoize;

/***/ },
/* 236 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseToString = __webpack_require__(237);

  /**
   * Converts `value` to a string. An empty string is returned for `null`
   * and `undefined` values. The sign of `-0` is preserved.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to convert.
   * @returns {string} Returns the converted string.
   * @example
   *
   * _.toString(null);
   * // => ''
   *
   * _.toString(-0);
   * // => '-0'
   *
   * _.toString([1, 2, 3]);
   * // => '1,2,3'
   */
  function toString(value) {
    return value == null ? '' : baseToString(value);
  }

  module.exports = toString;

/***/ },
/* 237 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var _Symbol = __webpack_require__(202),
      arrayMap = __webpack_require__(238),
      isArray = __webpack_require__(109),
      isSymbol = __webpack_require__(239);

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0;

  /** Used to convert symbols to primitives and strings. */
  var symbolProto = _Symbol ? _Symbol.prototype : undefined,
      symbolToString = symbolProto ? symbolProto.toString : undefined;

  /**
   * The base implementation of `_.toString` which doesn't convert nullish
   * values to empty strings.
   *
   * @private
   * @param {*} value The value to process.
   * @returns {string} Returns the string.
   */
  function baseToString(value) {
    // Exit early for strings to avoid a performance hit in some environments.
    if (typeof value == 'string') {
      return value;
    }
    if (isArray(value)) {
      // Recursively convert values (susceptible to call stack limits).
      return arrayMap(value, baseToString) + '';
    }
    if (isSymbol(value)) {
      return symbolToString ? symbolToString.call(value) : '';
    }
    var result = value + '';
    return result == '0' && 1 / value == -INFINITY ? '-0' : result;
  }

  module.exports = baseToString;

/***/ },
/* 238 */
/***/ function(module, exports) {

  "use strict";

  /**
   * A specialized version of `_.map` for arrays without support for iteratee
   * shorthands.
   *
   * @private
   * @param {Array} [array] The array to iterate over.
   * @param {Function} iteratee The function invoked per iteration.
   * @returns {Array} Returns the new mapped array.
   */
  function arrayMap(array, iteratee) {
    var index = -1,
        length = array ? array.length : 0,
        result = Array(length);

    while (++index < length) {
      result[index] = iteratee(array[index], index, array);
    }
    return result;
  }

  module.exports = arrayMap;

/***/ },
/* 239 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  var isObjectLike = __webpack_require__(99);

  /** `Object#toString` result references. */
  var symbolTag = '[object Symbol]';

  /** Used for built-in method references. */
  var objectProto = Object.prototype;

  /**
   * Used to resolve the
   * [`toStringTag`](http://ecma-international.org/ecma-262/7.0/#sec-object.prototype.tostring)
   * of values.
   */
  var objectToString = objectProto.toString;

  /**
   * Checks if `value` is classified as a `Symbol` primitive or object.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Lang
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is a symbol, else `false`.
   * @example
   *
   * _.isSymbol(Symbol.iterator);
   * // => true
   *
   * _.isSymbol('abc');
   * // => false
   */
  function isSymbol(value) {
    return (typeof value === 'undefined' ? 'undefined' : _typeof(value)) == 'symbol' || isObjectLike(value) && objectToString.call(value) == symbolTag;
  }

  module.exports = isSymbol;

/***/ },
/* 240 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  var isArray = __webpack_require__(109),
      isSymbol = __webpack_require__(239);

  /** Used to match property names within property paths. */
  var reIsDeepProp = /\.|\[(?:[^[\]]*|(["'])(?:(?!\1)[^\\]|\\.)*?\1)\]/,
      reIsPlainProp = /^\w*$/;

  /**
   * Checks if `value` is a property name and not a property path.
   *
   * @private
   * @param {*} value The value to check.
   * @param {Object} [object] The object to query keys on.
   * @returns {boolean} Returns `true` if `value` is a property name, else `false`.
   */
  function isKey(value, object) {
    if (isArray(value)) {
      return false;
    }
    var type = typeof value === 'undefined' ? 'undefined' : _typeof(value);
    if (type == 'number' || type == 'symbol' || type == 'boolean' || value == null || isSymbol(value)) {
      return true;
    }
    return reIsPlainProp.test(value) || !reIsDeepProp.test(value) || object != null && value in Object(object);
  }

  module.exports = isKey;

/***/ },
/* 241 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var isSymbol = __webpack_require__(239);

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0;

  /**
   * Converts `value` to a string key if it's not a string or symbol.
   *
   * @private
   * @param {*} value The value to inspect.
   * @returns {string|symbol} Returns the key.
   */
  function toKey(value) {
    if (typeof value == 'string' || isSymbol(value)) {
      return value;
    }
    var result = value + '';
    return result == '0' && 1 / value == -INFINITY ? '-0' : result;
  }

  module.exports = toKey;

/***/ },
/* 242 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseHasIn = __webpack_require__(243),
      hasPath = __webpack_require__(244);

  /**
   * Checks if `path` is a direct or inherited property of `object`.
   *
   * @static
   * @memberOf _
   * @since 4.0.0
   * @category Object
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   * @example
   *
   * var object = _.create({ 'a': _.create({ 'b': 2 }) });
   *
   * _.hasIn(object, 'a');
   * // => true
   *
   * _.hasIn(object, 'a.b');
   * // => true
   *
   * _.hasIn(object, ['a', 'b']);
   * // => true
   *
   * _.hasIn(object, 'b');
   * // => false
   */
  function hasIn(object, path) {
    return object != null && hasPath(object, path, baseHasIn);
  }

  module.exports = hasIn;

/***/ },
/* 243 */
/***/ function(module, exports) {

  "use strict";

  /**
   * The base implementation of `_.hasIn` without support for deep paths.
   *
   * @private
   * @param {Object} [object] The object to query.
   * @param {Array|string} key The key to check.
   * @returns {boolean} Returns `true` if `key` exists, else `false`.
   */
  function baseHasIn(object, key) {
    return object != null && key in Object(object);
  }

  module.exports = baseHasIn;

/***/ },
/* 244 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var castPath = __webpack_require__(232),
      isArguments = __webpack_require__(162),
      isArray = __webpack_require__(109),
      isIndex = __webpack_require__(166),
      isKey = __webpack_require__(240),
      isLength = __webpack_require__(169),
      toKey = __webpack_require__(241);

  /**
   * Checks if `path` exists on `object`.
   *
   * @private
   * @param {Object} object The object to query.
   * @param {Array|string} path The path to check.
   * @param {Function} hasFunc The function to check properties.
   * @returns {boolean} Returns `true` if `path` exists, else `false`.
   */
  function hasPath(object, path, hasFunc) {
    path = isKey(path, object) ? [path] : castPath(path);

    var index = -1,
        length = path.length,
        result = false;

    while (++index < length) {
      var key = toKey(path[index]);
      if (!(result = object != null && hasFunc(object, key))) {
        break;
      }
      object = object[key];
    }
    if (result || ++index != length) {
      return result;
    }
    length = object ? object.length : 0;
    return !!length && isLength(length) && isIndex(key, length) && (isArray(object) || isArguments(object));
  }

  module.exports = hasPath;

/***/ },
/* 245 */
/***/ function(module, exports) {

  "use strict";

  /**
   * This method returns the first argument it receives.
   *
   * @static
   * @since 0.1.0
   * @memberOf _
   * @category Util
   * @param {*} value Any value.
   * @returns {*} Returns `value`.
   * @example
   *
   * var object = { 'a': 1 };
   *
   * console.log(_.identity(object) === object);
   * // => true
   */
  function identity(value) {
    return value;
  }

  module.exports = identity;

/***/ },
/* 246 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseProperty = __webpack_require__(247),
      basePropertyDeep = __webpack_require__(248),
      isKey = __webpack_require__(240),
      toKey = __webpack_require__(241);

  /**
   * Creates a function that returns the value at `path` of a given object.
   *
   * @static
   * @memberOf _
   * @since 2.4.0
   * @category Util
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   * @example
   *
   * var objects = [
   *   { 'a': { 'b': 2 } },
   *   { 'a': { 'b': 1 } }
   * ];
   *
   * _.map(objects, _.property('a.b'));
   * // => [2, 1]
   *
   * _.map(_.sortBy(objects, _.property(['a', 'b'])), 'a.b');
   * // => [1, 2]
   */
  function property(path) {
    return isKey(path) ? baseProperty(toKey(path)) : basePropertyDeep(path);
  }

  module.exports = property;

/***/ },
/* 247 */
/***/ function(module, exports) {

  "use strict";

  /**
   * The base implementation of `_.property` without support for deep paths.
   *
   * @private
   * @param {string} key The key of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function baseProperty(key) {
    return function (object) {
      return object == null ? undefined : object[key];
    };
  }

  module.exports = baseProperty;

/***/ },
/* 248 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseGet = __webpack_require__(231);

  /**
   * A specialized version of `baseProperty` which supports deep paths.
   *
   * @private
   * @param {Array|string} path The path of the property to get.
   * @returns {Function} Returns the new accessor function.
   */
  function basePropertyDeep(path) {
    return function (object) {
      return baseGet(object, path);
    };
  }

  module.exports = basePropertyDeep;

/***/ },
/* 249 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseUniq = __webpack_require__(250);

  /**
   * Creates a duplicate-free version of an array, using
   * [`SameValueZero`](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero)
   * for equality comparisons, in which only the first occurrence of each element
   * is kept. The order of result values is determined by the order they occur
   * in the array.
   *
   * @static
   * @memberOf _
   * @since 0.1.0
   * @category Array
   * @param {Array} array The array to inspect.
   * @returns {Array} Returns the new duplicate free array.
   * @example
   *
   * _.uniq([2, 1, 2]);
   * // => [2, 1]
   */
  function uniq(array) {
    return array && array.length ? baseUniq(array) : [];
  }

  module.exports = uniq;

/***/ },
/* 250 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var SetCache = __webpack_require__(219),
      arrayIncludes = __webpack_require__(251),
      arrayIncludesWith = __webpack_require__(256),
      cacheHas = __webpack_require__(223),
      createSet = __webpack_require__(257),
      setToArray = __webpack_require__(200);

  /** Used as the size to enable large array optimizations. */
  var LARGE_ARRAY_SIZE = 200;

  /**
   * The base implementation of `_.uniqBy` without support for iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} [iteratee] The iteratee invoked per element.
   * @param {Function} [comparator] The comparator invoked per element.
   * @returns {Array} Returns the new duplicate free array.
   */
  function baseUniq(array, iteratee, comparator) {
    var index = -1,
        includes = arrayIncludes,
        length = array.length,
        isCommon = true,
        result = [],
        seen = result;

    if (comparator) {
      isCommon = false;
      includes = arrayIncludesWith;
    } else if (length >= LARGE_ARRAY_SIZE) {
      var set = iteratee ? null : createSet(array);
      if (set) {
        return setToArray(set);
      }
      isCommon = false;
      includes = cacheHas;
      seen = new SetCache();
    } else {
      seen = iteratee ? [] : result;
    }
    outer: while (++index < length) {
      var value = array[index],
          computed = iteratee ? iteratee(value) : value;

      value = comparator || value !== 0 ? value : 0;
      if (isCommon && computed === computed) {
        var seenIndex = seen.length;
        while (seenIndex--) {
          if (seen[seenIndex] === computed) {
            continue outer;
          }
        }
        if (iteratee) {
          seen.push(computed);
        }
        result.push(value);
      } else if (!includes(seen, computed, comparator)) {
        if (seen !== result) {
          seen.push(computed);
        }
        result.push(value);
      }
    }
    return result;
  }

  module.exports = baseUniq;

/***/ },
/* 251 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseIndexOf = __webpack_require__(252);

  /**
   * A specialized version of `_.includes` for arrays without support for
   * specifying an index to search from.
   *
   * @private
   * @param {Array} [array] The array to inspect.
   * @param {*} target The value to search for.
   * @returns {boolean} Returns `true` if `target` is found, else `false`.
   */
  function arrayIncludes(array, value) {
    var length = array ? array.length : 0;
    return !!length && baseIndexOf(array, value, 0) > -1;
  }

  module.exports = arrayIncludes;

/***/ },
/* 252 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var baseFindIndex = __webpack_require__(253),
      baseIsNaN = __webpack_require__(254),
      strictIndexOf = __webpack_require__(255);

  /**
   * The base implementation of `_.indexOf` without `fromIndex` bounds checks.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseIndexOf(array, value, fromIndex) {
      return value === value ? strictIndexOf(array, value, fromIndex) : baseFindIndex(array, baseIsNaN, fromIndex);
  }

  module.exports = baseIndexOf;

/***/ },
/* 253 */
/***/ function(module, exports) {

  "use strict";

  /**
   * The base implementation of `_.findIndex` and `_.findLastIndex` without
   * support for iteratee shorthands.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {Function} predicate The function invoked per iteration.
   * @param {number} fromIndex The index to search from.
   * @param {boolean} [fromRight] Specify iterating from right to left.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function baseFindIndex(array, predicate, fromIndex, fromRight) {
    var length = array.length,
        index = fromIndex + (fromRight ? 1 : -1);

    while (fromRight ? index-- : ++index < length) {
      if (predicate(array[index], index, array)) {
        return index;
      }
    }
    return -1;
  }

  module.exports = baseFindIndex;

/***/ },
/* 254 */
/***/ function(module, exports) {

  "use strict";

  /**
   * The base implementation of `_.isNaN` without support for number objects.
   *
   * @private
   * @param {*} value The value to check.
   * @returns {boolean} Returns `true` if `value` is `NaN`, else `false`.
   */
  function baseIsNaN(value) {
    return value !== value;
  }

  module.exports = baseIsNaN;

/***/ },
/* 255 */
/***/ function(module, exports) {

  "use strict";

  /**
   * A specialized version of `_.indexOf` which performs strict equality
   * comparisons of values, i.e. `===`.
   *
   * @private
   * @param {Array} array The array to inspect.
   * @param {*} value The value to search for.
   * @param {number} fromIndex The index to search from.
   * @returns {number} Returns the index of the matched value, else `-1`.
   */
  function strictIndexOf(array, value, fromIndex) {
    var index = fromIndex - 1,
        length = array.length;

    while (++index < length) {
      if (array[index] === value) {
        return index;
      }
    }
    return -1;
  }

  module.exports = strictIndexOf;

/***/ },
/* 256 */
/***/ function(module, exports) {

  "use strict";

  /**
   * This function is like `arrayIncludes` except that it accepts a comparator.
   *
   * @private
   * @param {Array} [array] The array to inspect.
   * @param {*} target The value to search for.
   * @param {Function} comparator The comparator invoked per element.
   * @returns {boolean} Returns `true` if `target` is found, else `false`.
   */
  function arrayIncludesWith(array, value, comparator) {
    var index = -1,
        length = array ? array.length : 0;

    while (++index < length) {
      if (comparator(value, array[index])) {
        return true;
      }
    }
    return false;
  }

  module.exports = arrayIncludesWith;

/***/ },
/* 257 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var Set = __webpack_require__(185),
      noop = __webpack_require__(258),
      setToArray = __webpack_require__(200);

  /** Used as references for various `Number` constants. */
  var INFINITY = 1 / 0;

  /**
   * Creates a set object of `values`.
   *
   * @private
   * @param {Array} values The values to add to the set.
   * @returns {Object} Returns the new set.
   */
  var createSet = !(Set && 1 / setToArray(new Set([, -0]))[1] == INFINITY) ? noop : function (values) {
    return new Set(values);
  };

  module.exports = createSet;

/***/ },
/* 258 */
/***/ function(module, exports) {

  "use strict";

  /**
   * This method returns `undefined`.
   *
   * @static
   * @memberOf _
   * @since 2.3.0
   * @category Util
   * @example
   *
   * _.times(2, _.noop);
   * // => [undefined, undefined]
   */
  function noop() {
    // No operation performed.
  }

  module.exports = noop;

/***/ },
/* 259 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  __webpack_require__(260);

  __webpack_require__(269);

  __webpack_require__(270);

  __webpack_require__(271);

  __webpack_require__(272);

  __webpack_require__(273);

  __webpack_require__(274);

/***/ },
/* 260 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  exports.__esModule = true;
  exports.DEPRECATED_KEYS = exports.BUILDER_KEYS = exports.NODE_FIELDS = exports.ALIAS_KEYS = exports.VISITOR_KEYS = undefined;

  var _getIterator2 = __webpack_require__(58);

  var _getIterator3 = _interopRequireDefault(_getIterator2);

  var _stringify = __webpack_require__(78);

  var _stringify2 = _interopRequireDefault(_stringify);

  var _typeof2 = __webpack_require__(261);

  var _typeof3 = _interopRequireDefault(_typeof2);

  exports.assertEach = assertEach;
  exports.assertOneOf = assertOneOf;
  exports.assertNodeType = assertNodeType;
  exports.assertNodeOrValueType = assertNodeOrValueType;
  exports.assertValueType = assertValueType;
  exports.chain = chain;
  exports.default = defineType;

  var _index = __webpack_require__(6);

  var t = _interopRequireWildcard(_index);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }newObj.default = obj;return newObj;
    }
  }

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  var VISITOR_KEYS = exports.VISITOR_KEYS = {};
  var ALIAS_KEYS = exports.ALIAS_KEYS = {};
  var NODE_FIELDS = exports.NODE_FIELDS = {};
  var BUILDER_KEYS = exports.BUILDER_KEYS = {};
  var DEPRECATED_KEYS = exports.DEPRECATED_KEYS = {};

  function getType(val) {
    if (Array.isArray(val)) {
      return "array";
    } else if (val === null) {
      return "null";
    } else if (val === undefined) {
      return "undefined";
    } else {
      return typeof val === "undefined" ? "undefined" : (0, _typeof3.default)(val);
    }
  }

  function assertEach(callback) {
    function validator(node, key, val) {
      if (!Array.isArray(val)) return;

      for (var i = 0; i < val.length; i++) {
        callback(node, key + "[" + i + "]", val[i]);
      }
    }
    validator.each = callback;
    return validator;
  }

  function assertOneOf() {
    for (var _len = arguments.length, vals = Array(_len), _key = 0; _key < _len; _key++) {
      vals[_key] = arguments[_key];
    }

    function validate(node, key, val) {
      if (vals.indexOf(val) < 0) {
        throw new TypeError("Property " + key + " expected value to be one of " + (0, _stringify2.default)(vals) + " but got " + (0, _stringify2.default)(val));
      }
    }

    validate.oneOf = vals;

    return validate;
  }

  function assertNodeType() {
    for (var _len2 = arguments.length, types = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
      types[_key2] = arguments[_key2];
    }

    function validate(node, key, val) {
      var valid = false;

      for (var _iterator = types, _isArray = Array.isArray(_iterator), _i = 0, _iterator = _isArray ? _iterator : (0, _getIterator3.default)(_iterator);;) {
        var _ref;

        if (_isArray) {
          if (_i >= _iterator.length) break;
          _ref = _iterator[_i++];
        } else {
          _i = _iterator.next();
          if (_i.done) break;
          _ref = _i.value;
        }

        var type = _ref;

        if (t.is(type, val)) {
          valid = true;
          break;
        }
      }

      if (!valid) {
        throw new TypeError("Property " + key + " of " + node.type + " expected node to be of a type " + (0, _stringify2.default)(types) + " " + ("but instead got " + (0, _stringify2.default)(val && val.type)));
      }
    }

    validate.oneOfNodeTypes = types;

    return validate;
  }

  function assertNodeOrValueType() {
    for (var _len3 = arguments.length, types = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
      types[_key3] = arguments[_key3];
    }

    function validate(node, key, val) {
      var valid = false;

      for (var _iterator2 = types, _isArray2 = Array.isArray(_iterator2), _i2 = 0, _iterator2 = _isArray2 ? _iterator2 : (0, _getIterator3.default)(_iterator2);;) {
        var _ref2;

        if (_isArray2) {
          if (_i2 >= _iterator2.length) break;
          _ref2 = _iterator2[_i2++];
        } else {
          _i2 = _iterator2.next();
          if (_i2.done) break;
          _ref2 = _i2.value;
        }

        var type = _ref2;

        if (getType(val) === type || t.is(type, val)) {
          valid = true;
          break;
        }
      }

      if (!valid) {
        throw new TypeError("Property " + key + " of " + node.type + " expected node to be of a type " + (0, _stringify2.default)(types) + " " + ("but instead got " + (0, _stringify2.default)(val && val.type)));
      }
    }

    validate.oneOfNodeOrValueTypes = types;

    return validate;
  }

  function assertValueType(type) {
    function validate(node, key, val) {
      var valid = getType(val) === type;

      if (!valid) {
        throw new TypeError("Property " + key + " expected type of " + type + " but got " + getType(val));
      }
    }

    validate.type = type;

    return validate;
  }

  function chain() {
    for (var _len4 = arguments.length, fns = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
      fns[_key4] = arguments[_key4];
    }

    function validate() {
      for (var _iterator3 = fns, _isArray3 = Array.isArray(_iterator3), _i3 = 0, _iterator3 = _isArray3 ? _iterator3 : (0, _getIterator3.default)(_iterator3);;) {
        var _ref3;

        if (_isArray3) {
          if (_i3 >= _iterator3.length) break;
          _ref3 = _iterator3[_i3++];
        } else {
          _i3 = _iterator3.next();
          if (_i3.done) break;
          _ref3 = _i3.value;
        }

        var fn = _ref3;

        fn.apply(undefined, arguments);
      }
    }
    validate.chainOf = fns;
    return validate;
  }

  function defineType(type) {
    var opts = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

    var inherits = opts.inherits && store[opts.inherits] || {};

    opts.fields = opts.fields || inherits.fields || {};
    opts.visitor = opts.visitor || inherits.visitor || [];
    opts.aliases = opts.aliases || inherits.aliases || [];
    opts.builder = opts.builder || inherits.builder || opts.visitor || [];

    if (opts.deprecatedAlias) {
      DEPRECATED_KEYS[opts.deprecatedAlias] = type;
    }

    for (var _iterator4 = opts.visitor.concat(opts.builder), _isArray4 = Array.isArray(_iterator4), _i4 = 0, _iterator4 = _isArray4 ? _iterator4 : (0, _getIterator3.default)(_iterator4);;) {
      var _ref4;

      if (_isArray4) {
        if (_i4 >= _iterator4.length) break;
        _ref4 = _iterator4[_i4++];
      } else {
        _i4 = _iterator4.next();
        if (_i4.done) break;
        _ref4 = _i4.value;
      }

      var _key5 = _ref4;

      opts.fields[_key5] = opts.fields[_key5] || {};
    }

    for (var key in opts.fields) {
      var field = opts.fields[key];

      if (opts.builder.indexOf(key) === -1) {
        field.optional = true;
      }
      if (field.default === undefined) {
        field.default = null;
      } else if (!field.validate) {
        field.validate = assertValueType(getType(field.default));
      }
    }

    VISITOR_KEYS[type] = opts.visitor;
    BUILDER_KEYS[type] = opts.builder;
    NODE_FIELDS[type] = opts.fields;
    ALIAS_KEYS[type] = opts.aliases;

    store[type] = opts;
  }

  var store = {};

/***/ },
/* 261 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  var _typeof2 = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  exports.__esModule = true;

  var _iterator = __webpack_require__(262);

  var _iterator2 = _interopRequireDefault(_iterator);

  var _symbol = __webpack_require__(264);

  var _symbol2 = _interopRequireDefault(_symbol);

  var _typeof = typeof _symbol2.default === "function" && _typeof2(_iterator2.default) === "symbol" ? function (obj) {
    return typeof obj === "undefined" ? "undefined" : _typeof2(obj);
  } : function (obj) {
    return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof2(obj);
  };

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  exports.default = typeof _symbol2.default === "function" && _typeof(_iterator2.default) === "symbol" ? function (obj) {
    return typeof obj === "undefined" ? "undefined" : _typeof(obj);
  } : function (obj) {
    return obj && typeof _symbol2.default === "function" && obj.constructor === _symbol2.default ? "symbol" : typeof obj === "undefined" ? "undefined" : _typeof(obj);
  };

/***/ },
/* 262 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  module.exports = { "default": __webpack_require__(263), __esModule: true };

/***/ },
/* 263 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  __webpack_require__(69);
  __webpack_require__(60);
  module.exports = __webpack_require__(32).f('iterator');

/***/ },
/* 264 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  module.exports = { "default": __webpack_require__(265), __esModule: true };

/***/ },
/* 265 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  __webpack_require__(9);
  __webpack_require__(266);
  __webpack_require__(267);
  __webpack_require__(268);
  module.exports = __webpack_require__(15).Symbol;

/***/ },
/* 266 */
/***/ function(module, exports) {

  "use strict";

/***/ },
/* 267 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  __webpack_require__(33)('asyncIterator');

/***/ },
/* 268 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  __webpack_require__(33)('observable');

/***/ },
/* 269 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  var _index = __webpack_require__(6);

  var t = _interopRequireWildcard(_index);

  var _constants = __webpack_require__(80);

  var _index2 = __webpack_require__(260);

  var _index3 = _interopRequireDefault(_index2);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }newObj.default = obj;return newObj;
    }
  }

  (0, _index3.default)("ArrayExpression", {
    fields: {
      elements: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeOrValueType)("null", "Expression", "SpreadElement"))),
        default: []
      }
    },
    visitor: ["elements"],
    aliases: ["Expression"]
  });

  (0, _index3.default)("AssignmentExpression", {
    fields: {
      operator: {
        validate: (0, _index2.assertValueType)("string")
      },
      left: {
        validate: (0, _index2.assertNodeType)("LVal")
      },
      right: {
        validate: (0, _index2.assertNodeType)("Expression")
      }
    },
    builder: ["operator", "left", "right"],
    visitor: ["left", "right"],
    aliases: ["Expression"]
  });

  (0, _index3.default)("BinaryExpression", {
    builder: ["operator", "left", "right"],
    fields: {
      operator: {
        validate: _index2.assertOneOf.apply(undefined, _constants.BINARY_OPERATORS)
      },
      left: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      right: {
        validate: (0, _index2.assertNodeType)("Expression")
      }
    },
    visitor: ["left", "right"],
    aliases: ["Binary", "Expression"]
  });

  (0, _index3.default)("Directive", {
    visitor: ["value"],
    fields: {
      value: {
        validate: (0, _index2.assertNodeType)("DirectiveLiteral")
      }
    }
  });

  (0, _index3.default)("DirectiveLiteral", {
    builder: ["value"],
    fields: {
      value: {
        validate: (0, _index2.assertValueType)("string")
      }
    }
  });

  (0, _index3.default)("BlockStatement", {
    builder: ["body", "directives"],
    visitor: ["directives", "body"],
    fields: {
      directives: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("Directive"))),
        default: []
      },
      body: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("Statement")))
      }
    },
    aliases: ["Scopable", "BlockParent", "Block", "Statement"]
  });

  (0, _index3.default)("BreakStatement", {
    visitor: ["label"],
    fields: {
      label: {
        validate: (0, _index2.assertNodeType)("Identifier"),
        optional: true
      }
    },
    aliases: ["Statement", "Terminatorless", "CompletionStatement"]
  });

  (0, _index3.default)("CallExpression", {
    visitor: ["callee", "arguments"],
    fields: {
      callee: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      arguments: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("Expression", "SpreadElement")))
      }
    },
    aliases: ["Expression"]
  });

  (0, _index3.default)("CatchClause", {
    visitor: ["param", "body"],
    fields: {
      param: {
        validate: (0, _index2.assertNodeType)("Identifier")
      },
      body: {
        validate: (0, _index2.assertNodeType)("BlockStatement")
      }
    },
    aliases: ["Scopable"]
  });

  (0, _index3.default)("ConditionalExpression", {
    visitor: ["test", "consequent", "alternate"],
    fields: {
      test: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      consequent: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      alternate: {
        validate: (0, _index2.assertNodeType)("Expression")
      }
    },
    aliases: ["Expression", "Conditional"]
  });

  (0, _index3.default)("ContinueStatement", {
    visitor: ["label"],
    fields: {
      label: {
        validate: (0, _index2.assertNodeType)("Identifier"),
        optional: true
      }
    },
    aliases: ["Statement", "Terminatorless", "CompletionStatement"]
  });

  (0, _index3.default)("DebuggerStatement", {
    aliases: ["Statement"]
  });

  (0, _index3.default)("DoWhileStatement", {
    visitor: ["test", "body"],
    fields: {
      test: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      body: {
        validate: (0, _index2.assertNodeType)("Statement")
      }
    },
    aliases: ["Statement", "BlockParent", "Loop", "While", "Scopable"]
  });

  (0, _index3.default)("EmptyStatement", {
    aliases: ["Statement"]
  });

  (0, _index3.default)("ExpressionStatement", {
    visitor: ["expression"],
    fields: {
      expression: {
        validate: (0, _index2.assertNodeType)("Expression")
      }
    },
    aliases: ["Statement", "ExpressionWrapper"]
  });

  (0, _index3.default)("File", {
    builder: ["program", "comments", "tokens"],
    visitor: ["program"],
    fields: {
      program: {
        validate: (0, _index2.assertNodeType)("Program")
      }
    }
  });

  (0, _index3.default)("ForInStatement", {
    visitor: ["left", "right", "body"],
    aliases: ["Scopable", "Statement", "For", "BlockParent", "Loop", "ForXStatement"],
    fields: {
      left: {
        validate: (0, _index2.assertNodeType)("VariableDeclaration", "LVal")
      },
      right: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      body: {
        validate: (0, _index2.assertNodeType)("Statement")
      }
    }
  });

  (0, _index3.default)("ForStatement", {
    visitor: ["init", "test", "update", "body"],
    aliases: ["Scopable", "Statement", "For", "BlockParent", "Loop"],
    fields: {
      init: {
        validate: (0, _index2.assertNodeType)("VariableDeclaration", "Expression"),
        optional: true
      },
      test: {
        validate: (0, _index2.assertNodeType)("Expression"),
        optional: true
      },
      update: {
        validate: (0, _index2.assertNodeType)("Expression"),
        optional: true
      },
      body: {
        validate: (0, _index2.assertNodeType)("Statement")
      }
    }
  });

  (0, _index3.default)("FunctionDeclaration", {
    builder: ["id", "params", "body", "generator", "async"],
    visitor: ["id", "params", "body", "returnType", "typeParameters"],
    fields: {
      id: {
        validate: (0, _index2.assertNodeType)("Identifier")
      },
      params: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("LVal")))
      },
      body: {
        validate: (0, _index2.assertNodeType)("BlockStatement")
      },
      generator: {
        default: false,
        validate: (0, _index2.assertValueType)("boolean")
      },
      async: {
        default: false,
        validate: (0, _index2.assertValueType)("boolean")
      }
    },
    aliases: ["Scopable", "Function", "BlockParent", "FunctionParent", "Statement", "Pureish", "Declaration"]
  });

  (0, _index3.default)("FunctionExpression", {
    inherits: "FunctionDeclaration",
    aliases: ["Scopable", "Function", "BlockParent", "FunctionParent", "Expression", "Pureish"],
    fields: {
      id: {
        validate: (0, _index2.assertNodeType)("Identifier"),
        optional: true
      },
      params: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("LVal")))
      },
      body: {
        validate: (0, _index2.assertNodeType)("BlockStatement")
      },
      generator: {
        default: false,
        validate: (0, _index2.assertValueType)("boolean")
      },
      async: {
        default: false,
        validate: (0, _index2.assertValueType)("boolean")
      }
    }
  });

  (0, _index3.default)("Identifier", {
    builder: ["name"],
    visitor: ["typeAnnotation"],
    aliases: ["Expression", "LVal"],
    fields: {
      name: {
        validate: function validate(node, key, val) {
          if (!t.isValidIdentifier(val)) {}
        }
      },
      decorators: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("Decorator")))
      }
    }
  });

  (0, _index3.default)("IfStatement", {
    visitor: ["test", "consequent", "alternate"],
    aliases: ["Statement", "Conditional"],
    fields: {
      test: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      consequent: {
        validate: (0, _index2.assertNodeType)("Statement")
      },
      alternate: {
        optional: true,
        validate: (0, _index2.assertNodeType)("Statement")
      }
    }
  });

  (0, _index3.default)("LabeledStatement", {
    visitor: ["label", "body"],
    aliases: ["Statement"],
    fields: {
      label: {
        validate: (0, _index2.assertNodeType)("Identifier")
      },
      body: {
        validate: (0, _index2.assertNodeType)("Statement")
      }
    }
  });

  (0, _index3.default)("StringLiteral", {
    builder: ["value"],
    fields: {
      value: {
        validate: (0, _index2.assertValueType)("string")
      }
    },
    aliases: ["Expression", "Pureish", "Literal", "Immutable"]
  });

  (0, _index3.default)("NumericLiteral", {
    builder: ["value"],
    deprecatedAlias: "NumberLiteral",
    fields: {
      value: {
        validate: (0, _index2.assertValueType)("number")
      }
    },
    aliases: ["Expression", "Pureish", "Literal", "Immutable"]
  });

  (0, _index3.default)("NullLiteral", {
    aliases: ["Expression", "Pureish", "Literal", "Immutable"]
  });

  (0, _index3.default)("BooleanLiteral", {
    builder: ["value"],
    fields: {
      value: {
        validate: (0, _index2.assertValueType)("boolean")
      }
    },
    aliases: ["Expression", "Pureish", "Literal", "Immutable"]
  });

  (0, _index3.default)("RegExpLiteral", {
    builder: ["pattern", "flags"],
    deprecatedAlias: "RegexLiteral",
    aliases: ["Expression", "Literal"],
    fields: {
      pattern: {
        validate: (0, _index2.assertValueType)("string")
      },
      flags: {
        validate: (0, _index2.assertValueType)("string"),
        default: ""
      }
    }
  });

  (0, _index3.default)("LogicalExpression", {
    builder: ["operator", "left", "right"],
    visitor: ["left", "right"],
    aliases: ["Binary", "Expression"],
    fields: {
      operator: {
        validate: _index2.assertOneOf.apply(undefined, _constants.LOGICAL_OPERATORS)
      },
      left: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      right: {
        validate: (0, _index2.assertNodeType)("Expression")
      }
    }
  });

  (0, _index3.default)("MemberExpression", {
    builder: ["object", "property", "computed"],
    visitor: ["object", "property"],
    aliases: ["Expression", "LVal"],
    fields: {
      object: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      property: {
        validate: function validate(node, key, val) {
          var expectedType = node.computed ? "Expression" : "Identifier";
          (0, _index2.assertNodeType)(expectedType)(node, key, val);
        }
      },
      computed: {
        default: false
      }
    }
  });

  (0, _index3.default)("NewExpression", {
    visitor: ["callee", "arguments"],
    aliases: ["Expression"],
    fields: {
      callee: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      arguments: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("Expression", "SpreadElement")))
      }
    }
  });

  (0, _index3.default)("Program", {
    visitor: ["directives", "body"],
    builder: ["body", "directives"],
    fields: {
      directives: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("Directive"))),
        default: []
      },
      body: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("Statement")))
      }
    },
    aliases: ["Scopable", "BlockParent", "Block", "FunctionParent"]
  });

  (0, _index3.default)("ObjectExpression", {
    visitor: ["properties"],
    aliases: ["Expression"],
    fields: {
      properties: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("ObjectMethod", "ObjectProperty", "SpreadProperty")))
      }
    }
  });

  (0, _index3.default)("ObjectMethod", {
    builder: ["kind", "key", "params", "body", "computed"],
    fields: {
      kind: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("string"), (0, _index2.assertOneOf)("method", "get", "set")),
        default: "method"
      },
      computed: {
        validate: (0, _index2.assertValueType)("boolean"),
        default: false
      },
      key: {
        validate: function validate(node, key, val) {
          var expectedTypes = node.computed ? ["Expression"] : ["Identifier", "StringLiteral", "NumericLiteral"];
          _index2.assertNodeType.apply(undefined, expectedTypes)(node, key, val);
        }
      },
      decorators: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("Decorator")))
      },
      body: {
        validate: (0, _index2.assertNodeType)("BlockStatement")
      },
      generator: {
        default: false,
        validate: (0, _index2.assertValueType)("boolean")
      },
      async: {
        default: false,
        validate: (0, _index2.assertValueType)("boolean")
      }
    },
    visitor: ["key", "params", "body", "decorators", "returnType", "typeParameters"],
    aliases: ["UserWhitespacable", "Function", "Scopable", "BlockParent", "FunctionParent", "Method", "ObjectMember"]
  });

  (0, _index3.default)("ObjectProperty", {
    builder: ["key", "value", "computed", "shorthand", "decorators"],
    fields: {
      computed: {
        validate: (0, _index2.assertValueType)("boolean"),
        default: false
      },
      key: {
        validate: function validate(node, key, val) {
          var expectedTypes = node.computed ? ["Expression"] : ["Identifier", "StringLiteral", "NumericLiteral"];
          _index2.assertNodeType.apply(undefined, expectedTypes)(node, key, val);
        }
      },
      value: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      shorthand: {
        validate: (0, _index2.assertValueType)("boolean"),
        default: false
      },
      decorators: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("Decorator"))),
        optional: true
      }
    },
    visitor: ["key", "value", "decorators"],
    aliases: ["UserWhitespacable", "Property", "ObjectMember"]
  });

  (0, _index3.default)("RestElement", {
    visitor: ["argument", "typeAnnotation"],
    aliases: ["LVal"],
    fields: {
      argument: {
        validate: (0, _index2.assertNodeType)("LVal")
      },
      decorators: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("Decorator")))
      }
    }
  });

  (0, _index3.default)("ReturnStatement", {
    visitor: ["argument"],
    aliases: ["Statement", "Terminatorless", "CompletionStatement"],
    fields: {
      argument: {
        validate: (0, _index2.assertNodeType)("Expression"),
        optional: true
      }
    }
  });

  (0, _index3.default)("SequenceExpression", {
    visitor: ["expressions"],
    fields: {
      expressions: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("Expression")))
      }
    },
    aliases: ["Expression"]
  });

  (0, _index3.default)("SwitchCase", {
    visitor: ["test", "consequent"],
    fields: {
      test: {
        validate: (0, _index2.assertNodeType)("Expression"),
        optional: true
      },
      consequent: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("Statement")))
      }
    }
  });

  (0, _index3.default)("SwitchStatement", {
    visitor: ["discriminant", "cases"],
    aliases: ["Statement", "BlockParent", "Scopable"],
    fields: {
      discriminant: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      cases: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("SwitchCase")))
      }
    }
  });

  (0, _index3.default)("ThisExpression", {
    aliases: ["Expression"]
  });

  (0, _index3.default)("ThrowStatement", {
    visitor: ["argument"],
    aliases: ["Statement", "Terminatorless", "CompletionStatement"],
    fields: {
      argument: {
        validate: (0, _index2.assertNodeType)("Expression")
      }
    }
  });

  (0, _index3.default)("TryStatement", {
    visitor: ["block", "handler", "finalizer"],
    aliases: ["Statement"],
    fields: {
      body: {
        validate: (0, _index2.assertNodeType)("BlockStatement")
      },
      handler: {
        optional: true,
        handler: (0, _index2.assertNodeType)("BlockStatement")
      },
      finalizer: {
        optional: true,
        validate: (0, _index2.assertNodeType)("BlockStatement")
      }
    }
  });

  (0, _index3.default)("UnaryExpression", {
    builder: ["operator", "argument", "prefix"],
    fields: {
      prefix: {
        default: true
      },
      argument: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      operator: {
        validate: _index2.assertOneOf.apply(undefined, _constants.UNARY_OPERATORS)
      }
    },
    visitor: ["argument"],
    aliases: ["UnaryLike", "Expression"]
  });

  (0, _index3.default)("UpdateExpression", {
    builder: ["operator", "argument", "prefix"],
    fields: {
      prefix: {
        default: false
      },
      argument: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      operator: {
        validate: _index2.assertOneOf.apply(undefined, _constants.UPDATE_OPERATORS)
      }
    },
    visitor: ["argument"],
    aliases: ["Expression"]
  });

  (0, _index3.default)("VariableDeclaration", {
    builder: ["kind", "declarations"],
    visitor: ["declarations"],
    aliases: ["Statement", "Declaration"],
    fields: {
      kind: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("string"), (0, _index2.assertOneOf)("var", "let", "const"))
      },
      declarations: {
        validate: (0, _index2.chain)((0, _index2.assertValueType)("array"), (0, _index2.assertEach)((0, _index2.assertNodeType)("VariableDeclarator")))
      }
    }
  });

  (0, _index3.default)("VariableDeclarator", {
    visitor: ["id", "init"],
    fields: {
      id: {
        validate: (0, _index2.assertNodeType)("LVal")
      },
      init: {
        optional: true,
        validate: (0, _index2.assertNodeType)("Expression")
      }
    }
  });

  (0, _index3.default)("WhileStatement", {
    visitor: ["test", "body"],
    aliases: ["Statement", "BlockParent", "Loop", "While", "Scopable"],
    fields: {
      test: {
        validate: (0, _index2.assertNodeType)("Expression")
      },
      body: {
        validate: (0, _index2.assertNodeType)("BlockStatement", "Statement")
      }
    }
  });

  (0, _index3.default)("WithStatement", {
    visitor: ["object", "body"],
    aliases: ["Statement"],
    fields: {
      object: {
        object: (0, _index2.assertNodeType)("Expression")
      },
      body: {
        validate: (0, _index2.assertNodeType)("BlockStatement", "Statement")
      }
    }
  });

/***/ },
/* 270 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  var _index = __webpack_require__(260);

  var _index2 = _interopRequireDefault(_index);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  (0, _index2.default)("AssignmentPattern", {
    visitor: ["left", "right"],
    aliases: ["Pattern", "LVal"],
    fields: {
      left: {
        validate: (0, _index.assertNodeType)("Identifier")
      },
      right: {
        validate: (0, _index.assertNodeType)("Expression")
      },
      decorators: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("Decorator")))
      }
    }
  });

  (0, _index2.default)("ArrayPattern", {
    visitor: ["elements", "typeAnnotation"],
    aliases: ["Pattern", "LVal"],
    fields: {
      elements: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("Expression")))
      },
      decorators: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("Decorator")))
      }
    }
  });

  (0, _index2.default)("ArrowFunctionExpression", {
    builder: ["params", "body", "async"],
    visitor: ["params", "body", "returnType", "typeParameters"],
    aliases: ["Scopable", "Function", "BlockParent", "FunctionParent", "Expression", "Pureish"],
    fields: {
      params: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("LVal")))
      },
      body: {
        validate: (0, _index.assertNodeType)("BlockStatement", "Expression")
      },
      async: {
        validate: (0, _index.assertValueType)("boolean"),
        default: false
      }
    }
  });

  (0, _index2.default)("ClassBody", {
    visitor: ["body"],
    fields: {
      body: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("ClassMethod", "ClassProperty")))
      }
    }
  });

  (0, _index2.default)("ClassDeclaration", {
    builder: ["id", "superClass", "body", "decorators"],
    visitor: ["id", "body", "superClass", "mixins", "typeParameters", "superTypeParameters", "implements", "decorators"],
    aliases: ["Scopable", "Class", "Statement", "Declaration", "Pureish"],
    fields: {
      id: {
        validate: (0, _index.assertNodeType)("Identifier")
      },
      body: {
        validate: (0, _index.assertNodeType)("ClassBody")
      },
      superClass: {
        optional: true,
        validate: (0, _index.assertNodeType)("Expression")
      },
      decorators: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("Decorator")))
      }
    }
  });

  (0, _index2.default)("ClassExpression", {
    inherits: "ClassDeclaration",
    aliases: ["Scopable", "Class", "Expression", "Pureish"],
    fields: {
      id: {
        optional: true,
        validate: (0, _index.assertNodeType)("Identifier")
      },
      body: {
        validate: (0, _index.assertNodeType)("ClassBody")
      },
      superClass: {
        optional: true,
        validate: (0, _index.assertNodeType)("Expression")
      },
      decorators: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("Decorator")))
      }
    }
  });

  (0, _index2.default)("ExportAllDeclaration", {
    visitor: ["source"],
    aliases: ["Statement", "Declaration", "ModuleDeclaration", "ExportDeclaration"],
    fields: {
      source: {
        validate: (0, _index.assertNodeType)("StringLiteral")
      }
    }
  });

  (0, _index2.default)("ExportDefaultDeclaration", {
    visitor: ["declaration"],
    aliases: ["Statement", "Declaration", "ModuleDeclaration", "ExportDeclaration"],
    fields: {
      declaration: {
        validate: (0, _index.assertNodeType)("FunctionDeclaration", "ClassDeclaration", "Expression")
      }
    }
  });

  (0, _index2.default)("ExportNamedDeclaration", {
    visitor: ["declaration", "specifiers", "source"],
    aliases: ["Statement", "Declaration", "ModuleDeclaration", "ExportDeclaration"],
    fields: {
      declaration: {
        validate: (0, _index.assertNodeType)("Declaration"),
        optional: true
      },
      specifiers: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("ExportSpecifier")))
      },
      source: {
        validate: (0, _index.assertNodeType)("StringLiteral"),
        optional: true
      }
    }
  });

  (0, _index2.default)("ExportSpecifier", {
    visitor: ["local", "exported"],
    aliases: ["ModuleSpecifier"],
    fields: {
      local: {
        validate: (0, _index.assertNodeType)("Identifier")
      },
      exported: {
        validate: (0, _index.assertNodeType)("Identifier")
      }
    }
  });

  (0, _index2.default)("ForOfStatement", {
    visitor: ["left", "right", "body"],
    aliases: ["Scopable", "Statement", "For", "BlockParent", "Loop", "ForXStatement"],
    fields: {
      left: {
        validate: (0, _index.assertNodeType)("VariableDeclaration", "LVal")
      },
      right: {
        validate: (0, _index.assertNodeType)("Expression")
      },
      body: {
        validate: (0, _index.assertNodeType)("Statement")
      }
    }
  });

  (0, _index2.default)("ImportDeclaration", {
    visitor: ["specifiers", "source"],
    aliases: ["Statement", "Declaration", "ModuleDeclaration"],
    fields: {
      specifiers: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("ImportSpecifier", "ImportDefaultSpecifier", "ImportNamespaceSpecifier")))
      },
      source: {
        validate: (0, _index.assertNodeType)("StringLiteral")
      }
    }
  });

  (0, _index2.default)("ImportDefaultSpecifier", {
    visitor: ["local"],
    aliases: ["ModuleSpecifier"],
    fields: {
      local: {
        validate: (0, _index.assertNodeType)("Identifier")
      }
    }
  });

  (0, _index2.default)("ImportNamespaceSpecifier", {
    visitor: ["local"],
    aliases: ["ModuleSpecifier"],
    fields: {
      local: {
        validate: (0, _index.assertNodeType)("Identifier")
      }
    }
  });

  (0, _index2.default)("ImportSpecifier", {
    visitor: ["local", "imported"],
    aliases: ["ModuleSpecifier"],
    fields: {
      local: {
        validate: (0, _index.assertNodeType)("Identifier")
      },
      imported: {
        validate: (0, _index.assertNodeType)("Identifier")
      }
    }
  });

  (0, _index2.default)("MetaProperty", {
    visitor: ["meta", "property"],
    aliases: ["Expression"],
    fields: {
      meta: {
        validate: (0, _index.assertValueType)("string")
      },
      property: {
        validate: (0, _index.assertValueType)("string")
      }
    }
  });

  (0, _index2.default)("ClassMethod", {
    aliases: ["Function", "Scopable", "BlockParent", "FunctionParent", "Method"],
    builder: ["kind", "key", "params", "body", "computed", "static"],
    visitor: ["key", "params", "body", "decorators", "returnType", "typeParameters"],
    fields: {
      kind: {
        validate: (0, _index.chain)((0, _index.assertValueType)("string"), (0, _index.assertOneOf)("get", "set", "method", "constructor")),
        default: "method"
      },
      computed: {
        default: false,
        validate: (0, _index.assertValueType)("boolean")
      },
      static: {
        default: false,
        validate: (0, _index.assertValueType)("boolean")
      },
      key: {
        validate: function validate(node, key, val) {
          var expectedTypes = node.computed ? ["Expression"] : ["Identifier", "StringLiteral", "NumericLiteral"];
          _index.assertNodeType.apply(undefined, expectedTypes)(node, key, val);
        }
      },
      params: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("LVal")))
      },
      body: {
        validate: (0, _index.assertNodeType)("BlockStatement")
      },
      generator: {
        default: false,
        validate: (0, _index.assertValueType)("boolean")
      },
      async: {
        default: false,
        validate: (0, _index.assertValueType)("boolean")
      }
    }
  });

  (0, _index2.default)("ObjectPattern", {
    visitor: ["properties", "typeAnnotation"],
    aliases: ["Pattern", "LVal"],
    fields: {
      properties: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("RestProperty", "Property")))
      },
      decorators: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("Decorator")))
      }
    }
  });

  (0, _index2.default)("SpreadElement", {
    visitor: ["argument"],
    aliases: ["UnaryLike"],
    fields: {
      argument: {
        validate: (0, _index.assertNodeType)("Expression")
      }
    }
  });

  (0, _index2.default)("Super", {
    aliases: ["Expression"]
  });

  (0, _index2.default)("TaggedTemplateExpression", {
    visitor: ["tag", "quasi"],
    aliases: ["Expression"],
    fields: {
      tag: {
        validate: (0, _index.assertNodeType)("Expression")
      },
      quasi: {
        validate: (0, _index.assertNodeType)("TemplateLiteral")
      }
    }
  });

  (0, _index2.default)("TemplateElement", {
    builder: ["value", "tail"],
    fields: {
      value: {},
      tail: {
        validate: (0, _index.assertValueType)("boolean"),
        default: false
      }
    }
  });

  (0, _index2.default)("TemplateLiteral", {
    visitor: ["quasis", "expressions"],
    aliases: ["Expression", "Literal"],
    fields: {
      quasis: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("TemplateElement")))
      },
      expressions: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("Expression")))
      }
    }
  });

  (0, _index2.default)("YieldExpression", {
    builder: ["argument", "delegate"],
    visitor: ["argument"],
    aliases: ["Expression", "Terminatorless"],
    fields: {
      delegate: {
        validate: (0, _index.assertValueType)("boolean"),
        default: false
      },
      argument: {
        optional: true,
        validate: (0, _index.assertNodeType)("Expression")
      }
    }
  });

/***/ },
/* 271 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  var _index = __webpack_require__(260);

  var _index2 = _interopRequireDefault(_index);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  (0, _index2.default)("AnyTypeAnnotation", {
    aliases: ["Flow", "FlowBaseAnnotation"],
    fields: {}
  });

  (0, _index2.default)("ArrayTypeAnnotation", {
    visitor: ["elementType"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("BooleanTypeAnnotation", {
    aliases: ["Flow", "FlowBaseAnnotation"],
    fields: {}
  });

  (0, _index2.default)("BooleanLiteralTypeAnnotation", {
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("NullLiteralTypeAnnotation", {
    aliases: ["Flow", "FlowBaseAnnotation"],
    fields: {}
  });

  (0, _index2.default)("ClassImplements", {
    visitor: ["id", "typeParameters"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("ClassProperty", {
    visitor: ["key", "value", "typeAnnotation", "decorators"],
    builder: ["key", "value", "typeAnnotation", "decorators", "computed"],
    aliases: ["Property"],
    fields: {
      computed: {
        validate: (0, _index.assertValueType)("boolean"),
        default: false
      }
    }
  });

  (0, _index2.default)("DeclareClass", {
    visitor: ["id", "typeParameters", "extends", "body"],
    aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"],
    fields: {}
  });

  (0, _index2.default)("DeclareFunction", {
    visitor: ["id"],
    aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"],
    fields: {}
  });

  (0, _index2.default)("DeclareInterface", {
    visitor: ["id", "typeParameters", "extends", "body"],
    aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"],
    fields: {}
  });

  (0, _index2.default)("DeclareModule", {
    visitor: ["id", "body"],
    aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"],
    fields: {}
  });

  (0, _index2.default)("DeclareModuleExports", {
    visitor: ["typeAnnotation"],
    aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"],
    fields: {}
  });

  (0, _index2.default)("DeclareTypeAlias", {
    visitor: ["id", "typeParameters", "right"],
    aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"],
    fields: {}
  });

  (0, _index2.default)("DeclareVariable", {
    visitor: ["id"],
    aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"],
    fields: {}
  });

  (0, _index2.default)("ExistentialTypeParam", {
    aliases: ["Flow"]
  });

  (0, _index2.default)("FunctionTypeAnnotation", {
    visitor: ["typeParameters", "params", "rest", "returnType"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("FunctionTypeParam", {
    visitor: ["name", "typeAnnotation"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("GenericTypeAnnotation", {
    visitor: ["id", "typeParameters"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("InterfaceExtends", {
    visitor: ["id", "typeParameters"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("InterfaceDeclaration", {
    visitor: ["id", "typeParameters", "extends", "body"],
    aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"],
    fields: {}
  });

  (0, _index2.default)("IntersectionTypeAnnotation", {
    visitor: ["types"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("MixedTypeAnnotation", {
    aliases: ["Flow", "FlowBaseAnnotation"]
  });

  (0, _index2.default)("NullableTypeAnnotation", {
    visitor: ["typeAnnotation"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("NumericLiteralTypeAnnotation", {
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("NumberTypeAnnotation", {
    aliases: ["Flow", "FlowBaseAnnotation"],
    fields: {}
  });

  (0, _index2.default)("StringLiteralTypeAnnotation", {
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("StringTypeAnnotation", {
    aliases: ["Flow", "FlowBaseAnnotation"],
    fields: {}
  });

  (0, _index2.default)("ThisTypeAnnotation", {
    aliases: ["Flow", "FlowBaseAnnotation"],
    fields: {}
  });

  (0, _index2.default)("TupleTypeAnnotation", {
    visitor: ["types"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("TypeofTypeAnnotation", {
    visitor: ["argument"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("TypeAlias", {
    visitor: ["id", "typeParameters", "right"],
    aliases: ["Flow", "FlowDeclaration", "Statement", "Declaration"],
    fields: {}
  });

  (0, _index2.default)("TypeAnnotation", {
    visitor: ["typeAnnotation"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("TypeCastExpression", {
    visitor: ["expression", "typeAnnotation"],
    aliases: ["Flow", "ExpressionWrapper", "Expression"],
    fields: {}
  });

  (0, _index2.default)("TypeParameter", {
    visitor: ["bound"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("TypeParameterDeclaration", {
    visitor: ["params"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("TypeParameterInstantiation", {
    visitor: ["params"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("ObjectTypeAnnotation", {
    visitor: ["properties", "indexers", "callProperties"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("ObjectTypeCallProperty", {
    visitor: ["value"],
    aliases: ["Flow", "UserWhitespacable"],
    fields: {}
  });

  (0, _index2.default)("ObjectTypeIndexer", {
    visitor: ["id", "key", "value"],
    aliases: ["Flow", "UserWhitespacable"],
    fields: {}
  });

  (0, _index2.default)("ObjectTypeProperty", {
    visitor: ["key", "value"],
    aliases: ["Flow", "UserWhitespacable"],
    fields: {}
  });

  (0, _index2.default)("QualifiedTypeIdentifier", {
    visitor: ["id", "qualification"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("UnionTypeAnnotation", {
    visitor: ["types"],
    aliases: ["Flow"],
    fields: {}
  });

  (0, _index2.default)("VoidTypeAnnotation", {
    aliases: ["Flow", "FlowBaseAnnotation"],
    fields: {}
  });

/***/ },
/* 272 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  var _index = __webpack_require__(260);

  var _index2 = _interopRequireDefault(_index);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  (0, _index2.default)("JSXAttribute", {
    visitor: ["name", "value"],
    aliases: ["JSX", "Immutable"],
    fields: {
      name: {
        validate: (0, _index.assertNodeType)("JSXIdentifier", "JSXNamespacedName")
      },
      value: {
        optional: true,
        validate: (0, _index.assertNodeType)("JSXElement", "StringLiteral", "JSXExpressionContainer")
      }
    }
  });

  (0, _index2.default)("JSXClosingElement", {
    visitor: ["name"],
    aliases: ["JSX", "Immutable"],
    fields: {
      name: {
        validate: (0, _index.assertNodeType)("JSXIdentifier", "JSXMemberExpression")
      }
    }
  });

  (0, _index2.default)("JSXElement", {
    builder: ["openingElement", "closingElement", "children", "selfClosing"],
    visitor: ["openingElement", "children", "closingElement"],
    aliases: ["JSX", "Immutable", "Expression"],
    fields: {
      openingElement: {
        validate: (0, _index.assertNodeType)("JSXOpeningElement")
      },
      closingElement: {
        optional: true,
        validate: (0, _index.assertNodeType)("JSXClosingElement")
      },
      children: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("JSXText", "JSXExpressionContainer", "JSXElement")))
      }
    }
  });

  (0, _index2.default)("JSXEmptyExpression", {
    aliases: ["JSX", "Expression"]
  });

  (0, _index2.default)("JSXExpressionContainer", {
    visitor: ["expression"],
    aliases: ["JSX", "Immutable"],
    fields: {
      expression: {
        validate: (0, _index.assertNodeType)("Expression")
      }
    }
  });

  (0, _index2.default)("JSXIdentifier", {
    builder: ["name"],
    aliases: ["JSX", "Expression"],
    fields: {
      name: {
        validate: (0, _index.assertValueType)("string")
      }
    }
  });

  (0, _index2.default)("JSXMemberExpression", {
    visitor: ["object", "property"],
    aliases: ["JSX", "Expression"],
    fields: {
      object: {
        validate: (0, _index.assertNodeType)("JSXMemberExpression", "JSXIdentifier")
      },
      property: {
        validate: (0, _index.assertNodeType)("JSXIdentifier")
      }
    }
  });

  (0, _index2.default)("JSXNamespacedName", {
    visitor: ["namespace", "name"],
    aliases: ["JSX"],
    fields: {
      namespace: {
        validate: (0, _index.assertNodeType)("JSXIdentifier")
      },
      name: {
        validate: (0, _index.assertNodeType)("JSXIdentifier")
      }
    }
  });

  (0, _index2.default)("JSXOpeningElement", {
    builder: ["name", "attributes", "selfClosing"],
    visitor: ["name", "attributes"],
    aliases: ["JSX", "Immutable"],
    fields: {
      name: {
        validate: (0, _index.assertNodeType)("JSXIdentifier", "JSXMemberExpression")
      },
      selfClosing: {
        default: false,
        validate: (0, _index.assertValueType)("boolean")
      },
      attributes: {
        validate: (0, _index.chain)((0, _index.assertValueType)("array"), (0, _index.assertEach)((0, _index.assertNodeType)("JSXAttribute", "JSXSpreadAttribute")))
      }
    }
  });

  (0, _index2.default)("JSXSpreadAttribute", {
    visitor: ["argument"],
    aliases: ["JSX"],
    fields: {
      argument: {
        validate: (0, _index.assertNodeType)("Expression")
      }
    }
  });

  (0, _index2.default)("JSXText", {
    aliases: ["JSX", "Immutable"],
    builder: ["value"],
    fields: {
      value: {
        validate: (0, _index.assertValueType)("string")
      }
    }
  });

/***/ },
/* 273 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  var _index = __webpack_require__(260);

  var _index2 = _interopRequireDefault(_index);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  (0, _index2.default)("Noop", {
    visitor: []
  });

  (0, _index2.default)("ParenthesizedExpression", {
    visitor: ["expression"],
    aliases: ["Expression", "ExpressionWrapper"],
    fields: {
      expression: {
        validate: (0, _index.assertNodeType)("Expression")
      }
    }
  });

/***/ },
/* 274 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  var _index = __webpack_require__(260);

  var _index2 = _interopRequireDefault(_index);

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule ? obj : { default: obj };
  }

  (0, _index2.default)("AwaitExpression", {
    builder: ["argument"],
    visitor: ["argument"],
    aliases: ["Expression", "Terminatorless"],
    fields: {
      argument: {
        validate: (0, _index.assertNodeType)("Expression")
      }
    }
  });

  (0, _index2.default)("ForAwaitStatement", {
    visitor: ["left", "right", "body"],
    aliases: ["Scopable", "Statement", "For", "BlockParent", "Loop", "ForXStatement"],
    fields: {
      left: {
        validate: (0, _index.assertNodeType)("VariableDeclaration", "LVal")
      },
      right: {
        validate: (0, _index.assertNodeType)("Expression")
      },
      body: {
        validate: (0, _index.assertNodeType)("Statement")
      }
    }
  });

  (0, _index2.default)("BindExpression", {
    visitor: ["object", "callee"],
    aliases: ["Expression"],
    fields: {}
  });

  (0, _index2.default)("Decorator", {
    visitor: ["expression"],
    fields: {
      expression: {
        validate: (0, _index.assertNodeType)("Expression")
      }
    }
  });

  (0, _index2.default)("DoExpression", {
    visitor: ["body"],
    aliases: ["Expression"],
    fields: {
      body: {
        validate: (0, _index.assertNodeType)("BlockStatement")
      }
    }
  });

  (0, _index2.default)("ExportDefaultSpecifier", {
    visitor: ["exported"],
    aliases: ["ModuleSpecifier"],
    fields: {
      exported: {
        validate: (0, _index.assertNodeType)("Identifier")
      }
    }
  });

  (0, _index2.default)("ExportNamespaceSpecifier", {
    visitor: ["exported"],
    aliases: ["ModuleSpecifier"],
    fields: {
      exported: {
        validate: (0, _index.assertNodeType)("Identifier")
      }
    }
  });

  (0, _index2.default)("RestProperty", {
    visitor: ["argument"],
    aliases: ["UnaryLike"],
    fields: {
      argument: {
        validate: (0, _index.assertNodeType)("LVal")
      }
    }
  });

  (0, _index2.default)("SpreadProperty", {
    visitor: ["argument"],
    aliases: ["UnaryLike"],
    fields: {
      argument: {
        validate: (0, _index.assertNodeType)("Expression")
      }
    }
  });

/***/ },
/* 275 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  exports.__esModule = true;
  exports.isReactComponent = undefined;
  exports.isCompatTag = isCompatTag;
  exports.buildChildren = buildChildren;

  var _index = __webpack_require__(6);

  var t = _interopRequireWildcard(_index);

  function _interopRequireWildcard(obj) {
    if (obj && obj.__esModule) {
      return obj;
    } else {
      var newObj = {};if (obj != null) {
        for (var key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key];
        }
      }newObj.default = obj;return newObj;
    }
  }

  var isReactComponent = exports.isReactComponent = t.buildMatchMemberExpression("React.Component");

  function isCompatTag(tagName) {
    return !!tagName && /^[a-z]|\-/.test(tagName);
  }

  function cleanJSXElementLiteralChild(child, args) {
    var lines = child.value.split(/\r\n|\n|\r/);

    var lastNonEmptyLine = 0;

    for (var i = 0; i < lines.length; i++) {
      if (lines[i].match(/[^ \t]/)) {
        lastNonEmptyLine = i;
      }
    }

    var str = "";

    for (var _i = 0; _i < lines.length; _i++) {
      var line = lines[_i];

      var isFirstLine = _i === 0;
      var isLastLine = _i === lines.length - 1;
      var isLastNonEmptyLine = _i === lastNonEmptyLine;

      var trimmedLine = line.replace(/\t/g, " ");

      if (!isFirstLine) {
        trimmedLine = trimmedLine.replace(/^[ ]+/, "");
      }

      if (!isLastLine) {
        trimmedLine = trimmedLine.replace(/[ ]+$/, "");
      }

      if (trimmedLine) {
        if (!isLastNonEmptyLine) {
          trimmedLine += " ";
        }

        str += trimmedLine;
      }
    }

    if (str) args.push(t.stringLiteral(str));
  }

  function buildChildren(node) {
    var elems = [];

    for (var i = 0; i < node.children.length; i++) {
      var child = node.children[i];

      if (t.isJSXText(child)) {
        cleanJSXElementLiteralChild(child, elems);
        continue;
      }

      if (t.isJSXExpressionContainer(child)) child = child.expression;
      if (t.isJSXEmptyExpression(child)) continue;

      elems.push(child);
    }

    return elems;
  }

/***/ },
/* 276 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.setupHoists = setupHoists;
  exports.hoist = hoist;
  exports.addHoistedDeclarator = addHoistedDeclarator;

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  var namespace = "incremental-dom-hoists";

  // Sets up the file to hoist all statics
  function setupHoists(_ref) {
    var file = _ref.file;

    // A map to store helper variable references
    // for each file
    file.set(namespace, []);
  }

  function hoist(program, _ref2) {
    var file = _ref2.file;

    var hoists = file.get(namespace);

    if (hoists.length) {
      var declaration = t.variableDeclaration("const", hoists);
      program.unshiftContainer("body", declaration);
    }
  }

  // Hoists the variable to the top of the file.
  function addHoistedDeclarator(scope, name, value, _ref3) {
    var file = _ref3.file;

    var ref = scope.generateUidIdentifier(name);
    var declarator = t.variableDeclarator(ref, value);
    file.get(namespace).push(declarator);

    return ref;
  }

/***/ },
/* 277 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _isLiteralOrSpecial = __webpack_require__(278);

  var _isLiteralOrSpecial2 = _interopRequireDefault(_isLiteralOrSpecial);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function addClosureVar(expression, closureVars) {
    var init = expression.node;
    var id = expression.scope.generateUidIdentifierBasedOnNode(init);

    closureVars.push({ id: id, init: init });
    expression.replaceWith(id);
  }

  function last(array) {
    return array[array.length - 1];
  }

  // Extracts variable expressions into an array of closure parameters,
  // so that when the closure is finally evaluated, it will have the correct
  // values.
  var expressionExtractor = {
    JSXSpreadAttribute: function JSXSpreadAttribute(path) {
      var closureVarsStack = this.closureVarsStack;

      addClosureVar(path.get("argument"), last(closureVarsStack));
    },
    JSXExpressionContainer: function JSXExpressionContainer(path) {
      var expression = path.get("expression");
      // If the variable is constant (or will be wrapped), don't extract.
      if ((0, _isLiteralOrSpecial2.default)(expression) || expression.isJSXElement()) {
        return;
      }

      var closureVarsStack = this.closureVarsStack;

      addClosureVar(expression, last(closureVarsStack));
    }
  };

  exports.default = expressionExtractor;

/***/ },
/* 278 */
/***/ function(module, exports) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = isLiteralOrUndefined;
  // Literals and `undefined` are treated as constant values in attributes and
  // children.
  function isLiteralOrUndefined(path) {
    return path.isLiteral() || path.isUnaryExpression({ operator: "void" }) || path.isIdentifier({ name: "undefined" }) || path.isIdentifier({ name: "NaN" }) || path.isIdentifier({ name: "Infinity" });
  }

/***/ },
/* 279 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _extractExpressions = __webpack_require__(277);

  var _extractExpressions2 = _interopRequireDefault(_extractExpressions);

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // Take single use variable declarations and move them inside
  // the JSX Expression Container where they are referenced.
  var expressionInliner = {
    JSXExpressionContainer: function JSXExpressionContainer(path) {
      var expression = path.get("expression");
      if (!expression.isIdentifier()) {
        return;
      }

      var binding = path.scope.getBinding(expression.node.name);
      if (!binding || binding.references > 1 || !binding.constant) {
        return;
      }

      var declarator = binding.path;
      if (!declarator.isVariableDeclarator()) {
        return;
      }

      var init = declarator.get("init");
      if (!init.isJSXElement()) {
        return;
      }

      var closureVars = [];
      init.traverse(_extractExpressions2.default, { closureVarsStack: [closureVars] });

      expression.replaceWith(init.node);
      declarator.replaceWithMultiple(closureVars.map(function (cv) {
        return t.variableDeclarator(cv.id, cv.init);
      }));
    }
  };

  exports.default = expressionInliner;

/***/ },
/* 280 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = injectJSXWrapper;

  var _inject = __webpack_require__(4);

  var _inject2 = _interopRequireDefault(_inject);

  var _toFunctionCall = __webpack_require__(281);

  var _toFunctionCall2 = _interopRequireDefault(_toFunctionCall);

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // Wraps a JSX element in a closure, capturing the arguments
  // that it's attributes and children need to render.
  // Also sets `__jsxDOMWrapper` property, so that the closure
  // may be identified as a wrapper that should be called during
  // render.
  function jsxWrapperAST(plugin, ref) {
    var func = t.identifier("func");
    var args = t.identifier("args");
    var wrapper = t.identifier("wrapper");

    /**
     * function _jsxWrapper(func, args) {
     *   var wrapper = args ? function() {
     *     return func.apply(this, args);
     *   } : func;
     *   wrapper.__jsxDOMWrapper = true;
     *   return wrapper;
     * }
     */
    return t.functionExpression(ref, [func, args], t.blockStatement([t.variableDeclaration("var", [t.variableDeclarator(wrapper, t.conditionalExpression(args, t.functionExpression(wrapper, [], t.blockStatement([t.returnStatement((0, _toFunctionCall2.default)(t.memberExpression(func, t.identifier("apply")), [t.identifier("this"), args]))])), func))]), t.expressionStatement(t.AssignmentExpression("=", t.memberExpression(wrapper, t.identifier("__jsxDOMWrapper")), t.booleanLiteral(true))), t.returnStatement(wrapper)]));
  }

  function injectJSXWrapper(plugin) {
    return (0, _inject2.default)(plugin, "jsxWrapper", jsxWrapperAST);
  }

/***/ },
/* 281 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = toFunctionCall;

  var _toReference = __webpack_require__(5);

  var _toReference2 = _interopRequireDefault(_toReference);

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // Helper to create a function call in AST.
  function toFunctionCall(functionName, args) {
    return t.callExpression((0, _toReference2.default)(functionName), args);
  }

/***/ },
/* 282 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = flattenExpressions;

  var _toStatement = __webpack_require__(283);

  var _toStatement2 = _interopRequireDefault(_toStatement);

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // Helper to flatten out sequence expressions into a top level
  // expression statements.
  function flattenExpressions(expressions) {
    var nodes = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

    return expressions.reduce(function (nodes, node) {
      if (t.isSequenceExpression(node)) {
        return flattenExpressions(node.expressions, nodes);
      }

      nodes.push((0, _toStatement2.default)(node));
      return nodes;
    }, nodes);
  }

/***/ },
/* 283 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = toStatement;

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  // Helper to transform an expression into an expression statement.
  function toStatement(expression) {
    if (t.isFunctionExpression(expression)) {
      return t.toStatement(expression);
    }
    if (!t.isStatement(expression)) {
      return t.expressionStatement(expression);
    }
    return expression;
  }

/***/ },
/* 284 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = statementsWithReturnLast;

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  // Ensures the final statement is a return statement.
  function statementsWithReturnLast(statements) {
    var lastIndex = statements.length - 1;
    var last = statements[lastIndex];

    if (!t.isReturnStatement(last)) {
      statements[lastIndex] = t.returnStatement(last.expression);
    }

    return statements;
  }

/***/ },
/* 285 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = elementOpenCall;

  var _toFunctionCall = __webpack_require__(281);

  var _toFunctionCall2 = _interopRequireDefault(_toFunctionCall);

  var _toReference = __webpack_require__(5);

  var _toReference2 = _interopRequireDefault(_toReference);

  var _idomMethod = __webpack_require__(286);

  var _idomMethod2 = _interopRequireDefault(_idomMethod);

  var _isComponent = __webpack_require__(287);

  var _isComponent2 = _interopRequireDefault(_isComponent);

  var _extractOpenArguments2 = __webpack_require__(288);

  var _extractOpenArguments3 = _interopRequireDefault(_extractOpenArguments2);

  var _attributes = __webpack_require__(315);

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

  // Returns the opening element's function call.
  function elementOpenCall(path, plugin) {
    var name = path.get("name");
    var useReference = (0, _isComponent2.default)(name, plugin);
    var tag = (0, _toReference2.default)(name.node, useReference);
    var args = [tag];

    var _extractOpenArguments = (0, _extractOpenArguments3.default)(path, plugin);

    var key = _extractOpenArguments.key;
    var statics = _extractOpenArguments.statics;
    var attrs = _extractOpenArguments.attrs;

    // Only push arguments if they're needed

    if (key || statics) {
      args.push(key || t.nullLiteral());
    }
    if (statics) {
      args.push(statics);
    }

    // If there is a spread element, we need to use
    // the elementOpenStart/elementOpenEnd syntax.
    // This allows spreads to be transformed into
    // attr(name, value) calls.
    if ((0, _attributes.hasSpread)(path.get("attributes"))) {
      var expressions = [(0, _toFunctionCall2.default)((0, _idomMethod2.default)("elementOpenStart", plugin), args)].concat(_toConsumableArray((0, _attributes.toAttrsCalls)(attrs, plugin)), [(0, _toFunctionCall2.default)((0, _idomMethod2.default)("elementOpenEnd", plugin), [tag])]);

      return t.sequenceExpression(expressions);
    }

    if (attrs) {
      // Only push key and statics if they have not
      // already been pushed.
      if (!statics) {
        if (!key) {
          args.push(t.nullLiteral());
        }
        args.push(t.nullLiteral());
      }

      args.push.apply(args, _toConsumableArray((0, _attributes.toAttrsArray)(attrs)));
    }

    var selfClosing = path.node.selfClosing;
    var elementFunction = selfClosing ? "elementVoid" : "elementOpen";
    return (0, _toFunctionCall2.default)((0, _idomMethod2.default)(elementFunction, plugin), args);
  }

/***/ },
/* 286 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = iDOMMethod;

  var _toReference = __webpack_require__(5);

  var _toReference2 = _interopRequireDefault(_toReference);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // Returns a reference to an iDOM method.
  function iDOMMethod(method, _ref) {
    var opts = _ref.opts;
    var file = _ref.file;

    var prefix = opts.prefix || "";
    if (prefix) {
      return (0, _toReference2.default)(prefix + "." + method);
    }

    var binding = file.scope.getBinding(method);
    if (binding) {
      return binding.identifier;
    }

    return (0, _toReference2.default)(method);
  }

/***/ },
/* 287 */
/***/ function(module, exports) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = isComponent;
  var componentTester = /^[A-Z]/;

  // Detects if the given tag represents a component (that is, if it starts with a
  // capital letter).
  function isComponent(path, _ref) {
    var opts = _ref.opts;

    if (!opts.components || !path.isJSXIdentifier()) {
      return false;
    }

    return componentTester.test(path.node.name);
  }

/***/ },
/* 288 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = extractOpenArguments;

  var _isLiteralOrSpecial = __webpack_require__(278);

  var _isLiteralOrSpecial2 = _interopRequireDefault(_isLiteralOrSpecial);

  var _hoistStatics = __webpack_require__(289);

  var _hoistStatics2 = _interopRequireDefault(_hoistStatics);

  var _uuid = __webpack_require__(290);

  var _uuid2 = _interopRequireDefault(_uuid);

  var _toString = __webpack_require__(314);

  var _toString2 = _interopRequireDefault(_toString);

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // Extracts attributes into the appropriate
  // attribute array. Static attributes and the key
  // are placed into static attributes, and expressions
  // are placed into the variadic attributes.
  function extractOpenArguments(path, plugin) {
    var attributes = path.get("attributes");
    var scope = path.scope;
    var _plugin$opts = plugin.opts;
    var hoist = _plugin$opts.hoist;
    var forceStatics = _plugin$opts.forceStatics;

    var attrs = [];
    var staticAttrs = [];
    var key = null;
    var keyIndex = -1;
    var statics = t.arrayExpression(staticAttrs);

    attributes.forEach(function (attribute) {
      if (attribute.isJSXSpreadAttribute()) {
        attrs.push({
          name: null,
          value: attribute.get("argument").node,
          isSpread: true
        });
        return;
      }

      var namePath = attribute.get("name");
      var name = void 0;
      if (namePath.isJSXIdentifier()) {
        name = t.stringLiteral(namePath.node.name);
      } else {
        name = t.stringLiteral(namePath.node.namespace.name + ":" + namePath.node.name.name);
      }
      var value = attribute.get("value");
      var node = value.node;

      // Attributes without a value are interpreted as `true`.
      if (!node) {
        value.replaceWith(t.jSXExpressionContainer(t.booleanLiteral(true)));
      }

      // Get the value inside the expression.
      if (value.isJSXExpressionContainer()) {
        value = value.get("expression");
        node = value.node;
      }

      var literal = (0, _isLiteralOrSpecial2.default)(value);

      if (literal) {
        node = (0, _toString2.default)(value);
      }

      // The key attribute must be passed to the `elementOpen` call.
      if (name.value === "key") {
        key = node;

        // If it's not a literal key, we must assign it in the statics array.
        if (!literal) {
          if (!value.isIdentifier()) {
            node = value.scope.maybeGenerateMemoised(node);
            key = t.assignmentExpression("=", node, key);
          }

          keyIndex = staticAttrs.length + 1;
          literal = true;
        }
      }

      if (literal) {
        staticAttrs.push(name, node);
      } else {
        attrs.push({
          name: name,
          value: node,
          isSpread: false
        });
      }
    });

    if (staticAttrs.length > 0 && !key) {
      if (forceStatics) {
        // Generate a uuid to be used as the key.
        key = t.stringLiteral((0, _uuid2.default)());
      } else {
        // Don't use statics if a "key" isn't passed, as recommended by the
        // incremental dom documentation:
        // http://google.github.io/incremental-dom/#rendering-dom/statics-array.
        for (var i = 0; i < staticAttrs.length; i += 2) {
          attrs.push({
            name: staticAttrs[i],
            value: staticAttrs[i + 1],
            isSpread: false
          });
        }
        staticAttrs = [];
      }
    }

    if (attrs.length === 0) {
      attrs = null;
    }
    if (staticAttrs.length === 0) {
      statics = null;
    } else if (hoist) {
      statics = (0, _hoistStatics2.default)(scope, plugin, statics, keyIndex);
    }

    return { key: key, statics: statics, attrs: attrs };
  }

/***/ },
/* 289 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = addStaticHoist;

  var _hoist = __webpack_require__(276);

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  // Hoists the static attributes array, so that the array instance is not
  // recreated multiple times.
  function addStaticHoist(scope, plugin, statics, keyIndex) {
    var id = (0, _hoist.addHoistedDeclarator)(scope, "statics", statics, plugin);

    if (keyIndex === -1) {
      return id;
    } else {
      var staticAttrs = statics.elements;
      var key = staticAttrs[keyIndex];
      staticAttrs[keyIndex] = t.stringLiteral("");

      // We need to assign the key variable's value to the statics array at `index`.
      return t.sequenceExpression([t.assignmentExpression("=", t.memberExpression(id, t.numericLiteral(keyIndex), true), key), id]);
    }
  }

/***/ },
/* 290 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = uuid;

  var _crypto = __webpack_require__(291);

  // @jed's brilliantly short UUID v4 generator
  // https://gist.github.com/jed/982883
  function uuid() {
    return "00000000-0000-4000-8000-000000000000".replace(/[08]/g, randomizer);
  }

  function randomizer(bit) {
    return (bit ^ (0, _crypto.randomBytes)(1)[0] % 16 >> bit / 4).toString(16);
  }

/***/ },
/* 291 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';

  var rng = __webpack_require__(296);

  function error() {
    var m = [].slice.call(arguments).join(' ');
    throw new Error([m, 'we accept pull requests', 'http://github.com/dominictarr/crypto-browserify'].join('\n'));
  }

  exports.createHash = __webpack_require__(298);

  exports.createHmac = __webpack_require__(311);

  exports.randomBytes = function (size, callback) {
    if (callback && callback.call) {
      try {
        callback.call(this, undefined, new Buffer(rng(size)));
      } catch (err) {
        callback(err);
      }
    } else {
      return new Buffer(rng(size));
    }
  };

  function each(a, f) {
    for (var i in a) {
      f(a[i], i);
    }
  }

  exports.getHashes = function () {
    return ['sha1', 'sha256', 'sha512', 'md5', 'rmd160'];
  };

  var p = __webpack_require__(312)(exports);
  exports.pbkdf2 = p.pbkdf2;
  exports.pbkdf2Sync = p.pbkdf2Sync;

  // the least I can do is make error messages for the rest of the node.js/crypto api.
  each(['createCredentials', 'createCipher', 'createCipheriv', 'createDecipher', 'createDecipheriv', 'createSign', 'createVerify', 'createDiffieHellman'], function (name) {
    exports[name] = function () {
      error('sorry,', name, 'is not implemented yet');
    };
  });
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(292).Buffer))

/***/ },
/* 292 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(Buffer, global) {/*!
   * The buffer module from node.js, for the browser.
   *
   * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
   * @license  MIT
   */
  /* eslint-disable no-proto */

  'use strict';

  var base64 = __webpack_require__(293);
  var ieee754 = __webpack_require__(294);
  var isArray = __webpack_require__(295);

  exports.Buffer = Buffer;
  exports.SlowBuffer = SlowBuffer;
  exports.INSPECT_MAX_BYTES = 50;

  /**
   * If `Buffer.TYPED_ARRAY_SUPPORT`:
   *   === true    Use Uint8Array implementation (fastest)
   *   === false   Use Object implementation (most compatible, even IE6)
   *
   * Browsers that support typed arrays are IE 10+, Firefox 4+, Chrome 7+, Safari 5.1+,
   * Opera 11.6+, iOS 4.2+.
   *
   * Due to various browser bugs, sometimes the Object implementation will be used even
   * when the browser supports typed arrays.
   *
   * Note:
   *
   *   - Firefox 4-29 lacks support for adding new properties to `Uint8Array` instances,
   *     See: https://bugzilla.mozilla.org/show_bug.cgi?id=695438.
   *
   *   - Chrome 9-10 is missing the `TypedArray.prototype.subarray` function.
   *
   *   - IE10 has a broken `TypedArray.prototype.subarray` function which returns arrays of
   *     incorrect length in some situations.

   * We detect these buggy browsers and set `Buffer.TYPED_ARRAY_SUPPORT` to `false` so they
   * get the Object implementation, which is slower but behaves correctly.
   */
  Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined ? global.TYPED_ARRAY_SUPPORT : typedArraySupport();

  /*
   * Export kMaxLength after typed array support is determined.
   */
  exports.kMaxLength = kMaxLength();

  function typedArraySupport() {
    try {
      var arr = new Uint8Array(1);
      arr.__proto__ = { __proto__: Uint8Array.prototype, foo: function foo() {
          return 42;
        } };
      return arr.foo() === 42 && // typed array instances can be augmented
      typeof arr.subarray === 'function' && // chrome 9-10 lack `subarray`
      arr.subarray(1, 1).byteLength === 0; // ie10 has broken `subarray`
    } catch (e) {
      return false;
    }
  }

  function kMaxLength() {
    return Buffer.TYPED_ARRAY_SUPPORT ? 0x7fffffff : 0x3fffffff;
  }

  function createBuffer(that, length) {
    if (kMaxLength() < length) {
      throw new RangeError('Invalid typed array length');
    }
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = new Uint8Array(length);
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      if (that === null) {
        that = new Buffer(length);
      }
      that.length = length;
    }

    return that;
  }

  /**
   * The Buffer constructor returns instances of `Uint8Array` that have their
   * prototype changed to `Buffer.prototype`. Furthermore, `Buffer` is a subclass of
   * `Uint8Array`, so the returned instances will have all the node `Buffer` methods
   * and the `Uint8Array` methods. Square bracket notation works as expected -- it
   * returns a single octet.
   *
   * The `Uint8Array` prototype remains unmodified.
   */

  function Buffer(arg, encodingOrOffset, length) {
    if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
      return new Buffer(arg, encodingOrOffset, length);
    }

    // Common case.
    if (typeof arg === 'number') {
      if (typeof encodingOrOffset === 'string') {
        throw new Error('If encoding is specified then the first argument must be a string');
      }
      return allocUnsafe(this, arg);
    }
    return from(this, arg, encodingOrOffset, length);
  }

  Buffer.poolSize = 8192; // not used by this implementation

  // TODO: Legacy, not needed anymore. Remove in next major version.
  Buffer._augment = function (arr) {
    arr.__proto__ = Buffer.prototype;
    return arr;
  };

  function from(that, value, encodingOrOffset, length) {
    if (typeof value === 'number') {
      throw new TypeError('"value" argument must not be a number');
    }

    if (typeof ArrayBuffer !== 'undefined' && value instanceof ArrayBuffer) {
      return fromArrayBuffer(that, value, encodingOrOffset, length);
    }

    if (typeof value === 'string') {
      return fromString(that, value, encodingOrOffset);
    }

    return fromObject(that, value);
  }

  /**
   * Functionally equivalent to Buffer(arg, encoding) but throws a TypeError
   * if value is a number.
   * Buffer.from(str[, encoding])
   * Buffer.from(array)
   * Buffer.from(buffer)
   * Buffer.from(arrayBuffer[, byteOffset[, length]])
   **/
  Buffer.from = function (value, encodingOrOffset, length) {
    return from(null, value, encodingOrOffset, length);
  };

  if (Buffer.TYPED_ARRAY_SUPPORT) {
    Buffer.prototype.__proto__ = Uint8Array.prototype;
    Buffer.__proto__ = Uint8Array;
    if (typeof Symbol !== 'undefined' && Symbol.species && Buffer[Symbol.species] === Buffer) {
      // Fix subarray() in ES2016. See: https://github.com/feross/buffer/pull/97
      Object.defineProperty(Buffer, Symbol.species, {
        value: null,
        configurable: true
      });
    }
  }

  function assertSize(size) {
    if (typeof size !== 'number') {
      throw new TypeError('"size" argument must be a number');
    } else if (size < 0) {
      throw new RangeError('"size" argument must not be negative');
    }
  }

  function alloc(that, size, fill, encoding) {
    assertSize(size);
    if (size <= 0) {
      return createBuffer(that, size);
    }
    if (fill !== undefined) {
      // Only pay attention to encoding if it's a string. This
      // prevents accidentally sending in a number that would
      // be interpretted as a start offset.
      return typeof encoding === 'string' ? createBuffer(that, size).fill(fill, encoding) : createBuffer(that, size).fill(fill);
    }
    return createBuffer(that, size);
  }

  /**
   * Creates a new filled Buffer instance.
   * alloc(size[, fill[, encoding]])
   **/
  Buffer.alloc = function (size, fill, encoding) {
    return alloc(null, size, fill, encoding);
  };

  function allocUnsafe(that, size) {
    assertSize(size);
    that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) {
      for (var i = 0; i < size; ++i) {
        that[i] = 0;
      }
    }
    return that;
  }

  /**
   * Equivalent to Buffer(num), by default creates a non-zero-filled Buffer instance.
   * */
  Buffer.allocUnsafe = function (size) {
    return allocUnsafe(null, size);
  };
  /**
   * Equivalent to SlowBuffer(num), by default creates a non-zero-filled Buffer instance.
   */
  Buffer.allocUnsafeSlow = function (size) {
    return allocUnsafe(null, size);
  };

  function fromString(that, string, encoding) {
    if (typeof encoding !== 'string' || encoding === '') {
      encoding = 'utf8';
    }

    if (!Buffer.isEncoding(encoding)) {
      throw new TypeError('"encoding" must be a valid string encoding');
    }

    var length = byteLength(string, encoding) | 0;
    that = createBuffer(that, length);

    var actual = that.write(string, encoding);

    if (actual !== length) {
      // Writing a hex string, for example, that contains invalid characters will
      // cause everything after the first invalid character to be ignored. (e.g.
      // 'abxxcd' will be treated as 'ab')
      that = that.slice(0, actual);
    }

    return that;
  }

  function fromArrayLike(that, array) {
    var length = array.length < 0 ? 0 : checked(array.length) | 0;
    that = createBuffer(that, length);
    for (var i = 0; i < length; i += 1) {
      that[i] = array[i] & 255;
    }
    return that;
  }

  function fromArrayBuffer(that, array, byteOffset, length) {
    array.byteLength; // this throws if `array` is not a valid ArrayBuffer

    if (byteOffset < 0 || array.byteLength < byteOffset) {
      throw new RangeError('\'offset\' is out of bounds');
    }

    if (array.byteLength < byteOffset + (length || 0)) {
      throw new RangeError('\'length\' is out of bounds');
    }

    if (byteOffset === undefined && length === undefined) {
      array = new Uint8Array(array);
    } else if (length === undefined) {
      array = new Uint8Array(array, byteOffset);
    } else {
      array = new Uint8Array(array, byteOffset, length);
    }

    if (Buffer.TYPED_ARRAY_SUPPORT) {
      // Return an augmented `Uint8Array` instance, for best performance
      that = array;
      that.__proto__ = Buffer.prototype;
    } else {
      // Fallback: Return an object instance of the Buffer class
      that = fromArrayLike(that, array);
    }
    return that;
  }

  function fromObject(that, obj) {
    if (Buffer.isBuffer(obj)) {
      var len = checked(obj.length) | 0;
      that = createBuffer(that, len);

      if (that.length === 0) {
        return that;
      }

      obj.copy(that, 0, 0, len);
      return that;
    }

    if (obj) {
      if (typeof ArrayBuffer !== 'undefined' && obj.buffer instanceof ArrayBuffer || 'length' in obj) {
        if (typeof obj.length !== 'number' || isnan(obj.length)) {
          return createBuffer(that, 0);
        }
        return fromArrayLike(that, obj);
      }

      if (obj.type === 'Buffer' && isArray(obj.data)) {
        return fromArrayLike(that, obj.data);
      }
    }

    throw new TypeError('First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.');
  }

  function checked(length) {
    // Note: cannot use `length < kMaxLength()` here because that fails when
    // length is NaN (which is otherwise coerced to zero.)
    if (length >= kMaxLength()) {
      throw new RangeError('Attempt to allocate Buffer larger than maximum ' + 'size: 0x' + kMaxLength().toString(16) + ' bytes');
    }
    return length | 0;
  }

  function SlowBuffer(length) {
    if (+length != length) {
      // eslint-disable-line eqeqeq
      length = 0;
    }
    return Buffer.alloc(+length);
  }

  Buffer.isBuffer = function isBuffer(b) {
    return !!(b != null && b._isBuffer);
  };

  Buffer.compare = function compare(a, b) {
    if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
      throw new TypeError('Arguments must be Buffers');
    }

    if (a === b) return 0;

    var x = a.length;
    var y = b.length;

    for (var i = 0, len = Math.min(x, y); i < len; ++i) {
      if (a[i] !== b[i]) {
        x = a[i];
        y = b[i];
        break;
      }
    }

    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  };

  Buffer.isEncoding = function isEncoding(encoding) {
    switch (String(encoding).toLowerCase()) {
      case 'hex':
      case 'utf8':
      case 'utf-8':
      case 'ascii':
      case 'latin1':
      case 'binary':
      case 'base64':
      case 'ucs2':
      case 'ucs-2':
      case 'utf16le':
      case 'utf-16le':
        return true;
      default:
        return false;
    }
  };

  Buffer.concat = function concat(list, length) {
    if (!isArray(list)) {
      throw new TypeError('"list" argument must be an Array of Buffers');
    }

    if (list.length === 0) {
      return Buffer.alloc(0);
    }

    var i;
    if (length === undefined) {
      length = 0;
      for (i = 0; i < list.length; ++i) {
        length += list[i].length;
      }
    }

    var buffer = Buffer.allocUnsafe(length);
    var pos = 0;
    for (i = 0; i < list.length; ++i) {
      var buf = list[i];
      if (!Buffer.isBuffer(buf)) {
        throw new TypeError('"list" argument must be an Array of Buffers');
      }
      buf.copy(buffer, pos);
      pos += buf.length;
    }
    return buffer;
  };

  function byteLength(string, encoding) {
    if (Buffer.isBuffer(string)) {
      return string.length;
    }
    if (typeof ArrayBuffer !== 'undefined' && typeof ArrayBuffer.isView === 'function' && (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
      return string.byteLength;
    }
    if (typeof string !== 'string') {
      string = '' + string;
    }

    var len = string.length;
    if (len === 0) return 0;

    // Use a for loop to avoid recursion
    var loweredCase = false;
    for (;;) {
      switch (encoding) {
        case 'ascii':
        case 'latin1':
        case 'binary':
          return len;
        case 'utf8':
        case 'utf-8':
        case undefined:
          return utf8ToBytes(string).length;
        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return len * 2;
        case 'hex':
          return len >>> 1;
        case 'base64':
          return base64ToBytes(string).length;
        default:
          if (loweredCase) return utf8ToBytes(string).length; // assume utf8
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  }
  Buffer.byteLength = byteLength;

  function slowToString(encoding, start, end) {
    var loweredCase = false;

    // No need to verify that "this.length <= MAX_UINT32" since it's a read-only
    // property of a typed array.

    // This behaves neither like String nor Uint8Array in that we set start/end
    // to their upper/lower bounds if the value passed is out of range.
    // undefined is handled specially as per ECMA-262 6th Edition,
    // Section 13.3.3.7 Runtime Semantics: KeyedBindingInitialization.
    if (start === undefined || start < 0) {
      start = 0;
    }
    // Return early if start > this.length. Done here to prevent potential uint32
    // coercion fail below.
    if (start > this.length) {
      return '';
    }

    if (end === undefined || end > this.length) {
      end = this.length;
    }

    if (end <= 0) {
      return '';
    }

    // Force coersion to uint32. This will also coerce falsey/NaN values to 0.
    end >>>= 0;
    start >>>= 0;

    if (end <= start) {
      return '';
    }

    if (!encoding) encoding = 'utf8';

    while (true) {
      switch (encoding) {
        case 'hex':
          return hexSlice(this, start, end);

        case 'utf8':
        case 'utf-8':
          return utf8Slice(this, start, end);

        case 'ascii':
          return asciiSlice(this, start, end);

        case 'latin1':
        case 'binary':
          return latin1Slice(this, start, end);

        case 'base64':
          return base64Slice(this, start, end);

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return utf16leSlice(this, start, end);

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
          encoding = (encoding + '').toLowerCase();
          loweredCase = true;
      }
    }
  }

  // The property is used by `Buffer.isBuffer` and `is-buffer` (in Safari 5-7) to detect
  // Buffer instances.
  Buffer.prototype._isBuffer = true;

  function swap(b, n, m) {
    var i = b[n];
    b[n] = b[m];
    b[m] = i;
  }

  Buffer.prototype.swap16 = function swap16() {
    var len = this.length;
    if (len % 2 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 16-bits');
    }
    for (var i = 0; i < len; i += 2) {
      swap(this, i, i + 1);
    }
    return this;
  };

  Buffer.prototype.swap32 = function swap32() {
    var len = this.length;
    if (len % 4 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 32-bits');
    }
    for (var i = 0; i < len; i += 4) {
      swap(this, i, i + 3);
      swap(this, i + 1, i + 2);
    }
    return this;
  };

  Buffer.prototype.swap64 = function swap64() {
    var len = this.length;
    if (len % 8 !== 0) {
      throw new RangeError('Buffer size must be a multiple of 64-bits');
    }
    for (var i = 0; i < len; i += 8) {
      swap(this, i, i + 7);
      swap(this, i + 1, i + 6);
      swap(this, i + 2, i + 5);
      swap(this, i + 3, i + 4);
    }
    return this;
  };

  Buffer.prototype.toString = function toString() {
    var length = this.length | 0;
    if (length === 0) return '';
    if (arguments.length === 0) return utf8Slice(this, 0, length);
    return slowToString.apply(this, arguments);
  };

  Buffer.prototype.equals = function equals(b) {
    if (!Buffer.isBuffer(b)) throw new TypeError('Argument must be a Buffer');
    if (this === b) return true;
    return Buffer.compare(this, b) === 0;
  };

  Buffer.prototype.inspect = function inspect() {
    var str = '';
    var max = exports.INSPECT_MAX_BYTES;
    if (this.length > 0) {
      str = this.toString('hex', 0, max).match(/.{2}/g).join(' ');
      if (this.length > max) str += ' ... ';
    }
    return '<Buffer ' + str + '>';
  };

  Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
    if (!Buffer.isBuffer(target)) {
      throw new TypeError('Argument must be a Buffer');
    }

    if (start === undefined) {
      start = 0;
    }
    if (end === undefined) {
      end = target ? target.length : 0;
    }
    if (thisStart === undefined) {
      thisStart = 0;
    }
    if (thisEnd === undefined) {
      thisEnd = this.length;
    }

    if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
      throw new RangeError('out of range index');
    }

    if (thisStart >= thisEnd && start >= end) {
      return 0;
    }
    if (thisStart >= thisEnd) {
      return -1;
    }
    if (start >= end) {
      return 1;
    }

    start >>>= 0;
    end >>>= 0;
    thisStart >>>= 0;
    thisEnd >>>= 0;

    if (this === target) return 0;

    var x = thisEnd - thisStart;
    var y = end - start;
    var len = Math.min(x, y);

    var thisCopy = this.slice(thisStart, thisEnd);
    var targetCopy = target.slice(start, end);

    for (var i = 0; i < len; ++i) {
      if (thisCopy[i] !== targetCopy[i]) {
        x = thisCopy[i];
        y = targetCopy[i];
        break;
      }
    }

    if (x < y) return -1;
    if (y < x) return 1;
    return 0;
  };

  // Finds either the first index of `val` in `buffer` at offset >= `byteOffset`,
  // OR the last index of `val` in `buffer` at offset <= `byteOffset`.
  //
  // Arguments:
  // - buffer - a Buffer to search
  // - val - a string, Buffer, or number
  // - byteOffset - an index into `buffer`; will be clamped to an int32
  // - encoding - an optional encoding, relevant is val is a string
  // - dir - true for indexOf, false for lastIndexOf
  function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
    // Empty buffer means no match
    if (buffer.length === 0) return -1;

    // Normalize byteOffset
    if (typeof byteOffset === 'string') {
      encoding = byteOffset;
      byteOffset = 0;
    } else if (byteOffset > 0x7fffffff) {
      byteOffset = 0x7fffffff;
    } else if (byteOffset < -0x80000000) {
      byteOffset = -0x80000000;
    }
    byteOffset = +byteOffset; // Coerce to Number.
    if (isNaN(byteOffset)) {
      // byteOffset: it it's undefined, null, NaN, "foo", etc, search whole buffer
      byteOffset = dir ? 0 : buffer.length - 1;
    }

    // Normalize byteOffset: negative offsets start from the end of the buffer
    if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
    if (byteOffset >= buffer.length) {
      if (dir) return -1;else byteOffset = buffer.length - 1;
    } else if (byteOffset < 0) {
      if (dir) byteOffset = 0;else return -1;
    }

    // Normalize val
    if (typeof val === 'string') {
      val = Buffer.from(val, encoding);
    }

    // Finally, search either indexOf (if dir is true) or lastIndexOf
    if (Buffer.isBuffer(val)) {
      // Special case: looking for empty string/buffer always fails
      if (val.length === 0) {
        return -1;
      }
      return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
    } else if (typeof val === 'number') {
      val = val & 0xFF; // Search for a byte value [0-255]
      if (Buffer.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf === 'function') {
        if (dir) {
          return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
        } else {
          return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
        }
      }
      return arrayIndexOf(buffer, [val], byteOffset, encoding, dir);
    }

    throw new TypeError('val must be string, number or Buffer');
  }

  function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
    var indexSize = 1;
    var arrLength = arr.length;
    var valLength = val.length;

    if (encoding !== undefined) {
      encoding = String(encoding).toLowerCase();
      if (encoding === 'ucs2' || encoding === 'ucs-2' || encoding === 'utf16le' || encoding === 'utf-16le') {
        if (arr.length < 2 || val.length < 2) {
          return -1;
        }
        indexSize = 2;
        arrLength /= 2;
        valLength /= 2;
        byteOffset /= 2;
      }
    }

    function read(buf, i) {
      if (indexSize === 1) {
        return buf[i];
      } else {
        return buf.readUInt16BE(i * indexSize);
      }
    }

    var i;
    if (dir) {
      var foundIndex = -1;
      for (i = byteOffset; i < arrLength; i++) {
        if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
          if (foundIndex === -1) foundIndex = i;
          if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
        } else {
          if (foundIndex !== -1) i -= i - foundIndex;
          foundIndex = -1;
        }
      }
    } else {
      if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
      for (i = byteOffset; i >= 0; i--) {
        var found = true;
        for (var j = 0; j < valLength; j++) {
          if (read(arr, i + j) !== read(val, j)) {
            found = false;
            break;
          }
        }
        if (found) return i;
      }
    }

    return -1;
  }

  Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
    return this.indexOf(val, byteOffset, encoding) !== -1;
  };

  Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
  };

  Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
    return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
  };

  function hexWrite(buf, string, offset, length) {
    offset = Number(offset) || 0;
    var remaining = buf.length - offset;
    if (!length) {
      length = remaining;
    } else {
      length = Number(length);
      if (length > remaining) {
        length = remaining;
      }
    }

    // must be an even number of digits
    var strLen = string.length;
    if (strLen % 2 !== 0) throw new TypeError('Invalid hex string');

    if (length > strLen / 2) {
      length = strLen / 2;
    }
    for (var i = 0; i < length; ++i) {
      var parsed = parseInt(string.substr(i * 2, 2), 16);
      if (isNaN(parsed)) return i;
      buf[offset + i] = parsed;
    }
    return i;
  }

  function utf8Write(buf, string, offset, length) {
    return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
  }

  function asciiWrite(buf, string, offset, length) {
    return blitBuffer(asciiToBytes(string), buf, offset, length);
  }

  function latin1Write(buf, string, offset, length) {
    return asciiWrite(buf, string, offset, length);
  }

  function base64Write(buf, string, offset, length) {
    return blitBuffer(base64ToBytes(string), buf, offset, length);
  }

  function ucs2Write(buf, string, offset, length) {
    return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
  }

  Buffer.prototype.write = function write(string, offset, length, encoding) {
    // Buffer#write(string)
    if (offset === undefined) {
      encoding = 'utf8';
      length = this.length;
      offset = 0;
      // Buffer#write(string, encoding)
    } else if (length === undefined && typeof offset === 'string') {
      encoding = offset;
      length = this.length;
      offset = 0;
      // Buffer#write(string, offset[, length][, encoding])
    } else if (isFinite(offset)) {
      offset = offset | 0;
      if (isFinite(length)) {
        length = length | 0;
        if (encoding === undefined) encoding = 'utf8';
      } else {
        encoding = length;
        length = undefined;
      }
      // legacy write(string, encoding, offset, length) - remove in v0.13
    } else {
      throw new Error('Buffer.write(string, encoding, offset[, length]) is no longer supported');
    }

    var remaining = this.length - offset;
    if (length === undefined || length > remaining) length = remaining;

    if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
      throw new RangeError('Attempt to write outside buffer bounds');
    }

    if (!encoding) encoding = 'utf8';

    var loweredCase = false;
    for (;;) {
      switch (encoding) {
        case 'hex':
          return hexWrite(this, string, offset, length);

        case 'utf8':
        case 'utf-8':
          return utf8Write(this, string, offset, length);

        case 'ascii':
          return asciiWrite(this, string, offset, length);

        case 'latin1':
        case 'binary':
          return latin1Write(this, string, offset, length);

        case 'base64':
          // Warning: maxLength not taken into account in base64Write
          return base64Write(this, string, offset, length);

        case 'ucs2':
        case 'ucs-2':
        case 'utf16le':
        case 'utf-16le':
          return ucs2Write(this, string, offset, length);

        default:
          if (loweredCase) throw new TypeError('Unknown encoding: ' + encoding);
          encoding = ('' + encoding).toLowerCase();
          loweredCase = true;
      }
    }
  };

  Buffer.prototype.toJSON = function toJSON() {
    return {
      type: 'Buffer',
      data: Array.prototype.slice.call(this._arr || this, 0)
    };
  };

  function base64Slice(buf, start, end) {
    if (start === 0 && end === buf.length) {
      return base64.fromByteArray(buf);
    } else {
      return base64.fromByteArray(buf.slice(start, end));
    }
  }

  function utf8Slice(buf, start, end) {
    end = Math.min(buf.length, end);
    var res = [];

    var i = start;
    while (i < end) {
      var firstByte = buf[i];
      var codePoint = null;
      var bytesPerSequence = firstByte > 0xEF ? 4 : firstByte > 0xDF ? 3 : firstByte > 0xBF ? 2 : 1;

      if (i + bytesPerSequence <= end) {
        var secondByte, thirdByte, fourthByte, tempCodePoint;

        switch (bytesPerSequence) {
          case 1:
            if (firstByte < 0x80) {
              codePoint = firstByte;
            }
            break;
          case 2:
            secondByte = buf[i + 1];
            if ((secondByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0x1F) << 0x6 | secondByte & 0x3F;
              if (tempCodePoint > 0x7F) {
                codePoint = tempCodePoint;
              }
            }
            break;
          case 3:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0xC | (secondByte & 0x3F) << 0x6 | thirdByte & 0x3F;
              if (tempCodePoint > 0x7FF && (tempCodePoint < 0xD800 || tempCodePoint > 0xDFFF)) {
                codePoint = tempCodePoint;
              }
            }
            break;
          case 4:
            secondByte = buf[i + 1];
            thirdByte = buf[i + 2];
            fourthByte = buf[i + 3];
            if ((secondByte & 0xC0) === 0x80 && (thirdByte & 0xC0) === 0x80 && (fourthByte & 0xC0) === 0x80) {
              tempCodePoint = (firstByte & 0xF) << 0x12 | (secondByte & 0x3F) << 0xC | (thirdByte & 0x3F) << 0x6 | fourthByte & 0x3F;
              if (tempCodePoint > 0xFFFF && tempCodePoint < 0x110000) {
                codePoint = tempCodePoint;
              }
            }
        }
      }

      if (codePoint === null) {
        // we did not generate a valid codePoint so insert a
        // replacement char (U+FFFD) and advance only 1 byte
        codePoint = 0xFFFD;
        bytesPerSequence = 1;
      } else if (codePoint > 0xFFFF) {
        // encode to utf16 (surrogate pair dance)
        codePoint -= 0x10000;
        res.push(codePoint >>> 10 & 0x3FF | 0xD800);
        codePoint = 0xDC00 | codePoint & 0x3FF;
      }

      res.push(codePoint);
      i += bytesPerSequence;
    }

    return decodeCodePointsArray(res);
  }

  // Based on http://stackoverflow.com/a/22747272/680742, the browser with
  // the lowest limit is Chrome, with 0x10000 args.
  // We go 1 magnitude less, for safety
  var MAX_ARGUMENTS_LENGTH = 0x1000;

  function decodeCodePointsArray(codePoints) {
    var len = codePoints.length;
    if (len <= MAX_ARGUMENTS_LENGTH) {
      return String.fromCharCode.apply(String, codePoints); // avoid extra slice()
    }

    // Decode in chunks to avoid "call stack size exceeded".
    var res = '';
    var i = 0;
    while (i < len) {
      res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
    }
    return res;
  }

  function asciiSlice(buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i] & 0x7F);
    }
    return ret;
  }

  function latin1Slice(buf, start, end) {
    var ret = '';
    end = Math.min(buf.length, end);

    for (var i = start; i < end; ++i) {
      ret += String.fromCharCode(buf[i]);
    }
    return ret;
  }

  function hexSlice(buf, start, end) {
    var len = buf.length;

    if (!start || start < 0) start = 0;
    if (!end || end < 0 || end > len) end = len;

    var out = '';
    for (var i = start; i < end; ++i) {
      out += toHex(buf[i]);
    }
    return out;
  }

  function utf16leSlice(buf, start, end) {
    var bytes = buf.slice(start, end);
    var res = '';
    for (var i = 0; i < bytes.length; i += 2) {
      res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
    }
    return res;
  }

  Buffer.prototype.slice = function slice(start, end) {
    var len = this.length;
    start = ~~start;
    end = end === undefined ? len : ~~end;

    if (start < 0) {
      start += len;
      if (start < 0) start = 0;
    } else if (start > len) {
      start = len;
    }

    if (end < 0) {
      end += len;
      if (end < 0) end = 0;
    } else if (end > len) {
      end = len;
    }

    if (end < start) end = start;

    var newBuf;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      newBuf = this.subarray(start, end);
      newBuf.__proto__ = Buffer.prototype;
    } else {
      var sliceLen = end - start;
      newBuf = new Buffer(sliceLen, undefined);
      for (var i = 0; i < sliceLen; ++i) {
        newBuf[i] = this[i + start];
      }
    }

    return newBuf;
  };

  /*
   * Need to make sure that buffer isn't trying to write out of bounds.
   */
  function checkOffset(offset, ext, length) {
    if (offset % 1 !== 0 || offset < 0) throw new RangeError('offset is not uint');
    if (offset + ext > length) throw new RangeError('Trying to access beyond buffer length');
  }

  Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }

    return val;
  };

  Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      checkOffset(offset, byteLength, this.length);
    }

    var val = this[offset + --byteLength];
    var mul = 1;
    while (byteLength > 0 && (mul *= 0x100)) {
      val += this[offset + --byteLength] * mul;
    }

    return val;
  };

  Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    return this[offset];
  };

  Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] | this[offset + 1] << 8;
  };

  Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    return this[offset] << 8 | this[offset + 1];
  };

  Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 0x1000000;
  };

  Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return this[offset] * 0x1000000 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
  };

  Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var val = this[offset];
    var mul = 1;
    var i = 0;
    while (++i < byteLength && (mul *= 0x100)) {
      val += this[offset + i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val;
  };

  Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) checkOffset(offset, byteLength, this.length);

    var i = byteLength;
    var mul = 1;
    var val = this[offset + --i];
    while (i > 0 && (mul *= 0x100)) {
      val += this[offset + --i] * mul;
    }
    mul *= 0x80;

    if (val >= mul) val -= Math.pow(2, 8 * byteLength);

    return val;
  };

  Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 1, this.length);
    if (!(this[offset] & 0x80)) return this[offset];
    return (0xff - this[offset] + 1) * -1;
  };

  Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset] | this[offset + 1] << 8;
    return val & 0x8000 ? val | 0xFFFF0000 : val;
  };

  Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 2, this.length);
    var val = this[offset + 1] | this[offset] << 8;
    return val & 0x8000 ? val | 0xFFFF0000 : val;
  };

  Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
  };

  Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);

    return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
  };

  Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return ieee754.read(this, offset, true, 23, 4);
  };

  Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 4, this.length);
    return ieee754.read(this, offset, false, 23, 4);
  };

  Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return ieee754.read(this, offset, true, 52, 8);
  };

  Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
    if (!noAssert) checkOffset(offset, 8, this.length);
    return ieee754.read(this, offset, false, 52, 8);
  };

  function checkInt(buf, value, offset, ext, max, min) {
    if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
    if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
  }

  Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var mul = 1;
    var i = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      this[offset + i] = value / mul & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    byteLength = byteLength | 0;
    if (!noAssert) {
      var maxBytes = Math.pow(2, 8 * byteLength) - 1;
      checkInt(this, value, offset, byteLength, maxBytes, 0);
    }

    var i = byteLength - 1;
    var mul = 1;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      this[offset + i] = value / mul & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0xff, 0);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    this[offset] = value & 0xff;
    return offset + 1;
  };

  function objectWriteUInt16(buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffff + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
      buf[offset + i] = (value & 0xff << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
    }
  }

  Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2;
  };

  Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0xffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 8;
      this[offset + 1] = value & 0xff;
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2;
  };

  function objectWriteUInt32(buf, value, offset, littleEndian) {
    if (value < 0) value = 0xffffffff + value + 1;
    for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
      buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 0xff;
    }
  }

  Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset + 3] = value >>> 24;
      this[offset + 2] = value >>> 16;
      this[offset + 1] = value >>> 8;
      this[offset] = value & 0xff;
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4;
  };

  Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0xffffffff, 0);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 0xff;
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4;
  };

  Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);

      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = 0;
    var mul = 1;
    var sub = 0;
    this[offset] = value & 0xFF;
    while (++i < byteLength && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = (value / mul >> 0) - sub & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) {
      var limit = Math.pow(2, 8 * byteLength - 1);

      checkInt(this, value, offset, byteLength, limit - 1, -limit);
    }

    var i = byteLength - 1;
    var mul = 1;
    var sub = 0;
    this[offset + i] = value & 0xFF;
    while (--i >= 0 && (mul *= 0x100)) {
      if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
        sub = 1;
      }
      this[offset + i] = (value / mul >> 0) - sub & 0xFF;
    }

    return offset + byteLength;
  };

  Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 1, 0x7f, -0x80);
    if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
    if (value < 0) value = 0xff + value + 1;
    this[offset] = value & 0xff;
    return offset + 1;
  };

  Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
    } else {
      objectWriteUInt16(this, value, offset, true);
    }
    return offset + 2;
  };

  Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 2, 0x7fff, -0x8000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 8;
      this[offset + 1] = value & 0xff;
    } else {
      objectWriteUInt16(this, value, offset, false);
    }
    return offset + 2;
  };

  Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value & 0xff;
      this[offset + 1] = value >>> 8;
      this[offset + 2] = value >>> 16;
      this[offset + 3] = value >>> 24;
    } else {
      objectWriteUInt32(this, value, offset, true);
    }
    return offset + 4;
  };

  Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
    value = +value;
    offset = offset | 0;
    if (!noAssert) checkInt(this, value, offset, 4, 0x7fffffff, -0x80000000);
    if (value < 0) value = 0xffffffff + value + 1;
    if (Buffer.TYPED_ARRAY_SUPPORT) {
      this[offset] = value >>> 24;
      this[offset + 1] = value >>> 16;
      this[offset + 2] = value >>> 8;
      this[offset + 3] = value & 0xff;
    } else {
      objectWriteUInt32(this, value, offset, false);
    }
    return offset + 4;
  };

  function checkIEEE754(buf, value, offset, ext, max, min) {
    if (offset + ext > buf.length) throw new RangeError('Index out of range');
    if (offset < 0) throw new RangeError('Index out of range');
  }

  function writeFloat(buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 4, 3.4028234663852886e+38, -3.4028234663852886e+38);
    }
    ieee754.write(buf, value, offset, littleEndian, 23, 4);
    return offset + 4;
  }

  Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
    return writeFloat(this, value, offset, true, noAssert);
  };

  Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
    return writeFloat(this, value, offset, false, noAssert);
  };

  function writeDouble(buf, value, offset, littleEndian, noAssert) {
    if (!noAssert) {
      checkIEEE754(buf, value, offset, 8, 1.7976931348623157E+308, -1.7976931348623157E+308);
    }
    ieee754.write(buf, value, offset, littleEndian, 52, 8);
    return offset + 8;
  }

  Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
    return writeDouble(this, value, offset, true, noAssert);
  };

  Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
    return writeDouble(this, value, offset, false, noAssert);
  };

  // copy(targetBuffer, targetStart=0, sourceStart=0, sourceEnd=buffer.length)
  Buffer.prototype.copy = function copy(target, targetStart, start, end) {
    if (!start) start = 0;
    if (!end && end !== 0) end = this.length;
    if (targetStart >= target.length) targetStart = target.length;
    if (!targetStart) targetStart = 0;
    if (end > 0 && end < start) end = start;

    // Copy 0 bytes; we're done
    if (end === start) return 0;
    if (target.length === 0 || this.length === 0) return 0;

    // Fatal error conditions
    if (targetStart < 0) {
      throw new RangeError('targetStart out of bounds');
    }
    if (start < 0 || start >= this.length) throw new RangeError('sourceStart out of bounds');
    if (end < 0) throw new RangeError('sourceEnd out of bounds');

    // Are we oob?
    if (end > this.length) end = this.length;
    if (target.length - targetStart < end - start) {
      end = target.length - targetStart + start;
    }

    var len = end - start;
    var i;

    if (this === target && start < targetStart && targetStart < end) {
      // descending copy from end
      for (i = len - 1; i >= 0; --i) {
        target[i + targetStart] = this[i + start];
      }
    } else if (len < 1000 || !Buffer.TYPED_ARRAY_SUPPORT) {
      // ascending copy from start
      for (i = 0; i < len; ++i) {
        target[i + targetStart] = this[i + start];
      }
    } else {
      Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);
    }

    return len;
  };

  // Usage:
  //    buffer.fill(number[, offset[, end]])
  //    buffer.fill(buffer[, offset[, end]])
  //    buffer.fill(string[, offset[, end]][, encoding])
  Buffer.prototype.fill = function fill(val, start, end, encoding) {
    // Handle string cases:
    if (typeof val === 'string') {
      if (typeof start === 'string') {
        encoding = start;
        start = 0;
        end = this.length;
      } else if (typeof end === 'string') {
        encoding = end;
        end = this.length;
      }
      if (val.length === 1) {
        var code = val.charCodeAt(0);
        if (code < 256) {
          val = code;
        }
      }
      if (encoding !== undefined && typeof encoding !== 'string') {
        throw new TypeError('encoding must be a string');
      }
      if (typeof encoding === 'string' && !Buffer.isEncoding(encoding)) {
        throw new TypeError('Unknown encoding: ' + encoding);
      }
    } else if (typeof val === 'number') {
      val = val & 255;
    }

    // Invalid ranges are not set to a default, so can range check early.
    if (start < 0 || this.length < start || this.length < end) {
      throw new RangeError('Out of range index');
    }

    if (end <= start) {
      return this;
    }

    start = start >>> 0;
    end = end === undefined ? this.length : end >>> 0;

    if (!val) val = 0;

    var i;
    if (typeof val === 'number') {
      for (i = start; i < end; ++i) {
        this[i] = val;
      }
    } else {
      var bytes = Buffer.isBuffer(val) ? val : utf8ToBytes(new Buffer(val, encoding).toString());
      var len = bytes.length;
      for (i = 0; i < end - start; ++i) {
        this[i + start] = bytes[i % len];
      }
    }

    return this;
  };

  // HELPER FUNCTIONS
  // ================

  var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;

  function base64clean(str) {
    // Node strips out invalid characters like \n and \t from the string, base64-js does not
    str = stringtrim(str).replace(INVALID_BASE64_RE, '');
    // Node converts strings with length < 2 to ''
    if (str.length < 2) return '';
    // Node allows for non-padded base64 strings (missing trailing ===), base64-js does not
    while (str.length % 4 !== 0) {
      str = str + '=';
    }
    return str;
  }

  function stringtrim(str) {
    if (str.trim) return str.trim();
    return str.replace(/^\s+|\s+$/g, '');
  }

  function toHex(n) {
    if (n < 16) return '0' + n.toString(16);
    return n.toString(16);
  }

  function utf8ToBytes(string, units) {
    units = units || Infinity;
    var codePoint;
    var length = string.length;
    var leadSurrogate = null;
    var bytes = [];

    for (var i = 0; i < length; ++i) {
      codePoint = string.charCodeAt(i);

      // is surrogate component
      if (codePoint > 0xD7FF && codePoint < 0xE000) {
        // last char was a lead
        if (!leadSurrogate) {
          // no lead yet
          if (codePoint > 0xDBFF) {
            // unexpected trail
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue;
          } else if (i + 1 === length) {
            // unpaired lead
            if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
            continue;
          }

          // valid lead
          leadSurrogate = codePoint;

          continue;
        }

        // 2 leads in a row
        if (codePoint < 0xDC00) {
          if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
          leadSurrogate = codePoint;
          continue;
        }

        // valid surrogate pair
        codePoint = (leadSurrogate - 0xD800 << 10 | codePoint - 0xDC00) + 0x10000;
      } else if (leadSurrogate) {
        // valid bmp char, but last char was a lead
        if ((units -= 3) > -1) bytes.push(0xEF, 0xBF, 0xBD);
      }

      leadSurrogate = null;

      // encode utf8
      if (codePoint < 0x80) {
        if ((units -= 1) < 0) break;
        bytes.push(codePoint);
      } else if (codePoint < 0x800) {
        if ((units -= 2) < 0) break;
        bytes.push(codePoint >> 0x6 | 0xC0, codePoint & 0x3F | 0x80);
      } else if (codePoint < 0x10000) {
        if ((units -= 3) < 0) break;
        bytes.push(codePoint >> 0xC | 0xE0, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
      } else if (codePoint < 0x110000) {
        if ((units -= 4) < 0) break;
        bytes.push(codePoint >> 0x12 | 0xF0, codePoint >> 0xC & 0x3F | 0x80, codePoint >> 0x6 & 0x3F | 0x80, codePoint & 0x3F | 0x80);
      } else {
        throw new Error('Invalid code point');
      }
    }

    return bytes;
  }

  function asciiToBytes(str) {
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      // Node's code seems to be doing this and not & 0x7F..
      byteArray.push(str.charCodeAt(i) & 0xFF);
    }
    return byteArray;
  }

  function utf16leToBytes(str, units) {
    var c, hi, lo;
    var byteArray = [];
    for (var i = 0; i < str.length; ++i) {
      if ((units -= 2) < 0) break;

      c = str.charCodeAt(i);
      hi = c >> 8;
      lo = c % 256;
      byteArray.push(lo);
      byteArray.push(hi);
    }

    return byteArray;
  }

  function base64ToBytes(str) {
    return base64.toByteArray(base64clean(str));
  }

  function blitBuffer(src, dst, offset, length) {
    for (var i = 0; i < length; ++i) {
      if (i + offset >= dst.length || i >= src.length) break;
      dst[i + offset] = src[i];
    }
    return i;
  }

  function isnan(val) {
    return val !== val; // eslint-disable-line no-self-compare
  }
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(292).Buffer, (function() { return this; }())))

/***/ },
/* 293 */
/***/ function(module, exports) {

  'use strict';

  exports.byteLength = byteLength;
  exports.toByteArray = toByteArray;
  exports.fromByteArray = fromByteArray;

  var lookup = [];
  var revLookup = [];
  var Arr = typeof Uint8Array !== 'undefined' ? Uint8Array : Array;

  var code = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  for (var i = 0, len = code.length; i < len; ++i) {
    lookup[i] = code[i];
    revLookup[code.charCodeAt(i)] = i;
  }

  revLookup['-'.charCodeAt(0)] = 62;
  revLookup['_'.charCodeAt(0)] = 63;

  function placeHoldersCount(b64) {
    var len = b64.length;
    if (len % 4 > 0) {
      throw new Error('Invalid string. Length must be a multiple of 4');
    }

    // the number of equal signs (place holders)
    // if there are two placeholders, than the two characters before it
    // represent one byte
    // if there is only one, then the three characters before it represent 2 bytes
    // this is just a cheap hack to not do indexOf twice
    return b64[len - 2] === '=' ? 2 : b64[len - 1] === '=' ? 1 : 0;
  }

  function byteLength(b64) {
    // base64 is 4/3 + up to two characters of the original data
    return b64.length * 3 / 4 - placeHoldersCount(b64);
  }

  function toByteArray(b64) {
    var i, j, l, tmp, placeHolders, arr;
    var len = b64.length;
    placeHolders = placeHoldersCount(b64);

    arr = new Arr(len * 3 / 4 - placeHolders);

    // if there are placeholders, only get up to the last complete 4 chars
    l = placeHolders > 0 ? len - 4 : len;

    var L = 0;

    for (i = 0, j = 0; i < l; i += 4, j += 3) {
      tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
      arr[L++] = tmp >> 16 & 0xFF;
      arr[L++] = tmp >> 8 & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    if (placeHolders === 2) {
      tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
      arr[L++] = tmp & 0xFF;
    } else if (placeHolders === 1) {
      tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
      arr[L++] = tmp >> 8 & 0xFF;
      arr[L++] = tmp & 0xFF;
    }

    return arr;
  }

  function tripletToBase64(num) {
    return lookup[num >> 18 & 0x3F] + lookup[num >> 12 & 0x3F] + lookup[num >> 6 & 0x3F] + lookup[num & 0x3F];
  }

  function encodeChunk(uint8, start, end) {
    var tmp;
    var output = [];
    for (var i = start; i < end; i += 3) {
      tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
      output.push(tripletToBase64(tmp));
    }
    return output.join('');
  }

  function fromByteArray(uint8) {
    var tmp;
    var len = uint8.length;
    var extraBytes = len % 3; // if we have 1 byte left, pad 2 bytes
    var output = '';
    var parts = [];
    var maxChunkLength = 16383; // must be multiple of 3

    // go through the array every three bytes, we'll deal with trailing stuff later
    for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
      parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
    }

    // pad the end with zeros, but make sure to not forget the extra bytes
    if (extraBytes === 1) {
      tmp = uint8[len - 1];
      output += lookup[tmp >> 2];
      output += lookup[tmp << 4 & 0x3F];
      output += '==';
    } else if (extraBytes === 2) {
      tmp = (uint8[len - 2] << 8) + uint8[len - 1];
      output += lookup[tmp >> 10];
      output += lookup[tmp >> 4 & 0x3F];
      output += lookup[tmp << 2 & 0x3F];
      output += '=';
    }

    parts.push(output);

    return parts.join('');
  }

/***/ },
/* 294 */
/***/ function(module, exports) {

  "use strict";

  exports.read = function (buffer, offset, isLE, mLen, nBytes) {
    var e, m;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var nBits = -7;
    var i = isLE ? nBytes - 1 : 0;
    var d = isLE ? -1 : 1;
    var s = buffer[offset + i];

    i += d;

    e = s & (1 << -nBits) - 1;
    s >>= -nBits;
    nBits += eLen;
    for (; nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    m = e & (1 << -nBits) - 1;
    e >>= -nBits;
    nBits += mLen;
    for (; nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}

    if (e === 0) {
      e = 1 - eBias;
    } else if (e === eMax) {
      return m ? NaN : (s ? -1 : 1) * Infinity;
    } else {
      m = m + Math.pow(2, mLen);
      e = e - eBias;
    }
    return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
  };

  exports.write = function (buffer, value, offset, isLE, mLen, nBytes) {
    var e, m, c;
    var eLen = nBytes * 8 - mLen - 1;
    var eMax = (1 << eLen) - 1;
    var eBias = eMax >> 1;
    var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
    var i = isLE ? 0 : nBytes - 1;
    var d = isLE ? 1 : -1;
    var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;

    value = Math.abs(value);

    if (isNaN(value) || value === Infinity) {
      m = isNaN(value) ? 1 : 0;
      e = eMax;
    } else {
      e = Math.floor(Math.log(value) / Math.LN2);
      if (value * (c = Math.pow(2, -e)) < 1) {
        e--;
        c *= 2;
      }
      if (e + eBias >= 1) {
        value += rt / c;
      } else {
        value += rt * Math.pow(2, 1 - eBias);
      }
      if (value * c >= 2) {
        e++;
        c /= 2;
      }

      if (e + eBias >= eMax) {
        m = 0;
        e = eMax;
      } else if (e + eBias >= 1) {
        m = (value * c - 1) * Math.pow(2, mLen);
        e = e + eBias;
      } else {
        m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
        e = 0;
      }
    }

    for (; mLen >= 8; buffer[offset + i] = m & 0xff, i += d, m /= 256, mLen -= 8) {}

    e = e << mLen | m;
    eLen += mLen;
    for (; eLen > 0; buffer[offset + i] = e & 0xff, i += d, e /= 256, eLen -= 8) {}

    buffer[offset + i - d] |= s * 128;
  };

/***/ },
/* 295 */
/***/ function(module, exports) {

  'use strict';

  var toString = {}.toString;

  module.exports = Array.isArray || function (arr) {
    return toString.call(arr) == '[object Array]';
  };

/***/ },
/* 296 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(global, Buffer) {'use strict';

  (function () {
    var g = ('undefined' === typeof window ? global : window) || {};
    _crypto = g.crypto || g.msCrypto || __webpack_require__(297);
    module.exports = function (size) {
      // Modern Browsers
      if (_crypto.getRandomValues) {
        var bytes = new Buffer(size); //in browserify, this is an extended Uint8Array
        /* This will not work in older browsers.
         * See https://developer.mozilla.org/en-US/docs/Web/API/window.crypto.getRandomValues
         */

        _crypto.getRandomValues(bytes);
        return bytes;
      } else if (_crypto.randomBytes) {
        return _crypto.randomBytes(size);
      } else throw new Error('secure random number generation not supported by this browser\n' + 'use chrome, FireFox or Internet Explorer 11');
    };
  })();
  /* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(292).Buffer))

/***/ },
/* 297 */
/***/ function(module, exports) {

  /* (ignored) */

/***/ },
/* 298 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';

  var createHash = __webpack_require__(299);

  var md5 = toConstructor(__webpack_require__(308));
  var rmd160 = toConstructor(__webpack_require__(310));

  function toConstructor(fn) {
    return function () {
      var buffers = [];
      var m = {
        update: function update(data, enc) {
          if (!Buffer.isBuffer(data)) data = new Buffer(data, enc);
          buffers.push(data);
          return this;
        },
        digest: function digest(enc) {
          var buf = Buffer.concat(buffers);
          var r = fn(buf);
          buffers = null;
          return enc ? r.toString(enc) : r;
        }
      };
      return m;
    };
  }

  module.exports = function (alg) {
    if ('md5' === alg) return new md5();
    if ('rmd160' === alg) return new rmd160();
    return createHash(alg);
  };
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(292).Buffer))

/***/ },
/* 299 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var _exports = module.exports = function (alg) {
    var Alg = _exports[alg];
    if (!Alg) throw new Error(alg + ' is not supported (we accept pull requests)');
    return new Alg();
  };

  var Buffer = __webpack_require__(292).Buffer;
  var Hash = __webpack_require__(300)(Buffer);

  _exports.sha1 = __webpack_require__(301)(Buffer, Hash);
  _exports.sha256 = __webpack_require__(306)(Buffer, Hash);
  _exports.sha512 = __webpack_require__(307)(Buffer, Hash);

/***/ },
/* 300 */
/***/ function(module, exports) {

  "use strict";

  module.exports = function (Buffer) {

    //prototype class for hash functions
    function Hash(blockSize, finalSize) {
      this._block = new Buffer(blockSize); //new Uint32Array(blockSize/4)
      this._finalSize = finalSize;
      this._blockSize = blockSize;
      this._len = 0;
      this._s = 0;
    }

    Hash.prototype.init = function () {
      this._s = 0;
      this._len = 0;
    };

    Hash.prototype.update = function (data, enc) {
      if ("string" === typeof data) {
        enc = enc || "utf8";
        data = new Buffer(data, enc);
      }

      var l = this._len += data.length;
      var s = this._s = this._s || 0;
      var f = 0;
      var buffer = this._block;

      while (s < l) {
        var t = Math.min(data.length, f + this._blockSize - s % this._blockSize);
        var ch = t - f;

        for (var i = 0; i < ch; i++) {
          buffer[s % this._blockSize + i] = data[i + f];
        }

        s += ch;
        f += ch;

        if (s % this._blockSize === 0) {
          this._update(buffer);
        }
      }
      this._s = s;

      return this;
    };

    Hash.prototype.digest = function (enc) {
      // Suppose the length of the message M, in bits, is l
      var l = this._len * 8;

      // Append the bit 1 to the end of the message
      this._block[this._len % this._blockSize] = 0x80;

      // and then k zero bits, where k is the smallest non-negative solution to the equation (l + 1 + k) === finalSize mod blockSize
      this._block.fill(0, this._len % this._blockSize + 1);

      if (l % (this._blockSize * 8) >= this._finalSize * 8) {
        this._update(this._block);
        this._block.fill(0);
      }

      // to this append the block which is equal to the number l written in binary
      // TODO: handle case where l is > Math.pow(2, 29)
      this._block.writeInt32BE(l, this._blockSize - 4);

      var hash = this._update(this._block) || this._hash();

      return enc ? hash.toString(enc) : hash;
    };

    Hash.prototype._update = function () {
      throw new Error('_update must be implemented by subclass');
    };

    return Hash;
  };

/***/ },
/* 301 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  /*
   * A JavaScript implementation of the Secure Hash Algorithm, SHA-1, as defined
   * in FIPS PUB 180-1
   * Version 2.1a Copyright Paul Johnston 2000 - 2002.
   * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
   * Distributed under the BSD License
   * See http://pajhome.org.uk/crypt/md5 for details.
   */

  var inherits = __webpack_require__(302).inherits;

  module.exports = function (Buffer, Hash) {

    var A = 0 | 0;
    var B = 4 | 0;
    var C = 8 | 0;
    var D = 12 | 0;
    var E = 16 | 0;

    var W = new (typeof Int32Array === 'undefined' ? Array : Int32Array)(80);

    var POOL = [];

    function Sha1() {
      if (POOL.length) return POOL.pop().init();

      if (!(this instanceof Sha1)) return new Sha1();
      this._w = W;
      Hash.call(this, 16 * 4, 14 * 4);

      this._h = null;
      this.init();
    }

    inherits(Sha1, Hash);

    Sha1.prototype.init = function () {
      this._a = 0x67452301;
      this._b = 0xefcdab89;
      this._c = 0x98badcfe;
      this._d = 0x10325476;
      this._e = 0xc3d2e1f0;

      Hash.prototype.init.call(this);
      return this;
    };

    Sha1.prototype._POOL = POOL;
    Sha1.prototype._update = function (X) {

      var a, b, c, d, e, _a, _b, _c, _d, _e;

      a = _a = this._a;
      b = _b = this._b;
      c = _c = this._c;
      d = _d = this._d;
      e = _e = this._e;

      var w = this._w;

      for (var j = 0; j < 80; j++) {
        var W = w[j] = j < 16 ? X.readInt32BE(j * 4) : rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);

        var t = add(add(rol(a, 5), sha1_ft(j, b, c, d)), add(add(e, W), sha1_kt(j)));

        e = d;
        d = c;
        c = rol(b, 30);
        b = a;
        a = t;
      }

      this._a = add(a, _a);
      this._b = add(b, _b);
      this._c = add(c, _c);
      this._d = add(d, _d);
      this._e = add(e, _e);
    };

    Sha1.prototype._hash = function () {
      if (POOL.length < 100) POOL.push(this);
      var H = new Buffer(20);
      //console.log(this._a|0, this._b|0, this._c|0, this._d|0, this._e|0)
      H.writeInt32BE(this._a | 0, A);
      H.writeInt32BE(this._b | 0, B);
      H.writeInt32BE(this._c | 0, C);
      H.writeInt32BE(this._d | 0, D);
      H.writeInt32BE(this._e | 0, E);
      return H;
    };

    /*
     * Perform the appropriate triplet combination function for the current
     * iteration
     */
    function sha1_ft(t, b, c, d) {
      if (t < 20) return b & c | ~b & d;
      if (t < 40) return b ^ c ^ d;
      if (t < 60) return b & c | b & d | c & d;
      return b ^ c ^ d;
    }

    /*
     * Determine the appropriate additive constant for the current iteration
     */
    function sha1_kt(t) {
      return t < 20 ? 1518500249 : t < 40 ? 1859775393 : t < 60 ? -1894007588 : -899497514;
    }

    /*
     * Add integers, wrapping at 2^32. This uses 16-bit operations internally
     * to work around bugs in some JS interpreters.
     * //dominictarr: this is 10 years old, so maybe this can be dropped?)
     *
     */
    function add(x, y) {
      return x + y | 0;
      //lets see how this goes on testling.
      //  var lsw = (x & 0xFFFF) + (y & 0xFFFF);
      //  var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
      //  return (msw << 16) | (lsw & 0xFFFF);
    }

    /*
     * Bitwise rotate a 32-bit number to the left.
     */
    function rol(num, cnt) {
      return num << cnt | num >>> 32 - cnt;
    }

    return Sha1;
  };

/***/ },
/* 302 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(global, process) {'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  // Copyright Joyent, Inc. and other Node contributors.
  //
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  //
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  //
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.

  var formatRegExp = /%[sdj%]/g;
  exports.format = function (f) {
    if (!isString(f)) {
      var objects = [];
      for (var i = 0; i < arguments.length; i++) {
        objects.push(inspect(arguments[i]));
      }
      return objects.join(' ');
    }

    var i = 1;
    var args = arguments;
    var len = args.length;
    var str = String(f).replace(formatRegExp, function (x) {
      if (x === '%%') return '%';
      if (i >= len) return x;
      switch (x) {
        case '%s':
          return String(args[i++]);
        case '%d':
          return Number(args[i++]);
        case '%j':
          try {
            return JSON.stringify(args[i++]);
          } catch (_) {
            return '[Circular]';
          }
        default:
          return x;
      }
    });
    for (var x = args[i]; i < len; x = args[++i]) {
      if (isNull(x) || !isObject(x)) {
        str += ' ' + x;
      } else {
        str += ' ' + inspect(x);
      }
    }
    return str;
  };

  // Mark that a method should not be used.
  // Returns a modified function which warns once by default.
  // If --no-deprecation is set, then it is a no-op.
  exports.deprecate = function (fn, msg) {
    // Allow for deprecating things in the process of starting up.
    if (isUndefined(global.process)) {
      return function () {
        return exports.deprecate(fn, msg).apply(this, arguments);
      };
    }

    if (process.noDeprecation === true) {
      return fn;
    }

    var warned = false;
    function deprecated() {
      if (!warned) {
        if (process.throwDeprecation) {
          throw new Error(msg);
        } else if (process.traceDeprecation) {
          console.trace(msg);
        } else {
          console.error(msg);
        }
        warned = true;
      }
      return fn.apply(this, arguments);
    }

    return deprecated;
  };

  var debugs = {};
  var debugEnviron;
  exports.debuglog = function (set) {
    if (isUndefined(debugEnviron)) debugEnviron = process.env.NODE_DEBUG || '';
    set = set.toUpperCase();
    if (!debugs[set]) {
      if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
        var pid = process.pid;
        debugs[set] = function () {
          var msg = exports.format.apply(exports, arguments);
          console.error('%s %d: %s', set, pid, msg);
        };
      } else {
        debugs[set] = function () {};
      }
    }
    return debugs[set];
  };

  /**
   * Echos the value of a value. Trys to print the value out
   * in the best way possible given the different types.
   *
   * @param {Object} obj The object to print out.
   * @param {Object} opts Optional options object that alters the output.
   */
  /* legacy: obj, showHidden, depth, colors*/
  function inspect(obj, opts) {
    // default options
    var ctx = {
      seen: [],
      stylize: stylizeNoColor
    };
    // legacy...
    if (arguments.length >= 3) ctx.depth = arguments[2];
    if (arguments.length >= 4) ctx.colors = arguments[3];
    if (isBoolean(opts)) {
      // legacy...
      ctx.showHidden = opts;
    } else if (opts) {
      // got an "options" object
      exports._extend(ctx, opts);
    }
    // set default options
    if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
    if (isUndefined(ctx.depth)) ctx.depth = 2;
    if (isUndefined(ctx.colors)) ctx.colors = false;
    if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
    if (ctx.colors) ctx.stylize = stylizeWithColor;
    return formatValue(ctx, obj, ctx.depth);
  }
  exports.inspect = inspect;

  // http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
  inspect.colors = {
    'bold': [1, 22],
    'italic': [3, 23],
    'underline': [4, 24],
    'inverse': [7, 27],
    'white': [37, 39],
    'grey': [90, 39],
    'black': [30, 39],
    'blue': [34, 39],
    'cyan': [36, 39],
    'green': [32, 39],
    'magenta': [35, 39],
    'red': [31, 39],
    'yellow': [33, 39]
  };

  // Don't use 'blue' not visible on cmd.exe
  inspect.styles = {
    'special': 'cyan',
    'number': 'yellow',
    'boolean': 'yellow',
    'undefined': 'grey',
    'null': 'bold',
    'string': 'green',
    'date': 'magenta',
    // "name": intentionally not styling
    'regexp': 'red'
  };

  function stylizeWithColor(str, styleType) {
    var style = inspect.styles[styleType];

    if (style) {
      return '\x1B[' + inspect.colors[style][0] + 'm' + str + '\x1B[' + inspect.colors[style][1] + 'm';
    } else {
      return str;
    }
  }

  function stylizeNoColor(str, styleType) {
    return str;
  }

  function arrayToHash(array) {
    var hash = {};

    array.forEach(function (val, idx) {
      hash[val] = true;
    });

    return hash;
  }

  function formatValue(ctx, value, recurseTimes) {
    // Provide a hook for user-specified inspect functions.
    // Check that value is an object with an inspect function on it
    if (ctx.customInspect && value && isFunction(value.inspect) &&
    // Filter out the util module, it's inspect function is special
    value.inspect !== exports.inspect &&
    // Also filter out any prototype objects using the circular check.
    !(value.constructor && value.constructor.prototype === value)) {
      var ret = value.inspect(recurseTimes, ctx);
      if (!isString(ret)) {
        ret = formatValue(ctx, ret, recurseTimes);
      }
      return ret;
    }

    // Primitive types cannot have properties
    var primitive = formatPrimitive(ctx, value);
    if (primitive) {
      return primitive;
    }

    // Look up the keys of the object.
    var keys = Object.keys(value);
    var visibleKeys = arrayToHash(keys);

    if (ctx.showHidden) {
      keys = Object.getOwnPropertyNames(value);
    }

    // IE doesn't make error fields non-enumerable
    // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
    if (isError(value) && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
      return formatError(value);
    }

    // Some type of object without properties can be shortcutted.
    if (keys.length === 0) {
      if (isFunction(value)) {
        var name = value.name ? ': ' + value.name : '';
        return ctx.stylize('[Function' + name + ']', 'special');
      }
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      }
      if (isDate(value)) {
        return ctx.stylize(Date.prototype.toString.call(value), 'date');
      }
      if (isError(value)) {
        return formatError(value);
      }
    }

    var base = '',
        array = false,
        braces = ['{', '}'];

    // Make Array say that they are Array
    if (isArray(value)) {
      array = true;
      braces = ['[', ']'];
    }

    // Make functions say that they are functions
    if (isFunction(value)) {
      var n = value.name ? ': ' + value.name : '';
      base = ' [Function' + n + ']';
    }

    // Make RegExps say that they are RegExps
    if (isRegExp(value)) {
      base = ' ' + RegExp.prototype.toString.call(value);
    }

    // Make dates with properties first say the date
    if (isDate(value)) {
      base = ' ' + Date.prototype.toUTCString.call(value);
    }

    // Make error with message first say the error
    if (isError(value)) {
      base = ' ' + formatError(value);
    }

    if (keys.length === 0 && (!array || value.length == 0)) {
      return braces[0] + base + braces[1];
    }

    if (recurseTimes < 0) {
      if (isRegExp(value)) {
        return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
      } else {
        return ctx.stylize('[Object]', 'special');
      }
    }

    ctx.seen.push(value);

    var output;
    if (array) {
      output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
    } else {
      output = keys.map(function (key) {
        return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
      });
    }

    ctx.seen.pop();

    return reduceToSingleString(output, base, braces);
  }

  function formatPrimitive(ctx, value) {
    if (isUndefined(value)) return ctx.stylize('undefined', 'undefined');
    if (isString(value)) {
      var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '').replace(/'/g, "\\'").replace(/\\"/g, '"') + '\'';
      return ctx.stylize(simple, 'string');
    }
    if (isNumber(value)) return ctx.stylize('' + value, 'number');
    if (isBoolean(value)) return ctx.stylize('' + value, 'boolean');
    // For some reason typeof null is "object", so special case here.
    if (isNull(value)) return ctx.stylize('null', 'null');
  }

  function formatError(value) {
    return '[' + Error.prototype.toString.call(value) + ']';
  }

  function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
    var output = [];
    for (var i = 0, l = value.length; i < l; ++i) {
      if (hasOwnProperty(value, String(i))) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
      } else {
        output.push('');
      }
    }
    keys.forEach(function (key) {
      if (!key.match(/^\d+$/)) {
        output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
      }
    });
    return output;
  }

  function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
    var name, str, desc;
    desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
    if (desc.get) {
      if (desc.set) {
        str = ctx.stylize('[Getter/Setter]', 'special');
      } else {
        str = ctx.stylize('[Getter]', 'special');
      }
    } else {
      if (desc.set) {
        str = ctx.stylize('[Setter]', 'special');
      }
    }
    if (!hasOwnProperty(visibleKeys, key)) {
      name = '[' + key + ']';
    }
    if (!str) {
      if (ctx.seen.indexOf(desc.value) < 0) {
        if (isNull(recurseTimes)) {
          str = formatValue(ctx, desc.value, null);
        } else {
          str = formatValue(ctx, desc.value, recurseTimes - 1);
        }
        if (str.indexOf('\n') > -1) {
          if (array) {
            str = str.split('\n').map(function (line) {
              return '  ' + line;
            }).join('\n').substr(2);
          } else {
            str = '\n' + str.split('\n').map(function (line) {
              return '   ' + line;
            }).join('\n');
          }
        }
      } else {
        str = ctx.stylize('[Circular]', 'special');
      }
    }
    if (isUndefined(name)) {
      if (array && key.match(/^\d+$/)) {
        return str;
      }
      name = JSON.stringify('' + key);
      if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
        name = name.substr(1, name.length - 2);
        name = ctx.stylize(name, 'name');
      } else {
        name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
        name = ctx.stylize(name, 'string');
      }
    }

    return name + ': ' + str;
  }

  function reduceToSingleString(output, base, braces) {
    var numLinesEst = 0;
    var length = output.reduce(function (prev, cur) {
      numLinesEst++;
      if (cur.indexOf('\n') >= 0) numLinesEst++;
      return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
    }, 0);

    if (length > 60) {
      return braces[0] + (base === '' ? '' : base + '\n ') + ' ' + output.join(',\n  ') + ' ' + braces[1];
    }

    return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
  }

  // NOTE: These type checking functions intentionally don't use `instanceof`
  // because it is fragile and can be easily faked with `Object.create()`.
  function isArray(ar) {
    return Array.isArray(ar);
  }
  exports.isArray = isArray;

  function isBoolean(arg) {
    return typeof arg === 'boolean';
  }
  exports.isBoolean = isBoolean;

  function isNull(arg) {
    return arg === null;
  }
  exports.isNull = isNull;

  function isNullOrUndefined(arg) {
    return arg == null;
  }
  exports.isNullOrUndefined = isNullOrUndefined;

  function isNumber(arg) {
    return typeof arg === 'number';
  }
  exports.isNumber = isNumber;

  function isString(arg) {
    return typeof arg === 'string';
  }
  exports.isString = isString;

  function isSymbol(arg) {
    return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'symbol';
  }
  exports.isSymbol = isSymbol;

  function isUndefined(arg) {
    return arg === void 0;
  }
  exports.isUndefined = isUndefined;

  function isRegExp(re) {
    return isObject(re) && objectToString(re) === '[object RegExp]';
  }
  exports.isRegExp = isRegExp;

  function isObject(arg) {
    return (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && arg !== null;
  }
  exports.isObject = isObject;

  function isDate(d) {
    return isObject(d) && objectToString(d) === '[object Date]';
  }
  exports.isDate = isDate;

  function isError(e) {
    return isObject(e) && (objectToString(e) === '[object Error]' || e instanceof Error);
  }
  exports.isError = isError;

  function isFunction(arg) {
    return typeof arg === 'function';
  }
  exports.isFunction = isFunction;

  function isPrimitive(arg) {
    return arg === null || typeof arg === 'boolean' || typeof arg === 'number' || typeof arg === 'string' || (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'symbol' || // ES6 symbol
    typeof arg === 'undefined';
  }
  exports.isPrimitive = isPrimitive;

  exports.isBuffer = __webpack_require__(304);

  function objectToString(o) {
    return Object.prototype.toString.call(o);
  }

  function pad(n) {
    return n < 10 ? '0' + n.toString(10) : n.toString(10);
  }

  var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // 26 Feb 16:19:34
  function timestamp() {
    var d = new Date();
    var time = [pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds())].join(':');
    return [d.getDate(), months[d.getMonth()], time].join(' ');
  }

  // log is just a thin wrapper to console.log that prepends a timestamp
  exports.log = function () {
    console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
  };

  /**
   * Inherit the prototype methods from one constructor into another.
   *
   * The Function.prototype.inherits from lang.js rewritten as a standalone
   * function (not on Function.prototype). NOTE: If this file is to be loaded
   * during bootstrapping this function needs to be rewritten using some native
   * functions as prototype setup using normal JavaScript does not work as
   * expected during bootstrapping (see mirror.js in r114903).
   *
   * @param {function} ctor Constructor function which needs to inherit the
   *     prototype.
   * @param {function} superCtor Constructor function to inherit prototype from.
   */
  exports.inherits = __webpack_require__(305);

  exports._extend = function (origin, add) {
    // Don't do anything if add isn't an object
    if (!add || !isObject(add)) return origin;

    var keys = Object.keys(add);
    var i = keys.length;
    while (i--) {
      origin[keys[i]] = add[keys[i]];
    }
    return origin;
  };

  function hasOwnProperty(obj, prop) {
    return Object.prototype.hasOwnProperty.call(obj, prop);
  }
  /* WEBPACK VAR INJECTION */}.call(exports, (function() { return this; }()), __webpack_require__(303)))

/***/ },
/* 303 */
/***/ function(module, exports) {

  'use strict';

  // shim for using process in browser
  var process = module.exports = {};

  // cached from whatever global is present so that test runners that stub it
  // don't break things.  But we need to wrap it in a try catch in case it is
  // wrapped in strict mode code which doesn't define any globals.  It's inside a
  // function because try/catches deoptimize in certain engines.

  var cachedSetTimeout;
  var cachedClearTimeout;

  function defaultSetTimout() {
      throw new Error('setTimeout has not been defined');
  }
  function defaultClearTimeout() {
      throw new Error('clearTimeout has not been defined');
  }
  (function () {
      try {
          if (typeof setTimeout === 'function') {
              cachedSetTimeout = setTimeout;
          } else {
              cachedSetTimeout = defaultSetTimout;
          }
      } catch (e) {
          cachedSetTimeout = defaultSetTimout;
      }
      try {
          if (typeof clearTimeout === 'function') {
              cachedClearTimeout = clearTimeout;
          } else {
              cachedClearTimeout = defaultClearTimeout;
          }
      } catch (e) {
          cachedClearTimeout = defaultClearTimeout;
      }
  })();
  function runTimeout(fun) {
      if (cachedSetTimeout === setTimeout) {
          //normal enviroments in sane situations
          return setTimeout(fun, 0);
      }
      // if setTimeout wasn't available but was latter defined
      if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
          cachedSetTimeout = setTimeout;
          return setTimeout(fun, 0);
      }
      try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedSetTimeout(fun, 0);
      } catch (e) {
          try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
              return cachedSetTimeout.call(null, fun, 0);
          } catch (e) {
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
              return cachedSetTimeout.call(this, fun, 0);
          }
      }
  }
  function runClearTimeout(marker) {
      if (cachedClearTimeout === clearTimeout) {
          //normal enviroments in sane situations
          return clearTimeout(marker);
      }
      // if clearTimeout wasn't available but was latter defined
      if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
          cachedClearTimeout = clearTimeout;
          return clearTimeout(marker);
      }
      try {
          // when when somebody has screwed with setTimeout but no I.E. maddness
          return cachedClearTimeout(marker);
      } catch (e) {
          try {
              // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
              return cachedClearTimeout.call(null, marker);
          } catch (e) {
              // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
              // Some versions of I.E. have different rules for clearTimeout vs setTimeout
              return cachedClearTimeout.call(this, marker);
          }
      }
  }
  var queue = [];
  var draining = false;
  var currentQueue;
  var queueIndex = -1;

  function cleanUpNextTick() {
      if (!draining || !currentQueue) {
          return;
      }
      draining = false;
      if (currentQueue.length) {
          queue = currentQueue.concat(queue);
      } else {
          queueIndex = -1;
      }
      if (queue.length) {
          drainQueue();
      }
  }

  function drainQueue() {
      if (draining) {
          return;
      }
      var timeout = runTimeout(cleanUpNextTick);
      draining = true;

      var len = queue.length;
      while (len) {
          currentQueue = queue;
          queue = [];
          while (++queueIndex < len) {
              if (currentQueue) {
                  currentQueue[queueIndex].run();
              }
          }
          queueIndex = -1;
          len = queue.length;
      }
      currentQueue = null;
      draining = false;
      runClearTimeout(timeout);
  }

  process.nextTick = function (fun) {
      var args = new Array(arguments.length - 1);
      if (arguments.length > 1) {
          for (var i = 1; i < arguments.length; i++) {
              args[i - 1] = arguments[i];
          }
      }
      queue.push(new Item(fun, args));
      if (queue.length === 1 && !draining) {
          runTimeout(drainQueue);
      }
  };

  // v8 likes predictible objects
  function Item(fun, array) {
      this.fun = fun;
      this.array = array;
  }
  Item.prototype.run = function () {
      this.fun.apply(null, this.array);
  };
  process.title = 'browser';
  process.browser = true;
  process.env = {};
  process.argv = [];
  process.version = ''; // empty string to avoid regexp issues
  process.versions = {};

  function noop() {}

  process.on = noop;
  process.addListener = noop;
  process.once = noop;
  process.off = noop;
  process.removeListener = noop;
  process.removeAllListeners = noop;
  process.emit = noop;

  process.binding = function (name) {
      throw new Error('process.binding is not supported');
  };

  process.cwd = function () {
      return '/';
  };
  process.chdir = function (dir) {
      throw new Error('process.chdir is not supported');
  };
  process.umask = function () {
      return 0;
  };

/***/ },
/* 304 */
/***/ function(module, exports) {

  'use strict';

  var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

  module.exports = function isBuffer(arg) {
    return arg && (typeof arg === 'undefined' ? 'undefined' : _typeof(arg)) === 'object' && typeof arg.copy === 'function' && typeof arg.fill === 'function' && typeof arg.readUInt8 === 'function';
  };

/***/ },
/* 305 */
/***/ function(module, exports) {

  'use strict';

  if (typeof Object.create === 'function') {
    // implementation from standard node.js 'util' module
    module.exports = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor;
      ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
          value: ctor,
          enumerable: false,
          writable: true,
          configurable: true
        }
      });
    };
  } else {
    // old school shim for old browsers
    module.exports = function inherits(ctor, superCtor) {
      ctor.super_ = superCtor;
      var TempCtor = function TempCtor() {};
      TempCtor.prototype = superCtor.prototype;
      ctor.prototype = new TempCtor();
      ctor.prototype.constructor = ctor;
    };
  }

/***/ },
/* 306 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  /**
   * A JavaScript implementation of the Secure Hash Algorithm, SHA-256, as defined
   * in FIPS 180-2
   * Version 2.2-beta Copyright Angel Marin, Paul Johnston 2000 - 2009.
   * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
   *
   */

  var inherits = __webpack_require__(302).inherits;

  module.exports = function (Buffer, Hash) {

    var K = [0x428A2F98, 0x71374491, 0xB5C0FBCF, 0xE9B5DBA5, 0x3956C25B, 0x59F111F1, 0x923F82A4, 0xAB1C5ED5, 0xD807AA98, 0x12835B01, 0x243185BE, 0x550C7DC3, 0x72BE5D74, 0x80DEB1FE, 0x9BDC06A7, 0xC19BF174, 0xE49B69C1, 0xEFBE4786, 0x0FC19DC6, 0x240CA1CC, 0x2DE92C6F, 0x4A7484AA, 0x5CB0A9DC, 0x76F988DA, 0x983E5152, 0xA831C66D, 0xB00327C8, 0xBF597FC7, 0xC6E00BF3, 0xD5A79147, 0x06CA6351, 0x14292967, 0x27B70A85, 0x2E1B2138, 0x4D2C6DFC, 0x53380D13, 0x650A7354, 0x766A0ABB, 0x81C2C92E, 0x92722C85, 0xA2BFE8A1, 0xA81A664B, 0xC24B8B70, 0xC76C51A3, 0xD192E819, 0xD6990624, 0xF40E3585, 0x106AA070, 0x19A4C116, 0x1E376C08, 0x2748774C, 0x34B0BCB5, 0x391C0CB3, 0x4ED8AA4A, 0x5B9CCA4F, 0x682E6FF3, 0x748F82EE, 0x78A5636F, 0x84C87814, 0x8CC70208, 0x90BEFFFA, 0xA4506CEB, 0xBEF9A3F7, 0xC67178F2];

    var W = new Array(64);

    function Sha256() {
      this.init();

      this._w = W; //new Array(64)

      Hash.call(this, 16 * 4, 14 * 4);
    }

    inherits(Sha256, Hash);

    Sha256.prototype.init = function () {

      this._a = 0x6a09e667 | 0;
      this._b = 0xbb67ae85 | 0;
      this._c = 0x3c6ef372 | 0;
      this._d = 0xa54ff53a | 0;
      this._e = 0x510e527f | 0;
      this._f = 0x9b05688c | 0;
      this._g = 0x1f83d9ab | 0;
      this._h = 0x5be0cd19 | 0;

      this._len = this._s = 0;

      return this;
    };

    function S(X, n) {
      return X >>> n | X << 32 - n;
    }

    function R(X, n) {
      return X >>> n;
    }

    function Ch(x, y, z) {
      return x & y ^ ~x & z;
    }

    function Maj(x, y, z) {
      return x & y ^ x & z ^ y & z;
    }

    function Sigma0256(x) {
      return S(x, 2) ^ S(x, 13) ^ S(x, 22);
    }

    function Sigma1256(x) {
      return S(x, 6) ^ S(x, 11) ^ S(x, 25);
    }

    function Gamma0256(x) {
      return S(x, 7) ^ S(x, 18) ^ R(x, 3);
    }

    function Gamma1256(x) {
      return S(x, 17) ^ S(x, 19) ^ R(x, 10);
    }

    Sha256.prototype._update = function (M) {

      var W = this._w;
      var a, b, c, d, e, f, g, h;
      var T1, T2;

      a = this._a | 0;
      b = this._b | 0;
      c = this._c | 0;
      d = this._d | 0;
      e = this._e | 0;
      f = this._f | 0;
      g = this._g | 0;
      h = this._h | 0;

      for (var j = 0; j < 64; j++) {
        var w = W[j] = j < 16 ? M.readInt32BE(j * 4) : Gamma1256(W[j - 2]) + W[j - 7] + Gamma0256(W[j - 15]) + W[j - 16];

        T1 = h + Sigma1256(e) + Ch(e, f, g) + K[j] + w;

        T2 = Sigma0256(a) + Maj(a, b, c);
        h = g;g = f;f = e;e = d + T1;d = c;c = b;b = a;a = T1 + T2;
      }

      this._a = a + this._a | 0;
      this._b = b + this._b | 0;
      this._c = c + this._c | 0;
      this._d = d + this._d | 0;
      this._e = e + this._e | 0;
      this._f = f + this._f | 0;
      this._g = g + this._g | 0;
      this._h = h + this._h | 0;
    };

    Sha256.prototype._hash = function () {
      var H = new Buffer(32);

      H.writeInt32BE(this._a, 0);
      H.writeInt32BE(this._b, 4);
      H.writeInt32BE(this._c, 8);
      H.writeInt32BE(this._d, 12);
      H.writeInt32BE(this._e, 16);
      H.writeInt32BE(this._f, 20);
      H.writeInt32BE(this._g, 24);
      H.writeInt32BE(this._h, 28);

      return H;
    };

    return Sha256;
  };

/***/ },
/* 307 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var inherits = __webpack_require__(302).inherits;

  module.exports = function (Buffer, Hash) {
    var K = [0x428a2f98, 0xd728ae22, 0x71374491, 0x23ef65cd, 0xb5c0fbcf, 0xec4d3b2f, 0xe9b5dba5, 0x8189dbbc, 0x3956c25b, 0xf348b538, 0x59f111f1, 0xb605d019, 0x923f82a4, 0xaf194f9b, 0xab1c5ed5, 0xda6d8118, 0xd807aa98, 0xa3030242, 0x12835b01, 0x45706fbe, 0x243185be, 0x4ee4b28c, 0x550c7dc3, 0xd5ffb4e2, 0x72be5d74, 0xf27b896f, 0x80deb1fe, 0x3b1696b1, 0x9bdc06a7, 0x25c71235, 0xc19bf174, 0xcf692694, 0xe49b69c1, 0x9ef14ad2, 0xefbe4786, 0x384f25e3, 0x0fc19dc6, 0x8b8cd5b5, 0x240ca1cc, 0x77ac9c65, 0x2de92c6f, 0x592b0275, 0x4a7484aa, 0x6ea6e483, 0x5cb0a9dc, 0xbd41fbd4, 0x76f988da, 0x831153b5, 0x983e5152, 0xee66dfab, 0xa831c66d, 0x2db43210, 0xb00327c8, 0x98fb213f, 0xbf597fc7, 0xbeef0ee4, 0xc6e00bf3, 0x3da88fc2, 0xd5a79147, 0x930aa725, 0x06ca6351, 0xe003826f, 0x14292967, 0x0a0e6e70, 0x27b70a85, 0x46d22ffc, 0x2e1b2138, 0x5c26c926, 0x4d2c6dfc, 0x5ac42aed, 0x53380d13, 0x9d95b3df, 0x650a7354, 0x8baf63de, 0x766a0abb, 0x3c77b2a8, 0x81c2c92e, 0x47edaee6, 0x92722c85, 0x1482353b, 0xa2bfe8a1, 0x4cf10364, 0xa81a664b, 0xbc423001, 0xc24b8b70, 0xd0f89791, 0xc76c51a3, 0x0654be30, 0xd192e819, 0xd6ef5218, 0xd6990624, 0x5565a910, 0xf40e3585, 0x5771202a, 0x106aa070, 0x32bbd1b8, 0x19a4c116, 0xb8d2d0c8, 0x1e376c08, 0x5141ab53, 0x2748774c, 0xdf8eeb99, 0x34b0bcb5, 0xe19b48a8, 0x391c0cb3, 0xc5c95a63, 0x4ed8aa4a, 0xe3418acb, 0x5b9cca4f, 0x7763e373, 0x682e6ff3, 0xd6b2b8a3, 0x748f82ee, 0x5defb2fc, 0x78a5636f, 0x43172f60, 0x84c87814, 0xa1f0ab72, 0x8cc70208, 0x1a6439ec, 0x90befffa, 0x23631e28, 0xa4506ceb, 0xde82bde9, 0xbef9a3f7, 0xb2c67915, 0xc67178f2, 0xe372532b, 0xca273ece, 0xea26619c, 0xd186b8c7, 0x21c0c207, 0xeada7dd6, 0xcde0eb1e, 0xf57d4f7f, 0xee6ed178, 0x06f067aa, 0x72176fba, 0x0a637dc5, 0xa2c898a6, 0x113f9804, 0xbef90dae, 0x1b710b35, 0x131c471b, 0x28db77f5, 0x23047d84, 0x32caab7b, 0x40c72493, 0x3c9ebe0a, 0x15c9bebc, 0x431d67c4, 0x9c100d4c, 0x4cc5d4be, 0xcb3e42b6, 0x597f299c, 0xfc657e2a, 0x5fcb6fab, 0x3ad6faec, 0x6c44198c, 0x4a475817];

    var W = new Array(160);

    function Sha512() {
      this.init();
      this._w = W;

      Hash.call(this, 128, 112);
    }

    inherits(Sha512, Hash);

    Sha512.prototype.init = function () {

      this._a = 0x6a09e667 | 0;
      this._b = 0xbb67ae85 | 0;
      this._c = 0x3c6ef372 | 0;
      this._d = 0xa54ff53a | 0;
      this._e = 0x510e527f | 0;
      this._f = 0x9b05688c | 0;
      this._g = 0x1f83d9ab | 0;
      this._h = 0x5be0cd19 | 0;

      this._al = 0xf3bcc908 | 0;
      this._bl = 0x84caa73b | 0;
      this._cl = 0xfe94f82b | 0;
      this._dl = 0x5f1d36f1 | 0;
      this._el = 0xade682d1 | 0;
      this._fl = 0x2b3e6c1f | 0;
      this._gl = 0xfb41bd6b | 0;
      this._hl = 0x137e2179 | 0;

      this._len = this._s = 0;

      return this;
    };

    function S(X, Xl, n) {
      return X >>> n | Xl << 32 - n;
    }

    function Ch(x, y, z) {
      return x & y ^ ~x & z;
    }

    function Maj(x, y, z) {
      return x & y ^ x & z ^ y & z;
    }

    Sha512.prototype._update = function (M) {

      var W = this._w;
      var a, b, c, d, e, f, g, h;
      var al, bl, cl, dl, el, fl, gl, hl;

      a = this._a | 0;
      b = this._b | 0;
      c = this._c | 0;
      d = this._d | 0;
      e = this._e | 0;
      f = this._f | 0;
      g = this._g | 0;
      h = this._h | 0;

      al = this._al | 0;
      bl = this._bl | 0;
      cl = this._cl | 0;
      dl = this._dl | 0;
      el = this._el | 0;
      fl = this._fl | 0;
      gl = this._gl | 0;
      hl = this._hl | 0;

      for (var i = 0; i < 80; i++) {
        var j = i * 2;

        var Wi, Wil;

        if (i < 16) {
          Wi = W[j] = M.readInt32BE(j * 4);
          Wil = W[j + 1] = M.readInt32BE(j * 4 + 4);
        } else {
          var x = W[j - 15 * 2];
          var xl = W[j - 15 * 2 + 1];
          var gamma0 = S(x, xl, 1) ^ S(x, xl, 8) ^ x >>> 7;
          var gamma0l = S(xl, x, 1) ^ S(xl, x, 8) ^ S(xl, x, 7);

          x = W[j - 2 * 2];
          xl = W[j - 2 * 2 + 1];
          var gamma1 = S(x, xl, 19) ^ S(xl, x, 29) ^ x >>> 6;
          var gamma1l = S(xl, x, 19) ^ S(x, xl, 29) ^ S(xl, x, 6);

          // W[i] = gamma0 + W[i - 7] + gamma1 + W[i - 16]
          var Wi7 = W[j - 7 * 2];
          var Wi7l = W[j - 7 * 2 + 1];

          var Wi16 = W[j - 16 * 2];
          var Wi16l = W[j - 16 * 2 + 1];

          Wil = gamma0l + Wi7l;
          Wi = gamma0 + Wi7 + (Wil >>> 0 < gamma0l >>> 0 ? 1 : 0);
          Wil = Wil + gamma1l;
          Wi = Wi + gamma1 + (Wil >>> 0 < gamma1l >>> 0 ? 1 : 0);
          Wil = Wil + Wi16l;
          Wi = Wi + Wi16 + (Wil >>> 0 < Wi16l >>> 0 ? 1 : 0);

          W[j] = Wi;
          W[j + 1] = Wil;
        }

        var maj = Maj(a, b, c);
        var majl = Maj(al, bl, cl);

        var sigma0h = S(a, al, 28) ^ S(al, a, 2) ^ S(al, a, 7);
        var sigma0l = S(al, a, 28) ^ S(a, al, 2) ^ S(a, al, 7);
        var sigma1h = S(e, el, 14) ^ S(e, el, 18) ^ S(el, e, 9);
        var sigma1l = S(el, e, 14) ^ S(el, e, 18) ^ S(e, el, 9);

        // t1 = h + sigma1 + ch + K[i] + W[i]
        var Ki = K[j];
        var Kil = K[j + 1];

        var ch = Ch(e, f, g);
        var chl = Ch(el, fl, gl);

        var t1l = hl + sigma1l;
        var t1 = h + sigma1h + (t1l >>> 0 < hl >>> 0 ? 1 : 0);
        t1l = t1l + chl;
        t1 = t1 + ch + (t1l >>> 0 < chl >>> 0 ? 1 : 0);
        t1l = t1l + Kil;
        t1 = t1 + Ki + (t1l >>> 0 < Kil >>> 0 ? 1 : 0);
        t1l = t1l + Wil;
        t1 = t1 + Wi + (t1l >>> 0 < Wil >>> 0 ? 1 : 0);

        // t2 = sigma0 + maj
        var t2l = sigma0l + majl;
        var t2 = sigma0h + maj + (t2l >>> 0 < sigma0l >>> 0 ? 1 : 0);

        h = g;
        hl = gl;
        g = f;
        gl = fl;
        f = e;
        fl = el;
        el = dl + t1l | 0;
        e = d + t1 + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
        d = c;
        dl = cl;
        c = b;
        cl = bl;
        b = a;
        bl = al;
        al = t1l + t2l | 0;
        a = t1 + t2 + (al >>> 0 < t1l >>> 0 ? 1 : 0) | 0;
      }

      this._al = this._al + al | 0;
      this._bl = this._bl + bl | 0;
      this._cl = this._cl + cl | 0;
      this._dl = this._dl + dl | 0;
      this._el = this._el + el | 0;
      this._fl = this._fl + fl | 0;
      this._gl = this._gl + gl | 0;
      this._hl = this._hl + hl | 0;

      this._a = this._a + a + (this._al >>> 0 < al >>> 0 ? 1 : 0) | 0;
      this._b = this._b + b + (this._bl >>> 0 < bl >>> 0 ? 1 : 0) | 0;
      this._c = this._c + c + (this._cl >>> 0 < cl >>> 0 ? 1 : 0) | 0;
      this._d = this._d + d + (this._dl >>> 0 < dl >>> 0 ? 1 : 0) | 0;
      this._e = this._e + e + (this._el >>> 0 < el >>> 0 ? 1 : 0) | 0;
      this._f = this._f + f + (this._fl >>> 0 < fl >>> 0 ? 1 : 0) | 0;
      this._g = this._g + g + (this._gl >>> 0 < gl >>> 0 ? 1 : 0) | 0;
      this._h = this._h + h + (this._hl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
    };

    Sha512.prototype._hash = function () {
      var H = new Buffer(64);

      function writeInt64BE(h, l, offset) {
        H.writeInt32BE(h, offset);
        H.writeInt32BE(l, offset + 4);
      }

      writeInt64BE(this._a, this._al, 0);
      writeInt64BE(this._b, this._bl, 8);
      writeInt64BE(this._c, this._cl, 16);
      writeInt64BE(this._d, this._dl, 24);
      writeInt64BE(this._e, this._el, 32);
      writeInt64BE(this._f, this._fl, 40);
      writeInt64BE(this._g, this._gl, 48);
      writeInt64BE(this._h, this._hl, 56);

      return H;
    };

    return Sha512;
  };

/***/ },
/* 308 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  /*
   * A JavaScript implementation of the RSA Data Security, Inc. MD5 Message
   * Digest Algorithm, as defined in RFC 1321.
   * Version 2.1 Copyright (C) Paul Johnston 1999 - 2002.
   * Other contributors: Greg Holt, Andrew Kepert, Ydnar, Lostinet
   * Distributed under the BSD License
   * See http://pajhome.org.uk/crypt/md5 for more info.
   */

  var helpers = __webpack_require__(309);

  /*
   * Calculate the MD5 of an array of little-endian words, and a bit length
   */
  function core_md5(x, len) {
    /* append padding */
    x[len >> 5] |= 0x80 << len % 32;
    x[(len + 64 >>> 9 << 4) + 14] = len;

    var a = 1732584193;
    var b = -271733879;
    var c = -1732584194;
    var d = 271733878;

    for (var i = 0; i < x.length; i += 16) {
      var olda = a;
      var oldb = b;
      var oldc = c;
      var oldd = d;

      a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
      d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
      c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
      b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
      a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
      d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
      c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
      b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
      a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
      d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
      c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
      b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
      a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
      d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
      c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
      b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);

      a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
      d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
      c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
      b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
      a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
      d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
      c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
      b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
      a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
      d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
      c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
      b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
      a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
      d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
      c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
      b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);

      a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
      d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
      c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
      b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
      a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
      d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
      c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
      b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
      a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
      d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
      c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
      b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
      a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
      d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
      c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
      b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);

      a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
      d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
      c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
      b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
      a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
      d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
      c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
      b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
      a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
      d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
      c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
      b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
      a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
      d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
      c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
      b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);

      a = safe_add(a, olda);
      b = safe_add(b, oldb);
      c = safe_add(c, oldc);
      d = safe_add(d, oldd);
    }
    return Array(a, b, c, d);
  }

  /*
   * These functions implement the four basic operations the algorithm uses.
   */
  function md5_cmn(q, a, b, x, s, t) {
    return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
  }
  function md5_ff(a, b, c, d, x, s, t) {
    return md5_cmn(b & c | ~b & d, a, b, x, s, t);
  }
  function md5_gg(a, b, c, d, x, s, t) {
    return md5_cmn(b & d | c & ~d, a, b, x, s, t);
  }
  function md5_hh(a, b, c, d, x, s, t) {
    return md5_cmn(b ^ c ^ d, a, b, x, s, t);
  }
  function md5_ii(a, b, c, d, x, s, t) {
    return md5_cmn(c ^ (b | ~d), a, b, x, s, t);
  }

  /*
   * Add integers, wrapping at 2^32. This uses 16-bit operations internally
   * to work around bugs in some JS interpreters.
   */
  function safe_add(x, y) {
    var lsw = (x & 0xFFFF) + (y & 0xFFFF);
    var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
    return msw << 16 | lsw & 0xFFFF;
  }

  /*
   * Bitwise rotate a 32-bit number to the left.
   */
  function bit_rol(num, cnt) {
    return num << cnt | num >>> 32 - cnt;
  }

  module.exports = function md5(buf) {
    return helpers.hash(buf, core_md5, 16);
  };

/***/ },
/* 309 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(Buffer) {"use strict";

  var intSize = 4;
  var zeroBuffer = new Buffer(intSize);zeroBuffer.fill(0);
  var chrsz = 8;

  function toArray(buf, bigEndian) {
    if (buf.length % intSize !== 0) {
      var len = buf.length + (intSize - buf.length % intSize);
      buf = Buffer.concat([buf, zeroBuffer], len);
    }

    var arr = [];
    var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
    for (var i = 0; i < buf.length; i += intSize) {
      arr.push(fn.call(buf, i));
    }
    return arr;
  }

  function toBuffer(arr, size, bigEndian) {
    var buf = new Buffer(size);
    var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
    for (var i = 0; i < arr.length; i++) {
      fn.call(buf, arr[i], i * 4, true);
    }
    return buf;
  }

  function hash(buf, fn, hashSize, bigEndian) {
    if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
    var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
    return toBuffer(arr, hashSize, bigEndian);
  }

  module.exports = { hash: hash };
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(292).Buffer))

/***/ },
/* 310 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';

  module.exports = ripemd160;

  /*
  CryptoJS v3.1.2
  code.google.com/p/crypto-js
  (c) 2009-2013 by Jeff Mott. All rights reserved.
  code.google.com/p/crypto-js/wiki/License
  */
  /** @preserve
  (c) 2012 by Cédric Mesnil. All rights reserved.

  Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

      - Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.
      - Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

  THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
  */

  // Constants table
  var zl = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13];
  var zr = [5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11];
  var sl = [11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6];
  var sr = [8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11];

  var hl = [0x00000000, 0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xA953FD4E];
  var hr = [0x50A28BE6, 0x5C4DD124, 0x6D703EF3, 0x7A6D76E9, 0x00000000];

  var bytesToWords = function bytesToWords(bytes) {
    var words = [];
    for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
      words[b >>> 5] |= bytes[i] << 24 - b % 32;
    }
    return words;
  };

  var wordsToBytes = function wordsToBytes(words) {
    var bytes = [];
    for (var b = 0; b < words.length * 32; b += 8) {
      bytes.push(words[b >>> 5] >>> 24 - b % 32 & 0xFF);
    }
    return bytes;
  };

  var processBlock = function processBlock(H, M, offset) {

    // Swap endian
    for (var i = 0; i < 16; i++) {
      var offset_i = offset + i;
      var M_offset_i = M[offset_i];

      // Swap
      M[offset_i] = (M_offset_i << 8 | M_offset_i >>> 24) & 0x00ff00ff | (M_offset_i << 24 | M_offset_i >>> 8) & 0xff00ff00;
    }

    // Working variables
    var al, bl, cl, dl, el;
    var ar, br, cr, dr, er;

    ar = al = H[0];
    br = bl = H[1];
    cr = cl = H[2];
    dr = dl = H[3];
    er = el = H[4];
    // Computation
    var t;
    for (var i = 0; i < 80; i += 1) {
      t = al + M[offset + zl[i]] | 0;
      if (i < 16) {
        t += f1(bl, cl, dl) + hl[0];
      } else if (i < 32) {
        t += f2(bl, cl, dl) + hl[1];
      } else if (i < 48) {
        t += f3(bl, cl, dl) + hl[2];
      } else if (i < 64) {
        t += f4(bl, cl, dl) + hl[3];
      } else {
        // if (i<80) {
        t += f5(bl, cl, dl) + hl[4];
      }
      t = t | 0;
      t = rotl(t, sl[i]);
      t = t + el | 0;
      al = el;
      el = dl;
      dl = rotl(cl, 10);
      cl = bl;
      bl = t;

      t = ar + M[offset + zr[i]] | 0;
      if (i < 16) {
        t += f5(br, cr, dr) + hr[0];
      } else if (i < 32) {
        t += f4(br, cr, dr) + hr[1];
      } else if (i < 48) {
        t += f3(br, cr, dr) + hr[2];
      } else if (i < 64) {
        t += f2(br, cr, dr) + hr[3];
      } else {
        // if (i<80) {
        t += f1(br, cr, dr) + hr[4];
      }
      t = t | 0;
      t = rotl(t, sr[i]);
      t = t + er | 0;
      ar = er;
      er = dr;
      dr = rotl(cr, 10);
      cr = br;
      br = t;
    }
    // Intermediate hash value
    t = H[1] + cl + dr | 0;
    H[1] = H[2] + dl + er | 0;
    H[2] = H[3] + el + ar | 0;
    H[3] = H[4] + al + br | 0;
    H[4] = H[0] + bl + cr | 0;
    H[0] = t;
  };

  function f1(x, y, z) {
    return x ^ y ^ z;
  }

  function f2(x, y, z) {
    return x & y | ~x & z;
  }

  function f3(x, y, z) {
    return (x | ~y) ^ z;
  }

  function f4(x, y, z) {
    return x & z | y & ~z;
  }

  function f5(x, y, z) {
    return x ^ (y | ~z);
  }

  function rotl(x, n) {
    return x << n | x >>> 32 - n;
  }

  function ripemd160(message) {
    var H = [0x67452301, 0xEFCDAB89, 0x98BADCFE, 0x10325476, 0xC3D2E1F0];

    if (typeof message == 'string') message = new Buffer(message, 'utf8');

    var m = bytesToWords(message);

    var nBitsLeft = message.length * 8;
    var nBitsTotal = message.length * 8;

    // Add padding
    m[nBitsLeft >>> 5] |= 0x80 << 24 - nBitsLeft % 32;
    m[(nBitsLeft + 64 >>> 9 << 4) + 14] = (nBitsTotal << 8 | nBitsTotal >>> 24) & 0x00ff00ff | (nBitsTotal << 24 | nBitsTotal >>> 8) & 0xff00ff00;

    for (var i = 0; i < m.length; i += 16) {
      processBlock(H, m, i);
    }

    // Swap endian
    for (var i = 0; i < 5; i++) {
      // Shortcut
      var H_i = H[i];

      // Swap
      H[i] = (H_i << 8 | H_i >>> 24) & 0x00ff00ff | (H_i << 24 | H_i >>> 8) & 0xff00ff00;
    }

    var digestbytes = wordsToBytes(H);
    return new Buffer(digestbytes);
  }
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(292).Buffer))

/***/ },
/* 311 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';

  var createHash = __webpack_require__(298);

  var zeroBuffer = new Buffer(128);
  zeroBuffer.fill(0);

  module.exports = Hmac;

  function Hmac(alg, key) {
    if (!(this instanceof Hmac)) return new Hmac(alg, key);
    this._opad = opad;
    this._alg = alg;

    var blocksize = alg === 'sha512' ? 128 : 64;

    key = this._key = !Buffer.isBuffer(key) ? new Buffer(key) : key;

    if (key.length > blocksize) {
      key = createHash(alg).update(key).digest();
    } else if (key.length < blocksize) {
      key = Buffer.concat([key, zeroBuffer], blocksize);
    }

    var ipad = this._ipad = new Buffer(blocksize);
    var opad = this._opad = new Buffer(blocksize);

    for (var i = 0; i < blocksize; i++) {
      ipad[i] = key[i] ^ 0x36;
      opad[i] = key[i] ^ 0x5C;
    }

    this._hash = createHash(alg).update(ipad);
  }

  Hmac.prototype.update = function (data, enc) {
    this._hash.update(data, enc);
    return this;
  };

  Hmac.prototype.digest = function (enc) {
    var h = this._hash.digest();
    return createHash(this._alg).update(this._opad).update(h).digest(enc);
  };
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(292).Buffer))

/***/ },
/* 312 */
/***/ function(module, exports, __webpack_require__) {

  'use strict';

  var pbkdf2Export = __webpack_require__(313);

  module.exports = function (crypto, exports) {
    exports = exports || {};

    var exported = pbkdf2Export(crypto);

    exports.pbkdf2 = exported.pbkdf2;
    exports.pbkdf2Sync = exported.pbkdf2Sync;

    return exports;
  };

/***/ },
/* 313 */
/***/ function(module, exports, __webpack_require__) {

  /* WEBPACK VAR INJECTION */(function(Buffer) {'use strict';

  module.exports = function (crypto) {
    function pbkdf2(password, salt, iterations, keylen, digest, callback) {
      if ('function' === typeof digest) {
        callback = digest;
        digest = undefined;
      }

      if ('function' !== typeof callback) throw new Error('No callback provided to pbkdf2');

      setTimeout(function () {
        var result;

        try {
          result = pbkdf2Sync(password, salt, iterations, keylen, digest);
        } catch (e) {
          return callback(e);
        }

        callback(undefined, result);
      });
    }

    function pbkdf2Sync(password, salt, iterations, keylen, digest) {
      if ('number' !== typeof iterations) throw new TypeError('Iterations not a number');

      if (iterations < 0) throw new TypeError('Bad iterations');

      if ('number' !== typeof keylen) throw new TypeError('Key length not a number');

      if (keylen < 0) throw new TypeError('Bad key length');

      digest = digest || 'sha1';

      if (!Buffer.isBuffer(password)) password = new Buffer(password);
      if (!Buffer.isBuffer(salt)) salt = new Buffer(salt);

      var hLen,
          l = 1,
          r,
          T;
      var DK = new Buffer(keylen);
      var block1 = new Buffer(salt.length + 4);
      salt.copy(block1, 0, 0, salt.length);

      for (var i = 1; i <= l; i++) {
        block1.writeUInt32BE(i, salt.length);

        var U = crypto.createHmac(digest, password).update(block1).digest();

        if (!hLen) {
          hLen = U.length;
          T = new Buffer(hLen);
          l = Math.ceil(keylen / hLen);
          r = keylen - (l - 1) * hLen;

          if (keylen > (Math.pow(2, 32) - 1) * hLen) throw new TypeError('keylen exceeds maximum length');
        }

        U.copy(T, 0, 0, hLen);

        for (var j = 1; j < iterations; j++) {
          U = crypto.createHmac(digest, password).update(U).digest();

          for (var k = 0; k < hLen; k++) {
            T[k] ^= U[k];
          }
        }

        var destPos = (i - 1) * hLen;
        var len = i == l ? r : hLen;
        T.copy(DK, destPos, 0, len);
      }

      return DK;
    }

    return {
      pbkdf2: pbkdf2,
      pbkdf2Sync: pbkdf2Sync
    };
  };
  /* WEBPACK VAR INJECTION */}.call(exports, __webpack_require__(292).Buffer))

/***/ },
/* 314 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = toString;

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  // Helper to transform a literal into an string literal.
  function toString(literal) {
    var restricted = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

    var string = void 0;
    if (literal.isStringLiteral()) {
      return literal.node;
    }

    if (literal.isIdentifier()) {
      string = literal.node.name;
    } else if (literal.isUnaryExpression({ operator: "void" })) {
      string = "undefined";
    } else if (literal.isNullLiteral()) {
      string = "null";
    } else if (literal.isNumericLiteral() || literal.isBooleanLiteral()) {
      string = String(literal.node.value);
    }

    if (restricted && (string === "undefined" || string === "null" || string === "true" || string === "false")) {
      return;
    }

    return t.stringLiteral(string);
  }

/***/ },
/* 315 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.hasSpread = hasSpread;
  exports.toAttrsArray = toAttrsArray;
  exports.toAttrsCalls = toAttrsCalls;

  var _attr = __webpack_require__(316);

  var _attr2 = _interopRequireDefault(_attr);

  var _forOwn = __webpack_require__(317);

  var _forOwn2 = _interopRequireDefault(_forOwn);

  var _toFunctionCall = __webpack_require__(281);

  var _toFunctionCall2 = _interopRequireDefault(_toFunctionCall);

  var _idomMethod = __webpack_require__(286);

  var _idomMethod2 = _interopRequireDefault(_idomMethod);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // Detects if one of the attributes is a JSX Spread Attribute
  function hasSpread(attributes) {
    return attributes.some(function (attr) {
      return attr.isJSXSpreadAttribute();
    });
  }

  // Returns an array of `name`-`value` attribute pairs
  function toAttrsArray(attrs) {
    var pairsArray = [];
    attrs.forEach(function (_ref) {
      var name = _ref.name;
      var value = _ref.value;

      pairsArray.push(name);
      pairsArray.push(value);
    });

    return pairsArray;
  }

  // Returns an array of iDOM `attr` calls
  function toAttrsCalls(attrs, plugin) {
    var attrCall = (0, _idomMethod2.default)("attr", plugin);
    var forOwn = (0, _forOwn2.default)(plugin);
    var forOwnAttr = (0, _attr2.default)(plugin);

    return attrs.map(function (_ref2) {
      var name = _ref2.name;
      var value = _ref2.value;
      var isSpread = _ref2.isSpread;

      if (isSpread) {
        return (0, _toFunctionCall2.default)(forOwn, [value, forOwnAttr]);
      }

      return (0, _toFunctionCall2.default)(attrCall, [name, value]);
    });
  }

/***/ },
/* 316 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = injectAttr;

  var _inject = __webpack_require__(4);

  var _inject2 = _interopRequireDefault(_inject);

  var _toFunctionCall = __webpack_require__(281);

  var _toFunctionCall2 = _interopRequireDefault(_toFunctionCall);

  var _idomMethod = __webpack_require__(286);

  var _idomMethod2 = _interopRequireDefault(_idomMethod);

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // Flip flops the arguments when calling iDOM's
  // `attr`, so that this function may be used
  // as an iterator like an Object#forEach.
  function attrAST(plugin, ref) {
    var name = t.identifier("name");
    var value = t.identifier("value");

    /**
     * function _attr(value, prop) {
     *   attr(prop, value);
     * }
     */
    return t.functionExpression(ref, [value, name], t.blockStatement([t.expressionStatement((0, _toFunctionCall2.default)((0, _idomMethod2.default)("attr", plugin), [name, value]))]));
  }

  function injectAttr(plugin) {
    return (0, _inject2.default)(plugin, "attr", attrAST);
  }

/***/ },
/* 317 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = injectForOwn;

  var _inject = __webpack_require__(4);

  var _inject2 = _interopRequireDefault(_inject);

  var _hasOwn = __webpack_require__(318);

  var _hasOwn2 = _interopRequireDefault(_hasOwn);

  var _toFunctionCall = __webpack_require__(281);

  var _toFunctionCall2 = _interopRequireDefault(_toFunctionCall);

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // Loops over all own properties, calling
  // the specified iterator function with
  // value and prop name.
  // Depends on the _hasOwn helper.
  function forOwnAST(plugin, ref, deps) {
    var hasOwn = deps.hasOwn;
    var object = t.identifier("object");
    var iterator = t.identifier("iterator");
    var prop = t.identifier("prop");

    /**
     * function _forOwn(object, iterator) {
     *   for (var prop in object) {
     *     if (hasOwn.call(object, prop)) {
     *       iterator(object[prop], prop);
     *     }
     *   }
     * }
     */
    return t.functionExpression(ref, [object, iterator], t.blockStatement([t.forInStatement(t.variableDeclaration("var", [t.variableDeclarator(prop)]), object, t.ifStatement((0, _toFunctionCall2.default)(t.memberExpression(hasOwn, t.identifier("call")), [object, prop]), t.expressionStatement((0, _toFunctionCall2.default)(iterator, [t.memberExpression(object, prop, true), prop]))))]));
  }

  function injectForOwn(plugin) {
    return (0, _inject2.default)(plugin, "forOwn", forOwnAST, {
      hasOwn: _hasOwn2.default
    });
  }

/***/ },
/* 318 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = injectHasOwn;

  var _inject = __webpack_require__(4);

  var _inject2 = _interopRequireDefault(_inject);

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // Caches a reference to Object#hasOwnProperty.
  function hasOwnAST() {
    /**
     * var _hasOwn = Object.prototype.hasOwnProperty;
     */
    return t.memberExpression(t.memberExpression(t.identifier("Object"), t.identifier("prototype")), t.identifier("hasOwnProperty"));
  }

  function injectHasOwn(plugin) {
    return (0, _inject2.default)(plugin, "hasOwn", hasOwnAST);
  }

/***/ },
/* 319 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = elementCloseCall;

  var _toFunctionCall = __webpack_require__(281);

  var _toFunctionCall2 = _interopRequireDefault(_toFunctionCall);

  var _toReference = __webpack_require__(5);

  var _toReference2 = _interopRequireDefault(_toReference);

  var _idomMethod = __webpack_require__(286);

  var _idomMethod2 = _interopRequireDefault(_idomMethod);

  var _isComponent = __webpack_require__(287);

  var _isComponent2 = _interopRequireDefault(_isComponent);

  var _attributes = __webpack_require__(315);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // Returns the closing element's function call.
  function elementCloseCall(path, plugin) {
    var node = path.node;

    // Self closing elements that do not contain a SpreadAttribute will use `elementVoid`,
    // so the closing `elementClose` is not needed.
    if (node.selfClosing && !(0, _attributes.hasSpread)(path.get("attributes"))) {
      return null;
    }

    var name = path.get("name");
    var useReference = (0, _isComponent2.default)(name, plugin);
    return (0, _toFunctionCall2.default)((0, _idomMethod2.default)("elementClose", plugin), [(0, _toReference2.default)(name.node, useReference)]);
  }

/***/ },
/* 320 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = buildChildren;

  var _cleanText = __webpack_require__(321);

  var _cleanText2 = _interopRequireDefault(_cleanText);

  var _toFunctionCall = __webpack_require__(281);

  var _toFunctionCall2 = _interopRequireDefault(_toFunctionCall);

  var _renderArbitrary = __webpack_require__(322);

  var _renderArbitrary2 = _interopRequireDefault(_renderArbitrary);

  var _idomMethod = __webpack_require__(286);

  var _idomMethod2 = _interopRequireDefault(_idomMethod);

  var _isLiteralOrSpecial = __webpack_require__(278);

  var _isLiteralOrSpecial2 = _interopRequireDefault(_isLiteralOrSpecial);

  var _toString = __webpack_require__(314);

  var _toString2 = _interopRequireDefault(_toString);

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // Transforms the children into an array of iDOM function calls
  function buildChildren(children, plugin) {
    var renderArbitraryRef = void 0;
    var replacedElements = plugin.replacedElements;


    children = children.reduce(function (children, child) {
      var wasInExpressionContainer = child.isJSXExpressionContainer();
      if (wasInExpressionContainer) {
        child = child.get("expression");
      }

      if (child.isJSXEmptyExpression()) {
        return children;
      }

      var node = child.node;

      if (child.isJSXText() || (0, _isLiteralOrSpecial2.default)(child)) {
        var value = void 0;

        // Clean up the text, so we don't have to have multiple TEXT nodes.
        if (child.isJSXText()) {
          value = (0, _cleanText2.default)(child);
        } else {
          value = (0, _toString2.default)(child, true);
        }

        // Only strings and numbers will print, anything else is skipped.
        if (!value) {
          return children;
        }

        node = (0, _toFunctionCall2.default)((0, _idomMethod2.default)("text", plugin), [value]);
      } else if (wasInExpressionContainer && !replacedElements.has(node)) {
        // Arbitrary expressions, e.g. variables, need to be inspected at runtime
        // to determine how to render them.
        renderArbitraryRef = renderArbitraryRef || (0, _renderArbitrary2.default)(plugin);

        node = (0, _toFunctionCall2.default)(renderArbitraryRef, [node]);
      }

      children.push(node);
      return children;
    }, []);

    return children;
  }

/***/ },
/* 321 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = cleanText;

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  var nonWhitespace = /\S/;
  var whitespace = /\s+/g;

  // Cleans the whitespace from a text node.
  function cleanText(jsxText) {
    var text = jsxText.node.value;
    if (!nonWhitespace.test(text)) {
      return "";
    }

    return t.stringLiteral(text.replace(whitespace, " "));
  }

/***/ },
/* 322 */
/***/ function(module, exports, __webpack_require__) {

  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.default = injectRenderArbitrary;

  var _inject = __webpack_require__(4);

  var _inject2 = _interopRequireDefault(_inject);

  var _forOwn = __webpack_require__(317);

  var _forOwn2 = _interopRequireDefault(_forOwn);

  var _toFunctionCall = __webpack_require__(281);

  var _toFunctionCall2 = _interopRequireDefault(_toFunctionCall);

  var _idomMethod = __webpack_require__(286);

  var _idomMethod2 = _interopRequireDefault(_idomMethod);

  var _babelTypes = __webpack_require__(6);

  var t = _interopRequireWildcard(_babelTypes);

  function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

  function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

  // Isolated AST code to determine if a value is textual
  // (strings and numbers).
  function isTextual(type, value) {
    return t.logicalExpression("||", t.binaryExpression("===", type, t.stringLiteral("number")), t.logicalExpression("||", t.binaryExpression("===", type, t.stringLiteral("string")), t.logicalExpression("&&", t.binaryExpression("===", type, t.stringLiteral("object")), t.binaryExpression("instanceof", value, t.identifier("String")))));
  }

  // Isolated AST code to determine if a value is a wrapped
  // DOM closure.
  function isDOMWrapper(type, value) {
    return t.logicalExpression("&&", t.binaryExpression("===", type, t.stringLiteral("function")), t.memberExpression(value, t.identifier("__jsxDOMWrapper")));
  }

  // Isolated AST code to determine if a value an Array.
  function isArray(value) {
    return (0, _toFunctionCall2.default)(t.memberExpression(t.identifier("Array"), t.identifier("isArray")), [value]);
  }

  // Isolated AST code to determine if a value an Object.
  function isObject(type, value) {
    return t.logicalExpression("&&", t.binaryExpression("===", type, t.stringLiteral("object")), t.binaryExpression("===", (0, _toFunctionCall2.default)(t.identifier("String"), [value]), t.stringLiteral("[object Object]")));
  }

  // Renders an arbitrary JSX Expression into the DOM.
  // Valid types are strings, numbers, and DOM closures.
  // It may also be an Array or Object, which will be iterated
  // recursively to find a valid type.
  // Depends on the _forOwn helper.
  function renderArbitraryAST(plugin, ref, deps) {
    var forOwn = deps.forOwn;
    var child = t.identifier("child");
    var type = t.identifier("type");
    var forEach = t.memberExpression(child, t.identifier("forEach"));

    /**
     * function _renderArbitrary(child) {
     *   var type = typeof child;
     *   if (type === "number" || (type === string || type === 'object' && child instanceof String)) {
     *     text(child);
     *   } else if (type === "function" && child.__jsxDOMWrapper) {
     *     child();
     *   } else if (Array.isArray(child)) {
     *     child.forEach(_renderArbitrary);
     *   } else if (type === 'object' && String(child) === '[object Object]') {
     *     _forOwn(child, _renderArbitrary);
     *   }
     * }
     */
    return t.functionExpression(ref, [child], t.blockStatement([t.variableDeclaration("var", [t.variableDeclarator(type, t.unaryExpression("typeof", child))]), t.IfStatement(isTextual(type, child), t.blockStatement([t.expressionStatement((0, _toFunctionCall2.default)((0, _idomMethod2.default)("text", plugin), [child]))]), t.ifStatement(isDOMWrapper(type, child), t.blockStatement([t.expressionStatement((0, _toFunctionCall2.default)(child, []))]), t.ifStatement(isArray(child), t.blockStatement([t.expressionStatement((0, _toFunctionCall2.default)(forEach, [ref]))]), t.ifStatement(isObject(type, child), t.blockStatement([t.expressionStatement((0, _toFunctionCall2.default)(forOwn, [child, ref]))])))))]));
  }

  function injectRenderArbitrary(plugin) {
    return (0, _inject2.default)(plugin, "renderArbitrary", renderArbitraryAST, {
      forOwn: _forOwn2.default
    });
  }

/***/ },
/* 323 */
/***/ function(module, exports) {

  "use strict";

  exports.__esModule = true;

  exports.default = function () {
    return {
      manipulateOptions: function manipulateOptions(opts, parserOpts) {
        parserOpts.plugins.push("jsx");
      }
    };
  };

  module.exports = exports["default"];

/***/ }
/******/ ]);