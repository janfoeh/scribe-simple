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
        g.scribePluginIntelligentUnlinkCommand = f()
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
            'use strict';
            module.exports = function() {
                return function(scribe) {
                    var element = scribe.element;
                    var unlinkCommand = new scribe.api.Command('unlink');
                    unlinkCommand.execute = function() {
                        var selection = new scribe.api.Selection();
                        if (selection.selection.isCollapsed) {
                            scribe.transactionManager.run(function() {
                                var aNode = selection.getContaining(function(node) {
                                    return node.nodeName === 'A';
                                });
                                if (aNode) {
                                    selection.placeMarkers();
                                    element.unwrap(aNode.parentNode, aNode);
                                    selection.selectMarkers();
                                }
                            });
                        }
                        else {
                            scribe.api.Command.prototype.execute.apply(this, arguments);
                        }
                    };
                    unlinkCommand.queryEnabled = function() {
                        var selection = new scribe.api.Selection();
                        if (selection.selection.isCollapsed) {
                            return !!selection.getContaining(function(node) {
                                return node.nodeName === 'A';
                            });
                        }
                        else {
                            return scribe.api.Command.prototype.queryEnabled.apply(this, arguments);
                        }
                    };
                    scribe.commands.unlink = unlinkCommand;
                };
            };
}, {}]
    }, {}, [1])(1)
});