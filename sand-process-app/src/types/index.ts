export type UserRole = 
  | 'admin'
  | 'operations_manager'
  | 'jefatura'
  | 'dispatcher'
  | 'driver'
  | 'qc_technician'
  | 'accounting_manager'
  | 'inventory_manager'
  | 'customer_user';

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'in_production'
  | 'qc'
  | 'ready'
  | 'dispatched'
  | 'delivered'
  | 'completed'
  | 'invoiced';

export type TruckStatus = 
  | 'available'
  | 'assigned'
  | 'in_transit'
  | 'loading'
  | 'delivering'
  | 'returning'
  | 'maintenance'
  | 'broken_down'
  | 'stuck';

export type PaymentStatus = 
  | 'pending'
  | 'paid'
  | 'overdue'
  | 'partial';

export type QCStatus = 
  | 'pending'
  | 'in_progress'
  | 'passed'
  | 'failed';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface TaskItem {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  count: number;
  link: string;
  role: UserRole;
}

export interface Customer {
  id: string;
  name: string;
  code: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  active: boolean;
}

export interface MSA {
  id: string;
  customerId: string;
  customerName: string;
  startDate: string;
  endDate: string;
  pricing: Record<string, number>; // product -> price per ton
  paymentTerms: string; // "Net 30", "Net 60"
  volumeCommitment?: number; // tons per month
  active: boolean;
}

export interface Product {
  id: string;
  name: string;
  meshSize: string; // "30/50", "40/70"
  description: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  msaId?: string;
  products: Array<{
    productId: string;
    productName: string;
    quantity: number; // tons
    unitPrice: number;
  }>;
  deliveryDate: string;
  deliveryLocation: string;
  deliveryAddress: string;
  status: OrderStatus;
  totalAmount: number;
  createdAt: string;
  notes?: string;
  /** Dispatcher: priority (optional, derived or from rules) */
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  /** Dispatcher: requested delivery window (e.g. "8:00–12:00") */
  requestedWindow?: string;
  /** Dispatcher: assigned source id (warehouse or truck) */
  assignedSourceId?: string;
  /** Dispatcher: assigned truck id */
  assignedTruckId?: string;
}

export type RecommendationSourceType = 'QUARRY_WAREHOUSE' | 'NEAR_WELL_WAREHOUSE' | 'TRUCK_IN_TRANSIT' | 'PRODUCE';

export interface RecommendationOption {
  id: string;
  rank: number;
  sourceType: RecommendationSourceType;
  sourceId: string;
  sourceLabel: string;
  truckId?: string;
  truckLabel?: string;
  eta: string;
  /** ETA in minutes for display */
  etaMinutes?: number;
  distanceKm?: number;
  estimatedCost?: number;
  onTimeProbability?: number;
  inventoryImpact?: string;
  reasonText: string;
  /** Redirect: from order (when re-route) */
  isRedirect?: boolean;
  fromOrderId?: string;
  fromOrderNumber?: string;
  impactOnOriginalOrder?: string;
  /** Inventory available (tons); N/A for redirect */
  inventoryAvailable?: number | 'N/A';
  /** Truck labels that can fulfill this option */
  trucksAvailable?: string[];
  /** Can we fulfill from this option? */
  canFulfill?: boolean;
  /** Why we cannot fulfill (when canFulfill is false, warehouse options only) */
  cannotFulfillReason?: string;
  /** Option 3 placeholder when no redirect possible */
  redirectUnavailable?: boolean;
}

export type InventoryRecommendationAction = 'increase' | 'decrease' | 'maintain';

export interface InventoryRecommendation {
  id: string;
  siteId: string;
  siteName: string;
  productId: string;
  productName: string;
  currentLevel: number;
  reserved: number;
  available: number;
  suggestedMin: number;
  suggestedMax: number;
  action: InventoryRecommendationAction;
  reason: string;
  priority: 'high' | 'medium' | 'low';
}

export interface AssignmentPayload {
  orderId: string;
  sourceType: RecommendationSourceType;
  sourceId: string;
  truckId?: string;
  reason?: string;
  /** Redirect: order currently assigned to the truck (from) */
  fromOrderId?: string;
}

export type AssignmentRequestStatus = 'pending_approval' | 'approved' | 'rejected';

export interface AssignmentRequest {
  id: string;
  orderId: string;
  orderNumber?: string;
  customerName?: string;
  sourceType: RecommendationSourceType;
  sourceId: string;
  sourceLabel?: string;
  truckId?: string | null;
  truckLabel?: string | null;
  reason?: string | null;
  status: AssignmentRequestStatus;
  requestedBy: string;
  requestedByName?: string;
  requestedAt: string;
  approvedBy?: string | null;
  approvedByName?: string | null;
  approvedAt?: string | null;
  rejectionReason?: string | null;
}

