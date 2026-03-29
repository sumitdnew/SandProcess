import React from 'react';
import { Box, Paper, Typography, Chip, Divider } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { Order, OrderStatus } from '../../types';

interface OrderDetailPanelProps {
  order: Order | null;
}

const getStatusColor = (s: OrderStatus) =>
  ({ pending: 'default', confirmed: 'info', in_production: 'warning', qc: 'warning', ready: 'success', dispatched: 'info', delivered: 'success', completed: 'success', invoiced: 'success' }[s] || 'default');

export const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({ order }) => {
  const { t } = useTranslation();
  if (!order) {
    return (
      <Paper sx={{ p: 3, height: '100%', minHeight: 280 }}>
        <Typography color="text.secondary">Select an order to view details.</Typography>
      </Paper>
    );
  }

  const orderTons = order.products.reduce((s, p) => s + p.quantity, 0);

  return (
    <Paper sx={{ p: 3, height: '100%', minHeight: 280 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">{order.orderNumber}</Typography>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          <Chip
            size="small"
            variant="outlined"
            label={
              order.fulfillmentType === 'pickup'
                ? t('modules.orders.fulfillmentShortPickup')
                : t('modules.orders.fulfillmentShortDelivery')
            }
          />
          <Chip label={order.status} size="small" color={getStatusColor(order.status) as any} />
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Customer
      </Typography>
      <Typography variant="body1" sx={{ mb: 1.5 }}>
        {order.customerName || '—'}
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {order.fulfillmentType === 'pickup' ? t('modules.pickup.pickupLocation') : t('modules.orders.deliveryLocation')}
      </Typography>
      <Typography variant="body1" sx={{ mb: 1.5 }}>
        {order.fulfillmentType === 'pickup'
          ? [order.pickupLocation, order.pickupAddress].filter(Boolean).join(' · ') || order.deliveryLocation || '—'
          : `${order.deliveryLocation || '—'}${order.deliveryAddress ? ` · ${order.deliveryAddress}` : ''}`}
      </Typography>
      {order.fulfillmentType === 'pickup' && (order.pickupWindowStart || order.pickupWindowEnd) && (
        <Typography variant="body2" sx={{ mb: 1.5 }}>
          {order.pickupWindowStart && new Date(order.pickupWindowStart).toLocaleString()}
          {order.pickupWindowStart && order.pickupWindowEnd ? ' – ' : ''}
          {order.pickupWindowEnd && new Date(order.pickupWindowEnd).toLocaleString()}
        </Typography>
      )}
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Product · Quantity
      </Typography>
      {order.products.map((p, i) => (
        <Typography key={i} variant="body1">
          • {p.productName}: {p.quantity} tons
        </Typography>
      ))}
      <Typography variant="body1" sx={{ mb: 1.5 }}>
        Total: {orderTons} tons
      </Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        Deadline
      </Typography>
      <Typography variant="body1" sx={{ mb: 1.5 }}>
        {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : '—'}
        {order.requestedWindow ? ` · ${order.requestedWindow}` : ''}
      </Typography>
      {order.notes && (
        <>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Notes
          </Typography>
          <Typography variant="body1">{order.notes}</Typography>
        </>
      )}
    </Paper>
  );
};
