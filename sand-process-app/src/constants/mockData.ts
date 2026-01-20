import { 
  Customer, MSA, Product, Order, Truck, Driver, Delivery, 
  QCTest, Certificate, Invoice, Inventory, User 
} from '../types';

// Mock Users
export const mockUsers: User[] = [
  { id: '1', name: 'Admin User', email: 'admin@sandprocess.com', role: 'admin' },
  { id: '2', name: 'Juan Pérez', email: 'juan.perez@sandprocess.com', role: 'operations_manager' },
  { id: '3', name: 'María González', email: 'maria.gonzalez@sandprocess.com', role: 'dispatcher' },
  { id: '4', name: 'Carlos Rodríguez', email: 'carlos.rodriguez@sandprocess.com', role: 'qc_technician' },
  { id: '5', name: 'Ana Martínez', email: 'ana.martinez@sandprocess.com', role: 'accounting_manager' },
  { id: '6', name: 'Luis Fernández', email: 'luis.fernandez@sandprocess.com', role: 'sales_rep' },
];

// Mock Customers
export const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'YPF',
    code: 'YPF-001',
    contactPerson: 'Roberto Silva',
    email: 'roberto.silva@ypf.com',
    phone: '+54 11 1234-5678',
    address: 'Vaca Muerta, Neuquén, Argentina',
    active: true,
  },
  {
    id: '2',
    name: 'Vista Energy',
    code: 'VISTA-001',
    contactPerson: 'Patricia López',
    email: 'patricia.lopez@vistaenergy.com',
    phone: '+54 11 2345-6789',
    address: 'Vaca Muerta, Neuquén, Argentina',
    active: true,
  },
  {
    id: '3',
    name: 'Shell Argentina',
    code: 'SHELL-001',
    contactPerson: 'Fernando García',
    email: 'fernando.garcia@shell.com',
    phone: '+54 11 3456-7890',
    address: 'Vaca Muerta, Neuquén, Argentina',
    active: true,
  },
];

// Mock Products
export const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Frac Sand 30/50',
    meshSize: '30/50',
    description: 'High quality frac sand, mesh size 30/50',
  },
  {
    id: '2',
    name: 'Frac Sand 40/70',
    meshSize: '40/70',
    description: 'High quality frac sand, mesh size 40/70',
  },
];

// Mock MSAs
export const mockMSAs: MSA[] = [
  {
    id: '1',
    customerId: '1',
    customerName: 'YPF',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    pricing: {
      '1': 95, // Product 1 (30/50) = $95/ton
      '2': 100, // Product 2 (40/70) = $100/ton
    },
    paymentTerms: 'Net 30',
    volumeCommitment: 500,
    active: true,
  },
  {
    id: '2',
    customerId: '2',
    customerName: 'Vista Energy',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    pricing: {
      '1': 90,
      '2': 95,
    },
    paymentTerms: 'Net 30',
    volumeCommitment: 300,
    active: true,
  },
];

