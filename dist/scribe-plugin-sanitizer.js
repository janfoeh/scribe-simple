(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.scribePluginSanitizer = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define('html-janitor', factory);
  } else if (typeof exports === 'object') {
    module.exports = factory();
  } else {
    root.HTMLJanitor = factory();
  }
}(this, function () {

  /**
   * @param {Object} config.tags Dictionary of allowed tags.
   * @param {boolean} config.keepNestedBlockElements Default false.
   */
  function HTMLJanitor(config) {
    this.config = config;
  }

  // TODO: not exhaustive?
  var blockElementNames = ['P', 'LI', 'TD', 'TH', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE'];
  function isBlockElement(node) {
    return blockElementNames.indexOf(node.nodeName) !== -1;
  }

  var inlineElementNames = ['A', 'B', 'STRONG', 'I', 'EM', 'SUB', 'SUP', 'U', 'STRIKE'];
  function isInlineElement(node) {
    return inlineElementNames.indexOf(node.nodeName) !== -1;
  }

  HTMLJanitor.prototype.clean = function (html) {
    var sandbox = document.createElement('div');
    sandbox.innerHTML = html;

    this._sanitize(sandbox);

    return sandbox.innerHTML;
  };

  HTMLJanitor.prototype._sanitize = function (parentNode) {
    var treeWalker = createTreeWalker(parentNode);
    var node = treeWalker.firstChild();
    if (!node) { return; }

    do {
      var nodeName = node.nodeName.toLowerCase();
      var allowedAttrs = this.config.tags[nodeName];

      // Ignore nodes that have already been sanitized
      if (node._sanitized) {
        continue;
      }

      if (node.nodeType === Node.TEXT_NODE) {
        // If this text node is just whitespace and the previous or next element
        // sibling is a block element, remove it
        // N.B.: This heuristic could change. Very specific to a bug with
        // `contenteditable` in Firefox: http://jsbin.com/EyuKase/1/edit?js,output
        // FIXME: make this an option?
        if (node.data.trim() === ''
            && ((node.previousElementSibling && isBlockElement(node.previousElementSibling))
                 || (node.nextElementSibling && isBlockElement(node.nextElementSibling)))) {
          parentNode.removeChild(node);
          this._sanitize(parentNode);
          break;
        } else {
          continue;
        }
      }

      // Remove all comments
      if (node.nodeType === Node.COMMENT_NODE) {
        parentNode.removeChild(node);
        this._sanitize(parentNode);
        break;
      }

      var isInline = isInlineElement(node);
      var containsBlockElement;
      if (isInline) {
        containsBlockElement = Array.prototype.some.call(node.childNodes, isBlockElement);
      }

      var isInvalid = isInline && containsBlockElement;

      // Block elements should not be nested (e.g. <li><p>...); if
      // they are, we want to unwrap the inner block element.
      var isNotTopContainer = !! parentNode.parentNode;
      var isNestedBlockElement =
            isBlockElement(parentNode) &&
            isBlockElement(node) &&
            isNotTopContainer;

      // Drop tag entirely according to the whitelist *and* if the markup
      // is invalid.
      if (!this.config.tags[nodeName] || isInvalid || (!this.config.keepNestedBlockElements && isNestedBlockElement)) {
        // Do not keep the inner text of SCRIPT/STYLE elements.
        if (! (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE')) {
          while (node.childNodes.length > 0) {
            parentNode.insertBefore(node.childNodes[0], node);
          }
        }
        parentNode.removeChild(node);

        this._sanitize(parentNode);
        break;
      }

      // Sanitize attributes
      for (var a = 0; a < node.attributes.length; a += 1) {
        var attr = node.attributes[a];
        var attrName = attr.name.toLowerCase();

        // Allow attribute?
        var allowedAttrValue = allowedAttrs[attrName] || allowedAttrs === true;
        var notInAttrList = ! allowedAttrValue;
        var valueNotAllowed = allowedAttrValue !== true && attr.value !== allowedAttrValue;
        if (notInAttrList || valueNotAllowed) {
          node.removeAttribute(attr.name);
          // Shift the array to continue looping.
          a = a - 1;
        }
      }

      // Sanitize children
      this._sanitize(node);

      // Mark node as sanitized so it's ignored in future runs
      node._sanitized = true;
    } while ((node = treeWalker.nextSibling()));
  };

  function createTreeWalker(node) {
    return document.createTreeWalker(node,
                                     NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_COMMENT,
                                     null, false);
  }

  return HTMLJanitor;

}));

},{}],2:[function(require,module,exports){
function arrayCopy(source, array) {
    var index = -1, length = source.length;
    array || (array = Array(length));
    while (++index < length) {
        array[index] = source[index];
    }
    return array;
}
module.exports = arrayCopy;
},{}],3:[function(require,module,exports){
function arrayEach(array, iteratee) {
    var index = -1, length = array.length;
    while (++index < length) {
        if (iteratee(array[index], index, array) === false) {
            break;
        }
    }
    return array;
}
module.exports = arrayEach;
},{}],4:[function(require,module,exports){
var arrayCopy = require('./arrayCopy'), arrayEach = require('./arrayEach'), baseCopy = require('./baseCopy'), baseForOwn = require('./baseForOwn'), initCloneArray = require('./initCloneArray'), initCloneByTag = require('./initCloneByTag'), initCloneObject = require('./initCloneObject'), isArray = require('../lang/isArray'), isObject = require('../lang/isObject'), keys = require('../object/keys');
var argsTag = '[object Arguments]', arrayTag = '[object Array]', boolTag = '[object Boolean]', dateTag = '[object Date]', errorTag = '[object Error]', funcTag = '[object Function]', mapTag = '[object Map]', numberTag = '[object Number]', objectTag = '[object Object]', regexpTag = '[object RegExp]', setTag = '[object Set]', stringTag = '[object String]', weakMapTag = '[object WeakMap]';
var arrayBufferTag = '[object ArrayBuffer]', float32Tag = '[object Float32Array]', float64Tag = '[object Float64Array]', int8Tag = '[object Int8Array]', int16Tag = '[object Int16Array]', int32Tag = '[object Int32Array]', uint8Tag = '[object Uint8Array]', uint8ClampedTag = '[object Uint8ClampedArray]', uint16Tag = '[object Uint16Array]', uint32Tag = '[object Uint32Array]';
var cloneableTags = {};
cloneableTags[argsTag] = cloneableTags[arrayTag] = cloneableTags[arrayBufferTag] = cloneableTags[boolTag] = cloneableTags[dateTag] = cloneableTags[float32Tag] = cloneableTags[float64Tag] = cloneableTags[int8Tag] = cloneableTags[int16Tag] = cloneableTags[int32Tag] = cloneableTags[numberTag] = cloneableTags[objectTag] = cloneableTags[regexpTag] = cloneableTags[stringTag] = cloneableTags[uint8Tag] = cloneableTags[uint8ClampedTag] = cloneableTags[uint16Tag] = cloneableTags[uint32Tag] = true;
cloneableTags[errorTag] = cloneableTags[funcTag] = cloneableTags[mapTag] = cloneableTags[setTag] = cloneableTags[weakMapTag] = false;
var objectProto = Object.prototype;
var objToString = objectProto.toString;
function baseClone(value, isDeep, customizer, key, object, stackA, stackB) {
    var result;
    if (customizer) {
        result = object ? customizer(value, key, object) : customizer(value);
    }
    if (typeof result != 'undefined') {
        return result;
    }
    if (!isObject(value)) {
        return value;
    }
    var isArr = isArray(value);
    if (isArr) {
        result = initCloneArray(value);
        if (!isDeep) {
            return arrayCopy(value, result);
        }
    } else {
        var tag = objToString.call(value), isFunc = tag == funcTag;
        if (tag == objectTag || tag == argsTag || isFunc && !object) {
            result = initCloneObject(isFunc ? {} : value);
            if (!isDeep) {
                return baseCopy(value, result, keys(value));
            }
        } else {
            return cloneableTags[tag] ? initCloneByTag(value, tag, isDeep) : object ? value : {};
        }
    }
    stackA || (stackA = []);
    stackB || (stackB = []);
    var length = stackA.length;
    while (length--) {
        if (stackA[length] == value) {
            return stackB[length];
        }
    }
    stackA.push(value);
    stackB.push(result);
    (isArr ? arrayEach : baseForOwn)(value, function (subValue, key) {
        result[key] = baseClone(subValue, isDeep, customizer, key, value, stackA, stackB);
    });
    return result;
}
module.exports = baseClone;
},{"../lang/isArray":28,"../lang/isObject":30,"../object/keys":34,"./arrayCopy":2,"./arrayEach":3,"./baseCopy":5,"./baseForOwn":8,"./initCloneArray":15,"./initCloneByTag":16,"./initCloneObject":17}],5:[function(require,module,exports){
function baseCopy(source, object, props) {
    if (!props) {
        props = object;
        object = {};
    }
    var index = -1, length = props.length;
    while (++index < length) {
        var key = props[index];
        object[key] = source[key];
    }
    return object;
}
module.exports = baseCopy;
},{}],6:[function(require,module,exports){
var toObject = require('./toObject');
function baseFor(object, iteratee, keysFunc) {
    var index = -1, iterable = toObject(object), props = keysFunc(object), length = props.length;
    while (++index < length) {
        var key = props[index];
        if (iteratee(iterable[key], key, iterable) === false) {
            break;
        }
    }
    return object;
}
module.exports = baseFor;
},{"./toObject":25}],7:[function(require,module,exports){
var baseFor = require('./baseFor'), keysIn = require('../object/keysIn');
function baseForIn(object, iteratee) {
    return baseFor(object, iteratee, keysIn);
}
module.exports = baseForIn;
},{"../object/keysIn":35,"./baseFor":6}],8:[function(require,module,exports){
var baseFor = require('./baseFor'), keys = require('../object/keys');
function baseForOwn(object, iteratee) {
    return baseFor(object, iteratee, keys);
}
module.exports = baseForOwn;
},{"../object/keys":34,"./baseFor":6}],9:[function(require,module,exports){
var arrayEach = require('./arrayEach'), baseForOwn = require('./baseForOwn'), baseMergeDeep = require('./baseMergeDeep'), isArray = require('../lang/isArray'), isLength = require('./isLength'), isObject = require('../lang/isObject'), isObjectLike = require('./isObjectLike'), isTypedArray = require('../lang/isTypedArray');
var undefined;
function baseMerge(object, source, customizer, stackA, stackB) {
    if (!isObject(object)) {
        return object;
    }
    var isSrcArr = isLength(source.length) && (isArray(source) || isTypedArray(source));
    (isSrcArr ? arrayEach : baseForOwn)(source, function (srcValue, key, source) {
        if (isObjectLike(srcValue)) {
            stackA || (stackA = []);
            stackB || (stackB = []);
            return baseMergeDeep(object, source, key, baseMerge, customizer, stackA, stackB);
        }
        var value = object[key], result = customizer ? customizer(value, srcValue, key, object, source) : undefined, isCommon = typeof result == 'undefined';
        if (isCommon) {
            result = srcValue;
        }
        if ((isSrcArr || typeof result != 'undefined') && (isCommon || (result === result ? result !== value : value === value))) {
            object[key] = result;
        }
    });
    return object;
}
module.exports = baseMerge;
},{"../lang/isArray":28,"../lang/isObject":30,"../lang/isTypedArray":32,"./arrayEach":3,"./baseForOwn":8,"./baseMergeDeep":10,"./isLength":20,"./isObjectLike":21}],10:[function(require,module,exports){
var arrayCopy = require('./arrayCopy'), isArguments = require('../lang/isArguments'), isArray = require('../lang/isArray'), isLength = require('./isLength'), isPlainObject = require('../lang/isPlainObject'), isTypedArray = require('../lang/isTypedArray'), toPlainObject = require('../lang/toPlainObject');
var undefined;
function baseMergeDeep(object, source, key, mergeFunc, customizer, stackA, stackB) {
    var length = stackA.length, srcValue = source[key];
    while (length--) {
        if (stackA[length] == srcValue) {
            object[key] = stackB[length];
            return;
        }
    }
    var value = object[key], result = customizer ? customizer(value, srcValue, key, object, source) : undefined, isCommon = typeof result == 'undefined';
    if (isCommon) {
        result = srcValue;
        if (isLength(srcValue.length) && (isArray(srcValue) || isTypedArray(srcValue))) {
            result = isArray(value) ? value : value ? arrayCopy(value) : [];
        } else if (isPlainObject(srcValue) || isArguments(srcValue)) {
            result = isArguments(value) ? toPlainObject(value) : isPlainObject(value) ? value : {};
        } else {
            isCommon = false;
        }
    }
    stackA.push(srcValue);
    stackB.push(result);
    if (isCommon) {
        object[key] = mergeFunc(result, srcValue, customizer, stackA, stackB);
    } else if (result === result ? result !== value : value === value) {
        object[key] = result;
    }
}
module.exports = baseMergeDeep;
},{"../lang/isArguments":27,"../lang/isArray":28,"../lang/isPlainObject":31,"../lang/isTypedArray":32,"../lang/toPlainObject":33,"./arrayCopy":2,"./isLength":20}],11:[function(require,module,exports){
function baseToString(value) {
    if (typeof value == 'string') {
        return value;
    }
    return value == null ? '' : value + '';
}
module.exports = baseToString;
},{}],12:[function(require,module,exports){
var identity = require('../utility/identity');
function bindCallback(func, thisArg, argCount) {
    if (typeof func != 'function') {
        return identity;
    }
    if (typeof thisArg == 'undefined') {
        return func;
    }
    switch (argCount) {
    case 1:
        return function (value) {
            return func.call(thisArg, value);
        };
    case 3:
        return function (value, index, collection) {
            return func.call(thisArg, value, index, collection);
        };
    case 4:
        return function (accumulator, value, index, collection) {
            return func.call(thisArg, accumulator, value, index, collection);
        };
    case 5:
        return function (value, other, key, object, source) {
            return func.call(thisArg, value, other, key, object, source);
        };
    }
    return function () {
        return func.apply(thisArg, arguments);
    };
}
module.exports = bindCallback;
},{"../utility/identity":40}],13:[function(require,module,exports){
var constant = require('../utility/constant'), isNative = require('../lang/isNative'), root = require('./root');
var ArrayBuffer = isNative(ArrayBuffer = root.ArrayBuffer) && ArrayBuffer, bufferSlice = isNative(bufferSlice = ArrayBuffer && new ArrayBuffer(0).slice) && bufferSlice, floor = Math.floor, Uint8Array = isNative(Uint8Array = root.Uint8Array) && Uint8Array;
var Float64Array = function () {
        try {
            var func = isNative(func = root.Float64Array) && func, result = new func(new ArrayBuffer(10), 0, 1) && func;
        } catch (e) {
        }
        return result;
    }();
var FLOAT64_BYTES_PER_ELEMENT = Float64Array ? Float64Array.BYTES_PER_ELEMENT : 0;
function bufferClone(buffer) {
    return bufferSlice.call(buffer, 0);
}
if (!bufferSlice) {
    bufferClone = !(ArrayBuffer && Uint8Array) ? constant(null) : function (buffer) {
        var byteLength = buffer.byteLength, floatLength = Float64Array ? floor(byteLength / FLOAT64_BYTES_PER_ELEMENT) : 0, offset = floatLength * FLOAT64_BYTES_PER_ELEMENT, result = new ArrayBuffer(byteLength);
        if (floatLength) {
            var view = new Float64Array(result, 0, floatLength);
            view.set(new Float64Array(buffer, 0, floatLength));
        }
        if (byteLength != offset) {
            view = new Uint8Array(result, offset);
            view.set(new Uint8Array(buffer, offset));
        }
        return result;
    };
}
module.exports = bufferClone;
},{"../lang/isNative":29,"../utility/constant":39,"./root":22}],14:[function(require,module,exports){
var bindCallback = require('./bindCallback'), isIterateeCall = require('./isIterateeCall');
function createAssigner(assigner) {
    return function () {
        var args = arguments, length = args.length, object = args[0];
        if (length < 2 || object == null) {
            return object;
        }
        var customizer = args[length - 2], thisArg = args[length - 1], guard = args[3];
        if (length > 3 && typeof customizer == 'function') {
            customizer = bindCallback(customizer, thisArg, 5);
            length -= 2;
        } else {
            customizer = length > 2 && typeof thisArg == 'function' ? thisArg : null;
            length -= customizer ? 1 : 0;
        }
        if (guard && isIterateeCall(args[1], args[2], guard)) {
            customizer = length == 3 ? null : customizer;
            length = 2;
        }
        var index = 0;
        while (++index < length) {
            var source = args[index];
            if (source) {
                assigner(object, source, customizer);
            }
        }
        return object;
    };
}
module.exports = createAssigner;
},{"./bindCallback":12,"./isIterateeCall":19}],15:[function(require,module,exports){
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
function initCloneArray(array) {
    var length = array.length, result = new array.constructor(length);
    if (length && typeof array[0] == 'string' && hasOwnProperty.call(array, 'index')) {
        result.index = array.index;
        result.input = array.input;
    }
    return result;
}
module.exports = initCloneArray;
},{}],16:[function(require,module,exports){
var bufferClone = require('./bufferClone');
var boolTag = '[object Boolean]', dateTag = '[object Date]', numberTag = '[object Number]', regexpTag = '[object RegExp]', stringTag = '[object String]';
var arrayBufferTag = '[object ArrayBuffer]', float32Tag = '[object Float32Array]', float64Tag = '[object Float64Array]', int8Tag = '[object Int8Array]', int16Tag = '[object Int16Array]', int32Tag = '[object Int32Array]', uint8Tag = '[object Uint8Array]', uint8ClampedTag = '[object Uint8ClampedArray]', uint16Tag = '[object Uint16Array]', uint32Tag = '[object Uint32Array]';
var reFlags = /\w*$/;
function initCloneByTag(object, tag, isDeep) {
    var Ctor = object.constructor;
    switch (tag) {
    case arrayBufferTag:
        return bufferClone(object);
    case boolTag:
    case dateTag:
        return new Ctor(+object);
    case float32Tag:
    case float64Tag:
    case int8Tag:
    case int16Tag:
    case int32Tag:
    case uint8Tag:
    case uint8ClampedTag:
    case uint16Tag:
    case uint32Tag:
        var buffer = object.buffer;
        return new Ctor(isDeep ? bufferClone(buffer) : buffer, object.byteOffset, object.length);
    case numberTag:
    case stringTag:
        return new Ctor(object);
    case regexpTag:
        var result = new Ctor(object.source, reFlags.exec(object));
        result.lastIndex = object.lastIndex;
    }
    return result;
}
module.exports = initCloneByTag;
},{"./bufferClone":13}],17:[function(require,module,exports){
function initCloneObject(object) {
    var Ctor = object.constructor;
    if (!(typeof Ctor == 'function' && Ctor instanceof Ctor)) {
        Ctor = Object;
    }
    return new Ctor();
}
module.exports = initCloneObject;
},{}],18:[function(require,module,exports){
var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
function isIndex(value, length) {
    value = +value;
    length = length == null ? MAX_SAFE_INTEGER : length;
    return value > -1 && value % 1 == 0 && value < length;
}
module.exports = isIndex;
},{}],19:[function(require,module,exports){
var isIndex = require('./isIndex'), isLength = require('./isLength'), isObject = require('../lang/isObject');
function isIterateeCall(value, index, object) {
    if (!isObject(object)) {
        return false;
    }
    var type = typeof index;
    if (type == 'number') {
        var length = object.length, prereq = isLength(length) && isIndex(index, length);
    } else {
        prereq = type == 'string' && index in object;
    }
    if (prereq) {
        var other = object[index];
        return value === value ? value === other : other !== other;
    }
    return false;
}
module.exports = isIterateeCall;
},{"../lang/isObject":30,"./isIndex":18,"./isLength":20}],20:[function(require,module,exports){
var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;
function isLength(value) {
    return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
}
module.exports = isLength;
},{}],21:[function(require,module,exports){
function isObjectLike(value) {
    return value && typeof value == 'object' || false;
}
module.exports = isObjectLike;
},{}],22:[function(require,module,exports){
(function (global){
var objectTypes = {
        'function': true,
        'object': true
    };
var freeExports = objectTypes[typeof exports] && exports && !exports.nodeType && exports;
var freeModule = objectTypes[typeof module] && module && !module.nodeType && module;
var freeGlobal = freeExports && freeModule && typeof global == 'object' && global;
var freeWindow = objectTypes[typeof window] && window;
var root = freeGlobal || freeWindow !== (this && this.window) && freeWindow || this;
module.exports = root;
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],23:[function(require,module,exports){
var baseForIn = require('./baseForIn'), isObjectLike = require('./isObjectLike');
var objectTag = '[object Object]';
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
var objToString = objectProto.toString;
function shimIsPlainObject(value) {
    var Ctor;
    if (!(isObjectLike(value) && objToString.call(value) == objectTag) || !hasOwnProperty.call(value, 'constructor') && (Ctor = value.constructor, typeof Ctor == 'function' && !(Ctor instanceof Ctor))) {
        return false;
    }
    var result;
    baseForIn(value, function (subValue, key) {
        result = key;
    });
    return typeof result == 'undefined' || hasOwnProperty.call(value, result);
}
module.exports = shimIsPlainObject;
},{"./baseForIn":7,"./isObjectLike":21}],24:[function(require,module,exports){
var isArguments = require('../lang/isArguments'), isArray = require('../lang/isArray'), isIndex = require('./isIndex'), isLength = require('./isLength'), keysIn = require('../object/keysIn'), support = require('../support');
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
function shimKeys(object) {
    var props = keysIn(object), propsLength = props.length, length = propsLength && object.length;
    var allowIndexes = length && isLength(length) && (isArray(object) || support.nonEnumArgs && isArguments(object));
    var index = -1, result = [];
    while (++index < propsLength) {
        var key = props[index];
        if (allowIndexes && isIndex(key, length) || hasOwnProperty.call(object, key)) {
            result.push(key);
        }
    }
    return result;
}
module.exports = shimKeys;
},{"../lang/isArguments":27,"../lang/isArray":28,"../object/keysIn":35,"../support":38,"./isIndex":18,"./isLength":20}],25:[function(require,module,exports){
var isObject = require('../lang/isObject');
function toObject(value) {
    return isObject(value) ? value : Object(value);
}
module.exports = toObject;
},{"../lang/isObject":30}],26:[function(require,module,exports){
var baseClone = require('../internal/baseClone'), bindCallback = require('../internal/bindCallback');
function cloneDeep(value, customizer, thisArg) {
    customizer = typeof customizer == 'function' && bindCallback(customizer, thisArg, 1);
    return baseClone(value, true, customizer);
}
module.exports = cloneDeep;
},{"../internal/baseClone":4,"../internal/bindCallback":12}],27:[function(require,module,exports){
var isLength = require('../internal/isLength'), isObjectLike = require('../internal/isObjectLike');
var undefined;
var argsTag = '[object Arguments]';
var objectProto = Object.prototype;
var objToString = objectProto.toString;
function isArguments(value) {
    var length = isObjectLike(value) ? value.length : undefined;
    return isLength(length) && objToString.call(value) == argsTag || false;
}
module.exports = isArguments;
},{"../internal/isLength":20,"../internal/isObjectLike":21}],28:[function(require,module,exports){
var isLength = require('../internal/isLength'), isNative = require('./isNative'), isObjectLike = require('../internal/isObjectLike');
var arrayTag = '[object Array]';
var objectProto = Object.prototype;
var objToString = objectProto.toString;
var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray;
var isArray = nativeIsArray || function (value) {
        return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag || false;
    };
module.exports = isArray;
},{"../internal/isLength":20,"../internal/isObjectLike":21,"./isNative":29}],29:[function(require,module,exports){
var escapeRegExp = require('../string/escapeRegExp'), isObjectLike = require('../internal/isObjectLike');
var funcTag = '[object Function]';
var reHostCtor = /^\[object .+?Constructor\]$/;
var objectProto = Object.prototype;
var fnToString = Function.prototype.toString;
var objToString = objectProto.toString;
var reNative = RegExp('^' + escapeRegExp(objToString).replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');
function isNative(value) {
    if (value == null) {
        return false;
    }
    if (objToString.call(value) == funcTag) {
        return reNative.test(fnToString.call(value));
    }
    return isObjectLike(value) && reHostCtor.test(value) || false;
}
module.exports = isNative;
},{"../internal/isObjectLike":21,"../string/escapeRegExp":37}],30:[function(require,module,exports){
function isObject(value) {
    var type = typeof value;
    return type == 'function' || value && type == 'object' || false;
}
module.exports = isObject;
},{}],31:[function(require,module,exports){
var isNative = require('./isNative'), shimIsPlainObject = require('../internal/shimIsPlainObject');
var objectTag = '[object Object]';
var objectProto = Object.prototype;
var objToString = objectProto.toString;
var getPrototypeOf = isNative(getPrototypeOf = Object.getPrototypeOf) && getPrototypeOf;
var isPlainObject = !getPrototypeOf ? shimIsPlainObject : function (value) {
        if (!(value && objToString.call(value) == objectTag)) {
            return false;
        }
        var valueOf = value.valueOf, objProto = isNative(valueOf) && (objProto = getPrototypeOf(valueOf)) && getPrototypeOf(objProto);
        return objProto ? value == objProto || getPrototypeOf(value) == objProto : shimIsPlainObject(value);
    };
module.exports = isPlainObject;
},{"../internal/shimIsPlainObject":23,"./isNative":29}],32:[function(require,module,exports){
var isLength = require('../internal/isLength'), isObjectLike = require('../internal/isObjectLike');
var argsTag = '[object Arguments]', arrayTag = '[object Array]', boolTag = '[object Boolean]', dateTag = '[object Date]', errorTag = '[object Error]', funcTag = '[object Function]', mapTag = '[object Map]', numberTag = '[object Number]', objectTag = '[object Object]', regexpTag = '[object RegExp]', setTag = '[object Set]', stringTag = '[object String]', weakMapTag = '[object WeakMap]';
var arrayBufferTag = '[object ArrayBuffer]', float32Tag = '[object Float32Array]', float64Tag = '[object Float64Array]', int8Tag = '[object Int8Array]', int16Tag = '[object Int16Array]', int32Tag = '[object Int32Array]', uint8Tag = '[object Uint8Array]', uint8ClampedTag = '[object Uint8ClampedArray]', uint16Tag = '[object Uint16Array]', uint32Tag = '[object Uint32Array]';
var typedArrayTags = {};
typedArrayTags[float32Tag] = typedArrayTags[float64Tag] = typedArrayTags[int8Tag] = typedArrayTags[int16Tag] = typedArrayTags[int32Tag] = typedArrayTags[uint8Tag] = typedArrayTags[uint8ClampedTag] = typedArrayTags[uint16Tag] = typedArrayTags[uint32Tag] = true;
typedArrayTags[argsTag] = typedArrayTags[arrayTag] = typedArrayTags[arrayBufferTag] = typedArrayTags[boolTag] = typedArrayTags[dateTag] = typedArrayTags[errorTag] = typedArrayTags[funcTag] = typedArrayTags[mapTag] = typedArrayTags[numberTag] = typedArrayTags[objectTag] = typedArrayTags[regexpTag] = typedArrayTags[setTag] = typedArrayTags[stringTag] = typedArrayTags[weakMapTag] = false;
var objectProto = Object.prototype;
var objToString = objectProto.toString;
function isTypedArray(value) {
    return isObjectLike(value) && isLength(value.length) && typedArrayTags[objToString.call(value)] || false;
}
module.exports = isTypedArray;
},{"../internal/isLength":20,"../internal/isObjectLike":21}],33:[function(require,module,exports){
var baseCopy = require('../internal/baseCopy'), keysIn = require('../object/keysIn');
function toPlainObject(value) {
    return baseCopy(value, keysIn(value));
}
module.exports = toPlainObject;
},{"../internal/baseCopy":5,"../object/keysIn":35}],34:[function(require,module,exports){
var isLength = require('../internal/isLength'), isNative = require('../lang/isNative'), isObject = require('../lang/isObject'), shimKeys = require('../internal/shimKeys');
var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;
var keys = !nativeKeys ? shimKeys : function (object) {
        if (object) {
            var Ctor = object.constructor, length = object.length;
        }
        if (typeof Ctor == 'function' && Ctor.prototype === object || typeof object != 'function' && (length && isLength(length))) {
            return shimKeys(object);
        }
        return isObject(object) ? nativeKeys(object) : [];
    };
module.exports = keys;
},{"../internal/isLength":20,"../internal/shimKeys":24,"../lang/isNative":29,"../lang/isObject":30}],35:[function(require,module,exports){
var isArguments = require('../lang/isArguments'), isArray = require('../lang/isArray'), isIndex = require('../internal/isIndex'), isLength = require('../internal/isLength'), isObject = require('../lang/isObject'), support = require('../support');
var objectProto = Object.prototype;
var hasOwnProperty = objectProto.hasOwnProperty;
function keysIn(object) {
    if (object == null) {
        return [];
    }
    if (!isObject(object)) {
        object = Object(object);
    }
    var length = object.length;
    length = length && isLength(length) && (isArray(object) || support.nonEnumArgs && isArguments(object)) && length || 0;
    var Ctor = object.constructor, index = -1, isProto = typeof Ctor == 'function' && Ctor.prototype === object, result = Array(length), skipIndexes = length > 0;
    while (++index < length) {
        result[index] = index + '';
    }
    for (var key in object) {
        if (!(skipIndexes && isIndex(key, length)) && !(key == 'constructor' && (isProto || !hasOwnProperty.call(object, key)))) {
            result.push(key);
        }
    }
    return result;
}
module.exports = keysIn;
},{"../internal/isIndex":18,"../internal/isLength":20,"../lang/isArguments":27,"../lang/isArray":28,"../lang/isObject":30,"../support":38}],36:[function(require,module,exports){
var baseMerge = require('../internal/baseMerge'), createAssigner = require('../internal/createAssigner');
var merge = createAssigner(baseMerge);
module.exports = merge;
},{"../internal/baseMerge":9,"../internal/createAssigner":14}],37:[function(require,module,exports){
var baseToString = require('../internal/baseToString');
var reRegExpChars = /[.*+?^${}()|[\]\/\\]/g, reHasRegExpChars = RegExp(reRegExpChars.source);
function escapeRegExp(string) {
    string = baseToString(string);
    return string && reHasRegExpChars.test(string) ? string.replace(reRegExpChars, '\\$&') : string;
}
module.exports = escapeRegExp;
},{"../internal/baseToString":11}],38:[function(require,module,exports){
var isNative = require('./lang/isNative'), root = require('./internal/root');
var reThis = /\bthis\b/;
var objectProto = Object.prototype;
var document = (document = root.window) && document.document;
var propertyIsEnumerable = objectProto.propertyIsEnumerable;
var support = {};
(function (x) {
    support.funcDecomp = !isNative(root.WinRTError) && reThis.test(function () {
        return this;
    });
    support.funcNames = typeof Function.name == 'string';
    try {
        support.dom = document.createDocumentFragment().nodeType === 11;
    } catch (e) {
        support.dom = false;
    }
    try {
        support.nonEnumArgs = !propertyIsEnumerable.call(arguments, 1);
    } catch (e) {
        support.nonEnumArgs = true;
    }
}(0, 0));
module.exports = support;
},{"./internal/root":22,"./lang/isNative":29}],39:[function(require,module,exports){
function constant(value) {
    return function () {
        return value;
    };
}
module.exports = constant;
},{}],40:[function(require,module,exports){
function identity(value) {
    return value;
}
module.exports = identity;
},{}],41:[function(require,module,exports){
var HTMLJanitor = require('html-janitor'), merge = require('lodash-amd/modern/object/merge'), cloneDeep = require('lodash-amd/modern/lang/cloneDeep');
'use strict';
module.exports = function (config) {
    var configAllowMarkers = merge(cloneDeep(config), {
            tags: {
                em: { class: 'scribe-marker' },
                br: {}
            }
        });
    return function (scribe) {
        var janitor = new HTMLJanitor(configAllowMarkers);
        scribe.registerHTMLFormatter('sanitize', janitor.clean.bind(janitor));
    };
};
},{"html-janitor":1,"lodash-amd/modern/lang/cloneDeep":26,"lodash-amd/modern/object/merge":36}]},{},[41])(41)
});