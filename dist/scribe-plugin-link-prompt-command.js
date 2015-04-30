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
        g.scribePluginLinkPromptCommand = f()
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
                    var linkPromptCommand = new scribe.api.Command('createLink');
                    linkPromptCommand.nodeName = 'A';
                    linkPromptCommand.execute = function() {
                        var selection = new scribe.api.Selection();
                        var range = selection.range;
                        var anchorNode = selection.getContaining(function(node) {
                            return node.nodeName === this.nodeName;
                        }.bind(this));
                        var initialLink = anchorNode ? anchorNode.href : '';
                        var link = window.prompt('Enter a link.', initialLink);
                        if (anchorNode) {
                            range.selectNode(anchorNode);
                            selection.selection.removeAllRanges();
                            selection.selection.addRange(range);
                        }
                        if (link) {
                            var urlProtocolRegExp = /^https?\:\/\//;
                            var mailtoProtocolRegExp = /^mailto\:/;
                            if (!urlProtocolRegExp.test(link) && !mailtoProtocolRegExp.test(link)) {
                                if (/@/.test(link)) {
                                    var shouldPrefixEmail = window.confirm('The URL you entered appears to be an email address. ' + 'Do you want to add the required \u201cmailto:\u201d prefix?');
                                    if (shouldPrefixEmail) {
                                        link = 'mailto:' + link;
                                    }
                                }
                                else {
                                    var shouldPrefixLink = window.confirm('The URL you entered appears to be a link. ' + 'Do you want to add the required \u201chttp://\u201d prefix?');
                                    if (shouldPrefixLink) {
                                        link = 'http://' + link;
                                    }
                                }
                            }
                            scribe.api.SimpleCommand.prototype.execute.call(this, link);
                        }
                    };
                    linkPromptCommand.queryState = function() {
                        var selection = new scribe.api.Selection();
                        return !!selection.getContaining(function(node) {
                            return node.nodeName === this.nodeName;
                        }.bind(this));
                    };
                    scribe.commands.linkPrompt = linkPromptCommand;
                };
            };
}, {}]
    }, {}, [1])(1)
});