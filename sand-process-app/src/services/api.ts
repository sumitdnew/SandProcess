import { supabase } from '../config/supabase';
import { Database } from '../config/supabase';
import { Order, Customer, Product, MSA, Truck, Driver, Delivery, QCTest, Invoice, RecommendationOption, AssignmentPayload, AssignmentRequest, AssignmentRequestStatus, RecommendationSourceType, Rule, RuleCondition, RuleActionType, RedirectRequest, RedirectRequestStatus, InventoryRecommendation, InventoryRecommendationAction, TaskItem, UserRole } from '../types';

type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row'];

// Customers
export const customersApi = {
  getAll: async (): Promise<Customer[]> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('active', true)
      .order('name');
    
    if (error) throw error;
    return data.map(transformCustomer);
  },

  getById: async (id: string): Promise<Customer | null> => {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data ? transformCustomer(data) : null;
  },

  create: async (customerData: {
    name: string;
    code: string;
    contactPerson: string;
    email: string;
    phone: string;
    address?: string;
  }): Promise<Customer> => {
    const { data, error } = await supabase
      .from('customers')
      .insert({
        name: customerData.name,
        code: customerData.code,
        contact_person: customerData.contactPerson,
        email: customerData.email,
        phone: customerData.phone,
        address: customerData.address || '',
        active: true,
      })
      .select()
      .single();
    
    if (error) throw error;
    return transformCustomer(data);
  },
};

function transformCustomer(row: Tables<'customers'>): Customer {
  return {
    id: row.id,
    name: row.name,
    code: row.code,
    contactPerson: row.contact_person,
    email: row.email,
    phone: row.phone,
    address: row.address,
    active: row.active,
  };
}

// Products
export const productsApi = {
  getAll: async (): Promise<Product[]> => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data.map(transformProduct);
  },
};

function transformProduct(row: Tables<'products'>): Product {
  return {
    id: row.id,
    name: row.name,
    meshSize: row.mesh_size,
    description: row.description,
  };
}

// MSAs
export const msasApi = {
  getAll: async (): Promise<MSA[]> => {
    const { data, error } = await supabase
      .from('msas')
      .select('*, customers(name)')
      .eq('active', true)
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    return data.map(transformMSA);
  },

  getByCustomerId: async (customerId: string): Promise<MSA | null> => {
    const { data, error } = await supabase
      .from('msas')
      .select('*, customers(name)')
      .eq('customer_id', customerId)
      .eq('active', true)
      .single();
    
    if (error) throw error;
    return data ? transformMSA(data as any) : null;
  },

  create: async (msaData: {
    customerId: string;
    startDate: string;
    endDate: string;
    pricing: Record<string, number>;
    paymentTerms: string;
    volumeCommitment?: number;
  }): Promise<MSA> => {
    const { data, error } = await supabase
      .from('msas')
      .insert({
        customer_id: msaData.customerId,
        start_date: msaData.startDate,
        end_date: msaData.endDate,
        pricing: msaData.pricing,
        payment_terms: msaData.paymentTerms,
        volume_commitment: msaData.volumeCommitment || null,
        active: true,
      })
      .select('*, customers(name)')
      .single();
    
    if (error) throw error;
    return transformMSA(data as any);
  },
};

function transformMSA(row: any): MSA {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customers?.name || '',
    startDate: row.start_date,
    endDate: row.end_date,
    pricing: row.pricing,
    paymentTerms: row.payment_terms,
    volumeCommitment: row.volume_commitment,
    active: row.active,
  };
}

// Orders
export const ordersApi = {
  getAll: async (): Promise<Order[]> => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(name),
        order_items(*, products(name))
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Supabase error loading orders:', error);
      throw error;
    }
    if (!data || data.length === 0) return [];
    return data.map(transformOrder);
  },

  getById: async (id: string): Promise<Order | null> => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(name),
        order_items(*, products(name))
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data ? transformOrder(data) : null;
  },

  create: async (orderData: {
    customerId: string;
    msaId?: string;
    deliveryDate: string;
    deliveryLocation: string;
    deliveryAddress: string;
    products: Array<{ productId: string; quantity: number; unitPrice: number }>;
    notes?: string;
  }): Promise<Order> => {
    // Generate order number
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .like('order_number', `ORD-${year}-%`);
    
    const orderNumber = `ORD-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
    
    // Calculate total
    const totalAmount = orderData.products.reduce(
      (sum, p) => sum + p.quantity * p.unitPrice,
      0
    );

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_number: orderNumber,
        customer_id: orderData.customerId,
        msa_id: orderData.msaId || null,
        delivery_date: orderData.deliveryDate,
        delivery_location: orderData.deliveryLocation,
        delivery_address: orderData.deliveryAddress,
        status: 'pending',
        total_amount: totalAmount,
        notes: orderData.notes || null,
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Insert order items
    const orderItems = orderData.products.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems);

    if (itemsError) throw itemsError;

    // Fetch complete order
    return ordersApi.getById(order.id) as Promise<Order>;
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) throw error;
  },

  hasCertificate: async (id: string): Promise<boolean> => {
    // Check if order has a passed QC test with a certificate
    const { data, error } = await supabase
      .from('qc_tests')
      .select('id, certificate_id, status')
      .eq('order_id', id)
      .eq('status', 'passed')
      .not('certificate_id', 'is', null);
    
    if (error) {
      console.error('Error checking certificate:', error);
      return false;
    }
    
    return data && data.length > 0;
  },

  checkInventory: async (id: string): Promise<boolean> => {
    // Simplified inventory check - in real system, would check actual stock levels
    // For now, we'll assume inventory is available if order exists
    // TODO: Implement proper inventory check against inventory table
    const order = await ordersApi.getById(id);
    if (!order) return false;
    
    // For prototype, we'll return true but log a warning
    console.log('Inventory check for order:', order.orderNumber, '- Assuming sufficient inventory');
    return true;
  },
};

function transformOrder(row: any): Order {
  // Handle nested customer data (Supabase returns it as an object or array)
  let customerName = '';
  if (row.customers) {
    if (Array.isArray(row.customers)) {
      customerName = row.customers[0]?.name || '';
    } else {
      customerName = row.customers.name || '';
    }
  }
  
  // Handle nested order_items
  let products: any[] = [];
  if (row.order_items) {
    if (Array.isArray(row.order_items)) {
      products = row.order_items.map((item: any) => ({
        productId: item.product_id,
        productName: item.products?.name || (Array.isArray(item.products) ? item.products[0]?.name : ''),
        quantity: parseFloat(item.quantity) || 0,
        unitPrice: parseFloat(item.unit_price) || 0,
      }));
    }
  }
  
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    customerName: customerName,
    msaId: row.msa_id,
    products: products,
    deliveryDate: row.delivery_date,
    deliveryLocation: row.delivery_location,
    deliveryAddress: row.delivery_address,
    status: row.status as any,
    totalAmount: parseFloat(row.total_amount) || 0,
    createdAt: row.created_at,
    notes: row.notes,
  };
}

// Trucks
export const trucksApi = {
  getAll: async (): Promise<Truck[]> => {
    const { data, error } = await supabase
      .from('trucks')
      .select('*, drivers(name)')
      .order('license_plate');
    
    if (error) throw error;
    return data.map(transformTruck);
  },

  updateStatus: async (id: string, status: string): Promise<void> => {
    const { error } = await supabase.from('trucks').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  },
};

function transformTruck(row: any): Truck {
  return {
    id: row.id,
    licensePlate: row.license_plate,
    capacity: row.capacity,
    type: row.type,
    status: row.status as any,
    driverId: row.driver_id,
    driverName: row.drivers?.name,
    assignedOrderId: row.assigned_order_id,
    lastMaintenance: row.last_maintenance,
    nextMaintenance: row.next_maintenance,
  };
}

// Drivers
export const driversApi = {
  getAll: async (): Promise<Driver[]> => {
    const { data, error } = await supabase
      .from('drivers')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data.map(transformDriver);
  },
};

function transformDriver(row: Tables<'drivers'>): Driver {
  return {
    id: row.id,
    name: row.name,
    licenseNumber: row.license_number,
    phone: row.phone,
    hoursWorked: row.hours_worked,
    hoursLimit: row.hours_limit,
    available: row.available,
  };
}

// Deliveries
export const deliveriesApi = {
  getAll: async (): Promise<Delivery[]> => {
    const { data, error } = await supabase
      .from('deliveries')
      .select(`
        *,
        orders(order_number, customers(name)),
        trucks(license_plate),
        drivers(name)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(transformDelivery);
  },
};

