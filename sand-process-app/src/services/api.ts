import { supabase } from '../config/supabase';
import { Database } from '../config/supabase';
import { Order, Customer, Product, MSA, Truck, Driver, Delivery, QCTest, Invoice } from '../types';

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
    
    console.log('Raw orders data from Supabase:', data); // Debug log
    
    if (!data || data.length === 0) {
      console.log('No orders found in database');
      return [];
    }
    
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
  console.log('Transforming order:', row); // Debug log
  
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
};

function transformQCTest(row: any): QCTest {
  return {
    id: row.id,
    lotNumber: row.lot_number,
    orderId: row.order_id,
    orderNumber: row.orders?.order_number || (Array.isArray(row.orders) ? row.orders[0]?.order_number : null),
    productId: row.product_id,
    productName: row.products?.name || '',
    status: row.status as any,
    testDate: row.test_date,
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

