# Sand Process – Order & Inventory Flows

## 1. New Order Flow

1. **Order created** (Orders page) → Status: Pending  
2. **Dispatcher** sees the order, gets recommendations (On-Site, Quarry, Redirect, Produce)  
3. **Dispatcher** chooses fulfillment source → **Requests approval** (warehouse/redirect) or **Starts production** (Produce)  
4. **Operations Manager** approves the request → Delivery created, order moves to Ready  
5. **QC** runs tests and attaches certificate → Order moves to Dispatched  
6. **Driver** picks up (with QC cert) → Marks in transit → Delivers and signs off  

**Summary:** Order → Dispatcher (assign) → OM (approve) → QC (test + cert) → Driver (pickup → deliver)

---

## 2. Produce to Inventory Flow

1. **Production** page → "Produce to Inventory"  
2. User enters: Product, Quantity, Location (Quarry / Near-well warehouse), Lot number  
3. Lot is created with status **Pending QC**  
4. **QC** runs the test on the Quality page and **approves**  
5. **Inventory** is updated – quantity is added to the chosen site  
6. Lots appear in **Dispatcher** as available for fulfillment  

**Summary:** Produce → Lot created → QC approves → Inventory increases → Lot available for order fulfillment  

> **Note:** Inventory only increases after QC approval. Until then, the lot is in “Pending QC lots” on the Production page.
