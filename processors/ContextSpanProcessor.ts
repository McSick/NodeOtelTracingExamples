import {
  SpanProcessor,
  Span,
  ReadableSpan,
  SpanExporter
} from "@opentelemetry/sdk-trace-base";
import {
    ExportResultCode,
    globalErrorHandler,
    suppressTracing,
  } from '@opentelemetry/core';
import { Context, SpanAttributeValue, context, TraceFlags } from "@opentelemetry/api";
export class ContextSpanProcessor implements SpanProcessor {
  private _keys: symbol[] = [];
  constructor(keys: symbol[]) {
    this._keys = keys;
  }

  onStart(span: Span, parentContext: Context): void {
    this._keys.forEach((key: symbol) => {
      let value = parentContext.getValue(key);
      if (value !== undefined) {
        span.setAttribute(key.toString(), value as SpanAttributeValue);
      }
    });
  }
  onEnd(span: ReadableSpan): void {
    
  }
  shutdown(): Promise<void> {
  
    return Promise.resolve();
  }

  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}