function transformDelivery(row: any): Delivery {
  // Parse checkpoints from JSONB
  let checkpoints: any[] = [];
  if (row.checkpoints) {
    if (typeof row.checkpoints === 'string') {
      try {
        checkpoints = JSON.parse(row.checkpoints);
      } catch (e) {
        console.error('Error parsing checkpoints:', e);
      }
    } else if (Array.isArray(row.checkpoints)) {
      checkpoints = row.checkpoints;
    } else if (typeof row.checkpoints === 'object') {
      checkpoints = Object.values(row.checkpoints);
    }
  }

  // Parse GPS track from JSONB
  let gpsTrack: any[] = [];
  if (row.gps_track) {
    if (typeof row.gps_track === 'string') {
      try {
        gpsTrack = JSON.parse(row.gps_track);
      } catch (e) {
        console.error('Error parsing GPS track:', e);
      }
    } else if (Array.isArray(row.gps_track)) {
      gpsTrack = row.gps_track;
    } else if (typeof row.gps_track === 'object') {
      gpsTrack = Object.values(row.gps_track);
    }
  }

  // Parse signature from JSONB
  let signature: any = null;
  if (row.signature) {
    if (typeof row.signature === 'string') {
      try {
        signature = JSON.parse(row.signature);
      } catch (e) {
        console.error('Error parsing signature:', e);
      }
    } else if (typeof row.signature === 'object') {
      signature = row.signature;
    }
  }

  return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: row.orders?.order_number || '',
    truckId: row.truck_id,
    truckLicensePlate: row.trucks?.license_plate || '',
    driverId: row.driver_id,
    driverName: row.drivers?.name || '',
    customerId: '',
    customerName: row.orders?.customers?.name || '',
    route: {
      quarry: { lat: -38.5, lng: -69.0, name: 'Cantera Principal' },
      well: { lat: -38.6, lng: -69.1, name: '', address: '' },
    },
    checkpoints: checkpoints,
    gpsTrack: gpsTrack,
    signature: signature,
    eta: row.eta,
    actualArrival: row.actual_arrival,
    waitTime: row.wait_time,
    status: row.status as any,
    createdAt: row.created_at,
  };
}

