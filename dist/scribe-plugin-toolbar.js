(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.scribePluginToolbar = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
define('scribe-plugin-toolbar',[],function () {

  

  return function (toolbarNode) {
    return function (scribe) {
      var buttons = toolbarNode.querySelectorAll('[data-command-name]');

      Array.prototype.forEach.call(buttons, function (button) {
        button.addEventListener('click', function () {
          // Look for a predefined command.
          var command = scribe.getCommand(button.dataset.commandName);

          /**
           * Focus will have been taken away from the Scribe instance when
           * clicking on a button (Chrome will return the focus automatically
           * but only if the selection is not collapsed. As per: http://jsbin.com/tupaj/1/edit?html,js,output).
           * It is important that we focus the instance again before executing
           * the command, because it might rely on selection data.
           */
          scribe.el.focus();
          command.execute(button.dataset.commandValue);
          /**
           * Chrome has a bit of magic to re-focus the `contenteditable` when a
           * command is executed.
           * As per: http://jsbin.com/papi/1/edit?html,js,output
           */
        });

        // Keep the state of toolbar buttons in sync with the current selection.
        // Unfortunately, there is no `selectionchange` event.
        scribe.el.addEventListener('keyup', updateUi);
        scribe.el.addEventListener('mouseup', updateUi);

        scribe.el.addEventListener('focus', updateUi);
        scribe.el.addEventListener('blur', updateUi);

        // We also want to update the UI whenever the content changes. This
        // could be when one of the toolbar buttons is actioned.
        scribe.on('content-changed', updateUi);

        function updateUi() {
          // Look for a predefined command.
          var command = scribe.getCommand(button.dataset.commandName);

          var selection = new scribe.api.Selection();

          // TODO: Do we need to check for the selection?
          if (selection.range && command.queryState(button.dataset.commandValue)) {
            button.classList.add('active');
          } else {
            button.classList.remove('active');
          }

          if (selection.range && command.queryEnabled()) {
            button.removeAttribute('disabled');
          } else {
            button.setAttribute('disabled', 'disabled');
          }
        }
      });
    };
  };

});


//# sourceMappingURL=scribe-plugin-toolbar.js.map
},{}]},{},[1])(1)
});