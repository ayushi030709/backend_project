const express = require("express");
const { randomUUID } = require("node:crypto");
const rateLimit = require("express-rate-limit");

const { validate } = require("../middleware/validation");
const { checkoutSchema } = require("../schemas/checkout");
const { calculateCartTotal, simulatePayment } = require("../services/payment");
const { cartsByOrg, ordersById, products } = require("../store/data");
const { AppError, sendSuccess } = require("../utils/http");
const { routeTemplate } = require("../utils/route-template");

const router = express.Router();

const checkoutRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: {
      code: "RATE_LIMITED",
      message: "Too many checkout requests. Please retry shortly.",
    },
  },
});

router.post(
  "/",
  checkoutRateLimit,
  routeTemplate("/api/checkout"),
  validate(checkoutSchema, "body"),
  async (req, res, next) => {
    const { orgId } = req.body;
    const cart = cartsByOrg.get(orgId);
    if (!cart || cart.length === 0) {
      return next(new AppError(404, "CART_NOT_FOUND", "Cart not found for org"));
    }

    const productsById = new Map(products.map((product) => [product.id, product]));
    const total = calculateCartTotal(cart, productsById);

    try {
      const payment = await simulatePayment({
        amount: total,
        currency: "USD",
        orgId,
      });

      const orderId = `ord_${randomUUID()}`;
      const order = {
        orderId,
        orgId,
        status: "confirmed",
        paymentId: payment.paymentId,
        total,
        currency: payment.currency,
        items: cart,
        createdAt: new Date().toISOString(),
      };

      ordersById.set(orderId, order);
      cartsByOrg.delete(orgId);
      if (req.requestContext) {
        req.requestContext.checkoutSuccess = true;
      }
      return sendSuccess(res, order, 201);
    } catch (_error) {
      if (req.requestContext) {
        req.requestContext.checkoutSuccess = false;
      }
      return next(new AppError(402, "PAYMENT_FAILED", "Payment failed, please retry checkout"));
    }
  },
);

module.exports = {
  checkoutRouter: router,
};
