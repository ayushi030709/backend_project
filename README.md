# FreshCart Backend – Observability Assessment

This project is an Express.js-based backend for FreshCart, designed to demonstrate production-grade API design, security best practices, and observability using OpenTelemetry and Elastic Stack.

---

## Overview

The backend exposes core e-commerce APIs for products, cart management, and checkout, while integrating distributed tracing and monitoring pipelines for observability.

The system is intentionally designed to simulate real-world production behavior, including partial failures and telemetry generation.

---

## Features

### API Endpoints

Health Check
- GET /healthz

Products
- GET /api/products?category=&page=&limit=
- GET /api/products/:id

Cart
- POST /api/cart
- GET /api/cart/:orgId
- DELETE /api/cart/:orgId/items/:productId

Checkout & Orders
- POST /api/checkout
- GET /api/orders/:orderId

---

### Security Implementation

- Strict CORS policy
- Secure HTTP headers using Helmet
- Request validation using Zod middleware
- Rate limiting on checkout endpoint
- Sanitized error responses in production
- Environment-based configuration and secret handling

---

### Observability (OpenTelemetry)

The application includes distributed tracing with enriched metadata for better debugging and monitoring.

Trace Attributes
- request_id generated per request
- org_id
- http.method
- http.route
- http.status_code

Custom Spans
- input.validation
- cart.total.calculate
- payment.simulation

Additional Behavior
- Checkout flow includes asynchronous payment simulation
- All operations are traced under a single request context

---

### Elastic Stack Integration

The repository includes configuration files to support log ingestion, indexing, and alerting.

Included Artifacts
- ILM Policy
- Index Template with mappings for org_id and request_id
- Transform for converting logs/traces into metrics
- Predefined Kibana alert rules

---

## Project Setup

### Option 1: Run Application Only

1. Install dependencies
   npm install

2. Configure environment variables
   Copy-Item .env.example .env

3. Start the server
   npm run start

---

### Option 2: Full Observability Stack

This option runs the application along with OpenTelemetry Collector, Elasticsearch, and Kibana.

1. Start services
   docker compose up --build -d

2. Verify services are running
   curl http://localhost:9200  
   curl http://localhost:5601

3. Apply Elastic and Kibana configuration
   powershell -ExecutionPolicy Bypass -File scripts/setup-elastic.ps1

4. Generate sample traffic
   curl http://localhost:3000/healthz

   curl "http://localhost:3000/api/products?page=1&limit=3"

   curl -X POST http://localhost:3000/api/cart \
   -H "Content-Type: application/json" \
   -d "{\"productId\":\"p-001\",\"quantity\":2,\"orgId\":\"org-alpha\"}"

   curl -X POST http://localhost:3000/api/checkout \
   -H "Content-Type: application/json" \
   -d "{\"orgId\":\"org-alpha\"}"

---

## Access Kibana

URL: http://localhost:5601  
Username: elastic  
Password: changeme  

---

## Elastic Configuration Files

- elastic/ilm-policy.json
- elastic/index-template.json
- elastic/transform-checkout-metrics.json

Kibana Alert Rules
- kibana/rules/high-checkout-error-rate.json
- kibana/rules/high-checkout-latency.json
- kibana/rules/low-checkout-success-rate.json

Setup Script
- scripts/setup-elastic.ps1

---

## Notes

- Data is stored in-memory for simplicity and assessment purposes
- The checkout endpoint intentionally fails approximately 10 percent of requests to simulate real-world failure scenarios
- Generate dependency audit report:
  npm run audit

---

## Purpose of the Project

This project demonstrates:

- Backend system design using Express.js  
- Secure API development practices  
- Distributed tracing with OpenTelemetry  
- Observability pipeline using Elastic Stack  
- Realistic failure simulation for monitoring systems  
