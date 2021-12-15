import {
  SpanProcessor,
  Span,
  ReadableSpan,
} from "@opentelemetry/sdk-trace-base";
import { Context, propagation, BaggageEntry } from "@opentelemetry/api";
export class BaggageSpanProcessor implements SpanProcessor {
  constructor() {}

  onStart(span: Span, parentContext: Context): void {
    let baggage = propagation.getBaggage(parentContext);

    if (baggage !== undefined) {
      let entries = baggage.getAllEntries();

      entries.forEach((bgentry: [string, BaggageEntry]) => {
        let value = bgentry[1].value;
        if (value !== undefined) {
          span.setAttribute(bgentry[0], value);
        }
      });
    }
  }
  onEnd(span: ReadableSpan): void {}
  shutdown(): Promise<void> {
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}