// Mock Orders
export const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2026-0001',
    customerId: '1',
    customerName: 'YPF',
    msaId: '1',
    products: [
      { productId: '1', productName: 'Frac Sand 30/50', quantity: 50, unitPrice: 95 },
    ],
    deliveryDate: '2026-01-16',
    deliveryLocation: 'Pozo YPF-45',
    deliveryAddress: 'Vaca Muerta, Neuquén, Argentina',
    status: 'delivered',
    totalAmount: 4750,
    createdAt: '2026-01-13T10:00:00Z',
  },
  {
    id: '2',
    orderNumber: 'ORD-2026-0002',
    customerId: '1',
    customerName: 'YPF',
    msaId: '1',
    products: [
      { productId: '1', productName: 'Frac Sand 30/50', quantity: 75, unitPrice: 95 },
    ],
    deliveryDate: '2026-01-17',
    deliveryLocation: 'Pozo YPF-52',
    deliveryAddress: 'Vaca Muerta, Neuquén, Argentina',
    status: 'dispatched',
    totalAmount: 7125,
    createdAt: '2026-01-14T09:00:00Z',
  },
  {
    id: '3',
    orderNumber: 'ORD-2026-0003',
    customerId: '2',
    customerName: 'Vista Energy',
    msaId: '2',
    products: [
      { productId: '2', productName: 'Frac Sand 40/70', quantity: 30, unitPrice: 95 },
    ],
    deliveryDate: '2026-01-18',
    deliveryLocation: 'Pozo Vista-12',
    deliveryAddress: 'Vaca Muerta, Neuquén, Argentina',
    status: 'ready',
    totalAmount: 2850,
    createdAt: '2026-01-15T11:00:00Z',
  },
  {
    id: '4',
    orderNumber: 'ORD-2026-0004',
    customerId: '1',
    customerName: 'YPF',
    msaId: '1',
    products: [
      { productId: '1', productName: 'Frac Sand 30/50', quantity: 100, unitPrice: 95 },
    ],
    deliveryDate: '2026-01-20',
    deliveryLocation: 'Pozo YPF-60',
    deliveryAddress: 'Vaca Muerta, Neuquén, Argentina',
    status: 'in_production',
    totalAmount: 9500,
    createdAt: '2026-01-16T08:00:00Z',
  },
  {
    id: '5',
    orderNumber: 'ORD-2026-0005',
    customerId: '2',
    customerName: 'Vista Energy',
    msaId: '2',
    products: [
      { productId: '2', productName: 'Frac Sand 40/70', quantity: 45, unitPrice: 95 },
    ],
    deliveryDate: '2026-01-19',
    deliveryLocation: 'Pozo Vista-18',
    deliveryAddress: 'Vaca Muerta, Neuquén, Argentina',
    status: 'pending',
    totalAmount: 4275,
    createdAt: '2026-01-16T14:00:00Z',
  },
];

// Mock Trucks (sample of 226 trucks)
export const mockTrucks: Truck[] = [
  { id: '1', licensePlate: 'ABC-123', capacity: 25, type: 'old', status: 'available' },
  { id: '2', licensePlate: 'DEF-456', capacity: 26, type: 'old', status: 'in_transit' },
  { id: '3', licensePlate: 'GHI-789', capacity: 50, type: 'new', status: 'available' },
  { id: '4', licensePlate: 'JKL-012', capacity: 55, type: 'new', status: 'delivering' },
  { id: '5', licensePlate: 'MNO-345', capacity: 52, type: 'new', status: 'maintenance' },
  { id: '6', licensePlate: 'PQR-678', capacity: 50, type: 'new', status: 'available' },
  { id: '7', licensePlate: 'STU-901', capacity: 25, type: 'old', status: 'available' },
  { id: '8', licensePlate: 'VWX-234', capacity: 54, type: 'new', status: 'in_transit' },
];

// Mock Drivers
export const mockDrivers: Driver[] = [
  { id: '1', name: 'Pedro Sánchez', licenseNumber: 'DL-12345', phone: '+54 9 11 1111-1111', hoursWorked: 35, hoursLimit: 48, available: true },
  { id: '2', name: 'José Martínez', licenseNumber: 'DL-23456', phone: '+54 9 11 2222-2222', hoursWorked: 42, hoursLimit: 48, available: true },
  { id: '3', name: 'Miguel Torres', licenseNumber: 'DL-34567', phone: '+54 9 11 3333-3333', hoursWorked: 48, hoursLimit: 48, available: false },
  { id: '4', name: 'Ricardo López', licenseNumber: 'DL-45678', phone: '+54 9 11 4444-4444', hoursWorked: 30, hoursLimit: 48, available: true },
];

