const { context, trace, updateRequestContext } = require("../tracing");

function routeTemplate(template) {
  return (req, _res, next) => {
    if (req.requestContext) {
      req.requestContext.route = template;
      updateRequestContext({ route: template });
    }

    const span = trace.getSpan(context.active());
    if (span) {
      span.setAttribute("http.route", template);
    }

    next();
  };
}

module.exports = {
  routeTemplate,
};

