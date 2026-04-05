const cors = require("cors");
const dotenv = require("dotenv");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");

const { errorHandler } = require("./middleware/error-handler");
const { notFoundMiddleware } = require("./middleware/not-found");
const { requestContextMiddleware } = require("./middleware/request-context");
const { router } = require("./routes");

dotenv.config();

function createCorsOptions() {
  const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return {
    origin(origin, callback) {
      // Allows CLI tools or health probes without an Origin header.
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("CORS_ORIGIN_DENIED"));
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "x-org-id", "x-request-id"],
    credentials: false,
    maxAge: 600,
  };
}

function createApp() {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "200kb" }));
  app.use(cors(createCorsOptions()));
  app.use(requestContextMiddleware);
  app.use(
    morgan(
      ":method :url :status :response-time ms request_id=:req[x-request-id] org_id=:req[x-org-id]",
    ),
  );

  app.use(router);
  app.use(notFoundMiddleware);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};

