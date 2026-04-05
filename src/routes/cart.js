const express = require("express");

const { validate } = require("../middleware/validation");
const { addToCartSchema, cartParamsSchema, removeItemParamsSchema } = require("../schemas/cart");
const { cartsByOrg, products } = require("../store/data");
const { AppError, sendSuccess } = require("../utils/http");
const { routeTemplate } = require("../utils/route-template");

const router = express.Router();

router.post(
  "/",
  routeTemplate("/api/cart"),
  validate(addToCartSchema, "body"),
  (req, res, next) => {
    const { productId, quantity, orgId } = req.body;
    const product = products.find((item) => item.id === productId);
    if (!product) {
      return next(new AppError(404, "PRODUCT_NOT_FOUND", "Product not found"));
    }

    const cart = cartsByOrg.get(orgId) || [];
    const existing = cart.find((item) => item.productId === productId);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({ productId, quantity });
    }
    cartsByOrg.set(orgId, cart);

    return sendSuccess(res, { orgId, items: cart }, 201);
  },
);

router.get(
  "/:orgId",
  routeTemplate("/api/cart/:orgId"),
  validate(cartParamsSchema, "params"),
  (req, res, next) => {
    const { orgId } = req.params;
    const cart = cartsByOrg.get(orgId);
    if (!cart) {
      return next(new AppError(404, "CART_NOT_FOUND", "Cart not found"));
    }
    return sendSuccess(res, { orgId, items: cart });
  },
);

router.delete(
  "/:orgId/items/:productId",
  routeTemplate("/api/cart/:orgId/items/:productId"),
  validate(removeItemParamsSchema, "params"),
  (req, res, next) => {
    const { orgId, productId } = req.params;
    const cart = cartsByOrg.get(orgId);
    if (!cart) {
      return next(new AppError(404, "CART_NOT_FOUND", "Cart not found"));
    }

    const nextCart = cart.filter((item) => item.productId !== productId);
    if (nextCart.length === cart.length) {
      return next(new AppError(404, "CART_ITEM_NOT_FOUND", "Cart item not found"));
    }

    if (nextCart.length === 0) {
      cartsByOrg.delete(orgId);
    } else {
      cartsByOrg.set(orgId, nextCart);
    }

    return sendSuccess(res, { orgId, items: nextCart });
  },
);

module.exports = {
  cartRouter: router,
};

