const { tracer } = require("../tracing");
const { AppError } = require("../utils/http");

function validate(schema, source) {
  return (req, _res, next) => {
    tracer.startActiveSpan("input.validation", (span) => {
      span.setAttributes({
        "validation.source": source,
      });

      try {
        const parseResult = schema.safeParse(req[source]);
        if (!parseResult.success) {
          span.setAttribute("validation.success", false);
          span.recordException(parseResult.error);
          span.end();
          return next(
            new AppError(400, "VALIDATION_ERROR", "Invalid request input", parseResult.error.flatten()),
          );
        }

        req.validated = req.validated || {};
        req.validated[source] = parseResult.data;
        req[source] = parseResult.data;
        span.setAttribute("validation.success", true);
        span.end();
        return next();
      } catch (error) {
        span.setAttribute("validation.success", false);
        span.recordException(error);
        span.end();
        return next(new AppError(400, "VALIDATION_ERROR", "Invalid request input"));
      }
    });
  };
}

module.exports = {
  validate,
};
