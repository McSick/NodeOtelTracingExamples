// tracing.js

const process = require('process');
const otel = require('@opentelemetry/api')
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-proto");

const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");
const { BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { ContextSpanProcessor } = require('./processors/ContextSpanProcessor');
const { BaggageSpanProcessor } = require('./processors/BaggageSpanProcessor');
const { EventLoopProcessor } = require('./processors/EventLoopProcessor');
const { MultiSpanProcessor } = require('./processors/MultiSpanProcessor');
const { MetricToSpanAttributeProcessor } = require('./processors/MetricToSpanAttributeProcessor');
const {
  InMemoryMetricExporter,
  MeterProvider,
  PeriodicExportingMetricReader,
  ConsoleMetricExporter
} = require('@opentelemetry/sdk-metrics');
const { trace } = require("@opentelemetry/api");

const { SpanProcessor } = require('@opentelemetry/sdk-trace-base');


const resource =
  Resource.default().merge(
    new Resource({
      [SemanticResourceAttributes.SERVICE_VERSION]: "0.1.0",
    })
  );

const inMemoryMetricsExporter = new InMemoryMetricExporter();
const metricReader = new PeriodicExportingMetricReader({
  exporter: inMemoryMetricsExporter,

  // Default is 60000ms (60 seconds). Set to 3 seconds for demonstrative purposes only.
  exportIntervalMillis: 3000,
});
const myServiceMeterProvider = new MeterProvider({
  resource: resource,
});
myServiceMeterProvider.addMetricReader(metricReader);
// Set this MeterProvider to be global to the app being instrumented.
otel.metrics.setGlobalMeterProvider(myServiceMeterProvider)

// Setting the default Global logger to use the Console
// And optionally change the logging level (Defaults to INFO)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);
const traceExporter = new OTLPTraceExporter({
  url: 'https://api.honeycomb.io:443/v1/traces'
});

const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  spanProcessor: new EventLoopProcessor({ collectionInterval: 1000 }, new BatchSpanProcessor(traceExporter))
});

sdk.start();

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});