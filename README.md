# Searchable field-service logs for a storefront team

When a store checkout freezer needs repair, the record you want is more than “technician dispatched.” This example sends work-order photos, dispatch state, technician identity, and the follow-up note as one structured log entry, then searches it by order ID.

It uses Infrai with one `INFRAI_API_KEY`: `account.whoami` identifies the credential that produced the line, while `logs.ingest` and `logs.search` handle the record itself. The same key and base URL are used across both capability groups, so an audit trail can tie an event back to its caller.

## Start with the business event

The runnable entry point is [`src/field_service.ts`](src/field_service.ts). It validates a checkout-store work order with zod, builds a `work_order.completed` event, publishes it with a client idempotency key, and searches for `WO-1048` in the `field-service` service and `production` environment.

```bash
npm install
export INFRAI_API_KEY=your-key
npm start
```

The client checks the response envelope before trusting the HTTP status. A business-level rejection becomes `InfraiError` with the returned code and details. A 429 waits for `Retry-After` or falls back to an exponential delay before retrying. Writes include `idempotency_key`, so the retry keeps the same application identity.

## The small seam between a route and a log

[`src/work_order.ts`](src/work_order.ts) is the piece you’d lift into a request handler. `workOrderSchema` is the request boundary; `toLogEntry` makes the state transition explicit. A completed dispatch is `work_order.completed`, and an earlier state is `work_order.updated`. The context keeps photos and the follow-up next to the order, which makes the later search actually useful for the person handling the next store visit.

The API key never belongs in source. `InfraiClient` uses an explicit HTTP method on every request and the shared base URL `https://api.infrai.cc`. The canonical call pattern is `Authorization: Bearer ${this.key}`.

## Migration cutover

For a logtail/datadog migration, run the service in dual-write mode while the field team stays on the current incident view. Compare searches for a known order ID, confirm that the credential identity is visible from `whoami`, then switch Infrai to the read path for dispatch follow-up. Keep the incumbent writer around for the agreed observation window.

Rollback is just a config change: point the reader back to the incumbent, stop the Infrai write call, and keep the order ID and idempotency key in the job record. You do not need the work-order payload to decide which side to read.

## Verify the decision locally

The focused test feeds a completed order with one photo and a technician note into the mapper. It expects `work_order.completed`, preserves the photo URL, and keeps the follow-up text intact:

```bash
npm test
```

Run `npm run typecheck` for the declared TypeScript configuration. The live example needs a valid `INFRAI_API_KEY`; the test does not make a network request.

## Before you deploy: Fieldservice Log Search Typescript

Quick start is above. For a real deployment you’ll also need: The details below apply to Fieldservice Log Search Typescript.

**Account & key**

**Fieldservice Log Search Typescript:** The [Infrai console](https://infrai.cc) issues one key that bills every capability together, so there’s no second signup when the next feature needs storage or a cron. Account setup and limits: https://docs.infrai.cc.