// QC Tests
export const qcTestsApi = {
  getAll: async (): Promise<QCTest[]> => {
    const { data, error } = await supabase
      .from('qc_tests')
      .select(`
        *,
        products(name),
        trucks(license_plate),
        orders(order_number)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(transformQCTest);
  },

  /** Pending QC lots from "Produce to inventory" (order_id null, status pending). */
  getPendingLots: async (): Promise<QCTest[]> => {
    const { data, error } = await supabase
      .from('qc_tests')
      .select(`
        *,
        products(name)
      `)
      .is('order_id', null)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      lotNumber: row.lot_number,
      orderId: row.order_id,
      orderNumber: undefined,
      productId: row.product_id,
      productName: row.products?.name ?? (Array.isArray(row.products) ? row.products[0]?.name : '') ?? '',
      quantity: row.quantity != null ? Number(row.quantity) : undefined,
      siteId: row.site_id ?? undefined,
      status: row.status,
      testDate: row.test_date,
      createdAt: row.created_at,
      results: row.results,
      certificateId: row.certificate_id,
      technicianId: row.technician_id,
      truckId: row.truck_id,
      truckLicensePlate: undefined,
    }));
  },

  /** Passed QC lots from produce-to-inv (order_id null, status passed). Available for fulfillment. */
  getAvailableLots: async (siteId?: string): Promise<QCTest[]> => {
    let q = supabase
      .from('qc_tests')
      .select(`*, products(name)`)
      .is('order_id', null)
      .eq('status', 'passed');
    if (siteId) q = q.eq('site_id', siteId);
    const { data, error } = await q.order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      lotNumber: row.lot_number,
      orderId: row.order_id,
      orderNumber: undefined,
      productId: row.product_id,
      productName: row.products?.name ?? (Array.isArray(row.products) ? row.products[0]?.name : '') ?? '',
      quantity: row.quantity != null ? Number(row.quantity) : undefined,
      siteId: row.site_id ?? undefined,
      status: row.status,
      testDate: row.test_date,
      createdAt: row.created_at,
      results: row.results,
      certificateId: row.certificate_id,
      technicianId: row.technician_id,
      truckId: row.truck_id,
      truckLicensePlate: undefined,
    }));
  },
};

function transformQCTest(row: any): QCTest {
  return {
    id: row.id,
    lotNumber: row.lot_number,
    orderId: row.order_id,
    orderNumber: row.orders?.order_number || (Array.isArray(row.orders) ? row.orders[0]?.order_number : null),
    productId: row.product_id,
    productName: row.products?.name || (Array.isArray(row.products) ? row.products[0]?.name : '') || '',
    quantity: row.quantity != null ? Number(row.quantity) : undefined,
    siteId: row.site_id ?? undefined,
    status: row.status as any,
    testDate: row.test_date,
    createdAt: row.created_at,
    results: row.results,
    certificateId: row.certificate_id,
    technicianId: row.technician_id,
    truckId: row.truck_id,
    truckLicensePlate: row.trucks?.license_plate,
  };
}

// Invoices
export const invoicesApi = {
  getAll: async (): Promise<Invoice[]> => {
    const { data, error } = await supabase
      .from('invoices')
      .select('*, orders(order_number), customers(name)')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data.map(transformInvoice);
  },
};

function transformInvoice(row: any): Invoice {
  return {
    id: row.id,
    invoiceNumber: row.invoice_number,
    orderId: row.order_id,
    orderNumber: row.orders?.order_number || '',
    customerId: row.customer_id,
    customerName: row.customers?.name || '',
    issueDate: row.issue_date,
    dueDate: row.due_date,
    items: [],
    subtotal: row.subtotal,
    tax: row.tax,
    total: row.total,
    paymentStatus: row.payment_status as any,
    paidDate: row.paid_date,
    attachments: {},
    daysOutstanding: row.days_outstanding,
  };
}

// Helpers for rule-based recommendations
function matchesRule(rule: Rule, ctx: { orderTons: number; urgency: string; customerId: string; deliveryLocation: string }): boolean {
  const c = rule.condition;
  if (!c?.field || c.op == null) return false;
  const v = c.value;
  switch (c.field) {
    case 'order_size':
      const tons = typeof v === 'number' ? v : Number(v);
      if (Number.isNaN(tons)) return false;
      switch (c.op) {
        case 'gt': return ctx.orderTons > tons;
        case 'gte': return ctx.orderTons >= tons;
        case 'lt': return ctx.orderTons < tons;
        case 'lte': return ctx.orderTons <= tons;
        case 'eq': return ctx.orderTons === tons;
        default: return false;
      }
    case 'urgency':
      const u = String(v ?? '').toLowerCase();
      switch (c.op) {
        case 'eq': return (ctx.urgency ?? 'normal').toLowerCase() === u;
        case 'in': return Array.isArray(v) && (v as string[]).map(s => String(s).toLowerCase()).includes((ctx.urgency ?? 'normal').toLowerCase());
        default: return false;
      }
    case 'customer':
      switch (c.op) {
        case 'eq': return ctx.customerId === v;
        case 'in': return Array.isArray(v) && (v as string[]).includes(ctx.customerId);
        default: return false;
      }
    case 'region':
      const loc = (ctx.deliveryLocation ?? '').toLowerCase();
      const rv = String(v ?? '').toLowerCase();
      switch (c.op) {
        case 'eq': return loc === rv;
        case 'in': return Array.isArray(v) && (v as string[]).some(s => loc.includes(String(s).toLowerCase()));
        default: return false;
      }
    default:
      return false;
  }
}

function applyRule(rule: Rule, options: RecommendationOption[]): void {
  const a = rule.action;
  if (!a?.type) return;
  switch (a.type) {
    case 'prefer_quarry':
      options.filter(o => o.sourceType === 'QUARRY_WAREHOUSE').forEach(o => { o.onTimeProbability = (o.onTimeProbability ?? 0) + 0.05; });
      break;
    case 'prefer_warehouse':
      options.filter(o => o.sourceType === 'NEAR_WELL_WAREHOUSE').forEach(o => { o.onTimeProbability = (o.onTimeProbability ?? 0) + 0.05; });
      break;
    case 'optimization':
      // JIT-first is default; no extra boost
      break;
    default:
      break;
  }
}

const ONSITE_ETA_MIN = 45;
const QUARRY_DISTANCE_KM = 140;
const QUARRY_ETA_MIN = 210; // 3.5 h

// Dispatcher: recommendations and assignment
export const dispatcherApi = {
  getOrderRecommendations: async (orderId: string): Promise<RecommendationOption[]> => {
    const [order, trucks, drivers, activeRules, balances] = await Promise.all([
      ordersApi.getById(orderId),
      trucksApi.getAll(),
      driversApi.getAll(),
      rulesApi.getActive().catch(() => [] as Rule[]),
      inventoryApi.getBalances().catch(() => [] as InventoryBalanceRow[]),
    ]);
    if (!order) return [];

    const orderTons = order.products.reduce((s, p) => s + p.quantity, 0);
    const onsiteAvailable = balances
      .filter((b) => b.siteId === 'near_well')
      .reduce((s, b) => s + b.quantity, 0);
    const quarryAvailable = balances
      .filter((b) => b.siteId === 'quarry')
      .reduce((s, b) => s + b.quantity, 0);
    const allAvailableTrucks = trucks.filter(t => t.status === 'available');
    const sortedByCap = [...allAvailableTrucks].sort((a, b) => b.capacity - a.capacity);
    let sum = 0;
    const trucksNeeded: typeof allAvailableTrucks = [];
    for (const t of sortedByCap) {
      trucksNeeded.push(t);
      sum += t.capacity;
      if (sum >= orderTons) break;
    }
    const totalCapacity = sum;
    const availableDrivers = drivers.filter(d => d.available);
    const enoughDrivers = availableDrivers.length >= trucksNeeded.length;
    const hasTruckAndDriver = trucksNeeded.length > 0 && enoughDrivers;
    const noDriver = availableDrivers.length === 0;
    const noTruck = allAvailableTrucks.length === 0;
    const orderTooLarge = allAvailableTrucks.length > 0 && totalCapacity < orderTons;

    const truckLabels = trucksNeeded.length === 0
      ? [] as string[]
      : trucksNeeded.length === 1
        ? [`${trucksNeeded[0].licensePlate} (${trucksNeeded[0].capacity} t)`]
        : [
            ...trucksNeeded.map(t => `${t.licensePlate} (${t.capacity} t)`),
            `— ${trucksNeeded.length} trucks, ${totalCapacity} t total`,
          ];
    const bestTruck = trucksNeeded[0];

    const truckDriverReason = (): string | undefined => {
      if (hasTruckAndDriver) return undefined;
      if (noDriver) return 'No available driver.';
      if (orderTooLarge) return `Total truck capacity (${totalCapacity} t) insufficient for order (${orderTons} t). Use more trucks or produce.`;
      if (noTruck) return 'No available truck.';
      if (!enoughDrivers) return `Need ${trucksNeeded.length} drivers; only ${availableDrivers.length} available.`;
      return 'No available truck or driver.';
    };

    const inTransitTrucks = trucks.filter(
      (t: { status: string; capacity: number }) =>
        (t.status === 'in_transit' || t.status === 'assigned') && t.capacity >= orderTons
    );

    const onsiteInv = Math.round(Number(onsiteAvailable) * 10) / 10;
    const quarryInv = Math.round(Number(quarryAvailable) * 10) / 10;
    const onsiteCanFulfill = hasTruckAndDriver && onsiteAvailable >= orderTons;
    const quarryCanFulfill = hasTruckAndDriver && quarryAvailable >= orderTons;

    const warehouseReason = (): string | undefined => {
      if (!hasTruckAndDriver) return truckDriverReason() ?? undefined;
      return undefined;
    };
    const onsiteReason = (): string | undefined => {
      if (!hasTruckAndDriver) return warehouseReason();
      if (onsiteAvailable <= 0) return 'No inventory at this site.';
      if (onsiteAvailable < orderTons) return `Insufficient inventory (${onsiteInv} t; order needs ${orderTons} t).`;
      return undefined;
    };
    const quarryReason = (): string | undefined => {
      if (!hasTruckAndDriver) return warehouseReason();
      if (quarryAvailable <= 0) return 'No inventory at this site.';
      if (quarryAvailable < orderTons) return `Insufficient inventory (${quarryInv} t; order needs ${orderTons} t).`;
      return undefined;
    };

    const options: RecommendationOption[] = [];

    const now = new Date();

    // Option 1: From On-Site Warehouse (near wells, 30–60 min)
    options.push({
      id: `rec-onsite-${orderId}`,
      rank: 1,
      sourceType: 'NEAR_WELL_WAREHOUSE',
      sourceId: 'wh-near-well',
      sourceLabel: 'On-Site Warehouse',
      truckId: bestTruck?.id,
      truckLabel: bestTruck ? `${bestTruck.licensePlate} (${bestTruck.capacity} t)` : undefined,
      eta: new Date(now.getTime() + ONSITE_ETA_MIN * 60 * 1000).toISOString(),
      etaMinutes: ONSITE_ETA_MIN,
      distanceKm: 25,
      estimatedCost: 180,
      onTimeProbability: 0.92,
      inventoryImpact: `Reserve ${orderTons} tons at on-site.`,
      reasonText: 'Shortest ETA and low transport cost.',
      inventoryAvailable: onsiteInv,
      trucksAvailable: truckLabels,
      canFulfill: onsiteCanFulfill,
      cannotFulfillReason: onsiteReason(),
    });

    // Option 2: From Quarry (140 km, 3–4 h)
    options.push({
      id: `rec-quarry-${orderId}`,
      rank: 2,
      sourceType: 'QUARRY_WAREHOUSE',
      sourceId: 'wh-quarry',
      sourceLabel: 'Quarry Warehouse',
      truckId: bestTruck?.id,
      truckLabel: bestTruck ? `${bestTruck.licensePlate} (${bestTruck.capacity} t)` : undefined,
      eta: new Date(now.getTime() + QUARRY_ETA_MIN * 60 * 1000).toISOString(),
      etaMinutes: QUARRY_ETA_MIN,
      distanceKm: QUARRY_DISTANCE_KM,
      estimatedCost: 320,
      onTimeProbability: 0.85,
      inventoryImpact: `Use ${orderTons} tons from quarry stock.`,
      reasonText: quarryAvailable > 0 ? 'High inventory availability.' : 'Quarry warehouse.',
      inventoryAvailable: quarryInv,
      trucksAvailable: truckLabels,
      canFulfill: quarryCanFulfill,
      cannotFulfillReason: quarryReason(),
    });

    // Option 3: Redirect truck (if possible) — mobile stock, requires approval
    const rerouteTruck = inTransitTrucks.find(t => t.assignedOrderId);
    if (rerouteTruck) {
      let fromOrderNumber: string | undefined;
      let impactOnOriginalOrder = 'Original delivery may be delayed.';
      if (rerouteTruck.assignedOrderId) {
        try {
          const fromOrder = await ordersApi.getById(rerouteTruck.assignedOrderId);
          if (fromOrder) {
            fromOrderNumber = fromOrder.orderNumber;
            impactOnOriginalOrder = `Order ${fromOrder.orderNumber} delayed; substitute needed.`;
          }
        } catch {
          impactOnOriginalOrder = 'Original assignment cleared; substitute needed.';
        }
      }
      options.push({
        id: `rec-redirect-${rerouteTruck.id}-${orderId}`,
        rank: 3,
        sourceType: 'TRUCK_IN_TRANSIT',
        sourceId: rerouteTruck.id,
        sourceLabel: 'Redirect truck (mobile stock)',
        truckId: rerouteTruck.id,
        truckLabel: `${rerouteTruck.licensePlate} (in transit)`,
        eta: new Date(now.getTime() + 50 * 60 * 1000).toISOString(),
        etaMinutes: 50,
        distanceKm: 15,
        estimatedCost: 120,
        onTimeProbability: 0.78,
        inventoryImpact: 'Redirect current load; may delay original delivery.',
        reasonText: 'Urgent option: truck nearby. Requires approval.',
        isRedirect: true,
        fromOrderId: rerouteTruck.assignedOrderId,
        fromOrderNumber,
        impactOnOriginalOrder,
        inventoryAvailable: 'N/A',
        trucksAvailable: [`${rerouteTruck.licensePlate} (in transit)`],
        canFulfill: true,
      });
    } else {
      options.push({
        id: `rec-redirect-na-${orderId}`,
        rank: 3,
        sourceType: 'TRUCK_IN_TRANSIT',
        sourceId: 'redirect-na',
        sourceLabel: 'Redirect truck',
        eta: now.toISOString(),
        etaMinutes: 0,
        reasonText: 'No suitable in-transit truck to redirect.',
        inventoryAvailable: 'N/A',
        trucksAvailable: [],
        canFulfill: false,
        redirectUnavailable: true,
      });
    }

    // Option 4: Produce (last resort, ~150 t/h). Hide when order already ready (produced + QC'd).
    if (order.status !== 'ready') {
      const produceEtaMinutes = Math.ceil((orderTons / 150) * 60);
      const produceEta = new Date(now.getTime() + produceEtaMinutes * 60 * 1000).toISOString();
      options.push({
        id: `rec-produce-${orderId}`,
        rank: 4,
        sourceType: 'PRODUCE',
        sourceId: 'produce',
        sourceLabel: 'Produce',
        eta: produceEta,
        etaMinutes: produceEtaMinutes,
        reasonText: 'Last resort when inventory unavailable. Production ~150 t/h.',
        inventoryAvailable: 'N/A',
        trucksAvailable: [],
        canFulfill: true,
      });
    }

    // Apply active rules
    const ctx = {
      orderTons,
      urgency: order.priority ?? 'normal',
      customerId: order.customerId ?? '',
      deliveryLocation: order.deliveryLocation ?? '',
    };
    for (const rule of activeRules) {
      if (!rule.active) continue;
      if (matchesRule(rule, ctx)) applyRule(rule, options);
    }

    // Fulfillable options first, sorted by speed/cost (On-Site before Quarry). Among non-fulfillable, prefer inventory (desc) then score. Produce always last.
    const inv = (o: RecommendationOption) => (typeof o.inventoryAvailable === 'number' ? o.inventoryAvailable : 0);
    const score = (o: RecommendationOption) => {
      const p = o.onTimeProbability ?? 0;
      const c = o.estimatedCost ?? 0;
      const maxCost = Math.max(...options.map((x) => x.estimatedCost ?? 0), 1);
      return 0.7 * p - 0.3 * (c / maxCost);
    };
    const nonProduce = options.filter((o) => o.sourceType !== 'PRODUCE');
    const produceOpts = options.filter((o) => o.sourceType === 'PRODUCE');
    nonProduce.sort((a, b) => {
      const aOk = (a.canFulfill ?? false) && !a.redirectUnavailable;
      const bOk = (b.canFulfill ?? false) && !b.redirectUnavailable;
      if (aOk !== bOk) return aOk ? -1 : 1;
      if (aOk && bOk) return score(b) - score(a);
      const aInv = inv(a);
      const bInv = inv(b);
      if (aInv !== bInv) return bInv - aInv;
      return score(b) - score(a);
    });
    const sorted = [...nonProduce, ...produceOpts];
    sorted.forEach((o, i) => { o.rank = i + 1; });
    options.length = 0;
    options.push(...sorted);

    return options;
  },

  assign: async (payload: AssignmentPayload): Promise<void> => {
    const { orderId, sourceType, sourceId, truckId, fromOrderId } = payload;
    const order = await ordersApi.getById(orderId);
    if (!order) throw new Error('Order not found');

    const { data: existing } = await supabase
      .from('deliveries')
      .select('id')
      .eq('order_id', orderId)
      .neq('status', 'delivered')
      .limit(1)
      .maybeSingle();
    if ((existing as any)?.id) throw new Error('Order already has an active delivery.');

    if (sourceType === 'TRUCK_IN_TRANSIT' && (truckId || sourceId)) {
      const tid = truckId || sourceId;
      const [trucks, drivers] = await Promise.all([trucksApi.getAll(), driversApi.getAll()]);
      const truck = trucks.find(t => t.id === tid);
      let driverId: string | null = null;
      if (fromOrderId) {
        const { data: fromDel } = await supabase
          .from('deliveries')
          .select('driver_id')
          .eq('order_id', fromOrderId)
          .eq('truck_id', tid)
          .maybeSingle();
        driverId = (fromDel as any)?.driver_id ?? null;
        await supabase.from('deliveries').delete().eq('order_id', fromOrderId).eq('truck_id', tid);
        await ordersApi.updateStatus(fromOrderId, 'ready');
      }
      if (!driverId) driverId = drivers.find(d => d.available)?.id ?? null;
      if (!truck || !driverId) throw new Error('Truck or driver not available.');

      const eta = new Date();
      eta.setHours(eta.getHours() + 2);

      const { error: delError } = await supabase.from('deliveries').insert({
        order_id: orderId,
        truck_id: truck.id,
        driver_id: driverId,
        status: 'assigned',
        eta: eta.toISOString(),
      });
      if (delError) throw delError;

      const { data: certData } = await supabase
        .from('qc_tests')
        .select('id, certificate_id')
        .eq('order_id', orderId)
        .eq('status', 'passed')
        .not('certificate_id', 'is', null)
        .maybeSingle();
      if (certData?.certificate_id) {
        await supabase.from('qc_tests').update({ truck_id: truck.id }).eq('id', certData.id);
      }

      await ordersApi.updateStatus(orderId, 'ready');
      await supabase
        .from('trucks')
        .update({ status: 'assigned', assigned_order_id: orderId, driver_id: driverId })
        .eq('id', truck.id);
      return;
    }

    if (sourceType === 'QUARRY_WAREHOUSE' || sourceType === 'NEAR_WELL_WAREHOUSE') {
      const [trucks, drivers] = await Promise.all([trucksApi.getAll(), driversApi.getAll()]);
      const orderTons = order.products.reduce((s, p) => s + p.quantity, 0);
      const availableTrucks = trucks.filter(t => t.status === 'available');
      const sortedByCap = [...availableTrucks].sort((a, b) => b.capacity - a.capacity);
      let sum = 0;
      const trucksToUse: typeof availableTrucks = [];
      for (const t of sortedByCap) {
        trucksToUse.push(t);
        sum += t.capacity;
        if (sum >= orderTons) break;
      }
      const availableDriversList = drivers.filter(d => d.available);
      if (availableDriversList.length < trucksToUse.length) {
        throw new Error(
          `Need ${trucksToUse.length} drivers for multi-truck fulfill (${orderTons} t); only ${availableDriversList.length} available.`
        );
      }
      if (trucksToUse.length === 0 || sum < orderTons) {
        const totalCap = availableTrucks.reduce((s, t) => s + t.capacity, 0);
        throw new Error(
          `Total truck capacity (${totalCap} t) insufficient for order (${orderTons} t). Use produce or add trucks.`
        );
      }

      const eta = new Date();
      eta.setHours(eta.getHours() + 2);

      for (let i = 0; i < trucksToUse.length; i++) {
        const truck = trucksToUse[i];
        const driver = availableDriversList[i];
        const { error: delError } = await supabase.from('deliveries').insert({
          order_id: orderId,
          truck_id: truck.id,
          driver_id: driver.id,
          status: 'assigned',
          eta: eta.toISOString(),
        });
        if (delError) throw delError;
        await supabase
          .from('trucks')
          .update({ status: 'assigned', assigned_order_id: orderId, driver_id: driver.id })
          .eq('id', truck.id);
      }

      const { data: certData } = await supabase
        .from('qc_tests')
        .select('id, certificate_id')
        .eq('order_id', orderId)
        .eq('status', 'passed')
        .not('certificate_id', 'is', null)
        .limit(1)
        .maybeSingle();
      if ((certData as any)?.certificate_id) {
        await supabase.from('qc_tests').update({ truck_id: trucksToUse[0].id }).eq('id', (certData as any).id);
      }

      await ordersApi.updateStatus(orderId, 'ready');
    }
  },

  getBreakdownRecommendations: async (truckId: string): Promise<RecommendationOption[]> => {
    const [truck, order, trucks, drivers, activeRules] = await Promise.all([
      (async () => {
        const all = await trucksApi.getAll();
        return all.find(t => t.id === truckId) ?? null;
      })(),
      (async () => {
        const all = await trucksApi.getAll();
        const t = all.find(t => t.id === truckId);
        const oid = t?.assignedOrderId;
        return oid ? ordersApi.getById(oid) : null;
      })(),
      trucksApi.getAll(),
      driversApi.getAll(),
      rulesApi.getActive().catch(() => [] as Rule[]),
    ]);
    if (!truck || !order) return [];
    const orderTons = order.products.reduce((s, p) => s + p.quantity, 0);
    const availableTrucks = trucks.filter(
      t => t.id !== truckId && (t.status === 'available' || t.status === 'assigned' || t.status === 'in_transit') && t.capacity >= orderTons
    );
    const inTransitTrucks = trucks.filter(
      t => t.id !== truckId && (t.status === 'in_transit' || t.status === 'assigned') && t.capacity >= orderTons
    );
    const availableDrivers = drivers.filter(d => d.available);
    const options: RecommendationOption[] = [];
    let rank = 1;

    const nearWell = {
      id: `rec-bd-near-well-${order.id}`,
      rank: rank++,
      sourceType: 'NEAR_WELL_WAREHOUSE' as const,
      sourceId: 'wh-near-well',
      sourceLabel: 'Warehouse near wells',
      eta: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      distanceKm: 25,
      estimatedCost: 180,
      onTimeProbability: 0.92,
      inventoryImpact: `Reserve ${orderTons} tons at near-well site.`,
      reasonText: 'Replacement from nearby warehouse; shortest ETA.',
    };
    options.push(nearWell);

    const quarry = {
      id: `rec-bd-quarry-${order.id}`,
      rank: rank++,
      sourceType: 'QUARRY_WAREHOUSE' as const,
      sourceId: 'wh-quarry',
      sourceLabel: 'Quarry warehouse',
      eta: new Date(Date.now() + 90 * 60 * 1000).toISOString(),
      distanceKm: 45,
      estimatedCost: 320,
      onTimeProbability: 0.85,
      inventoryImpact: `Use ${orderTons} tons from quarry stock.`,
      reasonText: 'Replacement from quarry; high availability.',
    };
    options.push(quarry);

    const best = availableTrucks.find(t => t.status === 'available');
    if (best && availableDrivers.length > 0) {
      options.push({
        id: `rec-bd-truck-${best.id}-${order.id}`,
        rank: rank++,
        sourceType: 'TRUCK_IN_TRANSIT',
        sourceId: best.id,
        sourceLabel: 'Dispatch from quarry',
        truckId: best.id,
        truckLabel: `${best.licensePlate} (${best.capacity} tons)`,
        eta: new Date(Date.now() + 75 * 60 * 1000).toISOString(),
        distanceKm: 38,
        estimatedCost: 260,
        onTimeProbability: 0.88,
        inventoryImpact: `Load ${orderTons} tons at quarry, then deliver.`,
        reasonText: 'Replacement truck available; capacity matches order.',
      });
    }

    const reroute = inTransitTrucks.find(t => t.assignedOrderId && t.assignedOrderId !== order.id);
    if (reroute) {
      let fromOrderNumber: string | undefined;
      try {
        const fromOrder = await ordersApi.getById(reroute.assignedOrderId!);
        fromOrderNumber = fromOrder?.orderNumber;
      } catch {
        /* ignore */
      }
      options.push({
        id: `rec-bd-reroute-${reroute.id}-${order.id}`,
        rank: rank++,
        sourceType: 'TRUCK_IN_TRANSIT',
        sourceId: reroute.id,
        sourceLabel: 'Re-route truck en route',
        truckId: reroute.id,
        truckLabel: `${reroute.licensePlate} (in transit)`,
        eta: new Date(Date.now() + 50 * 60 * 1000).toISOString(),
        distanceKm: 15,
        estimatedCost: 120,
        onTimeProbability: 0.78,
        inventoryImpact: 'Redirect current load; may delay original delivery.',
        reasonText: 'Urgent: truck nearby; consider impact on existing delivery.',
        isRedirect: true,
        fromOrderId: reroute.assignedOrderId ?? undefined,
        fromOrderNumber,
        impactOnOriginalOrder: fromOrderNumber ? `Order ${fromOrderNumber} delayed ~30 min` : 'Original delivery may be delayed.',
      });
    }

    const ctx = {
      orderTons,
      urgency: order.priority ?? 'normal',
      customerId: order.customerId ?? '',
      deliveryLocation: order.deliveryLocation ?? '',
    };
    for (const rule of activeRules) {
      if (!rule.active) continue;
      if (matchesRule(rule, ctx)) applyRule(rule, options);
    }
    options.sort((a, b) => {
      const pa = a.onTimeProbability ?? 0;
      const pb = b.onTimeProbability ?? 0;
      if (pb !== pa) return pb - pa;
      return (a.estimatedCost ?? 0) - (b.estimatedCost ?? 0);
    });
    options.forEach((o, i) => { o.rank = i + 1; });
    return options;
  },

  applyBreakdownReplacement: async (
    orderId: string,
    brokenTruckId: string,
    payload: AssignmentPayload,
    opts?: { fromOrderId?: string }
  ): Promise<void> => {
    const { data: oldDel } = await supabase
      .from('deliveries')
      .select('id')
      .eq('order_id', orderId)
      .eq('truck_id', brokenTruckId)
      .maybeSingle();
    if (oldDel) {
      await supabase.from('deliveries').delete().eq('id', (oldDel as any).id);
    }
    await supabase
      .from('trucks')
      .update({ assigned_order_id: null, driver_id: null, updated_at: new Date().toISOString() })
      .eq('id', brokenTruckId);

    if (payload.sourceType === 'TRUCK_IN_TRANSIT' && (payload.truckId || payload.sourceId)) {
      const tid = payload.truckId || payload.sourceId;
      const fromOrderId = opts?.fromOrderId;
      const [trucks, drivers] = await Promise.all([trucksApi.getAll(), driversApi.getAll()]);
      const truck = trucks.find(t => t.id === tid);
      let driverId: string | null = drivers.find(d => d.available)?.id ?? null;
      if (fromOrderId) {
        const { data: fromDel } = await supabase
          .from('deliveries')
          .select('driver_id')
          .eq('order_id', fromOrderId)
          .eq('truck_id', tid)
          .maybeSingle();
        if ((fromDel as any)?.driver_id) driverId = (fromDel as any).driver_id;
        await supabase.from('deliveries').delete().eq('order_id', fromOrderId).eq('truck_id', tid);
        await ordersApi.updateStatus(fromOrderId, 'ready');
      }
      if (!truck || !driverId) throw new Error('Truck or driver not available.');
      const eta = new Date();
      eta.setHours(eta.getHours() + 2);
      await supabase.from('deliveries').insert({
        order_id: orderId,
        truck_id: truck.id,
        driver_id: driverId,
        status: 'assigned',
        eta: eta.toISOString(),
      });
      const { data: certData } = await supabase
        .from('qc_tests')
        .select('id, certificate_id')
        .eq('order_id', orderId)
        .eq('status', 'passed')
        .not('certificate_id', 'is', null)
        .single();
      if (certData?.certificate_id) {
        await supabase.from('qc_tests').update({ truck_id: truck.id }).eq('id', certData.id);
      }
      await ordersApi.updateStatus(orderId, 'ready');
      await supabase
        .from('trucks')
        .update({ status: 'assigned', assigned_order_id: orderId, driver_id: driverId })
        .eq('id', truck.id);
      return;
    }
    await dispatcherApi.assign(payload);
  },
};

// Assignment requests (submit for approval -> ops approve/reject)
function transformAssignmentRequest(row: any): AssignmentRequest {
  const orders = row.orders;
  const orderNumber = Array.isArray(orders) ? orders[0]?.order_number : orders?.order_number;
  const customers = Array.isArray(orders) ? orders[0]?.customers : orders?.customers;
  const customerName = Array.isArray(customers) ? customers[0]?.name : customers?.name;
    return {
    id: row.id,
    orderId: row.order_id,
    orderNumber: orderNumber ?? undefined,
    customerName: customerName ?? undefined,
    sourceType: row.source_type as RecommendationSourceType,
    sourceId: row.source_id,
    sourceLabel: row.source_label ?? undefined,
    truckId: row.truck_id ?? undefined,
    truckLabel: row.truck_label ?? undefined,
    reason: row.reason ?? undefined,
    status: row.status as AssignmentRequestStatus,
    requestedBy: row.requested_by,
    requestedByName: row.requested_by_name ?? undefined,
    requestedAt: row.requested_at,
    approvedBy: row.approved_by ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
  };
}

export const assignmentRequestsApi = {
  create: async (payload: {
    orderId: string;
    sourceType: RecommendationSourceType;
    sourceId: string;
    sourceLabel?: string;
    truckId?: string | null;
    truckLabel?: string | null;
    reason?: string | null;
    requestedBy: string;
    requestedByName?: string;
  }): Promise<AssignmentRequest> => {
    const { data, error } = await supabase
      .from('assignment_requests')
      .insert({
        order_id: payload.orderId,
        source_type: payload.sourceType,
        source_id: payload.sourceId,
        source_label: payload.sourceLabel ?? null,
        truck_id: payload.truckId ?? null,
        truck_label: payload.truckLabel ?? null,
        reason: payload.reason ?? null,
        status: 'pending_approval',
        requested_by: payload.requestedBy,
        requested_by_name: payload.requestedByName ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return transformAssignmentRequest(data);
  },

  getAll: async (filters?: { status?: AssignmentRequestStatus; requestedBy?: string }): Promise<AssignmentRequest[]> => {
    let q = supabase
      .from('assignment_requests')
      .select('*, orders(order_number, customers(name))')
      .order('requested_at', { ascending: false });
    if (filters?.status) q = q.eq('status', filters.status);
    if (filters?.requestedBy) q = q.eq('requested_by', filters.requestedBy);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(transformAssignmentRequest);
  },

  approve: async (id: string, approvedBy: string): Promise<void> => {
    const { data: req, error: fetchErr } = await supabase
      .from('assignment_requests')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending_approval')
      .single();
    if (fetchErr || !req) throw new Error('Assignment request not found or not pending.');
    await dispatcherApi.assign({
      orderId: req.order_id,
      sourceType: req.source_type as RecommendationSourceType,
      sourceId: req.source_id,
      truckId: req.truck_id ?? undefined,
      reason: req.reason ?? undefined,
    });
    const { error: updateErr } = await supabase
      .from('assignment_requests')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (updateErr) throw updateErr;
  },

  reject: async (id: string, rejectionReason?: string | null): Promise<void> => {
    const { error } = await supabase
      .from('assignment_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', 'pending_approval');
    if (error) throw error;
  },
};

// Recommendation rules (Rules screen, wired into recommendation engine)
function transformRule(row: any): Rule {
  return {
    id: row.id,
    name: row.name,
    condition: (row.condition ?? {}) as RuleCondition,
    action: (row.action ?? { type: 'optimization' }) as { type: RuleActionType; value?: string | number },
    priority: row.priority ?? 0,
    active: !!row.active,
    createdBy: row.created_by ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const rulesApi = {
  getAll: async (activeOnly?: boolean): Promise<Rule[]> => {
    let q = supabase
      .from('recommendation_rules')
      .select('*')
      .order('priority', { ascending: true });
    if (activeOnly) q = q.eq('active', true);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(transformRule);
  },

  getActive: async (): Promise<Rule[]> => rulesApi.getAll(true),

  getById: async (id: string): Promise<Rule | null> => {
    const { data, error } = await supabase
      .from('recommendation_rules')
      .select('*')
      .eq('id', id)
      .single();
    if (error) return null;
    return data ? transformRule(data) : null;
  },

  create: async (payload: {
    name: string;
    condition: RuleCondition;
    action: { type: RuleActionType; value?: string | number };
    priority?: number;
    active?: boolean;
    createdBy?: string;
  }): Promise<Rule> => {
    const { data, error } = await supabase
      .from('recommendation_rules')
      .insert({
        name: payload.name,
        condition: payload.condition,
        action: payload.action,
        priority: payload.priority ?? 0,
        active: payload.active ?? true,
        created_by: payload.createdBy ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return transformRule(data);
  },

  update: async (
    id: string,
    updates: Partial<{ name: string; condition: RuleCondition; action: { type: RuleActionType; value?: string | number }; priority: number; active: boolean }>
  ): Promise<Rule> => {
    const { data, error } = await supabase
      .from('recommendation_rules')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return transformRule(data);
  },

  delete: async (id: string): Promise<void> => {
    const { error } = await supabase.from('recommendation_rules').delete().eq('id', id);
    if (error) throw error;
  },
};

// Redirect requests (dispatcher submits; Jefatura level 1 -> Gerencia level 2 -> execute)
function transformRedirectRequest(row: any): RedirectRequest {
  return {
    id: row.id,
    fromOrderId: row.from_order_id,
    fromOrderNumber: row.from_order_number ?? undefined,
    toOrderId: row.to_order_id,
    toOrderNumber: row.to_order_number ?? undefined,
    truckId: row.truck_id,
    truckLabel: row.truck_label ?? undefined,
    reason: row.reason ?? undefined,
    impactOnOriginalOrder: row.impact_on_original_order ?? undefined,
    status: row.status as RedirectRequestStatus,
    requestedBy: row.requested_by,
    requestedByName: row.requested_by_name ?? undefined,
    requestedAt: row.requested_at,
    approvedBy: row.approved_by ?? undefined,
    approvedAt: row.approved_at ?? undefined,
    approvedByJefatura: row.approved_by_jefatura ?? undefined,
    approvedAtJefatura: row.approved_at_jefatura ?? undefined,
    approvedByGerencia: row.approved_by_gerencia ?? undefined,
    approvedAtGerencia: row.approved_at_gerencia ?? undefined,
    rejectionReason: row.rejection_reason ?? undefined,
  };
}

export const redirectRequestsApi = {
  create: async (payload: {
    fromOrderId: string;
    fromOrderNumber?: string;
    toOrderId: string;
    toOrderNumber?: string;
    truckId: string;
    truckLabel?: string;
    reason?: string | null;
    impactOnOriginalOrder?: string | null;
    requestedBy: string;
    requestedByName?: string | null;
  }): Promise<RedirectRequest> => {
    const { data, error } = await supabase
      .from('redirect_requests')
      .insert({
        from_order_id: payload.fromOrderId,
        from_order_number: payload.fromOrderNumber ?? null,
        to_order_id: payload.toOrderId,
        to_order_number: payload.toOrderNumber ?? null,
        truck_id: payload.truckId,
        truck_label: payload.truckLabel ?? null,
        reason: payload.reason ?? null,
        impact_on_original_order: payload.impactOnOriginalOrder ?? null,
        status: 'pending_approval',
        requested_by: payload.requestedBy,
        requested_by_name: payload.requestedByName ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return transformRedirectRequest(data);
  },

  getAll: async (filters?: { status?: RedirectRequestStatus }): Promise<RedirectRequest[]> => {
    let q = supabase
      .from('redirect_requests')
      .select('*')
      .order('requested_at', { ascending: false });
    if (filters?.status) q = q.eq('status', filters.status);
    const { data, error } = await q;
    if (error) throw error;
    return (data ?? []).map(transformRedirectRequest);
  },

  /** Single-level approval: OM (or admin) approves and executes. Works on pending_approval, pending_jefatura, or pending_gerencia. */
  approve: async (id: string, approvedBy: string): Promise<void> => {
    const { data: req, error: fetchErr } = await supabase
      .from('redirect_requests')
      .select('*')
      .eq('id', id)
      .in('status', ['pending_approval', 'pending_jefatura', 'pending_gerencia'])
      .single();
    if (fetchErr || !req) throw new Error('Redirect request not found or not pending approval.');

    const hasCert = await ordersApi.hasCertificate(req.to_order_id);
    if (!hasCert) throw new Error('Target order must have a QC certificate before redirect.');

    const { data: delRow } = await supabase
      .from('deliveries')
      .select('id, driver_id')
      .eq('order_id', req.from_order_id)
      .eq('truck_id', req.truck_id)
      .maybeSingle();
    let driverId: string | null = (delRow as any)?.driver_id ?? null;
    if (!driverId) {
      const avail = (await driversApi.getAll()).find(d => d.available);
      driverId = avail?.id ?? null;
    }
    if (!driverId) throw new Error('No driver available for redirect.');

    await supabase.from('deliveries').delete().eq('order_id', req.from_order_id).eq('truck_id', req.truck_id);
    await ordersApi.updateStatus(req.from_order_id, 'ready');

    const eta = new Date();
    eta.setHours(eta.getHours() + 2);
    const { error: insErr } = await supabase.from('deliveries').insert({
      order_id: req.to_order_id,
      truck_id: req.truck_id,
      driver_id: driverId,
      status: 'assigned',
      eta: eta.toISOString(),
    });
    if (insErr) throw insErr;

    const { data: certData } = await supabase
      .from('qc_tests')
      .select('id, certificate_id')
      .eq('order_id', req.to_order_id)
      .eq('status', 'passed')
      .not('certificate_id', 'is', null)
      .single();
    if (certData?.certificate_id) {
      await supabase.from('qc_tests').update({ truck_id: req.truck_id }).eq('id', certData.id);
    }

    await ordersApi.updateStatus(req.to_order_id, 'dispatched');
    await supabase
      .from('trucks')
      .update({ status: 'assigned', assigned_order_id: req.to_order_id, driver_id: driverId })
      .eq('id', req.truck_id);

    const { error: updateErr } = await supabase
      .from('redirect_requests')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (updateErr) throw updateErr;
  },

  approveByJefatura: async (id: string, approvedBy: string): Promise<void> => {
    const { data: req, error: fetchErr } = await supabase
      .from('redirect_requests')
      .select('*')
      .eq('id', id)
      .in('status', ['pending_jefatura', 'pending_approval'])
      .single();
    if (fetchErr || !req) throw new Error('Redirect request not found or not pending Level 1 approval.');

    const { error: updateErr } = await supabase
      .from('redirect_requests')
      .update({
        status: 'pending_gerencia',
        approved_by_jefatura: approvedBy,
        approved_at_jefatura: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (updateErr) throw updateErr;
  },

  approveByGerencia: async (id: string, approvedBy: string): Promise<void> => {
    const { data: req, error: fetchErr } = await supabase
      .from('redirect_requests')
      .select('*')
      .eq('id', id)
      .eq('status', 'pending_gerencia')
      .single();
    if (fetchErr || !req) throw new Error('Redirect request not found or not pending Gerencia approval.');

    const hasCert = await ordersApi.hasCertificate(req.to_order_id);
    if (!hasCert) throw new Error('Target order must have a QC certificate before redirect.');

    const { data: delRow } = await supabase
      .from('deliveries')
      .select('id, driver_id')
      .eq('order_id', req.from_order_id)
      .eq('truck_id', req.truck_id)
      .maybeSingle();
    let driverId: string | null = (delRow as any)?.driver_id ?? null;
    if (!driverId) {
      const avail = (await driversApi.getAll()).find(d => d.available);
      driverId = avail?.id ?? null;
    }
    if (!driverId) throw new Error('No driver available for redirect.');

    await supabase.from('deliveries').delete().eq('order_id', req.from_order_id).eq('truck_id', req.truck_id);
    await ordersApi.updateStatus(req.from_order_id, 'ready');

    const eta = new Date();
    eta.setHours(eta.getHours() + 2);
    const { error: insErr } = await supabase.from('deliveries').insert({
      order_id: req.to_order_id,
      truck_id: req.truck_id,
      driver_id: driverId,
      status: 'assigned',
      eta: eta.toISOString(),
    });
    if (insErr) throw insErr;

    const { data: certData } = await supabase
      .from('qc_tests')
      .select('id, certificate_id')
      .eq('order_id', req.to_order_id)
      .eq('status', 'passed')
      .not('certificate_id', 'is', null)
      .single();
    if (certData?.certificate_id) {
      await supabase.from('qc_tests').update({ truck_id: req.truck_id }).eq('id', certData.id);
    }

    await ordersApi.updateStatus(req.to_order_id, 'dispatched');
    await supabase
      .from('trucks')
      .update({ status: 'assigned', assigned_order_id: req.to_order_id, driver_id: driverId })
      .eq('id', req.truck_id);

    const { error: updateErr } = await supabase
      .from('redirect_requests')
      .update({
        status: 'approved',
        approved_by: approvedBy,
        approved_at: new Date().toISOString(),
        approved_by_gerencia: approvedBy,
        approved_at_gerencia: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);
    if (updateErr) throw updateErr;
  },

  reject: async (id: string, rejectionReason?: string | null): Promise<void> => {
    const { data: row } = await supabase
      .from('redirect_requests')
      .select('status')
      .eq('id', id)
      .single();
    const s = (row as any)?.status;
    const allowed = ['pending_approval', 'pending_jefatura', 'pending_gerencia'];
    if (!allowed.includes(s)) {
      throw new Error('Redirect request not found or not pending approval.');
    }
    const { error } = await supabase
      .from('redirect_requests')
      .update({
        status: 'rejected',
        rejection_reason: rejectionReason ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('status', s);
    if (error) throw error;
  },
};

/** Sites we recommend maintain levels for (physical locations only). Excludes in-transit. */
const INVENTORY_RECOMMENDATION_SITES = [
  { id: 'quarry', name: 'Quarry warehouse' },
  { id: 'near_well', name: 'Warehouse near wells' },
];

export interface InventoryBalanceRow {
  siteId: string;
  productId: string;
  productName: string;
  quantity: number;
}

export const inventoryApi = {
  getBalances: async (): Promise<InventoryBalanceRow[]> => {
    const { data, error } = await supabase
      .from('inventory_balance')
      .select('site_id, product_id, quantity, products(name)')
      .order('site_id')
      .order('product_id');
    if (error) throw error;
    return (data ?? []).map((r: any) => ({
      siteId: r.site_id,
      productId: r.product_id,
      productName: r.products?.name ?? (Array.isArray(r.products) ? r.products[0]?.name : '') ?? '',
      quantity: Number(r.quantity),
    }));
  },

  addToBalance: async (siteId: string, productId: string, delta: number): Promise<void> => {
    const { data: existing } = await supabase
      .from('inventory_balance')
      .select('id, quantity')
      .eq('site_id', siteId)
      .eq('product_id', productId)
      .maybeSingle();
    if (existing) {
      const { error } = await supabase
        .from('inventory_balance')
        .update({ quantity: Number((existing as any).quantity) + delta })
        .eq('id', (existing as any).id);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('inventory_balance')
        .insert({ site_id: siteId, product_id: productId, quantity: Math.max(0, delta) });
      if (error) throw error;
    }
  },
};

export const inventoryManagerApi = {
  getInventoryRecommendations: async (): Promise<InventoryRecommendation[]> => {
    const [orders, products, balances] = await Promise.all([
      ordersApi.getAll(),
      productsApi.getAll(),
      inventoryApi.getBalances().catch(() => [] as InventoryBalanceRow[]),
    ]);
    const balanceMap = new Map<string, number>();
    for (const b of balances) balanceMap.set(`${b.siteId}:${b.productId}`, b.quantity);
    const out: InventoryRecommendation[] = [];
    for (const p of products) {
      for (const site of INVENTORY_RECOMMENDATION_SITES) {
        const qty = balanceMap.get(`${site.id}:${p.id}`) ?? 0;
        const reserved = orders
          .filter((o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'ready')
          .reduce((s, o) => {
            const line = o.products.find((i) => i.productId === p.id);
            return s + (line ? line.quantity : 0);
          }, 0);
        const available = Math.max(0, qty - reserved);
        const suggestedMin = site.id === 'quarry' ? 400 : 150;
        const suggestedMax = site.id === 'quarry' ? 1200 : 500;

        let action: InventoryRecommendationAction;
        let priority: 'high' | 'medium' | 'low';
        let reason: string;
        if (available < suggestedMin) {
          action = 'increase';
          priority = available < 0.5 * suggestedMin ? 'high' : 'medium';
          reason = 'Below suggested minimum for this location.';
        } else if (available > suggestedMax) {
          action = 'decrease';
          priority = 'low';
          reason = 'Above suggested maximum; consider rebalancing.';
        } else {
          action = 'maintain';
          priority = 'low';
          reason = 'Within suggested range.';
        }

        out.push({
          id: `rec-${site.id}-${p.id}`,
          siteId: site.id,
          siteName: site.name,
          productId: p.id,
          productName: p.name,
          currentLevel: Math.round(qty * 10) / 10,
          reserved,
          available: Math.round(available * 10) / 10,
          suggestedMin,
          suggestedMax,
          action,
          reason,
          priority,
        });
      }
    }
    return out;
  },
};

export const tasksApi = {
  getForRole: async (role: UserRole): Promise<TaskItem[]> => {
    const [
      orders,
      deliveries,
      tests,
      assignments,
      redirects,
      invoices,
      recs,
      trucks,
    ] = await Promise.all([
      ordersApi.getAll().catch(() => [] as Order[]),
      deliveriesApi.getAll().catch(() => [] as Delivery[]),
      qcTestsApi.getAll().catch(() => []),
      assignmentRequestsApi.getAll({ status: 'pending_approval' }).catch(() => [] as AssignmentRequest[]),
      redirectRequestsApi.getAll().catch(() => [] as RedirectRequest[]),
      invoicesApi.getAll().catch(() => []),
      inventoryManagerApi.getInventoryRecommendations().catch(() => []),
      trucksApi.getAll().catch(() => []),
    ]);

    const orderIdsWithDeliveryArr = (deliveries || []).filter((d) => d.status !== 'delivered').map((d) => d.orderId);
    const orderIdsWithDeliverySet = new Set(orderIdsWithDeliveryArr);
    const ordersToAssign = (orders || []).filter(
      (o) =>
        (o.status === 'pending' || o.status === 'ready' || o.status === 'confirmed') &&
        !orderIdsWithDeliverySet.has(o.id)
    );
    const activeDeliveries = deliveries.filter((d) => d.status !== 'delivered');
    const qcToRun = tests.filter((t) => t.status === 'pending' || t.status === 'in_progress');
    const orderIdsWithCert = new Set(
      (tests || []).filter((t) => t.status === 'passed' && t.certificateId && t.orderId).map((t) => t.orderId!)
    );
    const ordersNeedingQC = orderIdsWithDeliveryArr.filter((id) => !orderIdsWithCert.has(id)).length;
    const readyForPickup = (deliveries || []).filter(
      (d) => d.status === 'assigned' && orderIdsWithCert.has(d.orderId)
    ).length;
    const pendingRedirects = (redirects || []).filter((r) =>
      ['pending_approval', 'pending_jefatura', 'pending_gerencia'].includes(r.status)
    );
    const pendingApprovals = (assignments?.length ?? 0) + pendingRedirects.length;
    const invoicesAction = invoices.filter(
      (i) => i.paymentStatus === 'pending' || i.paymentStatus === 'overdue'
    );
    const inventoryAlerts = recs.filter(
      (r) => r.action === 'increase' && (r.priority === 'high' || r.priority === 'medium')
    );
    const breakdownTrucks = trucks.filter(
      (t) => (t.status === 'broken_down' || t.status === 'stuck') && t.assignedOrderId
    );

    const out: TaskItem[] = [];

    const add = (id: string, type: string, title: string, subtitle: string | undefined, count: number, link: string, r: UserRole) => {
      if (count <= 0) return;
      out.push({ id, type, title, subtitle, count, link, role: r });
    };
    const addAlways = (id: string, type: string, title: string, subtitle: string | undefined, count: number, link: string, r: UserRole) => {
      out.push({ id, type, title, subtitle, count, link, role: r });
    };

    switch (role) {
      case 'qc_technician':
        add('qc-tests', 'qc_test', 'QC tests to run', undefined, qcToRun.length, '/quality', 'qc_technician');
        add('qc-orders', 'qc_order', 'Orders needing QC test + certificate', undefined, ordersNeedingQC, '/quality', 'qc_technician');
        break;
      case 'driver':
        add('pickup', 'delivery', 'Ready for pickup', undefined, readyForPickup, '/logistics', 'driver');
        add('deliveries', 'delivery', 'Active deliveries', undefined, activeDeliveries.length, '/logistics', 'driver');
        break;
      case 'dispatcher':
        addAlways('orders-assign', 'order_assign', 'Orders to assign', undefined, ordersToAssign.length, '/dispatcher', 'dispatcher');
        add('breakdowns', 'breakdown', 'Breakdowns to resolve', undefined, breakdownTrucks.length, '/dispatcher', 'dispatcher');
        break;
      case 'operations_manager':
        add('approvals', 'approval', 'Pending approvals', undefined, pendingApprovals, '/approvals', 'operations_manager');
        break;
      case 'jefatura':
        add('approvals', 'approval', 'Pending approvals', undefined, pendingApprovals, '/approvals', 'jefatura');
        break;
      case 'inventory_manager':
        add('inventory-alerts', 'inventory_alert', 'Inventory to increase', undefined, inventoryAlerts.length, '/inventory', 'inventory_manager');
        break;
      case 'accounting_manager':
        add('invoices', 'invoice', 'Invoices needing action', undefined, invoicesAction.length, '/billing', 'accounting_manager');
        break;
      case 'admin':
        addAlways('orders-assign', 'order_assign', 'Orders to assign', undefined, ordersToAssign.length, '/dispatcher', 'admin');
        add('breakdowns', 'breakdown', 'Breakdowns to resolve', undefined, breakdownTrucks.length, '/dispatcher', 'admin');
        add('approvals', 'approval', 'Pending approvals', undefined, pendingApprovals, '/approvals', 'admin');
        add('qc-tests', 'qc_test', 'QC tests to run', undefined, qcToRun.length, '/quality', 'admin');
        add('qc-orders', 'qc_order', 'Orders needing QC test + certificate', undefined, ordersNeedingQC, '/quality', 'admin');
        add('pickup', 'delivery', 'Ready for pickup', undefined, readyForPickup, '/logistics', 'admin');
        add('invoices', 'invoice', 'Invoices needing action', undefined, invoicesAction.length, '/billing', 'admin');
        add('inventory-alerts', 'inventory_alert', 'Inventory to increase', undefined, inventoryAlerts.length, '/inventory', 'admin');
        break;
      default:
        break;
    }

    return out;
  },
};

