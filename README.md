# FreshCart Backend - Observability Assessment

Express.js backend for FreshCart with required APIs, security controls, OpenTelemetry tracing, and Elastic alerting pipeline artifacts.

## What is implemented

- Required endpoints:
  - `GET /healthz`
  - `GET /api/products?category=&page=&limit=`
  - `GET /api/products/:id`
  - `POST /api/cart`
  - `GET /api/cart/:orgId`
  - `DELETE /api/cart/:orgId/items/:productId`
  - `POST /api/checkout`
  - `GET /api/orders/:orderId`
- Security baseline:
  - Explicit CORS policy
  - Helmet headers
  - Validation on all POST endpoints (Zod-based middleware)
  - Checkout rate limiting
  - Non-leaky production error responses
  - Environment-based configuration and secrets handling
- OpenTelemetry:
  - Request-scoped `request_id` generation (`crypto.randomUUID`)
  - `org_id`, `request_id`, `http.method`, `http.route`, `http.status_code` enrichment
  - Async checkout payment step traced under same request trace
  - Manual spans:
    - `input.validation`
    - `cart.total.calculate`
    - `payment.simulation`
- Elastic artifacts:
  - ILM policy JSON
  - Index template JSON with keyword mapping for `org_id` and `request_id`
  - Transform JSON for log/trace to metrics conversion
  - 3 Kibana alert rule payloads + setup script

## Quick start (under 10 minutes)

### Option 1: App only

1. Install dependencies:
   - `npm install`
2. Copy environment file:
   - `Copy-Item .env.example .env`
3. Start API:
   - `npm run start`

### Option 2: Full stack (App + OTel Collector + Elasticsearch + Kibana)

1. Start containers:
   - `docker compose up --build -d`
2. Wait for Elasticsearch and Kibana to be reachable:
   - `curl http://localhost:9200`
   - `curl http://localhost:5601`
3. Apply Elastic/Kibana config:
   - `powershell -ExecutionPolicy Bypass -File scripts/setup-elastic.ps1`
4. Send traffic to generate telemetry:
   - `curl http://localhost:3000/healthz`
   - `curl "http://localhost:3000/api/products?page=1&limit=3"`
   - `curl -X POST http://localhost:3000/api/cart -H "Content-Type: application/json" -d "{\"productId\":\"p-001\",\"quantity\":2,\"orgId\":\"org-alpha\"}"`
   - `curl -X POST http://localhost:3000/api/checkout -H "Content-Type: application/json" -d "{\"orgId\":\"org-alpha\"}"`

Kibana: `http://localhost:5601`  
User: `elastic`  
Password: `changeme`

## Elastic files in repo

- ILM policy: `elastic/ilm-policy.json`
- Index template: `elastic/index-template.json`
- Transform: `elastic/transform-checkout-metrics.json`
- Kibana rules:
  - `kibana/rules/high-checkout-error-rate.json`
  - `kibana/rules/high-checkout-latency.json`
  - `kibana/rules/low-checkout-success-rate.json`
- Setup automation: `scripts/setup-elastic.ps1`

## Notes

- Business data is intentionally in-memory for assessment scope.
- `POST /api/checkout` intentionally fails ~10% of requests for observable failure behavior.
- `audit.txt` should be generated with:
  - `npm run audit`
