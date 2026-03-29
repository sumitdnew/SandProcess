import type { UserRole } from '../types';

/** One workflow step: route and i18n keys must match `guide.steps.{id}` in locales. */
export interface GuideStepDef {
  id: string;
  route: string;
  /** Same visibility as left navigation for this path */
  roles: UserRole[];
}

/**
 * Canonical order (admin-style pipeline). Filter by role preserves this order.
 * Roles mirror left Navigation nav items.
 */
export const GUIDE_STEP_ORDER: GuideStepDef[] = [
  {
    id: 'dashboard',
    route: '/',
    roles: ['admin', 'dispatcher', 'accounting_manager', 'inventory_manager'],
  },
  {
    id: 'orders',
    route: '/orders',
    roles: ['admin', 'customer_user'],
  },
  {
    id: 'dispatcher',
    route: '/dispatcher',
    roles: ['admin', 'dispatcher'],
  },
  {
    id: 'approvals',
    route: '/approvals',
    roles: ['admin', 'operations_manager', 'jefatura'],
  },
  {
    id: 'rules',
    route: '/rules',
    roles: ['admin', 'operations_manager', 'jefatura'],
  },
  {
    id: 'quality',
    route: '/quality',
    roles: ['admin', 'qc_technician'],
  },
  {
    id: 'logistics',
    route: '/logistics',
    roles: ['admin', 'dispatcher', 'driver', 'customer_user'],
  },
  {
    id: 'pickupRelease',
    route: '/pickup-release',
    roles: ['admin', 'dispatcher', 'inventory_manager'],
  },
  {
    id: 'billing',
    route: '/billing',
    roles: ['admin', 'accounting_manager'],
  },
  {
    id: 'inventory',
    route: '/inventory',
    roles: ['admin', 'inventory_manager', 'dispatcher'],
  },
  {
    id: 'fleet',
    route: '/fleet',
    roles: ['admin', 'dispatcher'],
  },
  {
    id: 'production',
    route: '/production',
    roles: ['admin', 'inventory_manager'],
  },
  {
    id: 'tasks',
    route: '/tasks',
    roles: [
      'admin',
      'dispatcher',
      'driver',
      'qc_technician',
      'operations_manager',
      'jefatura',
      'inventory_manager',
      'accounting_manager',
    ],
  },
  {
    id: 'msas',
    route: '/msas',
    roles: ['admin'],
  },
  {
    id: 'customers',
    route: '/customers',
    roles: ['admin'],
  },
  {
    id: 'customerPortal',
    route: '/customer-portal',
    roles: ['customer_user'],
  },
];

export function getGuideStepsForRole(role: UserRole | null): GuideStepDef[] {
  if (!role) return [];
  return GUIDE_STEP_ORDER.filter((s) => s.roles.includes(role));
}
