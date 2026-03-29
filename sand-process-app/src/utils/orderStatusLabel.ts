import type { TFunction } from 'i18next';
import type { Order } from '../types';

/**
 * Human-readable status: pickup orders reuse `delivered` / `dispatched` in DB but show pickup-specific labels.
 */
export function getOrderStatusLabel(order: Order, t: TFunction): string {
  const ft = order.fulfillmentType ?? 'delivery';
  if (ft === 'pickup') {
    if (order.status === 'delivered') return t('orderStatus.pickedUp');
    if (order.status === 'dispatched') return t('orderStatus.dispatchedPickup');
  }
  return t(`orderStatus.${order.status}`);
}
