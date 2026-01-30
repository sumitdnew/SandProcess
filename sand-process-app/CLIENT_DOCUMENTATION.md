# Sand Process Management System - Prototype Documentation

## Overview

The Sand Process Management System is a comprehensive web-based platform designed to manage the complete lifecycle of sand production, quality control, logistics, and customer relations for the oil & gas industry. This prototype demonstrates all core workflows from order creation through delivery and invoicing.

## System Architecture

- **Frontend**: React with TypeScript, Material-UI
- **Backend**: Supabase (PostgreSQL database + Storage)
- **Deployment**: Vercel (production-ready hosting)
- **Languages**: English and Argentine Spanish

## Key Features

### 1. **Order Management**
- Create orders via Master Service Agreements (MSAs) or standalone Purchase Orders
- Upload customer PO documents
- Track order status through complete lifecycle
- Generate Purchase Order PDFs
- Customer-specific filtering

### 2. **Quality Control**
- Create QC tests linked to orders
- Simplified Pass/Fail workflow
- Comprehensive test reports
- Automatic certificate generation (PDF)
- Certificate required before dispatch

### 3. **Production Management**
- Visual production pipeline tracking
- Start/complete production workflows
- "Produce to Inventory" for stock management
- Production capacity monitoring

### 4. **Logistics & Traceability**
- Assign trucks and drivers to orders
- Real-time GPS tracking simulation
- Delivery confirmation with electronic signatures
- Photo capture at delivery
- Complete traceability reports (PDF)
- Checkpoint tracking

### 5. **Inventory Management**
- Real-time stock levels by product and location
- Reserved quantities from active orders
- Available inventory calculations

### 6. **Billing & Payments**
- Automatic invoice generation upon delivery
- Payment tracking
- Days Sales Outstanding (DSO) metrics
- Invoice PDF generation

### 7. **Customer Portal**
- Submit new orders
- Track order status in real-time
- View and download invoices
- Pay invoices (mock payment flow)
- Download QC certificates and documents

### 8. **Driver Portal**
- View assigned deliveries
- Mark deliveries "In Transit" and "Arrived"
- Capture customer signatures
- Complete delivery confirmation

## User Roles

### **Admin** (Default Role)
Full access to all modules:
- Dashboard with KPIs
- Order Management
- Quality Control
- Production Management
- Logistics & Fleet Management
- Billing & Invoicing
- Customer & MSA Management
- Inventory Management

### **Customer User**
Access to Customer Portal:
- Submit orders
- Track orders
- View invoices and make payments
- Download certificates and documents

### **Driver**
Access to Driver Portal:
- View assigned deliveries
- Update delivery status
- Capture delivery signatures
- Complete deliveries

## Getting Started

### Accessing the System

1. **Open the application** in your web browser
2. **Select your role** from the user dropdown (top right)
3. **Choose language** (English/Spanish) from the language selector

### Navigation

- **Top Bar**: Language and role selection
- **Side Navigation**: Module access (role-dependent)
- **Page Headers**: Contextual actions and information

## Core Workflows

### Workflow 1: Complete Order-to-Delivery Cycle

#### Step 1: Create an Order
1. Navigate to **Orders** page
2. Click **"Create Order"**
3. Select customer and products
4. Choose order type (MSA or Purchase Order)
5. Optionally upload customer PO document
6. Submit order

**Result**: Order created with status "Pending"

#### Step 2: Confirm Order
1. On **Orders** page, find your order
2. Click **"View"** to see details
3. Click **"Confirm Order"** (or use status dropdown)
4. Optionally generate Purchase Order PDF

**Result**: Order status changes to "Confirmed"

#### Step 3: Start Production
1. Navigate to **Production** page
2. Find your order in "Production Schedule" tab
3. Click **"Start Production"**

**Result**: Order status changes to "In Production"

#### Step 4: Complete Production & Send to QC
1. On **Production** page, go to "In Production" tab
2. Click **"Complete Production → Send to QC"**

**Result**: Order status changes to "QC"

#### Step 5: Quality Control Testing
1. Navigate to **Quality Control** page
2. Find your order in "Orders Requiring QC Tests" section
3. Click **"Create Test"** (if not already created)
4. Click **"Enter Results"** button
5. In the modal, click **"Pass Test"** or **"Fail Test"**
6. Test automatically approved and certificate generated

**Result**: 
- QC Test status: "Passed"
- Certificate generated and downloadable
- Order status automatically changes to "Ready"

