// tracing.js

const process = require('process');
const { Metadata, credentials } = require("@grpc/grpc-js");

const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { CollectorTraceExporter } = require("@opentelemetry/exporter-collector-grpc");
const { diag, DiagConsoleLogger, DiagLogLevel } = require("@opentelemetry/api");
const { SimpleSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { ContextSpanProcessor } = require('./processors/ContextSpanProcessor');
const { BaggageSpanProcessor } = require('./processors/BaggageSpanProcessor');
const { MultiSpanProcessor } = require('./processors/MultiSpanProcessor');
// Setting the default Global logger to use the Console
// And optionally change the logging level (Defaults to INFO)
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.WARN);
const metadata = new Metadata()
metadata.set('x-honeycomb-team', process.env.HONEYCOMB_API_KEY);
metadata.set('x-honeycomb-dataset', process.env.HONEYCOMB_DATASET);
const traceExporter = new CollectorTraceExporter({
  url: 'grpc://api.honeycomb.io:443/',
  credentials: credentials.createSsl(),
  metadata
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'tracing_concepts_server',
  }),
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  spanProcessor: new MultiSpanProcessor([new BaggageSpanProcessor(), new ContextSpanProcessor(["context"]), new SimpleSpanProcessor(traceExporter)])
});

sdk.start()
  .then(() => console.log('Tracing initialized'))
  .catch((error) => console.log('Error initializing tracing', error));

process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});