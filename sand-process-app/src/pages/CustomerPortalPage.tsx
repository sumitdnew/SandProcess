import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { deliveriesApi, ordersApi, invoicesApi, customersApi } from '../services/api';
import { Delivery, Order, Invoice, Customer } from '../types';
import { useApp } from '../context/AppContext';
import { isUuid } from '../utils/isUuid';
import { getOrderStatusLabel } from '../utils/orderStatusLabel';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

function maskId(s?: string | null): string {
  if (!s || s.length < 4) return '—';
  return `…${s.slice(-4)}`;
}

const CustomerPortalPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useApp();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [invoicesLoading, setInvoicesLoading] = useState(false);

  const customerOrders = useMemo(
    () => (selectedCustomerId ? orders.filter((o) => o.customerId === selectedCustomerId) : []),
    [orders, selectedCustomerId]
  );

  const selectedOrder = useMemo(
    () => customerOrders.find((o) => o.id === selectedOrderId) ?? null,
    [customerOrders, selectedOrderId]
  );

  const deliveryForSelected = useMemo(() => {
    if (!selectedOrder || selectedOrder.fulfillmentType === 'pickup') return null;
    return deliveries.find((d) => d.orderId === selectedOrder.id) ?? null;
  }, [deliveries, selectedOrder]);

  useEffect(() => {
    loadBaseData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Prototype default: portal user / env / sole customer — user can change in dropdown anytime. */
  useEffect(() => {
    if (!customers.length) return;
    setSelectedCustomerId((prev) => {
      if (prev) return prev;
      const userCust =
        currentUser?.role === 'customer_user' && isUuid(currentUser.customerId || undefined)
          ? currentUser.customerId!.trim()
          : '';
      if (userCust && customers.some((c) => c.id === userCust)) return userCust;
      const envCust = isUuid(process.env.REACT_APP_PORTAL_CUSTOMER_ID || undefined)
        ? process.env.REACT_APP_PORTAL_CUSTOMER_ID!.trim()
        : '';
      if (envCust && customers.some((c) => c.id === envCust)) return envCust;
      if (customers.length === 1) return customers[0].id;
      return '';
    });
  }, [customers, currentUser]);

  useEffect(() => {
    if (!selectedCustomerId) {
      setInvoices([]);
      return;
    }
    let cancelled = false;
    setInvoicesLoading(true);
    invoicesApi
      .getForCustomer(selectedCustomerId)
      .then((inv) => {
        if (!cancelled) setInvoices(inv);
      })
      .catch((err: any) => {
        if (!cancelled) {
          console.error(err);
          setError(err?.message || 'Failed to load invoices');
        }
      })
      .finally(() => {
        if (!cancelled) setInvoicesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedCustomerId]);

  useEffect(() => {
    setSelectedOrderId((prev) => {
      if (prev && customerOrders.some((o) => o.id === prev)) return prev;
      return customerOrders[0]?.id ?? null;
    });
  }, [selectedCustomerId, customerOrders]);

  useEffect(() => {
    if (!selectedOrder) return;
    if (selectedOrder.fulfillmentType === 'delivery') {
      const d = deliveries.find((x) => x.orderId === selectedOrder.id);
      setSelectedDelivery(d ?? null);
    } else {
      setSelectedDelivery(null);
    }
  }, [selectedOrder, deliveries]);

  const loadBaseData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [customersData, deliveriesData, ordersData] = await Promise.all([
        customersApi.getAll(),
        deliveriesApi.getAll(),
        ordersApi.getAll(),
      ]);
      setCustomers(customersData);
      setDeliveries(deliveriesData);
      setOrders(ordersData);
    } catch (err: any) {
      console.error('Error loading customer portal data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadInvoice = async (inv: Invoice) => {
    if (!inv.invoicePdfStoragePath) return;
    const url = await invoicesApi.getInvoicePdfSignedUrl(inv.invoicePdfStoragePath);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const center: [number, number] = selectedDelivery
    ? [selectedDelivery.route.well.lat, selectedDelivery.route.well.lng]
    : [-38.5, -69.0];

  const showLiveMap =
    selectedOrder?.fulfillmentType === 'delivery' && !!selectedDelivery && selectedOrder?.id === selectedDelivery.orderId;

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        {t('common.customerPortal')}
      </Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <FormControl fullWidth size="small" sx={{ maxWidth: 480 }}>
          <InputLabel id="portal-customer-label">{t('portal.selectCustomer')}</InputLabel>
          <Select
            labelId="portal-customer-label"
            label={t('portal.selectCustomer')}
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value as string)}
          >
            <MenuItem value="">
              <em>{t('portal.selectCustomerPlaceholder')}</em>
            </MenuItem>
            {customers.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name} {c.code ? `(${c.code})` : ''}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
          {t('portal.selectCustomerHint')}
        </Typography>
      </Paper>

      {!selectedCustomerId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          {t('portal.selectCustomerFirst')}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: 500, p: 1, mb: 2 }}>
            <Typography variant="h6" sx={{ p: 2 }}>
              {showLiveMap ? t('portal.liveMap') : t('portal.trackingTitle')}
            </Typography>
            {showLiveMap ? (
              <MapContainer
                center={center}
                zoom={10}
                style={{ height: 'calc(100% - 80px)', width: '100%' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {selectedDelivery && (
                  <>
                    <Marker position={[selectedDelivery.route.quarry.lat, selectedDelivery.route.quarry.lng]}>
                      <Popup>Quarry</Popup>
                    </Marker>
                    <Marker position={[selectedDelivery.route.well.lat, selectedDelivery.route.well.lng]}>
                      <Popup>Your Well: {selectedDelivery.route.well.name}</Popup>
                    </Marker>
                    {selectedDelivery.gpsTrack && selectedDelivery.gpsTrack.length > 0 && (
                      <Polyline
                        positions={selectedDelivery.gpsTrack.map((point) => [point.lat, point.lng] as [number, number])}
                        color="blue"
                        weight={3}
                      />
                    )}
                  </>
                )}
              </MapContainer>
            ) : (
              <Box
                sx={{
                  height: 'calc(100% - 80px)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  px: 2,
                }}
              >
                <Typography color="text.secondary" align="center">
                  {t('portal.mapOnlyDelivery')}
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('modules.orders.title')}
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('modules.orders.orderNumber')}</TableCell>
                      <TableCell>{t('modules.orders.fulfillmentType')}</TableCell>
                      <TableCell>{t('common.status')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customerOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          <Typography color="textSecondary">{t('common.noData')}</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customerOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          selected={selectedOrderId === order.id}
                          onClick={() => setSelectedOrderId(order.id)}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{order.orderNumber}</TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={
                                order.fulfillmentType === 'pickup'
                                  ? t('modules.orders.fulfillmentShortPickup')
                                  : t('modules.orders.fulfillmentShortDelivery')
                              }
                            />
                          </TableCell>
                          <TableCell>
                            <Chip label={getOrderStatusLabel(order, t)} size="small" />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {selectedOrder && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('portal.timeline')}: {selectedOrder.orderNumber}
              </Typography>
              <Divider sx={{ mb: 2 }} />

              {selectedOrder.fulfillmentType === 'pickup' ? (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      {t('portal.pickupDetails')}
                    </Typography>
                    <Typography>
                      <strong>{t('modules.pickup.pickupLocation')}:</strong>{' '}
                      {selectedOrder.pickupLocation || selectedOrder.deliveryLocation || '—'}
                    </Typography>
                    {selectedOrder.pickupAddress && (
                      <Typography variant="body2">{selectedOrder.pickupAddress}</Typography>
                    )}
                    {(selectedOrder.pickupWindowStart || selectedOrder.pickupWindowEnd) && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {selectedOrder.pickupWindowStart &&
                          new Date(selectedOrder.pickupWindowStart).toLocaleString()}
                        {selectedOrder.pickupWindowStart && selectedOrder.pickupWindowEnd ? ' – ' : ''}
                        {selectedOrder.pickupWindowEnd &&
                          new Date(selectedOrder.pickupWindowEnd).toLocaleString()}
                      </Typography>
                    )}
                    {selectedOrder.pickupInstructions && (
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {selectedOrder.pickupInstructions}
                      </Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {selectedOrder.pickupRelease ? (
                      <>
                        <Typography variant="subtitle2" color="text.secondary">
                          {t('portal.pickupCompleted')}
                        </Typography>
                        <Typography>
                          {t('portal.releasedAt')}:{' '}
                          {new Date(selectedOrder.pickupRelease.releasedAt).toLocaleString()}
                        </Typography>
                        <Typography>
                          {t('portal.netWeight')}:{' '}
                          {(
                            selectedOrder.pickupRelease.loadedWeightTons -
                            selectedOrder.pickupRelease.emptyWeightTons
                          ).toFixed(2)}
                        </Typography>
                        <Typography>
                          {t('portal.driver')}: {selectedOrder.pickupRelease.driverName} (
                          {maskId(selectedOrder.pickupRelease.driverIdDocument)})
                        </Typography>
                      </>
                    ) : (
                      <Alert severity="info">{t('orderStatus.ready')}</Alert>
                    )}
                  </Grid>
                </Grid>
              ) : (
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <List dense>
                      <ListItem>
                        <ListItemText
                          primary={t('portal.orderPlaced')}
                          secondary={new Date(selectedOrder.createdAt).toLocaleString()}
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText
                          primary={t('portal.inProgress')}
                          secondary={getOrderStatusLabel(selectedOrder, t)}
                        />
                      </ListItem>
                      {deliveryForSelected && (
                        <>
                          <ListItem>
                            <ListItemText
                              primary={t('modules.logistics.truck')}
                              secondary={deliveryForSelected.truckLicensePlate}
                            />
                          </ListItem>
                          <ListItem>
                            <ListItemText
                              primary={t('modules.logistics.driver')}
                              secondary={deliveryForSelected.driverName}
                            />
                          </ListItem>
                          {deliveryForSelected.actualArrival && (
                            <ListItem>
                              <ListItemText
                                primary={t('portal.shippedDelivered')}
                                secondary={new Date(deliveryForSelected.actualArrival).toLocaleString()}
                              />
                            </ListItem>
                          )}
                        </>
                      )}
                    </List>
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Grid>
        )}

        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('portal.invoices')}
              {invoicesLoading && selectedCustomerId ? (
                <Chip size="small" label={t('common.loading')} sx={{ ml: 1 }} />
              ) : null}
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('modules.billing.invoiceNumber')}</TableCell>
                    <TableCell>{t('modules.orders.orderNumber')}</TableCell>
                    <TableCell>{t('modules.billing.issueDate')}</TableCell>
                    <TableCell align="right">{t('modules.billing.total')}</TableCell>
                    <TableCell>{t('common.status')}</TableCell>
                    <TableCell>{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        {t('common.noData')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    invoices.map((inv) => (
                      <TableRow key={inv.id}>
                        <TableCell>{inv.invoiceNumber}</TableCell>
                        <TableCell>{inv.orderNumber}</TableCell>
                        <TableCell>{new Date(inv.issueDate).toLocaleDateString()}</TableCell>
                        <TableCell align="right">${inv.total.toLocaleString()}</TableCell>
                        <TableCell>
                          <Chip size="small" label={t(`paymentStatus.${inv.paymentStatus}`)} />
                        </TableCell>
                        <TableCell>
                          {inv.invoicePdfStoragePath ? (
                            <Button size="small" onClick={() => handleDownloadInvoice(inv)}>
                              {t('portal.downloadInvoice')}
                            </Button>
                          ) : (
                            <Typography variant="caption" color="text.secondary">
                              {t('portal.noInvoicePdf')}
                            </Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CustomerPortalPage;
