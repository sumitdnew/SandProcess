# Client Discovery Questions

Questions to clarify business rules and edge cases before finalizing the system.

---

## Fulfillment & Multi-Truck Orders

1. **Partial delivery** – If 50 trucks are assigned to deliver a large order and some trucks reach the destination while others break down or get delayed, what do we do? Split the order? Mark partial delivery? Reschedule the rest?
2. **Truck breakdown mid-route** – When a truck breaks down on the way to deliver, who gets notified first? Do we automatically try to reassign from a nearby warehouse, or is it always a manual decision?
3. **Order size limits** – Is there a maximum order size we support in one delivery? Or do we always split large orders across multiple trucks from the start?

---

## Inventory & Stock

4. **Reserved vs available** – When an order is assigned (trucks, warehouse), do we reserve that quantity immediately, or only when the driver actually picks up?
5. **Stock-outs** – If we assign from a warehouse and the stock is gone by pickup time (e.g. another order took it), what is the fallback? Redirect to another site? Cancel and reassign?
6. **Lot traceability** – Do we need to track which specific lot(s) went to which order for recalls or quality issues?

---

## QC & Certificates

7. **Certificate validity** – How long is a QC certificate valid? Can a lot sit in inventory for weeks and still be used, or does it need re-testing?
8. **Failed QC on produce-to-inventory** – If a produced lot fails QC, is it discarded? Reprocessed? Or quarantined for re-test?

---

## Approvals & Exceptions

9. **Urgent orders** – Can dispatchers ever bypass OM approval for urgent cases? If yes, what defines “urgent”?
10. **Redirect impact** – When we redirect a truck from Order A to Order B, who approves the delay for Order A? Is the original customer notified?

---

## Drivers & Logistics

11. **Driver availability** – Are drivers tied to specific trucks, or can any available driver take any available truck?
12. **Delivery proof** – Beyond signature, do we need photos, GPS checkpoints, or weigh-station confirmations for compliance?
13. **Working hours** – Do we enforce driver hours limits (e.g. max 10 h/day)? What happens if a delivery would exceed limits?

---

## General

14. **Notifications** – Who should get in-app or email alerts when: new order, assignment approved, QC ready, delivery completed?
15. **Reporting** – What are the top 3 reports or dashboards you need (e.g. on-time delivery %, inventory by site, truck utilization)?