export type RuleConditionField = 'order_size' | 'urgency' | 'customer' | 'region' | 'product';
export type RuleConditionOp = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'in';
export type RuleActionType = 'prefer_warehouse' | 'prefer_quarry' | 'allow_redirect' | 'max_delay_min' | 'use_safety_stock_if_urgent' | 'optimization';

export interface RuleCondition {
  field: RuleConditionField;
  op: RuleConditionOp;
  value: string | number | string[];
}

export interface Rule {
  id: string;
  name: string;
  condition: RuleCondition;
  action: { type: RuleActionType; value?: string | number };
  priority: number;
  active: boolean;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type RedirectRequestStatus = 'pending_jefatura' | 'pending_gerencia' | 'pending_approval' | 'approved' | 'rejected';

export interface RedirectRequest {
  id: string;
  fromOrderId: string;
  fromOrderNumber?: string;
  toOrderId: string;
  toOrderNumber?: string;
  truckId: string;
  truckLabel?: string;
  reason?: string | null;
  impactOnOriginalOrder?: string | null;
  status: RedirectRequestStatus;
  requestedBy: string;
  requestedByName?: string | null;
  requestedAt: string;
  approvedBy?: string | null;
  approvedAt?: string | null;
  approvedByJefatura?: string | null;
  approvedAtJefatura?: string | null;
  approvedByGerencia?: string | null;
  approvedAtGerencia?: string | null;
  rejectionReason?: string | null;
}

export interface Truck {
  id: string;
  licensePlate: string;
  capacity: number; // tons
  type: 'old' | 'new';
  status: TruckStatus;
  currentLocation?: {
    lat: number;
    lng: number;
  };
  assignedOrderId?: string;
  driverId?: string;
  driverName?: string;
  lastMaintenance?: string;
  nextMaintenance?: string;
}

export interface Driver {
  id: string;
  name: string;
  licenseNumber: string;
  phone: string;
  hoursWorked: number;
  hoursLimit: number;
  available: boolean;
}

export interface Delivery {
  id: string;
  orderId: string;
  orderNumber: string;
  truckId: string;
  truckLicensePlate: string;
  driverId: string;
  driverName: string;
  customerId: string;
  customerName: string;
  route: {
    quarry: { lat: number; lng: number; name: string };
    buffer?: { lat: number; lng: number; name: string };
    well: { lat: number; lng: number; name: string; address: string };
  };
  checkpoints: Checkpoint[];
  gpsTrack: GPSPoint[];
  eta?: string;
  actualArrival?: string;
  waitTime?: number; // minutes
  signature?: Signature;
  photos?: string[];
  status: 'assigned' | 'in_transit' | 'arrived' | 'delivering' | 'delivered';
  createdAt: string;
}

export interface Checkpoint {
  id: string;
  name: string;
  type: 'truck_assigned' | 'load_start' | 'load_complete' | 'quarry_exit' | 
        'buffer_arrival' | 'buffer_exit' | 'well_arrival' | 'wait_start' | 
        'unload_start' | 'unload_complete' | 'signature_captured' | 'well_exit';
  timestamp: string;
  location: { lat: number; lng: number };
  autoDetected: boolean;
}

export interface GPSPoint {
  timestamp: string;
  lat: number;
  lng: number;
  speed?: number;
}

export interface Signature {
  signerName: string;
  signerTitle: string;
  timestamp: string;
  location: { lat: number; lng: number };
  signatureImage?: string; // Base64 encoded signature image
  photo?: string; // Base64 encoded delivery photo
}

export interface QCTest {
  id: string;
  lotNumber: string;
  orderId?: string;
  orderNumber?: string;
  productId: string;
  productName: string;
  quantity?: number;
  siteId?: string;
  status: QCStatus;
  testDate?: string;
  createdAt?: string;
  results?: {
    meshSize: { passed: boolean; value: string };
    purity: { passed: boolean; value: number };
    roundness: { passed: boolean; value: number };
    moisture: { passed: boolean; value: number };
  };
  certificateId?: string;
  technicianId?: string;
  technicianName?: string;
  truckId?: string;
  truckLicensePlate?: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  lotNumber: string;
  productId: string;
  productName: string;
  testDate: string;
  results: {
    meshSize: string;
    purity: number;
    roundness: number;
    moisture: number;
  };
  passed: boolean;
  technicianName: string;
  truckId?: string;
  truckLicensePlate?: string;
  orderId?: string;
  pdfUrl?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerId: string;
  customerName: string;
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
  paymentStatus: PaymentStatus;
  paidDate?: string;
  attachments: {
    certificate?: string;
    signature?: string;
    traceabilityReport?: string;
  };
  daysOutstanding: number;
}

export interface Inventory {
  productId: string;
  productName: string;
  location: 'quarry' | 'buffer' | 'in_transit';
  quantity: number; // tons
  reserved: number; // tons
  available: number; // tons
}

export interface Geofence {
  id: string;
  name: string;
  type: 'quarry' | 'buffer' | 'well' | 'prohibited';
  coordinates: Array<{ lat: number; lng: number }>;
  active: boolean;
}

