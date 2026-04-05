const { SpanStatusCode, context } = require("@opentelemetry/api");

const { tracer, trace, getRequestContext } = require("../tracing");

function simulatePayment({ amount, currency, orgId }) {
  return tracer.startActiveSpan("payment.simulation", (span) => {
    const currentContext = context.active();

    span.setAttributes({
      "payment.amount": amount,
      "payment.currency": currency,
      org_id: orgId,
    });

    return new Promise((resolve, reject) => {
      const delayMs = Math.floor(Math.random() * 500) + 200;
      const shouldFail = Math.random() < 0.1;

      setTimeout(() => {
        context.with(currentContext, () => {
          const requestContext = getRequestContext();
          if (requestContext) {
            span.setAttribute("request_id", requestContext.requestId);
          }

          span.setAttribute("payment.duration_ms", delayMs);
          span.setAttribute("payment.success", !shouldFail);

          if (shouldFail) {
            const error = new Error("Payment authorization failed");
            span.recordException(error);
            span.setStatus({
              code: SpanStatusCode.ERROR,
              message: error.message,
            });
            span.end();
            reject(error);
            return;
          }

          const paymentId = `pay_${Date.now()}`;
          span.setAttributes({
            "payment.id": paymentId,
          });
          span.setStatus({ code: SpanStatusCode.OK });
          span.end();
          resolve({
            paymentId,
            amount,
            currency,
          });
        });
      }, delayMs);
    });
  });
}

function calculateCartTotal(cartItems, productsById) {
  return tracer.startActiveSpan("cart.total.calculate", (span) => {
    let total = 0;
    for (const item of cartItems) {
      const product = productsById.get(item.productId);
      if (!product) {
        continue;
      }
      total += product.price * item.quantity;
    }

    span.setAttributes({
      "cart.item_count": cartItems.length,
      "cart.total_usd": Number(total.toFixed(2)),
      "trace.id": trace.getSpan(context.active())?.spanContext().traceId || "unknown",
    });
    span.end();
    return Number(total.toFixed(2));
  });
}

module.exports = {
  calculateCartTotal,
  simulatePayment,
};

