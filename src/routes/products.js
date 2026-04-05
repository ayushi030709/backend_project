const express = require("express");

const { validate } = require("../middleware/validation");
const { listProductsQuerySchema, productParamsSchema } = require("../schemas/products");
const { products } = require("../store/data");
const { AppError, sendSuccess } = require("../utils/http");
const { routeTemplate } = require("../utils/route-template");

const router = express.Router();

router.get(
  "/",
  routeTemplate("/api/products"),
  validate(listProductsQuerySchema, "query"),
  (req, res) => {
    const { category, page, limit } = req.validated.query;

    const filteredProducts = category
      ? products.filter((product) => product.category === category)
      : [...products];

    const start = (page - 1) * limit;
    const data = filteredProducts.slice(start, start + limit);

    return sendSuccess(
      res,
      data,
      200,
      {
        page,
        limit,
        total: filteredProducts.length,
      },
    );
  },
);

router.get(
  "/:id",
  routeTemplate("/api/products/:id"),
  validate(productParamsSchema, "params"),
  (req, res, next) => {
    const product = products.find((item) => item.id === req.params.id);
    if (!product) {
      return next(new AppError(404, "PRODUCT_NOT_FOUND", "Product not found"));
    }
    return sendSuccess(res, product);
  },
);

module.exports = {
  productsRouter: router,
};
