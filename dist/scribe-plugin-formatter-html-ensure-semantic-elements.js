(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.scribePluginFormatterHtmlEnsureSemanticElements = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
module.exports = function () {
    return function (scribe) {
        var map = {
                'B': 'strong',
                'I': 'em'
            };
        function moveChildren(fromNode, toNode) {
            var nextChild;
            var child = fromNode.firstChild;
            while (child) {
                nextChild = child.nextSibling;
                toNode.appendChild(child);
                child = nextChild;
            }
        }
        function copyAttributes(fromNode, toNode) {
            if (fromNode.hasAttributes()) {
                for (var i = 0, ii = fromNode.attributes.length; i < ii; i++) {
                    var attr = fromNode.attributes[i].cloneNode(false);
                    toNode.attributes.setNamedItem(attr);
                }
            }
        }
        function replaceNode(node, nodeName) {
            var newNode = document.createElement(nodeName);
            moveChildren(node, newNode);
            copyAttributes(node, newNode);
            node.parentNode.replaceChild(newNode, node);
        }
        function traverse(parentNode) {
            var el = parentNode.firstElementChild;
            var nextSibling;
            while (el) {
                nextSibling = el.nextElementSibling;
                traverse(el);
                var nodeName = map[el.nodeName];
                if (nodeName) {
                    replaceNode(el, nodeName);
                }
                el = nextSibling;
            }
        }
        scribe.registerHTMLFormatter('normalize', function (html) {
            if (typeof html === 'string') {
                var node = document.createElement('div');
                node.innerHTML = html;
                traverse(node);
                return node.innerHTML;
            } else {
                traverse(html);
                return html;
            }
        });
    };
};
},{}]},{},[1])(1)
});