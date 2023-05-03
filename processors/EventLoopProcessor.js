"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventLoopProcessor = void 0;
var perf_hooks_1 = require("perf_hooks");
var EventLoopProcessor = /** @class */ (function () {
    function EventLoopProcessor(config, nextProcessor) {
        var _a;
        // Set the collection interval with a default value of 10000ms
        var interval = (_a = config === null || config === void 0 ? void 0 : config.collectionInterval) !== null && _a !== void 0 ? _a : 10000;
        var processor = this;
        processor._elu1 = perf_hooks_1.performance.eventLoopUtilization();
        processor._eventLoopDelay = (0, perf_hooks_1.monitorEventLoopDelay)({ resolution: interval });
        processor._eventLoopDelay.enable();
        setInterval(function () {
            processor.takeEluMeasurement();
        }, interval);
        processor._nextProcessor = nextProcessor;
    }
    EventLoopProcessor.prototype.takeEluMeasurement = function () {
        var newelu = perf_hooks_1.performance.eventLoopUtilization(this._elu1);
        this._elu1 = newelu;
    };
    EventLoopProcessor.prototype.onStart = function (span, parentContext) {
        // Save event loop metrics as span attributes
        // Event Loop Utilization (ELU) Metrics
        span.setAttribute("node.elu.active", this._elu1.active);
        // active: The active time in milliseconds spent running tasks on the event loop
        //         during the measurement interval. A high value indicates high CPU usage.
        span.setAttribute("node.elu.idle", this._elu1.idle);
        // idle: The idle time in milliseconds spent waiting for tasks on the event loop
        //       during the measurement interval. A high value indicates low CPU usage.
        span.setAttribute("node.elu.utilization", this._elu1.utilization);
        // utilization: The fraction of time spent running tasks on the event loop
        //              during the measurement interval. A value close to 1 indicates high CPU usage,
        //              while a value close to 0 indicates low CPU usage.
        // Event Loop Delay (ELD) Metrics
        span.setAttribute("node.eld.min", this._eventLoopDelay.min);
        // min: The minimum delay in nanoseconds between scheduled tasks during the measurement interval.
        //      A low value indicates that tasks are being executed with minimal delay.
        span.setAttribute("node.eld.max", this._eventLoopDelay.max);
        // max: The maximum delay in nanoseconds between scheduled tasks during the measurement interval.
        //      A high value indicates that some tasks may have experienced significant delay.
        span.setAttribute("node.eld.mean", this._eventLoopDelay.mean);
        // mean: The average delay in nanoseconds between scheduled tasks during the measurement interval.
        //       A high value may indicate that the event loop is consistently experiencing delays.
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
