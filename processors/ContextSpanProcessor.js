"use strict";
exports.__esModule = true;
exports.ContextSpanProcessor = void 0;
var ContextSpanProcessor = /** @class */ (function () {
    function ContextSpanProcessor(keys) {
        this._keys = [];
        this._keys = keys;
    }
    ContextSpanProcessor.prototype.onStart = function (span, parentContext) {
        this._keys.forEach(function (key) {
            var value = parentContext.getValue(key);
            if (value !== undefined) {
                span.setAttribute(key.toString(), value);
            }
        });
    };
    ContextSpanProcessor.prototype.onEnd = function (span) {
    };
    ContextSpanProcessor.prototype.shutdown = function () {
        return Promise.resolve();
    };
    ContextSpanProcessor.prototype.forceFlush = function () {
        return Promise.resolve();
    };
    return ContextSpanProcessor;
}());
exports.ContextSpanProcessor = ContextSpanProcessor;
