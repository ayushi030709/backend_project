# FreshCart Observability Analysis

## 1. What I alert on and why

I selected three alert categories so on-call can detect both technical failure and customer-facing degradation:

1. Checkout error rate high (`checkout_error_rate > 8%` over 5 minutes)
   - Why: checkout is the revenue path and includes the intentionally flaky payment simulation.
   - Signal type: reliability/error budget burn.
2. Checkout latency high (`checkout_avg_latency_ms > 1200` over 10 minutes)
   - Why: slow checkout directly drives abandonment even when requests are technically successful.
   - Signal type: performance/SLO protection.
3. Checkout success rate low (`checkout_success_rate < 90%` over 10 minutes)
   - Why: this is a business-facing quality metric (conversion proxy), not just infrastructure noise.
   - Signal type: business health.

Each alert has an action attached using a Kibana server-log connector, proving a full alert pipeline from metric -> condition -> action.

## 2. Raw telemetry to alertable metrics pipeline

Raw traces are emitted from the API using OpenTelemetry and shipped via OTLP HTTP to the OTel Collector.
Collector exports traces into Elasticsearch (`freshcart-otel-traces*`).

From there:

1. Index template enforces mappings required for operational querying:
   - `org_id` and `request_id` mapped as `keyword`
2. Transform (`freshcart-checkout-metrics-1m`) aggregates trace documents into 1-minute buckets by org:
   - `checkout_requests`
   - `checkout_failures`
   - `checkout_avg_latency_ms`
   - `checkout_error_rate` (bucket script)
   - `checkout_success_rate` (bucket script)
3. Alert rules query the derived index (`freshcart-metrics-checkout-1m`) instead of raw logs/traces.

This makes alerts stable across dashboard rebuilds and avoids noisy point-in-time log matching.

## 3. Thresholds and reasoning

1. Error rate 8% (5m):
   - The checkout flow includes expected synthetic failures (~10%). The threshold is tuned to fire when the system is consistently worse than acceptable behavior but not for isolated single failures.
2. Average latency 1200ms (10m):
   - Payment simulation delay is typically below this in healthy conditions; sustained averages above this indicate dependency slowness or saturation.
3. Success rate 90% (10m):
   - This catches systematic conversion impact while avoiding alerts for brief random noise.

Tradeoff decisions:

- Short windows are more sensitive but produce flapping.
- Longer windows reduce noise but delay detection.
- I used mixed windows (5m for fast error detection, 10m for trend-based latency/conversion).

## 4. What I would add with more time

1. Dual-severity alerting (warning/critical tiers) with escalation routing.
2. Dedicated synthetic probe traffic and SLO burn-rate alerts.
3. Integration tests that assert OTel attributes (`org_id`, `request_id`, `http.*`) on all emitted spans.
4. Dashboard pack with service-level and per-org drilldowns.
5. Optional dead-letter stream for failed telemetry exports and collector self-monitoring alerts.

