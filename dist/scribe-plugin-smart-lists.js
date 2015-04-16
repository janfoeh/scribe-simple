(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.scribePluginSmartLists = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';
module.exports = function () {
    var keys = {
            32: 'Space',
            42: '*',
            45: '-',
            46: '.',
            49: '1',
            8226: '\u2022'
        };
    function isUnorderedListChar(string) {
        return string === '*' || string === '-' || string === '\u2022';
    }
    return function (scribe) {
        var preLastChar, lastChar, currentChar;
        function findBlockContainer(node) {
            while (node && !scribe.element.isBlockElement(node)) {
                node = node.parentNode;
            }
            return node;
        }
        function removeSelectedTextNode() {
            var selection = new scribe.api.Selection();
            var container = selection.selection.anchorNode;
            var textNode;
            if (container.nodeType === Node.TEXT_NODE) {
                textNode = container;
            } else if (container.firstChild.nodeType === Node.TEXT_NODE) {
                textNode = container.firstChild;
            }
            if (textNode) {
                var parentNode = textNode.parentNode;
                if (textNode.previousSibling) {
                    parentNode.removeChild(textNode.previousSibling);
                }
                parentNode.removeChild(textNode);
            } else {
                throw new Error('Cannot empty non-text node!');
            }
        }
        function input(event) {
            var listCommand;
            preLastChar = lastChar;
            lastChar = currentChar;
            currentChar = keys[event.charCode];
            var selection = new scribe.api.Selection();
            var container = selection.range.commonAncestorContainer;
            var blockContainer = findBlockContainer(container);
            if (blockContainer && blockContainer.tagName === 'P') {
                var startOfLineIsUList = isUnorderedListChar(container.textContent[0]);
                var cursorIsInSecondPosition = selection.range.endOffset === 1;
                if (isUnorderedListChar(lastChar) && currentChar === 'Space' && startOfLineIsUList && cursorIsInSecondPosition) {
                    listCommand = 'insertUnorderedList';
                }
                var startOfLineIsOList = [
                        container.previousSibling && container.previousSibling.textContent,
                        container.textContent
                    ].join('').slice(0, 2) === '1.';
                if (preLastChar === '1' && lastChar === '.' && currentChar === 'Space' && startOfLineIsOList) {
                    listCommand = 'insertOrderedList';
                }
            }
            if (listCommand) {
                event.preventDefault();
                scribe.transactionManager.run(function () {
                    scribe.getCommand(listCommand).execute();
                    removeSelectedTextNode();
                });
            }
        }
        scribe.el.addEventListener('keypress', input);
    };
};
},{}]},{},[1])(1)
});