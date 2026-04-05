const express = require("express");

const { sendSuccess } = require("../utils/http");
const { routeTemplate } = require("../utils/route-template");

const router = express.Router();

router.get("/healthz", routeTemplate("/healthz"), (_req, res) => {
  return sendSuccess(res, { status: "ok" });
});

module.exports = {
  healthRouter: router,
};

