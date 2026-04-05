const { z } = require("zod");

const addToCartSchema = z.object({
  productId: z.string().trim().min(2).max(64),
  quantity: z.coerce.number().int().min(1).max(100),
  orgId: z.string().trim().min(2).max(64),
});

const cartParamsSchema = z.object({
  orgId: z.string().trim().min(2).max(64),
});

const removeItemParamsSchema = z.object({
  orgId: z.string().trim().min(2).max(64),
  productId: z.string().trim().min(2).max(64),
});

module.exports = {
  addToCartSchema,
  cartParamsSchema,
  removeItemParamsSchema,
};

