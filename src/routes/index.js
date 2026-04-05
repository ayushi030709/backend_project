const express = require("express");

const { cartRouter } = require("./cart");
const { checkoutRouter } = require("./checkout");
const { healthRouter } = require("./health");
const { ordersRouter } = require("./orders");
const { productsRouter } = require("./products");

const router = express.Router();

router.use(healthRouter);
router.use("/api/products", productsRouter);
router.use("/api/cart", cartRouter);
router.use("/api/checkout", checkoutRouter);
router.use("/api/orders", ordersRouter);

module.exports = {
  router,
};
