import { z } from "zod";

export const workOrderSchema = z.object({
  orderId: z.string().min(1),
  storeId: z.string().min(1),
  dispatchStatus: z.enum(["assigned", "en_route", "onsite", "complete"]),
  technicianId: z.string().min(1),
  photoUrls: z.array(z.string().url()),
  followUp: z.string().min(1)
});

export type WorkOrder = z.infer<typeof workOrderSchema>;

export function toLogEntry(input: WorkOrder) {
  const event = input.dispatchStatus === "complete" ? "work_order.completed" : "work_order.updated";
  return {
    message: event,
    level: "info",
    service: "field-service",
    environment: "production",
    context: {
      order_id: input.orderId,
      store_id: input.storeId,
      dispatch_status: input.dispatchStatus,
      technician_id: input.technicianId,
      photo_urls: input.photoUrls,
      technician_follow_up: input.followUp
    }
  };
}
