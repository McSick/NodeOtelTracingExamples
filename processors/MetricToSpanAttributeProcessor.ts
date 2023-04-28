import { SpanProcessor, Span } from '@opentelemetry/sdk-trace-base';
import { InMemoryMetricExporter } from '@opentelemetry/sdk-metrics';
import { Context } from "@opentelemetry/api";

export class MetricToSpanAttributeProcessor implements SpanProcessor {
    private _metrics_exporter: InMemoryMetricExporter;
    private _nextProcessor?: SpanProcessor;
  

    constructor(exporter: InMemoryMetricExporter, nextProcessor?: SpanProcessor) {
      this._nextProcessor = nextProcessor;
      this._metrics_exporter = exporter;
    }
    onStart(span: Span, parentContext: Context): void {
      // DO NOT USE. SO TERRIBLE AND INNEFICIENT
       let metrics = this._metrics_exporter.getMetrics();
       if(metrics.length > 0) {
            metrics.forEach(m => {
                m.scopeMetrics.forEach(s => {
                    s.metrics.forEach(metric => {
                            let value: number = (metric.dataPoints.length ? metric.dataPoints[0].value ? metric.dataPoints[0].value : 0 : 0) as number;
                            span.setAttribute(metric.descriptor.name, value);
                    });

                });
                
            });
       }
      
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
