import React from 'react';
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Chip,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { Order, OrderStatus } from '../../types';

interface OrderListTableProps {
  orders: Order[];
  deliveryOrderIds?: Set<string>;
  selectedOrderId: string | null;
  onSelectOrder: (order: Order) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  searchTerm: string;
  onSearchTermChange: (v: string) => void;
  loading?: boolean;
}

const statusOptions: { value: string; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'unassigned', label: 'Unassigned' },
  { value: 'ready', label: 'Ready' },
  { value: 'confirmed', label: 'Confirmed' },
  { value: 'dispatched', label: 'Dispatched' },
  { value: 'in_production', label: 'In production' },
  { value: 'delivered', label: 'Delivered' },
];

const getStatusColor = (s: OrderStatus) =>
  ({ pending: 'default', confirmed: 'info', in_production: 'warning', qc: 'warning', ready: 'success', dispatched: 'info', delivered: 'success', completed: 'success', invoiced: 'success' }[s] || 'default');

export const OrderListTable: React.FC<OrderListTableProps> = ({
  orders,
  deliveryOrderIds,
  selectedOrderId,
  onSelectOrder,
  statusFilter,
  onStatusFilterChange,
  searchTerm,
  onSearchTermChange,
  loading,
}) => {
  const filtered = orders.filter((o) => {
    const matchSearch =
      !searchTerm ||
      o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.deliveryLocation || '').toLowerCase().includes(searchTerm.toLowerCase());
    const hasDelivery = deliveryOrderIds?.has(o.id) ?? false;
    const matchStatus =
      statusFilter === 'all' ||
      (statusFilter === 'unassigned' &&
        (o.status === 'pending' || o.status === 'ready' || o.status === 'confirmed') &&
        !hasDelivery) ||
      (statusFilter !== 'unassigned' && o.status === statusFilter);
    return matchSearch && matchStatus;
  });

  const orderTons = (o: Order) => o.products.reduce((s, p) => s + p.quantity, 0);

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          placeholder="Search orders…"
          size="small"
          value={searchTerm}
          onChange={(e) => onSearchTermChange(e.target.value)}
          sx={{ flexGrow: 1, minWidth: 180 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          size="small"
          label="Status"
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          sx={{ minWidth: 160 }}
        >
          {statusOptions.map((opt) => (
            <MenuItem key={opt.value} value={opt.value}>
              {opt.label}
            </MenuItem>
          ))}
        </TextField>
      </Box>
      <TableContainer component={Paper} sx={{ maxHeight: 440, overflow: 'auto' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Order</TableCell>
              <TableCell>Customer</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Size</TableCell>
              <TableCell>Delivery</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  Loading…
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No orders match filters.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((o) => (
                <TableRow
                  key={o.id}
                  hover
                  selected={selectedOrderId === o.id}
                  onClick={() => onSelectOrder(o)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={500}>
                      {o.orderNumber}
                    </Typography>
                  </TableCell>
                  <TableCell>{o.customerName || '—'}</TableCell>
                  <TableCell>{o.deliveryLocation || '—'}</TableCell>
                  <TableCell>{orderTons(o)} t</TableCell>
                  <TableCell>{o.deliveryDate ? new Date(o.deliveryDate).toLocaleDateString() : '—'}</TableCell>
                  <TableCell>
                    <Chip label={o.status} size="small" color={getStatusColor(o.status) as any} />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