#### Step 6: Dispatch Order
1. Navigate to **Orders** page
2. Find your "Ready" order
3. Click **"Dispatch"** button
4. Select available truck and driver
5. Confirm dispatch

**Result**: 
- Delivery record created
- Order status: "Dispatched"
- Truck status: "Assigned"

#### Step 7: Delivery Confirmation (Admin or Driver)
**Option A - Admin (Logistics Page):**
1. Navigate to **Logistics** page
2. Select the delivery
3. Click **"Mark as In Transit"** (if needed)
4. Click **"Confirm Delivery & Capture Signature"**
5. Fill in signer details
6. Draw signature on canvas
7. Optionally upload photo
8. Confirm delivery

**Option B - Driver (Driver Portal):**
1. Switch role to **"Driver"**
2. Navigate to **Driver Portal**
3. Find assigned delivery
4. Click **"Mark In Transit"** → **"Mark Arrived at Site"**
5. Click **"Confirm Delivery"**
6. Capture signature and complete

**Result**: 
- Delivery status: "Delivered"
- Signature and proof stored
- Invoice automatically generated
- Order status: "Delivered"

#### Step 8: Generate Invoice
1. Navigate to **Billing** page
2. Find the delivered order
3. Invoice is already auto-generated
4. Click **"View"** to see invoice details
5. Download invoice PDF

**Result**: Invoice ready for customer

---

### Workflow 2: Produce to Inventory (Stock Management)

1. Navigate to **Production** page
2. Click **"Produce to Inventory"** button
3. Select product, quantity, and location
4. Enter lot number
5. Submit

**Result**: 
- Inventory updated directly
- No customer order required
- Stock available for future orders

---

### Workflow 3: Customer Portal - Submit & Track Order

1. Switch role to **"Customer User"**
2. Navigate to **Customer Portal**
3. Select your customer from dropdown
4. Go to **"Submit Order"** tab
5. Fill in order details (product, quantity, location, date)
6. Optionally upload customer PO
7. Submit order

**Result**: Order created and visible in "Orders" tab

**To Track:**
1. Go to **"Orders"** tab in Customer Portal
2. See all your orders with real-time status
3. Click order to see details
4. Download documents (POs, certificates)

**To Pay Invoice:**
1. Go to **"Invoices & Payments"** tab
2. Find invoice
3. Click **"Pay Now"**
4. Complete mock payment form

---

### Workflow 4: Driver Portal - Complete Delivery

1. Switch role to **"Driver"**
2. Navigate to **Driver Portal**
3. See all deliveries assigned to you
4. Click on a delivery to see details
5. Click **"Mark In Transit"** when leaving warehouse
6. Click **"Mark Arrived at Site"** when at destination
7. Click **"Confirm Delivery"**
8. Fill in customer signer name and title
9. Draw signature on canvas
10. Confirm

**Result**: 
- Delivery completed
- Signature captured
- Invoice auto-generated
- Traceability report available

---

## Key Pages & Features

### Dashboard
- **Metrics**: Revenue, orders, deliveries, QC pass rate
- **Charts**: Revenue trends, order status distribution, production by product
- **Recent Activity**: Latest orders, deliveries, QC tests, invoices
- **Production Capacity**: Current utilization

### Orders Page
- **Filter by Customer**: Dropdown to filter orders
- **Status Management**: Update order status through workflow
- **Dispatch**: Assign trucks and drivers
- **PO Generation**: Download Purchase Order PDFs
- **View Uploaded POs**: Access customer-provided documents

### Quality Control Page
- **Orders Requiring QC**: List of orders needing tests
- **Create Test**: Link test to order and product
- **Pass/Fail Workflow**: Simplified testing interface
- **Certificate Download**: PDF certificates with comprehensive test results
- **Test History**: View all completed tests

### Production Page
- **Tabs**: Production Schedule, In Production, QC Queue, Ready for Dispatch
- **Visual Tracking**: See orders at each stage
- **Start/Complete Actions**: Move orders through production
- **Produce to Inventory**: Direct stock production

### Logistics Page
- **Live Map**: GPS tracking with route visualization
- **Delivery Cards**: Click to see details
- **Status Filters**: Filter by delivery status
- **Assign Truck**: Assign vehicles to ready orders
- **Delivery Confirmation**: Capture signatures and photos
- **Traceability Reports**: Download complete delivery PDFs

### Billing Page
- **Invoice List**: All invoices with payment status
- **Auto-Generation**: Invoices created upon delivery
- **Payment Recording**: Track customer payments
- **Metrics**: DSO, outstanding amounts
- **Invoice PDFs**: Download invoices

