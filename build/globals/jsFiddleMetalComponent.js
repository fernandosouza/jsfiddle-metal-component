(function() {
this.metal = this.metal || {};
this.metalNamed = this.metalNamed || {};
var babelHelpers = {};
babelHelpers.typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

babelHelpers.classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

babelHelpers.createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

babelHelpers.defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

babelHelpers.get = function get(object, property, receiver) {
  if (object === null) object = Function.prototype;
  var desc = Object.getOwnPropertyDescriptor(object, property);

  if (desc === undefined) {
    var parent = Object.getPrototypeOf(object);

    if (parent === null) {
      return undefined;
    } else {
      return get(parent, property, receiver);
    }
  } else if ("value" in desc) {
    return desc.value;
  } else {
    var getter = desc.get;

    if (getter === undefined) {
      return undefined;
    }

    return getter.call(receiver);
  }
};

babelHelpers.inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

babelHelpers.possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

babelHelpers.toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

babelHelpers;
'use strict';

(function () {
  /* jshint ignore:start */

  /**
   * @license
   * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
   *
   * Licensed under the Apache License, Version 2.0 (the "License");
   * you may not use this file except in compliance with the License.
   * You may obtain a copy of the License at
   *
   *      http://www.apache.org/licenses/LICENSE-2.0
   *
   * Unless required by applicable law or agreed to in writing, software
   * distributed under the License is distributed on an "AS-IS" BASIS,
   * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   * See the License for the specific language governing permissions and
   * limitations under the License.
   */

  (function (global, factory) {
    factory(global.IncrementalDOM = global.IncrementalDOM || {});
  })(window, function (exports) {
    'use strict';

    /**
     * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    /**
     * A cached reference to the hasOwnProperty function.
     */

    var hasOwnProperty = Object.prototype.hasOwnProperty;

    /**
     * A constructor function that will create blank objects.
     * @constructor
     */
    function Blank() {}

    Blank.prototype = Object.create(null);

    /**
     * Used to prevent property collisions between our "map" and its prototype.
     * @param {!Object<string, *>} map The map to check.
     * @param {string} property The property to check.
     * @return {boolean} Whether map has property.
     */
    var has = function has(map, property) {
      return hasOwnProperty.call(map, property);
    };

    /**
     * Creates an map object without a prototype.
     * @return {!Object}
     */
    var createMap = function createMap() {
      return new Blank();
    };

    /**
     * The property name where we store Incremental DOM data.
     */
    var DATA_PROP = '__incrementalDOMData';

    /**
     * Keeps track of information needed to perform diffs for a given DOM node.
     * @param {!string} nodeName
     * @param {?string=} key
     * @constructor
     */
    function NodeData(nodeName, key) {
      /**
       * The attributes and their values.
       * @const {!Object<string, *>}
       */
      this.attrs = createMap();

      /**
       * An array of attribute name/value pairs, used for quickly diffing the
       * incomming attributes to see if the DOM node's attributes need to be
       * updated.
       * @const {Array<*>}
       */
      this.attrsArr = [];

      /**
       * The incoming attributes for this Node, before they are updated.
       * @const {!Object<string, *>}
       */
      this.newAttrs = createMap();

      /**
       * Whether or not the statics have been applied for the node yet.
       * {boolean}
       */
      this.staticsApplied = false;

      /**
       * The key used to identify this node, used to preserve DOM nodes when they
       * move within their parent.
       * @const
       */
      this.key = key;

      /**
       * Keeps track of children within this node by their key.
       * {!Object<string, !Element>}
       */
      this.keyMap = createMap();

      /**
       * Whether or not the keyMap is currently valid.
       * @type {boolean}
       */
      this.keyMapValid = true;

      /**
       * Whether or the associated node is, or contains, a focused Element.
       * @type {boolean}
       */
      this.focused = false;

      /**
       * The node name for this node.
       * @const {string}
       */
      this.nodeName = nodeName;

      /**
       * @type {?string}
       */
      this.text = null;
    }

    /**
     * Initializes a NodeData object for a Node.
     *
     * @param {Node} node The node to initialize data for.
     * @param {string} nodeName The node name of node.
     * @param {?string=} key The key that identifies the node.
     * @return {!NodeData} The newly initialized data object
     */
    var initData = function initData(node, nodeName, key) {
      var data = new NodeData(nodeName, key);
      node[DATA_PROP] = data;
      return data;
    };

    /**
     * Retrieves the NodeData object for a Node, creating it if necessary.
     *
     * @param {?Node} node The Node to retrieve the data for.
     * @return {!NodeData} The NodeData for this Node.
     */
    var getData = function getData(node) {
      importNode(node);
      return node[DATA_PROP];
    };

    /**
     * Imports node and its subtree, initializing caches.
     *
     * @param {?Node} node The Node to import.
     */
    var importNode = function importNode(node) {
      if (node[DATA_PROP]) {
        return;
      }

      var isElement = node instanceof Element;
      var nodeName = isElement ? node.localName : node.nodeName;
      var key = isElement ? node.getAttribute('key') : null;
      var data = initData(node, nodeName, key);

      if (key) {
        getData(node.parentNode).keyMap[key] = node;
      }

      if (isElement) {
        var attributes = node.attributes;
        var attrs = data.attrs;
        var newAttrs = data.newAttrs;
        var attrsArr = data.attrsArr;

        for (var i = 0; i < attributes.length; i += 1) {
          var attr = attributes[i];
          var name = attr.name;
          var value = attr.value;

          attrs[name] = value;
          newAttrs[name] = undefined;
          attrsArr.push(name);
          attrsArr.push(value);
        }
      }

      for (var child = node.firstChild; child; child = child.nextSibling) {
        importNode(child);
      }
    };

    /**
     * Gets the namespace to create an element (of a given tag) in.
     * @param {string} tag The tag to get the namespace for.
     * @param {?Node} parent
     * @return {?string} The namespace to create the tag in.
     */
    var getNamespaceForTag = function getNamespaceForTag(tag, parent) {
      if (tag === 'svg') {
        return 'http://www.w3.org/2000/svg';
      }

      if (getData(parent).nodeName === 'foreignObject') {
        return null;
      }

      return parent.namespaceURI;
    };

    /**
     * Creates an Element.
     * @param {Document} doc The document with which to create the Element.
     * @param {?Node} parent
     * @param {string} tag The tag for the Element.
     * @param {?string=} key A key to identify the Element.
     * @return {!Element}
     */
    var createElement = function createElement(doc, parent, tag, key) {
      var namespace = getNamespaceForTag(tag, parent);
      var el = undefined;

      if (namespace) {
        el = doc.createElementNS(namespace, tag);
      } else {
        el = doc.createElement(tag);
      }

      initData(el, tag, key);

      return el;
    };

    /**
     * Creates a Text Node.
     * @param {Document} doc The document with which to create the Element.
     * @return {!Text}
     */
    var createText = function createText(doc) {
      var node = doc.createTextNode('');
      initData(node, '#text', null);
      return node;
    };

    /**
     * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    /** @const */
    var notifications = {
      /**
       * Called after patch has compleated with any Nodes that have been created
       * and added to the DOM.
       * @type {?function(Array<!Node>)}
       */
      nodesCreated: null,

      /**
       * Called after patch has compleated with any Nodes that have been removed
       * from the DOM.
       * Note it's an applications responsibility to handle any childNodes.
       * @type {?function(Array<!Node>)}
       */
      nodesDeleted: null
    };

    /**
     * Keeps track of the state of a patch.
     * @constructor
     */
    function Context() {
      /**
       * @type {(Array<!Node>|undefined)}
       */
      this.created = notifications.nodesCreated && [];

      /**
       * @type {(Array<!Node>|undefined)}
       */
      this.deleted = notifications.nodesDeleted && [];
    }

    /**
     * @param {!Node} node
     */
    Context.prototype.markCreated = function (node) {
      if (this.created) {
        this.created.push(node);
      }
    };

    /**
     * @param {!Node} node
     */
    Context.prototype.markDeleted = function (node) {
      if (this.deleted) {
        this.deleted.push(node);
      }
    };

    /**
     * Notifies about nodes that were created during the patch opearation.
     */
    Context.prototype.notifyChanges = function () {
      if (this.created && this.created.length > 0) {
        notifications.nodesCreated(this.created);
      }

      if (this.deleted && this.deleted.length > 0) {
        notifications.nodesDeleted(this.deleted);
      }
    };

    /**
     * Copyright 2016 The Incremental DOM Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    /**
     * @param {!Node} node
     * @return {boolean} True if the node the root of a document, false otherwise.
     */
    var isDocumentRoot = function isDocumentRoot(node) {
      // For ShadowRoots, check if they are a DocumentFragment instead of if they
      // are a ShadowRoot so that this can work in 'use strict' if ShadowRoots are
      // not supported.
      return node instanceof Document || node instanceof DocumentFragment;
    };

    /**
     * @param {!Node} node The node to start at, inclusive.
     * @param {?Node} root The root ancestor to get until, exclusive.
     * @return {!Array<!Node>} The ancestry of DOM nodes.
     */
    var getAncestry = function getAncestry(node, root) {
      var ancestry = [];
      var cur = node;

      while (cur !== root) {
        ancestry.push(cur);
        cur = cur.parentNode;
      }

      return ancestry;
    };

    /**
     * @param {!Node} node
     * @return {!Node} The root node of the DOM tree that contains node.
     */
    var getRoot = function getRoot(node) {
      var cur = node;
      var prev = cur;

      while (cur) {
        prev = cur;
        cur = cur.parentNode;
      }

      return prev;
    };

    /**
     * @param {!Node} node The node to get the activeElement for.
     * @return {?Element} The activeElement in the Document or ShadowRoot
     *     corresponding to node, if present.
     */
    var getActiveElement = function getActiveElement(node) {
      var root = getRoot(node);
      return isDocumentRoot(root) ? root.activeElement : null;
    };

    /**
     * Gets the path of nodes that contain the focused node in the same document as
     * a reference node, up until the root.
     * @param {!Node} node The reference node to get the activeElement for.
     * @param {?Node} root The root to get the focused path until.
     * @return {!Array<Node>}
     */
    var getFocusedPath = function getFocusedPath(node, root) {
      var activeElement = getActiveElement(node);

      if (!activeElement || !node.contains(activeElement)) {
        return [];
      }

      return getAncestry(activeElement, root);
    };

    /**
     * Like insertBefore, but instead instead of moving the desired node, instead
     * moves all the other nodes after.
     * @param {?Node} parentNode
     * @param {!Node} node
     * @param {?Node} referenceNode
     */
    var moveBefore = function moveBefore(parentNode, node, referenceNode) {
      var insertReferenceNode = node.nextSibling;
      var cur = referenceNode;

      while (cur !== node) {
        var next = cur.nextSibling;
        parentNode.insertBefore(cur, insertReferenceNode);
        cur = next;
      }
    };

    /** @type {?Context} */
    var context = null;

    /** @type {?Node} */
    var currentNode = null;

    /** @type {?Node} */
    var currentParent = null;

    /** @type {?Document} */
    var doc = null;

    /**
     * @param {!Array<Node>} focusPath The nodes to mark.
     * @param {boolean} focused Whether or not they are focused.
     */
    var markFocused = function markFocused(focusPath, focused) {
      for (var i = 0; i < focusPath.length; i += 1) {
        getData(focusPath[i]).focused = focused;
      }
    };

    /**
     * Returns a patcher function that sets up and restores a patch context,
     * running the run function with the provided data.
     * @param {function((!Element|!DocumentFragment),!function(T),T=): ?Node} run
     * @return {function((!Element|!DocumentFragment),!function(T),T=): ?Node}
     * @template T
     */
    var patchFactory = function patchFactory(run) {
      /**
       * TODO(moz): These annotations won't be necessary once we switch to Closure
       * Compiler's new type inference. Remove these once the switch is done.
       *
       * @param {(!Element|!DocumentFragment)} node
       * @param {!function(T)} fn
       * @param {T=} data
       * @return {?Node} node
       * @template T
       */
      var f = function f(node, fn, data) {
        var prevContext = context;
        var prevDoc = doc;
        var prevCurrentNode = currentNode;
        var prevCurrentParent = currentParent;
        var previousInAttributes = false;
        var previousInSkip = false;

        context = new Context();
        doc = node.ownerDocument;
        currentParent = node.parentNode;

        if ('production' !== 'production') {}

        var focusPath = getFocusedPath(node, currentParent);
        markFocused(focusPath, true);
        var retVal = run(node, fn, data);
        markFocused(focusPath, false);

        if ('production' !== 'production') {}

        context.notifyChanges();

        context = prevContext;
        doc = prevDoc;
        currentNode = prevCurrentNode;
        currentParent = prevCurrentParent;

        return retVal;
      };
      return f;
    };

    /**
     * Patches the document starting at node with the provided function. This
     * function may be called during an existing patch operation.
     * @param {!Element|!DocumentFragment} node The Element or Document
     *     to patch.
     * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
     *     calls that describe the DOM.
     * @param {T=} data An argument passed to fn to represent DOM state.
     * @return {!Node} The patched node.
     * @template T
     */
    var patchInner = patchFactory(function (node, fn, data) {
      currentNode = node;

      enterNode();
      fn(data);
      exitNode();

      if ('production' !== 'production') {}

      return node;
    });

    /**
     * Patches an Element with the the provided function. Exactly one top level
     * element call should be made corresponding to `node`.
     * @param {!Element} node The Element where the patch should start.
     * @param {!function(T)} fn A function containing elementOpen/elementClose/etc.
     *     calls that describe the DOM. This should have at most one top level
     *     element call.
     * @param {T=} data An argument passed to fn to represent DOM state.
     * @return {?Node} The node if it was updated, its replacedment or null if it
     *     was removed.
     * @template T
     */
    var patchOuter = patchFactory(function (node, fn, data) {
      var startNode = /** @type {!Element} */{ nextSibling: node };
      var expectedNextNode = null;
      var expectedPrevNode = null;

      if ('production' !== 'production') {}

      currentNode = startNode;
      fn(data);

      if ('production' !== 'production') {}

      if (node !== currentNode && node.parentNode) {
        removeChild(currentParent, node, getData(currentParent).keyMap);
      }

      return startNode === currentNode ? null : currentNode;
    });

    /**
     * Checks whether or not the current node matches the specified nodeName and
     * key.
     *
     * @param {!Node} matchNode A node to match the data to.
     * @param {?string} nodeName The nodeName for this node.
     * @param {?string=} key An optional key that identifies a node.
     * @return {boolean} True if the node matches, false otherwise.
     */
    var matches = function matches(matchNode, nodeName, key) {
      var data = getData(matchNode);

      // Key check is done using double equals as we want to treat a null key the
      // same as undefined. This should be okay as the only values allowed are
      // strings, null and undefined so the == semantics are not too weird.
      return nodeName === data.nodeName && key == data.key;
    };

    /**
     * Aligns the virtual Element definition with the actual DOM, moving the
     * corresponding DOM node to the correct location or creating it if necessary.
     * @param {string} nodeName For an Element, this should be a valid tag string.
     *     For a Text, this should be #text.
     * @param {?string=} key The key used to identify this element.
     */
    var alignWithDOM = function alignWithDOM(nodeName, key) {
      if (currentNode && matches(currentNode, nodeName, key)) {
        return;
      }

      var parentData = getData(currentParent);
      var currentNodeData = currentNode && getData(currentNode);
      var keyMap = parentData.keyMap;
      var node = undefined;

      // Check to see if the node has moved within the parent.
      if (key) {
        var keyNode = keyMap[key];
        if (keyNode) {
          if (matches(keyNode, nodeName, key)) {
            node = keyNode;
          } else if (keyNode === currentNode) {
            context.markDeleted(keyNode);
          } else {
            removeChild(currentParent, keyNode, keyMap);
          }
        }
      }

      // Create the node if it doesn't exist.
      if (!node) {
        if (nodeName === '#text') {
          node = createText(doc);
        } else {
          node = createElement(doc, currentParent, nodeName, key);
        }

        if (key) {
          keyMap[key] = node;
        }

        context.markCreated(node);
      }

      // Re-order the node into the right position, preserving focus if either
      // node or currentNode are focused by making sure that they are not detached
      // from the DOM.
      if (getData(node).focused) {
        // Move everything else before the node.
        moveBefore(currentParent, node, currentNode);
      } else if (currentNodeData && currentNodeData.key && !currentNodeData.focused) {
        // Remove the currentNode, which can always be added back since we hold a
        // reference through the keyMap. This prevents a large number of moves when
        // a keyed item is removed or moved backwards in the DOM.
        currentParent.replaceChild(node, currentNode);
        parentData.keyMapValid = false;
      } else {
        currentParent.insertBefore(node, currentNode);
      }

      currentNode = node;
    };

    /**
     * @param {?Node} node
     * @param {?Node} child
     * @param {?Object<string, !Element>} keyMap
     */
    var removeChild = function removeChild(node, child, keyMap) {
      node.removeChild(child);
      context.markDeleted( /** @type {!Node}*/child);

      var key = getData(child).key;
      if (key) {
        delete keyMap[key];
      }
    };

    /**
     * Clears out any unvisited Nodes, as the corresponding virtual element
     * functions were never called for them.
     */
    var clearUnvisitedDOM = function clearUnvisitedDOM() {
      var node = currentParent;
      var data = getData(node);
      var keyMap = data.keyMap;
      var keyMapValid = data.keyMapValid;
      var child = node.lastChild;
      var key = undefined;

      if (child === currentNode && keyMapValid) {
        return;
      }

      while (child !== currentNode) {
        removeChild(node, child, keyMap);
        child = node.lastChild;
      }

      // Clean the keyMap, removing any unusued keys.
      if (!keyMapValid) {
        for (key in keyMap) {
          child = keyMap[key];
          if (child.parentNode !== node) {
            context.markDeleted(child);
            delete keyMap[key];
          }
        }

        data.keyMapValid = true;
      }
    };

    /**
     * Changes to the first child of the current node.
     */
    var enterNode = function enterNode() {
      currentParent = currentNode;
      currentNode = null;
    };

    /**
     * @return {?Node} The next Node to be patched.
     */
    var getNextNode = function getNextNode() {
      if (currentNode) {
        return currentNode.nextSibling;
      } else {
        return currentParent.firstChild;
      }
    };

    /**
     * Changes to the next sibling of the current node.
     */
    var nextNode = function nextNode() {
      currentNode = getNextNode();
    };

    /**
     * Changes to the parent of the current node, removing any unvisited children.
     */
    var exitNode = function exitNode() {
      clearUnvisitedDOM();

      currentNode = currentParent;
      currentParent = currentParent.parentNode;
    };

    /**
     * Makes sure that the current node is an Element with a matching tagName and
     * key.
     *
     * @param {string} tag The element's tag.
     * @param {?string=} key The key used to identify this element. This can be an
     *     empty string, but performance may be better if a unique value is used
     *     when iterating over an array of items.
     * @return {!Element} The corresponding Element.
     */
    var coreElementOpen = function coreElementOpen(tag, key) {
      nextNode();
      alignWithDOM(tag, key);
      enterNode();
      return (/** @type {!Element} */currentParent
      );
    };

    /**
     * Closes the currently open Element, removing any unvisited children if
     * necessary.
     *
     * @return {!Element} The corresponding Element.
     */
    var coreElementClose = function coreElementClose() {
      if ('production' !== 'production') {}

      exitNode();
      return (/** @type {!Element} */currentNode
      );
    };

    /**
     * Makes sure the current node is a Text node and creates a Text node if it is
     * not.
     *
     * @return {!Text} The corresponding Text Node.
     */
    var coreText = function coreText() {
      nextNode();
      alignWithDOM('#text', null);
      return (/** @type {!Text} */currentNode
      );
    };

    /**
     * Gets the current Element being patched.
     * @return {!Element}
     */
    var currentElement = function currentElement() {
      if ('production' !== 'production') {}
      return (/** @type {!Element} */currentParent
      );
    };

    /**
     * @return {Node} The Node that will be evaluated for the next instruction.
     */
    var currentPointer = function currentPointer() {
      if ('production' !== 'production') {}
      return getNextNode();
    };

    /**
     * Skips the children in a subtree, allowing an Element to be closed without
     * clearing out the children.
     */
    var skip = function skip() {
      if ('production' !== 'production') {}
      currentNode = currentParent.lastChild;
    };

    /**
     * Skips the next Node to be patched, moving the pointer forward to the next
     * sibling of the current pointer.
     */
    var skipNode = nextNode;

    /**
     * Copyright 2015 The Incremental DOM Authors. All Rights Reserved.
     *
     * Licensed under the Apache License, Version 2.0 (the "License");
     * you may not use this file except in compliance with the License.
     * You may obtain a copy of the License at
     *
     *      http://www.apache.org/licenses/LICENSE-2.0
     *
     * Unless required by applicable law or agreed to in writing, software
     * distributed under the License is distributed on an "AS-IS" BASIS,
     * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
     * See the License for the specific language governing permissions and
     * limitations under the License.
     */

    /** @const */
    var symbols = {
      default: '__default'
    };

    /**
     * @param {string} name
     * @return {string|undefined} The namespace to use for the attribute.
     */
    var getNamespace = function getNamespace(name) {
      if (name.lastIndexOf('xml:', 0) === 0) {
        return 'http://www.w3.org/XML/1998/namespace';
      }

      if (name.lastIndexOf('xlink:', 0) === 0) {
        return 'http://www.w3.org/1999/xlink';
      }
    };

    /**
     * Applies an attribute or property to a given Element. If the value is null
     * or undefined, it is removed from the Element. Otherwise, the value is set
     * as an attribute.
     * @param {!Element} el
     * @param {string} name The attribute's name.
     * @param {?(boolean|number|string)=} value The attribute's value.
     */
    var applyAttr = function applyAttr(el, name, value) {
      if (value == null) {
        el.removeAttribute(name);
      } else {
        var attrNS = getNamespace(name);
        if (attrNS) {
          el.setAttributeNS(attrNS, name, value);
        } else {
          el.setAttribute(name, value);
        }
      }
    };

    /**
     * Applies a property to a given Element.
     * @param {!Element} el
     * @param {string} name The property's name.
     * @param {*} value The property's value.
     */
    var applyProp = function applyProp(el, name, value) {
      el[name] = value;
    };

    /**
     * Applies a value to a style declaration. Supports CSS custom properties by
     * setting properties containing a dash using CSSStyleDeclaration.setProperty.
     * @param {CSSStyleDeclaration} style
     * @param {!string} prop
     * @param {*} value
     */
    var setStyleValue = function setStyleValue(style, prop, value) {
      if (prop.indexOf('-') >= 0) {
        style.setProperty(prop, /** @type {string} */value);
      } else {
        style[prop] = value;
      }
    };

    /**
     * Applies a style to an Element. No vendor prefix expansion is done for
     * property names/values.
     * @param {!Element} el
     * @param {string} name The attribute's name.
     * @param {*} style The style to set. Either a string of css or an object
     *     containing property-value pairs.
     */
    var applyStyle = function applyStyle(el, name, style) {
      if (typeof style === 'string') {
        el.style.cssText = style;
      } else {
        el.style.cssText = '';
        var elStyle = el.style;
        var obj = /** @type {!Object<string,string>} */style;

        for (var prop in obj) {
          if (has(obj, prop)) {
            setStyleValue(elStyle, prop, obj[prop]);
          }
        }
      }
    };

    /**
     * Updates a single attribute on an Element.
     * @param {!Element} el
     * @param {string} name The attribute's name.
     * @param {*} value The attribute's value. If the value is an object or
     *     function it is set on the Element, otherwise, it is set as an HTML
     *     attribute.
     */
    var applyAttributeTyped = function applyAttributeTyped(el, name, value) {
      var type = typeof value === 'undefined' ? 'undefined' : babelHelpers.typeof(value);

      if (type === 'object' || type === 'function') {
        applyProp(el, name, value);
      } else {
        applyAttr(el, name, /** @type {?(boolean|number|string)} */value);
      }
    };

    /**
     * Calls the appropriate attribute mutator for this attribute.
     * @param {!Element} el
     * @param {string} name The attribute's name.
     * @param {*} value The attribute's value.
     */
    var updateAttribute = function updateAttribute(el, name, value) {
      var data = getData(el);
      var attrs = data.attrs;

      if (attrs[name] === value) {
        return;
      }

      var mutator = attributes[name] || attributes[symbols.default];
      mutator(el, name, value);

      attrs[name] = value;
    };

    /**
     * A publicly mutable object to provide custom mutators for attributes.
     * @const {!Object<string, function(!Element, string, *)>}
     */
    var attributes = createMap();

    // Special generic mutator that's called for any attribute that does not
    // have a specific mutator.
    attributes[symbols.default] = applyAttributeTyped;

    attributes['style'] = applyStyle;

    /**
     * The offset in the virtual element declaration where the attributes are
     * specified.
     * @const
     */
    var ATTRIBUTES_OFFSET = 3;

    /**
     * Builds an array of arguments for use with elementOpenStart, attr and
     * elementOpenEnd.
     * @const {Array<*>}
     */
    var argsBuilder = [];

    /**
     * @param {string} tag The element's tag.
     * @param {?string=} key The key used to identify this element. This can be an
     *     empty string, but performance may be better if a unique value is used
     *     when iterating over an array of items.
     * @param {?Array<*>=} statics An array of attribute name/value pairs of the
     *     static attributes for the Element. These will only be set once when the
     *     Element is created.
     * @param {...*} var_args, Attribute name/value pairs of the dynamic attributes
     *     for the Element.
     * @return {!Element} The corresponding Element.
     */
    var elementOpen = function elementOpen(tag, key, statics, var_args) {
      if ('production' !== 'production') {}

      var node = coreElementOpen(tag, key);
      var data = getData(node);

      if (!data.staticsApplied) {
        if (statics) {
          for (var _i = 0; _i < statics.length; _i += 2) {
            var name = /** @type {string} */statics[_i];
            var value = statics[_i + 1];
            updateAttribute(node, name, value);
          }
        }
        // Down the road, we may want to keep track of the statics array to use it
        // as an additional signal about whether a node matches or not. For now,
        // just use a marker so that we do not reapply statics.
        data.staticsApplied = true;
      }

      /*
       * Checks to see if one or more attributes have changed for a given Element.
       * When no attributes have changed, this is much faster than checking each
       * individual argument. When attributes have changed, the overhead of this is
       * minimal.
       */
      var attrsArr = data.attrsArr;
      var newAttrs = data.newAttrs;
      var isNew = !attrsArr.length;
      var i = ATTRIBUTES_OFFSET;
      var j = 0;

      for (; i < arguments.length; i += 2, j += 2) {
        var _attr = arguments[i];
        if (isNew) {
          attrsArr[j] = _attr;
          newAttrs[_attr] = undefined;
        } else if (attrsArr[j] !== _attr) {
          break;
        }

        var value = arguments[i + 1];
        if (isNew || attrsArr[j + 1] !== value) {
          attrsArr[j + 1] = value;
          updateAttribute(node, _attr, value);
        }
      }

      if (i < arguments.length || j < attrsArr.length) {
        for (; i < arguments.length; i += 1, j += 1) {
          attrsArr[j] = arguments[i];
        }

        if (j < attrsArr.length) {
          attrsArr.length = j;
        }

        /*
         * Actually perform the attribute update.
         */
        for (i = 0; i < attrsArr.length; i += 2) {
          var name = /** @type {string} */attrsArr[i];
          var value = attrsArr[i + 1];
          newAttrs[name] = value;
        }

        for (var _attr2 in newAttrs) {
          updateAttribute(node, _attr2, newAttrs[_attr2]);
          newAttrs[_attr2] = undefined;
        }
      }

      return node;
    };

    /**
     * Declares a virtual Element at the current location in the document. This
     * corresponds to an opening tag and a elementClose tag is required. This is
     * like elementOpen, but the attributes are defined using the attr function
     * rather than being passed as arguments. Must be folllowed by 0 or more calls
     * to attr, then a call to elementOpenEnd.
     * @param {string} tag The element's tag.
     * @param {?string=} key The key used to identify this element. This can be an
     *     empty string, but performance may be better if a unique value is used
     *     when iterating over an array of items.
     * @param {?Array<*>=} statics An array of attribute name/value pairs of the
     *     static attributes for the Element. These will only be set once when the
     *     Element is created.
     */
    var elementOpenStart = function elementOpenStart(tag, key, statics) {
      if ('production' !== 'production') {}

      argsBuilder[0] = tag;
      argsBuilder[1] = key;
      argsBuilder[2] = statics;
    };

    /***
     * Defines a virtual attribute at this point of the DOM. This is only valid
     * when called between elementOpenStart and elementOpenEnd.
     *
     * @param {string} name
     * @param {*} value
     */
    var attr = function attr(name, value) {
      if ('production' !== 'production') {}

      argsBuilder.push(name);
      argsBuilder.push(value);
    };

    /**
     * Closes an open tag started with elementOpenStart.
     * @return {!Element} The corresponding Element.
     */
    var elementOpenEnd = function elementOpenEnd() {
      if ('production' !== 'production') {}

      var node = elementOpen.apply(null, argsBuilder);
      argsBuilder.length = 0;
      return node;
    };

    /**
     * Closes an open virtual Element.
     *
     * @param {string} tag The element's tag.
     * @return {!Element} The corresponding Element.
     */
    var elementClose = function elementClose(tag) {
      if ('production' !== 'production') {}

      var node = coreElementClose();

      if ('production' !== 'production') {}

      return node;
    };

    /**
     * Declares a virtual Element at the current location in the document that has
     * no children.
     * @param {string} tag The element's tag.
     * @param {?string=} key The key used to identify this element. This can be an
     *     empty string, but performance may be better if a unique value is used
     *     when iterating over an array of items.
     * @param {?Array<*>=} statics An array of attribute name/value pairs of the
     *     static attributes for the Element. These will only be set once when the
     *     Element is created.
     * @param {...*} var_args Attribute name/value pairs of the dynamic attributes
     *     for the Element.
     * @return {!Element} The corresponding Element.
     */
    var elementVoid = function elementVoid(tag, key, statics, var_args) {
      elementOpen.apply(null, arguments);
      return elementClose(tag);
    };

    /**
     * Declares a virtual Text at this point in the document.
     *
     * @param {string|number|boolean} value The value of the Text.
     * @param {...(function((string|number|boolean)):string)} var_args
     *     Functions to format the value which are called only when the value has
     *     changed.
     * @return {!Text} The corresponding text node.
     */
    var text = function text(value, var_args) {
      if ('production' !== 'production') {}

      var node = coreText();
      var data = getData(node);

      if (data.text !== value) {
        data.text = /** @type {string} */value;

        var formatted = value;
        for (var i = 1; i < arguments.length; i += 1) {
          /*
           * Call the formatter function directly to prevent leaking arguments.
           * https://github.com/google/incremental-dom/pull/204#issuecomment-178223574
           */
          var fn = arguments[i];
          formatted = fn(formatted);
        }

        node.data = formatted;
      }

      return node;
    };

    exports.patch = patchInner;
    exports.patchInner = patchInner;
    exports.patchOuter = patchOuter;
    exports.currentElement = currentElement;
    exports.currentPointer = currentPointer;
    exports.skip = skip;
    exports.skipNode = skipNode;
    exports.elementVoid = elementVoid;
    exports.elementOpenStart = elementOpenStart;
    exports.elementOpenEnd = elementOpenEnd;
    exports.elementOpen = elementOpen;
    exports.elementClose = elementClose;
    exports.text = text;
    exports.attr = attr;
    exports.symbols = symbols;
    exports.attributes = attributes;
    exports.applyAttr = applyAttr;
    exports.applyProp = applyProp;
    exports.notifications = notifications;
    exports.importNode = importNode;
  });

  /* jshint ignore:end */
}).call(this);
'use strict';

/**
 * A collection of core utility functions.
 * @const
 */

(function () {
  var compatibilityModeData_ = void 0;

  /**
   * Counter for unique id.
   * @type {Number}
   * @private
   */
  var uniqueIdCounter_ = 1;

  /**
   * Unique id property prefix.
   * @type {String}
   * @protected
   */
  var UID_PROPERTY = 'core_' + (Math.random() * 1e9 >>> 0);

  this['metalNamed']['coreNamed'] = this['metalNamed']['coreNamed'] || {};
  this['metalNamed']['coreNamed']['UID_PROPERTY'] = UID_PROPERTY; /**
                                                                   * When defining a class Foo with an abstract method bar(), you can do:
                                                                   * Foo.prototype.bar = abstractMethod
                                                                   *
                                                                   * Now if a subclass of Foo fails to override bar(), an error will be thrown
                                                                   * when bar() is invoked.
                                                                   *
                                                                   * @type {!Function}
                                                                   * @throws {Error} when invoked to indicate the method should be overridden.
                                                                   */

  function abstractMethod() {
    throw Error('Unimplemented abstract method');
  }

  this['metalNamed']['coreNamed']['abstractMethod'] = abstractMethod; /**
                                                                       * Loops constructor super classes collecting its properties values. If
                                                                       * property is not available on the super class `undefined` will be
                                                                       * collected as value for the class hierarchy position.
                                                                       * @param {!function()} constructor Class constructor.
                                                                       * @param {string} propertyName Property name to be collected.
                                                                       * @return {Array.<*>} Array of collected values.
                                                                       * TODO(*): Rethink superclass loop.
                                                                       */

  function collectSuperClassesProperty(constructor, propertyName) {
    var propertyValues = [constructor[propertyName]];
    while (constructor.__proto__ && !constructor.__proto__.isPrototypeOf(Function)) {
      constructor = constructor.__proto__;
      propertyValues.push(constructor[propertyName]);
    }
    return propertyValues;
  }

  this['metalNamed']['coreNamed']['collectSuperClassesProperty'] = collectSuperClassesProperty; /**
                                                                                                 * Disables Metal.js's compatibility mode.
                                                                                                 */

  function disableCompatibilityMode() {
    compatibilityModeData_ = null;
  }

  this['metalNamed']['coreNamed']['disableCompatibilityMode'] = disableCompatibilityMode; /**
                                                                                           * Enables Metal.js's compatibility mode with the following features from rc
                                                                                           * and 1.x versions:
                                                                                           *     - Using "key" to reference component instances. In the current version
                                                                                           *       this should be done via "ref" instead. This allows old code still
                                                                                           *       using "key" to keep working like before. NOTE: this may cause
                                                                                           *       problems, since "key" is meant to be used differently. Only use this
                                                                                           *       if it's not possible to upgrade the code to use "ref" instead.
                                                                                           * @param {Object=} opt_data Optional object with data to specify more
                                                                                           *     details, such as:
                                                                                           *         - renderers {Array} the template renderers that should be in
                                                                                           *           compatibility mode, either their constructors or strings
                                                                                           *           representing them (e.g. 'soy' or 'jsx'). By default, all the ones
                                                                                           *           that extend from IncrementalDomRenderer.
                                                                                           * @type {Object}
                                                                                           */

  function enableCompatibilityMode() {
    var opt_data = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    compatibilityModeData_ = opt_data;
  }

  this['metalNamed']['coreNamed']['enableCompatibilityMode'] = enableCompatibilityMode; /**
                                                                                         * Returns the data used for compatibility mode, or nothing if it hasn't been
                                                                                         * enabled.
                                                                                         * @return {Object}
                                                                                         */

  function getCompatibilityModeData() {
    // Compatibility mode can be set via the __METAL_COMPATIBILITY__ global var.
    if (!compatibilityModeData_) {
      if (typeof window !== 'undefined' && window.__METAL_COMPATIBILITY__) {
        enableCompatibilityMode(window.__METAL_COMPATIBILITY__);
      }
    }
    return compatibilityModeData_;
  }

  this['metalNamed']['coreNamed']['getCompatibilityModeData'] = getCompatibilityModeData; /**
                                                                                           * Gets the name of the given function. If the current browser doesn't
                                                                                           * support the `name` property, this will calculate it from the function's
                                                                                           * content string.
                                                                                           * @param {!function()} fn
                                                                                           * @return {string}
                                                                                           */

  function getFunctionName(fn) {
    if (!fn.name) {
      var str = fn.toString();
      fn.name = str.substring(9, str.indexOf('('));
    }
    return fn.name;
  }

  this['metalNamed']['coreNamed']['getFunctionName'] = getFunctionName; /**
                                                                         * Gets an unique id. If `opt_object` argument is passed, the object is
                                                                         * mutated with an unique id. Consecutive calls with the same object
                                                                         * reference won't mutate the object again, instead the current object uid
                                                                         * returns. See {@link UID_PROPERTY}.
                                                                         * @param {Object=} opt_object Optional object to be mutated with the uid. If
                                                                         *     not specified this method only returns the uid.
                                                                         * @param {boolean=} opt_noInheritance Optional flag indicating if this
                                                                         *     object's uid property can be inherited from parents or not.
                                                                         * @throws {Error} when invoked to indicate the method should be overridden.
                                                                         */

  function getUid(opt_object, opt_noInheritance) {
    if (opt_object) {
      var id = opt_object[UID_PROPERTY];
      if (opt_noInheritance && !opt_object.hasOwnProperty(UID_PROPERTY)) {
        id = null;
      }
      return id || (opt_object[UID_PROPERTY] = uniqueIdCounter_++);
    }
    return uniqueIdCounter_++;
  }

  this['metalNamed']['coreNamed']['getUid'] = getUid; /**
                                                       * The identity function. Returns its first argument.
                                                       * @param {*=} opt_returnValue The single value that will be returned.
                                                       * @return {?} The first argument.
                                                       */

  function identityFunction(opt_returnValue) {
    return opt_returnValue;
  }

  this['metalNamed']['coreNamed']['identityFunction'] = identityFunction; /**
                                                                           * Returns true if the specified value is a boolean.
                                                                           * @param {?} val Variable to test.
                                                                           * @return {boolean} Whether variable is boolean.
                                                                           */

  function isBoolean(val) {
    return typeof val === 'boolean';
  }

  this['metalNamed']['coreNamed']['isBoolean'] = isBoolean; /**
                                                             * Returns true if the specified value is not undefined.
                                                             * @param {?} val Variable to test.
                                                             * @return {boolean} Whether variable is defined.
                                                             */

  function isDef(val) {
    return val !== undefined;
  }

  this['metalNamed']['coreNamed']['isDef'] = isDef; /**
                                                     * Returns true if value is not undefined or null.
                                                     * @param {*} val
                                                     * @return {boolean}
                                                     */

  function isDefAndNotNull(val) {
    return isDef(val) && !isNull(val);
  }

  this['metalNamed']['coreNamed']['isDefAndNotNull'] = isDefAndNotNull; /**
                                                                         * Returns true if value is a document.
                                                                         * @param {*} val
                                                                         * @return {boolean}
                                                                         */

  function isDocument(val) {
    return val && (typeof val === 'undefined' ? 'undefined' : babelHelpers.typeof(val)) === 'object' && val.nodeType === 9;
  }

  this['metalNamed']['coreNamed']['isDocument'] = isDocument; /**
                                                               * Returns true if value is a dom element.
                                                               * @param {*} val
                                                               * @return {boolean}
                                                               */

  function isElement(val) {
    return val && (typeof val === 'undefined' ? 'undefined' : babelHelpers.typeof(val)) === 'object' && val.nodeType === 1;
  }

  this['metalNamed']['coreNamed']['isElement'] = isElement; /**
                                                             * Returns true if the specified value is a function.
                                                             * @param {?} val Variable to test.
                                                             * @return {boolean} Whether variable is a function.
                                                             */

  function isFunction(val) {
    return typeof val === 'function';
  }

  this['metalNamed']['coreNamed']['isFunction'] = isFunction; /**
                                                               * Returns true if value is null.
                                                               * @param {*} val
                                                               * @return {boolean}
                                                               */

  function isNull(val) {
    return val === null;
  }

  this['metalNamed']['coreNamed']['isNull'] = isNull; /**
                                                       * Returns true if the specified value is a number.
                                                       * @param {?} val Variable to test.
                                                       * @return {boolean} Whether variable is a number.
                                                       */

  function isNumber(val) {
    return typeof val === 'number';
  }

  this['metalNamed']['coreNamed']['isNumber'] = isNumber; /**
                                                           * Returns true if value is a window.
                                                           * @param {*} val
                                                           * @return {boolean}
                                                           */

  function isWindow(val) {
    return val !== null && val === val.window;
  }

  this['metalNamed']['coreNamed']['isWindow'] = isWindow; /**
                                                           * Returns true if the specified value is an object. This includes arrays
                                                           * and functions.
                                                           * @param {?} val Variable to test.
                                                           * @return {boolean} Whether variable is an object.
                                                           */

  function isObject(val) {
    var type = typeof val === 'undefined' ? 'undefined' : babelHelpers.typeof(val);
    return type === 'object' && val !== null || type === 'function';
  }

  this['metalNamed']['coreNamed']['isObject'] = isObject; /**
                                                           * Returns true if value is a Promise.
                                                           * @param {*} val
                                                           * @return {boolean}
                                                           */

  function isPromise(val) {
    return val && (typeof val === 'undefined' ? 'undefined' : babelHelpers.typeof(val)) === 'object' && typeof val.then === 'function';
  }

  this['metalNamed']['coreNamed']['isPromise'] = isPromise; /**
                                                             * Returns true if value is a string.
                                                             * @param {*} val
                                                             * @return {boolean}
                                                             */

  function isString(val) {
    return typeof val === 'string' || val instanceof String;
  }

  this['metalNamed']['coreNamed']['isString'] = isString; /**
                                                           * Merges the values of a export function property a class with the values of that
                                                           * property for all its super classes, and stores it as a new static
                                                           * property of that class. If the export function property already existed, it won't
                                                           * be recalculated.
                                                           * @param {!function()} constructor Class constructor.
                                                           * @param {string} propertyName Property name to be collected.
                                                           * @param {function(*, *):*=} opt_mergeFn Function that receives an array filled
                                                           *   with the values of the property for the current class and all its super classes.
                                                           *   Should return the merged value to be stored on the current class.
                                                           * @return {boolean} Returns true if merge happens, false otherwise.
                                                           */

  function mergeSuperClassesProperty(constructor, propertyName, opt_mergeFn) {
    var mergedName = propertyName + '_MERGED';
    if (constructor.hasOwnProperty(mergedName)) {
      return false;
    }

    var merged = collectSuperClassesProperty(constructor, propertyName);
    if (opt_mergeFn) {
      merged = opt_mergeFn(merged);
    }
    constructor[mergedName] = merged;
    return true;
  }

  this['metalNamed']['coreNamed']['mergeSuperClassesProperty'] = mergeSuperClassesProperty; /**
                                                                                             * Null function used for default values of callbacks, etc.
                                                                                             * @return {void} Nothing.
                                                                                             */

  function nullFunction() {}
  this['metalNamed']['coreNamed']['nullFunction'] = nullFunction;
}).call(this);
'use strict';

// This file exists just for backwards compatibility, making sure that old
// default imports for this file still work. It's best to use the named exports
// for each function instead though, since that allows bundlers like Rollup to
// reduce the bundle size by removing unused code.

(function () {
  var core = this['metalNamed']['coreNamed'];
  this['metal']['core'] = core;
  this['metalNamed']['core'] = this['metalNamed']['core'] || {};
  this['metalNamed']['core']['core'] = core;
  Object.keys(this['metalNamed']['coreNamed']).forEach(function (key) {
    this['metalNamed']['core'][key] = this['metalNamed']['coreNamed'][key];
  });
}).call(this);
'use strict';

(function () {
	var isDef = this['metalNamed']['core']['isDef'];

	var array = function () {
		function array() {
			babelHelpers.classCallCheck(this, array);
		}

		babelHelpers.createClass(array, null, [{
			key: 'equal',

			/**
    * Checks if the given arrays have the same content.
    * @param {!Array<*>} arr1
    * @param {!Array<*>} arr2
    * @return {boolean}
    */
			value: function equal(arr1, arr2) {
				if (arr1.length !== arr2.length) {
					return false;
				}
				for (var i = 0; i < arr1.length; i++) {
					if (arr1[i] !== arr2[i]) {
						return false;
					}
				}
				return true;
			}

			/**
    * Returns the first value in the given array that isn't undefined.
    * @param {!Array} arr
    * @return {*}
    */

		}, {
			key: 'firstDefinedValue',
			value: function firstDefinedValue(arr) {
				for (var i = 0; i < arr.length; i++) {
					if (arr[i] !== undefined) {
						return arr[i];
					}
				}
			}

			/**
    * Transforms the input nested array to become flat.
    * @param {Array.<*|Array.<*>>} arr Nested array to flatten.
    * @param {Array.<*>} opt_output Optional output array.
    * @return {Array.<*>} Flat array.
    */

		}, {
			key: 'flatten',
			value: function flatten(arr, opt_output) {
				var output = opt_output || [];
				for (var i = 0; i < arr.length; i++) {
					if (Array.isArray(arr[i])) {
						array.flatten(arr[i], output);
					} else {
						output.push(arr[i]);
					}
				}
				return output;
			}

			/**
    * Removes the first occurrence of a particular value from an array.
    * @param {Array.<T>} arr Array from which to remove value.
    * @param {T} obj Object to remove.
    * @return {boolean} True if an element was removed.
    * @template T
    */

		}, {
			key: 'remove',
			value: function remove(arr, obj) {
				var i = arr.indexOf(obj);
				var rv;
				if (rv = i >= 0) {
					array.removeAt(arr, i);
				}
				return rv;
			}

			/**
    * Removes from an array the element at index i
    * @param {Array} arr Array or array like object from which to remove value.
    * @param {number} i The index to remove.
    * @return {boolean} True if an element was removed.
    */

		}, {
			key: 'removeAt',
			value: function removeAt(arr, i) {
				return Array.prototype.splice.call(arr, i, 1).length === 1;
			}

			/**
    * Slices the given array, just like Array.prototype.slice, but this
    * is faster and working on all array-like objects (like arguments).
    * @param {!Object} arr Array-like object to slice.
    * @param {number} start The index that should start the slice.
    * @param {number=} opt_end The index where the slice should end, not
    *   included in the final array. If not given, all elements after the
    *   start index will be included.
    * @return {!Array}
    */

		}, {
			key: 'slice',
			value: function slice(arr, start, opt_end) {
				var sliced = [];
				var end = isDef(opt_end) ? opt_end : arr.length;
				for (var i = start; i < end; i++) {
					sliced.push(arr[i]);
				}
				return sliced;
			}
		}]);
		return array;
	}();

	this['metal']['array'] = array;
}).call(this);
/*!
 * Polyfill from Google's Closure Library.
 * Copyright 2013 The Closure Library Authors. All Rights Reserved.
 */

'use strict';

(function () {
	var async = {};

	/**
  * Throw an item without interrupting the current execution context.  For
  * example, if processing a group of items in a loop, sometimes it is useful
  * to report an error while still allowing the rest of the batch to be
  * processed.
  * @param {*} exception
  */
	async.throwException = function (exception) {
		// Each throw needs to be in its own context.
		async.nextTick(function () {
			throw exception;
		});
	};

	/**
  * Fires the provided callback just before the current callstack unwinds, or as
  * soon as possible after the current JS execution context.
  * @param {function(this:THIS)} callback
  * @param {THIS=} opt_context Object to use as the "this value" when calling
  *     the provided function.
  * @template THIS
  */
	async.run = function (callback, opt_context) {
		if (!async.run.workQueueScheduled_) {
			// Nothing is currently scheduled, schedule it now.
			async.nextTick(async.run.processWorkQueue);
			async.run.workQueueScheduled_ = true;
		}

		async.run.workQueue_.push(new async.run.WorkItem_(callback, opt_context));
	};

	/** @private {boolean} */
	async.run.workQueueScheduled_ = false;

	/** @private {!Array.<!async.run.WorkItem_>} */
	async.run.workQueue_ = [];

	/**
  * Run any pending async.run work items. This function is not intended
  * for general use, but for use by entry point handlers to run items ahead of
  * async.nextTick.
  */
	async.run.processWorkQueue = function () {
		// NOTE: additional work queue items may be pushed while processing.
		while (async.run.workQueue_.length) {
			// Don't let the work queue grow indefinitely.
			var workItems = async.run.workQueue_;
			async.run.workQueue_ = [];
			for (var i = 0; i < workItems.length; i++) {
				var workItem = workItems[i];
				try {
					workItem.fn.call(workItem.scope);
				} catch (e) {
					async.throwException(e);
				}
			}
		}

		// There are no more work items, reset the work queue.
		async.run.workQueueScheduled_ = false;
	};

	/**
  * @constructor
  * @final
  * @struct
  * @private
  *
  * @param {function()} fn
  * @param {Object|null|undefined} scope
  */
	async.run.WorkItem_ = function (fn, scope) {
		/** @const */
		this.fn = fn;
		/** @const */
		this.scope = scope;
	};

	/**
  * Fires the provided callbacks as soon as possible after the current JS
  * execution context. setTimeout(…, 0) always takes at least 5ms for legacy
  * reasons.
  * @param {function(this:SCOPE)} callback Callback function to fire as soon as
  *     possible.
  * @param {SCOPE=} opt_context Object in whose scope to call the listener.
  * @template SCOPE
  */
	async.nextTick = function (callback, opt_context) {
		var cb = callback;
		if (opt_context) {
			cb = callback.bind(opt_context);
		}
		cb = async.nextTick.wrapCallback_(cb);
		// Introduced and currently only supported by IE10.
		// Verify if variable is defined on the current runtime (i.e., node, browser).
		// Can't use typeof enclosed in a function (such as core.isFunction) or an
		// exception will be thrown when the function is called on an environment
		// where the variable is undefined.
		if (typeof setImmediate === 'function') {
			setImmediate(cb);
			return;
		}
		// Look for and cache the custom fallback version of setImmediate.
		if (!async.nextTick.setImmediate_) {
			async.nextTick.setImmediate_ = async.nextTick.getSetImmediateEmulator_();
		}
		async.nextTick.setImmediate_(cb);
	};

	/**
  * Cache for the setImmediate implementation.
  * @type {function(function())}
  * @private
  */
	async.nextTick.setImmediate_ = null;

	/**
  * Determines the best possible implementation to run a function as soon as
  * the JS event loop is idle.
  * @return {function(function())} The "setImmediate" implementation.
  * @private
  */
	async.nextTick.getSetImmediateEmulator_ = function () {
		// Create a private message channel and use it to postMessage empty messages
		// to ourselves.
		var Channel;

		// Verify if variable is defined on the current runtime (i.e., node, browser).
		// Can't use typeof enclosed in a function (such as core.isFunction) or an
		// exception will be thrown when the function is called on an environment
		// where the variable is undefined.
		if (typeof MessageChannel === 'function') {
			Channel = MessageChannel;
		}

		// If MessageChannel is not available and we are in a browser, implement
		// an iframe based polyfill in browsers that have postMessage and
		// document.addEventListener. The latter excludes IE8 because it has a
		// synchronous postMessage implementation.
		if (typeof Channel === 'undefined' && typeof window !== 'undefined' && window.postMessage && window.addEventListener) {
			/** @constructor */
			Channel = function Channel() {
				// Make an empty, invisible iframe.
				var iframe = document.createElement('iframe');
				iframe.style.display = 'none';
				iframe.src = '';
				document.documentElement.appendChild(iframe);
				var win = iframe.contentWindow;
				var doc = win.document;
				doc.open();
				doc.write('');
				doc.close();
				var message = 'callImmediate' + Math.random();
				var origin = win.location.protocol + '//' + win.location.host;
				var onmessage = function (e) {
					// Validate origin and message to make sure that this message was
					// intended for us.
					if (e.origin !== origin && e.data !== message) {
						return;
					}
					this.port1.onmessage();
				}.bind(this);
				win.addEventListener('message', onmessage, false);
				this.port1 = {};
				this.port2 = {
					postMessage: function postMessage() {
						win.postMessage(message, origin);
					}
				};
			};
		}
		if (typeof Channel !== 'undefined') {
			var channel = new Channel();
			// Use a fifo linked list to call callbacks in the right order.
			var head = {};
			var tail = head;
			channel.port1.onmessage = function () {
				head = head.next;
				var cb = head.cb;
				head.cb = null;
				cb();
			};
			return function (cb) {
				tail.next = {
					cb: cb
				};
				tail = tail.next;
				channel.port2.postMessage(0);
			};
		}
		// Implementation for IE6-8: Script elements fire an asynchronous
		// onreadystatechange event when inserted into the DOM.
		if (typeof document !== 'undefined' && 'onreadystatechange' in document.createElement('script')) {
			return function (cb) {
				var script = document.createElement('script');
				script.onreadystatechange = function () {
					// Clean up and call the callback.
					script.onreadystatechange = null;
					script.parentNode.removeChild(script);
					script = null;
					cb();
					cb = null;
				};
				document.documentElement.appendChild(script);
			};
		}
		// Fall back to setTimeout with 0. In browsers this creates a delay of 5ms
		// or more.
		return function (cb) {
			setTimeout(cb, 0);
		};
	};

	/**
  * Helper function that is overrided to protect callbacks with entry point
  * monitor if the application monitors entry points.
  * @param {function()} callback Callback function to fire as soon as possible.
  * @return {function()} The wrapped callback.
  * @private
  */
	async.nextTick.wrapCallback_ = function (opt_returnValue) {
		return opt_returnValue;
	};

	this['metal']['async'] = async;
}).call(this);
'use strict';

/**
 * Disposable utility. When inherited provides the `dispose` function to its
 * subclass, which is responsible for disposing of any object references
 * when an instance won't be used anymore. Subclasses should override
 * `disposeInternal` to implement any specific disposing logic.
 * @constructor
 */

(function () {
	var Disposable = function () {
		function Disposable() {
			babelHelpers.classCallCheck(this, Disposable);

			/**
    * Flag indicating if this instance has already been disposed.
    * @type {boolean}
    * @protected
    */
			this.disposed_ = false;
		}

		/**
   * Disposes of this instance's object references. Calls `disposeInternal`.
   */


		babelHelpers.createClass(Disposable, [{
			key: 'dispose',
			value: function dispose() {
				if (!this.disposed_) {
					this.disposeInternal();
					this.disposed_ = true;
				}
			}

			/**
    * Subclasses should override this method to implement any specific
    * disposing logic (like clearing references and calling `dispose` on other
    * disposables).
    */

		}, {
			key: 'disposeInternal',
			value: function disposeInternal() {}

			/**
    * Checks if this instance has already been disposed.
    * @return {boolean}
    */

		}, {
			key: 'isDisposed',
			value: function isDisposed() {
				return this.disposed_;
			}
		}]);
		return Disposable;
	}();

	this['metal']['Disposable'] = Disposable;
}).call(this);
'use strict';

(function () {
	var object = function () {
		function object() {
			babelHelpers.classCallCheck(this, object);
		}

		babelHelpers.createClass(object, null, [{
			key: 'mixin',

			/**
    * Copies all the members of a source object to a target object.
    * @param {Object} target Target object.
    * @param {...Object} var_args The objects from which values will be copied.
    * @return {Object} Returns the target object reference.
    */
			value: function mixin(target) {
				var key, source;
				for (var i = 1; i < arguments.length; i++) {
					source = arguments[i];
					for (key in source) {
						target[key] = source[key];
					}
				}
				return target;
			}

			/**
    * Returns an object based on its fully qualified external name.
    * @param {string} name The fully qualified name.
    * @param {object=} opt_obj The object within which to look; default is
    *     <code>window</code>.
    * @return {?} The value (object or primitive) or, if not found, undefined.
    */

		}, {
			key: 'getObjectByName',
			value: function getObjectByName(name, opt_obj) {
				var scope = opt_obj || window;
				var parts = name.split('.');
				return parts.reduce(function (part, key) {
					return part[key];
				}, scope);
			}

			/**
    * Returns a new object with the same keys as the given one, but with
    * their values set to the return values of the specified function.
    * @param {!Object} obj
    * @param {!function(string, *)} fn
    * @return {!Object}
    */

		}, {
			key: 'map',
			value: function map(obj, fn) {
				var mappedObj = {};
				var keys = Object.keys(obj);
				for (var i = 0; i < keys.length; i++) {
					mappedObj[keys[i]] = fn(keys[i], obj[keys[i]]);
				}
				return mappedObj;
			}

			/**
    * Checks if the two given objects are equal. This is done via a shallow
    * check, including only the keys directly contained by the 2 objects.
    * @return {boolean}
    */

		}, {
			key: 'shallowEqual',
			value: function shallowEqual(obj1, obj2) {
				if (obj1 === obj2) {
					return true;
				}

				var keys1 = Object.keys(obj1);
				var keys2 = Object.keys(obj2);
				if (keys1.length !== keys2.length) {
					return false;
				}

				for (var i = 0; i < keys1.length; i++) {
					if (obj1[keys1[i]] !== obj2[keys1[i]]) {
						return false;
					}
				}
				return true;
			}
		}]);
		return object;
	}();

	this['metal']['object'] = object;
}).call(this);
'use strict';

(function () {
	var string = function () {
		function string() {
			babelHelpers.classCallCheck(this, string);
		}

		babelHelpers.createClass(string, null, [{
			key: 'collapseBreakingSpaces',

			/**
    * Removes the breaking spaces from the left and right of the string and
    * collapses the sequences of breaking spaces in the middle into single spaces.
    * The original and the result strings render the same way in HTML.
    * @param {string} str A string in which to collapse spaces.
    * @return {string} Copy of the string with normalized breaking spaces.
    */
			value: function collapseBreakingSpaces(str) {
				return str.replace(/[\t\r\n ]+/g, ' ').replace(/^[\t\r\n ]+|[\t\r\n ]+$/g, '');
			}

			/**
   * Escapes characters in the string that are not safe to use in a RegExp.
   * @param {*} str The string to escape. If not a string, it will be casted
   *     to one.
   * @return {string} A RegExp safe, escaped copy of {@code s}.
   */

		}, {
			key: 'escapeRegex',
			value: function escapeRegex(str) {
				return String(str).replace(/([-()\[\]{}+?*.$\^|,:#<!\\])/g, '\\$1').replace(/\x08/g, '\\x08');
			}

			/**
   * Returns a string with at least 64-bits of randomness.
   * @return {string} A random string, e.g. sn1s7vb4gcic.
   */

		}, {
			key: 'getRandomString',
			value: function getRandomString() {
				var x = 2147483648;
				return Math.floor(Math.random() * x).toString(36) + Math.abs(Math.floor(Math.random() * x) ^ Date.now()).toString(36);
			}

			/**
    * Calculates the hashcode for a string. The hashcode value is computed by
    * the sum algorithm: s[0]*31^(n-1) + s[1]*31^(n-2) + ... + s[n-1]. A nice
    * property of using 31 prime is that the multiplication can be replaced by
    * a shift and a subtraction for better performance: 31*i == (i<<5)-i.
    * Modern VMs do this sort of optimization automatically.
    * @param {String} val Target string.
    * @return {Number} Returns the string hashcode.
    */

		}, {
			key: 'hashCode',
			value: function hashCode(val) {
				var hash = 0;
				for (var i = 0, len = val.length; i < len; i++) {
					hash = 31 * hash + val.charCodeAt(i);
					hash %= 0x100000000;
				}
				return hash;
			}

			/**
    * Replaces interval into the string with specified value, e.g.
    * `replaceInterval("abcde", 1, 4, "")` returns "ae".
    * @param {string} str The input string.
    * @param {Number} start Start interval position to be replaced.
    * @param {Number} end End interval position to be replaced.
    * @param {string} value The value that replaces the specified interval.
    * @return {string}
    */

		}, {
			key: 'replaceInterval',
			value: function replaceInterval(str, start, end, value) {
				return str.substring(0, start) + value + str.substring(end);
			}
		}]);
		return string;
	}();

	this['metal']['string'] = string;
}).call(this);
'use strict';

(function () {
  var core = this['metal']['core'];
  var array = this['metal']['array'];
  var async = this['metal']['async'];
  var Disposable = this['metal']['Disposable'];
  var object = this['metal']['object'];
  var string = this['metal']['string'];
  this['metalNamed']['metal'] = this['metalNamed']['metal'] || {};
  Object.keys(this['metalNamed']['core']).forEach(function (key) {
    this['metalNamed']['metal'][key] = this['metalNamed']['core'][key];
  });
  this['metalNamed']['metal']['array'] = array;
  this['metalNamed']['metal']['async'] = async;
  this['metalNamed']['metal']['Disposable'] = Disposable;
  this['metalNamed']['metal']['object'] = object;
  this['metalNamed']['metal']['string'] = string;
  this['metal']['metal'] = core;
}).call(this);
'use strict';

(function () {
	var METAL_DATA = '__metal_data__';

	var domData = function () {
		function domData() {
			babelHelpers.classCallCheck(this, domData);
		}

		babelHelpers.createClass(domData, null, [{
			key: 'get',

			/**
    * Gets Metal.js's data for the given element.
    * @param {!Element} element
    * @return {!Object}
    */
			value: function get(element) {
				if (!element[METAL_DATA]) {
					element[METAL_DATA] = {
						delegating: {},
						listeners: {}
					};
				}
				return element[METAL_DATA];
			}
		}]);
		return domData;
	}();

	this['metal']['domData'] = domData;
}).call(this);
'use strict';

(function () {
	var Disposable = this['metalNamed']['metal']['Disposable'];

	/**
  * EventHandle utility. Holds information about an event subscription, and
  * allows removing them easily.
  * EventHandle is a Disposable, but it's important to note that the
  * EventEmitter that created it is not the one responsible for disposing it.
  * That responsibility is for the code that holds a reference to it.
  * @param {!EventEmitter} emitter Emitter the event was subscribed to.
  * @param {string} event The name of the event that was subscribed to.
  * @param {!Function} listener The listener subscribed to the event.
  * @constructor
  * @extends {Disposable}
  */

	var EventHandle = function (_Disposable) {
		babelHelpers.inherits(EventHandle, _Disposable);

		function EventHandle(emitter, event, listener) {
			babelHelpers.classCallCheck(this, EventHandle);

			/**
    * The EventEmitter instance that the event was subscribed to.
    * @type {EventEmitter}
    * @protected
    */
			var _this = babelHelpers.possibleConstructorReturn(this, (EventHandle.__proto__ || Object.getPrototypeOf(EventHandle)).call(this));

			_this.emitter_ = emitter;

			/**
    * The name of the event that was subscribed to.
    * @type {string}
    * @protected
    */
			_this.event_ = event;

			/**
    * The listener subscribed to the event.
    * @type {Function}
    * @protected
    */
			_this.listener_ = listener;
			return _this;
		}

		/**
   * Disposes of this instance's object references.
   * @override
   */


		babelHelpers.createClass(EventHandle, [{
			key: 'disposeInternal',
			value: function disposeInternal() {
				this.removeListener();
				this.emitter_ = null;
				this.listener_ = null;
			}

			/**
    * Removes the listener subscription from the emitter.
    */

		}, {
			key: 'removeListener',
			value: function removeListener() {
				if (!this.emitter_.isDisposed()) {
					this.emitter_.removeListener(this.event_, this.listener_);
				}
			}
		}]);
		return EventHandle;
	}(Disposable);

	this['metal']['EventHandle'] = EventHandle;
}).call(this);
'use strict';

(function () {
	var array = this['metalNamed']['metal']['array'];
	var Disposable = this['metalNamed']['metal']['Disposable'];
	var isFunction = this['metalNamed']['metal']['isFunction'];
	var isString = this['metalNamed']['metal']['isString'];
	var EventHandle = this['metal']['EventHandle'];

	/**
  * EventEmitter utility.
  * @constructor
  * @extends {Disposable}
  */

	var EventEmitter = function (_Disposable) {
		babelHelpers.inherits(EventEmitter, _Disposable);

		function EventEmitter() {
			babelHelpers.classCallCheck(this, EventEmitter);

			/**
    * Holds event listeners scoped by event type.
    * @type {!Object<string, !Array<!function()>>}
    * @protected
    */
			var _this = babelHelpers.possibleConstructorReturn(this, (EventEmitter.__proto__ || Object.getPrototypeOf(EventEmitter)).call(this));

			_this.events_ = [];

			/**
    * The maximum number of listeners allowed for each event type. If the number
    * becomes higher than the max, a warning will be issued.
    * @type {number}
    * @protected
    */
			_this.maxListeners_ = 10;

			/**
    * Configuration option which determines if an event facade should be sent
    * as a param of listeners when emitting events. If set to true, the facade
    * will be passed as the first argument of the listener.
    * @type {boolean}
    * @protected
    */
			_this.shouldUseFacade_ = false;
			return _this;
		}

		/**
   * Adds a listener to the end of the listeners array for the specified events.
   * @param {!(Array|string)} events
   * @param {!Function} listener
   * @param {boolean} opt_default Flag indicating if this listener is a default
   *   action for this event. Default actions are run last, and only if no previous
   *   listener call `preventDefault()` on the received event facade.
   * @return {!EventHandle} Can be used to remove the listener.
   */


		babelHelpers.createClass(EventEmitter, [{
			key: 'addListener',
			value: function addListener(events, listener, opt_default) {
				this.validateListener_(listener);

				events = this.normalizeEvents_(events);
				for (var i = 0; i < events.length; i++) {
					this.addSingleListener_(events[i], listener, opt_default);
				}

				return new EventHandle(this, events, listener);
			}

			/**
    * Adds a listener to the end of the listeners array for a single event.
    * @param {string} event
    * @param {!Function} listener
    * @param {boolean} opt_default Flag indicating if this listener is a default
    *   action for this event. Default actions are run last, and only if no previous
    *   listener call `preventDefault()` on the received event facade.
    * @return {!EventHandle} Can be used to remove the listener.
    * @param {Function=} opt_origin The original function that was added as a
    *   listener, if there is any.
    * @protected
    */

		}, {
			key: 'addSingleListener_',
			value: function addSingleListener_(event, listener, opt_default, opt_origin) {
				this.emit('newListener', event, listener);

				if (!this.events_[event]) {
					this.events_[event] = [];
				}
				this.events_[event].push({
					default: opt_default,
					fn: listener,
					origin: opt_origin
				});

				var listeners = this.events_[event];
				if (listeners.length > this.maxListeners_ && !listeners.warned) {
					console.warn('Possible EventEmitter memory leak detected. %d listeners added ' + 'for event %s. Use emitter.setMaxListeners() to increase limit.', listeners.length, event);
					listeners.warned = true;
				}
			}

			/**
    * Disposes of this instance's object references.
    * @override
    */

		}, {
			key: 'disposeInternal',
			value: function disposeInternal() {
				this.events_ = [];
			}

			/**
    * Execute each of the listeners in order with the supplied arguments.
    * @param {string} event
    * @param {*} opt_args [arg1], [arg2], [...]
    * @return {boolean} Returns true if event had listeners, false otherwise.
    */

		}, {
			key: 'emit',
			value: function emit(event) {
				var args = array.slice(arguments, 1);
				var listeners = (this.events_[event] || []).concat();

				var facade;
				if (this.getShouldUseFacade()) {
					facade = {
						preventDefault: function preventDefault() {
							facade.preventedDefault = true;
						},
						target: this,
						type: event
					};
					args.push(facade);
				}

				var defaultListeners = [];
				for (var i = 0; i < listeners.length; i++) {
					if (listeners[i].default) {
						defaultListeners.push(listeners[i]);
					} else {
						listeners[i].fn.apply(this, args);
					}
				}
				if (!facade || !facade.preventedDefault) {
					for (var j = 0; j < defaultListeners.length; j++) {
						defaultListeners[j].fn.apply(this, args);
					}
				}

				if (event !== '*') {
					this.emit.apply(this, ['*', event].concat(args));
				}

				return listeners.length > 0;
			}

			/**
    * Gets the configuration option which determines if an event facade should
    * be sent as a param of listeners when emitting events. If set to true, the
    * facade will be passed as the first argument of the listener.
    * @return {boolean}
    */

		}, {
			key: 'getShouldUseFacade',
			value: function getShouldUseFacade() {
				return this.shouldUseFacade_;
			}

			/**
    * Returns an array of listeners for the specified event.
    * @param {string} event
    * @return {Array} Array of listeners.
    */

		}, {
			key: 'listeners',
			value: function listeners(event) {
				return (this.events_[event] || []).map(function (listener) {
					return listener.fn;
				});
			}

			/**
    * Adds a listener that will be invoked a fixed number of times for the
    * events. After each event is triggered the specified amount of times, the
    * listener is removed for it.
    * @param {!(Array|string)} events
    * @param {number} amount The amount of times this event should be listened
    * to.
    * @param {!Function} listener
    * @return {!EventHandle} Can be used to remove the listener.
    */

		}, {
			key: 'many',
			value: function many(events, amount, listener) {
				events = this.normalizeEvents_(events);
				for (var i = 0; i < events.length; i++) {
					this.many_(events[i], amount, listener);
				}

				return new EventHandle(this, events, listener);
			}

			/**
    * Adds a listener that will be invoked a fixed number of times for a single
    * event. After the event is triggered the specified amount of times, the
    * listener is removed.
    * @param {string} event
    * @param {number} amount The amount of times this event should be listened
    * to.
    * @param {!Function} listener
    * @protected
    */

		}, {
			key: 'many_',
			value: function many_(event, amount, listener) {
				var self = this;

				if (amount <= 0) {
					return;
				}

				function handlerInternal() {
					if (--amount === 0) {
						self.removeListener(event, handlerInternal);
					}
					listener.apply(self, arguments);
				}

				self.addSingleListener_(event, handlerInternal, false, listener);
			}

			/**
    * Checks if a listener object matches the given listener function. To match,
    * it needs to either point to that listener or have it as its origin.
    * @param {!Object} listenerObj
    * @param {!Function} listener
    * @return {boolean}
    * @protected
    */

		}, {
			key: 'matchesListener_',
			value: function matchesListener_(listenerObj, listener) {
				return listenerObj.fn === listener || listenerObj.origin && listenerObj.origin === listener;
			}

			/**
    * Converts the parameter to an array if only one event is given.
    * @param  {!(Array|string)} events
    * @return {!Array}
    * @protected
    */

		}, {
			key: 'normalizeEvents_',
			value: function normalizeEvents_(events) {
				return isString(events) ? [events] : events;
			}

			/**
    * Removes a listener for the specified events.
    * Caution: changes array indices in the listener array behind the listener.
    * @param {!(Array|string)} events
    * @param {!Function} listener
    * @return {!Object} Returns emitter, so calls can be chained.
    */

		}, {
			key: 'off',
			value: function off(events, listener) {
				this.validateListener_(listener);

				events = this.normalizeEvents_(events);
				for (var i = 0; i < events.length; i++) {
					var listenerObjs = this.events_[events[i]] || [];
					this.removeMatchingListenerObjs_(listenerObjs, listener);
				}

				return this;
			}

			/**
    * Adds a listener to the end of the listeners array for the specified events.
    * @param {!(Array|string)} events
    * @param {!Function} listener
    * @return {!EventHandle} Can be used to remove the listener.
    */

		}, {
			key: 'on',
			value: function on() {
				return this.addListener.apply(this, arguments);
			}

			/**
    * Adds a one time listener for the events. This listener is invoked only the
    * next time each event is fired, after which it is removed.
    * @param {!(Array|string)} events
    * @param {!Function} listener
    * @return {!EventHandle} Can be used to remove the listener.
    */

		}, {
			key: 'once',
			value: function once(events, listener) {
				return this.many(events, 1, listener);
			}

			/**
    * Removes all listeners, or those of the specified events. It's not a good
    * idea to remove listeners that were added elsewhere in the code,
    * especially when it's on an emitter that you didn't create.
    * @param {(Array|string)=} opt_events
    * @return {!Object} Returns emitter, so calls can be chained.
    */

		}, {
			key: 'removeAllListeners',
			value: function removeAllListeners(opt_events) {
				if (opt_events) {
					var events = this.normalizeEvents_(opt_events);
					for (var i = 0; i < events.length; i++) {
						this.events_[events[i]] = null;
					}
				} else {
					this.events_ = {};
				}
				return this;
			}

			/**
    * Removes all listener objects from the given array that match the given
    * listener function.
    * @param {!Array.<Object>} listenerObjs
    * @param {!Function} listener
    * @protected
    */

		}, {
			key: 'removeMatchingListenerObjs_',
			value: function removeMatchingListenerObjs_(listenerObjs, listener) {
				for (var i = listenerObjs.length - 1; i >= 0; i--) {
					if (this.matchesListener_(listenerObjs[i], listener)) {
						listenerObjs.splice(i, 1);
					}
				}
			}

			/**
    * Removes a listener for the specified events.
    * Caution: changes array indices in the listener array behind the listener.
    * @param {!(Array|string)} events
    * @param {!Function} listener
    * @return {!Object} Returns emitter, so calls can be chained.
    */

		}, {
			key: 'removeListener',
			value: function removeListener() {
				return this.off.apply(this, arguments);
			}

			/**
    * By default EventEmitters will print a warning if more than 10 listeners
    * are added for a particular event. This is a useful default which helps
    * finding memory leaks. Obviously not all Emitters should be limited to 10.
    * This function allows that to be increased. Set to zero for unlimited.
    * @param {number} max The maximum number of listeners.
    * @return {!Object} Returns emitter, so calls can be chained.
    */

		}, {
			key: 'setMaxListeners',
			value: function setMaxListeners(max) {
				this.maxListeners_ = max;
				return this;
			}

			/**
    * Sets the configuration option which determines if an event facade should
    * be sent as a param of listeners when emitting events. If set to true, the
    * facade will be passed as the first argument of the listener.
    * @param {boolean} shouldUseFacade
    * @return {!Object} Returns emitter, so calls can be chained.
    */

		}, {
			key: 'setShouldUseFacade',
			value: function setShouldUseFacade(shouldUseFacade) {
				this.shouldUseFacade_ = shouldUseFacade;
				return this;
			}

			/**
    * Checks if the given listener is valid, throwing an exception when it's not.
    * @param  {*} listener
    * @protected
    */

		}, {
			key: 'validateListener_',
			value: function validateListener_(listener) {
				if (!isFunction(listener)) {
					throw new TypeError('Listener must be a function');
				}
			}
		}]);
		return EventEmitter;
	}(Disposable);

	this['metal']['EventEmitter'] = EventEmitter;
}).call(this);
'use strict';

(function () {
	var array = this['metalNamed']['metal']['array'];
	var object = this['metalNamed']['metal']['object'];
	var Disposable = this['metalNamed']['metal']['Disposable'];

	/**
  * EventEmitterProxy utility. It's responsible for linking two EventEmitter
  * instances together, emitting events from the first emitter through the
  * second one. That means that listening to a supported event on the target
  * emitter will mean listening to it on the origin emitter as well.
  * @param {EventEmitter} originEmitter Events originated on this emitter
  *   will be fired for the target emitter's listeners as well.
  * @param {EventEmitter} targetEmitter Event listeners attached to this emitter
  *   will also be triggered when the event is fired by the origin emitter.
  * @param {Object} opt_blacklist Optional blacklist of events that should not be
  *   proxied.
  * @constructor
  * @extends {Disposable}
  */

	var EventEmitterProxy = function (_Disposable) {
		babelHelpers.inherits(EventEmitterProxy, _Disposable);

		function EventEmitterProxy(originEmitter, targetEmitter, opt_blacklist, opt_whitelist) {
			babelHelpers.classCallCheck(this, EventEmitterProxy);

			/**
    * Map of events that should not be proxied.
    * @type {Object}
    * @protected
    */
			var _this = babelHelpers.possibleConstructorReturn(this, (EventEmitterProxy.__proto__ || Object.getPrototypeOf(EventEmitterProxy)).call(this));

			_this.blacklist_ = object.mixin({
				newListener: true
			}, opt_blacklist);

			/**
    * The origin emitter. This emitter's events will be proxied through the
    * target emitter.
    * @type {EventEmitter}
    * @protected
    */
			_this.originEmitter_ = originEmitter;

			/**
    * A list of events that are pending to be listened by an actual origin
    * emitter. Events are stored here when the origin doesn't exist, so they
    * can be set on a new origin when one is set.
    * @type {!Array}
    * @protected
    */
			_this.pendingEvents_ = [];

			/**
    * Holds a map of events from the origin emitter that are already being proxied.
    * @type {Object<string, !EventHandle>}
    * @protected
    */
			_this.proxiedEvents_ = {};

			/**
    * The target emitter. This emitter will emit all events that come from
    * the origin emitter.
    * @type {EventEmitter}
    * @protected
    */
			_this.targetEmitter_ = targetEmitter;

			/**
    * Map of events that should be proxied. If whitelist is set blacklist is ignored.
    * @type {Object}
    * @protected
    */
			_this.whitelist_ = opt_whitelist;

			_this.startProxy_();
			return _this;
		}

		/**
   * Adds the given listener for the given event.
   * @param {string} event
   * @param {!function()} listener
   * @return {!EventHandle} The listened event's handle.
   * @protected
   */


		babelHelpers.createClass(EventEmitterProxy, [{
			key: 'addListener_',
			value: function addListener_(event, listener) {
				return this.originEmitter_.on(event, listener);
			}

			/**
    * Adds the proxy listener for the given event.
    * @param {string} event
    * @return {!EventHandle} The listened event's handle.
    * @protected
    */

		}, {
			key: 'addListenerForEvent_',
			value: function addListenerForEvent_(event) {
				return this.addListener_(event, this.emitOnTarget_.bind(this, event));
			}

			/**
    * @inheritDoc
    */

		}, {
			key: 'disposeInternal',
			value: function disposeInternal() {
				this.removeListeners_();
				this.proxiedEvents_ = null;
				this.originEmitter_ = null;
				this.targetEmitter_ = null;
			}

			/**
    * Emits the specified event type on the target emitter.
    * @param {string} eventType
    * @protected
    */

		}, {
			key: 'emitOnTarget_',
			value: function emitOnTarget_(eventType) {
				var args = [eventType].concat(array.slice(arguments, 1));
				this.targetEmitter_.emit.apply(this.targetEmitter_, args);
			}

			/**
    * Proxies the given event from the origin to the target emitter.
    * @param {string} event
    */

		}, {
			key: 'proxyEvent',
			value: function proxyEvent(event) {
				if (this.shouldProxyEvent_(event)) {
					this.tryToAddListener_(event);
				}
			}

			/**
    * Removes the proxy listener for all events.
    * @protected
    */

		}, {
			key: 'removeListeners_',
			value: function removeListeners_() {
				var events = Object.keys(this.proxiedEvents_);
				for (var i = 0; i < events.length; i++) {
					this.proxiedEvents_[events[i]].removeListener();
				}
				this.proxiedEvents_ = {};
				this.pendingEvents_ = [];
			}

			/**
    * Changes the origin emitter. This automatically detaches any events that
    * were already being proxied from the previous emitter, and starts proxying
    * them on the new emitter instead.
    * @param {!EventEmitter} originEmitter
    */

		}, {
			key: 'setOriginEmitter',
			value: function setOriginEmitter(originEmitter) {
				var _this2 = this;

				var events = this.originEmitter_ ? Object.keys(this.proxiedEvents_) : this.pendingEvents_;
				this.removeListeners_();
				this.originEmitter_ = originEmitter;
				events.forEach(function (event) {
					return _this2.proxyEvent(event);
				});
			}

			/**
    * Checks if the given event should be proxied.
    * @param {string} event
    * @return {boolean}
    * @protected
    */

		}, {
			key: 'shouldProxyEvent_',
			value: function shouldProxyEvent_(event) {
				if (this.whitelist_ && !this.whitelist_[event]) {
					return false;
				}
				if (this.blacklist_[event]) {
					return false;
				}
				return !this.proxiedEvents_[event];
			}

			/**
    * Starts proxying all events from the origin to the target emitter.
    * @protected
    */

		}, {
			key: 'startProxy_',
			value: function startProxy_() {
				this.targetEmitter_.on('newListener', this.proxyEvent.bind(this));
			}

			/**
    * Adds a listener to the origin emitter, if it exists. Otherwise, stores
    * the pending listener so it can be used on a future origin emitter.
    * @param {string} event
    * @protected
    */

		}, {
			key: 'tryToAddListener_',
			value: function tryToAddListener_(event) {
				if (this.originEmitter_) {
					this.proxiedEvents_[event] = this.addListenerForEvent_(event);
				} else {
					this.pendingEvents_.push(event);
				}
			}
		}]);
		return EventEmitterProxy;
	}(Disposable);

	this['metal']['EventEmitterProxy'] = EventEmitterProxy;
}).call(this);
'use strict';

(function () {
	var Disposable = this['metalNamed']['metal']['Disposable'];

	/**
  * EventHandler utility. It's useful for easily removing a group of
  * listeners from different EventEmitter instances.
  * @constructor
  * @extends {Disposable}
  */

	var EventHandler = function (_Disposable) {
		babelHelpers.inherits(EventHandler, _Disposable);

		function EventHandler() {
			babelHelpers.classCallCheck(this, EventHandler);

			/**
    * An array that holds the added event handles, so the listeners can be
    * removed later.
    * @type {Array.<EventHandle>}
    * @protected
    */
			var _this = babelHelpers.possibleConstructorReturn(this, (EventHandler.__proto__ || Object.getPrototypeOf(EventHandler)).call(this));

			_this.eventHandles_ = [];
			return _this;
		}

		/**
   * Adds event handles to be removed later through the `removeAllListeners`
   * method.
   * @param {...(!EventHandle)} var_args
   */


		babelHelpers.createClass(EventHandler, [{
			key: 'add',
			value: function add() {
				for (var i = 0; i < arguments.length; i++) {
					this.eventHandles_.push(arguments[i]);
				}
			}

			/**
    * Disposes of this instance's object references.
    * @override
    */

		}, {
			key: 'disposeInternal',
			value: function disposeInternal() {
				this.eventHandles_ = null;
			}

			/**
    * Removes all listeners that have been added through the `add` method.
    */

		}, {
			key: 'removeAllListeners',
			value: function removeAllListeners() {
				for (var i = 0; i < this.eventHandles_.length; i++) {
					this.eventHandles_[i].removeListener();
				}

				this.eventHandles_ = [];
			}
		}]);
		return EventHandler;
	}(Disposable);

	this['metal']['EventHandler'] = EventHandler;
}).call(this);
'use strict';

(function () {
  var EventEmitter = this['metal']['EventEmitter'];
  var EventEmitterProxy = this['metal']['EventEmitterProxy'];
  var EventHandle = this['metal']['EventHandle'];
  var EventHandler = this['metal']['EventHandler'];
  this['metal']['events'] = EventEmitter;
  this['metalNamed']['events'] = this['metalNamed']['events'] || {};
  this['metalNamed']['events']['EventEmitter'] = EventEmitter;
  this['metalNamed']['events']['EventEmitterProxy'] = EventEmitterProxy;
  this['metalNamed']['events']['EventHandle'] = EventHandle;
  this['metalNamed']['events']['EventHandler'] = EventHandler;
}).call(this);
'use strict';

(function () {
	var array = this['metalNamed']['metal']['array'];
	var isString = this['metalNamed']['metal']['isString'];
	var domData = this['metal']['domData'];
	var EventHandle = this['metalNamed']['events']['EventHandle'];

	/**
  * This is a special EventHandle, that is responsible for dom delegated events
  * (only the ones that receive a target element, not a selector string).
  * @extends {EventHandle}
  */

	var DomDelegatedEventHandle = function (_EventHandle) {
		babelHelpers.inherits(DomDelegatedEventHandle, _EventHandle);

		/**
   * The constructor for `DomDelegatedEventHandle`.
   * @param {!Event} emitter Element the event was subscribed to.
   * @param {string} event The name of the event that was subscribed to.
   * @param {!Function} listener The listener subscribed to the event.
   * @param {string=} opt_selector An optional selector used when delegating
   *     the event.
   * @constructor
   */
		function DomDelegatedEventHandle(emitter, event, listener, opt_selector) {
			babelHelpers.classCallCheck(this, DomDelegatedEventHandle);

			var _this = babelHelpers.possibleConstructorReturn(this, (DomDelegatedEventHandle.__proto__ || Object.getPrototypeOf(DomDelegatedEventHandle)).call(this, emitter, event, listener));

			_this.selector_ = opt_selector;
			return _this;
		}

		/**
   * @inheritDoc
   */


		babelHelpers.createClass(DomDelegatedEventHandle, [{
			key: 'removeListener',
			value: function removeListener() {
				var data = domData.get(this.emitter_);
				var selector = this.selector_;
				var arr = isString(selector) ? data.delegating[this.event_].selectors : data.listeners;
				var key = isString(selector) ? selector : this.event_;

				array.remove(arr[key] || [], this.listener_);
				if (arr[key] && arr[key].length === 0) {
					delete arr[key];
				}
			}
		}]);
		return DomDelegatedEventHandle;
	}(EventHandle);

	this['metal']['DomDelegatedEventHandle'] = DomDelegatedEventHandle;
}).call(this);
'use strict';

(function () {
	var EventHandle = this['metalNamed']['events']['EventHandle'];

	/**
  * This is a special EventHandle, that is responsible for dom events, instead
  * of EventEmitter events.
  * @extends {EventHandle}
  */

	var DomEventHandle = function (_EventHandle) {
		babelHelpers.inherits(DomEventHandle, _EventHandle);

		/**
   * The constructor for `DomEventHandle`.
   * @param {!EventEmitter} emitter Emitter the event was subscribed to.
   * @param {string} event The name of the event that was subscribed to.
   * @param {!Function} listener The listener subscribed to the event.
   * @param {boolean} opt_capture Flag indicating if listener should be triggered
   *   during capture phase, instead of during the bubbling phase. Defaults to false.
   * @constructor
   */
		function DomEventHandle(emitter, event, listener, opt_capture) {
			babelHelpers.classCallCheck(this, DomEventHandle);

			var _this = babelHelpers.possibleConstructorReturn(this, (DomEventHandle.__proto__ || Object.getPrototypeOf(DomEventHandle)).call(this, emitter, event, listener));

			_this.capture_ = opt_capture;
			return _this;
		}

		/**
   * @inheritDoc
   */


		babelHelpers.createClass(DomEventHandle, [{
			key: 'removeListener',
			value: function removeListener() {
				this.emitter_.removeEventListener(this.event_, this.listener_, this.capture_);
			}
		}]);
		return DomEventHandle;
	}(EventHandle);

	this['metal']['DomEventHandle'] = DomEventHandle;
}).call(this);
'use strict';

(function () {
	var isDef = this['metalNamed']['metal']['isDef'];
	var isDocument = this['metalNamed']['metal']['isDocument'];
	var isElement = this['metalNamed']['metal']['isElement'];
	var isObject = this['metalNamed']['metal']['isObject'];
	var isString = this['metalNamed']['metal']['isString'];
	var object = this['metalNamed']['metal']['object'];
	var domData = this['metal']['domData'];
	var DomDelegatedEventHandle = this['metal']['DomDelegatedEventHandle'];
	var DomEventHandle = this['metal']['DomEventHandle'];


	var elementsByTag_ = {};
	var customEvents = {};

	this['metalNamed']['domNamed'] = this['metalNamed']['domNamed'] || {};
	this['metalNamed']['domNamed']['customEvents'] = customEvents;
	var NEXT_TARGET = '__metal_next_target__';
	var USE_CAPTURE = {
		blur: true,
		error: true,
		focus: true,
		invalid: true,
		load: true,
		scroll: true
	};

	/**
  * Adds the requested CSS classes to an element.
  * @param {!Element|!Nodelist} elements The element or elements to add CSS classes to.
  * @param {string} classes CSS classes to add.
  */
	function addClasses(elements, classes) {
		if (!isObject(elements) || !isString(classes)) {
			return;
		}

		if (!elements.length) {
			elements = [elements];
		}

		for (var i = 0; i < elements.length; i++) {
			if ('classList' in elements[i]) {
				addClassesWithNative_(elements[i], classes);
			} else {
				addClassesWithoutNative_(elements[i], classes);
			}
		}
	}

	this['metalNamed']['domNamed']['addClasses'] = addClasses; /**
                                                             * Adds the requested CSS classes to an element using classList.
                                                             * @param {!Element} element The element to add CSS classes to.
                                                             * @param {string} classes CSS classes to add.
                                                             * @private
                                                             */

	function addClassesWithNative_(element, classes) {
		classes.split(' ').forEach(function (className) {
			if (className) {
				element.classList.add(className);
			}
		});
	}

	/**
  * Adds the requested CSS classes to an element without using classList.
  * @param {!Element} element The element to add CSS classes to.
  * @param {string} classes CSS classes to add.
  * @private
  */
	function addClassesWithoutNative_(element, classes) {
		var elementClassName = ' ' + element.className + ' ';
		var classesToAppend = '';

		classes = classes.split(' ');

		for (var i = 0; i < classes.length; i++) {
			var className = classes[i];

			if (elementClassName.indexOf(' ' + className + ' ') === -1) {
				classesToAppend += ' ' + className;
			}
		}

		if (classesToAppend) {
			element.className = element.className + classesToAppend;
		}
	}

	/**
  * Adds an event listener to the given element, to be triggered via delegate.
  * @param {!Element} element
  * @param {string} eventName
  * @param {!function()} listener
  * @private
  */
	function addElementListener_(element, eventName, listener) {
		var data = domData.get(element);
		addToArr_(data.listeners, eventName, listener);
	}

	/**
  * Adds an event listener to the given element, to be triggered via delegate
  * selectors.
  * @param {!Element} element
  * @param {string} eventName
  * @param {string} selector
  * @param {!function()} listener
  * @private
  */
	function addSelectorListener_(element, eventName, selector, listener) {
		var data = domData.get(element);
		addToArr_(data.delegating[eventName].selectors, selector, listener);
	}

	/**
  * Adds a value to an array inside an object, creating it first if it doesn't
  * yet exist.
  * @param {!Array} arr
  * @param {string} key
  * @param {*} value
  * @private
  */
	function addToArr_(arr, key, value) {
		if (!arr[key]) {
			arr[key] = [];
		}
		arr[key].push(value);
	}

	/**
  * Attaches a delegate listener, unless there's already one attached.
  * @param {!Element} element
  * @param {string} eventName
  * @private
  */
	function attachDelegateEvent_(element, eventName) {
		var data = domData.get(element);
		if (!data.delegating[eventName]) {
			data.delegating[eventName] = {
				handle: on(element, eventName, handleDelegateEvent_, !!USE_CAPTURE[eventName]),
				selectors: {}
			};
		}
	}

	/**
  * Gets the closest element up the tree from the given element (including
  * itself) that matches the specified selector, or null if none match.
  * @param {Element} element
  * @param {string} selector
  * @return {Element}
  */
	function closest(element, selector) {
		while (element && !match(element, selector)) {
			element = element.parentNode;
		}
		return element;
	}

	this['metalNamed']['domNamed']['closest'] = closest; /**
                                                       * Appends a child node with text or other nodes to a parent node. If
                                                       * child is a HTML string it will be automatically converted to a document
                                                       * fragment before appending it to the parent.
                                                       * @param {!Element} parent The node to append nodes to.
                                                       * @param {!(Element|NodeList|string)} child The thing to append to the parent.
                                                       * @return {!Element} The appended child.
                                                       */

	function append(parent, child) {
		if (isString(child)) {
			child = buildFragment(child);
		}
		if (child instanceof NodeList) {
			var childArr = Array.prototype.slice.call(child);
			for (var i = 0; i < childArr.length; i++) {
				parent.appendChild(childArr[i]);
			}
		} else {
			parent.appendChild(child);
		}
		return child;
	}

	this['metalNamed']['domNamed']['append'] = append; /**
                                                     * Helper for converting a HTML string into a document fragment.
                                                     * @param {string} htmlString The HTML string to convert.
                                                     * @return {!Element} The resulting document fragment.
                                                     */

	function buildFragment(htmlString) {
		var tempDiv = document.createElement('div');
		tempDiv.innerHTML = '<br>' + htmlString;
		tempDiv.removeChild(tempDiv.firstChild);

		var fragment = document.createDocumentFragment();
		while (tempDiv.firstChild) {
			fragment.appendChild(tempDiv.firstChild);
		}
		return fragment;
	}

	this['metalNamed']['domNamed']['buildFragment'] = buildFragment; /**
                                                                   * Checks if the first element contains the second one.
                                                                   * @param {!Element} element1
                                                                   * @param {!Element} element2
                                                                   * @return {boolean}
                                                                   */

	function contains(element1, element2) {
		if (isDocument(element1)) {
			// document.contains is not defined on IE9, so call it on documentElement instead.
			return element1.documentElement.contains(element2);
		} else {
			return element1.contains(element2);
		}
	}

	this['metalNamed']['domNamed']['contains'] = contains; /**
                                                         * Listens to the specified event on the given DOM element, but only calls the
                                                         * given callback listener when it's triggered by elements that match the
                                                         * given selector or target element.
                                                         * @param {!Element} element The DOM element the event should be listened on.
                                                         * @param {string} eventName The name of the event to listen to.
                                                         * @param {!Element|string} selectorOrTarget Either an element or css selector
                                                         *     that should match the event for the listener to be triggered.
                                                         * @param {!function(!Object)} callback Function to be called when the event
                                                         *     is triggered. It will receive the normalized event object.
                                                         * @param {boolean=} opt_default Optional flag indicating if this is a default
                                                         *     listener. That means that it would only be executed after all non
                                                         *     default listeners, and only if the event isn't prevented via
                                                         *     `preventDefault`.
                                                         * @return {!EventHandle} Can be used to remove the listener.
                                                         */

	function delegate(element, eventName, selectorOrTarget, callback, opt_default) {
		var customConfig = customEvents[eventName];
		if (customConfig && customConfig.delegate) {
			eventName = customConfig.originalEvent;
			callback = customConfig.handler.bind(customConfig, callback);
		}

		if (opt_default) {
			// Wrap callback so we don't set property directly on it.
			callback = callback.bind();
			callback.defaultListener_ = true;
		}

		attachDelegateEvent_(element, eventName);
		if (isString(selectorOrTarget)) {
			addSelectorListener_(element, eventName, selectorOrTarget, callback);
		} else {
			addElementListener_(selectorOrTarget, eventName, callback);
		}

		return new DomDelegatedEventHandle(isString(selectorOrTarget) ? element : selectorOrTarget, eventName, callback, isString(selectorOrTarget) ? selectorOrTarget : null);
	}

	this['metalNamed']['domNamed']['delegate'] = delegate; /**
                                                         * Verifies if the element is able to trigger the Click event,
                                                         * simulating browsers behaviour, avoiding event listeners to be called by triggerEvent method.
                                                         * @param {Element} node Element to be checked.
                                                         * @param {string} eventName The event name.
                                                         * @private
                                                         */

	function isAbleToInteractWith_(node, eventName, opt_eventObj) {
		if (opt_eventObj && eventName === 'click' && opt_eventObj.button === 2) {
			// Firefox triggers "click" events on the document for right clicks. This
			// causes our delegate logic to trigger it for regular elements too, which
			// shouldn't happen. Ignoring them here.
			return false;
		}

		var matchesSelector = ['BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'FIELDSET'];
		if (eventName === 'click' && matchesSelector.indexOf(node.tagName) > -1) {
			return !(node.disabled || parent(node, 'fieldset[disabled]'));
		}
		return true;
	}

	/**
  * Inserts node in document as last element.
  * @param {Element} node Element to remove children from.
  */
	function enterDocument(node) {
		node && append(document.body, node);
	}

	this['metalNamed']['domNamed']['enterDocument'] = enterDocument; /**
                                                                   * Removes node from document.
                                                                   * @param {Element} node Element to remove children from.
                                                                   */

	function exitDocument(node) {
		if (node && node.parentNode) {
			node.parentNode.removeChild(node);
		}
	}

	this['metalNamed']['domNamed']['exitDocument'] = exitDocument; /**
                                                                 * This is called when an event is triggered by a delegate listener. All
                                                                 * matching listeners of this event type from `target` to `currentTarget` will
                                                                 * be triggered.
                                                                 * @param {!Event} event The event payload.
                                                                 * @return {boolean} False if at least one of the triggered callbacks returns
                                                                 *     false, or true otherwise.
                                                                 * @private
                                                                 */

	function handleDelegateEvent_(event) {
		normalizeDelegateEvent_(event);
		var currElement = isDef(event[NEXT_TARGET]) ? event[NEXT_TARGET] : event.target;
		var ret = true;
		var container = event.currentTarget;
		var limit = event.currentTarget.parentNode;
		var defFns = [];

		ret &= triggerDelegatedListeners_(container, currElement, event, limit, defFns);
		ret &= triggerDefaultDelegatedListeners_(defFns, event);

		event.delegateTarget = null;
		event[NEXT_TARGET] = limit;
		return ret;
	}

	/**
  * Checks if the given element has the requested css class.
  * @param {!Element} element
  * @param {string} className
  * @return {boolean}
  */
	function hasClass(element, className) {
		if ('classList' in element) {
			return hasClassWithNative_(element, className);
		} else {
			return hasClassWithoutNative_(element, className);
		}
	}

	this['metalNamed']['domNamed']['hasClass'] = hasClass; /**
                                                         * Checks if the given element has the requested css class using classList.
                                                         * @param {!Element} element
                                                         * @param {string} className
                                                         * @return {boolean}
                                                         * @private
                                                         */

	function hasClassWithNative_(element, className) {
		return element.classList.contains(className);
	}

	/**
  * Checks if the given element has the requested css class without using classList.
  * @param {!Element} element
  * @param {string} className
  * @return {boolean}
  * @private
  */
	function hasClassWithoutNative_(element, className) {
		return (' ' + element.className + ' ').indexOf(' ' + className + ' ') >= 0;
	}

	/**
  * Checks if the given element is empty or not.
  * @param {!Element} element
  * @return {boolean}
  */
	function isEmpty(element) {
		return element.childNodes.length === 0;
	}

	this['metalNamed']['domNamed']['isEmpty'] = isEmpty; /**
                                                       * Check if an element matches a given selector.
                                                       * @param {Element} element
                                                       * @param {string} selector
                                                       * @return {boolean}
                                                       */

	function match(element, selector) {
		if (!element || element.nodeType !== 1) {
			return false;
		}

		var p = Element.prototype;
		var m = p.matches || p.webkitMatchesSelector || p.mozMatchesSelector || p.msMatchesSelector || p.oMatchesSelector;
		if (m) {
			return m.call(element, selector);
		}

		return matchFallback_(element, selector);
	}

	this['metalNamed']['domNamed']['match'] = match; /**
                                                   * Check if an element matches a given selector, using an internal implementation
                                                   * instead of calling existing javascript functions.
                                                   * @param {Element} element
                                                   * @param {string} selector
                                                   * @return {boolean}
                                                   * @private
                                                   */

	function matchFallback_(element, selector) {
		var nodes = document.querySelectorAll(selector, element.parentNode);
		for (var i = 0; i < nodes.length; ++i) {
			if (nodes[i] === element) {
				return true;
			}
		}
		return false;
	}

	/**
  * Returns the next sibling of the given element that matches the specified
  * selector, or null if there is none.
  * @param {!Element} element
  * @param {?string} selector
  */
	function next(element, selector) {
		do {
			element = element.nextSibling;
			if (element && match(element, selector)) {
				return element;
			}
		} while (element);
		return null;
	}

	this['metalNamed']['domNamed']['next'] = next; /**
                                                 * Normalizes the event payload for delegate listeners.
                                                 * @param {!Event} event
                                                 * @private
                                                 */

	function normalizeDelegateEvent_(event) {
		event.stopPropagation = stopPropagation_;
		event.stopImmediatePropagation = stopImmediatePropagation_;
	}

	/**
  * Listens to the specified event on the given DOM element. This function normalizes
  * DOM event payloads and functions so they'll work the same way on all supported
  * browsers.
  * @param {!Element|string} element The DOM element to listen to the event on, or
  *   a selector that should be delegated on the entire document.
  * @param {string} eventName The name of the event to listen to.
  * @param {!function(!Object)} callback Function to be called when the event is
  *   triggered. It will receive the normalized event object.
  * @param {boolean} opt_capture Flag indicating if listener should be triggered
  *   during capture phase, instead of during the bubbling phase. Defaults to false.
  * @return {!DomEventHandle} Can be used to remove the listener.
  */
	function on(element, eventName, callback, opt_capture) {
		if (isString(element)) {
			return delegate(document, eventName, element, callback);
		}
		var customConfig = customEvents[eventName];
		if (customConfig && customConfig.event) {
			eventName = customConfig.originalEvent;
			callback = customConfig.handler.bind(customConfig, callback);
		}
		element.addEventListener(eventName, callback, opt_capture);
		return new DomEventHandle(element, eventName, callback, opt_capture);
	}

	this['metalNamed']['domNamed']['on'] = on; /**
                                             * Listens to the specified event on the given DOM element once. This
                                             * function normalizes DOM event payloads and functions so they'll work the
                                             * same way on all supported browsers.
                                             * @param {!Element} element The DOM element to listen to the event on.
                                             * @param {string} eventName The name of the event to listen to.
                                             * @param {!function(!Object)} callback Function to be called when the event
                                             *   is triggered. It will receive the normalized event object.
                                             * @return {!DomEventHandle} Can be used to remove the listener.
                                             */

	function once(element, eventName, callback) {
		var domEventHandle = on(element, eventName, function () {
			domEventHandle.removeListener();
			return callback.apply(this, arguments);
		});
		return domEventHandle;
	}

	this['metalNamed']['domNamed']['once'] = once; /**
                                                 * Gets the first parent from the given element that matches the specified
                                                 * selector, or null if none match.
                                                 * @param {!Element} element
                                                 * @param {string} selector
                                                 * @return {Element}
                                                 */

	function parent(element, selector) {
		return closest(element.parentNode, selector);
	}

	this['metalNamed']['domNamed']['parent'] = parent; /**
                                                     * Registers a custom event.
                                                     * @param {string} eventName The name of the custom event.
                                                     * @param {!Object} customConfig An object with information about how the event
                                                     *   should be handled.
                                                     */

	function registerCustomEvent(eventName, customConfig) {
		customEvents[eventName] = customConfig;
	}

	this['metalNamed']['domNamed']['registerCustomEvent'] = registerCustomEvent; /**
                                                                               * Removes all the child nodes on a DOM node.
                                                                               * @param {Element} node Element to remove children from.
                                                                               */

	function removeChildren(node) {
		var child;
		while (child = node.firstChild) {
			node.removeChild(child);
		}
	}

	this['metalNamed']['domNamed']['removeChildren'] = removeChildren; /**
                                                                     * Removes the requested CSS classes from an element.
                                                                     * @param {!Element|!NodeList} elements The element or elements to remove CSS classes from.
                                                                     * @param {string} classes CSS classes to remove.
                                                                     */

	function removeClasses(elements, classes) {
		if (!isObject(elements) || !isString(classes)) {
			return;
		}

		if (!elements.length) {
			elements = [elements];
		}

		for (var i = 0; i < elements.length; i++) {
			if ('classList' in elements[i]) {
				removeClassesWithNative_(elements[i], classes);
			} else {
				removeClassesWithoutNative_(elements[i], classes);
			}
		}
	}

	this['metalNamed']['domNamed']['removeClasses'] = removeClasses; /**
                                                                   * Removes the requested CSS classes from an element using classList.
                                                                   * @param {!Element} element The element to remove CSS classes from.
                                                                   * @param {string} classes CSS classes to remove.
                                                                   * @private
                                                                   */

	function removeClassesWithNative_(element, classes) {
		classes.split(' ').forEach(function (className) {
			if (className) {
				element.classList.remove(className);
			}
		});
	}

	/**
  * Removes the requested CSS classes from an element without using classList.
  * @param {!Element} element The element to remove CSS classes from.
  * @param {string} classes CSS classes to remove.
  * @private
  */
	function removeClassesWithoutNative_(element, classes) {
		var elementClassName = ' ' + element.className + ' ';

		classes = classes.split(' ');

		for (var i = 0; i < classes.length; i++) {
			elementClassName = elementClassName.replace(' ' + classes[i] + ' ', ' ');
		}

		element.className = elementClassName.trim();
	}

	/**
  * Replaces the first element with the second.
  * @param {Element} element1
  * @param {Element} element2
  */
	function replace(element1, element2) {
		if (element1 && element2 && element1 !== element2 && element1.parentNode) {
			element1.parentNode.insertBefore(element2, element1);
			element1.parentNode.removeChild(element1);
		}
	}

	this['metalNamed']['domNamed']['replace'] = replace; /**
                                                       * The function that replaces `stopImmediatePropagation_` for events.
                                                       * @private
                                                       */

	function stopImmediatePropagation_() {
		var event = this; // jshint ignore:line
		event.stopped = true;
		event.stoppedImmediate = true;
		Event.prototype.stopImmediatePropagation.call(event);
	}

	/**
  * The function that replaces `stopPropagation` for events.
  * @private
  */
	function stopPropagation_() {
		var event = this; // jshint ignore:line
		event.stopped = true;
		Event.prototype.stopPropagation.call(event);
	}

	/**
  * Checks if the given element supports the given event type.
  * @param {!Element|string} element The DOM element or element tag name to check.
  * @param {string} eventName The name of the event to check.
  * @return {boolean}
  */
	function supportsEvent(element, eventName) {
		if (customEvents[eventName]) {
			return true;
		}

		if (isString(element)) {
			if (!elementsByTag_[element]) {
				elementsByTag_[element] = document.createElement(element);
			}
			element = elementsByTag_[element];
		}
		return 'on' + eventName in element;
	}

	this['metalNamed']['domNamed']['supportsEvent'] = supportsEvent; /**
                                                                   * This triggers all default matched delegated listeners of a given event type.
                                                                   * @param {!Array} defaultFns Array to collect default listeners in, instead
                                                                   * @param {!Event} event
                                                                   * @return {boolean} False if at least one of the triggered callbacks returns
                                                                   *     false, or true otherwise.
                                                                   * @private
                                                                   */

	function triggerDefaultDelegatedListeners_(defFns, event) {
		var ret = true;

		for (var i = 0; i < defFns.length && !event.defaultPrevented; i++) {
			event.delegateTarget = defFns[i].element;
			ret &= defFns[i].fn(event);
		}

		return ret;
	}

	/**
  * This triggers all matched delegated listeners of a given event type when its
  * delegated target is able to interact.
  * @param {!Element} container
  * @param {!Element} currElement
  * @param {!Event} event
  * @param {!Element} limit the fartest parent of the given element
  * @param {!Array} defaultFns Array to collect default listeners in, instead
  *     of running them.
  * @return {boolean} False if at least one of the triggered callbacks returns
  *     false, or true otherwise.
  * @private
  */
	function triggerDelegatedListeners_(container, currElement, event, limit, defaultFns) {
		var ret = true;

		while (currElement && currElement !== limit && !event.stopped) {
			if (isAbleToInteractWith_(currElement, event.type, event)) {
				event.delegateTarget = currElement;
				ret &= triggerMatchedListeners_(container, currElement, event, defaultFns);
			}
			currElement = currElement.parentNode;
		}

		return ret;
	}

	/**
  * Converts the given argument to a DOM element. Strings are assumed to
  * be selectors, and so a matched element will be returned. If the arg
  * is already a DOM element it will be the return value.
  * @param {string|Element|Document} selectorOrElement
  * @return {Element} The converted element, or null if none was found.
  */
	function toElement(selectorOrElement) {
		if (isElement(selectorOrElement) || isDocument(selectorOrElement)) {
			return selectorOrElement;
		} else if (isString(selectorOrElement)) {
			if (selectorOrElement[0] === '#' && selectorOrElement.indexOf(' ') === -1) {
				return document.getElementById(selectorOrElement.substr(1));
			} else {
				return document.querySelector(selectorOrElement);
			}
		} else {
			return null;
		}
	}

	this['metalNamed']['domNamed']['toElement'] = toElement; /**
                                                           * Adds or removes one or more classes from an element. If any of the classes
                                                           * is present, it will be removed from the element, or added otherwise.
                                                           * @param {!Element} element The element which classes will be toggled.
                                                           * @param {string} classes The classes which have to added or removed from the element.
                                                           */

	function toggleClasses(element, classes) {
		if (!isObject(element) || !isString(classes)) {
			return;
		}

		if ('classList' in element) {
			toggleClassesWithNative_(element, classes);
		} else {
			toggleClassesWithoutNative_(element, classes);
		}
	}

	this['metalNamed']['domNamed']['toggleClasses'] = toggleClasses; /**
                                                                   * Adds or removes one or more classes from an element using classList.
                                                                   * If any of the classes is present, it will be removed from the element,
                                                                   * or added otherwise.
                                                                   * @param {!Element} element The element which classes will be toggled.
                                                                   * @param {string} classes The classes which have to added or removed from the element.
                                                                   * @private
                                                                   */

	function toggleClassesWithNative_(element, classes) {
		classes.split(' ').forEach(function (className) {
			element.classList.toggle(className);
		});
	}

	/**
  * Adds or removes one or more classes from an element without using classList.
  * If any of the classes is present, it will be removed from the element,
  * or added otherwise.
  * @param {!Element} element The element which classes will be toggled.
  * @param {string} classes The classes which have to added or removed from the element.
  * @private
  */
	function toggleClassesWithoutNative_(element, classes) {
		var elementClassName = ' ' + element.className + ' ';

		classes = classes.split(' ');

		for (var i = 0; i < classes.length; i++) {
			var className = ' ' + classes[i] + ' ';
			var classIndex = elementClassName.indexOf(className);

			if (classIndex === -1) {
				elementClassName = elementClassName + classes[i] + ' ';
			} else {
				elementClassName = elementClassName.substring(0, classIndex) + ' ' + elementClassName.substring(classIndex + className.length);
			}
		}

		element.className = elementClassName.trim();
	}

	/**
  * Triggers the specified event on the given element.
  * NOTE: This should mostly be used for testing, not on real code.
  * @param {!Element} element The node that should trigger the event.
  * @param {string} eventName The name of the event to be triggred.
  * @param {Object=} opt_eventObj An object with data that should be on the
  *   triggered event's payload.
  */
	function triggerEvent(element, eventName, opt_eventObj) {
		if (isAbleToInteractWith_(element, eventName, opt_eventObj)) {
			var eventObj = document.createEvent('HTMLEvents');
			eventObj.initEvent(eventName, true, true);
			object.mixin(eventObj, opt_eventObj);
			element.dispatchEvent(eventObj);
		}
	}

	this['metalNamed']['domNamed']['triggerEvent'] = triggerEvent; /**
                                                                 * Triggers the given listeners array.
                                                                 * @param {Array<!function()>} listeners
                                                                 * @param {!Event} event
                                                                 * @param {!Element} element
                                                                 * @param {!Array} defaultFns Array to collect default listeners in, instead
                                                                 *     of running them.
                                                                 * @return {boolean} False if at least one of the triggered callbacks returns
                                                                 *     false, or true otherwise.
                                                                 * @private
                                                                 */

	function triggerListeners_(listeners, event, element, defaultFns) {
		var ret = true;
		listeners = listeners || [];
		for (var i = 0; i < listeners.length && !event.stoppedImmediate; i++) {
			if (listeners[i].defaultListener_) {
				defaultFns.push({
					element: element,
					fn: listeners[i]
				});
			} else {
				ret &= listeners[i](event);
			}
		}
		return ret;
	}

	/**
  * Triggers all listeners for the given event type that are stored in the
  * specified element.
  * @param {!Element} container
  * @param {!Element} element
  * @param {!Event} event
  * @param {!Array} defaultFns Array to collect default listeners in, instead
  *     of running them.
  * @return {boolean} False if at least one of the triggered callbacks returns
  *     false, or true otherwise.
  * @private
  */
	function triggerMatchedListeners_(container, element, event, defaultFns) {
		var data = domData.get(element);
		var listeners = data.listeners[event.type];
		var ret = triggerListeners_(listeners, event, element, defaultFns);

		var selectorsMap = domData.get(container).delegating[event.type].selectors;
		var selectors = Object.keys(selectorsMap);
		for (var i = 0; i < selectors.length && !event.stoppedImmediate; i++) {
			if (match(element, selectors[i])) {
				listeners = selectorsMap[selectors[i]];
				ret &= triggerListeners_(listeners, event, element, defaultFns);
			}
		}

		return ret;
	}
}).call(this);
'use strict';

// This file exists just for backwards compatibility, making sure that old
// default imports for this file still work. It's best to use the named exports
// for each function instead though, since that allows bundlers like Rollup to
// reduce the bundle size by removing unused code.

(function () {
  var dom = this['metalNamed']['domNamed'];
  this['metal']['dom'] = dom;
  this['metalNamed']['dom'] = this['metalNamed']['dom'] || {};
  this['metalNamed']['dom']['dom'] = dom;
  Object.keys(this['metalNamed']['domNamed']).forEach(function (key) {
    this['metalNamed']['dom'][key] = this['metalNamed']['domNamed'][key];
  });
}).call(this);
'use strict';

(function () {
	var delegate = this['metalNamed']['dom']['delegate'];
	var on = this['metalNamed']['dom']['on'];
	var supportsEvent = this['metalNamed']['dom']['supportsEvent'];
	var EventEmitterProxy = this['metalNamed']['events']['EventEmitterProxy'];

	/**
  * DomEventEmitterProxy utility. It extends `EventEmitterProxy` to also accept
  * dom elements as origin emitters.
  * @extends {EventEmitterProxy}
  */

	var DomEventEmitterProxy = function (_EventEmitterProxy) {
		babelHelpers.inherits(DomEventEmitterProxy, _EventEmitterProxy);

		function DomEventEmitterProxy() {
			babelHelpers.classCallCheck(this, DomEventEmitterProxy);
			return babelHelpers.possibleConstructorReturn(this, (DomEventEmitterProxy.__proto__ || Object.getPrototypeOf(DomEventEmitterProxy)).apply(this, arguments));
		}

		babelHelpers.createClass(DomEventEmitterProxy, [{
			key: 'addListener_',

			/**
    * Adds the given listener for the given event.
    * @param {string} event
    * @param {!function()} listener
    * @return {!EventHandle} The listened event's handle.
    * @protected
    * @override
    */
			value: function addListener_(event, listener) {
				if (this.originEmitter_.addEventListener) {
					if (this.isDelegateEvent_(event)) {
						var index = event.indexOf(':', 9);
						var eventName = event.substring(9, index);
						var selector = event.substring(index + 1);
						return delegate(this.originEmitter_, eventName, selector, listener);
					} else {
						return on(this.originEmitter_, event, listener);
					}
				} else {
					return babelHelpers.get(DomEventEmitterProxy.prototype.__proto__ || Object.getPrototypeOf(DomEventEmitterProxy.prototype), 'addListener_', this).call(this, event, listener);
				}
			}

			/**
    * Checks if the given event is of the delegate type.
    * @param {string} event
    * @return {boolean}
    * @protected
    */

		}, {
			key: 'isDelegateEvent_',
			value: function isDelegateEvent_(event) {
				return event.substr(0, 9) === 'delegate:';
			}

			/**
    * Checks if the given event is supported by the origin element.
    * @param {string} event
    * @protected
    */

		}, {
			key: 'isSupportedDomEvent_',
			value: function isSupportedDomEvent_(event) {
				if (!this.originEmitter_ || !this.originEmitter_.addEventListener) {
					return true;
				}
				return this.isDelegateEvent_(event) && event.indexOf(':', 9) !== -1 || supportsEvent(this.originEmitter_, event);
			}

			/**
    * Checks if the given event should be proxied.
    * @param {string} event
    * @return {boolean}
    * @protected
    * @override
    */

		}, {
			key: 'shouldProxyEvent_',
			value: function shouldProxyEvent_(event) {
				return babelHelpers.get(DomEventEmitterProxy.prototype.__proto__ || Object.getPrototypeOf(DomEventEmitterProxy.prototype), 'shouldProxyEvent_', this).call(this, event) && this.isSupportedDomEvent_(event);
			}
		}]);
		return DomEventEmitterProxy;
	}(EventEmitterProxy);

	this['metal']['DomEventEmitterProxy'] = DomEventEmitterProxy;
}).call(this);
'use strict';

(function () {
	var append = this['metalNamed']['dom']['append'];
	var string = this['metalNamed']['metal']['string'];

	/**
  * Class with static methods responsible for doing browser feature checks.
  */

	var features = function () {
		function features() {
			babelHelpers.classCallCheck(this, features);
		}

		babelHelpers.createClass(features, null, [{
			key: 'checkAnimationEventName',

			/**
    * Some browsers still supports prefixed animation events. This method can
    * be used to retrieve the current browser event name for both, animation
    * and transition.
    * @return {object}
    */
			value: function checkAnimationEventName() {
				if (features.animationEventName_ === undefined) {
					features.animationEventName_ = {
						animation: features.checkAnimationEventName_('animation'),
						transition: features.checkAnimationEventName_('transition')
					};
				}
				return features.animationEventName_;
			}

			/**
    * @protected
    * @param {string} type Type to test: animation, transition.
    * @return {string} Browser event name.
    */

		}, {
			key: 'checkAnimationEventName_',
			value: function checkAnimationEventName_(type) {
				var prefixes = ['Webkit', 'MS', 'O', ''];
				var typeTitleCase = string.replaceInterval(type, 0, 1, type.substring(0, 1).toUpperCase());
				var suffixes = [typeTitleCase + 'End', typeTitleCase + 'End', typeTitleCase + 'End', type + 'end'];
				for (var i = 0; i < prefixes.length; i++) {
					if (features.animationElement_.style[prefixes[i] + typeTitleCase] !== undefined) {
						return prefixes[i].toLowerCase() + suffixes[i];
					}
				}
				return type + 'end';
			}

			/**
    * Some browsers (like IE9) change the order of element attributes, when html
    * is rendered. This method can be used to check if this behavior happens on
    * the current browser.
    * @return {boolean}
    */

		}, {
			key: 'checkAttrOrderChange',
			value: function checkAttrOrderChange() {
				if (features.attrOrderChange_ === undefined) {
					var originalContent = '<div data-component="" data-ref=""></div>';
					var element = document.createElement('div');
					append(element, originalContent);
					features.attrOrderChange_ = originalContent !== element.innerHTML;
				}
				return features.attrOrderChange_;
			}
		}]);
		return features;
	}();

	features.animationElement_ = document.createElement('div');
	features.animationEventName_ = undefined;
	features.attrOrderChange_ = undefined;

	this['metal']['features'] = features;
}).call(this);
'use strict';

(function () {
	var async = this['metalNamed']['metal']['async'];
	var exitDocument = this['metalNamed']['dom']['exitDocument'];
	var once = this['metalNamed']['dom']['once'];

	/**
  * Utility functions for running javascript code in the global scope.
  */

	var globalEval = function () {
		function globalEval() {
			babelHelpers.classCallCheck(this, globalEval);
		}

		babelHelpers.createClass(globalEval, null, [{
			key: 'run',

			/**
    * Evaluates the given string in the global scope.
    * @param {string} text
    * @param {function()=} opt_appendFn Optional function to append the node
    *   into document.
    * @return {Element} script
    */
			value: function run(text, opt_appendFn) {
				var script = document.createElement('script');
				script.text = text;
				if (opt_appendFn) {
					opt_appendFn(script);
				} else {
					document.head.appendChild(script);
				}
				exitDocument(script);
				return script;
			}

			/**
    * Evaluates the given javascript file in the global scope.
    * @param {string} src The file's path.
    * @param {function()=} opt_callback Optional function to be called
    *   when the script has been run.
    * @param {function()=} opt_appendFn Optional function to append the node
    *   into document.
    * @return {Element} script
    */

		}, {
			key: 'runFile',
			value: function runFile(src, opt_callback, opt_appendFn) {
				var script = document.createElement('script');
				script.src = src;

				var callback = function callback() {
					exitDocument(script);
					opt_callback && opt_callback();
				};
				once(script, 'load', callback);
				once(script, 'error', callback);

				if (opt_appendFn) {
					opt_appendFn(script);
				} else {
					document.head.appendChild(script);
				}

				return script;
			}

			/**
    * Evaluates the code referenced by the given script element.
    * @param {!Element} script
    * @param {function()=} opt_callback Optional function to be called
    *   when the script has been run.
    * @param {function()=} opt_appendFn Optional function to append the node
    *   into document.
    * @return {Element} script
    */

		}, {
			key: 'runScript',
			value: function runScript(script, opt_callback, opt_appendFn) {
				var callback = function callback() {
					opt_callback && opt_callback();
				};
				if (script.type && script.type !== 'text/javascript') {
					async.nextTick(callback);
					return;
				}
				exitDocument(script);
				if (script.src) {
					return globalEval.runFile(script.src, opt_callback, opt_appendFn);
				} else {
					async.nextTick(callback);
					return globalEval.run(script.text, opt_appendFn);
				}
			}

			/**
    * Evaluates any script tags present in the given element.
    * @param {!Element} element
    * @param {function()=} opt_callback Optional function to be called
    *   when the script has been run.
    * @param {function()=} opt_appendFn Optional function to append the node
    *   into document.
    */

		}, {
			key: 'runScriptsInElement',
			value: function runScriptsInElement(element, opt_callback, opt_appendFn) {
				var scripts = element.querySelectorAll('script');
				if (scripts.length) {
					globalEval.runScriptsInOrder(scripts, 0, opt_callback, opt_appendFn);
				} else if (opt_callback) {
					async.nextTick(opt_callback);
				}
			}

			/**
    * Runs the given scripts elements in the order that they appear.
    * @param {!NodeList} scripts
    * @param {number} index
    * @param {function()=} opt_callback Optional function to be called
    *   when the script has been run.
    * @param {function()=} opt_appendFn Optional function to append the node
    *   into document.
    */

		}, {
			key: 'runScriptsInOrder',
			value: function runScriptsInOrder(scripts, index, opt_callback, opt_appendFn) {
				globalEval.runScript(scripts.item(index), function () {
					if (index < scripts.length - 1) {
						globalEval.runScriptsInOrder(scripts, index + 1, opt_callback, opt_appendFn);
					} else if (opt_callback) {
						async.nextTick(opt_callback);
					}
				}, opt_appendFn);
			}
		}]);
		return globalEval;
	}();

	this['metal']['globalEval'] = globalEval;
}).call(this);
'use strict';

(function () {
	var async = this['metalNamed']['metal']['async'];
	var once = this['metalNamed']['dom']['once'];

	/**
  * Utility functions for running styles.
  */

	var globalEvalStyles = function () {
		function globalEvalStyles() {
			babelHelpers.classCallCheck(this, globalEvalStyles);
		}

		babelHelpers.createClass(globalEvalStyles, null, [{
			key: 'run',

			/**
    * Evaluates the given style.
    * @param {string} text
    * @param {function()=} opt_appendFn Optional function to append the node
    *   into document.
    * @return {Element} style
    */
			value: function run(text, opt_appendFn) {
				var style = document.createElement('style');
				style.innerHTML = text;
				if (opt_appendFn) {
					opt_appendFn(style);
				} else {
					document.head.appendChild(style);
				}
				return style;
			}

			/**
    * Evaluates the given style file.
    * @param {string} href The file's path.
    * @param {function()=} opt_callback Optional function to be called
    *   when the styles has been run.
    * @param {function()=} opt_appendFn Optional function to append the node
    *   into document.
    * @return {Element} style
    */

		}, {
			key: 'runFile',
			value: function runFile(href, opt_callback, opt_appendFn) {
				var link = document.createElement('link');
				link.rel = 'stylesheet';
				link.href = href;
				globalEvalStyles.runStyle(link, opt_callback, opt_appendFn);
				return link;
			}

			/**
    * Evaluates the code referenced by the given style/link element.
    * @param {!Element} style
    * @param {function()=} opt_callback Optional function to be called
    *   when the script has been run.
    * @param {function()=} opt_appendFn Optional function to append the node
    *   into document.
    *  @return {Element} style
    */

		}, {
			key: 'runStyle',
			value: function runStyle(style, opt_callback, opt_appendFn) {
				var callback = function callback() {
					opt_callback && opt_callback();
				};
				if (style.rel && style.rel !== 'stylesheet') {
					async.nextTick(callback);
					return;
				}

				if (style.tagName === 'STYLE') {
					async.nextTick(callback);
				} else {
					once(style, 'load', callback);
					once(style, 'error', callback);
				}

				if (opt_appendFn) {
					opt_appendFn(style);
				} else {
					document.head.appendChild(style);
				}

				return style;
			}

			/**
    * Evaluates any style present in the given element.
    * @param {!Element} element
    * @param {function()=} opt_callback Optional function to be called when the
    *   style has been run.
    * @param {function()=} opt_appendFn Optional function to append the node
    *   into document.
    */

		}, {
			key: 'runStylesInElement',
			value: function runStylesInElement(element, opt_callback, opt_appendFn) {
				var styles = element.querySelectorAll('style,link');
				if (styles.length === 0 && opt_callback) {
					async.nextTick(opt_callback);
					return;
				}

				var loadCount = 0;
				var callback = function callback() {
					if (opt_callback && ++loadCount === styles.length) {
						async.nextTick(opt_callback);
					}
				};
				for (var i = 0; i < styles.length; i++) {
					globalEvalStyles.runStyle(styles[i], callback, opt_appendFn);
				}
			}
		}]);
		return globalEvalStyles;
	}();

	this['metal']['globalEvalStyles'] = globalEvalStyles;
}).call(this);
'use strict';

(function () {
	var registerCustomEvent = this['metalNamed']['dom']['registerCustomEvent'];
	var features = this['metal']['features'];


	var mouseEventMap = {
		mouseenter: 'mouseover',
		mouseleave: 'mouseout',
		pointerenter: 'pointerover',
		pointerleave: 'pointerout'
	};
	Object.keys(mouseEventMap).forEach(function (eventName) {
		registerCustomEvent(eventName, {
			delegate: true,
			handler: function handler(callback, event) {
				var related = event.relatedTarget;
				var target = event.delegateTarget;
				if (!related || related !== target && !target.contains(related)) {
					event.customType = eventName;
					return callback(event);
				}
			},
			originalEvent: mouseEventMap[eventName]
		});
	});

	var animationEventMap = {
		animation: 'animationend',
		transition: 'transitionend'
	};
	Object.keys(animationEventMap).forEach(function (eventType) {
		var eventName = animationEventMap[eventType];
		registerCustomEvent(eventName, {
			event: true,
			delegate: true,
			handler: function handler(callback, event) {
				event.customType = eventName;
				return callback(event);
			},
			originalEvent: features.checkAnimationEventName()[eventType]
		});
	});
}).call(this);
'use strict';

(function () {
  var dom = this['metal']['dom'];
  var domData = this['metal']['domData'];
  var DomEventEmitterProxy = this['metal']['DomEventEmitterProxy'];
  var DomEventHandle = this['metal']['DomEventHandle'];
  var features = this['metal']['features'];
  var globalEval = this['metal']['globalEval'];
  var globalEvalStyles = this['metal']['globalEvalStyles'];
  this['metalNamed']['dom'] = this['metalNamed']['dom'] || {};
  Object.keys(this['metalNamed']['dom']).forEach(function (key) {
    this['metalNamed']['dom'][key] = this['metalNamed']['dom'][key];
  });
  this['metalNamed']['dom']['domData'] = domData;
  this['metalNamed']['dom']['DomEventEmitterProxy'] = DomEventEmitterProxy;
  this['metalNamed']['dom']['DomEventHandle'] = DomEventHandle;
  this['metalNamed']['dom']['features'] = features;
  this['metalNamed']['dom']['globalEval'] = globalEval;
  this['metalNamed']['dom']['globalEvalStyles'] = globalEvalStyles;
  this['metal']['dom'] = dom;
}).call(this);
'use strict';

(function () {
	var getFunctionName = this['metalNamed']['metal']['getFunctionName'];
	var isDef = this['metalNamed']['metal']['isDef'];
	var isDefAndNotNull = this['metalNamed']['metal']['isDefAndNotNull'];
	var isNull = this['metalNamed']['metal']['isNull'];

	/**
  * Provides access to various type validators that will return an
  * instance of Error when validation fails. Note that all type validators
  * will also accept null or undefined values. To not accept these you should
  * instead make your state property required.
  */

	var validators = {
		any: function any() {
			return function () {
				return true;
			};
		},
		array: validateType('array'),
		bool: validateType('boolean'),
		func: validateType('function'),
		number: validateType('number'),
		object: validateType('object'),
		string: validateType('string'),

		/**
   * Creates a validator that checks the values of an array against a type.
   * @param {function()} validator Type validator to check each index against.
   * @return {function()} Validator.
   */
		arrayOf: function arrayOf(validator) {
			return maybe(function (value, name, context) {
				var result = validators.array(value, name, context);
				if (isInvalid(result)) {
					return result;
				}
				for (var i = 0; i < value.length; i++) {
					if (isInvalid(validator(value[i], name, context))) {
						return composeError('Expected an array of single type', name, context);
					}
				}
				return true;
			});
		},

		/**
   * Creates a validator that compares a value to a specific class.
   * @param {function()} expectedClass Class to check value against.
   * @return {function()} Validator.
   */
		instanceOf: function instanceOf(expectedClass) {
			return maybe(function (value, name, context) {
				if (!(value instanceof expectedClass)) {
					return composeError('Expected instance of ' + expectedClass, name, context);
				}
				return true;
			});
		},

		/**
   * Creates a validator that checks the values of an object against a type.
   * @param {function()} typeValidator Validator to check value against.
   * @return {function()} Validator.
   */
		objectOf: function objectOf(typeValidator) {
			return maybe(function (value, name, context) {
				for (var key in value) {
					if (isInvalid(typeValidator(value[key]))) {
						return composeError('Expected object of one type', name, context);
					}
				}
				return true;
			});
		},

		/**
   * Creates a validator that checks equality against specific values.
   * @param {!Array} arrayOfValues Array of values to check equality against.
   * @return {function()} Validator.
   */
		oneOf: function oneOf(arrayOfValues) {
			return maybe(function (value, name, context) {
				var result = validators.array(arrayOfValues, name, context);
				if (isInvalid(result)) {
					return result;
				}

				for (var i = 0; i < arrayOfValues.length; i++) {
					var oneOfValue = arrayOfValues[i];
					if (value === oneOfValue) {
						return true;
					}
				}

				return composeError('Expected one of given values.', name, context);
			});
		},

		/**
   * Creates a validator that checks a value against multiple types and only has
   * to pass one.
   * @param {!Array} arrayOfTypeValidators Array of validators to check value
   *     against.
   * @return {function()} Validator.
   */
		oneOfType: function oneOfType(arrayOfTypeValidators) {
			return maybe(function (value, name, context) {
				var result = validators.array(arrayOfTypeValidators, name, context);
				if (isInvalid(result)) {
					return result;
				}

				for (var i = 0; i < arrayOfTypeValidators.length; i++) {
					if (!isInvalid(arrayOfTypeValidators[i](value, name, context))) {
						return true;
					}
				}

				return composeError('Expected one of given types.', name, context);
			});
		},

		/**
   * Creates a validator that checks the shape of an object.
   * @param {!Object} shape An object containing type validators for each key.
   * @return {function()} Validator.
   */
		shapeOf: function shapeOf(shape) {
			return maybe(function (value, name, context) {
				var result = validators.object(shape, name, context);
				if (isInvalid(result)) {
					return result;
				}

				for (var key in shape) {
					var required = false;
					var validator = shape[key];
					if (validator.config) {
						required = validator.config.required;
						validator = validator.config.validator;
					}
					if (required && !isDefAndNotNull(value[key]) || isInvalid(validator(value[key]))) {
						return composeError('Expected object with a specific shape', name, context);
					}
				}

				return true;
			});
		}
	};

	/**
  * Composes a warning a warning message.
  * @param {string} error Error message to display to console.
  * @param {?string} name Name of state property that is giving the error.
  * @param {Object} context
  * @return {!Error} Instance of Error class.
  */
	function composeError(error, name, context) {
		var compName = context ? getFunctionName(context.constructor) : null;
		var renderer = context && context.getRenderer && context.getRenderer();
		var parent = renderer && renderer.getParent ? context.getRenderer().getParent() : null;
		var parentName = parent ? getFunctionName(parent.constructor) : null;
		var location = parentName ? 'Check render method of \'' + parentName + '\'.' : '';
		return new Error('Warning: Invalid state passed to \'' + name + '\'. ' + (error + ' Passed to \'' + compName + '\'. ' + location));
	}

	/**
  * Returns the type of the given value.
  * @param {*} value Any value.
  * @return {string} Type of value.
  */
	function getType(value) {
		var type = typeof value === 'undefined' ? 'undefined' : babelHelpers.typeof(value);
		if (Array.isArray(value)) {
			return 'array';
		}
		return type;
	}

	/**
  * Checks if the given validator result says that the value is invalid.
  * @param {boolean|!Error} result
  * @return {boolean}
  */
	function isInvalid(result) {
		return result instanceof Error;
	}

	/**
  * Creates a validator that checks a value against a single type, null, or
  * undefined.
  * @param {function()} typeValidator Validator to check value against.
  * @return {function()} Validator.
  */
	function maybe(typeValidator) {
		return function (value, name, context) {
			if (!isDef(value) || isNull(value)) {
				return true;
			}
			return typeValidator(value, name, context);
		};
	}

	/**
  * Creates a validator that checks against a specific primitive type. If this
  * validator is called with no arguments, it will return the actual validator
  * function instead of running it. That's done to allow all validators to be
  * used consistently, since some (like `arrayOf`) always require that you call
  * the function before receiving the actual validator.
  * @param {string} expectedType Type to check against.
  * @return {function()} Validator if called with arguments, or wrapper function
  *     that returns the validator otherwise.
  */
	function validateType(expectedType) {
		var validatorFn = maybe(function (value, name, context) {
			var type = getType(value);
			if (type !== expectedType) {
				return composeError('Expected type \'' + expectedType + '\', but received type \'' + type + '\'.', name, context);
			}
			return true;
		});
		return function () {
			if (arguments.length === 0) {
				return validatorFn;
			} else {
				return validatorFn.apply(undefined, arguments);
			}
		};
	}

	this['metal']['validators'] = validators;
}).call(this);
'use strict';

(function () {
	var object = this['metalNamed']['metal']['object'];
	var validators = this['metal']['validators'];

	/**
  * Sugar api that can be used as an alternative for manually building `State`
  * configuration in the expected format. For example, instead of having
  * something like this:
  *
  * ```js
  * MyClass.STATE = {
  *   foo: {
  *     required: true,
  *     validator: validators.number,
  *     value: 13
  *   }
  * };
  * ```
  *
  * You could instead do:
  *
  * ```js
  * MyClass.STATE = {
  *   foo: Config.required().number().value(13)
  * };
  * ```
  */

	var Config = {
		/**
   * Adds the `required` flag to the `State` configuration.
   * @param {boolean} required Flag to set "required" to. True by default.
   * @return {!Object} `State` configuration object.
   */
		required: function required() {
			var _required = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : true;

			return mergeConfig(this, { required: _required });
		},


		/**
   * Adds a setter to the `State` configuration.
   * @param {!function()} setter
   * @return {!Object} `State` configuration object.
   */
		setter: function setter(_setter) {
			return mergeConfig(this, { setter: _setter });
		},


		/**
   * Adds a validator to the `State` configuration.
   * @param {!function()} validator
   * @return {!Object} `State` configuration object.
   */
		validator: function validator(_validator) {
			return mergeConfig(this, { validator: _validator });
		},


		/**
   * Adds a default value to the `State` configuration.
   * @param {*} value
   * @return {!Object} `State` configuration object.
   */
		value: function value(_value) {
			return mergeConfig(this, { value: _value });
		}
	};

	/**
  * Merges the given config object into the one that has been built so far.
  * @param {!Object} context The object calling this function.
  * @param {!Object} config The object to merge to the built config.
  * @return {!Object} The final object containing the built config.
  */
	function mergeConfig(context, config) {
		var obj = context;
		if (obj === Config) {
			obj = Object.create(Config);
			obj.config = {};
		}
		object.mixin(obj.config, config);
		return obj;
	}

	// Add all validators to `Config`.
	var fnNames = Object.keys(validators);
	fnNames.forEach(function (name) {
		return Config[name] = function () {
			return this.validator(validators[name]);
		};
	});

	this['metal']['Config'] = Config;
}).call(this);
'use strict';

(function () {
	var array = this['metalNamed']['metal']['array'];
	var async = this['metalNamed']['metal']['async'];
	var isDefAndNotNull = this['metalNamed']['metal']['isDefAndNotNull'];
	var isFunction = this['metalNamed']['metal']['isFunction'];
	var isObject = this['metalNamed']['metal']['isObject'];
	var isString = this['metalNamed']['metal']['isString'];
	var mergeSuperClassesProperty = this['metalNamed']['metal']['mergeSuperClassesProperty'];
	var object = this['metalNamed']['metal']['object'];
	var EventEmitter = this['metalNamed']['events']['EventEmitter'];

	/**
  * State adds support for having object properties that can be watched for
  * changes, as well as configured with validators, setters and other options.
  * See the `addToState` method for a complete list of available configuration
  * options for each state key.
  * @extends {EventEmitter}
  */

	var State = function (_EventEmitter) {
		babelHelpers.inherits(State, _EventEmitter);

		/**
   * Constructor function for `State`.
   * @param {Object=} opt_config Optional config object with initial values to
   *     set state properties to.
   * @param {Object=} opt_obj Optional object that should hold the state
   *     properties. If none is given, they will be added directly to `this`
   *     instead.
   * @param {Object=} opt_context Optional context to call functions (like
   *     validators and setters) on. Defaults to `this`.
   * @param {Object=} opt_commonOpts Optional common option values to be used
   *     by all this instance's state properties.
   */
		function State(opt_config, opt_obj, opt_context, opt_commonOpts) {
			babelHelpers.classCallCheck(this, State);

			/**
    * Common option values to be used by all this instance's state properties.
    * @type {Object}
    * @protected
    */
			var _this = babelHelpers.possibleConstructorReturn(this, (State.__proto__ || Object.getPrototypeOf(State)).call(this));

			_this.commonOpts_ = opt_commonOpts;

			/**
    * Context to call functions (like validators and setters) on.
    * @type {!Object}
    * @protected
    */
			_this.context_ = opt_context || _this;

			/**
    * Map of keys that can not be used as state keys.
    * @type {!Object<string, boolean>}
    * @protected
    */
			_this.keysBlacklist_ = {};

			/**
    * Object that should hold the state properties.
    * @type {!Object}
    * @protected
    */
			_this.obj_ = opt_obj || _this;

			/**
    * Object with information about the batch event that is currently
    * scheduled, or null if none is.
    * @type {Object}
    * @protected
    */
			_this.scheduledBatchData_ = null;

			/**
    * Object that contains information about all this instance's state keys.
    * @type {!Object<string, !Object>}
    * @protected
    */
			_this.stateInfo_ = {};

			_this.setShouldUseFacade(true);
			_this.mergeInvalidKeys_();
			_this.addToStateFromStaticHint_(opt_config);
			return _this;
		}

		/**
   * Adds the given key to the state.
   * @param {string} name The name of the new state key.
   * @param {Object.<string, *>=} config The configuration object for the new
   *     key. See `addToState` for supported settings.
   * @param {*} initialValue The initial value of the new key.
   */


		babelHelpers.createClass(State, [{
			key: 'addKeyToState',
			value: function addKeyToState(name, config, initialValue) {
				this.buildKeyInfo_(name, config, initialValue, arguments.length > 2);
				Object.defineProperty(this.obj_, name, this.buildKeyPropertyDef_(name));
				this.validateInitialValue_(name);
				this.assertGivenIfRequired_(name);
			}

			/**
    * Adds the given key(s) to the state, together with its(their) configs.
    * Config objects support the given settings:
    *     required - When set to `true`, causes errors to be printed (via
    *     `console.error`) if no value is given for the property.
    *
    *     setter - Function for normalizing state key values. It receives the new
    *     value that was set, and returns the value that should be stored.
    *
    *     validator - Function that validates state key values. When it returns
    *     false, the new value is ignored. When it returns an instance of Error,
    *     it will emit the error to the console.
    *
    *     value - The default value for the state key. Note that setting this to
    *     an object will cause all class instances to use the same reference to
    *     the object. To have each instance use a different reference for objects,
    *     use the `valueFn` option instead.
    *
    *     valueFn - A function that returns the default value for a state key.
    *
    *     writeOnce - Ignores writes to the state key after it's been first
    *     written to. That is, allows writes only when setting the value for the
    *     first time.
    * @param {!Object.<string, !Object>|string} configsOrName An object that maps
    *     configuration options for keys to be added to the state or the name of
    *     a single key to be added.
    * @param {Object.<string, *>=} opt_initialValuesOrConfig An object that maps
    *     state keys to their initial values. These values have higher precedence
    *     than the default values specified in the configurations. If a single
    *     key name was passed as the first param instead though, then this should
    *     be the configuration object for that key.
    * @param {boolean|Object|*=} opt_contextOrInitialValue If the first
    *     param passed to this method was a config object, this should be the
    *     context where the added state keys will be defined (defaults to `this`),
    *     or false if they shouldn't be defined at all. If the first param was a
    *     single key name though, this should be its initial value.
    */

		}, {
			key: 'addToState',
			value: function addToState(configsOrName, opt_initialValuesOrConfig, opt_contextOrInitialValue) {
				if (isString(configsOrName)) {
					return this.addKeyToState.apply(this, arguments);
				}

				var initialValues = opt_initialValuesOrConfig || {};
				var names = Object.keys(configsOrName);

				var props = {};
				for (var i = 0; i < names.length; i++) {
					var name = names[i];
					this.buildKeyInfo_(name, configsOrName[name], initialValues[name], initialValues.hasOwnProperty(name));
					props[name] = this.buildKeyPropertyDef_(name, opt_contextOrInitialValue);
					this.assertGivenIfRequired_(name);
				}

				if (opt_contextOrInitialValue !== false) {
					Object.defineProperties(opt_contextOrInitialValue || this.obj_, props);
				}

				// Validate initial values after all properties have been defined, otherwise
				// it won't be possible to access those properties within validators.
				for (var _i = 0; _i < names.length; _i++) {
					this.validateInitialValue_(names[_i]);
				}
			}

			/**
    * Adds state keys from super classes static hint `MyClass.STATE = {};`.
    * @param {Object.<string, !Object>=} opt_config An object that maps all the
    *     configurations for state keys.
    * @protected
    */

		}, {
			key: 'addToStateFromStaticHint_',
			value: function addToStateFromStaticHint_(opt_config) {
				var ctor = this.constructor;
				var defineContext;
				var merged = State.mergeStateStatic(ctor);
				if (this.obj_ === this) {
					defineContext = merged ? ctor.prototype : false;
				}
				this.addToState(ctor.STATE_MERGED, opt_config, defineContext);
			}

			/**
    * Logs an error if the given property is required but wasn't given.
    * @param {string} name
    * @protected
    */

		}, {
			key: 'assertGivenIfRequired_',
			value: function assertGivenIfRequired_(name) {
				var info = this.stateInfo_[name];
				if (info.config.required) {
					var value = info.state === State.KeyStates.INITIALIZED ? this.get(name) : info.initialValue;
					if (!isDefAndNotNull(value)) {
						console.error('The property called "' + name + '" is required but didn\'t ' + 'receive a value.');
					}
				}
			}

			/**
    * Checks that the given name is a valid state key name. If it's not, an error
    * will be thrown.
    * @param {string} name The name to be validated.
    * @throws {Error}
    * @protected
    */

		}, {
			key: 'assertValidStateKeyName_',
			value: function assertValidStateKeyName_(name) {
				if (this.constructor.INVALID_KEYS_MERGED[name] || this.keysBlacklist_[name]) {
					throw new Error('It\'s not allowed to create a state key with the name "' + name + '".');
				}
			}

			/**
    * Builds the info object for the specified state key.
    * @param {string} name The name of the key.
    * @param {Object} config The config object for the key.
    * @param {*} initialValue The initial value of the key.
    * @param {boolean} hasInitialValue Flag indicating if an initial value was
    *     given or not (important since `initialValue` can also be `undefined`).
    * @protected
    */

		}, {
			key: 'buildKeyInfo_',
			value: function buildKeyInfo_(name, config, initialValue, hasInitialValue) {
				this.assertValidStateKeyName_(name);
				config = config && config.config ? config.config : config || {};
				if (this.commonOpts_) {
					config = object.mixin({}, config, this.commonOpts_);
				}
				this.stateInfo_[name] = {
					config: config,
					state: State.KeyStates.UNINITIALIZED
				};
				if (hasInitialValue) {
					this.stateInfo_[name].initialValue = initialValue;
				}
			}

			/**
    * Builds the property definition object for the specified state key.
    * @param {string} name The name of the key.
    * @param {Object=} opt_context The object where the property will be added.
    * @return {!Object}
    * @protected
    */

		}, {
			key: 'buildKeyPropertyDef_',
			value: function buildKeyPropertyDef_(name, opt_context) {
				var stateObj = opt_context === this.constructor.prototype ? null : this;
				return {
					configurable: true,
					enumerable: true,
					get: function get() {
						return (stateObj || this).getStateKeyValue_(name);
					},
					set: function set(val) {
						(stateObj || this).setStateKeyValue_(name, val);
					}
				};
			}

			/**
    * Calls the requested function, running the appropriate code for when it's
    * passed as an actual function object or just the function's name.
    * @param {!Function|string} fn Function, or name of the function to run.
    * @param {!Array} An optional array of parameters to be passed to the
    *   function that will be called.
    * @return {*} The return value of the called function.
    * @protected
    */

		}, {
			key: 'callFunction_',
			value: function callFunction_(fn, args) {
				if (isString(fn)) {
					return this.context_[fn].apply(this.context_, args);
				} else if (isFunction(fn)) {
					return fn.apply(this.context_, args);
				}
			}

			/**
    * Calls the state key's setter, if there is one.
    * @param {string} name The name of the key.
    * @param {*} value The value to be set.
    * @param {*} currentValue The current value.
    * @return {*} The final value to be set.
    * @protected
    */

		}, {
			key: 'callSetter_',
			value: function callSetter_(name, value, currentValue) {
				var info = this.stateInfo_[name];
				var config = info.config;
				if (config.setter) {
					value = this.callFunction_(config.setter, [value, currentValue]);
				}
				return value;
			}

			/**
    * Calls the state key's validator, if there is one. Emits console
    * warning if validator returns a string.
    * @param {string} name The name of the key.
    * @param {*} value The value to be validated.
    * @return {boolean} Flag indicating if value is valid or not.
    * @protected
    */

		}, {
			key: 'callValidator_',
			value: function callValidator_(name, value) {
				var info = this.stateInfo_[name];
				var config = info.config;
				if (config.validator) {
					var validatorReturn = this.callFunction_(config.validator, [value, name, this.context_]);

					if (validatorReturn instanceof Error) {
						console.error('Warning: ' + validatorReturn);
					}
					return validatorReturn;
				}
				return true;
			}

			/**
    * Checks if the it's allowed to write on the requested state key.
    * @param {string} name The name of the key.
    * @return {boolean}
    */

		}, {
			key: 'canSetState',
			value: function canSetState(name) {
				var info = this.stateInfo_[name];
				return !info.config.writeOnce || !info.written;
			}

			/**
    * @inheritDoc
    */

		}, {
			key: 'disposeInternal',
			value: function disposeInternal() {
				babelHelpers.get(State.prototype.__proto__ || Object.getPrototypeOf(State.prototype), 'disposeInternal', this).call(this);
				this.stateInfo_ = null;
				this.scheduledBatchData_ = null;
			}

			/**
    * Emits the state change batch event.
    * @protected
    */

		}, {
			key: 'emitBatchEvent_',
			value: function emitBatchEvent_() {
				if (!this.isDisposed()) {
					var data = this.scheduledBatchData_;
					this.scheduledBatchData_ = null;
					this.emit('stateChanged', data);
				}
			}

			/**
    * Returns the value of the requested state key.
    * Note: this can and should be accomplished by accessing the value as a
    * regular property. This should only be used in cases where a function is
    * actually needed.
    * @param {string} name
    * @return {*}
    */

		}, {
			key: 'get',
			value: function get(name) {
				return this.obj_[name];
			}

			/**
    * Returns an object that maps state keys to their values.
    * @param {Array<string>=} opt_names A list of names of the keys that should
    *   be returned. If none is given, the whole state will be returned.
    * @return {Object.<string, *>}
    */

		}, {
			key: 'getState',
			value: function getState(opt_names) {
				var state = {};
				var names = opt_names || this.getStateKeys();

				for (var i = 0; i < names.length; i++) {
					state[names[i]] = this.get(names[i]);
				}

				return state;
			}

			/**
    * Gets the config object for the requested state key.
    * @param {string} name The key's name.
    * @return {Object}
    * @protected
    */

		}, {
			key: 'getStateKeyConfig',
			value: function getStateKeyConfig(name) {
				return (this.stateInfo_[name] || {}).config;
			}

			/**
    * Returns an array with all state keys.
    * @return {!Array.<string>}
    */

		}, {
			key: 'getStateKeys',
			value: function getStateKeys() {
				return this.stateInfo_ ? Object.keys(this.stateInfo_) : [];
			}

			/**
    * Gets the value of the specified state key. This is passed as that key's
    * getter to the `Object.defineProperty` call inside the `addKeyToState` method.
    * @param {string} name The name of the key.
    * @return {*}
    * @protected
    */

		}, {
			key: 'getStateKeyValue_',
			value: function getStateKeyValue_(name) {
				if (!this.warnIfDisposed_(name)) {
					this.initStateKey_(name);
					return this.stateInfo_[name].value;
				}
			}

			/**
    * Checks if the value of the state key with the given name has already been
    * set. Note that this doesn't run the key's getter.
    * @param {string} name The name of the key.
    * @return {boolean}
    */

		}, {
			key: 'hasBeenSet',
			value: function hasBeenSet(name) {
				var info = this.stateInfo_[name];
				return info.state === State.KeyStates.INITIALIZED || this.hasInitialValue_(name);
			}

			/**
    * Checks if an initial value was given to the specified state property.
    * @param {string} name The name of the key.
    * @return {boolean}
    * @protected
    */

		}, {
			key: 'hasInitialValue_',
			value: function hasInitialValue_(name) {
				return this.stateInfo_[name].hasOwnProperty('initialValue');
			}

			/**
    * Checks if the given key is present in this instance's state.
    * @param {string} key
    * @return {boolean}
    */

		}, {
			key: 'hasStateKey',
			value: function hasStateKey(key) {
				if (!this.warnIfDisposed_(key)) {
					return !!this.stateInfo_[key];
				}
			}

			/**
    * Informs of changes to a state key's value through an event. Won't trigger
    * the event if the value hasn't changed or if it's being initialized.
    * @param {string} name The name of the key.
    * @param {*} prevVal The previous value of the key.
    * @protected
    */

		}, {
			key: 'informChange_',
			value: function informChange_(name, prevVal) {
				if (this.shouldInformChange_(name, prevVal)) {
					var data = {
						key: name,
						newVal: this.get(name),
						prevVal: prevVal
					};
					this.emit(name + 'Changed', data);
					this.emit('stateKeyChanged', data);
					this.scheduleBatchEvent_(data);
				}
			}

			/**
    * Initializes the specified state key, giving it a first value.
    * @param {string} name The name of the key.
    * @protected
    */

		}, {
			key: 'initStateKey_',
			value: function initStateKey_(name) {
				var info = this.stateInfo_[name];
				if (info.state !== State.KeyStates.UNINITIALIZED) {
					return;
				}

				info.state = State.KeyStates.INITIALIZING;
				this.setInitialValue_(name);
				if (!info.written) {
					this.setDefaultValue(name);
				}
				info.state = State.KeyStates.INITIALIZED;
			}

			/**
    * Merges an array of values for the STATE property into a single object.
    * @param {!Array} values The values to be merged.
    * @return {!Object} The merged value.
    * @static
    */

		}, {
			key: 'mergeInvalidKeys_',


			/**
    * Merges the values of the `INVALID_KEYS` static for the whole hierarchy of
    * the current instance.
    * @protected
    */
			value: function mergeInvalidKeys_() {
				mergeSuperClassesProperty(this.constructor, 'INVALID_KEYS', function (values) {
					return array.flatten(values).reduce(function (merged, val) {
						if (val) {
							merged[val] = true;
						}
						return merged;
					}, {});
				});
			}

			/**
    * Removes the requested state key.
    * @param {string} name The name of the key.
    */

		}, {
			key: 'removeStateKey',
			value: function removeStateKey(name) {
				this.stateInfo_[name] = null;
				delete this.obj_[name];
			}

			/**
    * Schedules a state change batch event to be emitted asynchronously.
    * @param {!Object} changeData Information about a state key's update.
    * @protected
    */

		}, {
			key: 'scheduleBatchEvent_',
			value: function scheduleBatchEvent_(changeData) {
				if (!this.scheduledBatchData_) {
					async.nextTick(this.emitBatchEvent_, this);
					this.scheduledBatchData_ = {
						changes: {}
					};
				}

				var name = changeData.key;
				var changes = this.scheduledBatchData_.changes;
				if (changes[name]) {
					changes[name].newVal = changeData.newVal;
				} else {
					changes[name] = changeData;
				}
			}

			/**
    * Sets the value of the requested state key.
    * Note: this can and should be accomplished by setting the state key as a
    * regular property. This should only be used in cases where a function is
    * actually needed.
    * @param {string} name
    * @param {*} value
    * @return {*}
    */

		}, {
			key: 'set',
			value: function set(name, value) {
				if (this.hasStateKey(name)) {
					this.obj_[name] = value;
				}
			}

			/**
    * Sets the default value of the requested state key.
    * @param {string} name The name of the key.
    * @return {*}
    */

		}, {
			key: 'setDefaultValue',
			value: function setDefaultValue(name) {
				var config = this.stateInfo_[name].config;

				if (config.value !== undefined) {
					this.set(name, config.value);
				} else {
					this.set(name, this.callFunction_(config.valueFn));
				}
			}

			/**
    * Sets the initial value of the requested state key.
    * @param {string} name The name of the key.
    * @return {*}
    * @protected
    */

		}, {
			key: 'setInitialValue_',
			value: function setInitialValue_(name) {
				if (this.hasInitialValue_(name)) {
					var info = this.stateInfo_[name];
					this.set(name, info.initialValue);
					info.initialValue = undefined;
				}
			}

			/**
    * Sets a map of keys that are not valid state keys.
    * @param {!Object<string, boolean>}
    */

		}, {
			key: 'setKeysBlacklist_',
			value: function setKeysBlacklist_(blacklist) {
				this.keysBlacklist_ = blacklist;
			}

			/**
    * Sets the value of all the specified state keys.
    * @param {!Object.<string,*>} values A map of state keys to the values they
    *   should be set to.
    * @param {function()=} opt_callback An optional function that will be run
    *   after the next batched update is triggered.
    */

		}, {
			key: 'setState',
			value: function setState(values, opt_callback) {
				var _this2 = this;

				Object.keys(values).forEach(function (name) {
					return _this2.set(name, values[name]);
				});
				if (opt_callback && this.scheduledBatchData_) {
					this.once('stateChanged', opt_callback);
				}
			}

			/**
    * Sets the value of the specified state key. This is passed as that key's
    * setter to the `Object.defineProperty` call inside the `addKeyToState`
    * method.
    * @param {string} name The name of the key.
    * @param {*} value The new value of the key.
    * @protected
    */

		}, {
			key: 'setStateKeyValue_',
			value: function setStateKeyValue_(name, value) {
				if (this.warnIfDisposed_(name) || !this.canSetState(name) || !this.validateKeyValue_(name, value)) {
					return;
				}

				var info = this.stateInfo_[name];
				if (!this.hasInitialValue_(name) && info.state === State.KeyStates.UNINITIALIZED) {
					info.state = State.KeyStates.INITIALIZED;
				}

				var prevVal = this.get(name);
				info.value = this.callSetter_(name, value, prevVal);
				this.assertGivenIfRequired_(name);
				info.written = true;
				this.informChange_(name, prevVal);
			}

			/**
    * Checks if we should inform about a state update. Updates are ignored during
    * state initialization. Otherwise, updates to primitive values are only
    * informed when the new value is different from the previous one. Updates to
    * objects (which includes functions and arrays) are always informed outside
    * initialization though, since we can't be sure if all of the internal data
    * has stayed the same.
    * @param {string} name The name of the key.
    * @param {*} prevVal The previous value of the key.
    * @return {boolean}
    * @protected
    */

		}, {
			key: 'shouldInformChange_',
			value: function shouldInformChange_(name, prevVal) {
				var info = this.stateInfo_[name];
				return info.state === State.KeyStates.INITIALIZED && (isObject(prevVal) || prevVal !== this.get(name));
			}

			/**
    * Validates the initial value for the state property with the given name.
    * @param {string} name
    * @protected
    */

		}, {
			key: 'validateInitialValue_',
			value: function validateInitialValue_(name) {
				var info = this.stateInfo_[name];
				if (this.hasInitialValue_(name) && !this.callValidator_(name, info.initialValue)) {
					delete info.initialValue;
				}
			}

			/**
    * Validates the state key's value, which includes calling the validator
    * defined in the key's configuration object, if there is one.
    * @param {string} name The name of the key.
    * @param {*} value The value to be validated.
    * @return {boolean} Flag indicating if value is valid or not.
    * @protected
    */

		}, {
			key: 'validateKeyValue_',
			value: function validateKeyValue_(name, value) {
				var info = this.stateInfo_[name];

				return info.state === State.KeyStates.INITIALIZING || this.callValidator_(name, value);
			}

			/**
    * Warns if this instance has already been disposed.
    * @param {string} name Name of the property to be accessed if not disposed.
    * @return {boolean} True if disposed, or false otherwise.
    * @protected
    */

		}, {
			key: 'warnIfDisposed_',
			value: function warnIfDisposed_(name) {
				var disposed = this.isDisposed();
				if (disposed) {
					console.warn('Error. Trying to access property "' + name + '" on disposed instance');
				}
				return disposed;
			}
		}], [{
			key: 'mergeState',
			value: function mergeState(values) {
				return object.mixin.apply(null, [{}].concat(values.reverse()));
			}

			/**
    * Merges the STATE static variable for the given constructor function.
    * @param  {!Function} ctor Constructor function.
    * @return {boolean} Returns true if merge happens, false otherwise.
    * @static
    */

		}, {
			key: 'mergeStateStatic',
			value: function mergeStateStatic(ctor) {
				return mergeSuperClassesProperty(ctor, 'STATE', State.mergeState);
			}
		}]);
		return State;
	}(EventEmitter);

	/**
  * A list with state key names that will automatically be rejected as invalid.
  * Subclasses can define their own invalid keys by setting this static on their
  * constructors, which will be merged together and handled automatically.
  * @type {!Array<string>}
  */


	State.INVALID_KEYS = ['state', 'stateKey'];

	/**
  * Constants that represent the states that a state key can be in.
  * @type {!Object}
  */
	State.KeyStates = {
		UNINITIALIZED: 0,
		INITIALIZING: 1,
		INITIALIZED: 2
	};

	this['metal']['State'] = State;
}).call(this);
'use strict';

(function () {
  var validators = this['metal']['validators'];
  var Config = this['metal']['Config'];
  var State = this['metal']['State'];
  this['metal']['state'] = State;
  this['metalNamed']['state'] = this['metalNamed']['state'] || {};
  this['metalNamed']['state']['validators'] = validators;
  this['metalNamed']['state']['Config'] = Config;
  this['metalNamed']['state']['State'] = State;
}).call(this);
'use strict';

(function () {
	var array = this['metalNamed']['metal']['array'];
	var mergeSuperClassesProperty = this['metalNamed']['metal']['mergeSuperClassesProperty'];
	var object = this['metalNamed']['metal']['object'];
	var EventEmitter = this['metalNamed']['events']['EventEmitter'];
	var EventEmitterProxy = this['metalNamed']['events']['EventEmitterProxy'];
	var State = this['metal']['state'];

	var ComponentDataManager = function (_EventEmitter) {
		babelHelpers.inherits(ComponentDataManager, _EventEmitter);

		/**
   * Constructor for `ComponentDataManager`.
   * @param {!Component} component
   * @param {!Object} data
   */
		function ComponentDataManager(component, data) {
			babelHelpers.classCallCheck(this, ComponentDataManager);

			var _this = babelHelpers.possibleConstructorReturn(this, (ComponentDataManager.__proto__ || Object.getPrototypeOf(ComponentDataManager)).call(this));

			_this.component_ = component;

			mergeSuperClassesProperty(_this.constructor, 'BLACKLIST', array.firstDefinedValue);
			State.mergeStateStatic(_this.component_.constructor);

			_this.createState_(data, _this.component_);
			return _this;
		}

		/**
   * Adds a state property to the component.
   * @param {string} name
   * @param {!Object} config
   * @param {*} opt_initialValue
   */


		babelHelpers.createClass(ComponentDataManager, [{
			key: 'add',
			value: function add() {
				var _state_;

				(_state_ = this.state_).addToState.apply(_state_, arguments);
			}

			/**
    * Builds the configuration data that will be passed to the `State` instance.
    * @param {!Object} data
    * @return {!Object}
    * @protected
    */

		}, {
			key: 'buildStateInstanceData_',
			value: function buildStateInstanceData_(data) {
				return object.mixin({}, data, this.component_.constructor.STATE_MERGED);
			}

			/**
    * Creates the `State` instance that will handle the main component data.
    * @param {!Object} data
    * @param {!Object} holder The object that should hold the data properties.
    * @protected
    */

		}, {
			key: 'createState_',
			value: function createState_(data, holder) {
				var state = new State({}, holder, this.component_);
				state.setKeysBlacklist_(this.constructor.BLACKLIST_MERGED);
				state.addToState(this.buildStateInstanceData_(data), this.component_.getInitialConfig());

				var listener = this.emit_.bind(this);
				state.on('stateChanged', listener);
				state.on('stateKeyChanged', listener);
				this.state_ = state;

				this.proxy_ = new EventEmitterProxy(state, this.component_);
			}

			/**
    * @inheritDoc
    */

		}, {
			key: 'disposeInternal',
			value: function disposeInternal() {
				babelHelpers.get(ComponentDataManager.prototype.__proto__ || Object.getPrototypeOf(ComponentDataManager.prototype), 'disposeInternal', this).call(this);

				this.state_.dispose();
				this.state_ = null;

				this.proxy_.dispose();
				this.proxy_ = null;
			}

			/**
    * Emits the specified event.
    * @param {!Object} data
    * @param {!Object} event
    * @protected
    */

		}, {
			key: 'emit_',
			value: function emit_(data, event) {
				var orig = event.type;
				var name = orig === 'stateChanged' ? 'dataChanged' : 'dataPropChanged';
				this.emit(name, data);
			}

			/**
    * Gets the data with the given name.
    * @param {string} name
    * @return {*}
    */

		}, {
			key: 'get',
			value: function get(name) {
				return this.state_.get(name);
			}

			/**
    * Gets the keys for state data that can be synced via `sync` functions.
    * @return {!Array<string>}
    */

		}, {
			key: 'getSyncKeys',
			value: function getSyncKeys() {
				return this.state_.getStateKeys();
			}

			/**
    * Gets the keys for state data.
    * @return {!Array<string>}
    */

		}, {
			key: 'getStateKeys',
			value: function getStateKeys() {
				return this.state_.getStateKeys();
			}

			/**
    * Gets the whole state data.
    * @return {!Object}
    */

		}, {
			key: 'getState',
			value: function getState() {
				return this.state_.getState();
			}

			/**
    * Gets the `State` instance being used.
    * @return {!Object}
    */

		}, {
			key: 'getStateInstance',
			value: function getStateInstance() {
				return this.state_;
			}

			/**
    * Updates all non internal data with the given values (or to the default
    * value if none is given).
    * @param {!Object} data
    */

		}, {
			key: 'replaceNonInternal',
			value: function replaceNonInternal(data) {
				ComponentDataManager.replaceNonInternal(data, this.state_);
			}

			/**
    * Updates all non internal data with the given values (or to the default
    * value if none is given).
    * @param {!Object} data
    * @param {!State} state
    */

		}, {
			key: 'setState',


			/**
    * Sets the value of all the specified state keys.
    * @param {!Object.<string,*>} values A map of state keys to the values they
    *   should be set to.
    * @param {function()=} opt_callback An optional function that will be run
    *   after the next batched update is triggered.
    */
			value: function setState(state, opt_callback) {
				this.state_.setState(state, opt_callback);
			}
		}], [{
			key: 'replaceNonInternal',
			value: function replaceNonInternal(data, state) {
				var keys = state.getStateKeys();
				for (var i = 0; i < keys.length; i++) {
					var key = keys[i];
					if (!state.getStateKeyConfig(key).internal) {
						if (data.hasOwnProperty(key)) {
							state.set(key, data[key]);
						} else {
							state.setDefaultValue(key);
						}
					}
				}
			}
		}]);
		return ComponentDataManager;
	}(EventEmitter);

	ComponentDataManager.BLACKLIST = {
		components: true,
		context: true,
		element: true,
		refs: true,
		wasRendered: true
	};

	this['metal']['ComponentDataManager'] = ComponentDataManager;
}).call(this);
'use strict';

(function () {
	var EventEmitter = this['metalNamed']['events']['EventEmitter'];
	var EventHandler = this['metalNamed']['events']['EventHandler'];

	/**
  * Base class that component renderers should extend from. It defines the
  * required methods all renderers should have.
  */

	var ComponentRenderer = function (_EventEmitter) {
		babelHelpers.inherits(ComponentRenderer, _EventEmitter);

		/**
   * Constructor function for `ComponentRenderer`.
   * @param {!Component} component The component that this renderer is
   *     responsible for.
   */
		function ComponentRenderer(component) {
			babelHelpers.classCallCheck(this, ComponentRenderer);

			var _this = babelHelpers.possibleConstructorReturn(this, (ComponentRenderer.__proto__ || Object.getPrototypeOf(ComponentRenderer)).call(this));

			_this.component_ = component;

			_this.componentRendererEvents_ = new EventHandler();
			_this.componentRendererEvents_.add(_this.component_.once('render', _this.render.bind(_this)));
			_this.on('rendered', _this.handleRendered_);
			component.on('dataManagerCreated', _this.handleDataManagerCreated_.bind(_this));
			return _this;
		}

		/**
   * @inheritDoc
   */


		babelHelpers.createClass(ComponentRenderer, [{
			key: 'disposeInternal',
			value: function disposeInternal() {
				this.componentRendererEvents_.removeAllListeners();
				this.componentRendererEvents_ = null;
			}

			/**
    * Returns this renderer's component.
    * @return {!Component}
    */

		}, {
			key: 'getComponent',
			value: function getComponent() {
				return this.component_;
			}

			/**
    * Handles a `dataManagerCreated` event from the component. Listens to events
    * on the manager that has been created.
    * @protected
    */

		}, {
			key: 'handleDataManagerCreated_',
			value: function handleDataManagerCreated_() {
				var manager = this.component_.getDataManager();
				if (this.component_.constructor.SYNC_UPDATES_MERGED) {
					this.componentRendererEvents_.add(manager.on('dataPropChanged', this.handleManagerDataPropChanged_.bind(this)));
				} else {
					this.componentRendererEvents_.add(manager.on('dataChanged', this.handleManagerDataChanged_.bind(this)));
				}
			}

			/**
    * Handles a `dataChanged` event from the component's data manager. Calls the
    * `update` function if the component has already been rendered for the first
    * time.
    * @param {!Object<string, Object>} changes Object containing the names
    *     of all changed state keys, each mapped to an object with its new
    *     (newVal) and previous (prevVal) values.
    * @protected
    */

		}, {
			key: 'handleManagerDataChanged_',
			value: function handleManagerDataChanged_(changes) {
				if (this.shouldRerender_()) {
					this.update(changes);
				}
			}

			/**
    * Handles a `dataPropChanged` event from the component's data manager. This
    * is similar to `handleManagerDataChanged_`, but only called for
    * components that have requested updates to happen synchronously.
    * @param {!{key: string, newVal: *, prevVal: *}} data
    * @protected
    */

		}, {
			key: 'handleManagerDataPropChanged_',
			value: function handleManagerDataPropChanged_(data) {
				if (this.shouldRerender_()) {
					this.update({
						changes: babelHelpers.defineProperty({}, data.key, data)
					});
				}
			}

			/**
    * Handles the "rendered" event.
    * @protected
    */

		}, {
			key: 'handleRendered_',
			value: function handleRendered_() {
				this.isRendered_ = true;
			}

			/**
    * Renders the component's whole content (including its main element).
    */

		}, {
			key: 'render',
			value: function render() {
				if (!this.component_.element) {
					this.component_.element = document.createElement('div');
				}
				this.emit('rendered', !this.isRendered_);
			}

			/**
    * Checks if changes should cause a rerender right now.
    * @return {boolean}
    * @protected
    */

		}, {
			key: 'shouldRerender_',
			value: function shouldRerender_() {
				return this.isRendered_ && !this.skipUpdates_;
			}

			/**
    * Skips updates until `stopSkipUpdates` is called.
    */

		}, {
			key: 'startSkipUpdates',
			value: function startSkipUpdates() {
				this.skipUpdates_ = true;
			}

			/**
    * Stops skipping updates.
    */

		}, {
			key: 'stopSkipUpdates',
			value: function stopSkipUpdates() {
				this.skipUpdates_ = false;
			}

			/**
    * Updates the component's element html. This is automatically called when
    * the value of at least one of the component's state keys has changed.
    * @param {Object.<string, Object>} changes Object containing the names
    *     of all changed state keys, each mapped to an object with its new
    *     (newVal) and previous (prevVal) values.
    */

		}, {
			key: 'update',
			value: function update() {}
		}]);
		return ComponentRenderer;
	}(EventEmitter);

	this['metal']['ComponentRenderer'] = ComponentRenderer;
}).call(this);
'use strict';

(function () {
	var array = this['metalNamed']['metal']['array'];
	var getFunctionName = this['metalNamed']['metal']['getFunctionName'];
	var isBoolean = this['metalNamed']['metal']['isBoolean'];
	var isDefAndNotNull = this['metalNamed']['metal']['isDefAndNotNull'];
	var isElement = this['metalNamed']['metal']['isElement'];
	var isFunction = this['metalNamed']['metal']['isFunction'];
	var isObject = this['metalNamed']['metal']['isObject'];
	var isString = this['metalNamed']['metal']['isString'];
	var mergeSuperClassesProperty = this['metalNamed']['metal']['mergeSuperClassesProperty'];
	var object = this['metalNamed']['metal']['object'];
	var DomEventEmitterProxy = this['metalNamed']['dom']['DomEventEmitterProxy'];
	var toElement = this['metalNamed']['dom']['toElement'];
	var ComponentDataManager = this['metal']['ComponentDataManager'];
	var ComponentRenderer = this['metal']['ComponentRenderer'];
	var EventEmitter = this['metalNamed']['events']['EventEmitter'];
	var EventHandler = this['metalNamed']['events']['EventHandler'];

	/**
  * Component collects common behaviors to be followed by UI components, such
  * as Lifecycle, CSS classes management, events encapsulation and support for
  * different types of rendering.
  * Rendering logic can be done by either:
  *     - Listening to the `render` event inside the `created` lifecycle function
  *       and adding the rendering logic to the listener.
  *     - Using an existing implementation of `ComponentRenderer` like `Soy`,
  *       and following its patterns.
  *     - Building your own implementation of a `ComponentRenderer`.
  * Specifying the renderer that will be used can be done by setting the RENDERER
  * static variable to the renderer's constructor function.
  *
  * Example:
  *
  * <code>
  * class CustomComponent extends Component {
  *   constructor(config) {
  *     super(config);
  *   }
  *
  *   created() {
  *   }
  *
  *   rendered() {
  *   }
  *
  *   attached() {
  *   }
  *
  *   detached() {
  *   }
  * }
  *
  * CustomComponent.RENDERER = MyRenderer;
  *
  * CustomComponent.STATE = {
  *   title: { value: 'Title' },
  *   fontSize: { value: '10px' }
  * };
  * </code>
  *
  * @extends {State}
  */

	var Component = function (_EventEmitter) {
		babelHelpers.inherits(Component, _EventEmitter);

		/**
   * Constructor function for `Component`.
   * @param {Object=} opt_config An object with the initial values for this
   *     component's state.
   * @param {boolean|string|Element=} opt_parentElement The element where the
   *     component should be rendered. Can be given as a selector or an element.
   *     If `false` is passed, the component won't be rendered automatically
   *     after created.
   * @constructor
   */
		function Component(opt_config, opt_parentElement) {
			babelHelpers.classCallCheck(this, Component);

			/**
    * All listeners that were attached until the `DomEventEmitterProxy` instance
    * was created.
    * @type {!Object<string, bool>}
    * @protected
    */
			var _this = babelHelpers.possibleConstructorReturn(this, (Component.__proto__ || Object.getPrototypeOf(Component)).call(this));

			_this.attachedListeners_ = {};

			/**
    * Gets all nested components.
    * @type {!Array<!Component>}
    */
			_this.components = {};

			/**
    * Instance of `DomEventEmitterProxy` which proxies events from the component's
    * element to the component itself.
    * @type {DomEventEmitterProxy}
    * @protected
    */
			_this.elementEventProxy_ = null;

			/**
    * The `EventHandler` instance for events attached from the `events` state key.
    * @type {!EventHandler}
    * @protected
    */
			_this.eventsStateKeyHandler_ = new EventHandler();

			/**
    * Whether the element is in document.
    * @type {boolean}
    */
			_this.inDocument = false;

			/**
    * The initial config option passed to this constructor.
    * @type {!Object}
    * @protected
    */
			_this.initialConfig_ = opt_config || {};

			/**
    * Whether the element was rendered.
    * @type {boolean}
    */
			_this.wasRendered = false;

			/**
    * The component's element will be appended to the element this variable is
    * set to, unless the user specifies another parent when calling `render` or
    * `attach`.
    * @type {!Element}
    */
			_this.DEFAULT_ELEMENT_PARENT = document.body;

			mergeSuperClassesProperty(_this.constructor, 'ELEMENT_CLASSES', _this.mergeElementClasses_);
			mergeSuperClassesProperty(_this.constructor, 'SYNC_UPDATES', array.firstDefinedValue);

			_this.element = _this.initialConfig_.element;

			_this.renderer_ = _this.createRenderer();
			_this.renderer_.on('rendered', _this.handleRendererRendered_.bind(_this));

			_this.dataManager_ = _this.createDataManager();
			_this.emit('dataManagerCreated');

			_this.on('stateChanged', _this.handleStateChanged_);
			_this.newListenerHandle_ = _this.on('newListener', _this.handleNewListener_);
			_this.on('eventsChanged', _this.onEventsChanged_);
			_this.addListenersFromObj_(_this.dataManager_.get('events'));

			_this.created();
			_this.componentCreated_ = true;
			if (opt_parentElement !== false) {
				_this.render_(opt_parentElement);
			}
			_this.on('elementChanged', _this.onElementChanged_);
			return _this;
		}

		/**
   * Getter logic for the element property.
   * @return {Element}
   */


		babelHelpers.createClass(Component, [{
			key: 'addListenersFromObj_',


			/**
    * Adds the listeners specified in the given object.
    * @param {Object} events
    * @protected
    */
			value: function addListenersFromObj_(events) {
				var eventNames = Object.keys(events || {});
				for (var i = 0; i < eventNames.length; i++) {
					var info = this.extractListenerInfo_(events[eventNames[i]]);
					if (info.fn) {
						var handler;
						if (info.selector) {
							handler = this.delegate(eventNames[i], info.selector, info.fn);
						} else {
							handler = this.on(eventNames[i], info.fn);
						}
						this.eventsStateKeyHandler_.add(handler);
					}
				}
			}

			/**
    * Invokes the attached Lifecycle. When attached, the component element is
    * appended to the DOM and any other action to be performed must be
    * implemented in this method, such as, binding DOM events. A component can
    * be re-attached multiple times.
    * @param {(string|Element)=} opt_parentElement Optional parent element
    *     to render the component.
    * @param {(string|Element)=} opt_siblingElement Optional sibling element
    *     to render the component before it. Relevant when the component needs
    *     to be rendered before an existing element in the DOM.
    * @protected
    * @chainable
    */

		}, {
			key: 'attach',
			value: function attach(opt_parentElement, opt_siblingElement) {
				if (!this.inDocument) {
					this.renderElement_(opt_parentElement, opt_siblingElement);
					this.inDocument = true;
					this.emit('attached', {
						parent: opt_parentElement,
						sibling: opt_siblingElement
					});
					this.attached();
				}
				return this;
			}

			/**
    * Lifecycle. When attached, the component element is appended to the DOM
    * and any other action to be performed must be implemented in this method,
    * such as, binding DOM events. A component can be re-attached multiple
    * times, therefore the undo behavior for any action performed in this phase
    * must be implemented on the detach phase.
    */

		}, {
			key: 'attached',
			value: function attached() {}

			/**
    * Adds the given sub component, replacing any existing one with the same ref.
    * @param {string} ref
    * @param {!Component} component
    */

		}, {
			key: 'addSubComponent',
			value: function addSubComponent(ref, component) {
				this.components[ref] = component;
			}

			/**
    * Lifecycle. This is called when the component has just been created, before
    * it's rendered.
    */

		}, {
			key: 'created',
			value: function created() {}

			/**
    * Creates the data manager for this component. Sub classes can override this
    * to return a custom manager as needed.
    * @return {!ComponentDataManager}
    */

		}, {
			key: 'createDataManager',
			value: function createDataManager() {
				mergeSuperClassesProperty(this.constructor, 'DATA_MANAGER', array.firstDefinedValue);
				return new this.constructor.DATA_MANAGER_MERGED(this, Component.DATA);
			}

			/**
    * Creates the renderer for this component. Sub classes can override this to
    * return a custom renderer as needed.
    * @return {!ComponentRenderer}
    */

		}, {
			key: 'createRenderer',
			value: function createRenderer() {
				mergeSuperClassesProperty(this.constructor, 'RENDERER', array.firstDefinedValue);
				return new this.constructor.RENDERER_MERGED(this);
			}

			/**
    * Listens to a delegate event on the component's element.
    * @param {string} eventName The name of the event to listen to.
    * @param {string} selector The selector that matches the child elements that
    *   the event should be triggered for.
    * @param {!function(!Object)} callback Function to be called when the event is
    *   triggered. It will receive the normalized event object.
    * @return {!EventHandle} Can be used to remove the listener.
    */

		}, {
			key: 'delegate',
			value: function delegate(eventName, selector, callback) {
				return this.on('delegate:' + eventName + ':' + selector, callback);
			}

			/**
    * Invokes the detached Lifecycle. When detached, the component element is
    * removed from the DOM and any other action to be performed must be
    * implemented in this method, such as, unbinding DOM events. A component
    * can be detached multiple times.
    * @chainable
    */

		}, {
			key: 'detach',
			value: function detach() {
				if (this.inDocument) {
					if (this.element && this.element.parentNode) {
						this.element.parentNode.removeChild(this.element);
					}
					this.inDocument = false;
					this.detached();
				}
				this.emit('detached');
				return this;
			}

			/**
    * Lifecycle. When detached, the component element is removed from the DOM
    * and any other action to be performed must be implemented in this method,
    * such as, unbinding DOM events. A component can be detached multiple
    * times, therefore the undo behavior for any action performed in this phase
    * must be implemented on the attach phase.
    */

		}, {
			key: 'detached',
			value: function detached() {}

			/**
    * Lifecycle. Called when the component is disposed. Should be overridden by
    * sub classes to dispose of any internal data or events.
    */

		}, {
			key: 'disposed',
			value: function disposed() {}

			/**
    * @inheritDoc
    */

		}, {
			key: 'disposeInternal',
			value: function disposeInternal() {
				this.disposed();

				this.detach();

				if (this.elementEventProxy_) {
					this.elementEventProxy_.dispose();
					this.elementEventProxy_ = null;
				}

				this.disposeSubComponents(Object.keys(this.components));
				this.components = null;

				this.dataManager_.dispose();
				this.dataManager_ = null;

				this.renderer_.dispose();
				this.renderer_ = null;

				babelHelpers.get(Component.prototype.__proto__ || Object.getPrototypeOf(Component.prototype), 'disposeInternal', this).call(this);
			}

			/**
    * Calls `dispose` on all subcomponents.
    * @param {!Array<string>} keys
    */

		}, {
			key: 'disposeSubComponents',
			value: function disposeSubComponents(keys) {
				for (var i = 0; i < keys.length; i++) {
					var component = this.components[keys[i]];
					if (component && !component.isDisposed()) {
						component.element = null;
						component.dispose();
						delete this.components[keys[i]];
					}
				}
			}

			/**
    * Extracts listener info from the given value.
    * @param {function()|string|{selector:string,fn:function()|string}} value
    * @return {!{selector:string,fn:function()}}
    * @protected
    */

		}, {
			key: 'extractListenerInfo_',
			value: function extractListenerInfo_(value) {
				var info = {
					fn: value
				};
				if (isObject(value) && !isFunction(value)) {
					info.selector = value.selector;
					info.fn = value.fn;
				}
				if (isString(info.fn)) {
					info.fn = this.getListenerFn(info.fn);
				}
				return info;
			}

			/**
    * Gets the `ComponentDataManager` instance being used.
    * @return {!ComponentDataManager}
    */

		}, {
			key: 'getDataManager',
			value: function getDataManager() {
				return this.dataManager_;
			}

			/**
    * Gets the configuration object that was passed to this component's constructor.
    * @return {!Object}
    */

		}, {
			key: 'getInitialConfig',
			value: function getInitialConfig() {
				return this.initialConfig_;
			}

			/**
    * Gets the listener function from its name. If the name is prefixed with a
    * component id, the function will be called on that specified component. Otherwise
    * it will be called on this component instead.
    * @param {string} fnName
    * @return {function()}
    */

		}, {
			key: 'getListenerFn',
			value: function getListenerFn(fnName) {
				if (isFunction(this[fnName])) {
					return this[fnName].bind(this);
				} else {
					console.error('No function named "' + fnName + '" was found in the ' + 'component "' + getFunctionName(this.constructor) + '". Make ' + 'sure that you specify valid function names when adding inline listeners.');
				}
			}

			/**
    * Gets state data for this component.
    * @return {!Object}
    */

		}, {
			key: 'getState',
			value: function getState() {
				return this.dataManager_.getState();
			}

			/**
    * Gets the keys for the state data.
    * @return {!Array<string>}
    */

		}, {
			key: 'getStateKeys',
			value: function getStateKeys() {
				return this.dataManager_.getStateKeys();
			}

			/**
    * Calls the synchronization function for the state key.
    * @param {string} key
    * @param {Object.<string, Object>=} opt_change Object containing newVal and
    *     prevVal keys.
    * @protected
    */

		}, {
			key: 'fireStateKeyChange_',
			value: function fireStateKeyChange_(key, opt_change) {
				var fn = this['sync' + key.charAt(0).toUpperCase() + key.slice(1)];
				if (isFunction(fn)) {
					if (!opt_change) {
						var manager = this.getDataManager();
						opt_change = {
							newVal: manager.get(key),
							prevVal: undefined
						};
					}
					fn.call(this, opt_change.newVal, opt_change.prevVal);
				}
			}

			/**
    * Gets the `ComponentRenderer` instance being used.
    * @return {!ComponentRenderer}
    */

		}, {
			key: 'getRenderer',
			value: function getRenderer() {
				return this.renderer_;
			}

			/**
    * Handles a `rendered` event from the current renderer instance.
    * @param {!Object}
    * @protected
    */

		}, {
			key: 'handleRendererRendered_',
			value: function handleRendererRendered_(data) {
				this.rendered(data);
				this.emit('rendered', data);
			}

			/**
    * Handles state batch changes. Calls any existing `sync` functions that
    * match the changed state keys.
    * @param {Event} event
    * @protected
    */

		}, {
			key: 'handleStateChanged_',
			value: function handleStateChanged_(event) {
				this.syncStateFromChanges_(event.changes);
				this.emit('stateSynced', event);
			}

			/**
    * Handles the `newListener` event. Just flags that this event type has been
    * attached, so we can start proxying it when `DomEventEmitterProxy` is created.
    * @param {string} event
    * @protected
    */

		}, {
			key: 'handleNewListener_',
			value: function handleNewListener_(event) {
				this.attachedListeners_[event] = true;
			}

			/**
    * Checks if the given function is a component constructor.
    * @param {!function()} fn Any function
    * @return {boolean}
    */

		}, {
			key: 'mergeElementClasses_',


			/**
    * Merges an array of values for the ELEMENT_CLASSES property into a single object.
    * @param {!Array.<string>} values The values to be merged.
    * @return {!string} The merged value.
    * @protected
    */
			value: function mergeElementClasses_(values) {
				var marked = {};
				return values.filter(function (val) {
					if (!val || marked[val]) {
						return false;
					} else {
						marked[val] = true;
						return true;
					}
				}).join(' ');
			}

			/**
    * Fired when the `element` state value is changed.
    * @param {!Object} event
    * @protected
    */

		}, {
			key: 'onElementChanged_',
			value: function onElementChanged_(event) {
				this.setUpProxy_();
				this.elementEventProxy_.setOriginEmitter(event.newVal);
				if (event.newVal) {
					this.syncVisible(this.dataManager_.get('visible'));
				}
			}

			/**
    * Fired when the `events` state value is changed.
    * @param {!Object} event
    * @protected
    */

		}, {
			key: 'onEventsChanged_',
			value: function onEventsChanged_(event) {
				this.eventsStateKeyHandler_.removeAllListeners();
				this.addListenersFromObj_(event.newVal);
			}

			/**
    * Creates and renders a component for the given constructor function. This
    * will always make sure that the constructor runs without rendering the
    * component, having the `render` step happen only after it has finished.
    * @param {!function()} Ctor The component's constructor function.
    * @param {Object|Element=} opt_configOrElement Optional config data or parent
    *     for the component.
    * @param {Element=} opt_element Optional parent for the component.
    * @return {!Component} The rendered component's instance.
    */

		}, {
			key: 'render_',


			/**
    * Lifecycle. Renders the component into the DOM.
    *
    * Render Lifecycle:
    *   render event - The "render" event is emitted. Renderers act on this step.
    *   state synchronization - All synchronization methods are called.
    *   attach - Attach Lifecycle is called.
    *
    * @param {(string|Element|boolean)=} opt_parentElement Optional parent element
    *     to render the component. If set to `false`, the element won't be
    *     attached to any element after rendering. In this case, `attach` should
    *     be called manually later to actually attach it to the dom.
    * @param {boolean=} opt_skipRender Optional flag indicating that the actual
    *     rendering should be skipped. Only the other render lifecycle logic will
    *     be run, like syncing state and attaching the element. Should only
    *     be set if the component has already been rendered, like sub components.
    * @protected
    */
			value: function render_(opt_parentElement, opt_skipRender) {
				if (!opt_skipRender) {
					this.emit('render');
				}
				this.setUpProxy_();
				this.syncState_();
				this.attach(opt_parentElement);
				this.wasRendered = true;
			}

			/**
    * Renders this component as a subcomponent, meaning that no actual rendering is
    * needed since it was already rendered by the parent component. This just handles
    * other logics from the rendering lifecycle, like calling sync methods for the
    * state.
    */

		}, {
			key: 'renderAsSubComponent',
			value: function renderAsSubComponent() {
				this.render_(null, true);
			}

			/**
    * Renders the component element into the DOM.
    * @param {(string|Element)=} opt_parentElement Optional parent element
    *     to render the component.
    * @param {(string|Element)=} opt_siblingElement Optional sibling element
    *     to render the component before it. Relevant when the component needs
    *     to be rendered before an existing element in the DOM, e.g.
    *     `component.attach(null, existingElement)`.
    * @protected
    */

		}, {
			key: 'renderElement_',
			value: function renderElement_(opt_parentElement, opt_siblingElement) {
				var element = this.element;
				if (element && (opt_siblingElement || !element.parentNode)) {
					var parent = toElement(opt_parentElement) || this.DEFAULT_ELEMENT_PARENT;
					parent.insertBefore(element, toElement(opt_siblingElement));
				}
			}

			/**
    * Setter logic for the element property.
    * @param {?string|Element} val
    */

		}, {
			key: 'setState',


			/**
    * Sets the value of all the specified state keys.
    * @param {!Object.<string,*>} values A map of state keys to the values they
    *   should be set to.
    * @param {function()=} opt_callback An optional function that will be run
    *   after the next batched update is triggered.
    */
			value: function setState(state, opt_callback) {
				this.dataManager_.setState(state, opt_callback);
			}

			/**
    * Setter for the `elementClasses` data property. Appends given value with
    * the one specified in `ELEMENT_CLASSES`.
    * @param {string} val
    * @return {string}
    * @protected
    */

		}, {
			key: 'setterElementClassesFn_',
			value: function setterElementClassesFn_(val) {
				if (this.constructor.ELEMENT_CLASSES_MERGED) {
					val += ' ' + this.constructor.ELEMENT_CLASSES_MERGED;
				}
				return val.trim();
			}

			/**
    * Creates the `DomEventEmitterProxy` instance and has it start proxying any
    * listeners that have already been listened to.
    * @protected
    */

		}, {
			key: 'setUpProxy_',
			value: function setUpProxy_() {
				if (this.elementEventProxy_) {
					return;
				}

				var proxy = new DomEventEmitterProxy(this.element, this);
				this.elementEventProxy_ = proxy;

				object.map(this.attachedListeners_, proxy.proxyEvent.bind(proxy));
				this.attachedListeners_ = null;

				this.newListenerHandle_.removeListener();
				this.newListenerHandle_ = null;
			}

			/**
    * Fires state synchronization functions.
    * @protected
    */

		}, {
			key: 'syncState_',
			value: function syncState_() {
				var keys = this.dataManager_.getSyncKeys();
				for (var i = 0; i < keys.length; i++) {
					this.fireStateKeyChange_(keys[i]);
				}
			}

			/**
    * Fires synchronization changes for state keys.
    * @param {Object.<string, Object>} changes Object containing the state key
    *     name as key and an object with newVal and prevVal as value.
    * @protected
    */

		}, {
			key: 'syncStateFromChanges_',
			value: function syncStateFromChanges_(changes) {
				for (var key in changes) {
					this.fireStateKeyChange_(key, changes[key]);
				}
			}

			/**
    * State synchronization logic for `visible` state key.
    * Updates the element's display value according to its visibility.
    * @param {boolean} newVal
    */

		}, {
			key: 'syncVisible',
			value: function syncVisible(newVal) {
				if (this.element) {
					this.element.style.display = newVal ? '' : 'none';
				}
			}

			/**
    * Lifecycle. Called whenever the component has just been rendered.
    * @param {boolean} firstRender Flag indicating if this was the component's
    *     first render.
    */

		}, {
			key: 'rendered',
			value: function rendered() {}

			/**
    * Validator logic for the `events` state key.
    * @param {Object} val
    * @return {boolean}
    * @protected
    */

		}, {
			key: 'validatorEventsFn_',
			value: function validatorEventsFn_(val) {
				return !isDefAndNotNull(val) || isObject(val);
			}
		}, {
			key: 'element',
			get: function get() {
				return this.elementVal_;
			},
			set: function set(val) {
				if (!isElement(val) && !isString(val) && isDefAndNotNull(val)) {
					return;
				}

				if (val) {
					val = toElement(val) || this.elementVal_;
				}

				if (this.elementVal_ !== val) {
					var prev = this.elementVal_;
					this.elementVal_ = val;
					if (this.componentCreated_) {
						this.emit('elementChanged', {
							prevVal: prev,
							newVal: val
						});
					}
				}
			}
		}], [{
			key: 'isComponentCtor',
			value: function isComponentCtor(fn) {
				return fn.prototype && fn.prototype[Component.COMPONENT_FLAG];
			}
		}, {
			key: 'render',
			value: function render(Ctor, opt_configOrElement, opt_element) {
				var config = opt_configOrElement;
				var element = opt_element;
				if (isElement(opt_configOrElement)) {
					config = null;
					element = opt_configOrElement;
				}
				var instance = new Ctor(config, false);
				instance.render_(element);
				return instance;
			}
		}]);
		return Component;
	}(EventEmitter);

	/**
  * Component data definition.
  * @type {Object}
  * @static
  */


	Component.DATA = {
		/**
   * CSS classes to be applied to the element.
   * @type {string}
   */
		elementClasses: {
			setter: 'setterElementClassesFn_',
			validator: isString,
			value: ''
		},

		/**
   * Listeners that should be attached to this component. Should be provided as an object,
   * where the keys are event names and the values are the listener functions (or function
   * names).
   * @type {Object<string, (function()|string|{selector: string, fn: function()|string})>}
   */
		events: {
			validator: 'validatorEventsFn_',
			value: null
		},

		/**
   * Indicates if the component is visible or not.
   * @type {boolean}
   */
		visible: {
			validator: isBoolean,
			value: true
		}
	};

	Component.COMPONENT_FLAG = '__metal_component__';

	/**
  * The `ComponentDataManager` class that should be used. This class will be
  * responsible for handling the component's data. Each component may have its
  * own implementation.
  */
	Component.DATA_MANAGER = ComponentDataManager;

	/**
  * CSS classes to be applied to the element.
  * @type {string}
  * @protected
  * @static
  */
	Component.ELEMENT_CLASSES = '';

	/**
  * The `ComponentRenderer` that should be used. Components need to set this
  * to a subclass of `ComponentRenderer` that has the rendering logic, like
  * `SoyRenderer`.
  * @type {!ComponentRenderer}
  * @static
  */
	Component.RENDERER = ComponentRenderer;

	/**
  * Flag indicating if component updates will happen synchronously. Updates are
  * done asynchronously by default, which allows changes to be batched and
  * applied together.
  * @type {boolean}
  */
	Component.SYNC_UPDATES = false;

	/**
  * Sets a prototype flag to easily determine if a given constructor is for
  * a component or not.
  */
	Component.prototype[Component.COMPONENT_FLAG] = true;

	this['metal']['Component'] = Component;
}).call(this);
'use strict';

(function () {
	var getFunctionName = this['metalNamed']['metal']['getFunctionName'];

	/**
  * The component registry is used to register components, so they can
  * be accessible by name.
  * @type {Object}
  */

	var ComponentRegistry = function () {
		function ComponentRegistry() {
			babelHelpers.classCallCheck(this, ComponentRegistry);
		}

		babelHelpers.createClass(ComponentRegistry, null, [{
			key: 'getConstructor',

			/**
    * Gets the constructor function for the given component name, or
    * undefined if it hasn't been registered yet.
    * @param {string} name The component's name.
    * @return {?function()}
    * @static
    */
			value: function getConstructor(name) {
				var constructorFn = ComponentRegistry.components_[name];
				if (!constructorFn) {
					console.error('There\'s no constructor registered for the component ' + 'named ' + name + '. Components need to be registered via ' + 'ComponentRegistry.register.');
				}
				return constructorFn;
			}

			/**
    * Registers a component, so it can be found by its name.
    * @param {!Function} constructorFn The component's constructor function.
    * @param {string=} opt_name Name of the registered component. If none is given
    *   the name defined by the NAME static variable will be used instead. If that
    *   isn't set as well, the name of the constructor function will be used.
    * @static
    */

		}, {
			key: 'register',
			value: function register(constructorFn, opt_name) {
				var name = opt_name;
				if (!name) {
					if (constructorFn.hasOwnProperty('NAME')) {
						name = constructorFn.NAME;
					} else {
						name = getFunctionName(constructorFn);
					}
				}
				constructorFn.NAME = name;
				ComponentRegistry.components_[name] = constructorFn;
			}
		}]);
		return ComponentRegistry;
	}();

	/**
  * Holds all registered components, indexed by their names.
  * @type {!Object<string, function()>}
  * @protected
  * @static
  */


	ComponentRegistry.components_ = {};

	this['metal']['ComponentRegistry'] = ComponentRegistry;
}).call(this);
'use strict';

(function () {
  var Component = this['metal']['Component'];
  var ComponentDataManager = this['metal']['ComponentDataManager'];
  var ComponentRegistry = this['metal']['ComponentRegistry'];
  var ComponentRenderer = this['metal']['ComponentRenderer'];
  this['metal']['component'] = Component;
  this['metalNamed']['component'] = this['metalNamed']['component'] || {};
  this['metalNamed']['component']['Component'] = Component;
  this['metalNamed']['component']['ComponentDataManager'] = ComponentDataManager;
  this['metalNamed']['component']['ComponentRegistry'] = ComponentRegistry;
  this['metalNamed']['component']['ComponentRenderer'] = ComponentRenderer;
}).call(this);
'use strict';

(function () {
	var array = this['metalNamed']['metal']['array'];
	var object = this['metalNamed']['metal']['object'];

	/**
  * Class responsible for intercepting incremental dom functions through AOP.
  */

	var IncrementalDomAop = function () {
		function IncrementalDomAop() {
			babelHelpers.classCallCheck(this, IncrementalDomAop);
		}

		babelHelpers.createClass(IncrementalDomAop, null, [{
			key: 'getOriginalFns',

			/**
    * Gets the original functions that are intercepted by `IncrementalDomAop`.
    * @return {!Object}
    */
			value: function getOriginalFns() {
				return fnStack[0];
			}

			/**
    * Starts intercepting calls to incremental dom, replacing them with the given
    * functions. Note that `elementVoid`, `elementOpenStart`, `elementOpenEnd`
    * and `attr` are the only ones that can't be intercepted, since they'll
    * automatically be converted into equivalent calls to `elementOpen` and
    * `elementClose`.
    * @param {!Object} fns Functions to be called instead of the original ones
    *     from incremental DOM. Should be given as a map from the function name
    *     to the function that should intercept it. All interceptors will receive
    *     the original function as the first argument, the actual arguments from
    *     from the original call following it.
    */

		}, {
			key: 'startInterception',
			value: function startInterception(fns) {
				var originals = IncrementalDomAop.getOriginalFns();
				fns = object.map(fns, function (name, value) {
					return value.bind(null, originals[name]);
				});
				fnStack.push(object.mixin({}, originals, fns, {
					attr: fnAttr,
					elementOpenEnd: fnOpenEnd,
					elementOpenStart: fnOpenStart,
					elementVoid: fnVoid
				}));
			}

			/**
    * Restores the original `elementOpen` function from incremental dom to the
    * implementation it used before the last call to `startInterception`.
    */

		}, {
			key: 'stopInterception',
			value: function stopInterception() {
				if (fnStack.length > 1) {
					fnStack.pop();
				}
			}
		}]);
		return IncrementalDomAop;
	}();

	var fnStack = [{
		attr: IncrementalDOM.attr,
		attributes: IncrementalDOM.attributes[IncrementalDOM.symbols.default],
		elementClose: IncrementalDOM.elementClose,
		elementOpen: IncrementalDOM.elementOpen,
		elementOpenEnd: IncrementalDOM.elementOpenEnd,
		elementOpenStart: IncrementalDOM.elementOpenStart,
		elementVoid: IncrementalDOM.elementVoid,
		text: IncrementalDOM.text
	}];

	var collectedArgs = [];

	function fnAttr(name, value) {
		collectedArgs.push(name, value);
	}

	function fnOpenStart(tag, key, statics) {
		collectedArgs = [tag, key, statics];
	}

	function fnOpenEnd() {
		return getFn('elementOpen').apply(null, collectedArgs);
	}

	function fnVoid(tag) {
		getFn('elementOpen').apply(null, arguments);
		return getFn('elementClose')(tag);
	}

	function getFn(name) {
		return fnStack[fnStack.length - 1][name];
	}

	function handleCall(name) {
		return getFn(name).apply(null, array.slice(arguments, 1));
	}

	IncrementalDOM.attr = handleCall.bind(null, 'attr');
	IncrementalDOM.elementClose = handleCall.bind(null, 'elementClose');
	IncrementalDOM.elementOpen = handleCall.bind(null, 'elementOpen');
	IncrementalDOM.elementOpenEnd = handleCall.bind(null, 'elementOpenEnd');
	IncrementalDOM.elementOpenStart = handleCall.bind(null, 'elementOpenStart');
	IncrementalDOM.elementVoid = handleCall.bind(null, 'elementVoid');
	IncrementalDOM.text = handleCall.bind(null, 'text');

	IncrementalDOM.attributes[IncrementalDOM.symbols.default] = handleCall.bind(null, 'attributes');

	this['metal']['IncrementalDomAop'] = IncrementalDomAop;
}).call(this);
'use strict';

(function () {
	var isString = this['metalNamed']['metal']['isString'];

	/**
  * Utility functions used to handle incremental dom calls.
  */

	var IncrementalDomUtils = function () {
		function IncrementalDomUtils() {
			babelHelpers.classCallCheck(this, IncrementalDomUtils);
		}

		babelHelpers.createClass(IncrementalDomUtils, null, [{
			key: 'buildConfigFromCall',

			/**
    * Builds the component config object from its incremental dom call's
    * arguments.
    * @param {!Array} args
    * @return {!Object}
    */
			value: function buildConfigFromCall(args) {
				var config = {};
				if (args[1]) {
					config.key = args[1];
				}
				var attrsArr = (args[2] || []).concat(args.slice(3));
				for (var i = 0; i < attrsArr.length; i += 2) {
					config[attrsArr[i]] = attrsArr[i + 1];
				}
				return config;
			}

			/**
    * Builds an incremental dom call array from the given tag and config object.
    * @param {string} tag
    * @param {!Object} config
    * @return {!Array}
    */

		}, {
			key: 'buildCallFromConfig',
			value: function buildCallFromConfig(tag, config) {
				var call = [tag, config.key, []];
				var keys = Object.keys(config);
				for (var i = 0; i < keys.length; i++) {
					if (keys[i] !== 'children') {
						call.push(keys[i], config[keys[i]]);
					}
				}
				return call;
			}

			/**
    * Checks if the given tag represents a metal component.
    * @param {string} tag
    * @return {boolean}
    */

		}, {
			key: 'isComponentTag',
			value: function isComponentTag(tag) {
				return !isString(tag) || tag[0] === tag[0].toUpperCase();
			}
		}]);
		return IncrementalDomUtils;
	}();

	this['metal']['IncrementalDomUtils'] = IncrementalDomUtils;
}).call(this);
'use strict';

(function () {
	var isDef = this['metalNamed']['metal']['isDef'];
	var IncrementalDomAop = this['metal']['IncrementalDomAop'];
	var IncrementalDomUtils = this['metal']['IncrementalDomUtils'];

	/**
  * Provides helpers for capturing children elements from incremental dom calls,
  * as well as actually rendering those captured children via incremental dom
  * later.
  */

	var IncrementalDomChildren = function () {
		function IncrementalDomChildren() {
			babelHelpers.classCallCheck(this, IncrementalDomChildren);
		}

		babelHelpers.createClass(IncrementalDomChildren, null, [{
			key: 'capture',

			/**
    * Captures all child elements from incremental dom calls.
    * @param {!IncrementalDomRenderer} renderer The renderer that is capturing
    *   children.
    * @param {!function()} callback Function to be called when children have all
    *     been captured.
   	 */
			value: function capture(renderer, callback) {
				renderer_ = renderer;
				callback_ = callback;
				tree_ = {
					props: {
						children: []
					}
				};
				tree_.config = tree_.props;
				currentParent_ = tree_;
				isCapturing_ = true;
				IncrementalDomAop.startInterception({
					elementClose: handleInterceptedCloseCall_,
					elementOpen: handleInterceptedOpenCall_,
					text: handleInterceptedTextCall_
				});
			}

			/**
    * Returns the owner of the current child node being rendered (or nothing
    * if there's no child being rendered).
    * @return {ComponentRenderer}
    */

		}, {
			key: 'getCurrentOwner',
			value: function getCurrentOwner() {
				return currNodeOwner_;
			}

			/**
    * Gets the node's original owner's renderer.
    * @param {!Object} node
    * @return {ComponentRenderer}
    */

		}, {
			key: 'getOwner',
			value: function getOwner(node) {
				return node[IncrementalDomChildren.CHILD_OWNER];
			}

			/**
    * Renders a children tree through incremental dom.
    * @param {!{args: Array, children: !Array, isText: ?boolean}}
    * @param {function()=} opt_skipNode Optional function that is called for
    *     each node to be rendered. If it returns true, the node will be skipped.
    * @protected
    */

		}, {
			key: 'render',
			value: function render(tree, opt_skipNode) {
				if (isCapturing_) {
					// If capturing, just add the node directly to the captured tree.
					addChildToTree(tree);
					return;
				}

				currNodeOwner_ = IncrementalDomChildren.getOwner(tree);
				if (opt_skipNode && opt_skipNode(tree)) {
					currNodeOwner_ = null;
					return;
				}

				if (isDef(tree.text)) {
					var args = tree.args ? tree.args : [];
					args[0] = tree.text;
					IncrementalDOM.text.apply(null, args);
				} else {
					var _args = IncrementalDomUtils.buildCallFromConfig(tree.tag, tree.props);
					IncrementalDOM.elementOpen.apply(null, _args);
					if (tree.props.children) {
						for (var i = 0; i < tree.props.children.length; i++) {
							IncrementalDomChildren.render(tree.props.children[i], opt_skipNode);
						}
					}
					IncrementalDOM.elementClose(tree.tag);
				}
				currNodeOwner_ = null;
			}
		}]);
		return IncrementalDomChildren;
	}();

	var callback_;
	var currNodeOwner_;
	var currentParent_;
	var isCapturing_ = false;
	var renderer_;
	var tree_;

	/**
  * Adds a child element to the tree.
  * @param {!Array} args The arguments passed to the incremental dom call.
  * @param {boolean=} opt_isText Optional flag indicating if the child is a
  *     text element.
  * @protected
  */
	function addChildCallToTree_(args, opt_isText) {
		var child = babelHelpers.defineProperty({
			parent: currentParent_
		}, IncrementalDomChildren.CHILD_OWNER, renderer_);

		if (opt_isText) {
			child.text = args[0];
			if (args.length > 1) {
				child.args = args;
			}
		} else {
			child.tag = args[0];
			child.props = IncrementalDomUtils.buildConfigFromCall(args);
			child.props.children = [];
			child.config = child.props;
		}

		addChildToTree(child);
		return child;
	}

	function addChildToTree(child) {
		currentParent_.props.children.push(child);
	}

	/**
  * Handles an intercepted call to the `elementClose` function from incremental
  * dom.
  * @protected
  */
	function handleInterceptedCloseCall_() {
		if (currentParent_ === tree_) {
			IncrementalDomAop.stopInterception();
			isCapturing_ = false;
			callback_(tree_);
			callback_ = null;
			currentParent_ = null;
			renderer_ = null;
			tree_ = null;
		} else {
			currentParent_ = currentParent_.parent;
		}
	}

	/**
  * Handles an intercepted call to the `elementOpen` function from incremental
  * dom.
  * @param {!function()} originalFn The original function before interception.
  * @protected
  */
	function handleInterceptedOpenCall_(originalFn) {
		for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
			args[_key - 1] = arguments[_key];
		}

		currentParent_ = addChildCallToTree_(args);
	}

	/**
  * Handles an intercepted call to the `text` function from incremental dom.
  * @param {!function()} originalFn The original function before interception.
  * @protected
  */
	function handleInterceptedTextCall_(originalFn) {
		for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
			args[_key2 - 1] = arguments[_key2];
		}

		addChildCallToTree_(args, true);
	}

	/**
  * Property identifying a specific object as a Metal.js child node, and
  * pointing to the renderer instance that created it.
  * @type {string}
  * @static
  */
	IncrementalDomChildren.CHILD_OWNER = '__metalChildOwner';

	this['metal']['IncrementalDomChildren'] = IncrementalDomChildren;
}).call(this);
'use strict';

(function () {
	var comps_ = [];
	var disposing_ = false;

	var IncrementalDomUnusedComponents = function () {
		function IncrementalDomUnusedComponents() {
			babelHelpers.classCallCheck(this, IncrementalDomUnusedComponents);
		}

		babelHelpers.createClass(IncrementalDomUnusedComponents, null, [{
			key: 'disposeUnused',

			/**
    * Disposes all sub components that were not rerendered since the last
    * time this function was scheduled.
    */
			value: function disposeUnused() {
				if (disposing_) {
					return;
				}
				disposing_ = true;

				for (var i = 0; i < comps_.length; i++) {
					var comp = comps_[i];
					if (!comp.isDisposed() && !comp.getRenderer().getParent()) {
						// Don't let disposing cause the element to be removed, since it may
						// be currently being reused by another component.
						comp.element = null;
						comp.dispose();
					}
				}
				comps_ = [];
				disposing_ = false;
			}

			/**
    * Schedules the given components to be checked and disposed if not used
    * anymore, when `IncrementalDomUnusedComponents.disposeUnused` is called.
    * @param {!Array<!Component>} comps
    */

		}, {
			key: 'schedule',
			value: function schedule(comps) {
				for (var i = 0; i < comps.length; i++) {
					if (!comps[i].isDisposed()) {
						comps[i].getRenderer().parent_ = null;
						comps_.push(comps[i]);
					}
				}
			}
		}]);
		return IncrementalDomUnusedComponents;
	}();

	this['metal']['IncrementalDomUnusedComponents'] = IncrementalDomUnusedComponents;
}).call(this);
'use strict';

(function () {
	var getCompatibilityModeData = this['metalNamed']['metal']['getCompatibilityModeData'];
	var getUid = this['metalNamed']['metal']['getUid'];
	var isBoolean = this['metalNamed']['metal']['isBoolean'];
	var isDef = this['metalNamed']['metal']['isDef'];
	var isDefAndNotNull = this['metalNamed']['metal']['isDefAndNotNull'];
	var isString = this['metalNamed']['metal']['isString'];
	var object = this['metalNamed']['metal']['object'];
	var append = this['metalNamed']['dom']['append'];
	var delegate = this['metalNamed']['dom']['delegate'];
	var domData = this['metalNamed']['dom']['domData'];
	var exitDocument = this['metalNamed']['dom']['exitDocument'];
	var Component = this['metalNamed']['component']['Component'];
	var ComponentRegistry = this['metalNamed']['component']['ComponentRegistry'];
	var ComponentRenderer = this['metalNamed']['component']['ComponentRenderer'];
	var IncrementalDomAop = this['metal']['IncrementalDomAop'];
	var IncrementalDomChildren = this['metal']['IncrementalDomChildren'];
	var IncrementalDomUnusedComponents = this['metal']['IncrementalDomUnusedComponents'];
	var IncrementalDomUtils = this['metal']['IncrementalDomUtils'];

	/**
  * Class responsible for rendering components via incremental dom.
  */

	var IncrementalDomRenderer = function (_ComponentRenderer) {
		babelHelpers.inherits(IncrementalDomRenderer, _ComponentRenderer);

		/**
   * @inheritDoc
   */
		function IncrementalDomRenderer(comp) {
			babelHelpers.classCallCheck(this, IncrementalDomRenderer);

			var _this = babelHelpers.possibleConstructorReturn(this, (IncrementalDomRenderer.__proto__ || Object.getPrototypeOf(IncrementalDomRenderer)).call(this, comp));

			comp.context = {};
			comp.refs = {};
			_this.config_ = comp.getInitialConfig();
			_this.childComponents_ = [];
			_this.clearChanges_();
			comp.on('attached', _this.handleAttached_.bind(_this));

			// Binds functions that will be used many times, to avoid creating new
			// functions each time.
			_this.handleInterceptedAttributesCall_ = _this.handleInterceptedAttributesCall_.bind(_this);
			_this.handleInterceptedCloseCall_ = _this.handleInterceptedCloseCall_.bind(_this);
			_this.handleInterceptedOpenCall_ = _this.handleInterceptedOpenCall_.bind(_this);
			_this.handleChildrenCaptured_ = _this.handleChildrenCaptured_.bind(_this);
			_this.handleChildRender_ = _this.handleChildRender_.bind(_this);
			_this.renderInsidePatchDontSkip_ = _this.renderInsidePatchDontSkip_.bind(_this);
			return _this;
		}

		/**
   * Adds the given css classes to the specified arguments for an incremental
   * dom call, merging with the existing value if there is one.
   * @param {string} elementClasses
   * @param {!Array} args
   * @protected
   */


		babelHelpers.createClass(IncrementalDomRenderer, [{
			key: 'addElementClasses_',
			value: function addElementClasses_(elementClasses, args) {
				for (var i = 3; i < args.length; i += 2) {
					if (args[i] === 'class') {
						args[i + 1] = this.removeDuplicateClasses_(args[i + 1] + ' ' + elementClasses);
						return;
					}
				}
				while (args.length < 3) {
					args.push(null);
				}
				args.push('class', elementClasses);
			}

			/**
    * Attaches inline listeners found on the first component render, since those
    * may come from existing elements on the page that already have
    * data-on[eventname] attributes set to its final value. This won't trigger
    * `handleInterceptedAttributesCall_`, so we need manual work to guarantee
    * that projects using progressive enhancement like this will still work.
    * @param {!Element} node
    * @param {!Array} args
    * @protected
    */

		}, {
			key: 'attachDecoratedListeners_',
			value: function attachDecoratedListeners_(node, args) {
				if (!this.component_.wasRendered) {
					var attrs = (args[2] || []).concat(args.slice(3));
					for (var i = 0; i < attrs.length; i += 2) {
						var eventName = this.getEventFromListenerAttr_(attrs[i]);
						if (eventName && !node[eventName + '__handle__']) {
							this.attachEvent_(node, attrs[i], eventName, attrs[i + 1]);
						}
					}
				}
			}

			/**
    * Listens to the specified event, attached via incremental dom calls.
    * @param {!Element} element
    * @param {string} key
    * @param {string} eventName
    * @param {function()|string} fn
    * @protected
    */

		}, {
			key: 'attachEvent_',
			value: function attachEvent_(element, key, eventName, fn) {
				var handleKey = eventName + '__handle__';
				if (element[handleKey]) {
					element[handleKey].removeListener();
					element[handleKey] = null;
				}

				element[key] = fn;
				if (fn) {
					if (isString(fn)) {
						if (key[0] === 'd') {
							// Allow data-on[eventkey] listeners to stay in the dom, as they
							// won't cause conflicts.
							element.setAttribute(key, fn);
						}
						fn = this.component_.getListenerFn(fn);
					}
					element[handleKey] = delegate(document, eventName, element, fn);
				} else {
					element.removeAttribute(key);
				}
			}

			/**
    * Builds the "children" array to be passed to the current component.
    * @param {!Array<!Object>} children
    * @return {!Array<!Object>}
    * @protected
    */

		}, {
			key: 'buildChildren_',
			value: function buildChildren_(children) {
				return children.length === 0 ? emptyChildren_ : children;
			}

			/**
    * Returns an array with the args that should be passed to the component's
    * `shouldUpdate` method. This can be overridden by sub classes to change
    * what the method should receive.
    * @return {!Array}
    * @protected
    */

		}, {
			key: 'buildShouldUpdateArgs_',
			value: function buildShouldUpdateArgs_() {
				return [this.changes_];
			}

			/**
    * Clears the changes object.
    * @protected;
    */

		}, {
			key: 'clearChanges_',
			value: function clearChanges_() {
				this.changes_ = {};
			}

			/**
    * @inheritDoc
    */

		}, {
			key: 'disposeInternal',
			value: function disposeInternal() {
				babelHelpers.get(IncrementalDomRenderer.prototype.__proto__ || Object.getPrototypeOf(IncrementalDomRenderer.prototype), 'disposeInternal', this).call(this);

				var comp = this.component_;
				var ref = this.config_.ref;
				var owner = this.getOwner();
				if (owner && owner.components && owner.components[ref] === comp) {
					delete owner.components[ref];
				}

				for (var i = 0; i < this.childComponents_.length; i++) {
					var child = this.childComponents_[i];
					if (!child.isDisposed()) {
						child.element = null;
						child.dispose();
					}
				}
				this.childComponents_ = null;
			}

			/**
    * Removes the most recent component from the queue of rendering components.
    */

		}, {
			key: 'getEventFromListenerAttr_',


			/**
    * Returns the event name if the given attribute is a listener (of the form
    * "on<EventName>"), or null if it isn't.
    * @param {string} attr
    * @return {?string}
    * @protected
    */
			value: function getEventFromListenerAttr_(attr) {
				var matches = IncrementalDomRenderer.LISTENER_REGEX.exec(attr);
				var eventName = matches ? matches[1] ? matches[1] : matches[2] : null;
				return eventName ? eventName.toLowerCase() : null;
			}

			/**
    * Gets the component that is this component's owner (that is, the one that
    * passed its data and holds its ref), or null if there's none.
    * @return {Component}
    */

		}, {
			key: 'getOwner',
			value: function getOwner() {
				return this.owner_;
			}

			/**
    * Gets the component that is this component's parent (that is, the one that
    * actually rendered it), or null if there's no parent.
    * @return {Component}
    */

		}, {
			key: 'getParent',
			value: function getParent() {
				return this.parent_;
			}

			/**
    * Returns the "ref" to be used for a component. Uses "key" as "ref" when
    * compatibility mode is on for the current renderer.
    * @param {!Object} config
    * @param {?string} ref
    * @protected
    */

		}, {
			key: 'getRef_',
			value: function getRef_(config) {
				var compatData = getCompatibilityModeData();
				if (compatData) {
					var renderers = compatData.renderers;
					var useKey = !renderers || renderers.indexOf(this.constructor) !== -1 || renderers.indexOf(this.constructor.RENDERER_NAME) !== -1;
					if (useKey && config.key && !config.ref) {
						return config.key;
					}
				}
				return config.ref;
			}

			/**
    * Gets the sub component referenced by the given tag and config data,
    * creating it if it doesn't yet exist.
    * @param {string|!Function} tagOrCtor The tag name.
    * @param {!Object} config The config object for the sub component.
    * @param {!Component} owner
    * @return {!Component} The sub component.
    * @protected
    */

		}, {
			key: 'getSubComponent_',
			value: function getSubComponent_(tagOrCtor, config, owner) {
				var Ctor = tagOrCtor;
				if (isString(Ctor)) {
					Ctor = ComponentRegistry.getConstructor(tagOrCtor);
				}

				var ref = this.getRef_(config);
				var data = IncrementalDomRenderer.getCurrentData();
				var comp;
				if (isDef(ref)) {
					comp = this.match_(owner.components[ref], Ctor, config);
					owner.addSubComponent(ref, comp);
					owner.refs[ref] = comp;
				} else if (isDef(config.key)) {
					comp = this.match_(data.prevComps.keys[config.key], Ctor, config);
					data.currComps.keys[config.key] = comp;
				} else {
					var type = getUid(Ctor, true);
					data.currComps.order[type] = data.currComps.order[type] || [];
					var order = data.currComps.order[type];
					comp = this.match_((data.prevComps.order[type] || [])[order.length], Ctor, config);
					order.push(comp);
				}

				return comp;
			}

			/**
    * Guarantees that the component's element has a parent. That's necessary
    * when calling incremental dom's `patchOuter` for now, as otherwise it will
    * throw an error if the element needs to be replaced.
    * @return {Element} The parent, in case it was added.
    * @protected
    */

		}, {
			key: 'guaranteeParent_',
			value: function guaranteeParent_() {
				var element = this.component_.element;
				if (!element || !element.parentNode) {
					var parent = document.createElement('div');
					if (element) {
						append(parent, element);
					}
					return parent;
				}
			}

			/**
    * Handles the `attached` listener. Stores attach data.
    * @param {!Object} data
    * @protected
    */

		}, {
			key: 'handleAttached_',
			value: function handleAttached_(data) {
				this.attachData_ = data;
			}

			/**
    * Handles the event of children having finished being captured.
    * @param {!Object} The captured children in tree format.
    * @protected
    */

		}, {
			key: 'handleChildrenCaptured_',
			value: function handleChildrenCaptured_(tree) {
				var _componentToRender_ = this.componentToRender_;
				var props = _componentToRender_.props;
				var tag = _componentToRender_.tag;

				props.children = this.buildChildren_(tree.props.children);
				this.componentToRender_ = null;
				this.renderFromTag_(tag, props);
			}

			/**
    * Handles a child being rendered via `IncrementalDomChildren.render`. Skips
    * component nodes so that they can be rendered the correct way without
    * having to recapture both them and their children via incremental dom.
    * @param {!Object} node
    * @return {boolean}
    * @protected
    */

		}, {
			key: 'handleChildRender_',
			value: function handleChildRender_(node) {
				if (node.tag && IncrementalDomUtils.isComponentTag(node.tag)) {
					node.props.children = this.buildChildren_(node.props.children);
					this.renderFromTag_(node.tag, node.props);
					return true;
				}
			}

			/**
    * @inheritDoc
    */

		}, {
			key: 'handleDataManagerCreated_',
			value: function handleDataManagerCreated_() {
				babelHelpers.get(IncrementalDomRenderer.prototype.__proto__ || Object.getPrototypeOf(IncrementalDomRenderer.prototype), 'handleDataManagerCreated_', this).call(this);

				var manager = this.component_.getDataManager();
				if (!this.component_.constructor.SYNC_UPDATES_MERGED) {
					// If the component is being updated synchronously we'll just reuse the
					// `handleComponentRendererStateKeyChanged_` function from
					// `ComponentRenderer`.
					manager.on('dataPropChanged', this.handleDataPropChanged_.bind(this));
				}

				manager.add('children', {
					validator: Array.isArray,
					value: emptyChildren_
				}, this.config_.children || emptyChildren_);
			}

			/**
    * Handles the `dataPropChanged` event. Stores data that has changed since the
    * last render.
    * @param {!Object} data
    * @protected
    */

		}, {
			key: 'handleDataPropChanged_',
			value: function handleDataPropChanged_(data) {
				this.changes_[data.key] = data;
			}

			/**
    * Handles an intercepted call to the attributes default handler from
    * incremental dom.
    * @param {!function()} originalFn The original function before interception.
    * @param {!Element} element
    * @param {string} name
    * @param {*} value
    * @protected
    */

		}, {
			key: 'handleInterceptedAttributesCall_',
			value: function handleInterceptedAttributesCall_(originalFn, element, name, value) {
				var eventName = this.getEventFromListenerAttr_(name);
				if (eventName) {
					this.attachEvent_(element, name, eventName, value);
					return;
				}

				if (name === 'checked') {
					// This is a temporary fix to account for incremental dom setting
					// "checked" as an attribute only, which can cause bugs since that won't
					// necessarily check/uncheck the element it's set on. See
					// https://github.com/google/incremental-dom/issues/198 for more details.
					value = isDefAndNotNull(value) && value !== false;
				}

				if (name === 'value' && element.value !== value) {
					// This is a temporary fix to account for incremental dom setting
					// "value" as an attribute only, which can cause bugs since that won't
					// necessarily update the input's content it's set on. See
					// https://github.com/google/incremental-dom/issues/239 for more details.
					// We only do this if the new value is different though, as otherwise the
					// browser will automatically move the typing cursor to the end of the
					// field.
					element[name] = value;
				}

				if (isBoolean(value)) {
					// Incremental dom sets boolean values as string data attributes, which
					// is counter intuitive. This changes the behavior to use the actual
					// boolean value.
					element[name] = value;
					if (value) {
						element.setAttribute(name, '');
					} else {
						element.removeAttribute(name);
					}
				} else {
					originalFn(element, name, value);
				}
			}

			/**
    * Handles an intercepted call to the `elementClose` function from incremental
    * dom.
    * @param {!function()} originalFn The original function before interception.
    * @param {string} tag
    * @protected
    */

		}, {
			key: 'handleInterceptedCloseCall_',
			value: function handleInterceptedCloseCall_(originalFn, tag) {
				this.emit(IncrementalDomRenderer.ELEMENT_CLOSED, { tag: tag });
				var element = originalFn(tag);
				this.resetData_(domData.get(element).incDomData_);
				return element;
			}

			/**
    * Handles an intercepted call to the `elementOpen` function from incremental
    * dom.
    * @param {!function()} originalFn The original function before interception.
    * @param {string} tag
    * @protected
    */

		}, {
			key: 'handleInterceptedOpenCall_',
			value: function handleInterceptedOpenCall_(originalFn, tag) {
				if (IncrementalDomUtils.isComponentTag(tag)) {
					return this.handleSubComponentCall_.apply(this, arguments);
				} else {
					return this.handleRegularCall_.apply(this, arguments);
				}
			}

			/**
    * Handles the `dataPropChanged` event. Overrides original method from
    * `ComponentRenderer` to guarantee that `IncrementalDomRenderer`'s logic
    * will run first.
    * @param {!Object} data
    * @override
    * @protected
    */

		}, {
			key: 'handleManagerDataPropChanged_',
			value: function handleManagerDataPropChanged_(data) {
				this.handleDataPropChanged_(data);
				babelHelpers.get(IncrementalDomRenderer.prototype.__proto__ || Object.getPrototypeOf(IncrementalDomRenderer.prototype), 'handleManagerDataPropChanged_', this).call(this, data);
			}

			/**
    * Handles an intercepted call to the `elementOpen` function from incremental
    * dom, done for a regular element. Adds any inline listeners found on the
    * first render and makes sure that component root elements are always reused.
    * @param {!function()} originalFn The original function before interception.
    * @protected
    */

		}, {
			key: 'handleRegularCall_',
			value: function handleRegularCall_(originalFn) {
				for (var _len = arguments.length, args = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
					args[_key - 1] = arguments[_key];
				}

				this.emit(IncrementalDomRenderer.ELEMENT_OPENED, { args: args });
				var currComp = IncrementalDomRenderer.getComponentBeingRendered();
				var currRenderer = currComp.getRenderer();
				if (!currRenderer.rootElementReached_) {
					if (currRenderer.config_.key) {
						args[1] = currRenderer.config_.key;
					}
					var elementClasses = currComp.getDataManager().get('elementClasses');
					if (elementClasses) {
						this.addElementClasses_(elementClasses, args);
					}
				}

				var node = originalFn.apply(null, args);
				this.attachDecoratedListeners_(node, args);
				this.updateElementIfNotReached_(node);

				var config = IncrementalDomUtils.buildConfigFromCall(args);
				if (isDefAndNotNull(config.ref)) {
					var owner = IncrementalDomChildren.getCurrentOwner() || this;
					owner.getComponent().refs[config.ref] = node;
				}
				return node;
			}

			/**
    * Handles an intercepted call to the `elementOpen` function from incremental
    * dom, done for a sub component element. Creates and updates the appropriate
    * sub component.
    * @param {!function()} originalFn The original function before interception.
    * @protected
    */

		}, {
			key: 'handleSubComponentCall_',
			value: function handleSubComponentCall_(originalFn) {
				for (var _len2 = arguments.length, args = Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
					args[_key2 - 1] = arguments[_key2];
				}

				var props = IncrementalDomUtils.buildConfigFromCall(args);
				this.componentToRender_ = {
					props: props,
					tag: args[0]
				};
				IncrementalDomChildren.capture(this, this.handleChildrenCaptured_);
			}

			/**
    * Checks if the component's data has changed.
    * @return {boolean}
    * @protected
    */

		}, {
			key: 'hasDataChanged_',
			value: function hasDataChanged_() {
				return Object.keys(this.changes_).length > 0;
			}

			/**
    * Intercepts incremental dom calls from this component.
    * @protected
    */

		}, {
			key: 'intercept_',
			value: function intercept_() {
				IncrementalDomAop.startInterception({
					attributes: this.handleInterceptedAttributesCall_,
					elementClose: this.handleInterceptedCloseCall_,
					elementOpen: this.handleInterceptedOpenCall_
				});
			}

			/**
    * Checks if the given object is an incremental dom node.
    * @param {!Object} node
    * @return {boolean}
    */

		}, {
			key: 'isMatch_',


			/**
    * Checks if the given component can be a match for a constructor.
    * @param {!Component} comp
    * @param {!function()} Ctor
    * @return {boolean}
    * @protected
    */
			value: function isMatch_(comp, Ctor) {
				if (!comp || comp.constructor !== Ctor || comp.isDisposed()) {
					return false;
				}
				return comp.getRenderer().getOwner() === this.component_;
			}

			/**
    * Returns the given component if it matches the specified constructor
    * function. Otherwise, returns a new instance of the given constructor. On
    * both cases the component's state and config will be updated.
    * @param {Component} comp
    * @param {!function()} Ctor
    * @param {!Object} config
    * @return {!Component}
    * @protected
    */

		}, {
			key: 'match_',
			value: function match_(comp, Ctor, config) {
				if (!this.isMatch_(comp, Ctor)) {
					comp = new Ctor(config, false);
				}
				if (comp.wasRendered) {
					comp.getRenderer().startSkipUpdates();
					comp.getDataManager().replaceNonInternal(config);
					comp.getRenderer().stopSkipUpdates();
				}
				comp.getRenderer().config_ = config;
				return comp;
			}

			/**
    * Patches the component's element with the incremental dom function calls
    * done by `renderInsidePatchDontSkip_`.
    */

		}, {
			key: 'patch',
			value: function patch() {
				if (!this.component_.element && this.parent_) {
					// If the component has no content but was rendered from another component,
					// we'll need to patch this parent to make sure that any new content will
					// be added in the right place.
					this.parent_.getRenderer().patch();
					return;
				}

				var tempParent = this.guaranteeParent_();
				if (tempParent) {
					IncrementalDOM.patch(tempParent, this.renderInsidePatchDontSkip_);
					exitDocument(this.component_.element);
					if (this.component_.element && this.component_.inDocument) {
						this.component_.renderElement_(this.attachData_.parent, this.attachData_.sibling);
					}
				} else {
					var element = this.component_.element;
					IncrementalDOM.patchOuter(element, this.renderInsidePatchDontSkip_);
				}
			}

			/**
    * Removes duplicate css classes from the given string.
    * @param {string} cssClasses
    * @return {string}
    * @protected
    */

		}, {
			key: 'removeDuplicateClasses_',
			value: function removeDuplicateClasses_(cssClasses) {
				var noDuplicates = [];
				var all = cssClasses.split(/\s+/);
				var used = {};
				for (var i = 0; i < all.length; i++) {
					if (!used[all[i]]) {
						used[all[i]] = true;
						noDuplicates.push(all[i]);
					}
				}
				return noDuplicates.join(' ');
			}

			/**
    * Creates and renders the given function, which can either be a simple
    * incremental dom function or a component constructor.
    * @param {!function()} fnOrCtor Either be a simple incremental dom function
    or a component constructor.
    * @param {Object|Element=} opt_dataOrElement Optional config data for the
    *     function or parent for the rendered content.
    * @param {Element=} opt_parent Optional parent for the rendered content.
    * @return {!Component} The rendered component's instance.
    */

		}, {
			key: 'render',


			/**
    * Renders the renderer's component for the first time, patching its element
    * through the incremental dom function calls done by `renderIncDom`.
    */
			value: function render() {
				this.patch();
			}

			/**
    * Renders the given child node via its owner renderer.
    * @param {!Object} child
    */

		}, {
			key: 'renderChild',


			/**
    * Renders the given child node.
    * @param {!Object} child
    */
			value: function renderChild(child) {
				this.intercept_();
				IncrementalDomChildren.render(child, this.handleChildRender_);
				IncrementalDomAop.stopInterception();
			}

			/**
    * Renders the contents for the given tag.
    * @param {!function()|string} tag
    * @param {!Object} config
    * @protected
    */

		}, {
			key: 'renderFromTag_',
			value: function renderFromTag_(tag, config) {
				if (isString(tag) || tag.prototype.getRenderer) {
					var comp = this.renderSubComponent_(tag, config);
					this.updateElementIfNotReached_(comp.element);
					return comp.element;
				} else {
					return tag(config);
				}
			}

			/**
    * Calls functions from `IncrementalDOM` to build the component element's
    * content. Can be overriden by subclasses (for integration with template
    * engines for example).
    */

		}, {
			key: 'renderIncDom',
			value: function renderIncDom() {
				if (this.component_.render) {
					this.component_.render();
				} else {
					IncrementalDOM.elementVoid('div');
				}
			}

			/**
    * Runs the incremental dom functions for rendering this component, but
    * doesn't call `patch` yet. Rather, this will be the function that should be
    * called by `patch`.
    */

		}, {
			key: 'renderInsidePatch',
			value: function renderInsidePatch() {
				if (this.component_.wasRendered && !this.shouldUpdate() && IncrementalDOM.currentPointer() === this.component_.element) {
					if (this.component_.element) {
						IncrementalDOM.skipNode();
					}
					return;
				}
				this.renderInsidePatchDontSkip_();
			}

			/**
    * The same as `renderInsidePatch`, but without the check that may skip the
    * render action.
    * @protected
    */

		}, {
			key: 'renderInsidePatchDontSkip_',
			value: function renderInsidePatchDontSkip_() {
				IncrementalDomRenderer.startedRenderingComponent(this.component_);
				this.clearChanges_();
				this.rootElementReached_ = false;
				IncrementalDomUnusedComponents.schedule(this.childComponents_);
				this.childComponents_ = [];
				this.component_.refs = {};
				this.intercept_();
				this.renderIncDom();
				IncrementalDomAop.stopInterception();
				if (!this.rootElementReached_) {
					this.component_.element = null;
				}
				this.emit('rendered', !this.isRendered_);
				IncrementalDomRenderer.finishedRenderingComponent();
				this.resetData_(this.incDomData_);
			}

			/**
    * This updates the sub component that is represented by the given data.
    * The sub component is created, added to its parent and rendered. If it
    * had already been rendered before though, it will only have its state
    * updated instead.
    * @param {string|!function()} tagOrCtor The tag name or constructor function.
    * @param {!Object} config The config object for the sub component.
    * @return {!Component} The updated sub component.
    * @protected
    */

		}, {
			key: 'renderSubComponent_',
			value: function renderSubComponent_(tagOrCtor, config) {
				var ownerRenderer = IncrementalDomChildren.getCurrentOwner() || this;
				var owner = ownerRenderer.getComponent();
				var comp = this.getSubComponent_(tagOrCtor, config, owner);
				this.updateContext_(comp);
				var renderer = comp.getRenderer();
				if (renderer instanceof IncrementalDomRenderer) {
					var parentComp = IncrementalDomRenderer.getComponentBeingRendered();
					var parentRenderer = parentComp.getRenderer();
					parentRenderer.childComponents_.push(comp);
					renderer.parent_ = parentComp;
					renderer.owner_ = owner;
					if (!config.key && !parentRenderer.rootElementReached_) {
						config.key = parentRenderer.config_.key;
					}
					renderer.renderInsidePatch();
				} else {
					console.warn('IncrementalDomRenderer doesn\'t support rendering sub components ' + 'that don\'t use IncrementalDomRenderer as well, like:', comp);
				}
				if (!comp.wasRendered) {
					comp.renderAsSubComponent();
				}
				return comp;
			}

			/**
    * Resets the given incremental dom data object, preparing it for the next
    * pass.
    * @param {Object} data
    * @protected
    */

		}, {
			key: 'resetData_',
			value: function resetData_(data) {
				if (data) {
					data.prevComps.keys = data.currComps.keys;
					data.prevComps.order = data.currComps.order;
					data.currComps.keys = {};
					data.currComps.order = {};
				}
			}

			/**
    * Checks if the component should be updated with the current state changes.
    * Can be overridden by subclasses or implemented by components to provide
    * customized behavior (only updating when a state property used by the
    * template changes, for example).
    * @return {boolean}
    */

		}, {
			key: 'shouldUpdate',
			value: function shouldUpdate() {
				if (!this.hasDataChanged_()) {
					return false;
				}
				if (this.component_.shouldUpdate) {
					var _component_;

					return (_component_ = this.component_).shouldUpdate.apply(_component_, babelHelpers.toConsumableArray(this.buildShouldUpdateArgs_()));
				}
				return true;
			}

			/**
    * Skips the next disposal of children components, by clearing the array as
    * if there were no children rendered the last time. This can be useful for
    * allowing components to be reused by other parent components in separate
    * render update cycles.
    */

		}, {
			key: 'skipNextChildrenDisposal',
			value: function skipNextChildrenDisposal() {
				this.childComponents_ = [];
			}

			/**
    * Stores the component that has just started being rendered.
    * @param {!Component} comp
    */

		}, {
			key: 'update',


			/**
    * Updates the renderer's component when state changes, patching its element
    * through the incremental dom function calls done by `renderIncDom`. Makes
    * sure that it won't cause a rerender if the only change was for the
    * "element" property.
    */
			value: function update() {
				if (this.shouldUpdate()) {
					this.patch();
				}
			}

			/**
    * Updates this renderer's component's element with the given values, unless
    * it has already been reached by an earlier call.
    * @param {!Element} node
    * @protected
    */

		}, {
			key: 'updateElementIfNotReached_',
			value: function updateElementIfNotReached_(node) {
				var currComp = IncrementalDomRenderer.getComponentBeingRendered();
				var currRenderer = currComp.getRenderer();
				if (!currRenderer.rootElementReached_) {
					currRenderer.rootElementReached_ = true;
					if (currComp.element !== node) {
						currComp.element = node;
					}
				}
			}

			/**
    * Updates the given component's context according to the data from the
    * component that is currently being rendered.
    * @param {!Component} comp
    * @protected
    */

		}, {
			key: 'updateContext_',
			value: function updateContext_(comp) {
				var context = comp.context;
				var parent = IncrementalDomRenderer.getComponentBeingRendered();
				var childContext = parent.getChildContext ? parent.getChildContext() : {};
				object.mixin(context, parent.context, childContext);
				comp.context = context;
			}
		}], [{
			key: 'finishedRenderingComponent',
			value: function finishedRenderingComponent() {
				renderingComponents_.pop();
				if (renderingComponents_.length === 0) {
					IncrementalDomUnusedComponents.disposeUnused();
				}
			}

			/**
    * Gets the component being currently rendered via `IncrementalDomRenderer`.
    * @return {Component}
    */

		}, {
			key: 'getComponentBeingRendered',
			value: function getComponentBeingRendered() {
				return renderingComponents_[renderingComponents_.length - 1];
			}

			/**
    * Gets the data object that should be currently used. This object will either
    * come from the current element being rendered by incremental dom or from
    * the component instance being rendered (only when the current element is the
    * component's direct parent).
    * @return {!Object}
    */

		}, {
			key: 'getCurrentData',
			value: function getCurrentData() {
				var element = IncrementalDOM.currentElement();
				var comp = IncrementalDomRenderer.getComponentBeingRendered();
				var renderer = comp.getRenderer();
				var obj = renderer;
				if (renderer.rootElementReached_ && element !== comp.element.parentNode) {
					obj = domData.get(element);
				}
				obj.incDomData_ = obj.incDomData_ || {
					currComps: {
						keys: {},
						order: {}
					},
					prevComps: {
						keys: {},
						order: {}
					}
				};
				return obj.incDomData_;
			}
		}, {
			key: 'isIncDomNode',
			value: function isIncDomNode(node) {
				return !!node[IncrementalDomChildren.CHILD_OWNER];
			}
		}, {
			key: 'render',
			value: function render(fnOrCtor, opt_dataOrElement, opt_parent) {
				if (!Component.isComponentCtor(fnOrCtor)) {
					var fn = fnOrCtor;

					var TempComponent = function (_Component) {
						babelHelpers.inherits(TempComponent, _Component);

						function TempComponent() {
							babelHelpers.classCallCheck(this, TempComponent);
							return babelHelpers.possibleConstructorReturn(this, (TempComponent.__proto__ || Object.getPrototypeOf(TempComponent)).apply(this, arguments));
						}

						babelHelpers.createClass(TempComponent, [{
							key: 'created',
							value: function created() {
								if (IncrementalDomRenderer.getComponentBeingRendered()) {
									this.getRenderer().updateContext_(this);
								}
							}
						}, {
							key: 'render',
							value: function render() {
								fn(this.getRenderer().config_);
							}
						}]);
						return TempComponent;
					}(Component);

					TempComponent.RENDERER = IncrementalDomRenderer;
					fnOrCtor = TempComponent;
				}
				return Component.render(fnOrCtor, opt_dataOrElement, opt_parent);
			}
		}, {
			key: 'renderChild',
			value: function renderChild(child) {
				child[IncrementalDomChildren.CHILD_OWNER].renderChild(child);
			}
		}, {
			key: 'startedRenderingComponent',
			value: function startedRenderingComponent(comp) {
				renderingComponents_.push(comp);
			}
		}]);
		return IncrementalDomRenderer;
	}(ComponentRenderer);

	var renderingComponents_ = [];
	var emptyChildren_ = [];

	// Constants used as event names.
	IncrementalDomRenderer.ELEMENT_OPENED = 'elementOpened';
	IncrementalDomRenderer.ELEMENT_CLOSED = 'elementClosed';

	// Regex pattern used to find inline listeners.
	IncrementalDomRenderer.LISTENER_REGEX = /^(?:on([A-Z]\w+))|(?:data-on(\w+))$/;

	// Name of this renderer. Renderers should provide this as a way to identify
	// them via a simple string (when calling enableCompatibilityMode to add
	// support to old features for specific renderers for example).
	IncrementalDomRenderer.RENDERER_NAME = 'incremental-dom';

	this['metal']['IncrementalDomRenderer'] = IncrementalDomRenderer;
}).call(this);
'use strict';

(function () {
	var isDefAndNotNull = this['metalNamed']['metal']['isDefAndNotNull'];
	var IncrementalDomRenderer = this['metal']['IncrementalDomRenderer'];


	var childrenCount = [];

	/**
  * Renderer that handles JSX.
  */

	var JSXRenderer = function (_IncrementalDomRender) {
		babelHelpers.inherits(JSXRenderer, _IncrementalDomRender);

		/**
   * @inheritDoc
   */
		function JSXRenderer(comp) {
			babelHelpers.classCallCheck(this, JSXRenderer);

			var _this = babelHelpers.possibleConstructorReturn(this, (JSXRenderer.__proto__ || Object.getPrototypeOf(JSXRenderer)).call(this, comp));

			_this.on(IncrementalDomRenderer.ELEMENT_OPENED, _this.handleJSXElementOpened_);
			_this.on(IncrementalDomRenderer.ELEMENT_CLOSED, _this.handleJSXElementClosed_);
			return _this;
		}

		/**
   * @inheritDoc
   */


		babelHelpers.createClass(JSXRenderer, [{
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
				babelHelpers.get(JSXRenderer.prototype.__proto__ || Object.getPrototypeOf(JSXRenderer.prototype), 'clearChanges_', this).call(this);
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
					babelHelpers.get(JSXRenderer.prototype.__proto__ || Object.getPrototypeOf(JSXRenderer.prototype), 'handleDataPropChanged_', this).call(this, data);
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

				if (!isDefAndNotNull(args[1])) {
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
				return babelHelpers.get(JSXRenderer.prototype.__proto__ || Object.getPrototypeOf(JSXRenderer.prototype), 'hasDataChanged_', this).call(this) || Object.keys(this.propChanges_).length > 0;
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
					babelHelpers.get(JSXRenderer.prototype.__proto__ || Object.getPrototypeOf(JSXRenderer.prototype), 'renderIncDom', this).call(this);
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
	}(IncrementalDomRenderer);

	JSXRenderer.KEY_PREFIX = '_metal_jsx_';
	JSXRenderer.RENDERER_NAME = 'jsx';

	this['metal']['JSXRenderer'] = JSXRenderer;
}).call(this);
'use strict';

(function () {
	var IncrementalDomRenderer = this['metal']['IncrementalDomRenderer'];
	var JSXRenderer = this['metal']['JSXRenderer'];

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
		var type = typeof child === 'undefined' ? 'undefined' : babelHelpers.typeof(child);
		if (type === 'number' || type === 'string' || child && child instanceof String) {
			IncrementalDOM.text(child);
		} else if (type === 'function' && child.__jsxDOMWrapper) {
			child();
		} else if (Array.isArray(child)) {
			child.forEach(window.iDOMHelpers.renderArbitrary);
		} else if (String(child) === '[object Object]') {
			// Renders special incremental dom nodes in a special way :)
			if (IncrementalDomRenderer.isIncDomNode(child)) {
				IncrementalDomRenderer.renderChild(child);
			} else {
				window.iDOMHelpers.forOwn(child, window.iDOMHelpers.renderArbitrary);
			}
		} else if (!child) {
			JSXRenderer.skipChild();
		}
	};

	this['metal']['iDOMHelpers'] = window.iDOMHelpers;
}).call(this);
'use strict';

(function () {
	var mergeSuperClassesProperty = this['metalNamed']['metal']['mergeSuperClassesProperty'];
	var object = this['metalNamed']['metal']['object'];
	var ComponentDataManager = this['metalNamed']['component']['ComponentDataManager'];
	var State = this['metal']['state'];

	var JSXDataManager = function (_ComponentDataManager) {
		babelHelpers.inherits(JSXDataManager, _ComponentDataManager);

		function JSXDataManager() {
			babelHelpers.classCallCheck(this, JSXDataManager);
			return babelHelpers.possibleConstructorReturn(this, (JSXDataManager.__proto__ || Object.getPrototypeOf(JSXDataManager)).apply(this, arguments));
		}

		babelHelpers.createClass(JSXDataManager, [{
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
				mergeSuperClassesProperty(ctor, 'PROPS', State.mergeState);
				return object.mixin({}, data, this.component_.constructor.PROPS_MERGED);
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
				babelHelpers.get(JSXDataManager.prototype.__proto__ || Object.getPrototypeOf(JSXDataManager.prototype), 'createState_', this).call(this, data, this.component_.props);
				this.props_ = this.state_;
				this.addUnconfiguredProps_(this.component_.getInitialConfig());

				this.component_.state = {};
				this.state_ = new State({}, this.component_.state, this.component_, {
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
				babelHelpers.get(JSXDataManager.prototype.__proto__ || Object.getPrototypeOf(JSXDataManager.prototype), 'disposeInternal', this).call(this);

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
				var opt_type = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'props';

				data.type = opt_type;
				babelHelpers.get(JSXDataManager.prototype.__proto__ || Object.getPrototypeOf(JSXDataManager.prototype), 'emit_', this).call(this, data, event);
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
				var prevProps = object.mixin({}, this.component_.props);
				ComponentDataManager.replaceNonInternal(data, this.props_);
				this.addUnconfiguredProps_(data);
				if (this.component_.propsChanged) {
					this.component_.propsChanged(prevProps);
				}
			}
		}]);
		return JSXDataManager;
	}(ComponentDataManager);

	JSXDataManager.BLACKLIST = {};

	this['metal']['JSXDataManager'] = JSXDataManager;
}).call(this);
'use strict';

(function () {
	var validators = this['metalNamed']['state']['validators'];
	var Config = this['metalNamed']['state']['Config'];
	var Component = this['metal']['component'];
	var IncrementalDomRenderer = this['metal']['IncrementalDomRenderer'];
	var JSXDataManager = this['metal']['JSXDataManager'];
	var JSXRenderer = this['metal']['JSXRenderer'];

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
		babelHelpers.inherits(JSXComponent, _Component);

		function JSXComponent() {
			babelHelpers.classCallCheck(this, JSXComponent);
			return babelHelpers.possibleConstructorReturn(this, (JSXComponent.__proto__ || Object.getPrototypeOf(JSXComponent)).apply(this, arguments));
		}

		babelHelpers.createClass(JSXComponent, null, [{
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
				return IncrementalDomRenderer.render.apply(IncrementalDomRenderer, arguments);
			}
		}]);
		return JSXComponent;
	}(Component);

	JSXComponent.DATA_MANAGER = JSXDataManager;
	JSXComponent.RENDERER = JSXRenderer;

	this['metal']['JSXComponent'] = JSXComponent;
	this['metalNamed']['JSXComponent'] = this['metalNamed']['JSXComponent'] || {};
	this['metalNamed']['JSXComponent']['validators'] = validators;
	this['metalNamed']['JSXComponent']['Config'] = Config;
	this['metalNamed']['JSXComponent']['JSXComponent'] = JSXComponent;
}).call(this);
'use strict';

(function () {
	var JSXComponent = this['metal']['JSXComponent'];

	var JsFiddleMetalComponent = function (_JSXComponent) {
		babelHelpers.inherits(JsFiddleMetalComponent, _JSXComponent);

		function JsFiddleMetalComponent() {
			babelHelpers.classCallCheck(this, JsFiddleMetalComponent);
			return babelHelpers.possibleConstructorReturn(this, (JsFiddleMetalComponent.__proto__ || Object.getPrototypeOf(JsFiddleMetalComponent)).apply(this, arguments));
		}

		babelHelpers.createClass(JsFiddleMetalComponent, [{
			key: 'render',
			value: function render() {
				IncrementalDOM.elementOpen('div');
				IncrementalDOM.text('Thx for using MetalJS.');
				return IncrementalDOM.elementClose('div');
			}
		}]);
		return JsFiddleMetalComponent;
	}(JSXComponent);

	this['metal']['JsFiddleMetalComponent'] = JsFiddleMetalComponent;
}).call(this);
}).call(this);
//# sourceMappingURL=jsFiddleMetalComponent.js.map
