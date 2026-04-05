const products = [
  { id: "p-001", name: "Bananas", category: "produce", price: 1.2, currency: "USD" },
  { id: "p-002", name: "Milk 1L", category: "dairy", price: 2.5, currency: "USD" },
  { id: "p-003", name: "Brown Bread", category: "bakery", price: 2.2, currency: "USD" },
  { id: "p-004", name: "Tomatoes", category: "produce", price: 1.8, currency: "USD" },
  { id: "p-005", name: "Eggs (12 pack)", category: "dairy", price: 3.4, currency: "USD" },
  { id: "p-006", name: "Pasta", category: "pantry", price: 1.6, currency: "USD" },
  { id: "p-007", name: "Olive Oil", category: "pantry", price: 7.8, currency: "USD" },
];

const cartsByOrg = new Map();
const ordersById = new Map();

module.exports = {
  cartsByOrg,
  ordersById,
  products,
};