// Mock Deliveries with GPS data
export const mockDeliveries: Delivery[] = [
  {
    id: '1',
    orderId: '1',
    orderNumber: 'ORD-2026-0001',
    truckId: '4',
    truckLicensePlate: 'JKL-012',
    driverId: '1',
    driverName: 'Pedro Sánchez',
    customerId: '1',
    customerName: 'YPF',
    route: {
      quarry: { lat: -38.5, lng: -69.0, name: 'Cantera Principal' },
      well: { lat: -38.6, lng: -69.1, name: 'Pozo YPF-45', address: 'Vaca Muerta, Neuquén' },
    },
    checkpoints: [
      { id: '1', name: 'Truck Assigned', type: 'truck_assigned', timestamp: '2026-01-16T08:00:00Z', location: { lat: -38.5, lng: -69.0 }, autoDetected: true },
      { id: '2', name: 'Load Start', type: 'load_start', timestamp: '2026-01-16T08:15:00Z', location: { lat: -38.5, lng: -69.0 }, autoDetected: true },
      { id: '3', name: 'Load Complete', type: 'load_complete', timestamp: '2026-01-16T08:45:00Z', location: { lat: -38.5, lng: -69.0 }, autoDetected: true },
      { id: '4', name: 'Quarry Exit', type: 'quarry_exit', timestamp: '2026-01-16T09:00:00Z', location: { lat: -38.5, lng: -69.0 }, autoDetected: true },
      { id: '5', name: 'Well Arrival', type: 'well_arrival', timestamp: '2026-01-16T10:30:00Z', location: { lat: -38.6, lng: -69.1 }, autoDetected: true },
      { id: '6', name: 'Wait Start', type: 'wait_start', timestamp: '2026-01-16T10:30:00Z', location: { lat: -38.6, lng: -69.1 }, autoDetected: true },
      { id: '7', name: 'Unload Start', type: 'unload_start', timestamp: '2026-01-16T10:45:00Z', location: { lat: -38.6, lng: -69.1 }, autoDetected: true },
      { id: '8', name: 'Unload Complete', type: 'unload_complete', timestamp: '2026-01-16T11:15:00Z', location: { lat: -38.6, lng: -69.1 }, autoDetected: true },
      { id: '9', name: 'Signature Captured', type: 'signature_captured', timestamp: '2026-01-16T11:16:00Z', location: { lat: -38.6, lng: -69.1 }, autoDetected: false },
      { id: '10', name: 'Well Exit', type: 'well_exit', timestamp: '2026-01-16T11:20:00Z', location: { lat: -38.6, lng: -69.1 }, autoDetected: true },
    ],
    gpsTrack: generateGPSTrack(-38.5, -69.0, -38.6, -69.1, '2026-01-16T09:00:00Z'),
    eta: '2026-01-16T10:30:00Z',
    actualArrival: '2026-01-16T10:30:00Z',
    waitTime: 15,
    signature: {
      signerName: 'Roberto Silva',
      signerTitle: 'Site Manager',
      timestamp: '2026-01-16T11:16:00Z',
      location: { lat: -38.6, lng: -69.1 },
    },
    status: 'delivered',
    createdAt: '2026-01-16T08:00:00Z',
  },
  {
    id: '2',
    orderId: '2',
    orderNumber: 'ORD-2026-0002',
    truckId: '3',
    truckLicensePlate: 'GHI-789',
    driverId: '2',
    driverName: 'José Martínez',
    customerId: '1',
    customerName: 'YPF',
    route: {
      quarry: { lat: -38.5, lng: -69.0, name: 'Cantera Principal' },
      well: { lat: -38.65, lng: -69.15, name: 'Pozo YPF-52', address: 'Vaca Muerta, Neuquén' },
    },
    checkpoints: [
      { id: '11', name: 'Truck Assigned', type: 'truck_assigned', timestamp: '2026-01-17T07:00:00Z', location: { lat: -38.5, lng: -69.0 }, autoDetected: true },
      { id: '12', name: 'Load Start', type: 'load_start', timestamp: '2026-01-17T07:15:00Z', location: { lat: -38.5, lng: -69.0 }, autoDetected: true },
      { id: '13', name: 'Load Complete', type: 'load_complete', timestamp: '2026-01-17T07:50:00Z', location: { lat: -38.5, lng: -69.0 }, autoDetected: true },
      { id: '14', name: 'Quarry Exit', type: 'quarry_exit', timestamp: '2026-01-17T08:05:00Z', location: { lat: -38.5, lng: -69.0 }, autoDetected: true },
    ],
    gpsTrack: generateGPSTrack(-38.5, -69.0, -38.65, -69.15, '2026-01-17T08:05:00Z'),
    eta: '2026-01-17T10:00:00Z',
    status: 'in_transit',
    createdAt: '2026-01-17T07:00:00Z',
  },
];

// Helper function to generate GPS track
function generateGPSTrack(startLat: number, startLng: number, endLat: number, endLng: number, startTime: string): any[] {
  const points = [];
  const steps = 20;
  const startDate = new Date(startTime);
  
  for (let i = 0; i <= steps; i++) {
    const ratio = i / steps;
    const lat = startLat + (endLat - startLat) * ratio;
    const lng = startLng + (endLng - startLng) * ratio;
    const timestamp = new Date(startDate.getTime() + (i * 5 * 60 * 1000)); // 5 min intervals
    
    points.push({
      timestamp: timestamp.toISOString(),
      lat,
      lng,
      speed: 60 + Math.random() * 20, // 60-80 km/h
    });
  }
  
  return points;
}

