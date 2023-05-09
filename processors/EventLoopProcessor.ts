// Copyright The OpenTelemetry Authors
// SPDX-License-Identifier: Apache-2.0

import { SpanProcessor, Span } from '@opentelemetry/sdk-trace-base';
import { Context } from "@opentelemetry/api";
import { performance, monitorEventLoopDelay } from 'perf_hooks';

interface EventLoopProcessorConfig {
    collectionInterval?: number;
    eventLoopDelayResolution?: number;
}

interface EventLoopDelayMeasurement {
    min: number;
    max: number;
    mean: number;
}
export class EventLoopProcessor implements SpanProcessor {
    private _nextProcessor?: SpanProcessor;
    private _eventLoopDelay: ReturnType<typeof monitorEventLoopDelay> = {} as ReturnType<typeof monitorEventLoopDelay>;
    private _elu1: ReturnType<typeof performance.eventLoopUtilization> = {} as ReturnType<typeof performance.eventLoopUtilization>;
    private _eludiff: ReturnType<typeof performance.eventLoopUtilization> = {} as ReturnType<typeof performance.eventLoopUtilization>;
    private _eventLoopDelayMeasurement: EventLoopDelayMeasurement = { min: 0, max: 0, mean: 0} as EventLoopDelayMeasurement;

    constructor(config?: EventLoopProcessorConfig, nextProcessor?: SpanProcessor) {
        // Set the collection interval with a default value of 10000ms
        const interval = config?.collectionInterval ?? 10000;
        const resolution = config?.eventLoopDelayResolution ?? 10;

        // eslint-disable-next-line @typescript-eslint/no-this-alias
        const processor = this;
        processor._elu1 = performance.eventLoopUtilization();
        processor._eludiff = performance.eventLoopUtilization(processor._elu1);
        processor._eventLoopDelay = monitorEventLoopDelay({ resolution: resolution });
        processor._eventLoopDelay.enable();
        setInterval(() => {
            processor.takeEluMeasurement();
            processor.takeEldMeasurement();
        }, interval);
        processor._nextProcessor = nextProcessor;
    }
    private takeEluMeasurement(): void {
        // the delta between the current call's active and idle times, as well as the corresponding utilization value are calculated and returned
        this._eludiff = performance.eventLoopUtilization(this._elu1);
        this._elu1 = performance.eventLoopUtilization();
    }
    private takeEldMeasurement(): void {
        this._eventLoopDelayMeasurement.max = this._eventLoopDelay.max;
        this._eventLoopDelayMeasurement.min = this._eventLoopDelay.min;
        this._eventLoopDelayMeasurement.mean = this._eventLoopDelay.mean;

    }
    onStart(span: Span, parentContext: Context): void {

        // Save event loop metrics as span attributes
        // Event Loop Utilization (ELU) Metrics
        span.setAttribute("node.elu.active", this._eludiff.active);
        // active: The active time in milliseconds spent running tasks on the event loop
        //         during the measurement interval. A high value indicates high CPU usage.

        span.setAttribute("node.elu.idle", this._eludiff.idle);
        // idle: The idle time in milliseconds spent waiting for tasks on the event loop
        //       during the measurement interval. A high value indicates low CPU usage.

        span.setAttribute("node.elu.utilization", this._eludiff.utilization);
        // utilization: The fraction of time spent running tasks on the event loop
        //              during the measurement interval. A value close to 1 indicates high CPU usage,
        //              while a value close to 0 indicates low CPU usage.

        // Event Loop Delay (ELD) Metrics
        span.setAttribute("node.eld.min", this._eventLoopDelayMeasurement.min / 1000);
        // min: The minimum delay in milliseconds between scheduled tasks during the measurement interval.
        //      A low value indicates that tasks are being executed with minimal delay.

        span.setAttribute("node.eld.max", this._eventLoopDelayMeasurement.max / 1000);
        // max: The maximum delay in milliseconds between scheduled tasks during the measurement interval.
        //      A high value indicates that some tasks may have experienced significant delay.

        span.setAttribute("node.eld.avg", this._eventLoopDelayMeasurement.mean / 1000);
        // mean: The average delay in milliseconds between scheduled tasks during the measurement interval.
        //       A high value may indicate that the event loop is consistently experiencing delays.

        if (this._nextProcessor) {
            this._nextProcessor.onStart(span, parentContext);
        }
    }

    onEnd(span: Span): void {
        if (this._nextProcessor) {
            this._nextProcessor.onEnd(span);
        }
    }

    shutdown(): Promise<void> {
        return this._nextProcessor ? this._nextProcessor.shutdown() : Promise.resolve();
    }

    forceFlush(): Promise<void> {
        return this._nextProcessor ? this._nextProcessor.forceFlush() : Promise.resolve();
    }
}