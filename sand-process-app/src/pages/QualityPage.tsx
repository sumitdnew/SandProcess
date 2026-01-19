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
  Card,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
} from '@mui/material';
import { qcTestsApi, ordersApi, productsApi } from '../services/api';
import { supabase } from '../config/supabase';
import { useApp } from '../context/AppContext';
import { QCTest, QCStatus } from '../types';

const QualityPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useApp();
  const [tests, setTests] = useState<QCTest[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<QCTest | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTestForm, setOpenTestForm] = useState(false);
  const [testFormData, setTestFormData] = useState({
    lotNumber: '',
    orderId: '',
    productId: '',
  });

  const getStatusColor = (status: QCStatus) => {
    const colors: Record<QCStatus, string> = {
      pending: 'default',
      in_progress: 'warning',
      passed: 'success',
      failed: 'error',
    };
    return colors[status] || 'default';
  };

  const handleViewTest = (test: QCTest) => {
    setSelectedTest(test);
    setOpenDialog(true);
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [testsData, ordersData, productsData] = await Promise.all([
        qcTestsApi.getAll(),
        ordersApi.getAll(),
        productsApi.getAll(),
      ]);
      setTests(testsData);
      setOrders(ordersData);
      setProducts(productsData);
    } catch (err: any) {
      console.error('Error loading QC data:', err);
      setError(err.message || 'Failed to load QC data');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTest(null);
  };

  const handleCreateTest = async () => {
    if (!testFormData.lotNumber || !testFormData.productId) {
      alert('Please fill in all required fields (Lot Number and Product)');
      return;
    }

    // Validate that productId is a valid UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Trim and validate productId
    const productId = testFormData.productId.trim();
    if (!productId || !uuidRegex.test(productId)) {
      alert('Invalid product selected. Please select a product from the dropdown.');
      console.error('Invalid productId:', testFormData.productId);
      return;
    }

    // Validate and clean orderId if provided
    let orderId: string | null = null;
    if (testFormData.orderId && testFormData.orderId.trim() !== '') {
      const trimmedOrderId = testFormData.orderId.trim();
      if (!uuidRegex.test(trimmedOrderId)) {
        alert('Invalid order selected. Please select an order from the dropdown.');
        console.error('Invalid orderId:', testFormData.orderId);
        return;
      }
      orderId = trimmedOrderId;
    }

    // Validate technician_id if provided (must be UUID)
    let technicianId: string | null = null;
    if (currentUser?.id) {
      if (uuidRegex.test(currentUser.id)) {
        technicianId = currentUser.id;
      } else {
        // If currentUser.id is not a UUID (e.g., from mock data), set to null
        console.warn('Current user ID is not a valid UUID, setting technician_id to null:', currentUser.id);
        technicianId = null;
      }
    }

    try {
      console.log('Creating QC test with:', {
        lot_number: testFormData.lotNumber.trim(),
        order_id: orderId,
        product_id: productId,
        technician_id: technicianId,
      });

      const { data, error } = await supabase
        .from('qc_tests')
        .insert({
          lot_number: testFormData.lotNumber.trim(),
          order_id: orderId,
          product_id: productId,
          status: 'pending',
          technician_id: technicianId,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      setOpenTestForm(false);
      setTestFormData({ lotNumber: '', orderId: '', productId: '' });
      loadData();
    } catch (err: any) {
      console.error('Error creating QC test:', err);
      console.error('Form data at error:', testFormData);
      console.error('Product ID:', productId);
      console.error('Order ID:', orderId);
      console.error('Technician ID:', technicianId);
      
      let errorMessage = 'Error creating test: ' + err.message;
      if (err.message && err.message.includes('uuid')) {
        errorMessage += '\n\nPlease ensure all IDs are valid UUIDs. Check the browser console for details.';
      }
      alert(errorMessage);
    }
  };

  const handleRunTest = async (testId: string) => {
    try {
      // Update test status to in_progress
      await supabase
        .from('qc_tests')
        .update({ 
          status: 'in_progress',
          test_date: new Date().toISOString()
        })
        .eq('id', testId);

      loadData();
    } catch (err: any) {
      console.error('Error updating test:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleApproveTest = async (testId: string, results: any) => {
    try {
      // Get the test to find the order_id
      const { data: testData, error: testError } = await supabase
        .from('qc_tests')
        .select('order_id')
        .eq('id', testId)
        .single();

      if (testError) throw testError;

      // Generate certificate number
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('qc_tests')
        .select('*', { count: 'exact', head: true })
        .like('certificate_id', `CERT-${year}-%`);
      
      const certNumber = `CERT-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

      // Update test with results and certificate
      const { error: updateError } = await supabase
        .from('qc_tests')
        .update({
          status: 'passed',
          results: results,
          certificate_id: certNumber,
        })
        .eq('id', testId);

      if (updateError) throw updateError;

      // If test is linked to an order, update order status to 'ready' (ready for dispatch)
      if (testData.order_id) {
        await ordersApi.updateStatus(testData.order_id, 'ready');
      }

      loadData();
    } catch (err: any) {
      console.error('Error approving test:', err);
      alert('Error: ' + err.message);
    }
  };

  const handleRejectTest = async (testId: string) => {
    try {
      await supabase
        .from('qc_tests')
        .update({ status: 'failed' })
        .eq('id', testId);

      loadData();
    } catch (err: any) {
      console.error('Error rejecting test:', err);
      alert('Error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  // Get certificates from passed tests
  const certificates = tests
    .filter(t => t.status === 'passed' && t.certificateId)
    .map(t => ({
      id: t.certificateId!,
      certificateNumber: t.certificateId!,
      lotNumber: t.lotNumber,
      productName: t.productName,
      testDate: t.testDate,
      passed: true,
    }));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('modules.quality.title')}
        </Typography>
        <Button
          variant="contained"
          onClick={() => setOpenTestForm(true)}
        >
          {t('modules.quality.runTest')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* All Orders - QC Status */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          {t('modules.quality.allOrdersQCStatus')}
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('modules.quality.orderNumber')}</TableCell>
                <TableCell>{t('modules.quality.customer')}</TableCell>
                <TableCell>{t('modules.quality.orderStatus')}</TableCell>
                <TableCell>{t('modules.quality.qcTestStatus')}</TableCell>
                <TableCell>{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography color="textSecondary">{t('modules.quality.noOrdersFound')}</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const orderTest = tests.find(t => t.orderId === order.id);
                  const hasCertificate = orderTest?.status === 'passed' && orderTest?.certificateId;
                  const needsQC = order.status === 'qc' || order.status === 'in_production';
                  const canCreateTest = order.status !== 'pending' && order.status !== 'invoiced' && order.status !== 'completed';
                  
                  return (
                    <TableRow 
                      key={order.id}
                      sx={{ 
                        bgcolor: needsQC && !hasCertificate ? 'warning.light' : 
                                hasCertificate ? 'success.light' : 
                                order.status === 'pending' ? 'grey.100' : 'transparent'
                      }}
                    >
                      <TableCell>
                        <Typography variant="body2" fontWeight={needsQC ? 'bold' : 'normal'}>
                          {order.orderNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>{order.customerName}</TableCell>
                      <TableCell>
                        <Chip
                          label={order.status}
                          size="small"
                          color={
                            order.status === 'qc' ? 'warning' : 
                            order.status === 'in_production' ? 'info' :
                            order.status === 'ready' ? 'success' :
                            order.status === 'pending' ? 'default' : 'default'
                          }
                        />
                      </TableCell>
                      <TableCell>
                        {hasCertificate ? (
                          <Chip label={t('modules.quality.certificateCheck')} size="small" color="success" />
                        ) : orderTest ? (
                          <Chip label={orderTest.status} size="small" color={getStatusColor(orderTest.status) as any} />
                        ) : needsQC ? (
                          <Chip label={t('modules.quality.needsQCTest')} size="small" color="error" />
                        ) : canCreateTest ? (
                          <Chip label={t('modules.quality.canCreateTest')} size="small" color="info" />
                        ) : (
                          <Typography variant="body2" color="textSecondary">N/A</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {!orderTest && canCreateTest ? (
                          <Button
                            size="small"
                            variant={needsQC ? "contained" : "outlined"}
                            color={needsQC ? "warning" : "primary"}
                            onClick={() => {
                              // Pre-fill form with order
                              // Ensure we have a valid product ID
                              const firstProduct = order.products && order.products.length > 0 ? order.products[0] : null;
                              if (!firstProduct || !firstProduct.productId) {
                                alert(t('modules.quality.orderHasNoProducts'));
                                return;
                              }
                              
                              setTestFormData({
                                lotNumber: `LOT-${new Date().getFullYear()}-${order.orderNumber.split('-')[2]}`,
                                orderId: order.id,
                                productId: firstProduct.productId,
                              });
                              setOpenTestForm(true);
                            }}
                          >
                            {needsQC ? t('modules.quality.createQCTestWarning') : t('modules.quality.createQCTest')}
                          </Button>
                        ) : orderTest?.status === 'pending' ? (
                          <Button
                            size="small"
                            variant="contained"
                            onClick={() => handleRunTest(orderTest.id)}
                          >
                            Run Test
                          </Button>
                        ) : orderTest?.status === 'in_progress' ? (
                          <Button
                            size="small"
                            variant="contained"
                            color="success"
                            onClick={() => handleViewTest(orderTest)}
                          >
                            Enter Results
                          </Button>
                        ) : hasCertificate ? (
                          <Button
                            size="small"
                            onClick={() => handleViewTest(orderTest)}
                          >
                            {t('modules.quality.viewCertificate')}
                          </Button>
                        ) : order.status === 'pending' ? (
                          <Typography variant="caption" color="textSecondary">
                            Confirm order first
                          </Typography>
                        ) : null}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('modules.quality.testQueue')}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Lot Number</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
              <TableBody>
                {tests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography color="textSecondary">{t('common.noData')}</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  tests.map((test) => (
                    <TableRow 
                      key={test.id}
                      sx={{ 
                        bgcolor: test.orderId && test.status === 'passed' && test.certificateId ? 'success.light' : 
                                test.orderId ? 'info.light' : 'transparent'
                      }}
                    >
                      <TableCell>{test.lotNumber}</TableCell>
                      <TableCell>{test.productName}</TableCell>
                      <TableCell>
                        {test.orderNumber ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip label={test.orderNumber} size="small" color="primary" />
                            {test.status === 'passed' && test.certificateId && (
                              <Chip label="Certified" size="small" color="success" />
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" color="textSecondary">Standalone Test</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={test.status}
                          color={getStatusColor(test.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small" onClick={() => handleViewTest(test)}>
                          {t('common.view')}
                        </Button>
                        {test.status === 'pending' && (
                          <Button 
                            size="small" 
                            onClick={() => handleRunTest(test.id)}
                            sx={{ ml: 1 }}
                          >
                            Run Test
                          </Button>
                        )}
                        {test.status === 'in_progress' && (
                          <Button 
                            size="small" 
                            variant="contained"
                            color="success"
                            onClick={() => handleViewTest(test)}
                            sx={{ ml: 1 }}
                          >
                            Enter Results
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

        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('modules.quality.certificate')}
            </Typography>
            <Box sx={{ mt: 2 }}>
              {certificates.map((cert) => (
                <Card key={cert.id} sx={{ mb: 2, p: 2 }}>
                  <Typography variant="subtitle1">{cert.certificateNumber}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {cert.productName} - {cert.lotNumber}
                  </Typography>
                  <Chip
                    label={cert.passed ? 'Passed' : 'Failed'}
                    color={cert.passed ? 'success' : 'error'}
                    size="small"
                    sx={{ mt: 1 }}
                  />
                  <Button size="small" sx={{ mt: 1 }} fullWidth>
                    Download
                  </Button>
                </Card>
              ))}
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          QC Test: {selectedTest?.lotNumber}
        </DialogTitle>
        <DialogContent>
              {selectedTest && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography><strong>Product:</strong> {selectedTest.productName}</Typography>
              </Grid>
              {selectedTest.orderNumber && (
                <Grid item xs={12}>
                  <Typography><strong>Order:</strong> 
                    <Chip label={selectedTest.orderNumber} size="small" color="primary" sx={{ ml: 1 }} />
                  </Typography>
                </Grid>
              )}
              {selectedTest.certificateId && (
                <Grid item xs={12}>
                  <Typography><strong>Certificate:</strong> 
                    <Chip label={selectedTest.certificateId} size="small" color="success" sx={{ ml: 1 }} />
                  </Typography>
                </Grid>
              )}
              <Grid item xs={12}>
                <Typography><strong>Status:</strong> 
                  <Chip
                    label={selectedTest.status}
                    color={getStatusColor(selectedTest.status) as any}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Grid>
              {selectedTest.results && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mt: 2 }}>Test Results:</Typography>
                  <Box sx={{ mt: 1 }}>
                    <Typography>Mesh Size: {selectedTest.results.meshSize.value} 
                      {selectedTest.results.meshSize.passed ? ' ✓' : ' ✗'}</Typography>
                    <Typography>Purity: {selectedTest.results.purity.value}% 
                      {selectedTest.results.purity.passed ? ' ✓' : ' ✗'}</Typography>
                    <Typography>Roundness: {selectedTest.results.roundness.value} 
                      {selectedTest.results.roundness.passed ? ' ✓' : ' ✗'}</Typography>
                    <Typography>Moisture: {selectedTest.results.moisture.value}% 
                      {selectedTest.results.moisture.passed ? ' ✓' : ' ✗'}</Typography>
                  </Box>
                </Grid>
              )}
              {selectedTest.technicianName && (
                <Grid item xs={12}>
                  <Typography><strong>Technician:</strong> {selectedTest.technicianName}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
          {selectedTest?.status === 'in_progress' && (
            <>
              <Button 
                variant="contained" 
                color="success"
                onClick={() => {
                  // Mock results for now - in real app, these would come from a form
                  const mockResults = {
                    meshSize: { value: '20/40', passed: true },
                    purity: { value: 98.5, passed: true },
                    roundness: { value: 0.85, passed: true },
                    moisture: { value: 0.5, passed: true },
                  };
                  handleApproveTest(selectedTest.id, mockResults);
                  handleCloseDialog();
                }}
              >
                {t('modules.quality.approve')}
              </Button>
              <Button 
                variant="contained" 
                color="error"
                onClick={() => {
                  handleRejectTest(selectedTest.id);
                  handleCloseDialog();
                }}
              >
                {t('modules.quality.reject')}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>

      {/* Create QC Test Dialog */}
      <Dialog open={openTestForm} onClose={() => setOpenTestForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('modules.quality.runTest')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('modules.quality.lotNumber')}
                value={testFormData.lotNumber}
                onChange={(e) => setTestFormData({ ...testFormData, lotNumber: e.target.value })}
                required
                placeholder={t('modules.quality.lotNumberPlaceholder')}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label={t('modules.quality.product')}
                value={testFormData.productId}
                onChange={(e) => setTestFormData({ ...testFormData, productId: e.target.value })}
                required
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.name} ({product.meshSize})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label={t('modules.quality.order')}
                value={testFormData.orderId}
                onChange={(e) => setTestFormData({ ...testFormData, orderId: e.target.value })}
                helperText={testFormData.orderId ? t('modules.quality.orderHelperText') : t('modules.quality.orderHelperTextNoOrder')}
              >
                <MenuItem value="">None - Standalone Test</MenuItem>
                {orders
                  .filter(order => order.status === 'qc' || order.status === 'in_production' || order.status === 'ready')
                  .map((order) => {
                    const hasTest = tests.some(t => t.orderId === order.id && t.status === 'passed');
                    return (
                      <MenuItem key={order.id} value={order.id}>
                        {order.orderNumber} - {order.customerName} {hasTest ? '(Has Certificate)' : '(Needs Certificate)'}
                      </MenuItem>
                    );
                  })}
              </TextField>
            </Grid>
            {testFormData.orderId && (
              <Grid item xs={12}>
                <Alert severity="info">
                  This QC test will be linked to order {orders.find(o => o.id === testFormData.orderId)?.orderNumber}. 
                  When approved, a certificate will be generated and the order will be marked as ready for dispatch.
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTestForm(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleCreateTest} variant="contained">
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QualityPage;

