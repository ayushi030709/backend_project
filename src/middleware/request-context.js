const { randomUUID } = require("node:crypto");
const { SpanStatusCode } = require("@opentelemetry/api");

const { context, createBaggageFromRequestContext, propagation, runWithRequestContext, trace, updateRequestContext } = require("../tracing");

function getOrgId(req) {
  if (typeof req.headers["x-org-id"] === "string" && req.headers["x-org-id"].trim()) {
    return req.headers["x-org-id"].trim();
  }

  if (req.body && typeof req.body.orgId === "string" && req.body.orgId.trim()) {
    return req.body.orgId.trim();
  }

  if (typeof req.params?.orgId === "string" && req.params.orgId.trim()) {
    return req.params.orgId.trim();
  }

  return "unknown";
}

function requestContextMiddleware(req, res, next) {
  const requestId = randomUUID();
  const requestContext = {
    orgId: getOrgId(req),
    requestId,
    method: req.method,
    route: req.path || "unknown",
    statusCode: 200,
    startTime: Date.now(),
  };

  res.locals.requestId = requestId;
  res.setHeader("x-request-id", requestId);

  const rootSpan = trace.getTracer("freshcart-api").startSpan(`${req.method} ${req.path}`);
  rootSpan.setAttributes({
    org_id: requestContext.orgId,
    request_id: requestContext.requestId,
    "http.method": requestContext.method,
    "http.route": requestContext.route,
    "http.status_code": requestContext.statusCode,
  });

  const spanContext = trace.setSpan(context.active(), rootSpan);
  const baggage = createBaggageFromRequestContext(requestContext);
  const enrichedContext = propagation.setBaggage(spanContext, baggage);

  let finalized = false;

  const finalizeSpan = () => {
    if (finalized) {
      return;
    }
    finalized = true;

    requestContext.statusCode = res.statusCode;
    const durationMs = Date.now() - requestContext.startTime;

    rootSpan.setAttributes({
      "http.status_code": requestContext.statusCode,
      "http.route": requestContext.route,
      "request.duration_ms": durationMs,
    });

    if (typeof requestContext.checkoutSuccess === "boolean") {
      rootSpan.setAttribute("checkout.success", requestContext.checkoutSuccess);
    }

    if (requestContext.statusCode >= 400) {
      rootSpan.setStatus({ code: SpanStatusCode.ERROR, message: "request_failed" });
    } else {
      rootSpan.setStatus({ code: SpanStatusCode.OK });
    }
    rootSpan.end();
  };

  res.once("finish", finalizeSpan);
  res.once("close", finalizeSpan);

  runWithRequestContext(requestContext, () => {
    context.with(enrichedContext, () => {
      req.requestContext = requestContext;
      updateRequestContext({ requestId, orgId: requestContext.orgId });
      next();
    });
  });
}

module.exports = {
  requestContextMiddleware,
};
