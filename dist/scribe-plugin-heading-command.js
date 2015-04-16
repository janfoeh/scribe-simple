(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.scribePluginHeadingCommand = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
define('scribe-plugin-heading-command',[],function () {

  /**
   * This plugin adds a command for headings.
   */

  

  return function (level) {
    return function (scribe) {
      var tag = '<h' + level + '>';
      var nodeName = 'H' + level;
      var commandName = 'h' + level;

      /**
       * Chrome: the `heading` command doesn't work. Supported by Firefox only.
       */

      var headingCommand = new scribe.api.Command('formatBlock');

      headingCommand.execute = function () {
        if (this.queryState()) {
          scribe.api.Command.prototype.execute.call(this, '<p>');
        } else {
          scribe.api.Command.prototype.execute.call(this, tag);
        }
      };

      headingCommand.queryState = function () {
        var selection = new scribe.api.Selection();
        return !! selection.getContaining(function (node) {
          return node.nodeName === nodeName;
        });
      };

      /**
       * All: Executing a heading command inside a list element corrupts the markup.
       * Disabling for now.
       */
      headingCommand.queryEnabled = function () {
        var selection = new scribe.api.Selection();
        var listNode = selection.getContaining(function (node) {
          return node.nodeName === 'OL' || node.nodeName === 'UL';
        });

        return scribe.api.Command.prototype.queryEnabled.apply(this, arguments)
          && scribe.allowsBlockElements() && ! listNode;
      };

      scribe.commands[commandName] = headingCommand;
    };
  };

});

//# sourceMappingURL=scribe-plugin-heading-command.js.map
},{}]},{},[1])(1)
});