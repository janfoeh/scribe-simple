(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.scribePluginBlockquoteCommand = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
define('scribe-plugin-blockquote-command',[],function () {

  /**
   * Adds a command for using BLOCKQUOTEs.
   */

  

  return function () {
    return function (scribe) {
      var blockquoteCommand = new scribe.api.SimpleCommand('blockquote', 'BLOCKQUOTE');

      blockquoteCommand.execute = function () {
        var command = scribe.getCommand(this.queryState() ? 'outdent' : 'indent');
        command.execute();
      };

      blockquoteCommand.queryEnabled = function () {
        var command = scribe.getCommand(this.queryState() ? 'outdent' : 'indent');
        return command.queryEnabled();
      };

      blockquoteCommand.queryState = function () {
        var selection = new scribe.api.Selection();
        var blockquoteElement = selection.getContaining(function (element) {
          return element.nodeName === 'BLOCKQUOTE';
        });

        return scribe.allowsBlockElements() && !! blockquoteElement;
      };

      scribe.commands.blockquote = blockquoteCommand;

      /**
       * If the paragraphs option is set to true, we unapply the blockquote on
       * <enter> keypresses if the caret is on a new line.
       */
      if (scribe.allowsBlockElements()) {
        scribe.el.addEventListener('keydown', function (event) {
          if (event.keyCode === 13) { // enter

            var command = scribe.getCommand('blockquote');
            if (command.queryState()) {
              var selection = new scribe.api.Selection();
              if (selection.isCaretOnNewLine()) {
                event.preventDefault();
                command.execute();
              }
            }
          }
        });
      }
    };
  };

});

//# sourceMappingURL=scribe-plugin-blockquote-command.js.map
},{}]},{},[1])(1)
});