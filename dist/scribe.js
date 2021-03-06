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
        g.Scribe = f()
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
            /**
             *  Copyright (c) 2014-2015, Facebook, Inc.
             *  All rights reserved.
             *
             *  This source code is licensed under the BSD-style license found in the
             *  LICENSE file in the root directory of this source tree. An additional grant
             *  of patent rights can be found in the PATENTS file in the same directory.
             */
            (function(global, factory) {
                typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
                    typeof define === 'function' && define.amd ? define(factory) :
                    global.Immutable = factory()
            }(this, function() {
                'use strict';
                var SLICE$0 = Array.prototype.slice;

                function createClass(ctor, superClass) {
                    if (superClass) {
                        ctor.prototype = Object.create(superClass.prototype);
                    }
                    ctor.prototype.constructor = ctor;
                }

                // Used for setting prototype methods that IE8 chokes on.
                var DELETE = 'delete';

                // Constants describing the size of trie nodes.
                var SHIFT = 5; // Resulted in best performance after ______?
                var SIZE = 1 << SHIFT;
                var MASK = SIZE - 1;

                // A consistent shared value representing "not set" which equals nothing other
                // than itself, and nothing that could be provided externally.
                var NOT_SET = {};

                // Boolean references, Rough equivalent of `bool &`.
                var CHANGE_LENGTH = {
                    value: false
                };
                var DID_ALTER = {
                    value: false
                };

                function MakeRef(ref) {
                    ref.value = false;
                    return ref;
                }

                function SetRef(ref) {
                    ref && (ref.value = true);
                }

                // A function which returns a value representing an "owner" for transient writes
                // to tries. The return value will only ever equal itself, and will not equal
                // the return of any subsequent call of this function.
                function OwnerID() {}

                // http://jsperf.com/copy-array-inline
                function arrCopy(arr, offset) {
                    offset = offset || 0;
                    var len = Math.max(0, arr.length - offset);
                    var newArr = new Array(len);
                    for (var ii = 0; ii < len; ii++) {
                        newArr[ii] = arr[ii + offset];
                    }
                    return newArr;
                }

                function ensureSize(iter) {
                    if (iter.size === undefined) {
                        iter.size = iter.__iterate(returnTrue);
                    }
                    return iter.size;
                }

                function wrapIndex(iter, index) {
                    return index >= 0 ? (+index) : ensureSize(iter) + (+index);
                }

                function returnTrue() {
                    return true;
                }

                function wholeSlice(begin, end, size) {
                    return (begin === 0 || (size !== undefined && begin <= -size)) &&
                        (end === undefined || (size !== undefined && end >= size));
                }

                function resolveBegin(begin, size) {
                    return resolveIndex(begin, size, 0);
                }

                function resolveEnd(end, size) {
                    return resolveIndex(end, size, size);
                }

                function resolveIndex(index, size, defaultIndex) {
                    return index === undefined ?
                        defaultIndex :
                        index < 0 ?
                        Math.max(0, size + index) :
                        size === undefined ?
                        index :
                        Math.min(size, index);
                }

                function Iterable(value) {
                    return isIterable(value) ? value : Seq(value);
                }


                createClass(KeyedIterable, Iterable);

                function KeyedIterable(value) {
                    return isKeyed(value) ? value : KeyedSeq(value);
                }


                createClass(IndexedIterable, Iterable);

                function IndexedIterable(value) {
                    return isIndexed(value) ? value : IndexedSeq(value);
                }


                createClass(SetIterable, Iterable);

                function SetIterable(value) {
                    return isIterable(value) && !isAssociative(value) ? value : SetSeq(value);
                }



                function isIterable(maybeIterable) {
                    return !!(maybeIterable && maybeIterable[IS_ITERABLE_SENTINEL]);
                }

                function isKeyed(maybeKeyed) {
                    return !!(maybeKeyed && maybeKeyed[IS_KEYED_SENTINEL]);
                }

                function isIndexed(maybeIndexed) {
                    return !!(maybeIndexed && maybeIndexed[IS_INDEXED_SENTINEL]);
                }

                function isAssociative(maybeAssociative) {
                    return isKeyed(maybeAssociative) || isIndexed(maybeAssociative);
                }

                function isOrdered(maybeOrdered) {
                    return !!(maybeOrdered && maybeOrdered[IS_ORDERED_SENTINEL]);
                }

                Iterable.isIterable = isIterable;
                Iterable.isKeyed = isKeyed;
                Iterable.isIndexed = isIndexed;
                Iterable.isAssociative = isAssociative;
                Iterable.isOrdered = isOrdered;

                Iterable.Keyed = KeyedIterable;
                Iterable.Indexed = IndexedIterable;
                Iterable.Set = SetIterable;


                var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
                var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
                var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
                var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

                /* global Symbol */

                var ITERATE_KEYS = 0;
                var ITERATE_VALUES = 1;
                var ITERATE_ENTRIES = 2;

                var REAL_ITERATOR_SYMBOL = typeof Symbol === 'function' && Symbol.iterator;
                var FAUX_ITERATOR_SYMBOL = '@@iterator';

                var ITERATOR_SYMBOL = REAL_ITERATOR_SYMBOL || FAUX_ITERATOR_SYMBOL;


                function src_Iterator__Iterator(next) {
                    this.next = next;
                }

                src_Iterator__Iterator.prototype.toString = function() {
                    return '[Iterator]';
                };


                src_Iterator__Iterator.KEYS = ITERATE_KEYS;
                src_Iterator__Iterator.VALUES = ITERATE_VALUES;
                src_Iterator__Iterator.ENTRIES = ITERATE_ENTRIES;

                src_Iterator__Iterator.prototype.inspect =
                    src_Iterator__Iterator.prototype.toSource = function() {
                        return this.toString();
                    }
                src_Iterator__Iterator.prototype[ITERATOR_SYMBOL] = function() {
                    return this;
                };


                function iteratorValue(type, k, v, iteratorResult) {
                    var value = type === 0 ? k : type === 1 ? v : [k, v];
                    iteratorResult ? (iteratorResult.value = value) : (iteratorResult = {
                        value: value,
                        done: false
                    });
                    return iteratorResult;
                }

                function iteratorDone() {
                    return {
                        value: undefined,
                        done: true
                    };
                }

                function hasIterator(maybeIterable) {
                    return !!getIteratorFn(maybeIterable);
                }

                function isIterator(maybeIterator) {
                    return maybeIterator && typeof maybeIterator.next === 'function';
                }

                function getIterator(iterable) {
                    var iteratorFn = getIteratorFn(iterable);
                    return iteratorFn && iteratorFn.call(iterable);
                }

                function getIteratorFn(iterable) {
                    var iteratorFn = iterable && (
                        (REAL_ITERATOR_SYMBOL && iterable[REAL_ITERATOR_SYMBOL]) ||
                        iterable[FAUX_ITERATOR_SYMBOL]
                    );
                    if (typeof iteratorFn === 'function') {
                        return iteratorFn;
                    }
                }

                function isArrayLike(value) {
                    return value && typeof value.length === 'number';
                }

                createClass(Seq, Iterable);

                function Seq(value) {
                    return value === null || value === undefined ? emptySequence() :
                        isIterable(value) ? value.toSeq() : seqFromValue(value);
                }

                Seq.of = function( /*...values*/ ) {
                    return Seq(arguments);
                };

                Seq.prototype.toSeq = function() {
                    return this;
                };

                Seq.prototype.toString = function() {
                    return this.__toString('Seq {', '}');
                };

                Seq.prototype.cacheResult = function() {
                    if (!this._cache && this.__iterateUncached) {
                        this._cache = this.entrySeq()
                            .toArray();
                        this.size = this._cache.length;
                    }
                    return this;
                };

                // abstract __iterateUncached(fn, reverse)

                Seq.prototype.__iterate = function(fn, reverse) {
                    return seqIterate(this, fn, reverse, true);
                };

                // abstract __iteratorUncached(type, reverse)

                Seq.prototype.__iterator = function(type, reverse) {
                    return seqIterator(this, type, reverse, true);
                };



                createClass(KeyedSeq, Seq);

                function KeyedSeq(value) {
                    return value === null || value === undefined ?
                        emptySequence()
                        .toKeyedSeq() :
                        isIterable(value) ?
                        (isKeyed(value) ? value.toSeq() : value.fromEntrySeq()) :
                        keyedSeqFromValue(value);
                }

                KeyedSeq.prototype.toKeyedSeq = function() {
                    return this;
                };



                createClass(IndexedSeq, Seq);

                function IndexedSeq(value) {
                    return value === null || value === undefined ? emptySequence() :
                        !isIterable(value) ? indexedSeqFromValue(value) :
                        isKeyed(value) ? value.entrySeq() : value.toIndexedSeq();
                }

                IndexedSeq.of = function( /*...values*/ ) {
                    return IndexedSeq(arguments);
                };

                IndexedSeq.prototype.toIndexedSeq = function() {
                    return this;
                };

                IndexedSeq.prototype.toString = function() {
                    return this.__toString('Seq [', ']');
                };

                IndexedSeq.prototype.__iterate = function(fn, reverse) {
                    return seqIterate(this, fn, reverse, false);
                };

                IndexedSeq.prototype.__iterator = function(type, reverse) {
                    return seqIterator(this, type, reverse, false);
                };



                createClass(SetSeq, Seq);

                function SetSeq(value) {
                    return (
                            value === null || value === undefined ? emptySequence() :
                            !isIterable(value) ? indexedSeqFromValue(value) :
                            isKeyed(value) ? value.entrySeq() : value
                        )
                        .toSetSeq();
                }

                SetSeq.of = function( /*...values*/ ) {
                    return SetSeq(arguments);
                };

                SetSeq.prototype.toSetSeq = function() {
                    return this;
                };



                Seq.isSeq = isSeq;
                Seq.Keyed = KeyedSeq;
                Seq.Set = SetSeq;
                Seq.Indexed = IndexedSeq;

                var IS_SEQ_SENTINEL = '@@__IMMUTABLE_SEQ__@@';

                Seq.prototype[IS_SEQ_SENTINEL] = true;



                // #pragma Root Sequences

                createClass(ArraySeq, IndexedSeq);

                function ArraySeq(array) {
                    this._array = array;
                    this.size = array.length;
                }

                ArraySeq.prototype.get = function(index, notSetValue) {
                    return this.has(index) ? this._array[wrapIndex(this, index)] : notSetValue;
                };

                ArraySeq.prototype.__iterate = function(fn, reverse) {
                    var array = this._array;
                    var maxIndex = array.length - 1;
                    for (var ii = 0; ii <= maxIndex; ii++) {
                        if (fn(array[reverse ? maxIndex - ii : ii], ii, this) === false) {
                            return ii + 1;
                        }
                    }
                    return ii;
                };

                ArraySeq.prototype.__iterator = function(type, reverse) {
                    var array = this._array;
                    var maxIndex = array.length - 1;
                    var ii = 0;
                    return new src_Iterator__Iterator(function() {
                        return ii > maxIndex ?
                            iteratorDone() :
                            iteratorValue(type, ii, array[reverse ? maxIndex - ii++ : ii++])
                    });
                };



                createClass(ObjectSeq, KeyedSeq);

                function ObjectSeq(object) {
                    var keys = Object.keys(object);
                    this._object = object;
                    this._keys = keys;
                    this.size = keys.length;
                }

                ObjectSeq.prototype.get = function(key, notSetValue) {
                    if (notSetValue !== undefined && !this.has(key)) {
                        return notSetValue;
                    }
                    return this._object[key];
                };

                ObjectSeq.prototype.has = function(key) {
                    return this._object.hasOwnProperty(key);
                };

                ObjectSeq.prototype.__iterate = function(fn, reverse) {
                    var object = this._object;
                    var keys = this._keys;
                    var maxIndex = keys.length - 1;
                    for (var ii = 0; ii <= maxIndex; ii++) {
                        var key = keys[reverse ? maxIndex - ii : ii];
                        if (fn(object[key], key, this) === false) {
                            return ii + 1;
                        }
                    }
                    return ii;
                };

                ObjectSeq.prototype.__iterator = function(type, reverse) {
                    var object = this._object;
                    var keys = this._keys;
                    var maxIndex = keys.length - 1;
                    var ii = 0;
                    return new src_Iterator__Iterator(function() {
                        var key = keys[reverse ? maxIndex - ii : ii];
                        return ii++ > maxIndex ?
                            iteratorDone() :
                            iteratorValue(type, key, object[key]);
                    });
                };

                ObjectSeq.prototype[IS_ORDERED_SENTINEL] = true;


                createClass(IterableSeq, IndexedSeq);

                function IterableSeq(iterable) {
                    this._iterable = iterable;
                    this.size = iterable.length || iterable.size;
                }

                IterableSeq.prototype.__iterateUncached = function(fn, reverse) {
                    if (reverse) {
                        return this.cacheResult()
                            .__iterate(fn, reverse);
                    }
                    var iterable = this._iterable;
                    var iterator = getIterator(iterable);
                    var iterations = 0;
                    if (isIterator(iterator)) {
                        var step;
                        while (!(step = iterator.next())
                            .done) {
                            if (fn(step.value, iterations++, this) === false) {
                                break;
                            }
                        }
                    }
                    return iterations;
                };

                IterableSeq.prototype.__iteratorUncached = function(type, reverse) {
                    if (reverse) {
                        return this.cacheResult()
                            .__iterator(type, reverse);
                    }
                    var iterable = this._iterable;
                    var iterator = getIterator(iterable);
                    if (!isIterator(iterator)) {
                        return new src_Iterator__Iterator(iteratorDone);
                    }
                    var iterations = 0;
                    return new src_Iterator__Iterator(function() {
                        var step = iterator.next();
                        return step.done ? step : iteratorValue(type, iterations++, step.value);
                    });
                };



                createClass(IteratorSeq, IndexedSeq);

                function IteratorSeq(iterator) {
                    this._iterator = iterator;
                    this._iteratorCache = [];
                }

                IteratorSeq.prototype.__iterateUncached = function(fn, reverse) {
                    if (reverse) {
                        return this.cacheResult()
                            .__iterate(fn, reverse);
                    }
                    var iterator = this._iterator;
                    var cache = this._iteratorCache;
                    var iterations = 0;
                    while (iterations < cache.length) {
                        if (fn(cache[iterations], iterations++, this) === false) {
                            return iterations;
                        }
                    }
                    var step;
                    while (!(step = iterator.next())
                        .done) {
                        var val = step.value;
                        cache[iterations] = val;
                        if (fn(val, iterations++, this) === false) {
                            break;
                        }
                    }
                    return iterations;
                };

                IteratorSeq.prototype.__iteratorUncached = function(type, reverse) {
                    if (reverse) {
                        return this.cacheResult()
                            .__iterator(type, reverse);
                    }
                    var iterator = this._iterator;
                    var cache = this._iteratorCache;
                    var iterations = 0;
                    return new src_Iterator__Iterator(function() {
                        if (iterations >= cache.length) {
                            var step = iterator.next();
                            if (step.done) {
                                return step;
                            }
                            cache[iterations] = step.value;
                        }
                        return iteratorValue(type, iterations, cache[iterations++]);
                    });
                };




                // # pragma Helper functions

                function isSeq(maybeSeq) {
                    return !!(maybeSeq && maybeSeq[IS_SEQ_SENTINEL]);
                }

                var EMPTY_SEQ;

                function emptySequence() {
                    return EMPTY_SEQ || (EMPTY_SEQ = new ArraySeq([]));
                }

                function keyedSeqFromValue(value) {
                    var seq =
                        Array.isArray(value) ? new ArraySeq(value)
                        .fromEntrySeq() :
                        isIterator(value) ? new IteratorSeq(value)
                        .fromEntrySeq() :
                        hasIterator(value) ? new IterableSeq(value)
                        .fromEntrySeq() :
                        typeof value === 'object' ? new ObjectSeq(value) :
                        undefined;
                    if (!seq) {
                        throw new TypeError(
                            'Expected Array or iterable object of [k, v] entries, ' +
                            'or keyed object: ' + value
                        );
                    }
                    return seq;
                }

                function indexedSeqFromValue(value) {
                    var seq = maybeIndexedSeqFromValue(value);
                    if (!seq) {
                        throw new TypeError(
                            'Expected Array or iterable object of values: ' + value
                        );
                    }
                    return seq;
                }

                function seqFromValue(value) {
                    var seq = maybeIndexedSeqFromValue(value) ||
                        (typeof value === 'object' && new ObjectSeq(value));
                    if (!seq) {
                        throw new TypeError(
                            'Expected Array or iterable object of values, or keyed object: ' + value
                        );
                    }
                    return seq;
                }

                function maybeIndexedSeqFromValue(value) {
                    return (
                        isArrayLike(value) ? new ArraySeq(value) :
                        isIterator(value) ? new IteratorSeq(value) :
                        hasIterator(value) ? new IterableSeq(value) :
                        undefined
                    );
                }

                function seqIterate(seq, fn, reverse, useKeys) {
                    var cache = seq._cache;
                    if (cache) {
                        var maxIndex = cache.length - 1;
                        for (var ii = 0; ii <= maxIndex; ii++) {
                            var entry = cache[reverse ? maxIndex - ii : ii];
                            if (fn(entry[1], useKeys ? entry[0] : ii, seq) === false) {
                                return ii + 1;
                            }
                        }
                        return ii;
                    }
                    return seq.__iterateUncached(fn, reverse);
                }

                function seqIterator(seq, type, reverse, useKeys) {
                    var cache = seq._cache;
                    if (cache) {
                        var maxIndex = cache.length - 1;
                        var ii = 0;
                        return new src_Iterator__Iterator(function() {
                            var entry = cache[reverse ? maxIndex - ii : ii];
                            return ii++ > maxIndex ?
                                iteratorDone() :
                                iteratorValue(type, useKeys ? entry[0] : ii - 1, entry[1]);
                        });
                    }
                    return seq.__iteratorUncached(type, reverse);
                }

                createClass(Collection, Iterable);

                function Collection() {
                    throw TypeError('Abstract');
                }


                createClass(KeyedCollection, Collection);

                function KeyedCollection() {}

                createClass(IndexedCollection, Collection);

                function IndexedCollection() {}

                createClass(SetCollection, Collection);

                function SetCollection() {}


                Collection.Keyed = KeyedCollection;
                Collection.Indexed = IndexedCollection;
                Collection.Set = SetCollection;

                /**
                 * An extension of the "same-value" algorithm as [described for use by ES6 Map
                 * and Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map#Key_equality)
                 *
                 * NaN is considered the same as NaN, however -0 and 0 are considered the same
                 * value, which is different from the algorithm described by
                 * [`Object.is`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/is).
                 *
                 * This is extended further to allow Objects to describe the values they
                 * represent, by way of `valueOf` or `equals` (and `hashCode`).
                 *
                 * Note: because of this extension, the key equality of Immutable.Map and the
                 * value equality of Immutable.Set will differ from ES6 Map and Set.
                 *
                 * ### Defining custom values
                 *
                 * The easiest way to describe the value an object represents is by implementing
                 * `valueOf`. For example, `Date` represents a value by returning a unix
                 * timestamp for `valueOf`:
                 *
                 *     var date1 = new Date(1234567890000); // Fri Feb 13 2009 ...
                 *     var date2 = new Date(1234567890000);
                 *     date1.valueOf(); // 1234567890000
                 *     assert( date1 !== date2 );
                 *     assert( Immutable.is( date1, date2 ) );
                 *
                 * Note: overriding `valueOf` may have other implications if you use this object
                 * where JavaScript expects a primitive, such as implicit string coercion.
                 *
                 * For more complex types, especially collections, implementing `valueOf` may
                 * not be performant. An alternative is to implement `equals` and `hashCode`.
                 *
                 * `equals` takes another object, presumably of similar type, and returns true
                 * if the it is equal. Equality is symmetrical, so the same result should be
                 * returned if this and the argument are flipped.
                 *
                 *     assert( a.equals(b) === b.equals(a) );
                 *
                 * `hashCode` returns a 32bit integer number representing the object which will
                 * be used to determine how to store the value object in a Map or Set. You must
                 * provide both or neither methods, one must not exist without the other.
                 *
                 * Also, an important relationship between these methods must be upheld: if two
                 * values are equal, they *must* return the same hashCode. If the values are not
                 * equal, they might have the same hashCode; this is called a hash collision,
                 * and while undesirable for performance reasons, it is acceptable.
                 *
                 *     if (a.equals(b)) {
                 *       assert( a.hashCode() === b.hashCode() );
                 *     }
                 *
                 * All Immutable collections implement `equals` and `hashCode`.
                 *
                 */
                function is(valueA, valueB) {
                    if (valueA === valueB || (valueA !== valueA && valueB !== valueB)) {
                        return true;
                    }
                    if (!valueA || !valueB) {
                        return false;
                    }
                    if (typeof valueA.valueOf === 'function' &&
                        typeof valueB.valueOf === 'function') {
                        valueA = valueA.valueOf();
                        valueB = valueB.valueOf();
                    }
                    return typeof valueA.equals === 'function' &&
                        typeof valueB.equals === 'function' ?
                        valueA.equals(valueB) :
                        valueA === valueB || (valueA !== valueA && valueB !== valueB);
                }

                function fromJS(json, converter) {
                    return converter ?
                        fromJSWith(converter, json, '', {
                            '': json
                        }) :
                        fromJSDefault(json);
                }

                function fromJSWith(converter, json, key, parentJSON) {
                    if (Array.isArray(json)) {
                        return converter.call(parentJSON, key, IndexedSeq(json)
                            .map(function(v, k) {
                                return fromJSWith(converter, v, k, json)
                            }));
                    }
                    if (isPlainObj(json)) {
                        return converter.call(parentJSON, key, KeyedSeq(json)
                            .map(function(v, k) {
                                return fromJSWith(converter, v, k, json)
                            }));
                    }
                    return json;
                }

                function fromJSDefault(json) {
                    if (Array.isArray(json)) {
                        return IndexedSeq(json)
                            .map(fromJSDefault)
                            .toList();
                    }
                    if (isPlainObj(json)) {
                        return KeyedSeq(json)
                            .map(fromJSDefault)
                            .toMap();
                    }
                    return json;
                }

                function isPlainObj(value) {
                    return value && (value.constructor === Object || value.constructor === undefined);
                }

                var src_Math__imul =
                    typeof Math.imul === 'function' && Math.imul(0xffffffff, 2) === -2 ?
                    Math.imul :
                    function src_Math__imul(a, b) {
                        a = a | 0; // int
                        b = b | 0; // int
                        var c = a & 0xffff;
                        var d = b & 0xffff;
                        // Shift by 0 fixes the sign on the high part.
                        return (c * d) + ((((a >>> 16) * d + c * (b >>> 16)) << 16) >>> 0) | 0; // int
                    };

                // v8 has an optimization for storing 31-bit signed numbers.
                // Values which have either 00 or 11 as the high order bits qualify.
                // This function drops the highest order bit in a signed number, maintaining
                // the sign bit.
                function smi(i32) {
                    return ((i32 >>> 1) & 0x40000000) | (i32 & 0xBFFFFFFF);
                }

                function hash(o) {
                    if (o === false || o === null || o === undefined) {
                        return 0;
                    }
                    if (typeof o.valueOf === 'function') {
                        o = o.valueOf();
                        if (o === false || o === null || o === undefined) {
                            return 0;
                        }
                    }
                    if (o === true) {
                        return 1;
                    }
                    var type = typeof o;
                    if (type === 'number') {
                        var h = o | 0;
                        if (h !== o) {
                            h ^= o * 0xFFFFFFFF;
                        }
                        while (o > 0xFFFFFFFF) {
                            o /= 0xFFFFFFFF;
                            h ^= o;
                        }
                        return smi(h);
                    }
                    if (type === 'string') {
                        return o.length > STRING_HASH_CACHE_MIN_STRLEN ? cachedHashString(o) : hashString(o);
                    }
                    if (typeof o.hashCode === 'function') {
                        return o.hashCode();
                    }
                    return hashJSObj(o);
                }

                function cachedHashString(string) {
                    var hash = stringHashCache[string];
                    if (hash === undefined) {
                        hash = hashString(string);
                        if (STRING_HASH_CACHE_SIZE === STRING_HASH_CACHE_MAX_SIZE) {
                            STRING_HASH_CACHE_SIZE = 0;
                            stringHashCache = {};
                        }
                        STRING_HASH_CACHE_SIZE++;
                        stringHashCache[string] = hash;
                    }
                    return hash;
                }

                // http://jsperf.com/hashing-strings
                function hashString(string) {
                    // This is the hash from JVM
                    // The hash code for a string is computed as
                    // s[0] * 31 ^ (n - 1) + s[1] * 31 ^ (n - 2) + ... + s[n - 1],
                    // where s[i] is the ith character of the string and n is the length of
                    // the string. We "mod" the result to make it between 0 (inclusive) and 2^31
                    // (exclusive) by dropping high bits.
                    var hash = 0;
                    for (var ii = 0; ii < string.length; ii++) {
                        hash = 31 * hash + string.charCodeAt(ii) | 0;
                    }
                    return smi(hash);
                }

                function hashJSObj(obj) {
                    var hash = weakMap && weakMap.get(obj);
                    if (hash) return hash;

                    hash = obj[UID_HASH_KEY];
                    if (hash) return hash;

                    if (!canDefineProperty) {
                        hash = obj.propertyIsEnumerable && obj.propertyIsEnumerable[UID_HASH_KEY];
                        if (hash) return hash;

                        hash = getIENodeHash(obj);
                        if (hash) return hash;
                    }

                    if (Object.isExtensible && !Object.isExtensible(obj)) {
                        throw new Error('Non-extensible objects are not allowed as keys.');
                    }

                    hash = ++objHashUID;
                    if (objHashUID & 0x40000000) {
                        objHashUID = 0;
                    }

                    if (weakMap) {
                        weakMap.set(obj, hash);
                    }
                    else if (canDefineProperty) {
                        Object.defineProperty(obj, UID_HASH_KEY, {
                            'enumerable': false,
                            'configurable': false,
                            'writable': false,
                            'value': hash
                        });
                    }
                    else if (obj.propertyIsEnumerable &&
                        obj.propertyIsEnumerable === obj.constructor.prototype.propertyIsEnumerable) {
                        // Since we can't define a non-enumerable property on the object
                        // we'll hijack one of the less-used non-enumerable properties to
                        // save our hash on it. Since this is a function it will not show up in
                        // `JSON.stringify` which is what we want.
                        obj.propertyIsEnumerable = function() {
                            return this.constructor.prototype.propertyIsEnumerable.apply(this, arguments);
                        };
                        obj.propertyIsEnumerable[UID_HASH_KEY] = hash;
                    }
                    else if (obj.nodeType) {
                        // At this point we couldn't get the IE `uniqueID` to use as a hash
                        // and we couldn't use a non-enumerable property to exploit the
                        // dontEnum bug so we simply add the `UID_HASH_KEY` on the node
                        // itself.
                        obj[UID_HASH_KEY] = hash;
                    }
                    else {
                        throw new Error('Unable to set a non-enumerable property on object.');
                    }

                    return hash;
                }

                // True if Object.defineProperty works as expected. IE8 fails this test.
                var canDefineProperty = (function() {
                    try {
                        Object.defineProperty({}, '@', {});
                        return true;
                    }
                    catch (e) {
                        return false;
                    }
                }());

                // IE has a `uniqueID` property on DOM nodes. We can construct the hash from it
                // and avoid memory leaks from the IE cloneNode bug.
                function getIENodeHash(node) {
                    if (node && node.nodeType > 0) {
                        switch (node.nodeType) {
                            case 1: // Element
                                return node.uniqueID;
                            case 9: // Document
                                return node.documentElement && node.documentElement.uniqueID;
                        }
                    }
                }

                // If possible, use a WeakMap.
                var weakMap = typeof WeakMap === 'function' && new WeakMap();

                var objHashUID = 0;

                var UID_HASH_KEY = '__immutablehash__';
                if (typeof Symbol === 'function') {
                    UID_HASH_KEY = Symbol(UID_HASH_KEY);
                }

                var STRING_HASH_CACHE_MIN_STRLEN = 16;
                var STRING_HASH_CACHE_MAX_SIZE = 255;
                var STRING_HASH_CACHE_SIZE = 0;
                var stringHashCache = {};

                function invariant(condition, error) {
                    if (!condition) throw new Error(error);
                }

                function assertNotInfinite(size) {
                    invariant(
                        size !== Infinity,
                        'Cannot perform this action with an infinite size.'
                    );
                }

                createClass(ToKeyedSequence, KeyedSeq);

                function ToKeyedSequence(indexed, useKeys) {
                    this._iter = indexed;
                    this._useKeys = useKeys;
                    this.size = indexed.size;
                }

                ToKeyedSequence.prototype.get = function(key, notSetValue) {
                    return this._iter.get(key, notSetValue);
                };

                ToKeyedSequence.prototype.has = function(key) {
                    return this._iter.has(key);
                };

                ToKeyedSequence.prototype.valueSeq = function() {
                    return this._iter.valueSeq();
                };

                ToKeyedSequence.prototype.reverse = function() {
                    var this$0 = this;
                    var reversedSequence = reverseFactory(this, true);
                    if (!this._useKeys) {
                        reversedSequence.valueSeq = function() {
                            return this$0._iter.toSeq()
                                .reverse()
                        };
                    }
                    return reversedSequence;
                };

                ToKeyedSequence.prototype.map = function(mapper, context) {
                    var this$0 = this;
                    var mappedSequence = mapFactory(this, mapper, context);
                    if (!this._useKeys) {
                        mappedSequence.valueSeq = function() {
                            return this$0._iter.toSeq()
                                .map(mapper, context)
                        };
                    }
                    return mappedSequence;
                };

                ToKeyedSequence.prototype.__iterate = function(fn, reverse) {
                    var this$0 = this;
                    var ii;
                    return this._iter.__iterate(
                        this._useKeys ?
                        function(v, k) {
                            return fn(v, k, this$0)
                        } :
                        ((ii = reverse ? resolveSize(this) : 0),
                            function(v) {
                                return fn(v, reverse ? --ii : ii++, this$0)
                            }),
                        reverse
                    );
                };

                ToKeyedSequence.prototype.__iterator = function(type, reverse) {
                    if (this._useKeys) {
                        return this._iter.__iterator(type, reverse);
                    }
                    var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
                    var ii = reverse ? resolveSize(this) : 0;
                    return new src_Iterator__Iterator(function() {
                        var step = iterator.next();
                        return step.done ? step :
                            iteratorValue(type, reverse ? --ii : ii++, step.value, step);
                    });
                };

                ToKeyedSequence.prototype[IS_ORDERED_SENTINEL] = true;


                createClass(ToIndexedSequence, IndexedSeq);

                function ToIndexedSequence(iter) {
                    this._iter = iter;
                    this.size = iter.size;
                }

                ToIndexedSequence.prototype.contains = function(value) {
                    return this._iter.contains(value);
                };

                ToIndexedSequence.prototype.__iterate = function(fn, reverse) {
                    var this$0 = this;
                    var iterations = 0;
                    return this._iter.__iterate(function(v) {
                        return fn(v, iterations++, this$0)
                    }, reverse);
                };

                ToIndexedSequence.prototype.__iterator = function(type, reverse) {
                    var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
                    var iterations = 0;
                    return new src_Iterator__Iterator(function() {
                        var step = iterator.next();
                        return step.done ? step :
                            iteratorValue(type, iterations++, step.value, step)
                    });
                };



                createClass(ToSetSequence, SetSeq);

                function ToSetSequence(iter) {
                    this._iter = iter;
                    this.size = iter.size;
                }

                ToSetSequence.prototype.has = function(key) {
                    return this._iter.contains(key);
                };

                ToSetSequence.prototype.__iterate = function(fn, reverse) {
                    var this$0 = this;
                    return this._iter.__iterate(function(v) {
                        return fn(v, v, this$0)
                    }, reverse);
                };

                ToSetSequence.prototype.__iterator = function(type, reverse) {
                    var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
                    return new src_Iterator__Iterator(function() {
                        var step = iterator.next();
                        return step.done ? step :
                            iteratorValue(type, step.value, step.value, step);
                    });
                };



                createClass(FromEntriesSequence, KeyedSeq);

                function FromEntriesSequence(entries) {
                    this._iter = entries;
                    this.size = entries.size;
                }

                FromEntriesSequence.prototype.entrySeq = function() {
                    return this._iter.toSeq();
                };

                FromEntriesSequence.prototype.__iterate = function(fn, reverse) {
                    var this$0 = this;
                    return this._iter.__iterate(function(entry) {
                        // Check if entry exists first so array access doesn't throw for holes
                        // in the parent iteration.
                        if (entry) {
                            validateEntry(entry);
                            return fn(entry[1], entry[0], this$0);
                        }
                    }, reverse);
                };

                FromEntriesSequence.prototype.__iterator = function(type, reverse) {
                    var iterator = this._iter.__iterator(ITERATE_VALUES, reverse);
                    return new src_Iterator__Iterator(function() {
                        while (true) {
                            var step = iterator.next();
                            if (step.done) {
                                return step;
                            }
                            var entry = step.value;
                            // Check if entry exists first so array access doesn't throw for holes
                            // in the parent iteration.
                            if (entry) {
                                validateEntry(entry);
                                return type === ITERATE_ENTRIES ? step :
                                    iteratorValue(type, entry[0], entry[1], step);
                            }
                        }
                    });
                };


                ToIndexedSequence.prototype.cacheResult =
                    ToKeyedSequence.prototype.cacheResult =
                    ToSetSequence.prototype.cacheResult =
                    FromEntriesSequence.prototype.cacheResult =
                    cacheResultThrough;


                function flipFactory(iterable) {
                    var flipSequence = makeSequence(iterable);
                    flipSequence._iter = iterable;
                    flipSequence.size = iterable.size;
                    flipSequence.flip = function() {
                        return iterable
                    };
                    flipSequence.reverse = function() {
                        var reversedSequence = iterable.reverse.apply(this); // super.reverse()
                        reversedSequence.flip = function() {
                            return iterable.reverse()
                        };
                        return reversedSequence;
                    };
                    flipSequence.has = function(key) {
                        return iterable.contains(key)
                    };
                    flipSequence.contains = function(key) {
                        return iterable.has(key)
                    };
                    flipSequence.cacheResult = cacheResultThrough;
                    flipSequence.__iterateUncached = function(fn, reverse) {
                        var this$0 = this;
                        return iterable.__iterate(function(v, k) {
                            return fn(k, v, this$0) !== false
                        }, reverse);
                    }
                    flipSequence.__iteratorUncached = function(type, reverse) {
                        if (type === ITERATE_ENTRIES) {
                            var iterator = iterable.__iterator(type, reverse);
                            return new src_Iterator__Iterator(function() {
                                var step = iterator.next();
                                if (!step.done) {
                                    var k = step.value[0];
                                    step.value[0] = step.value[1];
                                    step.value[1] = k;
                                }
                                return step;
                            });
                        }
                        return iterable.__iterator(
                            type === ITERATE_VALUES ? ITERATE_KEYS : ITERATE_VALUES,
                            reverse
                        );
                    }
                    return flipSequence;
                }


                function mapFactory(iterable, mapper, context) {
                    var mappedSequence = makeSequence(iterable);
                    mappedSequence.size = iterable.size;
                    mappedSequence.has = function(key) {
                        return iterable.has(key)
                    };
                    mappedSequence.get = function(key, notSetValue) {
                        var v = iterable.get(key, NOT_SET);
                        return v === NOT_SET ?
                            notSetValue :
                            mapper.call(context, v, key, iterable);
                    };
                    mappedSequence.__iterateUncached = function(fn, reverse) {
                        var this$0 = this;
                        return iterable.__iterate(
                            function(v, k, c) {
                                return fn(mapper.call(context, v, k, c), k, this$0) !== false
                            },
                            reverse
                        );
                    }
                    mappedSequence.__iteratorUncached = function(type, reverse) {
                        var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
                        return new src_Iterator__Iterator(function() {
                            var step = iterator.next();
                            if (step.done) {
                                return step;
                            }
                            var entry = step.value;
                            var key = entry[0];
                            return iteratorValue(
                                type,
                                key,
                                mapper.call(context, entry[1], key, iterable),
                                step
                            );
                        });
                    }
                    return mappedSequence;
                }


                function reverseFactory(iterable, useKeys) {
                    var reversedSequence = makeSequence(iterable);
                    reversedSequence._iter = iterable;
                    reversedSequence.size = iterable.size;
                    reversedSequence.reverse = function() {
                        return iterable
                    };
                    if (iterable.flip) {
                        reversedSequence.flip = function() {
                            var flipSequence = flipFactory(iterable);
                            flipSequence.reverse = function() {
                                return iterable.flip()
                            };
                            return flipSequence;
                        };
                    }
                    reversedSequence.get = function(key, notSetValue) {
                        return iterable.get(useKeys ? key : -1 - key, notSetValue)
                    };
                    reversedSequence.has = function(key) {
                        return iterable.has(useKeys ? key : -1 - key)
                    };
                    reversedSequence.contains = function(value) {
                        return iterable.contains(value)
                    };
                    reversedSequence.cacheResult = cacheResultThrough;
                    reversedSequence.__iterate = function(fn, reverse) {
                        var this$0 = this;
                        return iterable.__iterate(function(v, k) {
                            return fn(v, k, this$0)
                        }, !reverse);
                    };
                    reversedSequence.__iterator =
                        function(type, reverse) {
                            return iterable.__iterator(type, !reverse)
                        };
                    return reversedSequence;
                }


                function filterFactory(iterable, predicate, context, useKeys) {
                    var filterSequence = makeSequence(iterable);
                    if (useKeys) {
                        filterSequence.has = function(key) {
                            var v = iterable.get(key, NOT_SET);
                            return v !== NOT_SET && !!predicate.call(context, v, key, iterable);
                        };
                        filterSequence.get = function(key, notSetValue) {
                            var v = iterable.get(key, NOT_SET);
                            return v !== NOT_SET && predicate.call(context, v, key, iterable) ?
                                v : notSetValue;
                        };
                    }
                    filterSequence.__iterateUncached = function(fn, reverse) {
                        var this$0 = this;
                        var iterations = 0;
                        iterable.__iterate(function(v, k, c) {
                            if (predicate.call(context, v, k, c)) {
                                iterations++;
                                return fn(v, useKeys ? k : iterations - 1, this$0);
                            }
                        }, reverse);
                        return iterations;
                    };
                    filterSequence.__iteratorUncached = function(type, reverse) {
                        var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
                        var iterations = 0;
                        return new src_Iterator__Iterator(function() {
                            while (true) {
                                var step = iterator.next();
                                if (step.done) {
                                    return step;
                                }
                                var entry = step.value;
                                var key = entry[0];
                                var value = entry[1];
                                if (predicate.call(context, value, key, iterable)) {
                                    return iteratorValue(type, useKeys ? key : iterations++, value, step);
                                }
                            }
                        });
                    }
                    return filterSequence;
                }


                function countByFactory(iterable, grouper, context) {
                    var groups = src_Map__Map()
                        .asMutable();
                    iterable.__iterate(function(v, k) {
                        groups.update(
                            grouper.call(context, v, k, iterable),
                            0,
                            function(a) {
                                return a + 1
                            }
                        );
                    });
                    return groups.asImmutable();
                }


                function groupByFactory(iterable, grouper, context) {
                    var isKeyedIter = isKeyed(iterable);
                    var groups = (isOrdered(iterable) ? OrderedMap() : src_Map__Map())
                        .asMutable();
                    iterable.__iterate(function(v, k) {
                        groups.update(
                            grouper.call(context, v, k, iterable),
                            function(a) {
                                return (a = a || [], a.push(isKeyedIter ? [k, v] : v), a)
                            }
                        );
                    });
                    var coerce = iterableClass(iterable);
                    return groups.map(function(arr) {
                        return reify(iterable, coerce(arr))
                    });
                }


                function sliceFactory(iterable, begin, end, useKeys) {
                    var originalSize = iterable.size;

                    if (wholeSlice(begin, end, originalSize)) {
                        return iterable;
                    }

                    var resolvedBegin = resolveBegin(begin, originalSize);
                    var resolvedEnd = resolveEnd(end, originalSize);

                    // begin or end will be NaN if they were provided as negative numbers and
                    // this iterable's size is unknown. In that case, cache first so there is
                    // a known size.
                    if (resolvedBegin !== resolvedBegin || resolvedEnd !== resolvedEnd) {
                        return sliceFactory(iterable.toSeq()
                            .cacheResult(), begin, end, useKeys);
                    }

                    var sliceSize = resolvedEnd - resolvedBegin;
                    if (sliceSize < 0) {
                        sliceSize = 0;
                    }

                    var sliceSeq = makeSequence(iterable);

                    sliceSeq.size = sliceSize === 0 ? sliceSize : iterable.size && sliceSize || undefined;

                    if (!useKeys && isSeq(iterable) && sliceSize >= 0) {
                        sliceSeq.get = function(index, notSetValue) {
                            index = wrapIndex(this, index);
                            return index >= 0 && index < sliceSize ?
                                iterable.get(index + resolvedBegin, notSetValue) :
                                notSetValue;
                        }
                    }

                    sliceSeq.__iterateUncached = function(fn, reverse) {
                        var this$0 = this;
                        if (sliceSize === 0) {
                            return 0;
                        }
                        if (reverse) {
                            return this.cacheResult()
                                .__iterate(fn, reverse);
                        }
                        var skipped = 0;
                        var isSkipping = true;
                        var iterations = 0;
                        iterable.__iterate(function(v, k) {
                            if (!(isSkipping && (isSkipping = skipped++ < resolvedBegin))) {
                                iterations++;
                                return fn(v, useKeys ? k : iterations - 1, this$0) !== false &&
                                    iterations !== sliceSize;
                            }
                        });
                        return iterations;
                    };

                    sliceSeq.__iteratorUncached = function(type, reverse) {
                        if (sliceSize && reverse) {
                            return this.cacheResult()
                                .__iterator(type, reverse);
                        }
                        // Don't bother instantiating parent iterator if taking 0.
                        var iterator = sliceSize && iterable.__iterator(type, reverse);
                        var skipped = 0;
                        var iterations = 0;
                        return new src_Iterator__Iterator(function() {
                            while (skipped++ !== resolvedBegin) {
                                iterator.next();
                            }
                            if (++iterations > sliceSize) {
                                return iteratorDone();
                            }
                            var step = iterator.next();
                            if (useKeys || type === ITERATE_VALUES) {
                                return step;
                            }
                            else if (type === ITERATE_KEYS) {
                                return iteratorValue(type, iterations - 1, undefined, step);
                            }
                            else {
                                return iteratorValue(type, iterations - 1, step.value[1], step);
                            }
                        });
                    }

                    return sliceSeq;
                }


                function takeWhileFactory(iterable, predicate, context) {
                    var takeSequence = makeSequence(iterable);
                    takeSequence.__iterateUncached = function(fn, reverse) {
                        var this$0 = this;
                        if (reverse) {
                            return this.cacheResult()
                                .__iterate(fn, reverse);
                        }
                        var iterations = 0;
                        iterable.__iterate(function(v, k, c) {
                            return predicate.call(context, v, k, c) && ++iterations && fn(v, k, this$0)
                        });
                        return iterations;
                    };
                    takeSequence.__iteratorUncached = function(type, reverse) {
                        var this$0 = this;
                        if (reverse) {
                            return this.cacheResult()
                                .__iterator(type, reverse);
                        }
                        var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
                        var iterating = true;
                        return new src_Iterator__Iterator(function() {
                            if (!iterating) {
                                return iteratorDone();
                            }
                            var step = iterator.next();
                            if (step.done) {
                                return step;
                            }
                            var entry = step.value;
                            var k = entry[0];
                            var v = entry[1];
                            if (!predicate.call(context, v, k, this$0)) {
                                iterating = false;
                                return iteratorDone();
                            }
                            return type === ITERATE_ENTRIES ? step :
                                iteratorValue(type, k, v, step);
                        });
                    };
                    return takeSequence;
                }


                function skipWhileFactory(iterable, predicate, context, useKeys) {
                    var skipSequence = makeSequence(iterable);
                    skipSequence.__iterateUncached = function(fn, reverse) {
                        var this$0 = this;
                        if (reverse) {
                            return this.cacheResult()
                                .__iterate(fn, reverse);
                        }
                        var isSkipping = true;
                        var iterations = 0;
                        iterable.__iterate(function(v, k, c) {
                            if (!(isSkipping && (isSkipping = predicate.call(context, v, k, c)))) {
                                iterations++;
                                return fn(v, useKeys ? k : iterations - 1, this$0);
                            }
                        });
                        return iterations;
                    };
                    skipSequence.__iteratorUncached = function(type, reverse) {
                        var this$0 = this;
                        if (reverse) {
                            return this.cacheResult()
                                .__iterator(type, reverse);
                        }
                        var iterator = iterable.__iterator(ITERATE_ENTRIES, reverse);
                        var skipping = true;
                        var iterations = 0;
                        return new src_Iterator__Iterator(function() {
                            var step, k, v;
                            do {
                                step = iterator.next();
                                if (step.done) {
                                    if (useKeys || type === ITERATE_VALUES) {
                                        return step;
                                    }
                                    else if (type === ITERATE_KEYS) {
                                        return iteratorValue(type, iterations++, undefined, step);
                                    }
                                    else {
                                        return iteratorValue(type, iterations++, step.value[1], step);
                                    }
                                }
                                var entry = step.value;
                                k = entry[0];
                                v = entry[1];
                                skipping && (skipping = predicate.call(context, v, k, this$0));
                            } while (skipping);
                            return type === ITERATE_ENTRIES ? step :
                                iteratorValue(type, k, v, step);
                        });
                    };
                    return skipSequence;
                }


                function concatFactory(iterable, values) {
                    var isKeyedIterable = isKeyed(iterable);
                    var iters = [iterable].concat(values)
                        .map(function(v) {
                            if (!isIterable(v)) {
                                v = isKeyedIterable ?
                                    keyedSeqFromValue(v) :
                                    indexedSeqFromValue(Array.isArray(v) ? v : [v]);
                            }
                            else if (isKeyedIterable) {
                                v = KeyedIterable(v);
                            }
                            return v;
                        })
                        .filter(function(v) {
                            return v.size !== 0
                        });

                    if (iters.length === 0) {
                        return iterable;
                    }

                    if (iters.length === 1) {
                        var singleton = iters[0];
                        if (singleton === iterable ||
                            isKeyedIterable && isKeyed(singleton) ||
                            isIndexed(iterable) && isIndexed(singleton)) {
                            return singleton;
                        }
                    }

                    var concatSeq = new ArraySeq(iters);
                    if (isKeyedIterable) {
                        concatSeq = concatSeq.toKeyedSeq();
                    }
                    else if (!isIndexed(iterable)) {
                        concatSeq = concatSeq.toSetSeq();
                    }
                    concatSeq = concatSeq.flatten(true);
                    concatSeq.size = iters.reduce(
                        function(sum, seq) {
                            if (sum !== undefined) {
                                var size = seq.size;
                                if (size !== undefined) {
                                    return sum + size;
                                }
                            }
                        },
                        0
                    );
                    return concatSeq;
                }


                function flattenFactory(iterable, depth, useKeys) {
                    var flatSequence = makeSequence(iterable);
                    flatSequence.__iterateUncached = function(fn, reverse) {
                        var iterations = 0;
                        var stopped = false;

                        function flatDeep(iter, currentDepth) {
                            var this$0 = this;
                            iter.__iterate(function(v, k) {
                                if ((!depth || currentDepth < depth) && isIterable(v)) {
                                    flatDeep(v, currentDepth + 1);
                                }
                                else if (fn(v, useKeys ? k : iterations++, this$0) === false) {
                                    stopped = true;
                                }
                                return !stopped;
                            }, reverse);
                        }
                        flatDeep(iterable, 0);
                        return iterations;
                    }
                    flatSequence.__iteratorUncached = function(type, reverse) {
                        var iterator = iterable.__iterator(type, reverse);
                        var stack = [];
                        var iterations = 0;
                        return new src_Iterator__Iterator(function() {
                            while (iterator) {
                                var step = iterator.next();
                                if (step.done !== false) {
                                    iterator = stack.pop();
                                    continue;
                                }
                                var v = step.value;
                                if (type === ITERATE_ENTRIES) {
                                    v = v[1];
                                }
                                if ((!depth || stack.length < depth) && isIterable(v)) {
                                    stack.push(iterator);
                                    iterator = v.__iterator(type, reverse);
                                }
                                else {
                                    return useKeys ? step : iteratorValue(type, iterations++, v, step);
                                }
                            }
                            return iteratorDone();
                        });
                    }
                    return flatSequence;
                }


                function flatMapFactory(iterable, mapper, context) {
                    var coerce = iterableClass(iterable);
                    return iterable.toSeq()
                        .map(
                            function(v, k) {
                                return coerce(mapper.call(context, v, k, iterable))
                            }
                        )
                        .flatten(true);
                }


                function interposeFactory(iterable, separator) {
                    var interposedSequence = makeSequence(iterable);
                    interposedSequence.size = iterable.size && iterable.size * 2 - 1;
                    interposedSequence.__iterateUncached = function(fn, reverse) {
                        var this$0 = this;
                        var iterations = 0;
                        iterable.__iterate(function(v, k) {
                                return (!iterations || fn(separator, iterations++, this$0) !== false) &&
                                    fn(v, iterations++, this$0) !== false
                            },
                            reverse
                        );
                        return iterations;
                    };
                    interposedSequence.__iteratorUncached = function(type, reverse) {
                        var iterator = iterable.__iterator(ITERATE_VALUES, reverse);
                        var iterations = 0;
                        var step;
                        return new src_Iterator__Iterator(function() {
                            if (!step || iterations % 2) {
                                step = iterator.next();
                                if (step.done) {
                                    return step;
                                }
                            }
                            return iterations % 2 ?
                                iteratorValue(type, iterations++, separator) :
                                iteratorValue(type, iterations++, step.value, step);
                        });
                    };
                    return interposedSequence;
                }


                function sortFactory(iterable, comparator, mapper) {
                    if (!comparator) {
                        comparator = defaultComparator;
                    }
                    var isKeyedIterable = isKeyed(iterable);
                    var index = 0;
                    var entries = iterable.toSeq()
                        .map(
                            function(v, k) {
                                return [k, v, index++, mapper ? mapper(v, k, iterable) : v]
                            }
                        )
                        .toArray();
                    entries.sort(function(a, b) {
                            return comparator(a[3], b[3]) || a[2] - b[2]
                        })
                        .forEach(
                            isKeyedIterable ?
                            function(v, i) {
                                entries[i].length = 2;
                            } :
                            function(v, i) {
                                entries[i] = v[1];
                            }
                        );
                    return isKeyedIterable ? KeyedSeq(entries) :
                        isIndexed(iterable) ? IndexedSeq(entries) :
                        SetSeq(entries);
                }


                function maxFactory(iterable, comparator, mapper) {
                    if (!comparator) {
                        comparator = defaultComparator;
                    }
                    if (mapper) {
                        var entry = iterable.toSeq()
                            .map(function(v, k) {
                                return [v, mapper(v, k, iterable)]
                            })
                            .reduce(function(a, b) {
                                return maxCompare(comparator, a[1], b[1]) ? b : a
                            });
                        return entry && entry[0];
                    }
                    else {
                        return iterable.reduce(function(a, b) {
                            return maxCompare(comparator, a, b) ? b : a
                        });
                    }
                }

                function maxCompare(comparator, a, b) {
                    var comp = comparator(b, a);
                    // b is considered the new max if the comparator declares them equal, but
                    // they are not equal and b is in fact a nullish value.
                    return (comp === 0 && b !== a && (b === undefined || b === null || b !== b)) || comp > 0;
                }


                function zipWithFactory(keyIter, zipper, iters) {
                    var zipSequence = makeSequence(keyIter);
                    zipSequence.size = new ArraySeq(iters)
                        .map(function(i) {
                            return i.size
                        })
                        .min();
                    // Note: this a generic base implementation of __iterate in terms of
                    // __iterator which may be more generically useful in the future.
                    zipSequence.__iterate = function(fn, reverse) {
                        /* generic:
                        var iterator = this.__iterator(ITERATE_ENTRIES, reverse);
                        var step;
                        var iterations = 0;
                        while (!(step = iterator.next()).done) {
                          iterations++;
                          if (fn(step.value[1], step.value[0], this) === false) {
                            break;
                          }
                        }
                        return iterations;
                        */
                        // indexed:
                        var iterator = this.__iterator(ITERATE_VALUES, reverse);
                        var step;
                        var iterations = 0;
                        while (!(step = iterator.next())
                            .done) {
                            if (fn(step.value, iterations++, this) === false) {
                                break;
                            }
                        }
                        return iterations;
                    };
                    zipSequence.__iteratorUncached = function(type, reverse) {
                        var iterators = iters.map(function(i) {
                            return (i = Iterable(i), getIterator(reverse ? i.reverse() : i))
                        });
                        var iterations = 0;
                        var isDone = false;
                        return new src_Iterator__Iterator(function() {
                            var steps;
                            if (!isDone) {
                                steps = iterators.map(function(i) {
                                    return i.next()
                                });
                                isDone = steps.some(function(s) {
                                    return s.done
                                });
                            }
                            if (isDone) {
                                return iteratorDone();
                            }
                            return iteratorValue(
                                type,
                                iterations++,
                                zipper.apply(null, steps.map(function(s) {
                                    return s.value
                                }))
                            );
                        });
                    };
                    return zipSequence
                }


                // #pragma Helper Functions

                function reify(iter, seq) {
                    return isSeq(iter) ? seq : iter.constructor(seq);
                }

                function validateEntry(entry) {
                    if (entry !== Object(entry)) {
                        throw new TypeError('Expected [K, V] tuple: ' + entry);
                    }
                }

                function resolveSize(iter) {
                    assertNotInfinite(iter.size);
                    return ensureSize(iter);
                }

                function iterableClass(iterable) {
                    return isKeyed(iterable) ? KeyedIterable :
                        isIndexed(iterable) ? IndexedIterable :
                        SetIterable;
                }

                function makeSequence(iterable) {
                    return Object.create(
                        (
                            isKeyed(iterable) ? KeyedSeq :
                            isIndexed(iterable) ? IndexedSeq :
                            SetSeq
                        )
                        .prototype
                    );
                }

                function cacheResultThrough() {
                    if (this._iter.cacheResult) {
                        this._iter.cacheResult();
                        this.size = this._iter.size;
                        return this;
                    }
                    else {
                        return Seq.prototype.cacheResult.call(this);
                    }
                }

                function defaultComparator(a, b) {
                    return a > b ? 1 : a < b ? -1 : 0;
                }

                function forceIterator(keyPath) {
                    var iter = getIterator(keyPath);
                    if (!iter) {
                        // Array might not be iterable in this environment, so we need a fallback
                        // to our wrapped type.
                        if (!isArrayLike(keyPath)) {
                            throw new TypeError('Expected iterable or array-like: ' + keyPath);
                        }
                        iter = getIterator(Iterable(keyPath));
                    }
                    return iter;
                }

                createClass(src_Map__Map, KeyedCollection);

                // @pragma Construction

                function src_Map__Map(value) {
                    return value === null || value === undefined ? emptyMap() :
                        isMap(value) ? value :
                        emptyMap()
                        .withMutations(function(map) {
                            var iter = KeyedIterable(value);
                            assertNotInfinite(iter.size);
                            iter.forEach(function(v, k) {
                                return map.set(k, v)
                            });
                        });
                }

                src_Map__Map.prototype.toString = function() {
                    return this.__toString('Map {', '}');
                };

                // @pragma Access

                src_Map__Map.prototype.get = function(k, notSetValue) {
                    return this._root ?
                        this._root.get(0, undefined, k, notSetValue) :
                        notSetValue;
                };

                // @pragma Modification

                src_Map__Map.prototype.set = function(k, v) {
                    return updateMap(this, k, v);
                };

                src_Map__Map.prototype.setIn = function(keyPath, v) {
                    return this.updateIn(keyPath, NOT_SET, function() {
                        return v
                    });
                };

                src_Map__Map.prototype.remove = function(k) {
                    return updateMap(this, k, NOT_SET);
                };

                src_Map__Map.prototype.deleteIn = function(keyPath) {
                    return this.updateIn(keyPath, function() {
                        return NOT_SET
                    });
                };

                src_Map__Map.prototype.update = function(k, notSetValue, updater) {
                    return arguments.length === 1 ?
                        k(this) :
                        this.updateIn([k], notSetValue, updater);
                };

                src_Map__Map.prototype.updateIn = function(keyPath, notSetValue, updater) {
                    if (!updater) {
                        updater = notSetValue;
                        notSetValue = undefined;
                    }
                    var updatedValue = updateInDeepMap(
                        this,
                        forceIterator(keyPath),
                        notSetValue,
                        updater
                    );
                    return updatedValue === NOT_SET ? undefined : updatedValue;
                };

                src_Map__Map.prototype.clear = function() {
                    if (this.size === 0) {
                        return this;
                    }
                    if (this.__ownerID) {
                        this.size = 0;
                        this._root = null;
                        this.__hash = undefined;
                        this.__altered = true;
                        return this;
                    }
                    return emptyMap();
                };

                // @pragma Composition

                src_Map__Map.prototype.merge = function( /*...iters*/ ) {
                    return mergeIntoMapWith(this, undefined, arguments);
                };

                src_Map__Map.prototype.mergeWith = function(merger) {
                    var iters = SLICE$0.call(arguments, 1);
                    return mergeIntoMapWith(this, merger, iters);
                };

                src_Map__Map.prototype.mergeIn = function(keyPath) {
                    var iters = SLICE$0.call(arguments, 1);
                    return this.updateIn(keyPath, emptyMap(), function(m) {
                        return m.merge.apply(m, iters)
                    });
                };

                src_Map__Map.prototype.mergeDeep = function( /*...iters*/ ) {
                    return mergeIntoMapWith(this, deepMerger(undefined), arguments);
                };

                src_Map__Map.prototype.mergeDeepWith = function(merger) {
                    var iters = SLICE$0.call(arguments, 1);
                    return mergeIntoMapWith(this, deepMerger(merger), iters);
                };

                src_Map__Map.prototype.mergeDeepIn = function(keyPath) {
                    var iters = SLICE$0.call(arguments, 1);
                    return this.updateIn(keyPath, emptyMap(), function(m) {
                        return m.mergeDeep.apply(m, iters)
                    });
                };

                src_Map__Map.prototype.sort = function(comparator) {
                    // Late binding
                    return OrderedMap(sortFactory(this, comparator));
                };

                src_Map__Map.prototype.sortBy = function(mapper, comparator) {
                    // Late binding
                    return OrderedMap(sortFactory(this, comparator, mapper));
                };

                // @pragma Mutability

                src_Map__Map.prototype.withMutations = function(fn) {
                    var mutable = this.asMutable();
                    fn(mutable);
                    return mutable.wasAltered() ? mutable.__ensureOwner(this.__ownerID) : this;
                };

                src_Map__Map.prototype.asMutable = function() {
                    return this.__ownerID ? this : this.__ensureOwner(new OwnerID());
                };

                src_Map__Map.prototype.asImmutable = function() {
                    return this.__ensureOwner();
                };

                src_Map__Map.prototype.wasAltered = function() {
                    return this.__altered;
                };

                src_Map__Map.prototype.__iterator = function(type, reverse) {
                    return new MapIterator(this, type, reverse);
                };

                src_Map__Map.prototype.__iterate = function(fn, reverse) {
                    var this$0 = this;
                    var iterations = 0;
                    this._root && this._root.iterate(function(entry) {
                        iterations++;
                        return fn(entry[1], entry[0], this$0);
                    }, reverse);
                    return iterations;
                };

                src_Map__Map.prototype.__ensureOwner = function(ownerID) {
                    if (ownerID === this.__ownerID) {
                        return this;
                    }
                    if (!ownerID) {
                        this.__ownerID = ownerID;
                        this.__altered = false;
                        return this;
                    }
                    return makeMap(this.size, this._root, ownerID, this.__hash);
                };


                function isMap(maybeMap) {
                    return !!(maybeMap && maybeMap[IS_MAP_SENTINEL]);
                }

                src_Map__Map.isMap = isMap;

                var IS_MAP_SENTINEL = '@@__IMMUTABLE_MAP__@@';

                var MapPrototype = src_Map__Map.prototype;
                MapPrototype[IS_MAP_SENTINEL] = true;
                MapPrototype[DELETE] = MapPrototype.remove;
                MapPrototype.removeIn = MapPrototype.deleteIn;


                // #pragma Trie Nodes



                function ArrayMapNode(ownerID, entries) {
                    this.ownerID = ownerID;
                    this.entries = entries;
                }

                ArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
                    var entries = this.entries;
                    for (var ii = 0, len = entries.length; ii < len; ii++) {
                        if (is(key, entries[ii][0])) {
                            return entries[ii][1];
                        }
                    }
                    return notSetValue;
                };

                ArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
                    var removed = value === NOT_SET;

                    var entries = this.entries;
                    var idx = 0;
                    for (var len = entries.length; idx < len; idx++) {
                        if (is(key, entries[idx][0])) {
                            break;
                        }
                    }
                    var exists = idx < len;

                    if (exists ? entries[idx][1] === value : removed) {
                        return this;
                    }

                    SetRef(didAlter);
                    (removed || !exists) && SetRef(didChangeSize);

                    if (removed && entries.length === 1) {
                        return; // undefined
                    }

                    if (!exists && !removed && entries.length >= MAX_ARRAY_MAP_SIZE) {
                        return createNodes(ownerID, entries, key, value);
                    }

                    var isEditable = ownerID && ownerID === this.ownerID;
                    var newEntries = isEditable ? entries : arrCopy(entries);

                    if (exists) {
                        if (removed) {
                            idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
                        }
                        else {
                            newEntries[idx] = [key, value];
                        }
                    }
                    else {
                        newEntries.push([key, value]);
                    }

                    if (isEditable) {
                        this.entries = newEntries;
                        return this;
                    }

                    return new ArrayMapNode(ownerID, newEntries);
                };




                function BitmapIndexedNode(ownerID, bitmap, nodes) {
                    this.ownerID = ownerID;
                    this.bitmap = bitmap;
                    this.nodes = nodes;
                }

                BitmapIndexedNode.prototype.get = function(shift, keyHash, key, notSetValue) {
                    if (keyHash === undefined) {
                        keyHash = hash(key);
                    }
                    var bit = (1 << ((shift === 0 ? keyHash : keyHash >>> shift) & MASK));
                    var bitmap = this.bitmap;
                    return (bitmap & bit) === 0 ? notSetValue :
                        this.nodes[popCount(bitmap & (bit - 1))].get(shift + SHIFT, keyHash, key, notSetValue);
                };

                BitmapIndexedNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
                    if (keyHash === undefined) {
                        keyHash = hash(key);
                    }
                    var keyHashFrag = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
                    var bit = 1 << keyHashFrag;
                    var bitmap = this.bitmap;
                    var exists = (bitmap & bit) !== 0;

                    if (!exists && value === NOT_SET) {
                        return this;
                    }

                    var idx = popCount(bitmap & (bit - 1));
                    var nodes = this.nodes;
                    var node = exists ? nodes[idx] : undefined;
                    var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);

                    if (newNode === node) {
                        return this;
                    }

                    if (!exists && newNode && nodes.length >= MAX_BITMAP_INDEXED_SIZE) {
                        return expandNodes(ownerID, nodes, bitmap, keyHashFrag, newNode);
                    }

                    if (exists && !newNode && nodes.length === 2 && isLeafNode(nodes[idx ^ 1])) {
                        return nodes[idx ^ 1];
                    }

                    if (exists && newNode && nodes.length === 1 && isLeafNode(newNode)) {
                        return newNode;
                    }

                    var isEditable = ownerID && ownerID === this.ownerID;
                    var newBitmap = exists ? newNode ? bitmap : bitmap ^ bit : bitmap | bit;
                    var newNodes = exists ? newNode ?
                        setIn(nodes, idx, newNode, isEditable) :
                        spliceOut(nodes, idx, isEditable) :
                        spliceIn(nodes, idx, newNode, isEditable);

                    if (isEditable) {
                        this.bitmap = newBitmap;
                        this.nodes = newNodes;
                        return this;
                    }

                    return new BitmapIndexedNode(ownerID, newBitmap, newNodes);
                };




                function HashArrayMapNode(ownerID, count, nodes) {
                    this.ownerID = ownerID;
                    this.count = count;
                    this.nodes = nodes;
                }

                HashArrayMapNode.prototype.get = function(shift, keyHash, key, notSetValue) {
                    if (keyHash === undefined) {
                        keyHash = hash(key);
                    }
                    var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
                    var node = this.nodes[idx];
                    return node ? node.get(shift + SHIFT, keyHash, key, notSetValue) : notSetValue;
                };

                HashArrayMapNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
                    if (keyHash === undefined) {
                        keyHash = hash(key);
                    }
                    var idx = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;
                    var removed = value === NOT_SET;
                    var nodes = this.nodes;
                    var node = nodes[idx];

                    if (removed && !node) {
                        return this;
                    }

                    var newNode = updateNode(node, ownerID, shift + SHIFT, keyHash, key, value, didChangeSize, didAlter);
                    if (newNode === node) {
                        return this;
                    }

                    var newCount = this.count;
                    if (!node) {
                        newCount++;
                    }
                    else if (!newNode) {
                        newCount--;
                        if (newCount < MIN_HASH_ARRAY_MAP_SIZE) {
                            return packNodes(ownerID, nodes, newCount, idx);
                        }
                    }

                    var isEditable = ownerID && ownerID === this.ownerID;
                    var newNodes = setIn(nodes, idx, newNode, isEditable);

                    if (isEditable) {
                        this.count = newCount;
                        this.nodes = newNodes;
                        return this;
                    }

                    return new HashArrayMapNode(ownerID, newCount, newNodes);
                };




                function HashCollisionNode(ownerID, keyHash, entries) {
                    this.ownerID = ownerID;
                    this.keyHash = keyHash;
                    this.entries = entries;
                }

                HashCollisionNode.prototype.get = function(shift, keyHash, key, notSetValue) {
                    var entries = this.entries;
                    for (var ii = 0, len = entries.length; ii < len; ii++) {
                        if (is(key, entries[ii][0])) {
                            return entries[ii][1];
                        }
                    }
                    return notSetValue;
                };

                HashCollisionNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
                    if (keyHash === undefined) {
                        keyHash = hash(key);
                    }

                    var removed = value === NOT_SET;

                    if (keyHash !== this.keyHash) {
                        if (removed) {
                            return this;
                        }
                        SetRef(didAlter);
                        SetRef(didChangeSize);
                        return mergeIntoNode(this, ownerID, shift, keyHash, [key, value]);
                    }

                    var entries = this.entries;
                    var idx = 0;
                    for (var len = entries.length; idx < len; idx++) {
                        if (is(key, entries[idx][0])) {
                            break;
                        }
                    }
                    var exists = idx < len;

                    if (exists ? entries[idx][1] === value : removed) {
                        return this;
                    }

                    SetRef(didAlter);
                    (removed || !exists) && SetRef(didChangeSize);

                    if (removed && len === 2) {
                        return new ValueNode(ownerID, this.keyHash, entries[idx ^ 1]);
                    }

                    var isEditable = ownerID && ownerID === this.ownerID;
                    var newEntries = isEditable ? entries : arrCopy(entries);

                    if (exists) {
                        if (removed) {
                            idx === len - 1 ? newEntries.pop() : (newEntries[idx] = newEntries.pop());
                        }
                        else {
                            newEntries[idx] = [key, value];
                        }
                    }
                    else {
                        newEntries.push([key, value]);
                    }

                    if (isEditable) {
                        this.entries = newEntries;
                        return this;
                    }

                    return new HashCollisionNode(ownerID, this.keyHash, newEntries);
                };




                function ValueNode(ownerID, keyHash, entry) {
                    this.ownerID = ownerID;
                    this.keyHash = keyHash;
                    this.entry = entry;
                }

                ValueNode.prototype.get = function(shift, keyHash, key, notSetValue) {
                    return is(key, this.entry[0]) ? this.entry[1] : notSetValue;
                };

                ValueNode.prototype.update = function(ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
                    var removed = value === NOT_SET;
                    var keyMatch = is(key, this.entry[0]);
                    if (keyMatch ? value === this.entry[1] : removed) {
                        return this;
                    }

                    SetRef(didAlter);

                    if (removed) {
                        SetRef(didChangeSize);
                        return; // undefined
                    }

                    if (keyMatch) {
                        if (ownerID && ownerID === this.ownerID) {
                            this.entry[1] = value;
                            return this;
                        }
                        return new ValueNode(ownerID, this.keyHash, [key, value]);
                    }

                    SetRef(didChangeSize);
                    return mergeIntoNode(this, ownerID, shift, hash(key), [key, value]);
                };



                // #pragma Iterators

                ArrayMapNode.prototype.iterate =
                    HashCollisionNode.prototype.iterate = function(fn, reverse) {
                        var entries = this.entries;
                        for (var ii = 0, maxIndex = entries.length - 1; ii <= maxIndex; ii++) {
                            if (fn(entries[reverse ? maxIndex - ii : ii]) === false) {
                                return false;
                            }
                        }
                    }

                BitmapIndexedNode.prototype.iterate =
                    HashArrayMapNode.prototype.iterate = function(fn, reverse) {
                        var nodes = this.nodes;
                        for (var ii = 0, maxIndex = nodes.length - 1; ii <= maxIndex; ii++) {
                            var node = nodes[reverse ? maxIndex - ii : ii];
                            if (node && node.iterate(fn, reverse) === false) {
                                return false;
                            }
                        }
                    }

                ValueNode.prototype.iterate = function(fn, reverse) {
                    return fn(this.entry);
                }

                createClass(MapIterator, src_Iterator__Iterator);

                function MapIterator(map, type, reverse) {
                    this._type = type;
                    this._reverse = reverse;
                    this._stack = map._root && mapIteratorFrame(map._root);
                }

                MapIterator.prototype.next = function() {
                    var type = this._type;
                    var stack = this._stack;
                    while (stack) {
                        var node = stack.node;
                        var index = stack.index++;
                        var maxIndex;
                        if (node.entry) {
                            if (index === 0) {
                                return mapIteratorValue(type, node.entry);
                            }
                        }
                        else if (node.entries) {
                            maxIndex = node.entries.length - 1;
                            if (index <= maxIndex) {
                                return mapIteratorValue(type, node.entries[this._reverse ? maxIndex - index : index]);
                            }
                        }
                        else {
                            maxIndex = node.nodes.length - 1;
                            if (index <= maxIndex) {
                                var subNode = node.nodes[this._reverse ? maxIndex - index : index];
                                if (subNode) {
                                    if (subNode.entry) {
                                        return mapIteratorValue(type, subNode.entry);
                                    }
                                    stack = this._stack = mapIteratorFrame(subNode, stack);
                                }
                                continue;
                            }
                        }
                        stack = this._stack = this._stack.__prev;
                    }
                    return iteratorDone();
                };


                function mapIteratorValue(type, entry) {
                    return iteratorValue(type, entry[0], entry[1]);
                }

                function mapIteratorFrame(node, prev) {
                    return {
                        node: node,
                        index: 0,
                        __prev: prev
                    };
                }

                function makeMap(size, root, ownerID, hash) {
                    var map = Object.create(MapPrototype);
                    map.size = size;
                    map._root = root;
                    map.__ownerID = ownerID;
                    map.__hash = hash;
                    map.__altered = false;
                    return map;
                }

                var EMPTY_MAP;

                function emptyMap() {
                    return EMPTY_MAP || (EMPTY_MAP = makeMap(0));
                }

                function updateMap(map, k, v) {
                    var newRoot;
                    var newSize;
                    if (!map._root) {
                        if (v === NOT_SET) {
                            return map;
                        }
                        newSize = 1;
                        newRoot = new ArrayMapNode(map.__ownerID, [[k, v]]);
                    }
                    else {
                        var didChangeSize = MakeRef(CHANGE_LENGTH);
                        var didAlter = MakeRef(DID_ALTER);
                        newRoot = updateNode(map._root, map.__ownerID, 0, undefined, k, v, didChangeSize, didAlter);
                        if (!didAlter.value) {
                            return map;
                        }
                        newSize = map.size + (didChangeSize.value ? v === NOT_SET ? -1 : 1 : 0);
                    }
                    if (map.__ownerID) {
                        map.size = newSize;
                        map._root = newRoot;
                        map.__hash = undefined;
                        map.__altered = true;
                        return map;
                    }
                    return newRoot ? makeMap(newSize, newRoot) : emptyMap();
                }

                function updateNode(node, ownerID, shift, keyHash, key, value, didChangeSize, didAlter) {
                    if (!node) {
                        if (value === NOT_SET) {
                            return node;
                        }
                        SetRef(didAlter);
                        SetRef(didChangeSize);
                        return new ValueNode(ownerID, keyHash, [key, value]);
                    }
                    return node.update(ownerID, shift, keyHash, key, value, didChangeSize, didAlter);
                }

                function isLeafNode(node) {
                    return node.constructor === ValueNode || node.constructor === HashCollisionNode;
                }

                function mergeIntoNode(node, ownerID, shift, keyHash, entry) {
                    if (node.keyHash === keyHash) {
                        return new HashCollisionNode(ownerID, keyHash, [node.entry, entry]);
                    }

                    var idx1 = (shift === 0 ? node.keyHash : node.keyHash >>> shift) & MASK;
                    var idx2 = (shift === 0 ? keyHash : keyHash >>> shift) & MASK;

                    var newNode;
                    var nodes = idx1 === idx2 ? [mergeIntoNode(node, ownerID, shift + SHIFT, keyHash, entry)] :
                        ((newNode = new ValueNode(ownerID, keyHash, entry)), idx1 < idx2 ? [node, newNode] : [newNode, node]);

                    return new BitmapIndexedNode(ownerID, (1 << idx1) | (1 << idx2), nodes);
                }

                function createNodes(ownerID, entries, key, value) {
                    if (!ownerID) {
                        ownerID = new OwnerID();
                    }
                    var node = new ValueNode(ownerID, hash(key), [key, value]);
                    for (var ii = 0; ii < entries.length; ii++) {
                        var entry = entries[ii];
                        node = node.update(ownerID, 0, undefined, entry[0], entry[1]);
                    }
                    return node;
                }

                function packNodes(ownerID, nodes, count, excluding) {
                    var bitmap = 0;
                    var packedII = 0;
                    var packedNodes = new Array(count);
                    for (var ii = 0, bit = 1, len = nodes.length; ii < len; ii++, bit <<= 1) {
                        var node = nodes[ii];
                        if (node !== undefined && ii !== excluding) {
                            bitmap |= bit;
                            packedNodes[packedII++] = node;
                        }
                    }
                    return new BitmapIndexedNode(ownerID, bitmap, packedNodes);
                }

                function expandNodes(ownerID, nodes, bitmap, including, node) {
                    var count = 0;
                    var expandedNodes = new Array(SIZE);
                    for (var ii = 0; bitmap !== 0; ii++, bitmap >>>= 1) {
                        expandedNodes[ii] = bitmap & 1 ? nodes[count++] : undefined;
                    }
                    expandedNodes[including] = node;
                    return new HashArrayMapNode(ownerID, count + 1, expandedNodes);
                }

                function mergeIntoMapWith(map, merger, iterables) {
                    var iters = [];
                    for (var ii = 0; ii < iterables.length; ii++) {
                        var value = iterables[ii];
                        var iter = KeyedIterable(value);
                        if (!isIterable(value)) {
                            iter = iter.map(function(v) {
                                return fromJS(v)
                            });
                        }
                        iters.push(iter);
                    }
                    return mergeIntoCollectionWith(map, merger, iters);
                }

                function deepMerger(merger) {
                    return function(existing, value) {
                        return existing && existing.mergeDeepWith && isIterable(value) ?
                            existing.mergeDeepWith(merger, value) :
                            merger ? merger(existing, value) : value
                    };
                }

                function mergeIntoCollectionWith(collection, merger, iters) {
                    iters = iters.filter(function(x) {
                        return x.size !== 0
                    });
                    if (iters.length === 0) {
                        return collection;
                    }
                    if (collection.size === 0 && iters.length === 1) {
                        return collection.constructor(iters[0]);
                    }
                    return collection.withMutations(function(collection) {
                        var mergeIntoMap = merger ?
                            function(value, key) {
                                collection.update(key, NOT_SET, function(existing) {
                                    return existing === NOT_SET ? value : merger(existing, value)
                                });
                            } :
                            function(value, key) {
                                collection.set(key, value);
                            }
                        for (var ii = 0; ii < iters.length; ii++) {
                            iters[ii].forEach(mergeIntoMap);
                        }
                    });
                }

                function updateInDeepMap(existing, keyPathIter, notSetValue, updater) {
                    var isNotSet = existing === NOT_SET;
                    var step = keyPathIter.next();
                    if (step.done) {
                        var existingValue = isNotSet ? notSetValue : existing;
                        var newValue = updater(existingValue);
                        return newValue === existingValue ? existing : newValue;
                    }
                    invariant(
                        isNotSet || (existing && existing.set),
                        'invalid keyPath'
                    );
                    var key = step.value;
                    var nextExisting = isNotSet ? NOT_SET : existing.get(key, NOT_SET);
                    var nextUpdated = updateInDeepMap(
                        nextExisting,
                        keyPathIter,
                        notSetValue,
                        updater
                    );
                    return nextUpdated === nextExisting ? existing :
                        nextUpdated === NOT_SET ? existing.remove(key) :
                        (isNotSet ? emptyMap() : existing)
                        .set(key, nextUpdated);
                }

                function popCount(x) {
                    x = x - ((x >> 1) & 0x55555555);
                    x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
                    x = (x + (x >> 4)) & 0x0f0f0f0f;
                    x = x + (x >> 8);
                    x = x + (x >> 16);
                    return x & 0x7f;
                }

                function setIn(array, idx, val, canEdit) {
                    var newArray = canEdit ? array : arrCopy(array);
                    newArray[idx] = val;
                    return newArray;
                }

                function spliceIn(array, idx, val, canEdit) {
                    var newLen = array.length + 1;
                    if (canEdit && idx + 1 === newLen) {
                        array[idx] = val;
                        return array;
                    }
                    var newArray = new Array(newLen);
                    var after = 0;
                    for (var ii = 0; ii < newLen; ii++) {
                        if (ii === idx) {
                            newArray[ii] = val;
                            after = -1;
                        }
                        else {
                            newArray[ii] = array[ii + after];
                        }
                    }
                    return newArray;
                }

                function spliceOut(array, idx, canEdit) {
                    var newLen = array.length - 1;
                    if (canEdit && idx === newLen) {
                        array.pop();
                        return array;
                    }
                    var newArray = new Array(newLen);
                    var after = 0;
                    for (var ii = 0; ii < newLen; ii++) {
                        if (ii === idx) {
                            after = 1;
                        }
                        newArray[ii] = array[ii + after];
                    }
                    return newArray;
                }

                var MAX_ARRAY_MAP_SIZE = SIZE / 4;
                var MAX_BITMAP_INDEXED_SIZE = SIZE / 2;
                var MIN_HASH_ARRAY_MAP_SIZE = SIZE / 4;

                createClass(List, IndexedCollection);

                // @pragma Construction

                function List(value) {
                    var empty = emptyList();
                    if (value === null || value === undefined) {
                        return empty;
                    }
                    if (isList(value)) {
                        return value;
                    }
                    var iter = IndexedIterable(value);
                    var size = iter.size;
                    if (size === 0) {
                        return empty;
                    }
                    assertNotInfinite(size);
                    if (size > 0 && size < SIZE) {
                        return makeList(0, size, SHIFT, null, new VNode(iter.toArray()));
                    }
                    return empty.withMutations(function(list) {
                        list.setSize(size);
                        iter.forEach(function(v, i) {
                            return list.set(i, v)
                        });
                    });
                }

                List.of = function( /*...values*/ ) {
                    return this(arguments);
                };

                List.prototype.toString = function() {
                    return this.__toString('List [', ']');
                };

                // @pragma Access

                List.prototype.get = function(index, notSetValue) {
                    index = wrapIndex(this, index);
                    if (index < 0 || index >= this.size) {
                        return notSetValue;
                    }
                    index += this._origin;
                    var node = listNodeFor(this, index);
                    return node && node.array[index & MASK];
                };

                // @pragma Modification

                List.prototype.set = function(index, value) {
                    return updateList(this, index, value);
                };

                List.prototype.remove = function(index) {
                    return !this.has(index) ? this :
                        index === 0 ? this.shift() :
                        index === this.size - 1 ? this.pop() :
                        this.splice(index, 1);
                };

                List.prototype.clear = function() {
                    if (this.size === 0) {
                        return this;
                    }
                    if (this.__ownerID) {
                        this.size = this._origin = this._capacity = 0;
                        this._level = SHIFT;
                        this._root = this._tail = null;
                        this.__hash = undefined;
                        this.__altered = true;
                        return this;
                    }
                    return emptyList();
                };

                List.prototype.push = function( /*...values*/ ) {
                    var values = arguments;
                    var oldSize = this.size;
                    return this.withMutations(function(list) {
                        setListBounds(list, 0, oldSize + values.length);
                        for (var ii = 0; ii < values.length; ii++) {
                            list.set(oldSize + ii, values[ii]);
                        }
                    });
                };

                List.prototype.pop = function() {
                    return setListBounds(this, 0, -1);
                };

                List.prototype.unshift = function( /*...values*/ ) {
                    var values = arguments;
                    return this.withMutations(function(list) {
                        setListBounds(list, -values.length);
                        for (var ii = 0; ii < values.length; ii++) {
                            list.set(ii, values[ii]);
                        }
                    });
                };

                List.prototype.shift = function() {
                    return setListBounds(this, 1);
                };

                // @pragma Composition

                List.prototype.merge = function( /*...iters*/ ) {
                    return mergeIntoListWith(this, undefined, arguments);
                };

                List.prototype.mergeWith = function(merger) {
                    var iters = SLICE$0.call(arguments, 1);
                    return mergeIntoListWith(this, merger, iters);
                };

                List.prototype.mergeDeep = function( /*...iters*/ ) {
                    return mergeIntoListWith(this, deepMerger(undefined), arguments);
                };

                List.prototype.mergeDeepWith = function(merger) {
                    var iters = SLICE$0.call(arguments, 1);
                    return mergeIntoListWith(this, deepMerger(merger), iters);
                };

                List.prototype.setSize = function(size) {
                    return setListBounds(this, 0, size);
                };

                // @pragma Iteration

                List.prototype.slice = function(begin, end) {
                    var size = this.size;
                    if (wholeSlice(begin, end, size)) {
                        return this;
                    }
                    return setListBounds(
                        this,
                        resolveBegin(begin, size),
                        resolveEnd(end, size)
                    );
                };

                List.prototype.__iterator = function(type, reverse) {
                    var index = 0;
                    var values = iterateList(this, reverse);
                    return new src_Iterator__Iterator(function() {
                        var value = values();
                        return value === DONE ?
                            iteratorDone() :
                            iteratorValue(type, index++, value);
                    });
                };

                List.prototype.__iterate = function(fn, reverse) {
                    var index = 0;
                    var values = iterateList(this, reverse);
                    var value;
                    while ((value = values()) !== DONE) {
                        if (fn(value, index++, this) === false) {
                            break;
                        }
                    }
                    return index;
                };

                List.prototype.__ensureOwner = function(ownerID) {
                    if (ownerID === this.__ownerID) {
                        return this;
                    }
                    if (!ownerID) {
                        this.__ownerID = ownerID;
                        return this;
                    }
                    return makeList(this._origin, this._capacity, this._level, this._root, this._tail, ownerID, this.__hash);
                };


                function isList(maybeList) {
                    return !!(maybeList && maybeList[IS_LIST_SENTINEL]);
                }

                List.isList = isList;

                var IS_LIST_SENTINEL = '@@__IMMUTABLE_LIST__@@';

                var ListPrototype = List.prototype;
                ListPrototype[IS_LIST_SENTINEL] = true;
                ListPrototype[DELETE] = ListPrototype.remove;
                ListPrototype.setIn = MapPrototype.setIn;
                ListPrototype.deleteIn =
                    ListPrototype.removeIn = MapPrototype.removeIn;
                ListPrototype.update = MapPrototype.update;
                ListPrototype.updateIn = MapPrototype.updateIn;
                ListPrototype.mergeIn = MapPrototype.mergeIn;
                ListPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
                ListPrototype.withMutations = MapPrototype.withMutations;
                ListPrototype.asMutable = MapPrototype.asMutable;
                ListPrototype.asImmutable = MapPrototype.asImmutable;
                ListPrototype.wasAltered = MapPrototype.wasAltered;



                function VNode(array, ownerID) {
                    this.array = array;
                    this.ownerID = ownerID;
                }

                // TODO: seems like these methods are very similar

                VNode.prototype.removeBefore = function(ownerID, level, index) {
                    if (index === level ? 1 << level : 0 || this.array.length === 0) {
                        return this;
                    }
                    var originIndex = (index >>> level) & MASK;
                    if (originIndex >= this.array.length) {
                        return new VNode([], ownerID);
                    }
                    var removingFirst = originIndex === 0;
                    var newChild;
                    if (level > 0) {
                        var oldChild = this.array[originIndex];
                        newChild = oldChild && oldChild.removeBefore(ownerID, level - SHIFT, index);
                        if (newChild === oldChild && removingFirst) {
                            return this;
                        }
                    }
                    if (removingFirst && !newChild) {
                        return this;
                    }
                    var editable = editableVNode(this, ownerID);
                    if (!removingFirst) {
                        for (var ii = 0; ii < originIndex; ii++) {
                            editable.array[ii] = undefined;
                        }
                    }
                    if (newChild) {
                        editable.array[originIndex] = newChild;
                    }
                    return editable;
                };

                VNode.prototype.removeAfter = function(ownerID, level, index) {
                    if (index === level ? 1 << level : 0 || this.array.length === 0) {
                        return this;
                    }
                    var sizeIndex = ((index - 1) >>> level) & MASK;
                    if (sizeIndex >= this.array.length) {
                        return this;
                    }
                    var removingLast = sizeIndex === this.array.length - 1;
                    var newChild;
                    if (level > 0) {
                        var oldChild = this.array[sizeIndex];
                        newChild = oldChild && oldChild.removeAfter(ownerID, level - SHIFT, index);
                        if (newChild === oldChild && removingLast) {
                            return this;
                        }
                    }
                    if (removingLast && !newChild) {
                        return this;
                    }
                    var editable = editableVNode(this, ownerID);
                    if (!removingLast) {
                        editable.array.pop();
                    }
                    if (newChild) {
                        editable.array[sizeIndex] = newChild;
                    }
                    return editable;
                };



                var DONE = {};

                function iterateList(list, reverse) {
                    var left = list._origin;
                    var right = list._capacity;
                    var tailPos = getTailOffset(right);
                    var tail = list._tail;

                    return iterateNodeOrLeaf(list._root, list._level, 0);

                    function iterateNodeOrLeaf(node, level, offset) {
                        return level === 0 ?
                            iterateLeaf(node, offset) :
                            iterateNode(node, level, offset);
                    }

                    function iterateLeaf(node, offset) {
                        var array = offset === tailPos ? tail && tail.array : node && node.array;
                        var from = offset > left ? 0 : left - offset;
                        var to = right - offset;
                        if (to > SIZE) {
                            to = SIZE;
                        }
                        return function() {
                            if (from === to) {
                                return DONE;
                            }
                            var idx = reverse ? --to : from++;
                            return array && array[idx];
                        };
                    }

                    function iterateNode(node, level, offset) {
                        var values;
                        var array = node && node.array;
                        var from = offset > left ? 0 : (left - offset) >> level;
                        var to = ((right - offset) >> level) + 1;
                        if (to > SIZE) {
                            to = SIZE;
                        }
                        return function() {
                            do {
                                if (values) {
                                    var value = values();
                                    if (value !== DONE) {
                                        return value;
                                    }
                                    values = null;
                                }
                                if (from === to) {
                                    return DONE;
                                }
                                var idx = reverse ? --to : from++;
                                values = iterateNodeOrLeaf(
                                    array && array[idx], level - SHIFT, offset + (idx << level)
                                );
                            } while (true);
                        };
                    }
                }

                function makeList(origin, capacity, level, root, tail, ownerID, hash) {
                    var list = Object.create(ListPrototype);
                    list.size = capacity - origin;
                    list._origin = origin;
                    list._capacity = capacity;
                    list._level = level;
                    list._root = root;
                    list._tail = tail;
                    list.__ownerID = ownerID;
                    list.__hash = hash;
                    list.__altered = false;
                    return list;
                }

                var EMPTY_LIST;

                function emptyList() {
                    return EMPTY_LIST || (EMPTY_LIST = makeList(0, 0, SHIFT));
                }

                function updateList(list, index, value) {
                    index = wrapIndex(list, index);

                    if (index >= list.size || index < 0) {
                        return list.withMutations(function(list) {
                            index < 0 ?
                                setListBounds(list, index)
                                .set(0, value) :
                                setListBounds(list, 0, index + 1)
                                .set(index, value)
                        });
                    }

                    index += list._origin;

                    var newTail = list._tail;
                    var newRoot = list._root;
                    var didAlter = MakeRef(DID_ALTER);
                    if (index >= getTailOffset(list._capacity)) {
                        newTail = updateVNode(newTail, list.__ownerID, 0, index, value, didAlter);
                    }
                    else {
                        newRoot = updateVNode(newRoot, list.__ownerID, list._level, index, value, didAlter);
                    }

                    if (!didAlter.value) {
                        return list;
                    }

                    if (list.__ownerID) {
                        list._root = newRoot;
                        list._tail = newTail;
                        list.__hash = undefined;
                        list.__altered = true;
                        return list;
                    }
                    return makeList(list._origin, list._capacity, list._level, newRoot, newTail);
                }

                function updateVNode(node, ownerID, level, index, value, didAlter) {
                    var idx = (index >>> level) & MASK;
                    var nodeHas = node && idx < node.array.length;
                    if (!nodeHas && value === undefined) {
                        return node;
                    }

                    var newNode;

                    if (level > 0) {
                        var lowerNode = node && node.array[idx];
                        var newLowerNode = updateVNode(lowerNode, ownerID, level - SHIFT, index, value, didAlter);
                        if (newLowerNode === lowerNode) {
                            return node;
                        }
                        newNode = editableVNode(node, ownerID);
                        newNode.array[idx] = newLowerNode;
                        return newNode;
                    }

                    if (nodeHas && node.array[idx] === value) {
                        return node;
                    }

                    SetRef(didAlter);

                    newNode = editableVNode(node, ownerID);
                    if (value === undefined && idx === newNode.array.length - 1) {
                        newNode.array.pop();
                    }
                    else {
                        newNode.array[idx] = value;
                    }
                    return newNode;
                }

                function editableVNode(node, ownerID) {
                    if (ownerID && node && ownerID === node.ownerID) {
                        return node;
                    }
                    return new VNode(node ? node.array.slice() : [], ownerID);
                }

                function listNodeFor(list, rawIndex) {
                    if (rawIndex >= getTailOffset(list._capacity)) {
                        return list._tail;
                    }
                    if (rawIndex < 1 << (list._level + SHIFT)) {
                        var node = list._root;
                        var level = list._level;
                        while (node && level > 0) {
                            node = node.array[(rawIndex >>> level) & MASK];
                            level -= SHIFT;
                        }
                        return node;
                    }
                }

                function setListBounds(list, begin, end) {
                    var owner = list.__ownerID || new OwnerID();
                    var oldOrigin = list._origin;
                    var oldCapacity = list._capacity;
                    var newOrigin = oldOrigin + begin;
                    var newCapacity = end === undefined ? oldCapacity : end < 0 ? oldCapacity + end : oldOrigin + end;
                    if (newOrigin === oldOrigin && newCapacity === oldCapacity) {
                        return list;
                    }

                    // If it's going to end after it starts, it's empty.
                    if (newOrigin >= newCapacity) {
                        return list.clear();
                    }

                    var newLevel = list._level;
                    var newRoot = list._root;

                    // New origin might require creating a higher root.
                    var offsetShift = 0;
                    while (newOrigin + offsetShift < 0) {
                        newRoot = new VNode(newRoot && newRoot.array.length ? [undefined, newRoot] : [], owner);
                        newLevel += SHIFT;
                        offsetShift += 1 << newLevel;
                    }
                    if (offsetShift) {
                        newOrigin += offsetShift;
                        oldOrigin += offsetShift;
                        newCapacity += offsetShift;
                        oldCapacity += offsetShift;
                    }

                    var oldTailOffset = getTailOffset(oldCapacity);
                    var newTailOffset = getTailOffset(newCapacity);

                    // New size might require creating a higher root.
                    while (newTailOffset >= 1 << (newLevel + SHIFT)) {
                        newRoot = new VNode(newRoot && newRoot.array.length ? [newRoot] : [], owner);
                        newLevel += SHIFT;
                    }

                    // Locate or create the new tail.
                    var oldTail = list._tail;
                    var newTail = newTailOffset < oldTailOffset ?
                        listNodeFor(list, newCapacity - 1) :
                        newTailOffset > oldTailOffset ? new VNode([], owner) : oldTail;

                    // Merge Tail into tree.
                    if (oldTail && newTailOffset > oldTailOffset && newOrigin < oldCapacity && oldTail.array.length) {
                        newRoot = editableVNode(newRoot, owner);
                        var node = newRoot;
                        for (var level = newLevel; level > SHIFT; level -= SHIFT) {
                            var idx = (oldTailOffset >>> level) & MASK;
                            node = node.array[idx] = editableVNode(node.array[idx], owner);
                        }
                        node.array[(oldTailOffset >>> SHIFT) & MASK] = oldTail;
                    }

                    // If the size has been reduced, there's a chance the tail needs to be trimmed.
                    if (newCapacity < oldCapacity) {
                        newTail = newTail && newTail.removeAfter(owner, 0, newCapacity);
                    }

                    // If the new origin is within the tail, then we do not need a root.
                    if (newOrigin >= newTailOffset) {
                        newOrigin -= newTailOffset;
                        newCapacity -= newTailOffset;
                        newLevel = SHIFT;
                        newRoot = null;
                        newTail = newTail && newTail.removeBefore(owner, 0, newOrigin);

                        // Otherwise, if the root has been trimmed, garbage collect.
                    }
                    else if (newOrigin > oldOrigin || newTailOffset < oldTailOffset) {
                        offsetShift = 0;

                        // Identify the new top root node of the subtree of the old root.
                        while (newRoot) {
                            var beginIndex = (newOrigin >>> newLevel) & MASK;
                            if (beginIndex !== (newTailOffset >>> newLevel) & MASK) {
                                break;
                            }
                            if (beginIndex) {
                                offsetShift += (1 << newLevel) * beginIndex;
                            }
                            newLevel -= SHIFT;
                            newRoot = newRoot.array[beginIndex];
                        }

                        // Trim the new sides of the new root.
                        if (newRoot && newOrigin > oldOrigin) {
                            newRoot = newRoot.removeBefore(owner, newLevel, newOrigin - offsetShift);
                        }
                        if (newRoot && newTailOffset < oldTailOffset) {
                            newRoot = newRoot.removeAfter(owner, newLevel, newTailOffset - offsetShift);
                        }
                        if (offsetShift) {
                            newOrigin -= offsetShift;
                            newCapacity -= offsetShift;
                        }
                    }

                    if (list.__ownerID) {
                        list.size = newCapacity - newOrigin;
                        list._origin = newOrigin;
                        list._capacity = newCapacity;
                        list._level = newLevel;
                        list._root = newRoot;
                        list._tail = newTail;
                        list.__hash = undefined;
                        list.__altered = true;
                        return list;
                    }
                    return makeList(newOrigin, newCapacity, newLevel, newRoot, newTail);
                }

                function mergeIntoListWith(list, merger, iterables) {
                    var iters = [];
                    var maxSize = 0;
                    for (var ii = 0; ii < iterables.length; ii++) {
                        var value = iterables[ii];
                        var iter = IndexedIterable(value);
                        if (iter.size > maxSize) {
                            maxSize = iter.size;
                        }
                        if (!isIterable(value)) {
                            iter = iter.map(function(v) {
                                return fromJS(v)
                            });
                        }
                        iters.push(iter);
                    }
                    if (maxSize > list.size) {
                        list = list.setSize(maxSize);
                    }
                    return mergeIntoCollectionWith(list, merger, iters);
                }

                function getTailOffset(size) {
                    return size < SIZE ? 0 : (((size - 1) >>> SHIFT) << SHIFT);
                }

                createClass(OrderedMap, src_Map__Map);

                // @pragma Construction

                function OrderedMap(value) {
                    return value === null || value === undefined ? emptyOrderedMap() :
                        isOrderedMap(value) ? value :
                        emptyOrderedMap()
                        .withMutations(function(map) {
                            var iter = KeyedIterable(value);
                            assertNotInfinite(iter.size);
                            iter.forEach(function(v, k) {
                                return map.set(k, v)
                            });
                        });
                }

                OrderedMap.of = function( /*...values*/ ) {
                    return this(arguments);
                };

                OrderedMap.prototype.toString = function() {
                    return this.__toString('OrderedMap {', '}');
                };

                // @pragma Access

                OrderedMap.prototype.get = function(k, notSetValue) {
                    var index = this._map.get(k);
                    return index !== undefined ? this._list.get(index)[1] : notSetValue;
                };

                // @pragma Modification

                OrderedMap.prototype.clear = function() {
                    if (this.size === 0) {
                        return this;
                    }
                    if (this.__ownerID) {
                        this.size = 0;
                        this._map.clear();
                        this._list.clear();
                        return this;
                    }
                    return emptyOrderedMap();
                };

                OrderedMap.prototype.set = function(k, v) {
                    return updateOrderedMap(this, k, v);
                };

                OrderedMap.prototype.remove = function(k) {
                    return updateOrderedMap(this, k, NOT_SET);
                };

                OrderedMap.prototype.wasAltered = function() {
                    return this._map.wasAltered() || this._list.wasAltered();
                };

                OrderedMap.prototype.__iterate = function(fn, reverse) {
                    var this$0 = this;
                    return this._list.__iterate(
                        function(entry) {
                            return entry && fn(entry[1], entry[0], this$0)
                        },
                        reverse
                    );
                };

                OrderedMap.prototype.__iterator = function(type, reverse) {
                    return this._list.fromEntrySeq()
                        .__iterator(type, reverse);
                };

                OrderedMap.prototype.__ensureOwner = function(ownerID) {
                    if (ownerID === this.__ownerID) {
                        return this;
                    }
                    var newMap = this._map.__ensureOwner(ownerID);
                    var newList = this._list.__ensureOwner(ownerID);
                    if (!ownerID) {
                        this.__ownerID = ownerID;
                        this._map = newMap;
                        this._list = newList;
                        return this;
                    }
                    return makeOrderedMap(newMap, newList, ownerID, this.__hash);
                };


                function isOrderedMap(maybeOrderedMap) {
                    return isMap(maybeOrderedMap) && isOrdered(maybeOrderedMap);
                }

                OrderedMap.isOrderedMap = isOrderedMap;

                OrderedMap.prototype[IS_ORDERED_SENTINEL] = true;
                OrderedMap.prototype[DELETE] = OrderedMap.prototype.remove;



                function makeOrderedMap(map, list, ownerID, hash) {
                    var omap = Object.create(OrderedMap.prototype);
                    omap.size = map ? map.size : 0;
                    omap._map = map;
                    omap._list = list;
                    omap.__ownerID = ownerID;
                    omap.__hash = hash;
                    return omap;
                }

                var EMPTY_ORDERED_MAP;

                function emptyOrderedMap() {
                    return EMPTY_ORDERED_MAP || (EMPTY_ORDERED_MAP = makeOrderedMap(emptyMap(), emptyList()));
                }

                function updateOrderedMap(omap, k, v) {
                    var map = omap._map;
                    var list = omap._list;
                    var i = map.get(k);
                    var has = i !== undefined;
                    var newMap;
                    var newList;
                    if (v === NOT_SET) { // removed
                        if (!has) {
                            return omap;
                        }
                        if (list.size >= SIZE && list.size >= map.size * 2) {
                            newList = list.filter(function(entry, idx) {
                                return entry !== undefined && i !== idx
                            });
                            newMap = newList.toKeyedSeq()
                                .map(function(entry) {
                                    return entry[0]
                                })
                                .flip()
                                .toMap();
                            if (omap.__ownerID) {
                                newMap.__ownerID = newList.__ownerID = omap.__ownerID;
                            }
                        }
                        else {
                            newMap = map.remove(k);
                            newList = i === list.size - 1 ? list.pop() : list.set(i, undefined);
                        }
                    }
                    else {
                        if (has) {
                            if (v === list.get(i)[1]) {
                                return omap;
                            }
                            newMap = map;
                            newList = list.set(i, [k, v]);
                        }
                        else {
                            newMap = map.set(k, list.size);
                            newList = list.set(list.size, [k, v]);
                        }
                    }
                    if (omap.__ownerID) {
                        omap.size = newMap.size;
                        omap._map = newMap;
                        omap._list = newList;
                        omap.__hash = undefined;
                        return omap;
                    }
                    return makeOrderedMap(newMap, newList);
                }

                createClass(Stack, IndexedCollection);

                // @pragma Construction

                function Stack(value) {
                    return value === null || value === undefined ? emptyStack() :
                        isStack(value) ? value :
                        emptyStack()
                        .unshiftAll(value);
                }

                Stack.of = function( /*...values*/ ) {
                    return this(arguments);
                };

                Stack.prototype.toString = function() {
                    return this.__toString('Stack [', ']');
                };

                // @pragma Access

                Stack.prototype.get = function(index, notSetValue) {
                    var head = this._head;
                    index = wrapIndex(this, index);
                    while (head && index--) {
                        head = head.next;
                    }
                    return head ? head.value : notSetValue;
                };

                Stack.prototype.peek = function() {
                    return this._head && this._head.value;
                };

                // @pragma Modification

                Stack.prototype.push = function( /*...values*/ ) {
                    if (arguments.length === 0) {
                        return this;
                    }
                    var newSize = this.size + arguments.length;
                    var head = this._head;
                    for (var ii = arguments.length - 1; ii >= 0; ii--) {
                        head = {
                            value: arguments[ii],
                            next: head
                        };
                    }
                    if (this.__ownerID) {
                        this.size = newSize;
                        this._head = head;
                        this.__hash = undefined;
                        this.__altered = true;
                        return this;
                    }
                    return makeStack(newSize, head);
                };

                Stack.prototype.pushAll = function(iter) {
                    iter = IndexedIterable(iter);
                    if (iter.size === 0) {
                        return this;
                    }
                    assertNotInfinite(iter.size);
                    var newSize = this.size;
                    var head = this._head;
                    iter.reverse()
                        .forEach(function(value) {
                            newSize++;
                            head = {
                                value: value,
                                next: head
                            };
                        });
                    if (this.__ownerID) {
                        this.size = newSize;
                        this._head = head;
                        this.__hash = undefined;
                        this.__altered = true;
                        return this;
                    }
                    return makeStack(newSize, head);
                };

                Stack.prototype.pop = function() {
                    return this.slice(1);
                };

                Stack.prototype.unshift = function( /*...values*/ ) {
                    return this.push.apply(this, arguments);
                };

                Stack.prototype.unshiftAll = function(iter) {
                    return this.pushAll(iter);
                };

                Stack.prototype.shift = function() {
                    return this.pop.apply(this, arguments);
                };

                Stack.prototype.clear = function() {
                    if (this.size === 0) {
                        return this;
                    }
                    if (this.__ownerID) {
                        this.size = 0;
                        this._head = undefined;
                        this.__hash = undefined;
                        this.__altered = true;
                        return this;
                    }
                    return emptyStack();
                };

                Stack.prototype.slice = function(begin, end) {
                    if (wholeSlice(begin, end, this.size)) {
                        return this;
                    }
                    var resolvedBegin = resolveBegin(begin, this.size);
                    var resolvedEnd = resolveEnd(end, this.size);
                    if (resolvedEnd !== this.size) {
                        // super.slice(begin, end);
                        return IndexedCollection.prototype.slice.call(this, begin, end);
                    }
                    var newSize = this.size - resolvedBegin;
                    var head = this._head;
                    while (resolvedBegin--) {
                        head = head.next;
                    }
                    if (this.__ownerID) {
                        this.size = newSize;
                        this._head = head;
                        this.__hash = undefined;
                        this.__altered = true;
                        return this;
                    }
                    return makeStack(newSize, head);
                };

                // @pragma Mutability

                Stack.prototype.__ensureOwner = function(ownerID) {
                    if (ownerID === this.__ownerID) {
                        return this;
                    }
                    if (!ownerID) {
                        this.__ownerID = ownerID;
                        this.__altered = false;
                        return this;
                    }
                    return makeStack(this.size, this._head, ownerID, this.__hash);
                };

                // @pragma Iteration

                Stack.prototype.__iterate = function(fn, reverse) {
                    if (reverse) {
                        return this.reverse()
                            .__iterate(fn);
                    }
                    var iterations = 0;
                    var node = this._head;
                    while (node) {
                        if (fn(node.value, iterations++, this) === false) {
                            break;
                        }
                        node = node.next;
                    }
                    return iterations;
                };

                Stack.prototype.__iterator = function(type, reverse) {
                    if (reverse) {
                        return this.reverse()
                            .__iterator(type);
                    }
                    var iterations = 0;
                    var node = this._head;
                    return new src_Iterator__Iterator(function() {
                        if (node) {
                            var value = node.value;
                            node = node.next;
                            return iteratorValue(type, iterations++, value);
                        }
                        return iteratorDone();
                    });
                };


                function isStack(maybeStack) {
                    return !!(maybeStack && maybeStack[IS_STACK_SENTINEL]);
                }

                Stack.isStack = isStack;

                var IS_STACK_SENTINEL = '@@__IMMUTABLE_STACK__@@';

                var StackPrototype = Stack.prototype;
                StackPrototype[IS_STACK_SENTINEL] = true;
                StackPrototype.withMutations = MapPrototype.withMutations;
                StackPrototype.asMutable = MapPrototype.asMutable;
                StackPrototype.asImmutable = MapPrototype.asImmutable;
                StackPrototype.wasAltered = MapPrototype.wasAltered;


                function makeStack(size, head, ownerID, hash) {
                    var map = Object.create(StackPrototype);
                    map.size = size;
                    map._head = head;
                    map.__ownerID = ownerID;
                    map.__hash = hash;
                    map.__altered = false;
                    return map;
                }

                var EMPTY_STACK;

                function emptyStack() {
                    return EMPTY_STACK || (EMPTY_STACK = makeStack(0));
                }

                createClass(src_Set__Set, SetCollection);

                // @pragma Construction

                function src_Set__Set(value) {
                    return value === null || value === undefined ? emptySet() :
                        isSet(value) ? value :
                        emptySet()
                        .withMutations(function(set) {
                            var iter = SetIterable(value);
                            assertNotInfinite(iter.size);
                            iter.forEach(function(v) {
                                return set.add(v)
                            });
                        });
                }

                src_Set__Set.of = function( /*...values*/ ) {
                    return this(arguments);
                };

                src_Set__Set.fromKeys = function(value) {
                    return this(KeyedIterable(value)
                        .keySeq());
                };

                src_Set__Set.prototype.toString = function() {
                    return this.__toString('Set {', '}');
                };

                // @pragma Access

                src_Set__Set.prototype.has = function(value) {
                    return this._map.has(value);
                };

                // @pragma Modification

                src_Set__Set.prototype.add = function(value) {
                    return updateSet(this, this._map.set(value, true));
                };

                src_Set__Set.prototype.remove = function(value) {
                    return updateSet(this, this._map.remove(value));
                };

                src_Set__Set.prototype.clear = function() {
                    return updateSet(this, this._map.clear());
                };

                // @pragma Composition

                src_Set__Set.prototype.union = function() {
                    var iters = SLICE$0.call(arguments, 0);
                    iters = iters.filter(function(x) {
                        return x.size !== 0
                    });
                    if (iters.length === 0) {
                        return this;
                    }
                    if (this.size === 0 && iters.length === 1) {
                        return this.constructor(iters[0]);
                    }
                    return this.withMutations(function(set) {
                        for (var ii = 0; ii < iters.length; ii++) {
                            SetIterable(iters[ii])
                                .forEach(function(value) {
                                    return set.add(value)
                                });
                        }
                    });
                };

                src_Set__Set.prototype.intersect = function() {
                    var iters = SLICE$0.call(arguments, 0);
                    if (iters.length === 0) {
                        return this;
                    }
                    iters = iters.map(function(iter) {
                        return SetIterable(iter)
                    });
                    var originalSet = this;
                    return this.withMutations(function(set) {
                        originalSet.forEach(function(value) {
                            if (!iters.every(function(iter) {
                                    return iter.contains(value)
                                })) {
                                set.remove(value);
                            }
                        });
                    });
                };

                src_Set__Set.prototype.subtract = function() {
                    var iters = SLICE$0.call(arguments, 0);
                    if (iters.length === 0) {
                        return this;
                    }
                    iters = iters.map(function(iter) {
                        return SetIterable(iter)
                    });
                    var originalSet = this;
                    return this.withMutations(function(set) {
                        originalSet.forEach(function(value) {
                            if (iters.some(function(iter) {
                                    return iter.contains(value)
                                })) {
                                set.remove(value);
                            }
                        });
                    });
                };

                src_Set__Set.prototype.merge = function() {
                    return this.union.apply(this, arguments);
                };

                src_Set__Set.prototype.mergeWith = function(merger) {
                    var iters = SLICE$0.call(arguments, 1);
                    return this.union.apply(this, iters);
                };

                src_Set__Set.prototype.sort = function(comparator) {
                    // Late binding
                    return OrderedSet(sortFactory(this, comparator));
                };

                src_Set__Set.prototype.sortBy = function(mapper, comparator) {
                    // Late binding
                    return OrderedSet(sortFactory(this, comparator, mapper));
                };

                src_Set__Set.prototype.wasAltered = function() {
                    return this._map.wasAltered();
                };

                src_Set__Set.prototype.__iterate = function(fn, reverse) {
                    var this$0 = this;
                    return this._map.__iterate(function(_, k) {
                        return fn(k, k, this$0)
                    }, reverse);
                };

                src_Set__Set.prototype.__iterator = function(type, reverse) {
                    return this._map.map(function(_, k) {
                            return k
                        })
                        .__iterator(type, reverse);
                };

                src_Set__Set.prototype.__ensureOwner = function(ownerID) {
                    if (ownerID === this.__ownerID) {
                        return this;
                    }
                    var newMap = this._map.__ensureOwner(ownerID);
                    if (!ownerID) {
                        this.__ownerID = ownerID;
                        this._map = newMap;
                        return this;
                    }
                    return this.__make(newMap, ownerID);
                };


                function isSet(maybeSet) {
                    return !!(maybeSet && maybeSet[IS_SET_SENTINEL]);
                }

                src_Set__Set.isSet = isSet;

                var IS_SET_SENTINEL = '@@__IMMUTABLE_SET__@@';

                var SetPrototype = src_Set__Set.prototype;
                SetPrototype[IS_SET_SENTINEL] = true;
                SetPrototype[DELETE] = SetPrototype.remove;
                SetPrototype.mergeDeep = SetPrototype.merge;
                SetPrototype.mergeDeepWith = SetPrototype.mergeWith;
                SetPrototype.withMutations = MapPrototype.withMutations;
                SetPrototype.asMutable = MapPrototype.asMutable;
                SetPrototype.asImmutable = MapPrototype.asImmutable;

                SetPrototype.__empty = emptySet;
                SetPrototype.__make = makeSet;

                function updateSet(set, newMap) {
                    if (set.__ownerID) {
                        set.size = newMap.size;
                        set._map = newMap;
                        return set;
                    }
                    return newMap === set._map ? set :
                        newMap.size === 0 ? set.__empty() :
                        set.__make(newMap);
                }

                function makeSet(map, ownerID) {
                    var set = Object.create(SetPrototype);
                    set.size = map ? map.size : 0;
                    set._map = map;
                    set.__ownerID = ownerID;
                    return set;
                }

                var EMPTY_SET;

                function emptySet() {
                    return EMPTY_SET || (EMPTY_SET = makeSet(emptyMap()));
                }

                createClass(OrderedSet, src_Set__Set);

                // @pragma Construction

                function OrderedSet(value) {
                    return value === null || value === undefined ? emptyOrderedSet() :
                        isOrderedSet(value) ? value :
                        emptyOrderedSet()
                        .withMutations(function(set) {
                            var iter = SetIterable(value);
                            assertNotInfinite(iter.size);
                            iter.forEach(function(v) {
                                return set.add(v)
                            });
                        });
                }

                OrderedSet.of = function( /*...values*/ ) {
                    return this(arguments);
                };

                OrderedSet.fromKeys = function(value) {
                    return this(KeyedIterable(value)
                        .keySeq());
                };

                OrderedSet.prototype.toString = function() {
                    return this.__toString('OrderedSet {', '}');
                };


                function isOrderedSet(maybeOrderedSet) {
                    return isSet(maybeOrderedSet) && isOrdered(maybeOrderedSet);
                }

                OrderedSet.isOrderedSet = isOrderedSet;

                var OrderedSetPrototype = OrderedSet.prototype;
                OrderedSetPrototype[IS_ORDERED_SENTINEL] = true;

                OrderedSetPrototype.__empty = emptyOrderedSet;
                OrderedSetPrototype.__make = makeOrderedSet;

                function makeOrderedSet(map, ownerID) {
                    var set = Object.create(OrderedSetPrototype);
                    set.size = map ? map.size : 0;
                    set._map = map;
                    set.__ownerID = ownerID;
                    return set;
                }

                var EMPTY_ORDERED_SET;

                function emptyOrderedSet() {
                    return EMPTY_ORDERED_SET || (EMPTY_ORDERED_SET = makeOrderedSet(emptyOrderedMap()));
                }

                createClass(Record, KeyedCollection);

                function Record(defaultValues, name) {
                    var RecordType = function Record(values) {
                        if (!(this instanceof RecordType)) {
                            return new RecordType(values);
                        }
                        this._map = src_Map__Map(values);
                    };

                    var keys = Object.keys(defaultValues);

                    var RecordTypePrototype = RecordType.prototype = Object.create(RecordPrototype);
                    RecordTypePrototype.constructor = RecordType;
                    name && (RecordTypePrototype._name = name);
                    RecordTypePrototype._defaultValues = defaultValues;
                    RecordTypePrototype._keys = keys;
                    RecordTypePrototype.size = keys.length;

                    try {
                        keys.forEach(function(key) {
                            Object.defineProperty(RecordType.prototype, key, {
                                get: function() {
                                    return this.get(key);
                                },
                                set: function(value) {
                                    invariant(this.__ownerID, 'Cannot set on an immutable record.');
                                    this.set(key, value);
                                }
                            });
                        });
                    }
                    catch (error) {
                        // Object.defineProperty failed. Probably IE8.
                    }

                    return RecordType;
                }

                Record.prototype.toString = function() {
                    return this.__toString(recordName(this) + ' {', '}');
                };

                // @pragma Access

                Record.prototype.has = function(k) {
                    return this._defaultValues.hasOwnProperty(k);
                };

                Record.prototype.get = function(k, notSetValue) {
                    if (!this.has(k)) {
                        return notSetValue;
                    }
                    var defaultVal = this._defaultValues[k];
                    return this._map ? this._map.get(k, defaultVal) : defaultVal;
                };

                // @pragma Modification

                Record.prototype.clear = function() {
                    if (this.__ownerID) {
                        this._map && this._map.clear();
                        return this;
                    }
                    var SuperRecord = Object.getPrototypeOf(this)
                        .constructor;
                    return SuperRecord._empty || (SuperRecord._empty = makeRecord(this, emptyMap()));
                };

                Record.prototype.set = function(k, v) {
                    if (!this.has(k)) {
                        throw new Error('Cannot set unknown key "' + k + '" on ' + recordName(this));
                    }
                    var newMap = this._map && this._map.set(k, v);
                    if (this.__ownerID || newMap === this._map) {
                        return this;
                    }
                    return makeRecord(this, newMap);
                };

                Record.prototype.remove = function(k) {
                    if (!this.has(k)) {
                        return this;
                    }
                    var newMap = this._map && this._map.remove(k);
                    if (this.__ownerID || newMap === this._map) {
                        return this;
                    }
                    return makeRecord(this, newMap);
                };

                Record.prototype.wasAltered = function() {
                    return this._map.wasAltered();
                };

                Record.prototype.__iterator = function(type, reverse) {
                    var this$0 = this;
                    return KeyedIterable(this._defaultValues)
                        .map(function(_, k) {
                            return this$0.get(k)
                        })
                        .__iterator(type, reverse);
                };

                Record.prototype.__iterate = function(fn, reverse) {
                    var this$0 = this;
                    return KeyedIterable(this._defaultValues)
                        .map(function(_, k) {
                            return this$0.get(k)
                        })
                        .__iterate(fn, reverse);
                };

                Record.prototype.__ensureOwner = function(ownerID) {
                    if (ownerID === this.__ownerID) {
                        return this;
                    }
                    var newMap = this._map && this._map.__ensureOwner(ownerID);
                    if (!ownerID) {
                        this.__ownerID = ownerID;
                        this._map = newMap;
                        return this;
                    }
                    return makeRecord(this, newMap, ownerID);
                };


                var RecordPrototype = Record.prototype;
                RecordPrototype[DELETE] = RecordPrototype.remove;
                RecordPrototype.deleteIn =
                    RecordPrototype.removeIn = MapPrototype.removeIn;
                RecordPrototype.merge = MapPrototype.merge;
                RecordPrototype.mergeWith = MapPrototype.mergeWith;
                RecordPrototype.mergeIn = MapPrototype.mergeIn;
                RecordPrototype.mergeDeep = MapPrototype.mergeDeep;
                RecordPrototype.mergeDeepWith = MapPrototype.mergeDeepWith;
                RecordPrototype.mergeDeepIn = MapPrototype.mergeDeepIn;
                RecordPrototype.setIn = MapPrototype.setIn;
                RecordPrototype.update = MapPrototype.update;
                RecordPrototype.updateIn = MapPrototype.updateIn;
                RecordPrototype.withMutations = MapPrototype.withMutations;
                RecordPrototype.asMutable = MapPrototype.asMutable;
                RecordPrototype.asImmutable = MapPrototype.asImmutable;


                function makeRecord(likeRecord, map, ownerID) {
                    var record = Object.create(Object.getPrototypeOf(likeRecord));
                    record._map = map;
                    record.__ownerID = ownerID;
                    return record;
                }

                function recordName(record) {
                    return record._name || record.constructor.name;
                }

                function deepEqual(a, b) {
                    if (a === b) {
                        return true;
                    }

                    if (!isIterable(b) ||
                        a.size !== undefined && b.size !== undefined && a.size !== b.size ||
                        a.__hash !== undefined && b.__hash !== undefined && a.__hash !== b.__hash ||
                        isKeyed(a) !== isKeyed(b) ||
                        isIndexed(a) !== isIndexed(b) ||
                        isOrdered(a) !== isOrdered(b)
                    ) {
                        return false;
                    }

                    if (a.size === 0 && b.size === 0) {
                        return true;
                    }

                    var notAssociative = !isAssociative(a);

                    if (isOrdered(a)) {
                        var entries = a.entries();
                        return b.every(function(v, k) {
                                var entry = entries.next()
                                    .value;
                                return entry && is(entry[1], v) && (notAssociative || is(entry[0], k));
                            }) && entries.next()
                            .done;
                    }

                    var flipped = false;

                    if (a.size === undefined) {
                        if (b.size === undefined) {
                            a.cacheResult();
                        }
                        else {
                            flipped = true;
                            var _ = a;
                            a = b;
                            b = _;
                        }
                    }

                    var allEqual = true;
                    var bSize = b.__iterate(function(v, k) {
                        if (notAssociative ? !a.has(v) :
                            flipped ? !is(v, a.get(k, NOT_SET)) : !is(a.get(k, NOT_SET), v)) {
                            allEqual = false;
                            return false;
                        }
                    });

                    return allEqual && a.size === bSize;
                }

                createClass(Range, IndexedSeq);

                function Range(start, end, step) {
                    if (!(this instanceof Range)) {
                        return new Range(start, end, step);
                    }
                    invariant(step !== 0, 'Cannot step a Range by 0');
                    start = start || 0;
                    if (end === undefined) {
                        end = Infinity;
                    }
                    step = step === undefined ? 1 : Math.abs(step);
                    if (end < start) {
                        step = -step;
                    }
                    this._start = start;
                    this._end = end;
                    this._step = step;
                    this.size = Math.max(0, Math.ceil((end - start) / step - 1) + 1);
                    if (this.size === 0) {
                        if (EMPTY_RANGE) {
                            return EMPTY_RANGE;
                        }
                        EMPTY_RANGE = this;
                    }
                }

                Range.prototype.toString = function() {
                    if (this.size === 0) {
                        return 'Range []';
                    }
                    return 'Range [ ' +
                        this._start + '...' + this._end +
                        (this._step > 1 ? ' by ' + this._step : '') +
                        ' ]';
                };

                Range.prototype.get = function(index, notSetValue) {
                    return this.has(index) ?
                        this._start + wrapIndex(this, index) * this._step :
                        notSetValue;
                };

                Range.prototype.contains = function(searchValue) {
                    var possibleIndex = (searchValue - this._start) / this._step;
                    return possibleIndex >= 0 &&
                        possibleIndex < this.size &&
                        possibleIndex === Math.floor(possibleIndex);
                };

                Range.prototype.slice = function(begin, end) {
                    if (wholeSlice(begin, end, this.size)) {
                        return this;
                    }
                    begin = resolveBegin(begin, this.size);
                    end = resolveEnd(end, this.size);
                    if (end <= begin) {
                        return new Range(0, 0);
                    }
                    return new Range(this.get(begin, this._end), this.get(end, this._end), this._step);
                };

                Range.prototype.indexOf = function(searchValue) {
                    var offsetValue = searchValue - this._start;
                    if (offsetValue % this._step === 0) {
                        var index = offsetValue / this._step;
                        if (index >= 0 && index < this.size) {
                            return index
                        }
                    }
                    return -1;
                };

                Range.prototype.lastIndexOf = function(searchValue) {
                    return this.indexOf(searchValue);
                };

                Range.prototype.__iterate = function(fn, reverse) {
                    var maxIndex = this.size - 1;
                    var step = this._step;
                    var value = reverse ? this._start + maxIndex * step : this._start;
                    for (var ii = 0; ii <= maxIndex; ii++) {
                        if (fn(value, ii, this) === false) {
                            return ii + 1;
                        }
                        value += reverse ? -step : step;
                    }
                    return ii;
                };

                Range.prototype.__iterator = function(type, reverse) {
                    var maxIndex = this.size - 1;
                    var step = this._step;
                    var value = reverse ? this._start + maxIndex * step : this._start;
                    var ii = 0;
                    return new src_Iterator__Iterator(function() {
                        var v = value;
                        value += reverse ? -step : step;
                        return ii > maxIndex ? iteratorDone() : iteratorValue(type, ii++, v);
                    });
                };

                Range.prototype.equals = function(other) {
                    return other instanceof Range ?
                        this._start === other._start &&
                        this._end === other._end &&
                        this._step === other._step :
                        deepEqual(this, other);
                };


                var EMPTY_RANGE;

                createClass(Repeat, IndexedSeq);

                function Repeat(value, times) {
                    if (!(this instanceof Repeat)) {
                        return new Repeat(value, times);
                    }
                    this._value = value;
                    this.size = times === undefined ? Infinity : Math.max(0, times);
                    if (this.size === 0) {
                        if (EMPTY_REPEAT) {
                            return EMPTY_REPEAT;
                        }
                        EMPTY_REPEAT = this;
                    }
                }

                Repeat.prototype.toString = function() {
                    if (this.size === 0) {
                        return 'Repeat []';
                    }
                    return 'Repeat [ ' + this._value + ' ' + this.size + ' times ]';
                };

                Repeat.prototype.get = function(index, notSetValue) {
                    return this.has(index) ? this._value : notSetValue;
                };

                Repeat.prototype.contains = function(searchValue) {
                    return is(this._value, searchValue);
                };

                Repeat.prototype.slice = function(begin, end) {
                    var size = this.size;
                    return wholeSlice(begin, end, size) ? this :
                        new Repeat(this._value, resolveEnd(end, size) - resolveBegin(begin, size));
                };

                Repeat.prototype.reverse = function() {
                    return this;
                };

                Repeat.prototype.indexOf = function(searchValue) {
                    if (is(this._value, searchValue)) {
                        return 0;
                    }
                    return -1;
                };

                Repeat.prototype.lastIndexOf = function(searchValue) {
                    if (is(this._value, searchValue)) {
                        return this.size;
                    }
                    return -1;
                };

                Repeat.prototype.__iterate = function(fn, reverse) {
                    for (var ii = 0; ii < this.size; ii++) {
                        if (fn(this._value, ii, this) === false) {
                            return ii + 1;
                        }
                    }
                    return ii;
                };

                Repeat.prototype.__iterator = function(type, reverse) {
                    var this$0 = this;
                    var ii = 0;
                    return new src_Iterator__Iterator(function() {
                        return ii < this$0.size ? iteratorValue(type, ii++, this$0._value) : iteratorDone()
                    });
                };

                Repeat.prototype.equals = function(other) {
                    return other instanceof Repeat ?
                        is(this._value, other._value) :
                        deepEqual(other);
                };


                var EMPTY_REPEAT;

                /**
                 * Contributes additional methods to a constructor
                 */
                function mixin(ctor, methods) {
                    var keyCopier = function(key) {
                        ctor.prototype[key] = methods[key];
                    };
                    Object.keys(methods)
                        .forEach(keyCopier);
                    Object.getOwnPropertySymbols &&
                        Object.getOwnPropertySymbols(methods)
                        .forEach(keyCopier);
                    return ctor;
                }

                Iterable.Iterator = src_Iterator__Iterator;

                mixin(Iterable, {

                    // ### Conversion to other types

                    toArray: function() {
                        assertNotInfinite(this.size);
                        var array = new Array(this.size || 0);
                        this.valueSeq()
                            .__iterate(function(v, i) {
                                array[i] = v;
                            });
                        return array;
                    },

                    toIndexedSeq: function() {
                        return new ToIndexedSequence(this);
                    },

                    toJS: function() {
                        return this.toSeq()
                            .map(
                                function(value) {
                                    return value && typeof value.toJS === 'function' ? value.toJS() : value
                                }
                            )
                            .__toJS();
                    },

                    toJSON: function() {
                        return this.toSeq()
                            .map(
                                function(value) {
                                    return value && typeof value.toJSON === 'function' ? value.toJSON() : value
                                }
                            )
                            .__toJS();
                    },

                    toKeyedSeq: function() {
                        return new ToKeyedSequence(this, true);
                    },

                    toMap: function() {
                        // Use Late Binding here to solve the circular dependency.
                        return src_Map__Map(this.toKeyedSeq());
                    },

                    toObject: function() {
                        assertNotInfinite(this.size);
                        var object = {};
                        this.__iterate(function(v, k) {
                            object[k] = v;
                        });
                        return object;
                    },

                    toOrderedMap: function() {
                        // Use Late Binding here to solve the circular dependency.
                        return OrderedMap(this.toKeyedSeq());
                    },

                    toOrderedSet: function() {
                        // Use Late Binding here to solve the circular dependency.
                        return OrderedSet(isKeyed(this) ? this.valueSeq() : this);
                    },

                    toSet: function() {
                        // Use Late Binding here to solve the circular dependency.
                        return src_Set__Set(isKeyed(this) ? this.valueSeq() : this);
                    },

                    toSetSeq: function() {
                        return new ToSetSequence(this);
                    },

                    toSeq: function() {
                        return isIndexed(this) ? this.toIndexedSeq() :
                            isKeyed(this) ? this.toKeyedSeq() :
                            this.toSetSeq();
                    },

                    toStack: function() {
                        // Use Late Binding here to solve the circular dependency.
                        return Stack(isKeyed(this) ? this.valueSeq() : this);
                    },

                    toList: function() {
                        // Use Late Binding here to solve the circular dependency.
                        return List(isKeyed(this) ? this.valueSeq() : this);
                    },


                    // ### Common JavaScript methods and properties

                    toString: function() {
                        return '[Iterable]';
                    },

                    __toString: function(head, tail) {
                        if (this.size === 0) {
                            return head + tail;
                        }
                        return head + ' ' + this.toSeq()
                            .map(this.__toStringMapper)
                            .join(', ') + ' ' + tail;
                    },


                    // ### ES6 Collection methods (ES6 Array and Map)

                    concat: function() {
                        var values = SLICE$0.call(arguments, 0);
                        return reify(this, concatFactory(this, values));
                    },

                    contains: function(searchValue) {
                        return this.some(function(value) {
                            return is(value, searchValue)
                        });
                    },

                    entries: function() {
                        return this.__iterator(ITERATE_ENTRIES);
                    },

                    every: function(predicate, context) {
                        assertNotInfinite(this.size);
                        var returnValue = true;
                        this.__iterate(function(v, k, c) {
                            if (!predicate.call(context, v, k, c)) {
                                returnValue = false;
                                return false;
                            }
                        });
                        return returnValue;
                    },

                    filter: function(predicate, context) {
                        return reify(this, filterFactory(this, predicate, context, true));
                    },

                    find: function(predicate, context, notSetValue) {
                        var entry = this.findEntry(predicate, context);
                        return entry ? entry[1] : notSetValue;
                    },

                    findEntry: function(predicate, context) {
                        var found;
                        this.__iterate(function(v, k, c) {
                            if (predicate.call(context, v, k, c)) {
                                found = [k, v];
                                return false;
                            }
                        });
                        return found;
                    },

                    findLastEntry: function(predicate, context) {
                        return this.toSeq()
                            .reverse()
                            .findEntry(predicate, context);
                    },

                    forEach: function(sideEffect, context) {
                        assertNotInfinite(this.size);
                        return this.__iterate(context ? sideEffect.bind(context) : sideEffect);
                    },

                    join: function(separator) {
                        assertNotInfinite(this.size);
                        separator = separator !== undefined ? '' + separator : ',';
                        var joined = '';
                        var isFirst = true;
                        this.__iterate(function(v) {
                            isFirst ? (isFirst = false) : (joined += separator);
                            joined += v !== null && v !== undefined ? v.toString() : '';
                        });
                        return joined;
                    },

                    keys: function() {
                        return this.__iterator(ITERATE_KEYS);
                    },

                    map: function(mapper, context) {
                        return reify(this, mapFactory(this, mapper, context));
                    },

                    reduce: function(reducer, initialReduction, context) {
                        assertNotInfinite(this.size);
                        var reduction;
                        var useFirst;
                        if (arguments.length < 2) {
                            useFirst = true;
                        }
                        else {
                            reduction = initialReduction;
                        }
                        this.__iterate(function(v, k, c) {
                            if (useFirst) {
                                useFirst = false;
                                reduction = v;
                            }
                            else {
                                reduction = reducer.call(context, reduction, v, k, c);
                            }
                        });
                        return reduction;
                    },

                    reduceRight: function(reducer, initialReduction, context) {
                        var reversed = this.toKeyedSeq()
                            .reverse();
                        return reversed.reduce.apply(reversed, arguments);
                    },

                    reverse: function() {
                        return reify(this, reverseFactory(this, true));
                    },

                    slice: function(begin, end) {
                        return reify(this, sliceFactory(this, begin, end, true));
                    },

                    some: function(predicate, context) {
                        return !this.every(not(predicate), context);
                    },

                    sort: function(comparator) {
                        return reify(this, sortFactory(this, comparator));
                    },

                    values: function() {
                        return this.__iterator(ITERATE_VALUES);
                    },


                    // ### More sequential methods

                    butLast: function() {
                        return this.slice(0, -1);
                    },

                    isEmpty: function() {
                        return this.size !== undefined ? this.size === 0 : !this.some(function() {
                            return true
                        });
                    },

                    count: function(predicate, context) {
                        return ensureSize(
                            predicate ? this.toSeq()
                            .filter(predicate, context) : this
                        );
                    },

                    countBy: function(grouper, context) {
                        return countByFactory(this, grouper, context);
                    },

                    equals: function(other) {
                        return deepEqual(this, other);
                    },

                    entrySeq: function() {
                        var iterable = this;
                        if (iterable._cache) {
                            // We cache as an entries array, so we can just return the cache!
                            return new ArraySeq(iterable._cache);
                        }
                        var entriesSequence = iterable.toSeq()
                            .map(entryMapper)
                            .toIndexedSeq();
                        entriesSequence.fromEntrySeq = function() {
                            return iterable.toSeq()
                        };
                        return entriesSequence;
                    },

                    filterNot: function(predicate, context) {
                        return this.filter(not(predicate), context);
                    },

                    findLast: function(predicate, context, notSetValue) {
                        return this.toKeyedSeq()
                            .reverse()
                            .find(predicate, context, notSetValue);
                    },

                    first: function() {
                        return this.find(returnTrue);
                    },

                    flatMap: function(mapper, context) {
                        return reify(this, flatMapFactory(this, mapper, context));
                    },

                    flatten: function(depth) {
                        return reify(this, flattenFactory(this, depth, true));
                    },

                    fromEntrySeq: function() {
                        return new FromEntriesSequence(this);
                    },

                    get: function(searchKey, notSetValue) {
                        return this.find(function(_, key) {
                            return is(key, searchKey)
                        }, undefined, notSetValue);
                    },

                    getIn: function(searchKeyPath, notSetValue) {
                        var nested = this;
                        // Note: in an ES6 environment, we would prefer:
                        // for (var key of searchKeyPath) {
                        var iter = forceIterator(searchKeyPath);
                        var step;
                        while (!(step = iter.next())
                            .done) {
                            var key = step.value;
                            nested = nested && nested.get ? nested.get(key, NOT_SET) : NOT_SET;
                            if (nested === NOT_SET) {
                                return notSetValue;
                            }
                        }
                        return nested;
                    },

                    groupBy: function(grouper, context) {
                        return groupByFactory(this, grouper, context);
                    },

                    has: function(searchKey) {
                        return this.get(searchKey, NOT_SET) !== NOT_SET;
                    },

                    hasIn: function(searchKeyPath) {
                        return this.getIn(searchKeyPath, NOT_SET) !== NOT_SET;
                    },

                    isSubset: function(iter) {
                        iter = typeof iter.contains === 'function' ? iter : Iterable(iter);
                        return this.every(function(value) {
                            return iter.contains(value)
                        });
                    },

                    isSuperset: function(iter) {
                        return iter.isSubset(this);
                    },

                    keySeq: function() {
                        return this.toSeq()
                            .map(keyMapper)
                            .toIndexedSeq();
                    },

                    last: function() {
                        return this.toSeq()
                            .reverse()
                            .first();
                    },

                    max: function(comparator) {
                        return maxFactory(this, comparator);
                    },

                    maxBy: function(mapper, comparator) {
                        return maxFactory(this, comparator, mapper);
                    },

                    min: function(comparator) {
                        return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator);
                    },

                    minBy: function(mapper, comparator) {
                        return maxFactory(this, comparator ? neg(comparator) : defaultNegComparator, mapper);
                    },

                    rest: function() {
                        return this.slice(1);
                    },

                    skip: function(amount) {
                        return this.slice(Math.max(0, amount));
                    },

                    skipLast: function(amount) {
                        return reify(this, this.toSeq()
                            .reverse()
                            .skip(amount)
                            .reverse());
                    },

                    skipWhile: function(predicate, context) {
                        return reify(this, skipWhileFactory(this, predicate, context, true));
                    },

                    skipUntil: function(predicate, context) {
                        return this.skipWhile(not(predicate), context);
                    },

                    sortBy: function(mapper, comparator) {
                        return reify(this, sortFactory(this, comparator, mapper));
                    },

                    take: function(amount) {
                        return this.slice(0, Math.max(0, amount));
                    },

                    takeLast: function(amount) {
                        return reify(this, this.toSeq()
                            .reverse()
                            .take(amount)
                            .reverse());
                    },

                    takeWhile: function(predicate, context) {
                        return reify(this, takeWhileFactory(this, predicate, context));
                    },

                    takeUntil: function(predicate, context) {
                        return this.takeWhile(not(predicate), context);
                    },

                    valueSeq: function() {
                        return this.toIndexedSeq();
                    },


                    // ### Hashable Object

                    hashCode: function() {
                        return this.__hash || (this.__hash = hashIterable(this));
                    },


                    // ### Internal

                    // abstract __iterate(fn, reverse)

                    // abstract __iterator(type, reverse)
                });

                // var IS_ITERABLE_SENTINEL = '@@__IMMUTABLE_ITERABLE__@@';
                // var IS_KEYED_SENTINEL = '@@__IMMUTABLE_KEYED__@@';
                // var IS_INDEXED_SENTINEL = '@@__IMMUTABLE_INDEXED__@@';
                // var IS_ORDERED_SENTINEL = '@@__IMMUTABLE_ORDERED__@@';

                var IterablePrototype = Iterable.prototype;
                IterablePrototype[IS_ITERABLE_SENTINEL] = true;
                IterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.values;
                IterablePrototype.__toJS = IterablePrototype.toArray;
                IterablePrototype.__toStringMapper = quoteString;
                IterablePrototype.inspect =
                    IterablePrototype.toSource = function() {
                        return this.toString();
                    };
                IterablePrototype.chain = IterablePrototype.flatMap;

                // Temporary warning about using length
                (function() {
                    try {
                        Object.defineProperty(IterablePrototype, 'length', {
                            get: function() {
                                if (!Iterable.noLengthWarning) {
                                    var stack;
                                    try {
                                        throw new Error();
                                    }
                                    catch (error) {
                                        stack = error.stack;
                                    }
                                    if (stack.indexOf('_wrapObject') === -1) {
                                        console && console.warn && console.warn(
                                            'iterable.length has been deprecated, ' +
                                            'use iterable.size or iterable.count(). ' +
                                            'This warning will become a silent error in a future version. ' +
                                            stack
                                        );
                                        return this.size;
                                    }
                                }
                            }
                        });
                    }
                    catch (e) {}
                })();



                mixin(KeyedIterable, {

                    // ### More sequential methods

                    flip: function() {
                        return reify(this, flipFactory(this));
                    },

                    findKey: function(predicate, context) {
                        var entry = this.findEntry(predicate, context);
                        return entry && entry[0];
                    },

                    findLastKey: function(predicate, context) {
                        return this.toSeq()
                            .reverse()
                            .findKey(predicate, context);
                    },

                    keyOf: function(searchValue) {
                        return this.findKey(function(value) {
                            return is(value, searchValue)
                        });
                    },

                    lastKeyOf: function(searchValue) {
                        return this.findLastKey(function(value) {
                            return is(value, searchValue)
                        });
                    },

                    mapEntries: function(mapper, context) {
                        var this$0 = this;
                        var iterations = 0;
                        return reify(this,
                            this.toSeq()
                            .map(
                                function(v, k) {
                                    return mapper.call(context, [k, v], iterations++, this$0)
                                }
                            )
                            .fromEntrySeq()
                        );
                    },

                    mapKeys: function(mapper, context) {
                        var this$0 = this;
                        return reify(this,
                            this.toSeq()
                            .flip()
                            .map(
                                function(k, v) {
                                    return mapper.call(context, k, v, this$0)
                                }
                            )
                            .flip()
                        );
                    },

                });

                var KeyedIterablePrototype = KeyedIterable.prototype;
                KeyedIterablePrototype[IS_KEYED_SENTINEL] = true;
                KeyedIterablePrototype[ITERATOR_SYMBOL] = IterablePrototype.entries;
                KeyedIterablePrototype.__toJS = IterablePrototype.toObject;
                KeyedIterablePrototype.__toStringMapper = function(v, k) {
                    return k + ': ' + quoteString(v)
                };



                mixin(IndexedIterable, {

                    // ### Conversion to other types

                    toKeyedSeq: function() {
                        return new ToKeyedSequence(this, false);
                    },


                    // ### ES6 Collection methods (ES6 Array and Map)

                    filter: function(predicate, context) {
                        return reify(this, filterFactory(this, predicate, context, false));
                    },

                    findIndex: function(predicate, context) {
                        var entry = this.findEntry(predicate, context);
                        return entry ? entry[0] : -1;
                    },

                    indexOf: function(searchValue) {
                        var key = this.toKeyedSeq()
                            .keyOf(searchValue);
                        return key === undefined ? -1 : key;
                    },

                    lastIndexOf: function(searchValue) {
                        return this.toSeq()
                            .reverse()
                            .indexOf(searchValue);
                    },

                    reverse: function() {
                        return reify(this, reverseFactory(this, false));
                    },

                    slice: function(begin, end) {
                        return reify(this, sliceFactory(this, begin, end, false));
                    },

                    splice: function(index, removeNum /*, ...values*/ ) {
                        var numArgs = arguments.length;
                        removeNum = Math.max(removeNum | 0, 0);
                        if (numArgs === 0 || (numArgs === 2 && !removeNum)) {
                            return this;
                        }
                        index = resolveBegin(index, this.size);
                        var spliced = this.slice(0, index);
                        return reify(
                            this,
                            numArgs === 1 ?
                            spliced :
                            spliced.concat(arrCopy(arguments, 2), this.slice(index + removeNum))
                        );
                    },


                    // ### More collection methods

                    findLastIndex: function(predicate, context) {
                        var key = this.toKeyedSeq()
                            .findLastKey(predicate, context);
                        return key === undefined ? -1 : key;
                    },

                    first: function() {
                        return this.get(0);
                    },

                    flatten: function(depth) {
                        return reify(this, flattenFactory(this, depth, false));
                    },

                    get: function(index, notSetValue) {
                        index = wrapIndex(this, index);
                        return (index < 0 || (this.size === Infinity ||
                                (this.size !== undefined && index > this.size))) ?
                            notSetValue :
                            this.find(function(_, key) {
                                return key === index
                            }, undefined, notSetValue);
                    },

                    has: function(index) {
                        index = wrapIndex(this, index);
                        return index >= 0 && (this.size !== undefined ?
                            this.size === Infinity || index < this.size :
                            this.indexOf(index) !== -1
                        );
                    },

                    interpose: function(separator) {
                        return reify(this, interposeFactory(this, separator));
                    },

                    interleave: function( /*...iterables*/ ) {
                        var iterables = [this].concat(arrCopy(arguments));
                        var zipped = zipWithFactory(this.toSeq(), IndexedSeq.of, iterables);
                        var interleaved = zipped.flatten(true);
                        if (zipped.size) {
                            interleaved.size = zipped.size * iterables.length;
                        }
                        return reify(this, interleaved);
                    },

                    last: function() {
                        return this.get(-1);
                    },

                    skipWhile: function(predicate, context) {
                        return reify(this, skipWhileFactory(this, predicate, context, false));
                    },

                    zip: function( /*, ...iterables */ ) {
                        var iterables = [this].concat(arrCopy(arguments));
                        return reify(this, zipWithFactory(this, defaultZipper, iterables));
                    },

                    zipWith: function(zipper /*, ...iterables */ ) {
                        var iterables = arrCopy(arguments);
                        iterables[0] = this;
                        return reify(this, zipWithFactory(this, zipper, iterables));
                    },

                });

                IndexedIterable.prototype[IS_INDEXED_SENTINEL] = true;
                IndexedIterable.prototype[IS_ORDERED_SENTINEL] = true;



                mixin(SetIterable, {

                    // ### ES6 Collection methods (ES6 Array and Map)

                    get: function(value, notSetValue) {
                        return this.has(value) ? value : notSetValue;
                    },

                    contains: function(value) {
                        return this.has(value);
                    },


                    // ### More sequential methods

                    keySeq: function() {
                        return this.valueSeq();
                    },

                });

                SetIterable.prototype.has = IterablePrototype.contains;


                // Mixin subclasses

                mixin(KeyedSeq, KeyedIterable.prototype);
                mixin(IndexedSeq, IndexedIterable.prototype);
                mixin(SetSeq, SetIterable.prototype);

                mixin(KeyedCollection, KeyedIterable.prototype);
                mixin(IndexedCollection, IndexedIterable.prototype);
                mixin(SetCollection, SetIterable.prototype);


                // #pragma Helper functions

                function keyMapper(v, k) {
                    return k;
                }

                function entryMapper(v, k) {
                    return [k, v];
                }

                function not(predicate) {
                    return function() {
                        return !predicate.apply(this, arguments);
                    }
                }

                function neg(predicate) {
                    return function() {
                        return -predicate.apply(this, arguments);
                    }
                }

                function quoteString(value) {
                    return typeof value === 'string' ? JSON.stringify(value) : value;
                }

                function defaultZipper() {
                    return arrCopy(arguments);
                }

                function defaultNegComparator(a, b) {
                    return a < b ? 1 : a > b ? -1 : 0;
                }

                function hashIterable(iterable) {
                    if (iterable.size === Infinity) {
                        return 0;
                    }
                    var ordered = isOrdered(iterable);
                    var keyed = isKeyed(iterable);
                    var h = ordered ? 1 : 0;
                    var size = iterable.__iterate(
                        keyed ?
                        ordered ?
                        function(v, k) {
                            h = 31 * h + hashMerge(hash(v), hash(k)) | 0;
                        } :
                        function(v, k) {
                            h = h + hashMerge(hash(v), hash(k)) | 0;
                        } :
                        ordered ?
                        function(v) {
                            h = 31 * h + hash(v) | 0;
                        } :
                        function(v) {
                            h = h + hash(v) | 0;
                        }
                    );
                    return murmurHashOfSize(size, h);
                }

                function murmurHashOfSize(size, h) {
                    h = src_Math__imul(h, 0xCC9E2D51);
                    h = src_Math__imul(h << 15 | h >>> -15, 0x1B873593);
                    h = src_Math__imul(h << 13 | h >>> -13, 5);
                    h = (h + 0xE6546B64 | 0) ^ size;
                    h = src_Math__imul(h ^ h >>> 16, 0x85EBCA6B);
                    h = src_Math__imul(h ^ h >>> 13, 0xC2B2AE35);
                    h = smi(h ^ h >>> 16);
                    return h;
                }

                function hashMerge(a, b) {
                    return a ^ b + 0x9E3779B9 + (a << 6) + (a >> 2) | 0; // int
                }

                var Immutable = {

                    Iterable: Iterable,

                    Seq: Seq,
                    Collection: Collection,
                    Map: src_Map__Map,
                    OrderedMap: OrderedMap,
                    List: List,
                    Stack: Stack,
                    Set: src_Set__Set,
                    OrderedSet: OrderedSet,

                    Record: Record,
                    Range: Range,
                    Repeat: Repeat,

                    is: is,
                    fromJS: fromJS,

                };

                return Immutable;

            }));
}, {}],
        2: [function(require, module, exports) {
            var baseFlatten = require('../internal/baseFlatten'),
                isIterateeCall = require('../internal/isIterateeCall');

            function flatten(array, isDeep, guard) {
                var length = array ? array.length : 0;
                if (guard && isIterateeCall(array, isDeep, guard)) {
                    isDeep = false;
                }
                return length ? baseFlatten(array, isDeep, false, 0) : [];
            }
            module.exports = flatten;
}, {
            "../internal/baseFlatten": 11,
            "../internal/isIterateeCall": 20
        }],
        3: [function(require, module, exports) {
            var undefined;

            function last(array) {
                var length = array ? array.length : 0;
                return length ? array[length - 1] : undefined;
            }
            module.exports = last;
}, {}],
        4: [function(require, module, exports) {
            var baseIndexOf = require('../internal/baseIndexOf');
            var arrayProto = Array.prototype;
            var splice = arrayProto.splice;

            function pull() {
                var args = arguments,
                    array = args[0];
                if (!(array && array.length)) {
                    return array;
                }
                var index = 0,
                    indexOf = baseIndexOf,
                    length = args.length;
                while (++index < length) {
                    var fromIndex = 0,
                        value = args[index];
                    while ((fromIndex = indexOf(array, value, fromIndex)) > -1) {
                        splice.call(array, fromIndex, 1);
                    }
                }
                return array;
            }
            module.exports = pull;
}, {
            "../internal/baseIndexOf": 12
        }],
        5: [function(require, module, exports) {
            var includes = require('./includes');
            module.exports = includes;
}, {
            "./includes": 6
        }],
        6: [function(require, module, exports) {
            var baseIndexOf = require('../internal/baseIndexOf'),
                isArray = require('../lang/isArray'),
                isLength = require('../internal/isLength'),
                isString = require('../lang/isString'),
                values = require('../object/values');
            var nativeMax = Math.max;

            function includes(collection, target, fromIndex) {
                var length = collection ? collection.length : 0;
                if (!isLength(length)) {
                    collection = values(collection);
                    length = collection.length;
                }
                if (!length) {
                    return false;
                }
                if (typeof fromIndex == 'number') {
                    fromIndex = fromIndex < 0 ? nativeMax(length + fromIndex, 0) : fromIndex || 0;
                }
                else {
                    fromIndex = 0;
                }
                return typeof collection == 'string' || !isArray(collection) && isString(collection) ? fromIndex < length && collection.indexOf(target, fromIndex) > -1 : baseIndexOf(collection, target, fromIndex) > -1;
            }
            module.exports = includes;
}, {
            "../internal/baseIndexOf": 12,
            "../internal/isLength": 21,
            "../lang/isArray": 26,
            "../lang/isString": 29,
            "../object/values": 35
        }],
        7: [function(require, module, exports) {
            function arrayCopy(source, array) {
                var index = -1,
                    length = source.length;
                array || (array = Array(length));
                while (++index < length) {
                    array[index] = source[index];
                }
                return array;
            }
            module.exports = arrayCopy;
}, {}],
        8: [function(require, module, exports) {
            function assignDefaults(objectValue, sourceValue) {
                return typeof objectValue == 'undefined' ? sourceValue : objectValue;
            }
            module.exports = assignDefaults;
}, {}],
        9: [function(require, module, exports) {
            var baseCopy = require('./baseCopy'),
                keys = require('../object/keys');

            function baseAssign(object, source, customizer) {
                var props = keys(source);
                if (!customizer) {
                    return baseCopy(source, object, props);
                }
                var index = -1,
                    length = props.length;
                while (++index < length) {
                    var key = props[index],
                        value = object[key],
                        result = customizer(value, source[key], key, object, source);
                    if ((result === result ? result !== value : value === value) || typeof value == 'undefined' && !(key in object)) {
                        object[key] = result;
                    }
                }
                return object;
            }
            module.exports = baseAssign;
}, {
            "../object/keys": 33,
            "./baseCopy": 10
        }],
        10: [function(require, module, exports) {
            function baseCopy(source, object, props) {
                if (!props) {
                    props = object;
                    object = {};
                }
                var index = -1,
                    length = props.length;
                while (++index < length) {
                    var key = props[index];
                    object[key] = source[key];
                }
                return object;
            }
            module.exports = baseCopy;
}, {}],
        11: [function(require, module, exports) {
            var isArguments = require('../lang/isArguments'),
                isArray = require('../lang/isArray'),
                isLength = require('./isLength'),
                isObjectLike = require('./isObjectLike');

            function baseFlatten(array, isDeep, isStrict, fromIndex) {
                var index = fromIndex - 1,
                    length = array.length,
                    resIndex = -1,
                    result = [];
                while (++index < length) {
                    var value = array[index];
                    if (isObjectLike(value) && isLength(value.length) && (isArray(value) || isArguments(value))) {
                        if (isDeep) {
                            value = baseFlatten(value, isDeep, isStrict, 0);
                        }
                        var valIndex = -1,
                            valLength = value.length;
                        result.length += valLength;
                        while (++valIndex < valLength) {
                            result[++resIndex] = value[valIndex];
                        }
                    }
                    else if (!isStrict) {
                        result[++resIndex] = value;
                    }
                }
                return result;
            }
            module.exports = baseFlatten;
}, {
            "../lang/isArguments": 25,
            "../lang/isArray": 26,
            "./isLength": 21,
            "./isObjectLike": 22
        }],
        12: [function(require, module, exports) {
            var indexOfNaN = require('./indexOfNaN');

            function baseIndexOf(array, value, fromIndex) {
                if (value !== value) {
                    return indexOfNaN(array, fromIndex);
                }
                var index = fromIndex - 1,
                    length = array.length;
                while (++index < length) {
                    if (array[index] === value) {
                        return index;
                    }
                }
                return -1;
            }
            module.exports = baseIndexOf;
}, {
            "./indexOfNaN": 18
        }],
        13: [function(require, module, exports) {
            function baseToString(value) {
                if (typeof value == 'string') {
                    return value;
                }
                return value == null ? '' : value + '';
            }
            module.exports = baseToString;
}, {}],
        14: [function(require, module, exports) {
            function baseValues(object, props) {
                var index = -1,
                    length = props.length,
                    result = Array(length);
                while (++index < length) {
                    result[index] = object[props[index]];
                }
                return result;
            }
            module.exports = baseValues;
}, {}],
        15: [function(require, module, exports) {
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
                        return function(value) {
                            return func.call(thisArg, value);
                        };
                    case 3:
                        return function(value, index, collection) {
                            return func.call(thisArg, value, index, collection);
                        };
                    case 4:
                        return function(accumulator, value, index, collection) {
                            return func.call(thisArg, accumulator, value, index, collection);
                        };
                    case 5:
                        return function(value, other, key, object, source) {
                            return func.call(thisArg, value, other, key, object, source);
                        };
                }
                return function() {
                    return func.apply(thisArg, arguments);
                };
            }
            module.exports = bindCallback;
}, {
            "../utility/identity": 39
        }],
        16: [function(require, module, exports) {
            var bindCallback = require('./bindCallback'),
                isIterateeCall = require('./isIterateeCall');

            function createAssigner(assigner) {
                return function() {
                    var args = arguments,
                        length = args.length,
                        object = args[0];
                    if (length < 2 || object == null) {
                        return object;
                    }
                    var customizer = args[length - 2],
                        thisArg = args[length - 1],
                        guard = args[3];
                    if (length > 3 && typeof customizer == 'function') {
                        customizer = bindCallback(customizer, thisArg, 5);
                        length -= 2;
                    }
                    else {
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
}, {
            "./bindCallback": 15,
            "./isIterateeCall": 20
        }],
        17: [function(require, module, exports) {
            var htmlEscapes = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                '\'': '&#39;',
                '`': '&#96;'
            };

            function escapeHtmlChar(chr) {
                return htmlEscapes[chr];
            }
            module.exports = escapeHtmlChar;
}, {}],
        18: [function(require, module, exports) {
            function indexOfNaN(array, fromIndex, fromRight) {
                var length = array.length,
                    index = fromIndex + (fromRight ? 0 : -1);
                while (fromRight ? index-- : ++index < length) {
                    var other = array[index];
                    if (other !== other) {
                        return index;
                    }
                }
                return -1;
            }
            module.exports = indexOfNaN;
}, {}],
        19: [function(require, module, exports) {
            var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

            function isIndex(value, length) {
                value = +value;
                length = length == null ? MAX_SAFE_INTEGER : length;
                return value > -1 && value % 1 == 0 && value < length;
            }
            module.exports = isIndex;
}, {}],
        20: [function(require, module, exports) {
            var isIndex = require('./isIndex'),
                isLength = require('./isLength'),
                isObject = require('../lang/isObject');

            function isIterateeCall(value, index, object) {
                if (!isObject(object)) {
                    return false;
                }
                var type = typeof index;
                if (type == 'number') {
                    var length = object.length,
                        prereq = isLength(length) && isIndex(index, length);
                }
                else {
                    prereq = type == 'string' && index in object;
                }
                if (prereq) {
                    var other = object[index];
                    return value === value ? value === other : other !== other;
                }
                return false;
            }
            module.exports = isIterateeCall;
}, {
            "../lang/isObject": 28,
            "./isIndex": 19,
            "./isLength": 21
        }],
        21: [function(require, module, exports) {
            var MAX_SAFE_INTEGER = Math.pow(2, 53) - 1;

            function isLength(value) {
                return typeof value == 'number' && value > -1 && value % 1 == 0 && value <= MAX_SAFE_INTEGER;
            }
            module.exports = isLength;
}, {}],
        22: [function(require, module, exports) {
            function isObjectLike(value) {
                return value && typeof value == 'object' || false;
            }
            module.exports = isObjectLike;
}, {}],
        23: [function(require, module, exports) {
            (function(global) {
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
            })
            .call(this, typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
}, {}],
        24: [function(require, module, exports) {
            var isArguments = require('../lang/isArguments'),
                isArray = require('../lang/isArray'),
                isIndex = require('./isIndex'),
                isLength = require('./isLength'),
                keysIn = require('../object/keysIn'),
                support = require('../support');
            var objectProto = Object.prototype;
            var hasOwnProperty = objectProto.hasOwnProperty;

            function shimKeys(object) {
                var props = keysIn(object),
                    propsLength = props.length,
                    length = propsLength && object.length;
                var allowIndexes = length && isLength(length) && (isArray(object) || support.nonEnumArgs && isArguments(object));
                var index = -1,
                    result = [];
                while (++index < propsLength) {
                    var key = props[index];
                    if (allowIndexes && isIndex(key, length) || hasOwnProperty.call(object, key)) {
                        result.push(key);
                    }
                }
                return result;
            }
            module.exports = shimKeys;
}, {
            "../lang/isArguments": 25,
            "../lang/isArray": 26,
            "../object/keysIn": 34,
            "../support": 38,
            "./isIndex": 19,
            "./isLength": 21
        }],
        25: [function(require, module, exports) {
            var isLength = require('../internal/isLength'),
                isObjectLike = require('../internal/isObjectLike');
            var undefined;
            var argsTag = '[object Arguments]';
            var objectProto = Object.prototype;
            var objToString = objectProto.toString;

            function isArguments(value) {
                var length = isObjectLike(value) ? value.length : undefined;
                return isLength(length) && objToString.call(value) == argsTag || false;
            }
            module.exports = isArguments;
}, {
            "../internal/isLength": 21,
            "../internal/isObjectLike": 22
        }],
        26: [function(require, module, exports) {
            var isLength = require('../internal/isLength'),
                isNative = require('./isNative'),
                isObjectLike = require('../internal/isObjectLike');
            var arrayTag = '[object Array]';
            var objectProto = Object.prototype;
            var objToString = objectProto.toString;
            var nativeIsArray = isNative(nativeIsArray = Array.isArray) && nativeIsArray;
            var isArray = nativeIsArray || function(value) {
                return isObjectLike(value) && isLength(value.length) && objToString.call(value) == arrayTag || false;
            };
            module.exports = isArray;
}, {
            "../internal/isLength": 21,
            "../internal/isObjectLike": 22,
            "./isNative": 27
        }],
        27: [function(require, module, exports) {
            var escapeRegExp = require('../string/escapeRegExp'),
                isObjectLike = require('../internal/isObjectLike');
            var funcTag = '[object Function]';
            var reHostCtor = /^\[object .+?Constructor\]$/;
            var objectProto = Object.prototype;
            var fnToString = Function.prototype.toString;
            var objToString = objectProto.toString;
            var reNative = RegExp('^' + escapeRegExp(objToString)
                .replace(/toString|(function).*?(?=\\\()| for .+?(?=\\\])/g, '$1.*?') + '$');

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
}, {
            "../internal/isObjectLike": 22,
            "../string/escapeRegExp": 37
        }],
        28: [function(require, module, exports) {
            function isObject(value) {
                var type = typeof value;
                return type == 'function' || value && type == 'object' || false;
            }
            module.exports = isObject;
}, {}],
        29: [function(require, module, exports) {
            var isObjectLike = require('../internal/isObjectLike');
            var stringTag = '[object String]';
            var objectProto = Object.prototype;
            var objToString = objectProto.toString;

            function isString(value) {
                return typeof value == 'string' || isObjectLike(value) && objToString.call(value) == stringTag || false;
            }
            module.exports = isString;
}, {
            "../internal/isObjectLike": 22
        }],
        30: [function(require, module, exports) {
            var arrayCopy = require('../internal/arrayCopy'),
                isLength = require('../internal/isLength'),
                values = require('../object/values');

            function toArray(value) {
                var length = value ? value.length : 0;
                if (!isLength(length)) {
                    return values(value);
                }
                if (!length) {
                    return [];
                }
                return arrayCopy(value);
            }
            module.exports = toArray;
}, {
            "../internal/arrayCopy": 7,
            "../internal/isLength": 21,
            "../object/values": 35
        }],
        31: [function(require, module, exports) {
            var baseAssign = require('../internal/baseAssign'),
                createAssigner = require('../internal/createAssigner');
            var assign = createAssigner(baseAssign);
            module.exports = assign;
}, {
            "../internal/baseAssign": 9,
            "../internal/createAssigner": 16
        }],
        32: [function(require, module, exports) {
            var arrayCopy = require('../internal/arrayCopy'),
                assign = require('./assign'),
                assignDefaults = require('../internal/assignDefaults');
            var undefined;

            function defaults(object) {
                if (object == null) {
                    return object;
                }
                var args = arrayCopy(arguments);
                args.push(assignDefaults);
                return assign.apply(undefined, args);
            }
            module.exports = defaults;
}, {
            "../internal/arrayCopy": 7,
            "../internal/assignDefaults": 8,
            "./assign": 31
        }],
        33: [function(require, module, exports) {
            var isLength = require('../internal/isLength'),
                isNative = require('../lang/isNative'),
                isObject = require('../lang/isObject'),
                shimKeys = require('../internal/shimKeys');
            var nativeKeys = isNative(nativeKeys = Object.keys) && nativeKeys;
            var keys = !nativeKeys ? shimKeys : function(object) {
                if (object) {
                    var Ctor = object.constructor,
                        length = object.length;
                }
                if (typeof Ctor == 'function' && Ctor.prototype === object || typeof object != 'function' && (length && isLength(length))) {
                    return shimKeys(object);
                }
                return isObject(object) ? nativeKeys(object) : [];
            };
            module.exports = keys;
}, {
            "../internal/isLength": 21,
            "../internal/shimKeys": 24,
            "../lang/isNative": 27,
            "../lang/isObject": 28
        }],
        34: [function(require, module, exports) {
            var isArguments = require('../lang/isArguments'),
                isArray = require('../lang/isArray'),
                isIndex = require('../internal/isIndex'),
                isLength = require('../internal/isLength'),
                isObject = require('../lang/isObject'),
                support = require('../support');
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
                var Ctor = object.constructor,
                    index = -1,
                    isProto = typeof Ctor == 'function' && Ctor.prototype === object,
                    result = Array(length),
                    skipIndexes = length > 0;
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
}, {
            "../internal/isIndex": 19,
            "../internal/isLength": 21,
            "../lang/isArguments": 25,
            "../lang/isArray": 26,
            "../lang/isObject": 28,
            "../support": 38
        }],
        35: [function(require, module, exports) {
            var baseValues = require('../internal/baseValues'),
                keys = require('./keys');

            function values(object) {
                return baseValues(object, keys(object));
            }
            module.exports = values;
}, {
            "../internal/baseValues": 14,
            "./keys": 33
        }],
        36: [function(require, module, exports) {
            var baseToString = require('../internal/baseToString'),
                escapeHtmlChar = require('../internal/escapeHtmlChar');
            var reUnescapedHtml = /[&<>"'`]/g,
                reHasUnescapedHtml = RegExp(reUnescapedHtml.source);

            function escape(string) {
                string = baseToString(string);
                return string && reHasUnescapedHtml.test(string) ? string.replace(reUnescapedHtml, escapeHtmlChar) : string;
            }
            module.exports = escape;
}, {
            "../internal/baseToString": 13,
            "../internal/escapeHtmlChar": 17
        }],
        37: [function(require, module, exports) {
            var baseToString = require('../internal/baseToString');
            var reRegExpChars = /[.*+?^${}()|[\]\/\\]/g,
                reHasRegExpChars = RegExp(reRegExpChars.source);

            function escapeRegExp(string) {
                string = baseToString(string);
                return string && reHasRegExpChars.test(string) ? string.replace(reRegExpChars, '\\$&') : string;
            }
            module.exports = escapeRegExp;
}, {
            "../internal/baseToString": 13
        }],
        38: [function(require, module, exports) {
            var isNative = require('./lang/isNative'),
                root = require('./internal/root');
            var reThis = /\bthis\b/;
            var objectProto = Object.prototype;
            var document = (document = root.window) && document.document;
            var propertyIsEnumerable = objectProto.propertyIsEnumerable;
            var support = {};
            (function(x) {
                support.funcDecomp = !isNative(root.WinRTError) && reThis.test(function() {
                    return this;
                });
                support.funcNames = typeof Function.name == 'string';
                try {
                    support.dom = document.createDocumentFragment()
                        .nodeType === 11;
                }
                catch (e) {
                    support.dom = false;
                }
                try {
                    support.nonEnumArgs = !propertyIsEnumerable.call(arguments, 1);
                }
                catch (e) {
                    support.nonEnumArgs = true;
                }
            }(0, 0));
            module.exports = support;
}, {
            "./internal/root": 23,
            "./lang/isNative": 27
        }],
        39: [function(require, module, exports) {
            function identity(value) {
                return value;
            }
            module.exports = identity;
}, {}],
        40: [function(require, module, exports) {
            var buildCommandPatch = require('./api/command-patch'),
                buildCommand = require('./api/command'),
                Node = require('./api/node'),
                buildSelection = require('./api/selection'),
                buildSimpleCommand = require('./api/simple-command');
            'use strict';
            module.exports = function Api(scribe) {
                this.CommandPatch = buildCommandPatch(scribe);
                this.Command = buildCommand(scribe);
                this.Node = Node;
                this.Selection = buildSelection(scribe);
                this.SimpleCommand = buildSimpleCommand(this, scribe);
            };
}, {
            "./api/command": 42,
            "./api/command-patch": 41,
            "./api/node": 43,
            "./api/selection": 44,
            "./api/simple-command": 45
        }],
        41: [function(require, module, exports) {
            'use strict';
            module.exports = function(scribe) {
                function CommandPatch(commandName) {
                    this.commandName = commandName;
                }
                CommandPatch.prototype.execute = function(value) {
                    scribe.transactionManager.run(function() {
                        document.execCommand(this.commandName, false, value || null);
                    }.bind(this));
                };
                CommandPatch.prototype.queryState = function() {
                    return document.queryCommandState(this.commandName);
                };
                CommandPatch.prototype.queryEnabled = function() {
                    return document.queryCommandEnabled(this.commandName);
                };
                return CommandPatch;
            };
}, {}],
        42: [function(require, module, exports) {
            'use strict';
            module.exports = function(scribe) {
                function Command(commandName) {
                    this.commandName = commandName;
                    this.patch = scribe.commandPatches[this.commandName];
                }
                Command.prototype.execute = function(value) {
                    if (this.patch) {
                        this.patch.execute(value);
                    }
                    else {
                        scribe.transactionManager.run(function() {
                            document.execCommand(this.commandName, false, value || null);
                        }.bind(this));
                    }
                };
                Command.prototype.queryState = function() {
                    if (this.patch) {
                        return this.patch.queryState();
                    }
                    else {
                        return document.queryCommandState(this.commandName);
                    }
                };
                Command.prototype.queryEnabled = function() {
                    if (this.patch) {
                        return this.patch.queryEnabled();
                    }
                    else {
                        return document.queryCommandEnabled(this.commandName);
                    }
                };
                return Command;
            };
}, {}],
        43: [function(require, module, exports) {
            'use strict';

            function Node(node) {
                this.node = node;
            }
            Node.prototype.getAncestor = function(rootElement, nodeFilter) {
                var isTopContainerElement = function(element) {
                    return rootElement === element;
                };
                if (isTopContainerElement(this.node)) {
                    return;
                }
                var currentNode = this.node.parentNode;
                while (currentNode && !isTopContainerElement(currentNode)) {
                    if (nodeFilter(currentNode)) {
                        return currentNode;
                    }
                    currentNode = currentNode.parentNode;
                }
            };
            Node.prototype.nextAll = function() {
                var all = [];
                var el = this.node.nextSibling;
                while (el) {
                    all.push(el);
                    el = el.nextSibling;
                }
                return all;
            };
            module.exports = Node;
}, {}],
        44: [function(require, module, exports) {
            var elementHelper = require('../element');
            'use strict';
            module.exports = function(scribe) {
                function Selection() {
                    var rootDoc = document;
                    var currentElement = scribe.el.parentNode;
                    while (currentElement && currentElement.nodeType !== Node.DOCUMENT_FRAGMENT_NODE && currentElement.nodeType !== Node.DOCUMENT_NODE) {
                        currentElement = currentElement.parentNode;
                    }
                    if (currentElement && currentElement.nodeType === Node.DOCUMENT_FRAGMENT_NODE && currentElement.getSelection) {
                        rootDoc = currentElement;
                    }
                    this.selection = rootDoc.getSelection();
                    if (this.selection.rangeCount && this.selection.anchorNode) {
                        this.range = document.createRange();
                        var reverseRange = document.createRange();
                        this.range.setStart(this.selection.anchorNode, this.selection.anchorOffset);
                        reverseRange.setStart(this.selection.focusNode, this.selection.focusOffset);
                        if (this.range.compareBoundaryPoints(Range.START_TO_START, reverseRange) <= 0) {
                            this.range.setEnd(this.selection.focusNode, this.selection.focusOffset);
                        }
                        else {
                            this.range = reverseRange;
                            this.range.setEnd(this.selection.anchorNode, this.selection.anchorOffset);
                        }
                    }
                }
                Selection.prototype.getContaining = function(nodeFilter) {
                    var range = this.range;
                    if (!range) {
                        return;
                    }
                    var node = new scribe.api.Node(this.range.commonAncestorContainer);
                    var isTopContainerElement = node.node && scribe.el === node.node;
                    return !isTopContainerElement && nodeFilter(node.node) ? node.node : node.getAncestor(scribe.el, nodeFilter);
                };
                Selection.prototype.placeMarkers = function() {
                    var range = this.range;
                    if (!range) {
                        return;
                    }
                    if (!scribe.el.offsetParent) {
                        return;
                    }
                    var scribeNodeRange = document.createRange();
                    scribeNodeRange.selectNodeContents(scribe.el);
                    var selectionStartWithinScribeElementStart = this.range.compareBoundaryPoints(Range.START_TO_START, scribeNodeRange) >= 0;
                    var selectionEndWithinScribeElementEnd = this.range.compareBoundaryPoints(Range.END_TO_END, scribeNodeRange) <= 0;
                    if (selectionStartWithinScribeElementStart && selectionEndWithinScribeElementEnd) {
                        var startMarker = document.createElement('em');
                        startMarker.classList.add('scribe-marker');
                        var endMarker = document.createElement('em');
                        endMarker.classList.add('scribe-marker');
                        var rangeEnd = this.range.cloneRange();
                        rangeEnd.collapse(false);
                        rangeEnd.insertNode(endMarker);
                        if (endMarker.nextSibling && endMarker.nextSibling.nodeType === Node.TEXT_NODE && endMarker.nextSibling.data === '') {
                            endMarker.parentNode.removeChild(endMarker.nextSibling);
                        }
                        if (endMarker.previousSibling && endMarker.previousSibling.nodeType === Node.TEXT_NODE && endMarker.previousSibling.data === '') {
                            endMarker.parentNode.removeChild(endMarker.previousSibling);
                        }
                        if (!this.range.collapsed) {
                            var rangeStart = this.range.cloneRange();
                            rangeStart.collapse(true);
                            rangeStart.insertNode(startMarker);
                            if (startMarker.nextSibling && startMarker.nextSibling.nodeType === Node.TEXT_NODE && startMarker.nextSibling.data === '') {
                                startMarker.parentNode.removeChild(startMarker.nextSibling);
                            }
                            if (startMarker.previousSibling && startMarker.previousSibling.nodeType === Node.TEXT_NODE && startMarker.previousSibling.data === '') {
                                startMarker.parentNode.removeChild(startMarker.previousSibling);
                            }
                        }
                        this.selection.removeAllRanges();
                        this.selection.addRange(this.range);
                    }
                };
                Selection.prototype.getMarkers = function() {
                    return scribe.el.querySelectorAll('em.scribe-marker');
                };
                Selection.prototype.removeMarkers = function() {
                    var markers = this.getMarkers();
                    Array.prototype.forEach.call(markers, function(marker) {
                        marker.parentNode.removeChild(marker);
                    });
                };
                Selection.prototype.selectMarkers = function(keepMarkers) {
                    var markers = this.getMarkers();
                    if (!markers.length) {
                        return;
                    }
                    var newRange = document.createRange();
                    newRange.setStartBefore(markers[0]);
                    if (markers.length >= 2) {
                        newRange.setEndAfter(markers[1]);
                    }
                    else {
                        newRange.setEndAfter(markers[0]);
                    }
                    if (!keepMarkers) {
                        this.removeMarkers();
                    }
                    this.selection.removeAllRanges();
                    this.selection.addRange(newRange);
                };
                Selection.prototype.isCaretOnNewLine = function() {
                    function isEmptyInlineElement(node) {
                        var treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT, null, false);
                        var currentNode = treeWalker.root;
                        while (currentNode) {
                            var numberOfChildren = currentNode.childNodes.length;
                            if (numberOfChildren > 1 || numberOfChildren === 1 && currentNode.textContent.trim() !== '')
                                return false;
                            if (numberOfChildren === 0) {
                                return currentNode.textContent.trim() === '';
                            }
                            currentNode = treeWalker.nextNode();
                        };
                    };
                    var containerPElement = this.getContaining(function(node) {
                        return node.nodeName === 'P';
                    });
                    if (containerPElement) {
                        return isEmptyInlineElement(containerPElement);
                    }
                    else {
                        return false;
                    }
                };
                return Selection;
            };
}, {
            "../element": 48
        }],
        45: [function(require, module, exports) {
            'use strict';
            module.exports = function(api, scribe) {
                function SimpleCommand(commandName, nodeName) {
                    scribe.api.Command.call(this, commandName);
                    this._nodeName = nodeName;
                }
                SimpleCommand.prototype = Object.create(api.Command.prototype);
                SimpleCommand.prototype.constructor = SimpleCommand;
                SimpleCommand.prototype.queryState = function() {
                    var selection = new scribe.api.Selection();
                    return scribe.api.Command.prototype.queryState.call(this) && !!selection.getContaining(function(node) {
                        return node.nodeName === this._nodeName;
                    }.bind(this));
                };
                return SimpleCommand;
            };
}, {}],
        46: [function(require, module, exports) {
            var defaults = require('lodash-amd/modern/object/defaults');
            var blockModePlugins = [
        'setRootPElement',
        'enforcePElements',
        'ensureSelectableContainers'
    ],
                inlineModePlugins = ['inlineElementsMode'],
                defaultOptions = {
                    allowBlockElements: true,
                    debug: false,
                    undo: {
                        manager: false,
                        enabled: true,
                        limit: 100,
                        interval: 250
                    },
                    defaultCommandPatches: [
            'bold',
            'indent',
            'insertHTML',
            'insertList',
            'outdent',
            'createLink'
        ],
                    defaultPlugins: blockModePlugins.concat(inlineModePlugins),
                    defaultFormatters: [
            'escapeHtmlCharactersFormatter',
            'replaceNbspCharsFormatter'
        ]
                };

            function checkOptions(userSuppliedOptions) {
                var options = userSuppliedOptions || {};
                if (options.defaultPlugins) {
                    options.defaultPlugins = options.defaultPlugins.filter(filterByPluginExists(defaultOptions.defaultPlugins));
                }
                if (options.defaultFormatters) {
                    options.defaultFormatters = options.defaultFormatters.filter(filterByPluginExists(defaultOptions.defaultFormatters));
                }
                return Object.freeze(defaults(options, defaultOptions));
            }

            function sortByPlugin(priorityPlugin) {
                return function(pluginCurrent, pluginNext) {
                    if (pluginCurrent === priorityPlugin) {
                        return -1;
                    }
                    else if (pluginNext === priorityPlugin) {
                        return 1;
                    }
                    return 0;
                };
            }

            function filterByBlockLevelMode(isBlockLevelMode) {
                return function(plugin) {
                    return (isBlockLevelMode ? blockModePlugins : inlineModePlugins)
                        .indexOf(plugin) !== -1;
                };
            }

            function filterByPluginExists(pluginList) {
                return function(plugin) {
                    return pluginList.indexOf(plugin) !== -1;
                };
            }
            module.exports = {
                defaultOptions: defaultOptions,
                checkOptions: checkOptions,
                sortByPlugin: sortByPlugin,
                filterByBlockLevelMode: filterByBlockLevelMode,
                filterByPluginExists: filterByPluginExists
            };
}, {
            "lodash-amd/modern/object/defaults": 32
        }],
        47: [function(require, module, exports) {
            var flatten = require('lodash-amd/modern/array/flatten'),
                toArray = require('lodash-amd/modern/lang/toArray'),
                elementHelpers = require('./element'),
                nodeHelpers = require('./node');

            function observeDomChanges(el, callback) {
                function includeRealMutations(mutations) {
                    var allChangedNodes = flatten(mutations.map(function(mutation) {
                        var added = toArray(mutation.addedNodes);
                        var removed = toArray(mutation.removedNodes);
                        return added.concat(removed);
                    }));
                    var realChangedNodes = allChangedNodes.filter(function(n) {
                            return !nodeHelpers.isEmptyTextNode(n);
                        })
                        .filter(function(n) {
                            return !elementHelpers.isSelectionMarkerNode(n);
                        });
                    return realChangedNodes.length > 0;
                }
                var MutationObserver = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;
                var runningPostMutation = false;
                var observer = new MutationObserver(function(mutations) {
                    if (!runningPostMutation && includeRealMutations(mutations)) {
                        runningPostMutation = true;
                        try {
                            callback();
                        }
                        catch (e) {
                            throw e;
                        }
                        finally {
                            setTimeout(function() {
                                runningPostMutation = false;
                            }, 0);
                        }
                    }
                });
                observer.observe(el, {
                    attributes: true,
                    childList: true,
                    subtree: true
                });
                return observer;
            }
            module.exports = observeDomChanges;
}, {
            "./element": 48,
            "./node": 50,
            "lodash-amd/modern/array/flatten": 2,
            "lodash-amd/modern/lang/toArray": 30
        }],
        48: [function(require, module, exports) {
            var contains = require('lodash-amd/modern/collection/contains');
            'use strict';
            var blockElementNames = [
        'ADDRESS',
        'ARTICLE',
        'ASIDE',
        'AUDIO',
        'BLOCKQUOTE',
        'CANVAS',
        'DD',
        'DIV',
        'FIELDSET',
        'FIGCAPTION',
        'FIGURE',
        'FOOTER',
        'FORM',
        'H1',
        'H2',
        'H3',
        'H4',
        'H5',
        'H6',
        'HEADER',
        'HGROUP',
        'HR',
        'LI',
        'NOSCRIPT',
        'OL',
        'OUTPUT',
        'P',
        'PRE',
        'SECTION',
        'TABLE',
        'TD',
        'TH',
        'TFOOT',
        'UL',
        'VIDEO'
    ];

            function isBlockElement(node) {
                return contains(blockElementNames, node.nodeName);
            }

            function isSelectionMarkerNode(node) {
                return node.nodeType === Node.ELEMENT_NODE && node.className === 'scribe-marker';
            }

            function isCaretPositionNode(node) {
                return node.nodeType === Node.ELEMENT_NODE && node.className === 'caret-position';
            }

            function unwrap(node, childNode) {
                while (childNode.childNodes.length > 0) {
                    node.insertBefore(childNode.childNodes[0], childNode);
                }
                node.removeChild(childNode);
            }
            module.exports = {
                isBlockElement: isBlockElement,
                isSelectionMarkerNode: isSelectionMarkerNode,
                isCaretPositionNode: isCaretPositionNode,
                unwrap: unwrap
            };
}, {
            "lodash-amd/modern/collection/contains": 5
        }],
        49: [function(require, module, exports) {
            var pull = require('lodash-amd/modern/array/pull'),
                Immutable = require('immutable/dist/immutable');
            'use strict';

            function EventEmitter() {
                this._listeners = {};
            }
            EventEmitter.prototype.on = function(eventName, fn) {
                var listeners = this._listeners[eventName] || Immutable.Set();
                this._listeners[eventName] = listeners.add(fn);
            };
            EventEmitter.prototype.off = function(eventName, fn) {
                var listeners = this._listeners[eventName] || Immutable.Set();
                if (fn) {
                    this._listeners[eventName] = listeners.delete(fn);
                }
                else {
                    this._listeners[eventName] = listeners.clear();
                }
            };
            EventEmitter.prototype.trigger = function(eventName, args) {
                var events = eventName.split(':');
                while (!!events.length) {
                    var currentEvent = events.join(':');
                    var listeners = this._listeners[currentEvent] || Immutable.Set();
                    listeners.forEach(function(listener) {
                        listener.apply(null, args);
                    });
                    events.splice(events.length - 1, 1);
                }
            };
            module.exports = EventEmitter;
}, {
            "immutable/dist/immutable": 1,
            "lodash-amd/modern/array/pull": 4
        }],
        50: [function(require, module, exports) {
            'use strict';

            function isEmptyTextNode(node) {
                return node.nodeType === Node.TEXT_NODE && node.textContent === '';
            }

            function insertAfter(newNode, referenceNode) {
                return referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
            }

            function removeNode(node) {
                return node.parentNode.removeChild(node);
            }
            module.exports = {
                isEmptyTextNode: isEmptyTextNode,
                insertAfter: insertAfter,
                removeNode: removeNode
            };
}, {}],
        51: [function(require, module, exports) {
            var indent = require('./commands/indent'),
                insertList = require('./commands/insert-list'),
                outdent = require('./commands/outdent'),
                redo = require('./commands/redo'),
                subscript = require('./commands/subscript'),
                superscript = require('./commands/superscript'),
                undo = require('./commands/undo');
            'use strict';
            module.exports = {
                indent: indent,
                insertList: insertList,
                outdent: outdent,
                redo: redo,
                subscript: subscript,
                superscript: superscript,
                undo: undo
            };
}, {
            "./commands/indent": 52,
            "./commands/insert-list": 53,
            "./commands/outdent": 54,
            "./commands/redo": 55,
            "./commands/subscript": 56,
            "./commands/superscript": 57,
            "./commands/undo": 58
        }],
        52: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var indentCommand = new scribe.api.Command('indent');
                    indentCommand.queryEnabled = function() {
                        var selection = new scribe.api.Selection();
                        var listElement = selection.getContaining(function(element) {
                            return element.nodeName === 'UL' || element.nodeName === 'OL';
                        });
                        return scribe.api.Command.prototype.queryEnabled.call(this) && scribe.allowsBlockElements() && !listElement;
                    };
                    scribe.commands.indent = indentCommand;
                };
            };
}, {}],
        53: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var InsertListCommand = function(commandName) {
                        scribe.api.Command.call(this, commandName);
                    };
                    InsertListCommand.prototype = Object.create(scribe.api.Command.prototype);
                    InsertListCommand.prototype.constructor = InsertListCommand;
                    InsertListCommand.prototype.execute = function(value) {
                        function splitList(listItemElements) {
                            if (listItemElements.length > 0) {
                                var newListNode = document.createElement(listNode.nodeName);
                                listItemElements.forEach(function(listItemElement) {
                                    newListNode.appendChild(listItemElement);
                                });
                                listNode.parentNode.insertBefore(newListNode, listNode.nextElementSibling);
                            }
                        }
                        if (this.queryState()) {
                            var selection = new scribe.api.Selection();
                            var range = selection.range;
                            var listNode = selection.getContaining(function(node) {
                                return node.nodeName === 'OL' || node.nodeName === 'UL';
                            });
                            var listItemElement = selection.getContaining(function(node) {
                                return node.nodeName === 'LI';
                            });
                            scribe.transactionManager.run(function() {
                                if (listItemElement) {
                                    var nextListItemElements = new scribe.api.Node(listItemElement)
                                        .nextAll();
                                    splitList(nextListItemElements);
                                    selection.placeMarkers();
                                    var pNode = document.createElement('p');
                                    pNode.innerHTML = listItemElement.innerHTML;
                                    listNode.parentNode.insertBefore(pNode, listNode.nextElementSibling);
                                    listItemElement.parentNode.removeChild(listItemElement);
                                }
                                else {
                                    var selectedListItemElements = Array.prototype.map.call(listNode.querySelectorAll('li'), function(listItemElement) {
                                            return range.intersectsNode(listItemElement) && listItemElement;
                                        })
                                        .filter(function(listItemElement) {
                                            return listItemElement;
                                        });
                                    var lastSelectedListItemElement = selectedListItemElements.slice(-1)[0];
                                    var listItemElementsAfterSelection = new scribe.api.Node(lastSelectedListItemElement)
                                        .nextAll();
                                    splitList(listItemElementsAfterSelection);
                                    selection.placeMarkers();
                                    var documentFragment = document.createDocumentFragment();
                                    selectedListItemElements.forEach(function(listItemElement) {
                                        var pElement = document.createElement('p');
                                        pElement.innerHTML = listItemElement.innerHTML;
                                        documentFragment.appendChild(pElement);
                                    });
                                    listNode.parentNode.insertBefore(documentFragment, listNode.nextElementSibling);
                                    selectedListItemElements.forEach(function(listItemElement) {
                                        listItemElement.parentNode.removeChild(listItemElement);
                                    });
                                }
                                if (listNode.childNodes.length === 0) {
                                    listNode.parentNode.removeChild(listNode);
                                }
                                selection.selectMarkers();
                            }.bind(this));
                        }
                        else {
                            scribe.api.Command.prototype.execute.call(this, value);
                        }
                    };
                    InsertListCommand.prototype.queryEnabled = function() {
                        return scribe.api.Command.prototype.queryEnabled.call(this) && scribe.allowsBlockElements();
                    };
                    scribe.commands.insertOrderedList = new InsertListCommand('insertOrderedList');
                    scribe.commands.insertUnorderedList = new InsertListCommand('insertUnorderedList');
                };
            };
}, {}],
        54: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var outdentCommand = new scribe.api.Command('outdent');
                    outdentCommand.queryEnabled = function() {
                        var selection = new scribe.api.Selection();
                        var listElement = selection.getContaining(function(element) {
                            return element.nodeName === 'UL' || element.nodeName === 'OL';
                        });
                        return scribe.api.Command.prototype.queryEnabled.call(this) && scribe.allowsBlockElements() && !listElement;
                    };
                    scribe.commands.outdent = outdentCommand;
                };
            };
}, {}],
        55: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var redoCommand = new scribe.api.Command('redo');
                    redoCommand.execute = function() {
                        scribe.undoManager.redo();
                    };
                    redoCommand.queryEnabled = function() {
                        return scribe.undoManager.position > 0;
                    };
                    scribe.commands.redo = redoCommand;
                    if (scribe.options.undo.enabled) {
                        scribe.el.addEventListener('keydown', function(event) {
                            if (event.shiftKey && (event.metaKey || event.ctrlKey) && event.keyCode === 90) {
                                event.preventDefault();
                                redoCommand.execute();
                            }
                        });
                    }
                };
            };
}, {}],
        56: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var subscriptCommand = new scribe.api.Command('subscript');
                    scribe.commands.subscript = subscriptCommand;
                };
            };
}, {}],
        57: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var superscriptCommand = new scribe.api.Command('superscript');
                    scribe.commands.superscript = superscriptCommand;
                };
            };
}, {}],
        58: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var undoCommand = new scribe.api.Command('undo');
                    undoCommand.execute = function() {
                        scribe.undoManager.undo();
                    };
                    undoCommand.queryEnabled = function() {
                        return scribe.undoManager.position < scribe.undoManager.length;
                    };
                    scribe.commands.undo = undoCommand;
                    if (scribe.options.undo.enabled) {
                        scribe.el.addEventListener('keydown', function(event) {
                            if (!event.shiftKey && (event.metaKey || event.ctrlKey) && event.keyCode === 90) {
                                event.preventDefault();
                                undoCommand.execute();
                            }
                        });
                    }
                };
            };
}, {}],
        59: [function(require, module, exports) {
            var contains = require('lodash-amd/modern/collection/contains'),
                observeDomChanges = require('../../dom-observer');
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    scribe.el.addEventListener('focus', function placeCaretOnFocus() {
                        var selection = new scribe.api.Selection();
                        if (selection.range) {
                            var isFirefoxBug = scribe.allowsBlockElements() && selection.range.startContainer === scribe.el;
                            if (isFirefoxBug) {
                                var focusElement = getFirstDeepestChild(scribe.el.firstChild);
                                var range = selection.range;
                                range.setStart(focusElement, 0);
                                range.setEnd(focusElement, 0);
                                selection.selection.removeAllRanges();
                                selection.selection.addRange(range);
                            }
                        }

                        function getFirstDeepestChild(node) {
                            var treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_ALL, null, false);
                            var previousNode = treeWalker.currentNode;
                            if (treeWalker.firstChild()) {
                                if (treeWalker.currentNode.nodeName === 'BR') {
                                    return previousNode;
                                }
                                else {
                                    return getFirstDeepestChild(treeWalker.currentNode);
                                }
                            }
                            else {
                                return treeWalker.currentNode;
                            }
                        }
                    }.bind(scribe));
                    var applyFormatters = function() {
                        if (!scribe._skipFormatters) {
                            var selection = new scribe.api.Selection();
                            var isEditorActive = selection.range;
                            var runFormatters = function() {
                                if (isEditorActive) {
                                    selection.placeMarkers();
                                }
                                scribe.setHTML(scribe._htmlFormatterFactory.format(scribe.getHTML()));
                                selection.selectMarkers();
                            }.bind(scribe);
                            scribe.transactionManager.run(runFormatters);
                        }
                        delete scribe._skipFormatters;
                    }.bind(scribe);
                    observeDomChanges(scribe.el, applyFormatters);
                    if (scribe.allowsBlockElements()) {
                        scribe.el.addEventListener('keydown', function(event) {
                            if (event.keyCode === 13) {
                                var selection = new scribe.api.Selection();
                                var range = selection.range;
                                var headingNode = selection.getContaining(function(node) {
                                    return /^(H[1-6])$/.test(node.nodeName);
                                });
                                if (headingNode && range.collapsed) {
                                    var contentToEndRange = range.cloneRange();
                                    contentToEndRange.setEndAfter(headingNode, 0);
                                    var contentToEndFragment = contentToEndRange.cloneContents();
                                    if (contentToEndFragment.firstChild.textContent === '') {
                                        event.preventDefault();
                                        scribe.transactionManager.run(function() {
                                            var pNode = document.createElement('p');
                                            var brNode = document.createElement('br');
                                            pNode.appendChild(brNode);
                                            headingNode.parentNode.insertBefore(pNode, headingNode.nextElementSibling);
                                            range.setStart(pNode, 0);
                                            range.setEnd(pNode, 0);
                                            selection.selection.removeAllRanges();
                                            selection.selection.addRange(range);
                                        });
                                    }
                                }
                            }
                        });
                    }
                    if (scribe.allowsBlockElements()) {
                        scribe.el.addEventListener('keydown', function(event) {
                            if (event.keyCode === 13 || event.keyCode === 8) {
                                var selection = new scribe.api.Selection();
                                var range = selection.range;
                                if (range.collapsed) {
                                    var containerLIElement = selection.getContaining(function(node) {
                                        return node.nodeName === 'LI';
                                    });
                                    if (containerLIElement && containerLIElement.textContent.trim() === '') {
                                        event.preventDefault();
                                        var listNode = selection.getContaining(function(node) {
                                            return node.nodeName === 'UL' || node.nodeName === 'OL';
                                        });
                                        var command = scribe.getCommand(listNode.nodeName === 'OL' ? 'insertOrderedList' : 'insertUnorderedList');
                                        command.execute();
                                    }
                                }
                            }
                        });
                    }
                    scribe.el.addEventListener('paste', function handlePaste(event) {
                        if (event.clipboardData) {
                            event.preventDefault();
                            if (contains(event.clipboardData.types, 'text/html')) {
                                scribe.insertHTML(event.clipboardData.getData('text/html'));
                            }
                            else {
                                scribe.insertPlainText(event.clipboardData.getData('text/plain'));
                            }
                        }
                        else {
                            var selection = new scribe.api.Selection();
                            selection.placeMarkers();
                            var bin = document.createElement('div');
                            document.body.appendChild(bin);
                            bin.setAttribute('contenteditable', true);
                            bin.focus();
                            setTimeout(function() {
                                var data = bin.innerHTML;
                                bin.parentNode.removeChild(bin);
                                selection.selectMarkers();
                                scribe.el.focus();
                                scribe.insertHTML(data);
                            }, 1);
                        }
                    });
                };
            };
}, {
            "../../dom-observer": 47,
            "lodash-amd/modern/collection/contains": 5
        }],
        60: [function(require, module, exports) {
            var replaceNbspCharsFormatter = require('./formatters/html/replace-nbsp-chars'),
                escapeHtmlCharactersFormatter = require('./formatters/plain-text/escape-html-characters');
            'use strict';
            module.exports = {
                replaceNbspCharsFormatter: replaceNbspCharsFormatter,
                escapeHtmlCharactersFormatter: escapeHtmlCharactersFormatter
            };
}, {
            "./formatters/html/replace-nbsp-chars": 63,
            "./formatters/plain-text/escape-html-characters": 64
        }],
        61: [function(require, module, exports) {
            var last = require('lodash-amd/modern/array/last');
            'use strict';

            function wrapChildNodes(scribe, parentNode) {
                var groups = Array.prototype.reduce.call(parentNode.childNodes, function(accumulator, binChildNode) {
                    var group = last(accumulator);
                    if (!group) {
                        startNewGroup();
                    }
                    else {
                        var isBlockGroup = scribe.element.isBlockElement(group[0]);
                        if (isBlockGroup === scribe.element.isBlockElement(binChildNode)) {
                            group.push(binChildNode);
                        }
                        else {
                            startNewGroup();
                        }
                    }
                    return accumulator;

                    function startNewGroup() {
                        var newGroup = [binChildNode];
                        accumulator.push(newGroup);
                    }
                }, []);
                var consecutiveInlineElementsAndTextNodes = groups.filter(function(group) {
                    var isBlockGroup = scribe.element.isBlockElement(group[0]);
                    return !isBlockGroup;
                });
                consecutiveInlineElementsAndTextNodes.forEach(function(nodes) {
                    var pElement = document.createElement('p');
                    nodes[0].parentNode.insertBefore(pElement, nodes[0]);
                    nodes.forEach(function(node) {
                        pElement.appendChild(node);
                    });
                });
                parentNode._isWrapped = true;
            }

            function traverse(scribe, parentNode) {
                var treeWalker = document.createTreeWalker(parentNode, NodeFilter.SHOW_ELEMENT, null, false);
                var node = treeWalker.firstChild();
                while (node) {
                    if (node.nodeName === 'BLOCKQUOTE' && !node._isWrapped) {
                        wrapChildNodes(scribe, node);
                        traverse(scribe, parentNode);
                        break;
                    }
                    node = treeWalker.nextSibling();
                }
            }
            module.exports = function() {
                return function(scribe) {
                    scribe.registerHTMLFormatter('normalize', function(html) {
                        var bin = document.createElement('div');
                        bin.innerHTML = html;
                        wrapChildNodes(scribe, bin);
                        traverse(scribe, bin);
                        return bin.innerHTML;
                    });
                };
            };
}, {
            "lodash-amd/modern/array/last": 3
        }],
        62: [function(require, module, exports) {
            var element = require('../../../../element'),
                contains = require('lodash-amd/modern/collection/contains');
            'use strict';
            var html5VoidElements = [
        'AREA',
        'BASE',
        'BR',
        'COL',
        'COMMAND',
        'EMBED',
        'HR',
        'IMG',
        'INPUT',
        'KEYGEN',
        'LINK',
        'META',
        'PARAM',
        'SOURCE',
        'TRACK',
        'WBR'
    ];

            function parentHasNoTextContent(element, node) {
                if (element.isCaretPositionNode(node)) {
                    return true;
                }
                else {
                    return node.parentNode.textContent.trim() === '';
                }
            }

            function traverse(element, parentNode) {
                var node = parentNode.firstElementChild;

                function isEmpty(node) {
                    if (node.children.length === 0 && element.isBlockElement(node) || node.children.length === 1 && element.isSelectionMarkerNode(node.children[0])) {
                        return true;
                    }
                    if (!element.isBlockElement(node) && node.children.length === 0) {
                        return parentHasNoTextContent(element, node);
                    }
                    return false;
                }
                while (node) {
                    if (!element.isSelectionMarkerNode(node)) {
                        if (isEmpty(node) && node.textContent.trim() === '' && !contains(html5VoidElements, node.nodeName)) {
                            node.appendChild(document.createElement('br'));
                        }
                        else if (node.children.length > 0) {
                            traverse(element, node);
                        }
                    }
                    node = node.nextElementSibling;
                }
            }
            module.exports = function() {
                return function(scribe) {
                    scribe.registerHTMLFormatter('normalize', function(html) {
                        var bin = document.createElement('div');
                        bin.innerHTML = html;
                        traverse(scribe.element, bin);
                        return bin.innerHTML;
                    });
                };
            };
}, {
            "../../../../element": 48,
            "lodash-amd/modern/collection/contains": 5
        }],
        63: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var nbspCharRegExp = /(\s|&nbsp;)+/g;
                    scribe.registerHTMLFormatter('export', function(html) {
                        return html.replace(nbspCharRegExp, ' ');
                    });
                };
            };
}, {}],
        64: [function(require, module, exports) {
            var escape = require('lodash-amd/modern/string/escape');
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    scribe.registerPlainTextFormatter(escape);
                };
            };
}, {
            "lodash-amd/modern/string/escape": 36
        }],
        65: [function(require, module, exports) {
            'use strict';

            function hasContent(rootNode) {
                var treeWalker = document.createTreeWalker(rootNode, NodeFilter.SHOW_ALL, null, false);
                while (treeWalker.nextNode()) {
                    if (treeWalker.currentNode) {
                        if (~['br'].indexOf(treeWalker.currentNode.nodeName.toLowerCase()) || treeWalker.currentNode.length > 0) {
                            return true;
                        }
                    }
                }
                return false;
            }
            module.exports = function() {
                return function(scribe) {
                    scribe.el.addEventListener('keydown', function(event) {
                        if (event.keyCode === 13) {
                            var selection = new scribe.api.Selection();
                            var range = selection.range;
                            var blockNode = selection.getContaining(function(node) {
                                return node.nodeName === 'LI' || /^(H[1-6])$/.test(node.nodeName);
                            });
                            if (!blockNode) {
                                event.preventDefault();
                                scribe.transactionManager.run(function() {
                                    if (scribe.el.lastChild.nodeName === 'BR') {
                                        scribe.el.removeChild(scribe.el.lastChild);
                                    }
                                    var brNode = document.createElement('br');
                                    range.insertNode(brNode);
                                    range.collapse(false);
                                    var contentToEndRange = range.cloneRange();
                                    contentToEndRange.setEndAfter(scribe.el.lastChild, 0);
                                    var contentToEndFragment = contentToEndRange.cloneContents();
                                    if (!hasContent(contentToEndFragment)) {
                                        var bogusBrNode = document.createElement('br');
                                        range.insertNode(bogusBrNode);
                                    }
                                    var newRange = range.cloneRange();
                                    newRange.setStartAfter(brNode, 0);
                                    newRange.setEndAfter(brNode, 0);
                                    selection.selection.removeAllRanges();
                                    selection.selection.addRange(newRange);
                                });
                            }
                        }
                    }.bind(this));
                    if (scribe.getHTML()
                        .trim() === '') {
                        scribe.setContent('');
                    }
                };
            };
}, {}],
        66: [function(require, module, exports) {
            var boldCommand = require('./patches/commands/bold'),
                indentCommand = require('./patches/commands/indent'),
                insertHTMLCommand = require('./patches/commands/insert-html'),
                insertListCommands = require('./patches/commands/insert-list'),
                outdentCommand = require('./patches/commands/outdent'),
                createLinkCommand = require('./patches/commands/create-link'),
                events = require('./patches/events');
            'use strict';
            module.exports = {
                commands: {
                    bold: boldCommand,
                    indent: indentCommand,
                    insertHTML: insertHTMLCommand,
                    insertList: insertListCommands,
                    outdent: outdentCommand,
                    createLink: createLinkCommand
                },
                events: events
            };
}, {
            "./patches/commands/bold": 67,
            "./patches/commands/create-link": 68,
            "./patches/commands/indent": 69,
            "./patches/commands/insert-html": 70,
            "./patches/commands/insert-list": 71,
            "./patches/commands/outdent": 72,
            "./patches/events": 73
        }],
        67: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var boldCommand = new scribe.api.CommandPatch('bold');
                    boldCommand.queryEnabled = function() {
                        var selection = new scribe.api.Selection();
                        var headingNode = selection.getContaining(function(node) {
                            return /^(H[1-6])$/.test(node.nodeName);
                        });
                        return scribe.api.CommandPatch.prototype.queryEnabled.apply(this, arguments) && !headingNode;
                    };
                    scribe.commandPatches.bold = boldCommand;
                };
            };
}, {}],
        68: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var createLinkCommand = new scribe.api.CommandPatch('createLink');
                    scribe.commandPatches.createLink = createLinkCommand;
                    createLinkCommand.execute = function(value) {
                        var selection = new scribe.api.Selection();
                        if (selection.range.collapsed) {
                            var aElement = document.createElement('a');
                            aElement.setAttribute('href', value);
                            aElement.textContent = value;
                            selection.range.insertNode(aElement);
                            var newRange = document.createRange();
                            newRange.setStartBefore(aElement);
                            newRange.setEndAfter(aElement);
                            selection.selection.removeAllRanges();
                            selection.selection.addRange(newRange);
                        }
                        else {
                            scribe.api.CommandPatch.prototype.execute.call(this, value);
                        }
                    };
                };
            };
}, {}],
        69: [function(require, module, exports) {
            'use strict';
            var INVISIBLE_CHAR = '\ufeff';
            module.exports = function() {
                return function(scribe) {
                    var indentCommand = new scribe.api.CommandPatch('indent');
                    indentCommand.execute = function(value) {
                        scribe.transactionManager.run(function() {
                            var selection = new scribe.api.Selection();
                            var range = selection.range;
                            var isCaretOnNewLine = range.commonAncestorContainer.nodeName === 'P' && range.commonAncestorContainer.innerHTML === '<br>';
                            if (isCaretOnNewLine) {
                                var textNode = document.createTextNode(INVISIBLE_CHAR);
                                range.insertNode(textNode);
                                range.setStart(textNode, 0);
                                range.setEnd(textNode, 0);
                                selection.selection.removeAllRanges();
                                selection.selection.addRange(range);
                            }
                            scribe.api.CommandPatch.prototype.execute.call(this, value);
                            selection = new scribe.api.Selection();
                            var blockquoteNode = selection.getContaining(function(node) {
                                return node.nodeName === 'BLOCKQUOTE';
                            });
                            if (blockquoteNode) {
                                blockquoteNode.removeAttribute('style');
                            }
                        }.bind(this));
                    };
                    scribe.commandPatches.indent = indentCommand;
                };
            };
}, {}],
        70: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var insertHTMLCommandPatch = new scribe.api.CommandPatch('insertHTML');
                    var element = scribe.element;
                    insertHTMLCommandPatch.execute = function(value) {
                        scribe.transactionManager.run(function() {
                            scribe.api.CommandPatch.prototype.execute.call(this, value);
                            sanitize(scribe.el);

                            function sanitize(parentNode) {
                                var treeWalker = document.createTreeWalker(parentNode, NodeFilter.SHOW_ELEMENT, null, false);
                                var node = treeWalker.firstChild();
                                if (!node) {
                                    return;
                                }
                                do {
                                    if (node.nodeName === 'SPAN') {
                                        element.unwrap(parentNode, node);
                                    }
                                    else {
                                        node.style.lineHeight = null;
                                        if (node.getAttribute('style') === '') {
                                            node.removeAttribute('style');
                                        }
                                    }
                                    sanitize(node);
                                } while (node = treeWalker.nextSibling());
                            }
                        }.bind(this));
                    };
                    scribe.commandPatches.insertHTML = insertHTMLCommandPatch;
                };
            };
}, {}],
        71: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var element = scribe.element;
                    var nodeHelpers = scribe.node;
                    var InsertListCommandPatch = function(commandName) {
                        scribe.api.CommandPatch.call(this, commandName);
                    };
                    InsertListCommandPatch.prototype = Object.create(scribe.api.CommandPatch.prototype);
                    InsertListCommandPatch.prototype.constructor = InsertListCommandPatch;
                    InsertListCommandPatch.prototype.execute = function(value) {
                        scribe.transactionManager.run(function() {
                            scribe.api.CommandPatch.prototype.execute.call(this, value);
                            if (this.queryState()) {
                                var selection = new scribe.api.Selection();
                                var listElement = selection.getContaining(function(node) {
                                    return node.nodeName === 'OL' || node.nodeName === 'UL';
                                });
                                if (listElement.nextElementSibling && listElement.nextElementSibling.childNodes.length === 0) {
                                    nodeHelpers.removeNode(listElement.nextElementSibling);
                                }
                                if (listElement) {
                                    var listParentNode = listElement.parentNode;
                                    if (listParentNode && /^(H[1-6]|P)$/.test(listParentNode.nodeName)) {
                                        selection.placeMarkers();
                                        nodeHelpers.insertAfter(listElement, listParentNode);
                                        selection.selectMarkers();
                                        if (listParentNode.childNodes.length === 2 && nodeHelpers.isEmptyTextNode(listParentNode.firstChild)) {
                                            nodeHelpers.removeNode(listParentNode);
                                        }
                                        if (listParentNode.childNodes.length === 0) {
                                            nodeHelpers.removeNode(listParentNode);
                                        }
                                    }
                                }
                                var listItemElements = Array.prototype.slice.call(listElement.childNodes);
                                listItemElements.forEach(function(listItemElement) {
                                    var listItemElementChildNodes = Array.prototype.slice.call(listItemElement.childNodes);
                                    listItemElementChildNodes.forEach(function(listElementChildNode) {
                                        if (listElementChildNode.nodeName === 'SPAN') {
                                            var spanElement = listElementChildNode;
                                            element.unwrap(listItemElement, spanElement);
                                        }
                                        else if (listElementChildNode.nodeType === Node.ELEMENT_NODE) {
                                            listElementChildNode.style.lineHeight = null;
                                            if (listElementChildNode.getAttribute('style') === '') {
                                                listElementChildNode.removeAttribute('style');
                                            }
                                        }
                                    });
                                });
                            }
                        }.bind(this));
                    };
                    scribe.commandPatches.insertOrderedList = new InsertListCommandPatch('insertOrderedList');
                    scribe.commandPatches.insertUnorderedList = new InsertListCommandPatch('insertUnorderedList');
                };
            };
}, {}],
        72: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var outdentCommand = new scribe.api.CommandPatch('outdent');
                    outdentCommand.execute = function() {
                        scribe.transactionManager.run(function() {
                            var selection = new scribe.api.Selection();
                            var range = selection.range;
                            var blockquoteNode = selection.getContaining(function(node) {
                                return node.nodeName === 'BLOCKQUOTE';
                            });
                            if (range.commonAncestorContainer.nodeName === 'BLOCKQUOTE') {
                                selection.placeMarkers();
                                selection.selectMarkers(true);
                                var selectedNodes = range.cloneContents();
                                blockquoteNode.parentNode.insertBefore(selectedNodes, blockquoteNode);
                                range.deleteContents();
                                selection.selectMarkers();
                                if (blockquoteNode.textContent === '') {
                                    blockquoteNode.parentNode.removeChild(blockquoteNode);
                                }
                            }
                            else {
                                var pNode = selection.getContaining(function(node) {
                                    return node.nodeName === 'P';
                                });
                                if (pNode) {
                                    var nextSiblingNodes = new scribe.api.Node(pNode)
                                        .nextAll();
                                    if (nextSiblingNodes.length) {
                                        var newContainerNode = document.createElement(blockquoteNode.nodeName);
                                        nextSiblingNodes.forEach(function(siblingNode) {
                                            newContainerNode.appendChild(siblingNode);
                                        });
                                        blockquoteNode.parentNode.insertBefore(newContainerNode, blockquoteNode.nextElementSibling);
                                    }
                                    selection.placeMarkers();
                                    blockquoteNode.parentNode.insertBefore(pNode, blockquoteNode.nextElementSibling);
                                    selection.selectMarkers();
                                    if (blockquoteNode.innerHTML === '') {
                                        blockquoteNode.parentNode.removeChild(blockquoteNode);
                                    }
                                }
                                else {
                                    scribe.api.CommandPatch.prototype.execute.call(this);
                                }
                            }
                        }.bind(this));
                    };
                    scribe.commandPatches.outdent = outdentCommand;
                };
            };
}, {}],
        73: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var element = scribe.element;
                    if (scribe.allowsBlockElements()) {
                        scribe.el.addEventListener('keyup', function(event) {
                            if (event.keyCode === 8 || event.keyCode === 46) {
                                var selection = new scribe.api.Selection();
                                var containerPElement = selection.getContaining(function(node) {
                                    return node.nodeName === 'P';
                                });
                                if (containerPElement) {
                                    scribe.transactionManager.run(function() {
                                        selection.placeMarkers();
                                        var pElementChildNodes = Array.prototype.slice.call(containerPElement.childNodes);
                                        pElementChildNodes.forEach(function(pElementChildNode) {
                                            if (pElementChildNode.nodeName === 'SPAN') {
                                                var spanElement = pElementChildNode;
                                                element.unwrap(containerPElement, spanElement);
                                            }
                                            else if (pElementChildNode.nodeType === Node.ELEMENT_NODE) {
                                                pElementChildNode.style.lineHeight = null;
                                                if (pElementChildNode.getAttribute('style') === '') {
                                                    pElementChildNode.removeAttribute('style');
                                                }
                                            }
                                        });
                                        selection.selectMarkers();
                                    }, true);
                                }
                            }
                        });
                    }
                };
            };
}, {}],
        74: [function(require, module, exports) {
            var setRootPElement = require('./set-root-p-element'),
                enforcePElements = require('./formatters/html/enforce-p-elements'),
                ensureSelectableContainers = require('./formatters/html/ensure-selectable-containers'),
                inlineElementsMode = require('./inline-elements-mode');
            'use strict';
            module.exports = {
                setRootPElement: setRootPElement,
                enforcePElements: enforcePElements,
                ensureSelectableContainers: ensureSelectableContainers,
                inlineElementsMode: inlineElementsMode
            };
}, {
            "./formatters/html/enforce-p-elements": 61,
            "./formatters/html/ensure-selectable-containers": 62,
            "./inline-elements-mode": 65,
            "./set-root-p-element": 75
        }],
        75: [function(require, module, exports) {
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    if (scribe.getHTML()
                        .trim() === '') {
                        scribe.setContent('<p><br></p>');
                    }
                };
            };
}, {}],
        76: [function(require, module, exports) {
            var assign = require('lodash-amd/modern/object/assign');
            'use strict';
            module.exports = function(scribe) {
                function TransactionManager() {
                    this.history = [];
                }
                assign(TransactionManager.prototype, {
                    start: function() {
                        this.history.push(1);
                    },
                    end: function() {
                        this.history.pop();
                        if (this.history.length === 0) {
                            scribe.pushHistory();
                            scribe.trigger('content-changed');
                        }
                    },
                    run: function(transaction, forceMerge) {
                        this.start();
                        try {
                            if (transaction) {
                                transaction();
                            }
                        }
                        finally {
                            scribe._forceMerge = forceMerge === true;
                            this.end();
                            scribe._forceMerge = false;
                        }
                    }
                });
                return TransactionManager;
            };
}, {
            "lodash-amd/modern/object/assign": 31
        }],
        77: [function(require, module, exports) {
            'use strict';

            function UndoManager(limit, undoScopeHost) {
                this._stack = [];
                this._limit = limit;
                this._fireEvent = typeof CustomEvent != 'undefined' && undoScopeHost && undoScopeHost.dispatchEvent;
                this._ush = undoScopeHost;
                this.position = 0;
                this.length = 0;
            }
            UndoManager.prototype.transact = function(transaction, merge) {
                if (arguments.length < 2) {
                    throw new TypeError('Not enough arguments to UndoManager.transact.');
                }
                transaction.execute();
                this._stack.splice(0, this.position);
                if (merge && this.length) {
                    this._stack[0].push(transaction);
                }
                else {
                    this._stack.unshift([transaction]);
                }
                this.position = 0;
                if (this._limit && this._stack.length > this._limit) {
                    this.length = this._stack.length = this._limit;
                }
                else {
                    this.length = this._stack.length;
                }
                if (this._fireEvent) {
                    this._ush.dispatchEvent(new CustomEvent('DOMTransaction', {
                        detail: {
                            transactions: this._stack[0].slice()
                        },
                        bubbles: true,
                        cancelable: false
                    }));
                }
            };
            UndoManager.prototype.undo = function() {
                if (this.position < this.length) {
                    for (var i = this._stack[this.position].length - 1; i >= 0; i--) {
                        this._stack[this.position][i].undo();
                    }
                    this.position++;
                    if (this._fireEvent) {
                        this._ush.dispatchEvent(new CustomEvent('undo', {
                            detail: {
                                transactions: this._stack[this.position - 1].slice()
                            },
                            bubbles: true,
                            cancelable: false
                        }));
                    }
                }
            };
            UndoManager.prototype.redo = function() {
                if (this.position > 0) {
                    for (var i = 0, n = this._stack[this.position - 1].length; i < n; i++) {
                        this._stack[this.position - 1][i].redo();
                    }
                    this.position--;
                    if (this._fireEvent) {
                        this._ush.dispatchEvent(new CustomEvent('redo', {
                            detail: {
                                transactions: this._stack[this.position].slice()
                            },
                            bubbles: true,
                            cancelable: false
                        }));
                    }
                }
            };
            UndoManager.prototype.item = function(index) {
                if (index >= 0 && index < this.length) {
                    return this._stack[index].slice();
                }
                return null;
            };
            UndoManager.prototype.clearUndo = function() {
                this._stack.length = this.length = this.position;
            };
            UndoManager.prototype.clearRedo = function() {
                this._stack.splice(0, this.position);
                this.position = 0;
                this.length = this._stack.length;
            };
            module.exports = UndoManager;
}, {}],
        78: [function(require, module, exports) {
            var plugins = require('./plugins/core/plugins'),
                commands = require('./plugins/core/commands'),
                formatters = require('./plugins/core/formatters'),
                events = require('./plugins/core/events'),
                patches = require('./plugins/core/patches'),
                Api = require('./api'),
                buildTransactionManager = require('./transaction-manager'),
                UndoManager = require('./undo-manager'),
                EventEmitter = require('./event-emitter'),
                elementHelpers = require('./element'),
                nodeHelpers = require('./node'),
                Immutable = require('immutable/dist/immutable'),
                config = require('./config');
            'use strict';

            function Scribe(el, options) {
                EventEmitter.call(this);
                this.el = el;
                this.commands = {};
                this.options = config.checkOptions(options);
                this.commandPatches = {};
                this._plainTextFormatterFactory = new FormatterFactory();
                this._htmlFormatterFactory = new HTMLFormatterFactory();
                this.api = new Api(this);
                this.node = nodeHelpers;
                this.element = elementHelpers;
                this.Immutable = Immutable;
                var TransactionManager = buildTransactionManager(this);
                this.transactionManager = new TransactionManager();
                this.undoManager = false;
                if (this.options.undo.enabled) {
                    if (this.options.undo.manager) {
                        this.undoManager = this.options.undo.manager;
                    }
                    else {
                        this.undoManager = new UndoManager(this.options.undo.limit, this.el);
                    }
                    this._merge = false;
                    this._forceMerge = false;
                    this._mergeTimer = 0;
                    this._lastItem = {
                        content: ''
                    };
                }
                this.setHTML(this.getHTML());
                this.el.setAttribute('contenteditable', true);
                this.el.addEventListener('input', function() {
                    this.transactionManager.run();
                }.bind(this), false);
                var corePlugins = Immutable.OrderedSet(this.options.defaultPlugins)
                    .sort(config.sortByPlugin('setRootPElement'))
                    .filter(config.filterByBlockLevelMode(this.allowsBlockElements()))
                    .map(function(plugin) {
                        return plugins[plugin];
                    });
                var defaultFormatters = Immutable.List(this.options.defaultFormatters)
                    .filter(function(formatter) {
                        return !!formatters[formatter];
                    })
                    .map(function(formatter) {
                        return formatters[formatter];
                    });
                var defaultPatches = Immutable.List.of(patches.events);
                var defaultCommandPatches = Immutable.List(this.options.defaultCommandPatches)
                    .map(function(patch) {
                        return patches.commands[patch];
                    });
                var defaultCommands = Immutable.List.of('indent', 'insertList', 'outdent', 'redo', 'subscript', 'superscript', 'undo')
                    .map(function(command) {
                        return commands[command];
                    });
                var allPlugins = Immutable.List()
                    .concat(corePlugins, defaultFormatters, defaultPatches, defaultCommandPatches, defaultCommands);
                allPlugins.forEach(function(plugin) {
                    this.use(plugin());
                }.bind(this));
                this.use(events());
            }
            Scribe.prototype = Object.create(EventEmitter.prototype);
            Scribe.prototype.use = function(configurePlugin) {
                configurePlugin(this);
                return this;
            };
            Scribe.prototype.setHTML = function(html, skipFormatters) {
                this._lastItem.content = html;
                if (skipFormatters) {
                    this._skipFormatters = true;
                }
                if (this.el.innerHTML !== html) {
                    this.el.innerHTML = html;
                }
            };
            Scribe.prototype.getHTML = function() {
                return this.el.innerHTML;
            };
            Scribe.prototype.getContent = function() {
                return this._htmlFormatterFactory.formatForExport(this.getHTML()
                    .replace(/<br>$/, ''));
            };
            Scribe.prototype.getTextContent = function() {
                return this.el.textContent;
            };
            Scribe.prototype.pushHistory = function() {
                var scribe = this;
                if (scribe.options.undo.enabled) {
                    var lastContentNoMarkers = scribe._lastItem.content.replace(/<em class="scribe-marker">[^<]*?<\/em>/g, '');
                    if (scribe.getHTML() !== lastContentNoMarkers) {
                        var selection = new scribe.api.Selection();
                        selection.placeMarkers();
                        var content = scribe.getHTML();
                        selection.removeMarkers();
                        var previousItem = scribe.undoManager.item(scribe.undoManager.position);
                        if ((scribe._merge || scribe._forceMerge) && previousItem && scribe._lastItem == previousItem[0]) {
                            scribe._lastItem.content = content;
                        }
                        else {
                            scribe._lastItem = {
                                previousItem: scribe._lastItem,
                                content: content,
                                scribe: scribe,
                                execute: function() {},
                                undo: function() {
                                    this.scribe.restoreFromHistory(this.previousItem);
                                },
                                redo: function() {
                                    this.scribe.restoreFromHistory(this);
                                }
                            };
                            scribe.undoManager.transact(scribe._lastItem, false);
                        }
                        clearTimeout(scribe._mergeTimer);
                        scribe._merge = true;
                        scribe._mergeTimer = setTimeout(function() {
                            scribe._merge = false;
                        }, scribe.options.undo.interval);
                        return true;
                    }
                }
                return false;
            };
            Scribe.prototype.getCommand = function(commandName) {
                return this.commands[commandName] || this.commandPatches[commandName] || new this.api.Command(commandName);
            };
            Scribe.prototype.restoreFromHistory = function(historyItem) {
                this._lastItem = historyItem;
                this.setHTML(historyItem.content, true);
                var selection = new this.api.Selection();
                selection.selectMarkers();
                this.trigger('content-changed');
            };
            Scribe.prototype.allowsBlockElements = function() {
                return this.options.allowBlockElements;
            };
            Scribe.prototype.setContent = function(content) {
                if (!this.allowsBlockElements()) {
                    content = content + '<br>';
                }
                this.setHTML(content);
                this.trigger('content-changed');
            };
            Scribe.prototype.insertPlainText = function(plainText) {
                this.insertHTML('<p>' + this._plainTextFormatterFactory.format(plainText) + '</p>');
            };
            Scribe.prototype.insertHTML = function(html) {
                this.getCommand('insertHTML')
                    .execute(this._htmlFormatterFactory.format(html));
            };
            Scribe.prototype.isDebugModeEnabled = function() {
                return this.options.debug;
            };
            Scribe.prototype.registerHTMLFormatter = function(phase, formatter) {
                this._htmlFormatterFactory.formatters[phase] = this._htmlFormatterFactory.formatters[phase].push(formatter);
            };
            Scribe.prototype.registerPlainTextFormatter = function(formatter) {
                this._plainTextFormatterFactory.formatters = this._plainTextFormatterFactory.formatters.push(formatter);
            };

            function FormatterFactory() {
                this.formatters = Immutable.List();
            }
            FormatterFactory.prototype.format = function(html) {
                var formatted = this.formatters.reduce(function(formattedData, formatter) {
                    return formatter(formattedData);
                }, html);
                return formatted;
            };

            function HTMLFormatterFactory() {
                this.formatters = {
                    sanitize: Immutable.List(),
                    normalize: Immutable.List(),
                    'export': Immutable.List()
                };
            }
            HTMLFormatterFactory.prototype = Object.create(FormatterFactory.prototype);
            HTMLFormatterFactory.prototype.constructor = HTMLFormatterFactory;
            HTMLFormatterFactory.prototype.format = function(html) {
                var formatters = this.formatters.sanitize.concat(this.formatters.normalize);
                var formatted = formatters.reduce(function(formattedData, formatter) {
                    return formatter(formattedData);
                }, html);
                return formatted;
            };
            HTMLFormatterFactory.prototype.formatForExport = function(html) {
                return this.formatters['export'].reduce(function(formattedData, formatter) {
                    return formatter(formattedData);
                }, html);
            };
            module.exports = Scribe;
}, {
            "./api": 40,
            "./config": 46,
            "./element": 48,
            "./event-emitter": 49,
            "./node": 50,
            "./plugins/core/commands": 51,
            "./plugins/core/events": 59,
            "./plugins/core/formatters": 60,
            "./plugins/core/patches": 66,
            "./plugins/core/plugins": 74,
            "./transaction-manager": 76,
            "./undo-manager": 77,
            "immutable/dist/immutable": 1
        }]
    }, {}, [78])(78)
});