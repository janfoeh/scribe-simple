(function(f) {
    if (typeof exports === "object" && typeof module !== "undefined") {
        module.exports = f()
    }
    else if (typeof define === "function" && define.amd) {
        define([], f)
    }
    else {
        var g;
        if (typeof window !== "undefined") {
            g = window
        }
        else if (typeof global !== "undefined") {
            g = global
        }
        else if (typeof self !== "undefined") {
            g = self
        }
        else {
            g = this
        }
        g.scribePluginCurlyQuotes = f()
    }
})(function() {
    var define, module, exports;
    return (function e(t, n, r) {
        function s(o, u) {
            if (!n[o]) {
                if (!t[o]) {
                    var a = typeof require == "function" && require;
                    if (!u && a) return a(o, !0);
                    if (i) return i(o, !0);
                    var f = new Error("Cannot find module '" + o + "'");
                    throw f.code = "MODULE_NOT_FOUND", f
                }
                var l = n[o] = {
                    exports: {}
                };
                t[o][0].call(l.exports, function(e) {
                    var n = t[o][1][e];
                    return s(n ? n : e)
                }, l, l.exports, e, t, n, r)
            }
            return n[o].exports
        }
        var i = typeof require == "function" && require;
        for (var o = 0; o < r.length; o++) s(r[o]);
        return s
    })({
        1: [function(require, module, exports) {
            var isString = require('../objects/isString'),
                slice = require('../internals/slice'),
                values = require('../objects/values');

            function toArray(collection) {
                if (collection && typeof collection.length == 'number') {
                    return slice(collection);
                }
                return values(collection);
            }
            module.exports = toArray;
}, {
            "../internals/slice": 5,
            "../objects/isString": 7,
            "../objects/values": 9
        }],
        2: [function(require, module, exports) {
            var objectProto = Object.prototype;
            var toString = objectProto.toString;
            var reNative = RegExp('^' + String(toString)
                .replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
                .replace(/toString| for [^\]]+/g, '.*?') + '$');

            function isNative(value) {
                return typeof value == 'function' && reNative.test(value);
            }
            module.exports = isNative;
}, {}],
        3: [function(require, module, exports) {
            var objectTypes = {
                'boolean': false,
                'function': true,
                'object': true,
                'number': false,
                'string': false,
                'undefined': false
            };
            module.exports = objectTypes;
}, {}],
        4: [function(require, module, exports) {
            var objectTypes = require('./objectTypes');
            var objectProto = Object.prototype;
            var hasOwnProperty = objectProto.hasOwnProperty;
            var shimKeys = function(object) {
                var index, iterable = object,
                    result = [];
                if (!iterable)
                    return result;
                if (!objectTypes[typeof object])
                    return result;
                for (index in iterable) {
                    if (hasOwnProperty.call(iterable, index)) {
                        result.push(index);
                    }
                }
                return result;
            };
            module.exports = shimKeys;
}, {
            "./objectTypes": 3
        }],
        5: [function(require, module, exports) {
            function slice(array, start, end) {
                start || (start = 0);
                if (typeof end == 'undefined') {
                    end = array ? array.length : 0;
                }
                var index = -1,
                    length = end - start || 0,
                    result = Array(length < 0 ? 0 : length);
                while (++index < length) {
                    result[index] = array[start + index];
                }
                return result;
            }
            module.exports = slice;
}, {}],
        6: [function(require, module, exports) {
            var objectTypes = require('../internals/objectTypes');

            function isObject(value) {
                return !!(value && objectTypes[typeof value]);
            }
            module.exports = isObject;
}, {
            "../internals/objectTypes": 3
        }],
        7: [function(require, module, exports) {
            var stringClass = '[object String]';
            var objectProto = Object.prototype;
            var toString = objectProto.toString;

            function isString(value) {
                return typeof value == 'string' || value && typeof value == 'object' && toString.call(value) == stringClass || false;
            }
            module.exports = isString;
}, {}],
        8: [function(require, module, exports) {
            var isNative = require('../internals/isNative'),
                isObject = require('./isObject'),
                shimKeys = require('../internals/shimKeys');
            var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;
            var keys = !nativeKeys ? shimKeys : function(object) {
                if (!isObject(object)) {
                    return [];
                }
                return nativeKeys(object);
            };
            module.exports = keys;
}, {
            "../internals/isNative": 2,
            "../internals/shimKeys": 4,
            "./isObject": 6
        }],
        9: [function(require, module, exports) {
            var keys = require('./keys');

            function values(object) {
                var index = -1,
                    props = keys(object),
                    length = props.length,
                    result = Array(length);
                while (++index < length) {
                    result[index] = object[props[index]];
                }
                return result;
            }
            module.exports = values;
}, {
            "./keys": 8
        }],
        10: [function(require, module, exports) {
            var toArray = require('lodash-amd/modern/collections/toArray');
            'use strict';
            module.exports = function() {
                var openDoubleCurly = '\u201c';
                var closeDoubleCurly = '\u201d';
                var openSingleCurly = '\u2018';
                var closeSingleCurly = '\u2019';
                var NON_BREAKING_SPACE = '\xa0';
                return function(scribe) {
                    var keys = {
                        34: '"',
                        39: '\''
                    };
                    var curlyQuoteChar;
                    var elementHelpers = scribe.element;
                    scribe.el.addEventListener('keypress', function(event) {
                        curlyQuoteChar = keys[event.charCode];
                    });
                    scribe.el.addEventListener('input', function() {
                        if (curlyQuoteChar) {
                            var selection = new scribe.api.Selection();
                            var containingBlockElement = scribe.allowsBlockElements() ? selection.getContaining(elementHelpers.isBlockElement) : scribe.el;
                            selection.placeMarkers();
                            containingBlockElement.innerHTML = substituteCurlyQuotes(containingBlockElement.innerHTML);
                            selection.selectMarkers();
                            curlyQuoteChar = undefined;
                        }
                    });
                    scribe.registerHTMLFormatter('normalize', substituteCurlyQuotes);

                    function isWordCharacter(character) {
                        return /[^\s()]/.test(character);
                    }

                    function substituteCurlyQuotes(html) {
                        var holder = document.createElement('div');
                        holder.innerHTML = html;
                        mapElements(holder, function(prev, str) {
                            var tokens = (prev + str)
                                .split(/(<[^>]+?>(?:.*<\/[^>]+?>)?)/);
                            return tokens.map(function(token) {
                                    if (/^</.test(token)) {
                                        return token;
                                    }
                                    else {
                                        return convert(token);
                                    }
                                })
                                .join('')
                                .slice(prev.length);
                        });
                        return holder.innerHTML;
                    }

                    function convert(str) {
                        if (!/['"]/.test(str)) {
                            return str;
                        }
                        else {
                            var foo = str.replace(/([\s\S])?'/, replaceQuotesFromContext(openSingleCurly, closeSingleCurly))
                                .replace(/([\s\S])?"/, replaceQuotesFromContext(openDoubleCurly, closeDoubleCurly));
                            return convert(foo);
                        }
                    }

                    function replaceQuotesFromContext(openCurly, closeCurly) {
                        return function(m, prev) {
                            prev = prev || '';
                            var hasCharsBefore = isWordCharacter(prev);
                            if (hasCharsBefore) {
                                return prev + closeCurly;
                            }
                            else {
                                return prev + openCurly;
                            }
                        };
                    }

                    function mapElements(containerElement, func) {
                        var nestedBlockElements = toArray(containerElement.children)
                            .filter(elementHelpers.isBlockElement);
                        if (nestedBlockElements.length) {
                            nestedBlockElements.forEach(function(nestedBlockElement) {
                                mapElements(nestedBlockElement, func);
                            });
                        }
                        else {
                            mapTextNodes(containerElement, func);
                        }
                    }

                    function mapTextNodes(containerElement, func) {
                        var walker = document.createTreeWalker(containerElement, NodeFilter.SHOW_TEXT);
                        var node = walker.firstChild();
                        var prevTextNodes = '';
                        while (node) {
                            if (node.previousSibling && node.previousSibling.nodeName === 'BR') {
                                prevTextNodes = '';
                            }
                            node.data = func(prevTextNodes, node.data);
                            prevTextNodes += node.data;
                            node = walker.nextSibling();
                        }
                    }
                };
            };
}, {
            "lodash-amd/modern/collections/toArray": 1
        }]
    }, {}, [10])(10)
});