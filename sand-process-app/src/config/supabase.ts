// Direct import - use named import for createClient
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

let createClientFn: any;
let useMock = false;

// Check if createClient is available
if (typeof createSupabaseClient === 'function') {
  createClientFn = createSupabaseClient;
  console.log('✅ Supabase package loaded successfully!');
} else {
  useMock = true;
  console.warn('⚠️ Supabase createClient not found');
}

if (useMock) {
  // Package not installed - create a mock function with full query builder chain
  console.warn('@supabase/supabase-js not working. Creating mock client.');
  
  // Create a mock query builder that supports method chaining and returns a Promise
  const createMockQueryBuilder = (isSelect = false, isSingle = false) => {
    const errorResponse = { 
      data: null, 
      error: { message: 'Supabase package not working properly' } 
    };
    
    const emptyDataResponse = isSingle 
      ? { data: null, error: null }
      : { data: [], error: null };
    
    // Create a chainable builder
    const builder: any = {
      select: (columns?: string) => createMockQueryBuilder(true, false),
      insert: (values: any) => createMockQueryBuilder(false, false),
      update: (values: any) => createMockQueryBuilder(false, false),
      delete: () => createMockQueryBuilder(false, false),
      eq: (column: string, value: any) => builder,
      like: (column: string, pattern: string) => builder,
      order: (column: string, options?: any) => builder,
      single: () => createMockQueryBuilder(isSelect, true),
      limit: (count: number) => builder,
    };
    
    // Make it a Promise that resolves immediately
    const promise = Promise.resolve(isSelect ? emptyDataResponse : errorResponse);
    
    // Copy Promise methods to builder
    builder.then = promise.then.bind(promise);
    builder.catch = promise.catch.bind(promise);
    builder.finally = promise.finally.bind(promise);
    
    return builder;
  };

  createClientFn = () => ({
    from: (table: string) => createMockQueryBuilder(),
  });
}

// These should be set as environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Debug: Check if env vars are loaded
const configCheck = {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl.length,
  keyLength: supabaseAnonKey.length,
  urlPreview: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : '❌ EMPTY',
  keyPreview: supabaseAnonKey ? supabaseAnonKey.substring(0, 30) + '...' : '❌ EMPTY',
  envKeys: Object.keys(process.env).filter(k => k.startsWith('REACT_APP_')),
  allEnvKeys: Object.keys(process.env).filter(k => k.includes('SUPABASE') || k.includes('supabase'))
};

console.log('🔍 Supabase Config Check:');
console.log('  hasUrl:', configCheck.hasUrl, configCheck.hasUrl ? '✅' : '❌');
console.log('  hasKey:', configCheck.hasKey, configCheck.hasKey ? '✅' : '❌');
console.log('  urlLength:', configCheck.urlLength, configCheck.urlLength > 0 ? '✅' : '❌');
console.log('  keyLength:', configCheck.keyLength, configCheck.keyLength > 0 ? '✅' : '❌');
console.log('  urlPreview:', configCheck.urlPreview);
console.log('  keyPreview:', configCheck.keyPreview);
console.log('  REACT_APP_ env vars found:', configCheck.envKeys);
console.log('  All SUPABASE env vars:', configCheck.allEnvKeys);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL and Anon Key must be set in environment variables (.env file)');
  console.warn('Make sure:');
  console.warn('1. .env file exists in sand-process-app/ folder');
  console.warn('2. File contains: REACT_APP_SUPABASE_URL=... and REACT_APP_SUPABASE_ANON_KEY=...');
  console.warn('3. Dev server was restarted after creating .env file');
}

export const supabase = createClientFn(supabaseUrl, supabaseAnonKey);

// Database types (will match our schema)
export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string;
          name: string;
          code: string;
          contact_person: string;
          email: string;
          phone: string;
          address: string;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['customers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['customers']['Insert']>;
      };
      products: {
        Row: {
          id: string;
          name: string;
          mesh_size: string;
          description: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['products']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['products']['Insert']>;
      };
      msas: {
        Row: {
          id: string;
          customer_id: string;
          start_date: string;
          end_date: string;
          pricing: Record<string, number>;
          payment_terms: string;
          volume_commitment: number | null;
          active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['msas']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['msas']['Insert']>;
      };
      orders: {
        Row: {
          id: string;
          order_number: string;
          customer_id: string;
          msa_id: string | null;
          delivery_date: string;
          delivery_location: string;
          delivery_address: string;
          status: string;
          total_amount: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['orders']['Row'], 'id' | 'order_number' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['orders']['Insert']>;
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string;
          quantity: number;
          unit_price: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['order_items']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['order_items']['Insert']>;
      };
      trucks: {
        Row: {
          id: string;
          license_plate: string;
          capacity: number;
          type: 'old' | 'new';
          status: string;
          driver_id: string | null;
          assigned_order_id: string | null;
          last_maintenance: string | null;
          next_maintenance: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['trucks']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['trucks']['Insert']>;
      };
      drivers: {
        Row: {
          id: string;
          name: string;
          license_number: string;
          phone: string;
          hours_worked: number;
          hours_limit: number;
          available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['drivers']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['drivers']['Insert']>;
      };
      deliveries: {
        Row: {
          id: string;
          order_id: string;
          truck_id: string;
          driver_id: string;
          status: string;
          eta: string | null;
          actual_arrival: string | null;
          wait_time: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['deliveries']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['deliveries']['Insert']>;
      };
      qc_tests: {
        Row: {
          id: string;
          lot_number: string;
          order_id: string | null;
          product_id: string;
          status: string;
          test_date: string | null;
          results: Record<string, any> | null;
          certificate_id: string | null;
          technician_id: string | null;
          truck_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['qc_tests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['qc_tests']['Insert']>;
      };
      invoices: {
        Row: {
          id: string;
          invoice_number: string;
          order_id: string;
          customer_id: string;
          issue_date: string;
          due_date: string;
          subtotal: number;
          tax: number;
          total: number;
          payment_status: string;
          paid_date: string | null;
          days_outstanding: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['invoices']['Row'], 'id' | 'invoice_number' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['invoices']['Insert']>;
      };
      assignment_requests: {
        Row: {
          id: string;
          order_id: string;
          source_type: string;
          source_id: string;
          source_label: string | null;
          truck_id: string | null;
          truck_label: string | null;
          reason: string | null;
          status: string;
          requested_by: string;
          requested_by_name: string | null;
          requested_at: string;
          approved_by: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['assignment_requests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['assignment_requests']['Insert']>;
      };
      recommendation_rules: {
        Row: {
          id: string;
          name: string;
          condition: Record<string, unknown>;
          action: Record<string, unknown>;
          priority: number;
          active: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['recommendation_rules']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['recommendation_rules']['Insert']>;
      };
      redirect_requests: {
        Row: {
          id: string;
          from_order_id: string;
          from_order_number: string | null;
          to_order_id: string;
          to_order_number: string | null;
          truck_id: string;
          truck_label: string | null;
          reason: string | null;
          impact_on_original_order: string | null;
          status: string;
          requested_by: string;
          requested_by_name: string | null;
          requested_at: string;
          approved_by: string | null;
          approved_at: string | null;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['redirect_requests']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['redirect_requests']['Insert']>;
      };
    };
  };
}
