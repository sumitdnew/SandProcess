# Setup Instructions

## Prerequisites
- Node.js (v14 or higher)
- npm or yarn

## Installation

1. Navigate to the project directory:
```bash
cd sand-process-app
```

2. Install dependencies:
```bash
npm install
```

If npm is blocked by PowerShell execution policy, you can:
- Use Command Prompt instead of PowerShell
- Or run: `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` (requires admin)

## Running the Application

Start the development server:
```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000)

## Features

### Modules Implemented:
1. **Order Management** - Create and manage orders, view MSAs
2. **Logistics & Traceability** - GPS tracking map, delivery management, checkpoints
3. **Quality Control** - QC test queue, certificate generation
4. **Billing & Payment** - Invoice management, payment tracking, DSO dashboard
5. **Inventory** - Stock levels by location
6. **Fleet Management** - Truck and driver management
7. **Production** - Production schedule (minimal)
8. **Customer Portal** - Live tracking for customers

### Key Features:
- ✅ Bilingual support (English/Spanish) with language dropdown
- ✅ Role-based access control (10 user roles)
- ✅ Top bar navigation
- ✅ Interactive GPS map with Leaflet
- ✅ Static mock data for all modules
- ✅ Responsive design with Material-UI

## User Roles

Switch between roles using the account icon in the top bar:
- Administrator
- Operations Manager
- Dispatcher
- Driver
- Production Manager
- QC Technician
- Sales Representative
- Customer Service
- Accounting Manager
- Customer User

## Language Switching

Use the language dropdown in the top bar to switch between English and Spanish.

## Mock Data

All data is static and stored in `src/constants/mockData.ts`. The application uses localStorage to persist role selection.

## Building for Production

```bash
npm run build
```

This creates an optimized production build in the `build` folder.


