# Sand Process Management System - React Prototype Plan

## Project Overview
A comprehensive operations management system for sand processing operations in Vaca Muerta, Argentina. This prototype will demonstrate all modules with static data and support both English and Spanish languages.

## Architecture & Tech Stack

### Core Technologies
- **React 18+** with TypeScript
- **React Router** for navigation
- **i18next** for internationalization (English/Spanish)
- **State Management**: React Context API or Zustand
- **UI Framework**: Material-UI (MUI) or Tailwind CSS
- **Maps**: Leaflet or Google Maps API (for GPS tracking visualization)
- **Form Handling**: React Hook Form
- **Date/Time**: date-fns or dayjs
- **Charts**: Recharts or Chart.js

### Project Structure
```
sand-process/
├── src/
│   ├── components/          # Reusable UI components
│   │   ├── common/          # Buttons, inputs, modals
│   │   ├── layout/          # TopBar, Sidebar, Dashboard layout
│   │   └── modules/         # Module-specific components
│   ├── modules/             # Feature modules
│   │   ├── orders/          # Module 1: Order Management
│   │   ├── logistics/       # Module 2: Logistics & Traceability
│   │   ├── quality/         # Module 3: Quality Control
│   │   ├── billing/         # Module 4: Billing & Payment
│   │   ├── inventory/       # Module 5: Inventory
│   │   ├── fleet/           # Module 6: Fleet Management
│   │   └── production/      # Module 7: Production (future)
│   ├── pages/               # Page components
│   ├── hooks/               # Custom React hooks
│   ├── services/            # API services (mock data)
│   ├── store/              # State management
│   ├── utils/              # Utilities, helpers
│   ├── i18n/               # Translation files
│   │   ├── en/
│   │   └── es/
│   ├── types/              # TypeScript types
│   ├── constants/          # Constants, mock data
│   └── App.tsx
├── public/
└── package.json
```

## Modules to Implement

### Module 1: Order Management (Gestión de Pedidos)
**Priority: TIER 1 - CRITICAL**

**Features:**
- Create new orders (POs and MSA-based orders)
- Order list with filters (status, customer, date range)
- Order detail view
- Order status workflow: Pendiente → Confirmado → En Producción → QC → Listo → Despachado → Entregado → Completado → Facturado
- MSA management (view active MSAs, pricing)
- Customer management

**Mock Data:**
- 10-15 sample orders
- 2-3 customers (YPF, Vista Energy, etc.)
- 2-3 active MSAs
- Multiple order statuses

### Module 2: Logistics & Traceability (Logística y Trazabilidad)
**Priority: TIER 1 - CRITICAL ⭐ MAXIMUM PRIORITY**

**Features:**
- Live GPS tracking map (all 226 trucks)
- Truck assignment interface
- Route planning
- 12 automatic checkpoints visualization
- Electronic signature capture (simulated)
- Delivery confirmation
- Traceability report generation
- Geofencing visualization (quarry, buffer, wells)
- ETA calculation display
- Wait time tracking

**Mock Data:**
- 20-30 active truck deliveries
- GPS coordinates for routes
- Checkpoint timestamps
- Sample signatures
- Delivery photos

### Module 3: Quality Control (Control de Calidad)
**Priority: TIER 1 - CRITICAL**

**Features:**
- Test queue (pending QC tests)
- Lab test entry form
- Certificate of Analysis generation
- Certificate linking to truck number
- Approve/reject lots
- Certificate download/view

**Mock Data:**
- 10-15 pending tests
- Sample certificates
- Test results history

### Module 4: Billing & Payment (Facturación y Pago)
**Priority: TIER 1 - CRITICAL**

**Features:**
- Auto-generated invoices (after delivery)
- Invoice list with payment status
- Invoice detail with full proof attachments
- Payment tracking
- DSO (Days Sales Outstanding) dashboard
- Invoice aging report

**Mock Data:**
- 20-30 invoices
- Various payment statuses (paid, pending, overdue)
- Sample invoice PDFs

### Module 5: Basic Inventory (Inventario Básico)
**Priority: TIER 2 - SUPPORT**

**Features:**
- Current stock levels (tons)
- Stock by location (quarry, buffer, in transit)
- Reserve stock for orders
- Low stock alerts

**Mock Data:**
- Stock levels for 2 products
- Location-based inventory

### Module 6: Fleet Management (Gestión de Flota)
**Priority: TIER 2 - SUPPORT**

