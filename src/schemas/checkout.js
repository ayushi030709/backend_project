const { z } = require("zod");

const checkoutSchema = z.object({
  orgId: z.string().trim().min(2).max(64),
});

const orderParamsSchema = z.object({
  orderId: z.string().trim().min(2).max(128),
});

module.exports = {
  checkoutSchema,
  orderParamsSchema,
};

