import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Add as AddIcon, LocalShipping as DispatchIcon, ArrowForward as NextStepIcon, Search as SearchIcon } from '@mui/icons-material';
import { ordersApi, trucksApi, driversApi } from '../services/api';
import { supabase } from '../config/supabase';
import { Order, OrderStatus, Truck, Driver } from '../types';
import CreateOrderForm from '../components/orders/CreateOrderForm';

const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCreateForm, setOpenCreateForm] = useState(false);
  const [openDispatchDialog, setOpenDispatchDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [dispatchOrder, setDispatchOrder] = useState<Order | null>(null);
  const [availableTrucks, setAvailableTrucks] = useState<Truck[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [orderCertificates, setOrderCertificates] = useState<Record<string, boolean>>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await ordersApi.getAll();
      console.log('Loaded orders:', data); // Debug log
      setOrders(data || []);
      
      // Check certificates for all orders
      const certChecks: Record<string, boolean> = {};
      for (const order of data || []) {
        try {
          const hasCert = await ordersApi.hasCertificate(order.id);
          certChecks[order.id] = hasCert;
        } catch (err) {
          console.error(`Error checking certificate for order ${order.id}:`, err);
          certChecks[order.id] = false;
        }
      }
      setOrderCertificates(certChecks);
    } catch (err: any) {
      console.error('Error loading orders:', err);
      setError(err.message || 'Failed to load orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSuccess = () => {
    loadOrders();
  };

  const getStatusColor = (status: OrderStatus) => {
    const colors: Record<OrderStatus, string> = {
      pending: 'default',
      confirmed: 'info',
      in_production: 'warning',
      qc: 'warning',
      ready: 'success',
      dispatched: 'info',
      delivered: 'success',
      completed: 'success',
      invoiced: 'success',
    };
    return colors[status] || 'default';
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedOrder(null);
  };

  const handleOpenDispatchDialog = async (order: Order) => {
    try {
      setDispatchOrder(order);
      const [trucksData, driversData] = await Promise.all([
        trucksApi.getAll(),
        driversApi.getAll(),
      ]);
      const available = trucksData.filter(t => t.status === 'available');
      const availableDriversList = driversData.filter(d => d.available);
      setAvailableTrucks(available);
      setAvailableDrivers(availableDriversList);
      setSelectedTruckId('');
      setSelectedDriverId('');
      setOpenDispatchDialog(true);
    } catch (err: any) {
      console.error('Error loading trucks/drivers:', err);
      setError(err.message || 'Failed to load trucks/drivers');
    }
  };

  const handleDispatch = async () => {
    if (!dispatchOrder || !selectedTruckId || !selectedDriverId) {
      alert('Please select a truck and driver');
      return;
    }

    // Check if order has a certificate
    const hasCert = await ordersApi.hasCertificate(dispatchOrder.id);
    if (!hasCert) {
      alert('Cannot dispatch: Order must have a QC certificate. Please complete and approve QC testing first.');
      return;
    }

    try {
      // Get the certificate for this order to link to truck
      const { data: certData } = await supabase
        .from('qc_tests')
        .select('id, certificate_id')
        .eq('order_id', dispatchOrder.id)
        .eq('status', 'passed')
        .not('certificate_id', 'is', null)
        .single();

      // Create delivery record
      const { data, error } = await supabase
        .from('deliveries')
        .insert({
          order_id: dispatchOrder.id,
          truck_id: selectedTruckId,
          driver_id: selectedDriverId,
          status: 'assigned',
        })
        .select()
        .single();

      if (error) throw error;

      // Link certificate to truck (RN-003: Certificate linked to truck number)
      if (certData && certData.certificate_id) {
        await supabase
          .from('qc_tests')
          .update({ truck_id: selectedTruckId })
          .eq('id', certData.id);
      }

      // Update order status
      await ordersApi.updateStatus(dispatchOrder.id, 'dispatched');

      // Update truck status
      await supabase
        .from('trucks')
        .update({ 
          status: 'assigned',
          assigned_order_id: dispatchOrder.id,
          driver_id: selectedDriverId
        })
        .eq('id', selectedTruckId);

      setOpenDispatchDialog(false);
      setDispatchOrder(null);
      setSelectedTruckId('');
      setSelectedDriverId('');
      loadOrders(); // Refresh orders list
    } catch (err: any) {
      console.error('Error dispatching order:', err);
      setError(err.message || 'Failed to dispatch order');
    }
  };

  const canDispatch = (order: Order) => {
    // Order must be ready and have a certificate
    return (order.status === 'ready' || order.status === 'confirmed') && orderCertificates[order.id] === true;
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'confirmed',
      confirmed: 'in_production',
      in_production: 'qc',
      qc: 'ready',
      ready: null, // Next step is dispatch (handled separately)
      dispatched: 'delivered',
      delivered: 'completed',
      completed: 'invoiced',
      invoiced: null,
    };
    return statusFlow[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus: OrderStatus): string => {
    const nextStatus = getNextStatus(currentStatus);
    if (!nextStatus) return '';
    
    const labels: Record<OrderStatus, string> = {
      pending: t('modules.orders.workflow.confirm'),
      confirmed: t('modules.orders.workflow.startProduction'),
      in_production: t('modules.orders.workflow.sendToQC'),
      qc: t('modules.orders.workflow.markReady'),
      ready: '',
      dispatched: t('modules.orders.workflow.markDelivered'),
      delivered: t('modules.orders.workflow.complete'),
      completed: t('modules.orders.workflow.invoice'),
      invoiced: '',
    };
    return labels[currentStatus] || '';
  };

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    try {
      // If moving to production, check inventory first
      if (newStatus === 'in_production') {
        const order = orders.find(o => o.id === orderId);
        if (order) {
          // Check if there's enough inventory (simplified check)
          const hasInventory = await ordersApi.checkInventory(orderId);
          if (!hasInventory) {
            alert(t('modules.orders.insufficientInventory'));
            return;
          }
        }
      }
      
      await ordersApi.updateStatus(orderId, newStatus);
      loadOrders(); // Refresh orders list
    } catch (err: any) {
      console.error('Error updating order status:', err);
          setError(err.message || t('modules.orders.errorUpdatingStatus'));
    }
  };

  const canUpdateStatus = (order: Order): boolean => {
    const nextStatus = getNextStatus(order.status);
    return nextStatus !== null;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('modules.orders.title')}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenCreateForm(true)}
        >
          {t('modules.orders.createOrder')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
        <TextField
          placeholder={t('modules.orders.searchOrders')}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          size="small"
          sx={{ flexGrow: 1, maxWidth: 400 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <TextField
          select
          label={t('modules.orders.filterByStatus')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">{t('modules.orders.allStatuses')}</MenuItem>
          <MenuItem value="pending">{t('orderStatus.pending')}</MenuItem>
          <MenuItem value="confirmed">{t('orderStatus.confirmed')}</MenuItem>
          <MenuItem value="in_production">{t('orderStatus.in_production')}</MenuItem>
          <MenuItem value="qc">{t('orderStatus.qc')}</MenuItem>
          <MenuItem value="ready">{t('orderStatus.ready')}</MenuItem>
          <MenuItem value="dispatched">{t('orderStatus.dispatched')}</MenuItem>
          <MenuItem value="delivered">{t('orderStatus.delivered')}</MenuItem>
          <MenuItem value="completed">{t('orderStatus.completed')}</MenuItem>
        </TextField>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>{t('modules.orders.orderNumber')}</TableCell>
              <TableCell>{t('modules.orders.customer')}</TableCell>
              <TableCell>{t('modules.orders.deliveryDate')}</TableCell>
              <TableCell>{t('modules.orders.totalAmount')}</TableCell>
              <TableCell>{t('common.status')}</TableCell>
              <TableCell>{t('common.actions')}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {orders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="textSecondary">
                    {t('common.noData')} - {error ? t('modules.orders.errorLoadingOrders') : t('modules.orders.noOrdersFound')}
                  </Typography>
                  {!error && (
                    <Button onClick={loadOrders} sx={{ mt: 2 }}>
                      {t('common.refresh')}
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              orders
                .filter(order => {
                  const matchesSearch = searchTerm === '' || 
                    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
                  const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
                  return matchesSearch && matchesStatus;
                })
                .map((order) => (
                <TableRow key={order.id}>
                  <TableCell>
                    <Box>
                      <Typography>{order.orderNumber}</Typography>
                      {order.msaId ? (
                        <Chip label="MSA" size="small" color="primary" sx={{ mt: 0.5, fontSize: '0.65rem' }} />
                      ) : (
                        <Chip label="PO" size="small" color="default" sx={{ mt: 0.5, fontSize: '0.65rem' }} />
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>{order.customerName || t('modules.orders.unknown')}</TableCell>
                  <TableCell>{new Date(order.deliveryDate).toLocaleDateString()}</TableCell>
                  <TableCell>${order.totalAmount.toLocaleString()}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                      <Chip
                        label={t(`orderStatus.${order.status}`)}
                        color={getStatusColor(order.status) as any}
                        size="small"
                      />
                      {order.status === 'ready' || order.status === 'confirmed' ? (
                        orderCertificates[order.id] ? (
                          <Chip
                            label={t('modules.orders.certificate')}
                            color="success"
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        ) : (
                          <Chip
                            label={t('modules.orders.noCertificate')}
                            color="error"
                            size="small"
                            sx={{ fontSize: '0.7rem' }}
                          />
                        )
                      ) : null}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Button size="small" onClick={() => handleViewOrder(order)}>
                        {t('common.view')}
                      </Button>
                      {canUpdateStatus(order) && (
                        <Button 
                          size="small" 
                          variant="outlined"
                          color="primary"
                          startIcon={<NextStepIcon />}
                          onClick={() => {
                            const nextStatus = getNextStatus(order.status);
                            if (nextStatus) {
                              handleStatusUpdate(order.id, nextStatus);
                            }
                          }}
                        >
                          {getNextStatusLabel(order.status)}
                        </Button>
                      )}
                      {((order.status === 'ready' || order.status === 'confirmed') && !orderCertificates[order.id]) && (
                        <Button 
                          size="small" 
                          variant="outlined"
                          color="warning"
                          disabled
                          title={t('modules.orders.certificateRequired')}
                        >
                          Certificate Required
                        </Button>
                      )}
                      {canDispatch(order) && (
                        <Button 
                          size="small" 
                          variant="contained"
                          color="primary"
                          startIcon={<DispatchIcon />}
                          onClick={() => handleOpenDispatchDialog(order)}
                        >
                          Dispatch
                        </Button>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedOrder ? t('modules.orders.orderNumber') + ': ' + selectedOrder.orderNumber : t('modules.orders.createOrder')}
        </DialogTitle>
        <DialogContent>
          {selectedOrder ? (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography><strong>{t('modules.orders.customer')}:</strong> {selectedOrder.customerName}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Order Type:</strong> 
                  {selectedOrder.msaId ? (
                    <Chip label="MSA Order" size="small" color="primary" sx={{ ml: 1 }} />
                  ) : (
                    <Chip label="Standalone Purchase Order (PO)" size="small" sx={{ ml: 1 }} />
                  )}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>{t('modules.orders.deliveryDate')}:</strong> {new Date(selectedOrder.deliveryDate).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Delivery Location:</strong> {selectedOrder.deliveryLocation}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Products:</strong></Typography>
                {selectedOrder.products.map((p, idx) => (
                  <Typography key={idx}>- {p.productName}: {p.quantity} tons @ ${p.unitPrice}/ton</Typography>
                ))}
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>{t('modules.orders.totalAmount')}:</strong> ${selectedOrder.totalAmount.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Chip
                  label={t(`orderStatus.${selectedOrder.status}`)}
                  color={getStatusColor(selectedOrder.status) as any}
                />
              </Grid>
            </Grid>
          ) : (
            <Typography>Create order form would go here</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
        </DialogActions>
      </Dialog>

      <CreateOrderForm
        open={openCreateForm}
        onClose={() => setOpenCreateForm(false)}
        onSuccess={handleCreateSuccess}
      />

      {/* Dispatch Dialog */}
      <Dialog open={openDispatchDialog} onClose={() => setOpenDispatchDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Dispatch Order: {dispatchOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {dispatchOrder && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Order Details
                </Typography>
                <Typography><strong>Customer:</strong> {dispatchOrder.customerName}</Typography>
                <Typography><strong>Delivery Location:</strong> {dispatchOrder.deliveryLocation}</Typography>
                <Typography><strong>Total Amount:</strong> ${dispatchOrder.totalAmount.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label={t('modules.logistics.truck')}
                  value={selectedTruckId}
                  onChange={(e) => setSelectedTruckId(e.target.value)}
                  required
                >
                  {availableTrucks.length === 0 ? (
                    <MenuItem disabled>No available trucks</MenuItem>
                  ) : (
                    availableTrucks.map((truck) => (
                      <MenuItem key={truck.id} value={truck.id}>
                        {truck.licensePlate} - {truck.capacity} tons ({truck.type === 'old' ? 'Old' : 'New'})
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  select
                  fullWidth
                  label={t('modules.logistics.driver')}
                  value={selectedDriverId}
                  onChange={(e) => setSelectedDriverId(e.target.value)}
                  required
                >
                  {availableDrivers.length === 0 ? (
                    <MenuItem disabled>No available drivers</MenuItem>
                  ) : (
                    availableDrivers.map((driver) => (
                      <MenuItem key={driver.id} value={driver.id}>
                        {driver.name} - {driver.hoursWorked}/{driver.hoursLimit} hours
                      </MenuItem>
                    ))
                  )}
                </TextField>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDispatchDialog(false)}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleDispatch} 
            variant="contained"
            disabled={!selectedTruckId || !selectedDriverId || availableTrucks.length === 0 || availableDrivers.length === 0}
          >
            Dispatch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OrdersPage;

