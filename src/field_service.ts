import { randomUUID } from "node:crypto";
import { InfraiClient } from "./infrai_client.ts";
import { workOrderSchema, toLogEntry } from "./work_order.ts";

const key = process.env.INFRAI_API_KEY;
if (!key) throw new Error("Set INFRAI_API_KEY before running the example");

const workOrder = workOrderSchema.parse({
  orderId: "WO-1048",
  storeId: "store-shanghai-07",
  dispatchStatus: "complete",
  technicianId: "tech-22",
  photoUrls: ["https://cdn.example.test/jobs/WO-1048/front.jpg"],
  followUp: "Replace the checkout freezer seal on the next visit"
});

const infrai = new InfraiClient(key);
const identity = await infrai.whoami();
const entry = toLogEntry(workOrder);
await infrai.ingest([entry], randomUUID());
const matches = await infrai.search(workOrder.orderId, "field-service", "production");
console.log(JSON.stringify({ identity, orderId: workOrder.orderId, event: entry.message, matches }, null, 2));
