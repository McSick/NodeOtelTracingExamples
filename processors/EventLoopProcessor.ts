import { SpanProcessor, Span } from '@opentelemetry/sdk-trace-base';
import { Context } from "@opentelemetry/api";
import { performance, monitorEventLoopDelay } from 'perf_hooks';

interface EventLoopProcessorConfig {
  collectionInterval?: number;
}
export class EventLoopProcessor implements SpanProcessor {
  private _nextProcessor?: SpanProcessor;
  private _eventLoopDelay: ReturnType<typeof monitorEventLoopDelay>;
  private _elu1: ReturnType<typeof performance.eventLoopUtilization>;

  constructor(config?: EventLoopProcessorConfig, nextProcessor?: SpanProcessor) {
    // Set the collection interval with a default value of 10000ms
    const interval = config?.collectionInterval ?? 10000; 
    
    const processor = this;
    processor._elu1 = performance.eventLoopUtilization();
    processor._eventLoopDelay = monitorEventLoopDelay({ resolution: interval });
    processor._eventLoopDelay.enable();
    setInterval(() => {
      processor.takeEluMeasurement();
    }, interval);
    processor._nextProcessor = nextProcessor;
  }
  private takeEluMeasurement(): void {
    const newelu = performance.eventLoopUtilization(this._elu1);
    this._elu1 = newelu;
  }
  onStart(span: Span, parentContext: Context): void {

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
    // min: The minimum delay in milliseconds between scheduled tasks during the measurement interval.
    //      A low value indicates that tasks are being executed with minimal delay.

    span.setAttribute("node.eld.max", this._eventLoopDelay.max);
    // max: The maximum delay in milliseconds between scheduled tasks during the measurement interval.
    //      A high value indicates that some tasks may have experienced significant delay.

    span.setAttribute("node.eld.mean", this._eventLoopDelay.mean);
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
