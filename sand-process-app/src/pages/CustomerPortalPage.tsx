import React, { useState, useEffect } from 'react';
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
  Button,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../config/supabase';
import { customersApi, deliveriesApi, invoicesApi, ordersApi, productsApi, qcTestsApi } from '../services/api';
import { Customer, Delivery, Invoice, Order, Product, QCTest } from '../types';
import StatusChip from '../theme/StatusChip';
import PageHeader from '../theme/PageHeader';
import generateQCCertificatePDF from '../utils/generateQCCertificatePDF';
import generatePurchaseOrderPDF from '../utils/generatePurchaseOrderPDF';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CustomerPortalPage: React.FC = () => {
  const { t } = useTranslation();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [certificates, setCertificates] = useState<QCTest[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  const [activeTab, setActiveTab] = useState<number>(0);

  const [orderForm, setOrderForm] = useState<{
    productId: string;
    quantity: number;
    location: string;
    date: string;
  }>({
    productId: '',
    quantity: 25,
    location: '',
    date: new Date().toISOString().slice(0, 10),
  });

  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [poFile, setPoFile] = useState<File | null>(null);
  const [poUploading, setPoUploading] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    if (selectedCustomerId) {
      loadCustomerData(selectedCustomerId);
    }
  }, [selectedCustomerId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [customersData, productsData] = await Promise.all([
        customersApi.getAll(),
        productsApi.getAll(),
      ]);

      setCustomers(customersData);
      setProducts(productsData);

      if (customersData.length > 0) {
        setSelectedCustomerId(customersData[0].id);
      }
    } catch (err: any) {
      console.error('Error loading portal data:', err);
      setError(err.message || 'Failed to load client portal data');
      setLoading(false);
    }
  };

  const loadCustomerData = async (customerId: string) => {
    try {
      setLoading(true);
      setError(null);

      const [deliveriesData, ordersData, invoicesData, qcTests] = await Promise.all([
        deliveriesApi.getAll(),
        ordersApi.getAll(),
        invoicesApi.getAll(),
        qcTestsApi.getAll(),
      ]);

      const customerOrdersList = ordersData.filter(o => o.customerId === customerId);
      setCustomerOrders(customerOrdersList);
      setDeliveries(deliveriesData.filter(d => customerOrdersList.some(o => o.id === d.orderId)));

      setInvoices(invoicesData.filter(inv => inv.customerId === customerId));

      const customerOrderIds = new Set(customerOrdersList.map(o => o.id));
      const customerTests = qcTests.filter(
        t => t.orderId && customerOrderIds.has(t.orderId) && t.status === 'passed' && t.certificateId
      );
      setCertificates(customerTests);

      const firstDelivery = deliveriesData.find(d =>
        customerOrdersList.some(o => o.id === d.orderId)
      );
      setSelectedDelivery(firstDelivery || null);
    } catch (err: any) {
      console.error('Error loading customer portal data:', err);
      setError(err.message || 'Failed to load client data');
    } finally {
      setLoading(false);
    }
  };

  const center = selectedDelivery
    ? [selectedDelivery.route.well.lat, selectedDelivery.route.well.lng]
    : [-38.5, -69.0];

  const handleSubmitOrder = async () => {
    if (!selectedCustomerId || !orderForm.productId || !orderForm.location || !orderForm.date) {
      alert('Please fill in all order fields');
      return;
    }

    try {
      const product = products.find(p => p.id === orderForm.productId);
      const unitPrice = 100; // Simple prototype price per ton

      // Optional: upload customer PO to Supabase Storage
      let poDocumentUrl: string | undefined;
      if (poFile) {
        try {
          setPoUploading(true);
          const bucket = 'purchase-orders';
          const fileExt = poFile.name.split('.').pop() || 'pdf';
          const fileName = `po_${Date.now()}.${fileExt}`;

          const { data, error } = await supabase.storage
            .from(bucket)
            .upload(fileName, poFile, {
              cacheControl: '3600',
              upsert: false,
            });

          if (error) {
            console.error('Error uploading PO file from client portal:', error);
            alert('Failed to upload Purchase Order file. Please try again.');
          } else {
            const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(data.path);
            poDocumentUrl = publicData.publicUrl;
          }
        } finally {
          setPoUploading(false);
        }
      }

      await ordersApi.create({
        customerId: selectedCustomerId,
        deliveryDate: orderForm.date,
        deliveryLocation: orderForm.location,
        deliveryAddress: orderForm.location,
        products: [
          {
            productId: orderForm.productId,
            quantity: orderForm.quantity,
            unitPrice,
          },
        ],
        notes: 'Submitted from Client Portal',
        poDocumentUrl,
      });

      await loadCustomerData(selectedCustomerId);
      alert('Order submitted successfully!');
      setActiveTab(0);
    } catch (err: any) {
      console.error('Error submitting order from portal:', err);
      alert(err.message || 'Failed to submit order');
    }
  };

  const handleOpenPaymentDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPaymentDialogOpen(true);
  };

  const handleConfirmPayment = async () => {
    if (!selectedInvoice) return;

    try {
      // Simple prototype: just mark invoice as paid in Supabase
      await supabase
        .from('invoices')
        .update({
          payment_status: 'paid',
          paid_date: new Date().toISOString().slice(0, 10),
        })
        .eq('id', selectedInvoice.id);

      setPaymentDialogOpen(false);
      setSelectedInvoice(null);
      await loadCustomerData(selectedCustomerId);
      alert('Payment recorded (mock)!');
    } catch (err: any) {
      console.error('Error recording payment:', err);
      alert(err.message || 'Failed to record payment');
    }
  };

  if (loading && !selectedCustomerId) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <Box>
      <PageHeader
        title={t('common.customerPortal')}
        subtitle={
          selectedCustomer
            ? `${selectedCustomer.name} (${selectedCustomer.code})`
            : undefined
        }
        action={
          <TextField
            select
            size="small"
            label="Client"
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            sx={{ minWidth: 220 }}
          >
            {customers.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.name}
              </MenuItem>
            ))}
          </TextField>
        }
      />

      {error && (
        <Alert className="animate-slide-in-up" severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
        <Tab label="Orders" />
        <Tab label="Submit Order" />
        <Tab label="Invoices & Payments" />
        <Tab label="Certificates & Documents" />
      </Tabs>

      {activeTab === 0 && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                My Orders
              </Typography>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Order Number</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell>Products</TableCell>
                      <TableCell>Quantity</TableCell>
                      <TableCell>Delivery Date</TableCell>
                      <TableCell>Delivery Location</TableCell>
                      <TableCell>Total Amount</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customerOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                          <Typography color="textSecondary">No orders found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customerOrders.map((order) => {
                        const delivery = deliveries.find(d => d.orderId === order.id);
                        return (
                          <TableRow key={order.id}>
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {order.orderNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {new Date(order.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {order.products?.map((p, idx) => (
                                <Typography key={idx} variant="body2">
                                  {p.productName}
                                </Typography>
                              ))}
                            </TableCell>
                            <TableCell>
                              {order.products?.map((p, idx) => (
                                <Typography key={idx} variant="body2">
                                  {p.quantity.toFixed(2)} tons
                                </Typography>
                              ))}
                            </TableCell>
                            <TableCell>
                              {new Date(order.deliveryDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{order.deliveryLocation}</Typography>
                              <Typography variant="caption" color="textSecondary">
                                {order.deliveryAddress}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              ${order.totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </TableCell>
                            <TableCell>
                              <StatusChip status={order.status} />
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                {order.poDocumentUrl && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => window.open(order.poDocumentUrl, '_blank')}
                                  >
                                    View PO
                                  </Button>
                                )}
                                <Button
                                  size="small"
                                  variant="outlined"
                                  onClick={async () => {
                                    try {
                                      await generatePurchaseOrderPDF(order.id);
                                    } catch (err: any) {
                                      alert(err.message || 'Failed to generate PO');
                                    }
                                  }}
                                >
                                  Download PO
                                </Button>
                                {delivery && (
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                      setSelectedDelivery(delivery);
                                      // Could open a delivery details dialog here
                                    }}
                                  >
                                    Track
                                  </Button>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>

          {selectedDelivery && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Delivery Tracking: {selectedDelivery.orderNumber}
                </Typography>
                <Grid container spacing={2} sx={{ mt: 1 }}>
                  <Grid item xs={12} md={6}>
                    <Typography><strong>Truck:</strong> {selectedDelivery.truckLicensePlate}</Typography>
                    <Typography><strong>Driver:</strong> {selectedDelivery.driverName}</Typography>
                    {selectedDelivery.eta && (
                      <Typography><strong>ETA:</strong> {new Date(selectedDelivery.eta).toLocaleString()}</Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography><strong>Status:</strong> {selectedDelivery.status}</Typography>
                    <Typography><strong>Checkpoints:</strong> {selectedDelivery.checkpoints.length}/12</Typography>
                    {selectedDelivery.signature && (
                      <Typography><strong>Signed by:</strong> {selectedDelivery.signature.signerName}</Typography>
                    )}
                  </Grid>
                  <Grid item xs={12} md={8}>
                    <Paper sx={{ height: 400, p: 1, mt: 2 }}>
                      <MapContainer
                        center={[selectedDelivery.route.well.lat, selectedDelivery.route.well.lng]}
                        zoom={10}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={[selectedDelivery.route.quarry.lat, selectedDelivery.route.quarry.lng]}>
                          <Popup>Quarry</Popup>
                        </Marker>
                        <Marker position={[selectedDelivery.route.well.lat, selectedDelivery.route.well.lng]}>
                          <Popup>Your Well: {selectedDelivery.route.well.name}</Popup>
                        </Marker>
                        {selectedDelivery.gpsTrack && selectedDelivery.gpsTrack.length > 0 && (
                          <Polyline
                            positions={selectedDelivery.gpsTrack.map(point => [point.lat, point.lng] as [number, number])}
                            color="blue"
                            weight={3}
                          />
                        )}
                      </MapContainer>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {activeTab === 1 && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Submit New Order
              </Typography>
              <TextField
                select
                fullWidth
                label="Product"
                value={orderForm.productId}
                onChange={(e) => setOrderForm({ ...orderForm, productId: e.target.value })}
                sx={{ mb: 2 }}
              >
                {products.map((p) => (
                  <MenuItem key={p.id} value={p.id}>
                    {p.name} ({p.meshSize})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                type="number"
                label="Quantity (tons)"
                value={orderForm.quantity}
                onChange={(e) => setOrderForm({ ...orderForm, quantity: Number(e.target.value) || 0 })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Delivery Location"
                value={orderForm.location}
                onChange={(e) => setOrderForm({ ...orderForm, location: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                type="date"
                label="Delivery Date"
                value={orderForm.date}
                onChange={(e) => setOrderForm({ ...orderForm, date: e.target.value })}
                sx={{ mb: 3 }}
                InputLabelProps={{ shrink: true }}
              />
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 0.5 }}>
                  Upload Customer PO (optional)
                </Typography>
                <Button
                  variant="outlined"
                  component="label"
                  disabled={poUploading}
                  sx={{ mr: 2 }}
                >
                  {poFile ? 'Change File' : 'Select File'}
                  <input
                    type="file"
                    hidden
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                      const file = e.target.files?.[0] || null;
                      setPoFile(file);
                    }}
                  />
                </Button>
                {poFile && (
                  <Typography variant="caption" color="textSecondary">
                    {poFile.name}
                  </Typography>
                )}
              </Box>
              <Button variant="contained" onClick={handleSubmitOrder}>
                Submit Order
              </Button>
            </Paper>
          </Grid>
        </Grid>
      )}

      {activeTab === 2 && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Invoices & Payments
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Invoice</TableCell>
                      <TableCell>Order</TableCell>
                      <TableCell align="right">Total</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoices.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="textSecondary">No invoices found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      invoices.map((inv) => (
                        <TableRow key={inv.id}>
                          <TableCell>{inv.invoiceNumber}</TableCell>
                          <TableCell>{inv.orderNumber}</TableCell>
                          <TableCell align="right">
                            {inv.total.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}
                          </TableCell>
                          <TableCell>
                            <StatusChip status={inv.paymentStatus} />
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="contained"
                              disabled={inv.paymentStatus === 'paid'}
                              onClick={() => handleOpenPaymentDialog(inv)}
                            >
                              Pay Now
                            </Button>
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
      )}

      {activeTab === 3 && (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Certificates & Documents
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Certificate</TableCell>
                      <TableCell>Order</TableCell>
                      <TableCell>Product</TableCell>
                      <TableCell>Test Date</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {certificates.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          <Typography color="textSecondary">No certificates available</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      certificates.map((test) => (
                        <TableRow key={test.id}>
                          <TableCell>{test.certificateId}</TableCell>
                          <TableCell>{test.orderNumber}</TableCell>
                          <TableCell>{test.productName}</TableCell>
                          <TableCell>
                            {test.testDate
                              ? new Date(test.testDate).toLocaleDateString()
                              : ''}
                          </TableCell>
                          <TableCell align="right">
                            <Button
                              size="small"
                              sx={{ mr: 1 }}
                              onClick={() => generateQCCertificatePDF(test.id)}
                            >
                              Download Certificate
                            </Button>
                            {test.orderId && (
                              <Button
                                size="small"
                                onClick={() => generatePurchaseOrderPDF(test.orderId!)}
                              >
                                Download PO
                              </Button>
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
      )}

      <Dialog open={paymentDialogOpen} onClose={() => setPaymentDialogOpen(false)}>
        <DialogTitle>Mock Payment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            This is a prototype. No real payment will be processed.
          </Typography>
          <Typography variant="body2">
            Invoice: {selectedInvoice?.invoiceNumber}{' '}
          </Typography>
          <Typography variant="body2">
            Amount:{' '}
            {selectedInvoice?.total.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPaymentDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleConfirmPayment}>
            Confirm Payment
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerPortalPage;