### Inventory Page
- **Stock Levels**: By product and location
- **Reserved Quantities**: From active orders
- **Available Stock**: Total minus reserved
- **Real-time Updates**: Reflects production and orders

### Customer Portal
- **Client Selector**: Filter data by customer
- **Submit Orders**: Simple order creation form
- **Track Orders**: Real-time status with document downloads
- **Invoices & Payments**: View and pay invoices
- **Certificates & Documents**: Download all related documents

### Driver Portal
- **Assigned Deliveries**: Only deliveries for current driver
- **Status Updates**: Mark in transit, arrived, delivered
- **Signature Capture**: Electronic signature on delivery
- **Route Information**: Delivery location and details

---

## Document Generation

The system generates several PDF documents:

### 1. **Purchase Order (PO)**
- Generated from Orders page
- Includes order details, products, pricing, terms
- Company information and branding

### 2. **QC Certificate**
- Generated automatically when test passes
- Comprehensive test results including:
  - Sieve analysis
  - Roundness & sphericity
  - Bulk density
  - Crush resistance
  - Acid solubility
  - Turbidity
  - Moisture content
- ISO certifications and standards compliance

### 3. **Master Service Agreement (MSA)**
- Generated from Customers or MSA pages
- Contract terms, pricing, validity period
- Company and customer information

### 4. **Traceability Report**
- Generated from Logistics page for delivered orders
- Complete delivery timeline
- Checkpoints with GPS coordinates
- Signature information
- Delivery proof

### 5. **Invoice**
- Auto-generated upon delivery confirmation
- Includes all order details
- Payment terms and instructions
- Attached delivery proof

---

## Data Management

### Master Data

**Customers**
- Create and manage customer records
- View associated orders and revenue
- Generate MSAs

**Products**
- Product catalog with specifications
- Mesh sizes and properties
- Pricing information

**Trucks & Drivers**
- Fleet management
- Driver assignments
- Maintenance tracking
- Status monitoring

**MSAs (Master Service Agreements)**
- Contract management
- Pricing agreements
- Validity periods
- Generate MSA PDFs

### Settings
- Production capacity
- Company information
- QC defaults
- System parameters

---

## Status Workflows

### Order Status Flow
```
Pending → Confirmed → In Production → QC → Ready → Dispatched → Delivered → Completed → Invoiced
```

### Delivery Status Flow
```
Assigned → In Transit → Arrived → Delivered
```

### QC Test Status Flow
```
Pending → In Progress → Passed/Failed
```

### Invoice Payment Status
```
Pending → Paid / Overdue
```

---

## Best Practices

### For Administrators

1. **Order Creation**
   - Always verify customer and product information
   - Upload customer PO if provided
   - Use MSA pricing when available

2. **Quality Control**
   - Create tests immediately when order reaches QC stage
   - Review test results before approval
   - Ensure certificate is generated before dispatch

3. **Dispatch**
   - Verify QC certificate exists
   - Check truck and driver availability
   - Confirm delivery address

4. **Delivery Confirmation**
   - Always capture signature
   - Take photos when possible
   - Verify all checkpoints are recorded

### For Customers

1. **Order Submission**
   - Provide accurate quantities and locations
   - Upload PO document if required
   - Specify delivery dates clearly

2. **Tracking**
   - Check "Orders" tab regularly
   - Download certificates when available
   - Review invoices promptly

3. **Payments**
   - Pay invoices through the portal
   - Keep payment records
   - Contact support for issues

### For Drivers

1. **Pre-Delivery**
   - Review assigned deliveries
   - Check delivery addresses
   - Verify truck and route

2. **During Delivery**
   - Update status when leaving warehouse
   - Mark arrival at site
   - Capture signature before leaving

3. **Post-Delivery**
   - Confirm delivery completion
   - Verify signature captured
   - Report any issues

---

## Technical Notes

### Environment Setup
- Requires Supabase backend connection
- Environment variables for API keys
- Storage bucket for document uploads

### Browser Compatibility
- Modern browsers (Chrome, Firefox, Edge, Safari)
- Responsive design for tablets
- Mobile-friendly interface

### Performance
- Real-time data updates
- Optimized queries
- Efficient PDF generation
- Fast page loads

---

## Support & Contact

For questions or issues:
- Review this documentation
- Check system status
- Contact system administrator

---

## Version Information

**Prototype Version**: 1.0
**Last Updated**: January 2026
**Status**: Functional Prototype

---

*This documentation covers the prototype version of the Sand Process Management System. Features and workflows may be updated based on feedback and requirements.*

