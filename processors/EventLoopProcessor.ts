import { SpanProcessor, Span } from '@opentelemetry/sdk-trace-base';
import { Context } from "@opentelemetry/api";
let lag:number = 0;
function measureLag() {
  const start:number = performance.now();
  setTimeout(() => {
    lag = performance.now() - start;
    measureLag() // Recurse
  })
}
export class EventLoopProcessor implements SpanProcessor {
    private _nextProcessor?: SpanProcessor;
    private _eventLoopMetrics: any;

    constructor(nextProcessor?: SpanProcessor) {
      measureLag();
      this._nextProcessor = nextProcessor;
    }
    onStart(span: Span, parentContext: Context): void {
    // Save Event Loop Metrics
    span.setAttribute('event_loop_lag',lag);
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
