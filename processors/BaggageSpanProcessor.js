"use strict";
exports.__esModule = true;
exports.BaggageSpanProcessor = void 0;
var api_1 = require("@opentelemetry/api");
var BaggageSpanProcessor = /** @class */ (function () {
    function BaggageSpanProcessor() {
    }
    BaggageSpanProcessor.prototype.onStart = function (span, parentContext) {
        var baggage = api_1.propagation.getBaggage(parentContext);
        if (baggage !== undefined) {
            var entries = baggage.getAllEntries();
            entries.forEach(function (bgentry) {
                var value = bgentry[1].value;
                if (value !== undefined) {
                    span.setAttribute(bgentry[0], value);
                }
            });
        }
    };
    BaggageSpanProcessor.prototype.onEnd = function (span) { };
    BaggageSpanProcessor.prototype.shutdown = function () {
        return Promise.resolve();
    };
    BaggageSpanProcessor.prototype.forceFlush = function () {
        return Promise.resolve();
    };
    return BaggageSpanProcessor;
}());
exports.BaggageSpanProcessor = BaggageSpanProcessor;
