/** True if string looks like a PostgreSQL/Supabase uuid. */
export function isUuid(value: string | undefined | null): value is string {
  if (!value || typeof value !== 'string') return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value.trim());
}
