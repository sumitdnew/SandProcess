import React, { useState, useEffect, useRef } from 'react';
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
  Card,
  CardContent,
  CircularProgress,
  Alert,
  MenuItem,
  TextField,
} from '@mui/material';
import { invoicesApi, ordersApi, pickupReleasesApi } from '../services/api';
import { supabase } from '../config/supabase';
import { Invoice, PaymentStatus, Order } from '../types';

const BillingPage: React.FC = () => {
  const { t } = useTranslation();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openGenerateDialog, setOpenGenerateDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<Invoice | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [pdfUploadSuccess, setPdfUploadSuccess] = useState(false);
  const invoicePdfInputRef = useRef<HTMLInputElement>(null);

  const getPaymentStatusColor = (status: PaymentStatus) => {
    const colors: Record<PaymentStatus, string> = {
      pending: 'warning',
      paid: 'success',
      overdue: 'error',
      partial: 'info',
    };
    return colors[status] || 'default';
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [invoicesData, ordersData] = await Promise.all([
        invoicesApi.getAll(),
        ordersApi.getAll(),
      ]);
      setInvoices(invoicesData);
      // Filter orders that are delivered but not yet invoiced
      const deliverableOrders = ordersData.filter(o => 
        o.status === 'delivered' || o.status === 'completed'
      );
      setOrders(deliverableOrders);
    } catch (err: any) {
      console.error('Error loading billing data:', err);
      setError(err.message || 'Failed to load billing data');
    } finally {
      setLoading(false);
    }
  };

  const totalOutstanding = invoices
    .filter(i => i.paymentStatus !== 'paid')
    .reduce((sum, i) => sum + i.total, 0);

  const averageDSO = invoices.length > 0
    ? invoices.reduce((sum, i) => sum + i.daysOutstanding, 0) / invoices.length
    : 0;

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setPdfUploadSuccess(false);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedInvoice(null);
    setPdfUploadSuccess(false);
  };

  const handleUploadInvoicePdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedInvoice) return;
    if (file.type !== 'application/pdf') {
      alert(t('modules.billing.pdfOnly'));
      e.target.value = '';
      return;
    }
    setUploadingPdf(true);
    try {
      await invoicesApi.uploadInvoicePdf(selectedInvoice.id, file);
      const updated = await invoicesApi.getAll();
      setInvoices(updated);
      const inv = updated.find((i) => i.id === selectedInvoice.id);
      if (inv) {
        setSelectedInvoice(inv);
        setPdfUploadSuccess(true);
      }
    } catch (err: any) {
      alert(err?.message || t('modules.billing.uploadFailed'));
    } finally {
      setUploadingPdf(false);
      e.target.value = '';
    }
  };

  const handleViewUploadedPdf = async () => {
    if (!selectedInvoice?.invoicePdfStoragePath) return;
    const url = await invoicesApi.getInvoicePdfSignedUrl(selectedInvoice.invoicePdfStoragePath);
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
    else alert(t('modules.billing.couldNotOpenPdf'));
  };

  const handleRemoveInvoicePdf = async () => {
    if (!selectedInvoice) return;
    if (!window.confirm(t('modules.billing.confirmRemovePdf'))) return;
    setUploadingPdf(true);
    try {
      await invoicesApi.clearInvoicePdf(selectedInvoice.id);
      const updated = await invoicesApi.getAll();
      setInvoices(updated);
      const inv = updated.find((i) => i.id === selectedInvoice.id);
      if (inv) setSelectedInvoice(inv);
    } catch (err: any) {
      alert(err?.message || t('modules.billing.uploadFailed'));
    } finally {
      setUploadingPdf(false);
    }
  };

  const handleGenerateInvoice = async () => {
    if (!selectedOrderForInvoice) {
      alert(t('modules.billing.selectOrder'));
      return;
    }

    const isPickup = selectedOrderForInvoice.fulfillmentType === 'pickup';

    if (isPickup) {
      const release = await pickupReleasesApi.getByOrderId(selectedOrderForInvoice.id);
      if (!release) {
        alert(t('modules.billing.cannotInvoicePickupNoRelease'));
        return;
      }
    } else {
      // RN-005: Invoice only with complete proof (delivery + certificate)
      const { data: deliveryData } = await supabase
        .from('deliveries')
        .select('id, status, actual_arrival')
        .eq('order_id', selectedOrderForInvoice.id)
        .eq('status', 'delivered')
        .single();

      if (!deliveryData) {
        alert(t('modules.billing.cannotInvoiceNotDelivered'));
        return;
      }
    }

    // Check if order has certificate
    const hasCert = await ordersApi.hasCertificate(selectedOrderForInvoice.id);
    if (!hasCert) {
      alert(t('modules.billing.cannotInvoiceNoCert'));
      return;
    }

    try {
      // Generate invoice number
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .like('invoice_number', `INV-${year}-%`);
      
      const invoiceNumber = `INV-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

      // Calculate dates
      const issueDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // Net 30
      const dueDateStr = dueDate.toISOString().split('T')[0];

      // Create invoice
      const { error } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          order_id: selectedOrderForInvoice.id,
          customer_id: selectedOrderForInvoice.customerId,
          issue_date: issueDate,
          due_date: dueDateStr,
          subtotal: selectedOrderForInvoice.totalAmount,
          tax: 0,
          total: selectedOrderForInvoice.totalAmount,
          payment_status: 'pending',
          days_outstanding: 0,
        })
        .select()
        .single();

      if (error) throw error;

      // Update order status
      await ordersApi.updateStatus(selectedOrderForInvoice.id, 'invoiced');

      setOpenGenerateDialog(false);
      setSelectedOrderForInvoice(null);
      loadData();
    } catch (err: any) {
      console.error('Error generating invoice:', err);
      alert('Error generating invoice: ' + err.message);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedInvoiceForPayment || !paymentAmount) {
      alert(t('modules.billing.enterPaymentAmount'));
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert(t('modules.billing.enterValidPaymentAmount'));
      return;
    }

    try {
      const newStatus = amount >= selectedInvoiceForPayment.total ? 'paid' : 'partial';
      const paidDate = new Date().toISOString().split('T')[0];

      await supabase
        .from('invoices')
        .update({
          payment_status: newStatus,
          paid_date: paidDate,
        })
        .eq('id', selectedInvoiceForPayment.id);

      setOpenPaymentDialog(false);
      setSelectedInvoiceForPayment(null);
      setPaymentAmount('');
      loadData();
    } catch (err: any) {
      console.error('Error recording payment:', err);
      alert('Error recording payment: ' + err.message);
    }
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
          {t('modules.billing.title')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => setOpenGenerateDialog(true)}
          disabled={orders.length === 0}
        >
          {t('modules.billing.generateInvoice')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Outstanding
              </Typography>
              <Typography variant="h4">
                ${totalOutstanding.toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                {t('modules.billing.dso')}
              </Typography>
              <Typography variant="h4">
                {averageDSO.toFixed(1)} days
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" gutterBottom>
                Total Invoices
              </Typography>
              <Typography variant="h4">
                {invoices.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Invoices
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('modules.billing.invoiceNumber')}</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>{t('modules.billing.issueDate')}</TableCell>
                    <TableCell>{t('modules.billing.dueDate')}</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>{t('modules.billing.daysOutstanding')}</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>{invoice.invoiceNumber}</TableCell>
                      <TableCell>{invoice.orderNumber}</TableCell>
                      <TableCell>{invoice.customerName}</TableCell>
                      <TableCell>{new Date(invoice.issueDate).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                      <TableCell>${invoice.total.toLocaleString()}</TableCell>
                      <TableCell>{invoice.daysOutstanding}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                          <Chip
                            label={t(`paymentStatus.${invoice.paymentStatus}`)}
                            color={getPaymentStatusColor(invoice.paymentStatus) as any}
                            size="small"
                          />
                          {invoice.invoicePdfStoragePath && (
                            <Chip label={t('modules.billing.pdfUploadedBadge')} size="small" color="primary" variant="outlined" />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button size="small" onClick={() => handleViewInvoice(invoice)}>
                            {t('common.view')}
                          </Button>
                          {invoice.paymentStatus !== 'paid' && (
                            <Button 
                              size="small" 
                              variant="outlined"
                              color="success"
                              onClick={() => {
                                setSelectedInvoiceForPayment(invoice);
                                setPaymentAmount(invoice.total.toString());
                                setOpenPaymentDialog(true);
                              }}
                            >
                              {t('modules.billing.recordPayment')}
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {t('modules.billing.invoiceNumber')}: {selectedInvoice?.invoiceNumber}
        </DialogTitle>
        <DialogContent>
          {selectedInvoice && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography><strong>Order:</strong> {selectedInvoice.orderNumber}</Typography>
                <Typography><strong>Customer:</strong> {selectedInvoice.customerName}</Typography>
                <Typography><strong>{t('modules.billing.issueDate')}:</strong> {new Date(selectedInvoice.issueDate).toLocaleDateString()}</Typography>
                <Typography><strong>{t('modules.billing.dueDate')}:</strong> {new Date(selectedInvoice.dueDate).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Subtotal:</strong> ${selectedInvoice.subtotal.toLocaleString()}</Typography>
                <Typography><strong>Tax:</strong> ${selectedInvoice.tax.toLocaleString()}</Typography>
                <Typography><strong>Total:</strong> ${selectedInvoice.total.toLocaleString()}</Typography>
                <Chip
                  label={t(`paymentStatus.${selectedInvoice.paymentStatus}`)}
                  color={getPaymentStatusColor(selectedInvoice.paymentStatus) as any}
                  sx={{ mt: 1 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>{t('modules.billing.items')}:</Typography>
                {selectedInvoice.items.map((item, idx) => (
                  <Typography key={idx}>
                    {item.description} - {item.quantity} @ ${item.unitPrice} = ${item.total}
                  </Typography>
                ))}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>{t('modules.billing.attachments')}:</Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                  {selectedInvoice.attachments.certificate && (
                    <Button size="small" variant="outlined">{t('modules.billing.certificate')}</Button>
                  )}
                  {selectedInvoice.attachments.signature && (
                    <Button size="small" variant="outlined">{t('modules.billing.signature')}</Button>
                  )}
                  {selectedInvoice.attachments.traceabilityReport && (
                    <Button size="small" variant="outlined">{t('modules.billing.traceabilityReport')}</Button>
                  )}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>{t('modules.billing.officialInvoicePdf')}:</Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
                  {t('modules.billing.pdfUploadSavesAutomatically')}
                </Typography>
                {pdfUploadSuccess && (
                  <Alert severity="success" sx={{ mb: 1 }} onClose={() => setPdfUploadSuccess(false)}>
                    {t('modules.billing.pdfSavedToInvoice')}
                  </Alert>
                )}
                <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input
                    ref={invoicePdfInputRef}
                    type="file"
                    accept="application/pdf"
                    hidden
                    onChange={handleUploadInvoicePdf}
                  />
                  <Button
                    size="small"
                    variant="outlined"
                    disabled={uploadingPdf}
                    onClick={() => invoicePdfInputRef.current?.click()}
                  >
                    {uploadingPdf
                      ? t('common.loading')
                      : selectedInvoice.invoicePdfStoragePath
                        ? t('modules.billing.replacePdf')
                        : t('modules.billing.uploadPdf')}
                  </Button>
                  {selectedInvoice.invoicePdfStoragePath && (
                    <>
                      <Chip size="small" color="success" label={t('modules.billing.pdfOnFile')} />
                      <Button size="small" variant="contained" onClick={handleViewUploadedPdf} disabled={uploadingPdf}>
                        {t('modules.billing.viewUploadedPdf')}
                      </Button>
                      <Button size="small" color="error" onClick={handleRemoveInvoicePdf} disabled={uploadingPdf}>
                        {t('modules.billing.removePdf')}
                      </Button>
                    </>
                  )}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            px: 3,
            pb: 2,
            pt: 0,
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: 1.5,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            {t('modules.billing.invoiceDialogFooterHint')}
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
            <Button
              variant="outlined"
              onClick={() => selectedInvoice?.invoicePdfStoragePath && handleViewUploadedPdf()}
              disabled={!selectedInvoice?.invoicePdfStoragePath}
            >
              {t('modules.billing.downloadPDF')}
            </Button>
            <Button onClick={handleCloseDialog} variant="contained" color="primary">
              {t('modules.billing.doneClose')}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Generate Invoice Dialog */}
      <Dialog open={openGenerateDialog} onClose={() => setOpenGenerateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('modules.billing.generateInvoice')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label={t('modules.billing.order')}
                value={selectedOrderForInvoice?.id || ''}
                onChange={(e) => {
                  const order = orders.find(o => o.id === e.target.value);
                  setSelectedOrderForInvoice(order || null);
                }}
              >
                {orders.map((order) => (
                  <MenuItem key={order.id} value={order.id}>
                    {order.orderNumber} - {order.customerName} - ${order.totalAmount.toLocaleString()}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {selectedOrderForInvoice && (
              <>
                <Grid item xs={12}>
                  <Typography variant="body2" color="textSecondary">
                    Customer: {selectedOrderForInvoice.customerName}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Total Amount: ${selectedOrderForInvoice.totalAmount.toLocaleString()}
                  </Typography>
                </Grid>
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGenerateDialog(false)}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleGenerateInvoice} 
            variant="contained"
            disabled={!selectedOrderForInvoice}
          >
            {t('modules.billing.generateInvoice')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={openPaymentDialog} onClose={() => setOpenPaymentDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('modules.billing.recordPayment')}</DialogTitle>
        <DialogContent>
          {selectedInvoiceForPayment && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  {t('modules.billing.invoiceDetails')}
                </Typography>
                <Typography><strong>Invoice:</strong> {selectedInvoiceForPayment.invoiceNumber}</Typography>
                <Typography><strong>Customer:</strong> {selectedInvoiceForPayment.customerName}</Typography>
                <Typography><strong>Total Amount:</strong> ${selectedInvoiceForPayment.total.toLocaleString()}</Typography>
                <Typography><strong>Outstanding:</strong> ${selectedInvoiceForPayment.total.toLocaleString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('modules.billing.paymentAmount')}
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  inputProps={{ min: 0, max: selectedInvoiceForPayment.total, step: 0.01 }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPaymentDialog(false)}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleRecordPayment} 
            variant="contained"
            disabled={!paymentAmount || parseFloat(paymentAmount) <= 0}
          >
            {t('modules.billing.recordPayment')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BillingPage;