**Features:**
- Truck profiles (226 trucks: 26 old 25-26 ton, 200 new 50-55 ton)
- Driver assignment
- Maintenance schedule
- Truck status (available, in use, maintenance)
- Performance tracking

**Mock Data:**
- 50-100 truck profiles
- Driver assignments
- Maintenance records

### Module 7: Production Management (Gestión de Producción)
**Priority: TIER 3 - FUTURE**

**Features:**
- Production schedule
- Stage tracking (drying, sieving)
- Link to QC

**Note:** Minimal implementation for prototype

## User Roles & Permissions

### Roles to Implement:
1. **Admin** - Full access
2. **Operations Manager** - View all, assign trucks, monitor
3. **Dispatcher** - Logistics view, assign trucks, route planning
4. **Driver** - Mobile view (simulated), signature capture
5. **Production Manager** - Production schedule, QC queue
6. **QC Technician** - QC tests, certificate generation
7. **Sales Representative** - Create orders, view customer orders
8. **Customer Service** - View orders/deliveries, respond to customers
9. **Accounting Manager** - Generate invoices, track payments
10. **Customer User** - Portal access, track own deliveries

### Permission Matrix:
- Each role sees different modules/features based on requirements doc

## Key Features

### 1. Bilingual Support (English/Spanish)
- Language dropdown in top navigation
- All UI text translated
- Date/number formatting per locale
- RTL support if needed

### 2. Navigation
- **Top bar navigation** (per user preference)
- Role-based menu items
- Breadcrumbs for deep navigation

### 3. Dashboard
- Role-specific dashboards
- Key metrics widgets
- Recent activity
- Alerts/notifications

### 4. GPS Tracking Map
- Interactive map showing all trucks
- Real-time position updates (simulated)
- Route visualization
- Geofencing zones
- ETA display
- Filter by customer, status

### 5. Customer Portal
- Separate portal interface
- Live tracking of customer's deliveries
- Certificate downloads
- Delivery history

## Mock Data Strategy

### Static Data Files:
- `mockData/orders.json` - Sample orders
- `mockData/trucks.json` - Truck fleet data
- `mockData/customers.json` - Customer information
- `mockData/drivers.json` - Driver profiles
- `mockData/invoices.json` - Invoice data
- `mockData/qcTests.json` - Quality control tests
- `mockData/gpsTracks.json` - GPS tracking data
- `mockData/msas.json` - MSA contracts

### Data Relationships:
- Orders → Customers → MSAs
- Orders → Trucks → Drivers
- Deliveries → GPS Tracks → Checkpoints
- Deliveries → QC Certificates
- Deliveries → Invoices

## UI/UX Considerations

### Design Principles:
- Clean, professional interface
- Mobile-responsive (especially for driver app simulation)
- Fast loading, efficient navigation
- Clear status indicators
- Accessible (WCAG compliance)

### Color Coding:
- Order status colors
- Truck status colors
- Alert severity colors
- Payment status colors

## Implementation Phases

### Phase 1: Foundation (Days 1-2)
- Project setup
- Routing structure
- i18n configuration
- Authentication/role system
- Top bar navigation
- Basic layout components

### Phase 2: Core Modules (Days 3-5)
- Module 1: Order Management
- Module 2: Logistics & Traceability (with map)
- Module 3: Quality Control
- Module 4: Billing & Payment

### Phase 3: Support Modules (Day 6)
- Module 5: Inventory
- Module 6: Fleet Management

### Phase 4: Customer Portal & Polish (Day 7)
- Customer portal
- Dashboard improvements
- Final testing
- Documentation

## Questions for Clarification

1. **Map Library**: Do you have a preference for the map library? (Leaflet is free, Google Maps requires API key)

2. **UI Framework**: Preference for Material-UI, Tailwind CSS, or another?

3. **Authentication**: Should we implement a simple login system with role switching, or just role selection without authentication?

4. **Data Persistence**: Should mock data be stored in JSON files, or in-memory only? Should changes persist (localStorage)?

5. **Mobile App Simulation**: For the driver interface, should we create a separate mobile-optimized view, or just make it responsive?

6. **Map Data**: For GPS tracking, should we use real coordinates from Vaca Muerta area, or generic coordinates?

7. **File Downloads**: For certificates and invoices, should we generate actual PDFs or just show previews?

8. **Timeline**: What's the target completion date for this prototype?


