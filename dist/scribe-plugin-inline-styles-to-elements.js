(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.scribePluginInlineStylesToElements = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
function asHtmlFormatter(domFormatter) {
    return function (html) {
        var bin = document.createElement('div');
        bin.innerHTML = html;
        return domFormatter(bin).innerHTML;
    };
}
module.exports = asHtmlFormatter;
},{}],2:[function(require,module,exports){
'use strict';
function isElement(node) {
    return node.nodeType === Node.ELEMENT_NODE;
}
function appendTraversedChildrenTo(n, parentNode, mapper) {
    var child = n.firstChild;
    while (child) {
        var mappedChild = traverse(child, mapper);
        if (mappedChild) {
            parentNode.appendChild(mappedChild);
        }
        child = child.nextSibling;
    }
    return parentNode;
}
function appendTraversedChildren(n, mapper) {
    return appendTraversedChildrenTo(n, n.cloneNode(false), mapper);
}
function traverse(node, mapper) {
    return mapper(node, mapper);
}
function styleToElement(styleProp, styleValue, elName) {
    return function (n, mapper) {
        if (isElement(n) && n.style[styleProp] === styleValue) {
            var strongWrapper = document.createElement(elName);
            var child = n.firstChild;
            while (child) {
                strongWrapper.appendChild(child.cloneNode(true));
                child = child.nextSibling;
            }
            var nCopy = n.cloneNode(false);
            nCopy.style[styleProp] = null;
            if (nCopy.getAttribute('style') === '') {
                nCopy.removeAttribute('style');
            }
            nCopy.appendChild(traverse(strongWrapper, mapper));
            return nCopy;
        } else {
            return appendTraversedChildren(n, mapper);
        }
    };
}
var filters = [
        styleToElement('fontWeight', 'bold', 'b'),
        styleToElement('fontStyle', 'italic', 'i'),
        styleToElement('textDecoration', 'underline', 'u'),
        styleToElement('textDecoration', 'line-through', 'strike'),
        styleToElement('textDecorationLine', 'underline', 'u'),
        styleToElement('textDecorationLine', 'line-through', 'strike')
    ];
function applyFilters(node) {
    return filters.reduce(traverse, node);
}
module.exports = applyFilters;
},{}],3:[function(require,module,exports){
var inlineStylesFormatter = require('./inline-styles-formatter'), asHtmlFormatter = require('./as-html-formatter');
'use strict';
module.exports = function () {
    return function (scribe) {
        scribe.registerHTMLFormatter('sanitize', asHtmlFormatter(inlineStylesFormatter));
    };
};
},{"./as-html-formatter":1,"./inline-styles-formatter":2}]},{},[3])(3)
});