// Mock QC Tests
export const mockQCTests: QCTest[] = [
  {
    id: '1',
    lotNumber: 'LOT-2026-001',
    orderId: '1',
    productId: '1',
    productName: 'Frac Sand 30/50',
    status: 'passed',
    testDate: '2026-01-16T07:00:00Z',
    results: {
      meshSize: { passed: true, value: '30/50' },
      purity: { passed: true, value: 98.5 },
      roundness: { passed: true, value: 0.85 },
      moisture: { passed: true, value: 0.2 },
    },
    certificateId: 'CERT-2026-001',
    technicianId: '4',
    technicianName: 'Carlos Rodríguez',
    truckId: '4',
    truckLicensePlate: 'JKL-012',
  },
  {
    id: '2',
    lotNumber: 'LOT-2026-002',
    orderId: '2',
    productId: '1',
    productName: 'Frac Sand 30/50',
    status: 'in_progress',
    technicianId: '4',
    technicianName: 'Carlos Rodríguez',
  },
  {
    id: '3',
    lotNumber: 'LOT-2026-003',
    orderId: '3',
    productId: '2',
    productName: 'Frac Sand 40/70',
    status: 'pending',
  },
];

// Mock Certificates
export const mockCertificates: Certificate[] = [
  {
    id: '1',
    certificateNumber: 'CERT-2026-001',
    lotNumber: 'LOT-2026-001',
    productId: '1',
    productName: 'Frac Sand 30/50',
    testDate: '2026-01-16T07:00:00Z',
    results: {
      meshSize: '30/50',
      purity: 98.5,
      roundness: 0.85,
      moisture: 0.2,
    },
    passed: true,
    technicianName: 'Carlos Rodríguez',
    truckId: '4',
    truckLicensePlate: 'JKL-012',
    orderId: '1',
  },
];

// Mock Invoices
export const mockInvoices: Invoice[] = [
  {
    id: '1',
    invoiceNumber: 'INV-2026-0001',
    orderId: '1',
    orderNumber: 'ORD-2026-0001',
    customerId: '1',
    customerName: 'YPF',
    issueDate: '2026-01-16',
    dueDate: '2026-02-15',
    items: [
      { description: 'Frac Sand 30/50 - 50 tons', quantity: 50, unitPrice: 95, total: 4750 },
    ],
    subtotal: 4750,
    tax: 0,
    total: 4750,
    paymentStatus: 'paid',
    paidDate: '2026-01-20',
    attachments: {
      certificate: 'CERT-2026-001',
      signature: 'SIG-2026-001',
      traceabilityReport: 'TRACE-2026-001',
    },
    daysOutstanding: 0,
  },
  {
    id: '2',
    invoiceNumber: 'INV-2026-0002',
    orderId: '2',
    orderNumber: 'ORD-2026-0002',
    customerId: '1',
    customerName: 'YPF',
    issueDate: '2026-01-17',
    dueDate: '2026-02-16',
    items: [
      { description: 'Frac Sand 30/50 - 75 tons', quantity: 75, unitPrice: 95, total: 7125 },
    ],
    subtotal: 7125,
    tax: 0,
    total: 7125,
    paymentStatus: 'pending',
    attachments: {
      certificate: 'CERT-2026-002',
      signature: 'SIG-2026-002',
      traceabilityReport: 'TRACE-2026-002',
    },
    daysOutstanding: 5,
  },
];

// Mock Inventory (deprecated - use inventoryApi.getAll() instead)
export const mockInventory: Inventory[] = [
  { 
    id: 'mock-1', 
    productId: '1', 
    productName: 'Frac Sand 30/50', 
    location: 'quarry', 
    quantity: 500, 
    reserved: 150, 
    available: 350,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'mock-2', 
    productId: '1', 
    productName: 'Frac Sand 30/50', 
    location: 'buffer', 
    quantity: 200, 
    reserved: 0, 
    available: 200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'mock-3', 
    productId: '2', 
    productName: 'Frac Sand 40/70', 
    location: 'quarry', 
    quantity: 300, 
    reserved: 75, 
    available: 225,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  { 
    id: 'mock-4', 
    productId: '2', 
    productName: 'Frac Sand 40/70', 
    location: 'buffer', 
    quantity: 150, 
    reserved: 0, 
    available: 150,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

