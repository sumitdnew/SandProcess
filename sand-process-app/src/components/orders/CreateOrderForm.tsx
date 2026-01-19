import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  Box,
  Typography,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { customersApi, productsApi, msasApi, ordersApi } from '../../services/api';
import { Customer, Product, MSA } from '../../types';

interface OrderProduct {
  productId: string;
  quantity: number;
  unitPrice: number;
}

interface CreateOrderFormProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({ open, onClose, onSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [msas, setMsas] = useState<MSA[]>([]);
  
  // Form state
  const [customerId, setCustomerId] = useState('');
  const [msaId, setMsaId] = useState('');
  const [deliveryDate, setDeliveryDate] = useState<Date | null>(new Date());
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [orderProducts, setOrderProducts] = useState<OrderProduct[]>([
    { productId: '', quantity: 0, unitPrice: 0 },
  ]);

  useEffect(() => {
    if (open) {
      loadData();
    }
  }, [open]);

  useEffect(() => {
    if (customerId) {
      loadMSAForCustomer(customerId);
    } else {
      setMsaId('');
    }
  }, [customerId]);

  useEffect(() => {
    // When MSA is selected, auto-fill prices for all products
    if (msaId && orderProducts.length > 0) {
      const msa = msas.find(m => m.id === msaId);
      if (msa) {
        const updated = orderProducts.map(p => {
          if (p.productId && msa.pricing[p.productId]) {
            return { ...p, unitPrice: msa.pricing[p.productId] };
          }
          return p;
        });
        setOrderProducts(updated);
      }
    }
  }, [msaId, msas]);

  const loadData = async () => {
    try {
      const [customersData, productsData] = await Promise.all([
        customersApi.getAll(),
        productsApi.getAll(),
      ]);
      setCustomers(customersData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadMSAForCustomer = async (customerId: string) => {
    try {
      const msa = await msasApi.getByCustomerId(customerId);
      if (msa) {
        setMsas([msa]);
        // Don't auto-select MSA - let user choose between MSA or Standalone PO
        // setMsaId(msa.id);
      } else {
        setMsas([]);
        setMsaId('');
      }
    } catch (error) {
      console.error('Error loading MSA:', error);
      setMsas([]);
      setMsaId('');
    }
  };

  const handleAddProduct = () => {
    setOrderProducts([...orderProducts, { productId: '', quantity: 0, unitPrice: 0 }]);
  };

  const handleRemoveProduct = (index: number) => {
    setOrderProducts(orderProducts.filter((_, i) => i !== index));
  };

  const handleProductChange = (index: number, field: keyof OrderProduct, value: any) => {
    const updated = [...orderProducts];
    updated[index] = { ...updated[index], [field]: value };
    
    // If product changed and MSA exists, auto-fill price from MSA
    if (field === 'productId' && msaId && value) {
      const msa = msas.find(m => m.id === msaId);
      if (msa && msa.pricing && msa.pricing[value]) {
        updated[index].unitPrice = msa.pricing[value];
      }
    }
    
    setOrderProducts(updated);
  };

  const calculateTotal = () => {
    return orderProducts.reduce(
      (sum, p) => sum + (p.quantity || 0) * (p.unitPrice || 0),
      0
    );
  };

  const handleSubmit = async () => {
    if (!customerId || !deliveryDate || !deliveryLocation || !deliveryAddress) {
      alert('Please fill in all required fields');
      return;
    }

    const validProducts = orderProducts.filter(
      p => p.productId && p.quantity > 0 && p.unitPrice > 0
    );

    if (validProducts.length === 0) {
      alert('Please add at least one product');
      return;
    }

    setLoading(true);
    try {
      await ordersApi.create({
        customerId,
        msaId: msaId || undefined,
        deliveryDate: deliveryDate.toISOString().split('T')[0],
        deliveryLocation,
        deliveryAddress,
        products: validProducts,
        notes: notes || undefined,
      });
      
      onSuccess();
      handleClose();
    } catch (error: any) {
      console.error('Error creating order:', error);
      alert('Error creating order: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setCustomerId('');
    setMsaId('');
    setDeliveryDate(new Date());
    setDeliveryLocation('');
    setDeliveryAddress('');
    setNotes('');
    setOrderProducts([{ productId: '', quantity: 0, unitPrice: 0 }]);
    onClose();
  };

  const selectedMSA = msas.find(m => m.id === msaId);

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>{t('modules.orders.createOrder')}</DialogTitle>
      <DialogContent>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <Grid container spacing={3} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label={t('modules.orders.customer')}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                {customers.map((customer) => (
                  <MenuItem key={customer.id} value={customer.id}>
                    {customer.name} ({customer.code})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label="Order Type"
                value={msaId}
                onChange={(e) => setMsaId(e.target.value)}
                disabled={!customerId}
                helperText={
                  !customerId 
                    ? 'Select customer first' 
                    : msas.length === 0 
                      ? 'No active MSA - This will be a Standalone Purchase Order (PO)' 
                      : 'Choose MSA Order or Standalone PO'
                }
              >
                <MenuItem value="">
                  <em>Standalone Purchase Order (PO)</em>
                </MenuItem>
                {msas.map((msa) => (
                  <MenuItem key={msa.id} value={msa.id}>
                    MSA Order - {msa.customerName} ({new Date(msa.startDate).getFullYear()})
                  </MenuItem>
                ))}
              </TextField>
              {selectedMSA && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'primary.light', borderRadius: 1 }}>
                  <Typography variant="caption" color="primary.contrastText" sx={{ display: 'block', fontWeight: 'bold' }}>
                    ✓ MSA Order Selected
                  </Typography>
                  <Typography variant="caption" color="primary.contrastText" sx={{ display: 'block' }}>
                    {t('forms.orderForm.pricingAutoApplied')}
                  </Typography>
                  <Typography variant="caption" color="primary.contrastText" sx={{ display: 'block' }}>
                    Payment Terms: {selectedMSA.paymentTerms}
                  </Typography>
                </Box>
              )}
              {customerId && !msaId && (
                <Box sx={{ mt: 1, p: 1, bgcolor: 'warning.light', borderRadius: 1 }}>
                  <Typography variant="caption" color="warning.contrastText" sx={{ display: 'block', fontWeight: 'bold' }}>
                    📋 {t('forms.orderForm.standalonePO')}
                  </Typography>
                  <Typography variant="caption" color="warning.contrastText" sx={{ display: 'block' }}>
                    {t('forms.orderForm.pricingManualEntry')}
                  </Typography>
                  {msas.length > 0 && (
                    <Typography variant="caption" color="warning.contrastText" sx={{ display: 'block', fontStyle: 'italic' }}>
                      Note: Customer has an active MSA, but you're creating a standalone PO
                    </Typography>
                  )}
                </Box>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <DatePicker
                label={t('modules.orders.deliveryDate')}
                value={deliveryDate}
                onChange={(newValue) => setDeliveryDate(newValue)}
                slotProps={{ textField: { fullWidth: true, required: true } }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('forms.orderForm.deliveryLocation')}
                value={deliveryLocation}
                onChange={(e) => setDeliveryLocation(e.target.value)}
                required
                placeholder={t('forms.orderForm.deliveryLocationPlaceholder')}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('forms.orderForm.deliveryAddress')}
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                required
                multiline
                rows={2}
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">{t('forms.orderForm.products')}</Typography>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddProduct}
                  size="small"
                >
                  {t('forms.orderForm.addProduct')}
                </Button>
              </Box>

              {orderProducts.map((product, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={4}>
                      <TextField
                        select
                        fullWidth
                        label={t('forms.orderForm.product')}
                        value={product.productId}
                        onChange={(e) => handleProductChange(index, 'productId', e.target.value)}
                        required
                      >
                        {products.map((p) => (
                          <MenuItem key={p.id} value={p.id}>
                            {p.name} ({p.meshSize})
                          </MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label={t('forms.orderForm.quantity')}
                        type="number"
                        value={product.quantity || ''}
                        onChange={(e) => handleProductChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                        required
                        inputProps={{ min: 0, step: 0.1 }}
                      />
                    </Grid>
                    <Grid item xs={12} md={3}>
                      <TextField
                        fullWidth
                        label={t('forms.orderForm.unitPrice')}
                        type="number"
                        value={product.unitPrice || ''}
                        onChange={(e) => handleProductChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        required
                        inputProps={{ min: 0, step: 0.01 }}
                        disabled={!!selectedMSA && !!product.productId && !!selectedMSA.pricing[product.productId]}
                        helperText={selectedMSA && product.productId && selectedMSA.pricing[product.productId] ? 'From MSA' : ''}
                      />
                    </Grid>
                    <Grid item xs={12} md={2}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                          ${((product.quantity || 0) * (product.unitPrice || 0)).toFixed(2)}
                        </Typography>
                        {orderProducts.length > 1 && (
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveProduct(index)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              ))}
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
              />
            </Grid>

            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">Total Amount:</Typography>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                    ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? t('common.loading') : t('common.save')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOrderForm;

