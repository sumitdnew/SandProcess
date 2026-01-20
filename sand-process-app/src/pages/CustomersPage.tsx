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
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Description as ContractIcon } from '@mui/icons-material';
import { customersApi, ordersApi, msasApi } from '../services/api';
import { Customer } from '../types';
import PageHeader from '../theme/PageHeader';
import generateMSAPDF from '../utils/generateMSAPDF';

const CustomersPage: React.FC = () => {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [generatingMSA, setGeneratingMSA] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    code: '',
    contactPerson: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [customersData, ordersData] = await Promise.all([
        customersApi.getAll(),
        ordersApi.getAll(),
      ]);
      setCustomers(customersData);
      setOrders(ordersData);
    } catch (err: any) {
      console.error('Error loading customers:', err);
      setError(err.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCustomer(null);
  };

  const handleGenerateMSA = async (customer: Customer) => {
    if (!customer) return;

    try {
      setGeneratingMSA(true);
      
      // Fetch the customer's active MSA
      const msa = await msasApi.getByCustomerId(customer.id);
      
      if (!msa) {
        alert(`No active MSA found for customer "${customer.name}". Please create an MSA first.`);
        setGeneratingMSA(false);
        return;
      }

      // Generate PDF using the MSA ID
      await generateMSAPDF(msa.id);
    } catch (error: any) {
      console.error('Error generating MSA:', error);
      alert(error.message || 'Failed to generate MSA. Please try again.');
    } finally {
      setGeneratingMSA(false);
    }
  };

  const handleCreateCustomer = async () => {
    if (!newCustomer.name || !newCustomer.code || !newCustomer.contactPerson || !newCustomer.email) {
      alert(t('modules.customers.fillRequiredFields'));
      return;
    }

    try {
      await customersApi.create(newCustomer);
      setOpenCreateDialog(false);
      setNewCustomer({ name: '', code: '', contactPerson: '', email: '', phone: '', address: '' });
      loadData();
    } catch (err: any) {
      console.error('Error creating customer:', err);
      alert('Error creating customer: ' + err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const customerStats = customers.map(customer => {
    const customerOrders = orders.filter(o => o.customerId === customer.id);
    const totalOrders = customerOrders.length;
    const totalValue = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    return { customer, totalOrders, totalValue };
  });

  return (
    <Box>
      <PageHeader
        title={t('modules.customers.title')}
        action={
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenCreateDialog(true)}
          >
            {t('modules.customers.addCustomer')}
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
                {t('modules.customers.totalCustomers')}
              </Typography>
              <Typography variant="h3" color="primary">
                {customers.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('modules.customers.totalOrders')}
              </Typography>
              <Typography variant="h3">
                {orders.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('modules.customers.totalRevenue')}
              </Typography>
              <Typography variant="h3" color="success.main">
                ${orders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Box sx={{ mb: 2 }}>
            <TextField
              placeholder={t('modules.customers.searchCustomers')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ maxWidth: 400 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Box>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('modules.customers.customerList')}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Code</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Contact Person</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Phone</TableCell>
                    <TableCell>Total Orders</TableCell>
                    <TableCell>Total Value</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredCustomers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} align="center">
                        <Typography color="textSecondary">{t('modules.customers.noCustomersFound')}</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCustomers.map((customer) => {
                      const stats = customerStats.find(s => s.customer.id === customer.id);
                      return (
                        <TableRow key={customer.id}>
                          <TableCell>{customer.code}</TableCell>
                          <TableCell>{customer.name}</TableCell>
                          <TableCell>{customer.contactPerson}</TableCell>
                          <TableCell>{customer.email}</TableCell>
                          <TableCell>{customer.phone}</TableCell>
                          <TableCell>{stats?.totalOrders || 0}</TableCell>
                          <TableCell>${(stats?.totalValue || 0).toLocaleString()}</TableCell>
                          <TableCell>
                            <Button size="small" onClick={() => handleViewCustomer(customer)}>
                              {t('modules.customers.viewDetails')}
                            </Button>
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
      </Grid>

      <Dialog className="animate-fade-in" open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {t('modules.customers.customerDetails')}: {selectedCustomer?.name}
        </DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography><strong>Code:</strong> {selectedCustomer.code}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Name:</strong> {selectedCustomer.name}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Contact Person:</strong> {selectedCustomer.contactPerson}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Email:</strong> {selectedCustomer.email}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography><strong>Phone:</strong> {selectedCustomer.phone}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>{t('modules.customers.orderStatistics')}:</Typography>
                <Box sx={{ mt: 1 }}>
                  {(() => {
                    const stats = customerStats.find(s => s.customer.id === selectedCustomer.id);
                    return (
                      <>
                        <Typography>Total Orders: {stats?.totalOrders || 0}</Typography>
                        <Typography>Total Value: ${(stats?.totalValue || 0).toLocaleString()}</Typography>
                      </>
                    );
                  })()}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            startIcon={<ContractIcon />}
            onClick={() => selectedCustomer && handleGenerateMSA(selectedCustomer)}
            disabled={generatingMSA || !selectedCustomer}
            variant="outlined"
          >
            {generatingMSA ? 'Generating...' : 'Generate MSA'}
          </Button>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Customer Dialog */}
      <Dialog className="animate-fade-in" open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('modules.customers.addCustomer')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('modules.customers.customerName')}
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('modules.customers.customerCode')}
                value={newCustomer.code}
                onChange={(e) => setNewCustomer({ ...newCustomer, code: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('modules.customers.contactPerson')}
                value={newCustomer.contactPerson}
                onChange={(e) => setNewCustomer({ ...newCustomer, contactPerson: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('modules.customers.email')}
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('modules.customers.phone')}
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('modules.customers.address')}
                multiline
                rows={2}
                value={newCustomer.address}
                onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateCustomer} variant="contained">
            {t('modules.customers.createCustomer')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomersPage;

