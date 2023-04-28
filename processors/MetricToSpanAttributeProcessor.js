"use strict";
exports.__esModule = true;
exports.MetricToSpanAttributeProcessor = void 0;
var MetricToSpanAttributeProcessor = /** @class */ (function () {
    function MetricToSpanAttributeProcessor(exporter, nextProcessor) {
        this._nextProcessor = nextProcessor;
        this._metrics_exporter = exporter;
    }
    MetricToSpanAttributeProcessor.prototype.onStart = function (span, parentContext) {
        var metrics = this._metrics_exporter.getMetrics();
        if (metrics.length > 0) {
            metrics.forEach(function (m) {
                m.scopeMetrics.forEach(function (s) {
                    s.metrics.forEach(function (metric) {
                        //console.log("here")
                        var value = (metric.dataPoints.length ? metric.dataPoints[0].value ? metric.dataPoints[0].value : 0 : 0);
                        // console.log(`Name: ${metric.descriptor.name} Value: ${value}`);
                        span.setAttribute(metric.descriptor.name, value);
                        //console.log(metric);
                    });
                });
            });
        }
        else {
            //  console.log('no metrics')
        }
        if (this._nextProcessor) {
            this._nextProcessor.onStart(span, parentContext);
        }
    };
    MetricToSpanAttributeProcessor.prototype.onEnd = function (span) {
        if (this._nextProcessor) {
            this._nextProcessor.onEnd(span);
        }
    };
    MetricToSpanAttributeProcessor.prototype.shutdown = function () {
        return this._nextProcessor ? this._nextProcessor.shutdown() : Promise.resolve();
    };
    MetricToSpanAttributeProcessor.prototype.forceFlush = function () {
        return this._nextProcessor ? this._nextProcessor.forceFlush() : Promise.resolve();
    };
    return MetricToSpanAttributeProcessor;
}());
exports.MetricToSpanAttributeProcessor = MetricToSpanAttributeProcessor;
