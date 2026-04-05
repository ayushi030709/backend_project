const express = require("express");

const { validate } = require("../middleware/validation");
const { orderParamsSchema } = require("../schemas/checkout");
const { ordersById } = require("../store/data");
const { AppError, sendSuccess } = require("../utils/http");
const { routeTemplate } = require("../utils/route-template");

const router = express.Router();

router.get(
  "/:orderId",
  routeTemplate("/api/orders/:orderId"),
  validate(orderParamsSchema, "params"),
  (req, res, next) => {
    const order = ordersById.get(req.params.orderId);
    if (!order) {
      return next(new AppError(404, "ORDER_NOT_FOUND", "Order not found"));
    }
    return sendSuccess(res, order);
  },
);

module.exports = {
  ordersRouter: router,
};

