const { AsyncLocalStorage } = require("node:async_hooks");
const { randomUUID } = require("node:crypto");

const { context, propagation, trace } = require("@opentelemetry/api");
const { resourceFromAttributes } = require("@opentelemetry/resources");
const {
  BatchSpanProcessor,
  ConsoleSpanExporter,
} = require("@opentelemetry/sdk-trace-base");
const { NodeTracerProvider } = require("@opentelemetry/sdk-trace-node");
const {
  SemanticResourceAttributes,
} = require("@opentelemetry/semantic-conventions");
const { OTLPTraceExporter } = require("@opentelemetry/exporter-trace-otlp-http");

const requestStore = new AsyncLocalStorage();
const tracer = trace.getTracer("freshcart-api");

let provider;

class SpanAttributeEnrichmentProcessor {
  onStart(span, parentContext) {
    const requestContext = requestStore.getStore() || getContextFromBaggage(parentContext);
    const defaults = {
      orgId: "unknown",
      requestId: randomUUID(),
      method: "UNKNOWN",
      route: "unknown",
      statusCode: 0,
    };

    const metadata = { ...defaults, ...requestContext };
    span.setAttributes({
      org_id: metadata.orgId,
      request_id: metadata.requestId,
      "http.method": metadata.method,
      "http.route": metadata.route,
      "http.status_code": metadata.statusCode,
    });
  }

  onEnd() {}

  shutdown() {
    return Promise.resolve();
  }

  forceFlush() {
    return Promise.resolve();
  }
}

function getContextFromBaggage(parentContext) {
  const baggage = propagation.getBaggage(parentContext);
  if (!baggage) {
    return null;
  }

  const orgId = baggage.getEntry("org_id")?.value;
  const requestId = baggage.getEntry("request_id")?.value;
  const method = baggage.getEntry("http.method")?.value;
  const route = baggage.getEntry("http.route")?.value;
  const statusCode = Number(baggage.getEntry("http.status_code")?.value || 0);

  return {
    orgId: orgId || "unknown",
    requestId: requestId || randomUUID(),
    method: method || "UNKNOWN",
    route: route || "unknown",
    statusCode,
  };
}

function initializeTracing() {
  if (provider) {
    return Promise.resolve();
  }

  const resource = resourceFromAttributes({
    [SemanticResourceAttributes.SERVICE_NAME]:
      process.env.OTEL_SERVICE_NAME || "freshcart-api",
    [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]:
      process.env.NODE_ENV || "development",
  });

  const spanProcessors = [new SpanAttributeEnrichmentProcessor()];

  if ((process.env.OTEL_TRACES_EXPORTER || "otlp") !== "none") {
    const traceExporter = new OTLPTraceExporter({
      url:
        process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ||
        "http://localhost:4318/v1/traces",
    });
    spanProcessors.push(new BatchSpanProcessor(traceExporter));
  }

  if (process.env.OTEL_DEBUG_EXPORTER === "true") {
    spanProcessors.push(new BatchSpanProcessor(new ConsoleSpanExporter()));
  }

  provider = new NodeTracerProvider({ resource, spanProcessors });
  provider.register();
  return Promise.resolve();
}

async function shutdownTracing() {
  if (provider) {
    await provider.shutdown();
  }
}

function runWithRequestContext(requestContext, callback) {
  return requestStore.run(requestContext, callback);
}

function getRequestContext() {
  return requestStore.getStore();
}

function updateRequestContext(update) {
  const current = requestStore.getStore();
  if (!current) {
    return;
  }

  Object.assign(current, update);
}

function createBaggageFromRequestContext(requestContext) {
  return propagation.createBaggage({
    org_id: { value: requestContext.orgId },
    request_id: { value: requestContext.requestId },
    "http.method": { value: requestContext.method },
    "http.route": { value: requestContext.route },
    "http.status_code": { value: String(requestContext.statusCode) },
  });
}

module.exports = {
  context,
  createBaggageFromRequestContext,
  getRequestContext,
  initializeTracing,
  propagation,
  runWithRequestContext,
  shutdownTracing,
  trace,
  tracer,
  updateRequestContext,
};
