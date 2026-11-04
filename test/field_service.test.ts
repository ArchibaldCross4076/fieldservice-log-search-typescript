import assert from "node:assert/strict";
import { workOrderSchema, toLogEntry } from "../src/work_order.ts";

const input = workOrderSchema.parse({
  orderId: "WO-test",
  storeId: "store-test",
  dispatchStatus: "complete",
  technicianId: "tech-test",
  photoUrls: ["https://cdn.example.test/photo.jpg"],
  followUp: "Schedule a seal replacement"
});

const entry = toLogEntry(input);
assert.equal(entry.message, "work_order.completed");
assert.equal(entry.context.technician_follow_up, "Schedule a seal replacement");
assert.deepEqual(entry.context.photo_urls, input.photoUrls);
console.log("field-service decision test passed");
