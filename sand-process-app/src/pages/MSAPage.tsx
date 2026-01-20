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
  Card,
  CardContent,
  TextField,
  MenuItem,
} from '@mui/material';
import { Add as AddIcon, Description as ContractIcon, Download as DownloadIcon } from '@mui/icons-material';
import { msasApi, customersApi, productsApi } from '../services/api';
import { MSA, Customer, Product } from '../types';
import PageHeader from '../theme/PageHeader';
import generateMSAPDF from '../utils/generateMSAPDF';

const MSAPage: React.FC = () => {
  const { t } = useTranslation();
  const [msas, setMsas] = useState<MSA[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMSA, setSelectedMSA] = useState<MSA | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [newMSA, setNewMSA] = useState({
    customerId: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    paymentTerms: 'Net 30',
    volumeCommitment: '',
    pricing: {} as Record<string, number>,
  });

  useEffect(() => {
    loadData();
    loadCustomersAndProducts();
  }, []);

  const loadCustomersAndProducts = async () => {
    try {
      const [customersData, productsData] = await Promise.all([
        customersApi.getAll(),
        productsApi.getAll(),
      ]);
      setCustomers(customersData);
      setProducts(productsData);
    } catch (err) {
      console.error('Error loading customers/products:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await msasApi.getAll();
      setMsas(data);
    } catch (err: any) {
      console.error('Error loading MSAs:', err);
      setError(err.message || 'Failed to load MSAs');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMSA = (msa: MSA) => {
    setSelectedMSA(msa);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedMSA(null);
  };

  const handleGenerateMSA = async (msa: MSA) => {
    if (!msa) return;

    try {
      setGeneratingPDF(true);
      await generateMSAPDF(msa.id);
    } catch (error: any) {
      console.error('Error generating MSA PDF:', error);
      alert(error.message || 'Failed to generate MSA PDF. Please try again.');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleCreateMSA = async () => {
    if (!newMSA.customerId || !newMSA.startDate || !newMSA.endDate || !newMSA.paymentTerms) {
      alert(t('modules.msa.fillRequiredFields'));
      return;
    }

    if (Object.keys(newMSA.pricing).length === 0) {
      alert(t('modules.msa.addProductPricing'));
      return;
    }

    try {
      await msasApi.create({
        customerId: newMSA.customerId,
        startDate: newMSA.startDate,
        endDate: newMSA.endDate,
        pricing: newMSA.pricing,
        paymentTerms: newMSA.paymentTerms,
        volumeCommitment: newMSA.volumeCommitment ? parseInt(newMSA.volumeCommitment) : undefined,
      });
      setOpenCreateDialog(false);
      setNewMSA({
        customerId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        paymentTerms: 'Net 30',
        volumeCommitment: '',
        pricing: {},
      });
      loadData();
    } catch (err: any) {
      console.error('Error creating MSA:', err);
      alert('Error creating MSA: ' + err.message);
    }
  };

  const handlePricingChange = (productId: string, price: string) => {
    setNewMSA({
      ...newMSA,
      pricing: {
        ...newMSA.pricing,
        [productId]: parseFloat(price) || 0,
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const activeMSAs = msas.filter(m => m.active);
  const inactiveMSAs = msas.filter(m => !m.active);

  return (
    <Box>
      <PageHeader
        title={t('modules.msa.title')}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            {t('modules.msa.createMSA')}
          </Button>
        }
      />

      {error && (
        <Alert className="animate-slide-in-up" severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('modules.msa.activeMSAs')}
              </Typography>
              <Typography variant="h3" color="primary">
                {activeMSAs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('modules.msa.totalMSAs')}
              </Typography>
              <Typography variant="h3">
                {msas.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('modules.msa.inactiveMSAs')}
              </Typography>
              <Typography variant="h3" color="textSecondary">
                {inactiveMSAs.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('modules.msa.allMSAs')}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('modules.msa.customer')}</TableCell>
                    <TableCell>{t('modules.msa.startDate')}</TableCell>
                    <TableCell>{t('modules.msa.endDate')}</TableCell>
                    <TableCell>{t('modules.msa.paymentTerms')}</TableCell>
                    <TableCell>{t('modules.msa.status')}</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {msas.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="textSecondary">{t('modules.msa.noMSAsFound')}</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    msas.map((msa) => (
                      <TableRow key={msa.id}>
                        <TableCell>{msa.customerName}</TableCell>
                        <TableCell>{new Date(msa.startDate).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(msa.endDate).toLocaleDateString()}</TableCell>
                        <TableCell>{msa.paymentTerms}</TableCell>
                        <TableCell>
                          <Chip
                            label={msa.active ? t('modules.msa.active') : t('modules.msa.inactive')}
                            color={msa.active ? 'success' : 'default'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" onClick={() => handleViewMSA(msa)}>
                              View Details
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DownloadIcon />}
                              onClick={() => handleGenerateMSA(msa)}
                              disabled={generatingPDF}
                            >
                              Download PDF
                            </Button>
                          </Box>
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

      <Dialog className="animate-fade-in" open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {t('modules.msa.msaDetails')}: {selectedMSA?.customerName}
        </DialogTitle>
        <DialogContent>
          {selectedMSA && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography><strong>Customer:</strong> {selectedMSA.customerName}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Status:</strong> 
                  <Chip
                    label={selectedMSA.active ? t('modules.msa.active') : t('modules.msa.inactive')}
                    color={selectedMSA.active ? 'success' : 'default'}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Start Date:</strong> {new Date(selectedMSA.startDate).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>End Date:</strong> {new Date(selectedMSA.endDate).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Payment Terms:</strong> {selectedMSA.paymentTerms}</Typography>
              </Grid>
              {selectedMSA.volumeCommitment && (
                <Grid item xs={12}>
                  <Typography><strong>Volume Commitment:</strong> {selectedMSA.volumeCommitment} tons/month</Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Pricing:</Typography>
                <Box sx={{ mt: 1 }}>
                  {Object.entries(selectedMSA.pricing).map(([productId, price]) => (
                    <Typography key={productId} variant="body2">
                      Product {productId}: ${price}/ton
                    </Typography>
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedMSA && (
            <Button
              startIcon={<ContractIcon />}
              onClick={() => handleGenerateMSA(selectedMSA)}
              disabled={generatingPDF}
              variant="outlined"
            >
              {generatingPDF ? 'Generating...' : 'Generate Contract'}
            </Button>
          )}
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create MSA Dialog */}
      <Dialog className="animate-fade-in" open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Create New MSA</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                fullWidth
                label={t('modules.msa.customer') + ' *'}
                value={newMSA.customerId}
                onChange={(e) => setNewMSA({ ...newMSA, customerId: e.target.value })}
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
                fullWidth
                label={t('modules.msa.paymentTerms') + ' *'}
                select
                value={newMSA.paymentTerms}
                onChange={(e) => setNewMSA({ ...newMSA, paymentTerms: e.target.value })}
                required
              >
                <MenuItem value="Net 30">Net 30</MenuItem>
                <MenuItem value="Net 60">Net 60</MenuItem>
                <MenuItem value="Net 15">Net 15</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('modules.msa.startDate') + ' *'}
                type="date"
                value={newMSA.startDate}
                onChange={(e) => setNewMSA({ ...newMSA, startDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('modules.msa.endDate') + ' *'}
                type="date"
                value={newMSA.endDate}
                onChange={(e) => setNewMSA({ ...newMSA, endDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('modules.msa.volumeCommitment')}
                type="number"
                value={newMSA.volumeCommitment}
                onChange={(e) => setNewMSA({ ...newMSA, volumeCommitment: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="subtitle2" sx={{ mt: 2, mb: 1 }}>
                Product Pricing (per ton) *
              </Typography>
              {products.map((product) => (
                <TextField
                  key={product.id}
                  fullWidth
                  label={`${product.name} (${product.meshSize}) - ${t('modules.msa.pricePerTon')}`}
                  type="number"
                  value={newMSA.pricing[product.id] || ''}
                  onChange={(e) => handlePricingChange(product.id, e.target.value)}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                  }}
                />
              ))}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateMSA} variant="contained">
            {t('modules.msa.createMSA')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MSAPage;

