// Type declaration for @supabase/supabase-js
// This allows TypeScript to compile even if the package isn't installed
declare module '@supabase/supabase-js' {
  export function createClient(url: string, key: string): any;
}


