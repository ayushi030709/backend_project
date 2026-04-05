const { z } = require("zod");

const listProductsQuerySchema = z.object({
  category: z.string().trim().min(1).max(50).optional(),
  page: z.coerce.number().int().min(1).max(1000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

const productParamsSchema = z.object({
  id: z.string().trim().min(2).max(64),
});

module.exports = {
  listProductsQuerySchema,
  productParamsSchema,
};

