"use strict";
exports.__esModule = true;
exports.EventLoopProcessor = void 0;
var lag = 0;
function measureLag() {
    var start = performance.now();
    setTimeout(function () {
        lag = performance.now() - start;
        measureLag(); // Recurse
    });
}
var EventLoopProcessor = /** @class */ (function () {
    function EventLoopProcessor(nextProcessor) {
        measureLag();
        this._nextProcessor = nextProcessor;
    }
    EventLoopProcessor.prototype.onStart = function (span, parentContext) {
        // Save Event Loop Metrics
        span.setAttribute('event_loop_lag', lag);
        if (this._nextProcessor) {
            this._nextProcessor.onStart(span, parentContext);
        }
    };
    EventLoopProcessor.prototype.onEnd = function (span) {
        if (this._nextProcessor) {
            this._nextProcessor.onEnd(span);
        }
    };
    EventLoopProcessor.prototype.shutdown = function () {
        return this._nextProcessor ? this._nextProcessor.shutdown() : Promise.resolve();
    };
    EventLoopProcessor.prototype.forceFlush = function () {
        return this._nextProcessor ? this._nextProcessor.forceFlush() : Promise.resolve();
    };
    return EventLoopProcessor;
}());
exports.EventLoopProcessor = EventLoopProcessor;
