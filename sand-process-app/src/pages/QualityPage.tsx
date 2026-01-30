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
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  Divider,
  IconButton,
  Tooltip,
  Badge,
  AlertTitle,
  FormControlLabel,
  Checkbox,
  CardContent,
  CardActions,
} from '@mui/material';
import {
  Science as ScienceIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  PlayArrow as StartIcon,
  Close as CloseIcon,
  Warning as WarningIcon,
  Description as CertificateIcon,
  Refresh as RefreshIcon,
  Add as AddIcon,
  Link as LinkIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { qcTestsApi, ordersApi, productsApi, inventoryApi } from '../services/api';
import { supabase } from '../config/supabase';
import { useApp } from '../context/AppContext';
import { QCTest, QCStatus, Order, Product } from '../types';

interface TestResults {
  meshSize: { value: string; passed: boolean; required: string };
  purity: { value: number; passed: boolean; minRequired: number };
  roundness: { value: number; passed: boolean; minRequired: number };
  moisture: { value: number; passed: boolean; maxRequired: number };
}

const QualityPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, currentRole } = useApp();
  const isQcTech = currentRole === 'qc_technician';
  const [tests, setTests] = useState<QCTest[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTest, setSelectedTest] = useState<QCTest | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openTestForm, setOpenTestForm] = useState(false);
  const [openResultsDialog, setOpenResultsDialog] = useState(false);
  const [testFormData, setTestFormData] = useState({
    lotNumber: '',
    orderId: '',
    productId: '',
  });
  const [testResults, setTestResults] = useState<TestResults>({
    meshSize: { value: '', passed: false, required: '30/50' },
    purity: { value: 0, passed: false, minRequired: 95 },
    roundness: { value: 0, passed: false, minRequired: 0.8 },
    moisture: { value: 0, passed: false, maxRequired: 1.0 },
  });
  const [activeStep, setActiveStep] = useState(0);

  const getStatusColor = (status: QCStatus): string => {
    const colors: Record<QCStatus, string> = {
      pending: 'default',
      in_progress: 'warning',
      passed: 'success',
      failed: 'error',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: QCStatus) => {
    const icons: Record<QCStatus, JSX.Element> = {
      pending: <PendingIcon fontSize="small" />,
      in_progress: <StartIcon fontSize="small" />,
      passed: <CheckCircleIcon fontSize="small" />,
      failed: <CancelIcon fontSize="small" />,
    };
    return icons[status] || <PendingIcon fontSize="small" />;
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

  const handleViewTest = (test: QCTest) => {
    setSelectedTest(test);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTest(null);
  };

  const handleOpenTestForm = (orderId?: string, productId?: string) => {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 1000);
    setTestFormData({
      lotNumber: `LOT-${year}-${String(randomNum).padStart(3, '0')}`,
      orderId: orderId || '',
      productId: productId || '',
    });
    setActiveStep(0);
    setOpenTestForm(true);
  };

  const handleCreateTest = async () => {
    if (!testFormData.lotNumber || !testFormData.productId) {
      alert('Please fill in all required fields (Lot Number and Product)');
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    const productId = testFormData.productId.trim();
    if (!productId || !uuidRegex.test(productId)) {
      alert('Invalid product selected. Please select a product from the dropdown.');
      return;
    }

    let orderId: string | null = null;
    if (testFormData.orderId && testFormData.orderId.trim() !== '') {
      const trimmedOrderId = testFormData.orderId.trim();
      if (!uuidRegex.test(trimmedOrderId)) {
        alert('Invalid order selected. Please select an order from the dropdown.');
        return;
      }
      orderId = trimmedOrderId;
    }

    let technicianId: string | null = null;
    if (currentUser?.id && uuidRegex.test(currentUser.id)) {
      technicianId = currentUser.id;
    }

    try {
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

      if (error) throw error;

      setOpenTestForm(false);
      setTestFormData({ lotNumber: '', orderId: '', productId: '' });
      setActiveStep(0);
      loadData();
      
      alert(`✓ Test created successfully!\nLot: ${testFormData.lotNumber}\n\nYou can now run the test.`);
    } catch (err: any) {
      console.error('Error creating QC test:', err);
      alert('Error creating test: ' + err.message);
    }
  };

  const handleRunTest = async (testId: string) => {
    try {
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

  const handleOpenResultsDialog = (test: QCTest) => {
    setSelectedTest(test);
    
    const product = products.find(p => p.id === test.productId);
    const meshSize = product?.meshSize || '30/50';
    
    setTestResults({
      meshSize: { value: meshSize, passed: true, required: meshSize },
      purity: { value: 98.5, passed: true, minRequired: 95 },
      roundness: { value: 0.85, passed: true, minRequired: 0.8 },
      moisture: { value: 0.5, passed: true, maxRequired: 1.0 },
    });
    setOpenResultsDialog(true);
  };

  const handleResultChange = (
    field: keyof TestResults,
    value: number | string | boolean,
    isValueField: boolean = true
  ) => {
    setTestResults(prev => {
      const updated = { ...prev };
      
      if (isValueField) {
        updated[field].value = value as any;
        
        if (field === 'meshSize') {
          updated[field].passed = value === updated[field].required;
        } else if (field === 'purity' || field === 'roundness') {
          updated[field].passed = (value as number) >= updated[field].minRequired;
        } else if (field === 'moisture') {
          updated[field].passed = (value as number) <= updated[field].maxRequired;
        }
      } else {
        updated[field].passed = value === true;
      }
      
      return updated;
    });
  };

  const allTestsPassed = () => {
    return Object.values(testResults).every(result => result.passed);
  };

  const handleSaveResults = async () => {
    if (!selectedTest) return;

    if (!allTestsPassed()) {
      const confirmReject = window.confirm(
        'Not all tests passed. Do you want to REJECT this lot?\n\nClick OK to reject, Cancel to continue editing.'
      );
      if (confirmReject) {
        await handleRejectTest(selectedTest.id);
        return;
      } else {
        return;
      }
    }

    try {
      const year = new Date().getFullYear();
      const { count } = await supabase
        .from('qc_tests')
        .select('*', { count: 'exact', head: true })
        .like('certificate_id', `CERT-${year}-%`);
      
      const certNumber = `CERT-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

      const results = {
        meshSize: { passed: testResults.meshSize.passed, value: testResults.meshSize.value },
        purity: { passed: testResults.purity.passed, value: testResults.purity.value },
        roundness: { passed: testResults.roundness.passed, value: testResults.roundness.value },
        moisture: { passed: testResults.moisture.passed, value: testResults.moisture.value },
      };

      const { error: updateError } = await supabase
        .from('qc_tests')
        .update({
          status: 'passed',
          results: results,
          certificate_id: certNumber,
        })
        .eq('id', selectedTest.id);

      if (updateError) throw updateError;

      if (selectedTest.orderId) {
        const { data: del } = await supabase
          .from('deliveries')
          .select('truck_id')
          .eq('order_id', selectedTest.orderId)
          .neq('status', 'delivered')
          .limit(1)
          .maybeSingle();
        const hasDelivery = !!(del as any)?.truck_id;
        if (hasDelivery) {
          await supabase
            .from('qc_tests')
            .update({ truck_id: (del as any).truck_id })
            .eq('id', selectedTest.id);
        }
        const order = await ordersApi.getById(selectedTest.orderId);
        if (order) {
          if (hasDelivery) {
            await ordersApi.updateStatus(selectedTest.orderId, 'dispatched');
          } else if (order.status !== 'dispatched') {
            await ordersApi.updateStatus(selectedTest.orderId, 'ready');
          }
        }
      } else {
        // Produce-to-inventory lot: add quantity to inventory when QC passes
        const qty = selectedTest.quantity ?? 0;
        const siteId = selectedTest.siteId ?? 'quarry';
        if (qty > 0 && siteId) {
          await inventoryApi.addToBalance(siteId, selectedTest.productId, qty);
        }
      }

      setOpenResultsDialog(false);
      setSelectedTest(null);
      loadData();
      
      const produceToInvMsg = !selectedTest.orderId && (selectedTest.quantity ?? 0) > 0
        ? ` Inventory increased by ${selectedTest.quantity} tons at ${selectedTest.siteId === 'near_well' ? 'near-well' : 'quarry'}.`
        : '';
      alert(`✓ Test APPROVED!\n\nCertificate: ${certNumber}\n\n${selectedTest.orderId ? 'Certificate attached. Driver notified to pick up.' : 'Standalone test completed.' + produceToInvMsg}`);
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

      setOpenResultsDialog(false);
      setSelectedTest(null);
      loadData();
      
      alert('✗ Test REJECTED\n\nLot cannot be dispatched.');
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

  const certificates = tests
    .filter(t => t.status === 'passed' && t.certificateId)
    .map(t => ({
      id: t.certificateId!,
      certificateNumber: t.certificateId!,
      lotNumber: t.lotNumber,
      productName: t.productName,
      testDate: t.testDate,
      orderNumber: t.orderNumber,
    }));

  const pendingTests = tests.filter(t => t.status === 'pending' || t.status === 'in_progress');

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {t('modules.quality.title')}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            <Badge badgeContent={pendingTests.length} color="warning" sx={{ mr: 2 }}>
              <ScienceIcon />
            </Badge>
            {pendingTests.length} pending tests • {certificates.length} certificates issued
          </Typography>
          {isQcTech && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {t('modules.quality.qcTechSubtitle')}
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={loadData}
          >
            {t('common.refresh')}
          </Button>
          <Button
            variant={isQcTech ? 'outlined' : 'contained'}
            startIcon={<AddIcon />}
            onClick={() => handleOpenTestForm()}
          >
            Create QC Test
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Orders Needing QC */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Orders Requiring QC Testing
              </Typography>
              <Chip 
                label={`${orders.filter(o => o.status === 'qc' || o.status === 'in_production' || o.status === 'ready').length} orders`} 
                color="warning"
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Orders with a delivery need a QC test + certificate before the driver can pick up. &quot;Ready&quot; = assigned, awaiting cert.
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('modules.quality.orderNumber')}</TableCell>
                    <TableCell>{t('modules.quality.customer')}</TableCell>
                    <TableCell>Product</TableCell>
                    <TableCell>{t('modules.quality.orderStatus')}</TableCell>
                    <TableCell>{t('modules.quality.qcTestStatus')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.filter(o => o.status === 'qc' || o.status === 'in_production' || o.status === 'ready').length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                        <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography variant="body1" color="textSecondary">
                          All orders are either pending production or have passed QC
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders
                      .filter(o => o.status === 'qc' || o.status === 'in_production' || o.status === 'ready' || o.status === 'dispatched')
                      .map((order) => {
                        const orderTest = tests.find(t => t.orderId === order.id);
                        const hasCertificate = orderTest?.status === 'passed' && orderTest?.certificateId;
                        const needsQC = order.status === 'qc' || (order.status === 'ready' && !hasCertificate);
                        
                        return (
                          <TableRow 
                            key={order.id}
                            sx={{ 
                              bgcolor: needsQC && !hasCertificate ? 'warning.light' : 
                                      hasCertificate ? 'success.light' : 'transparent'
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={needsQC ? 'bold' : 'normal'}>
                                {order.orderNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>
                              {order.products && order.products.map((p, idx) => (
                                <Typography key={idx} variant="body2">
                                  {p.productName}
                                </Typography>
                              ))}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={order.status}
                                size="small"
                                color={
                                  order.status === 'qc' ? 'warning' : 
                                  order.status === 'in_production' ? 'info' :
                                  order.status === 'ready' ? 'success' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              {hasCertificate ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CheckCircleIcon color="success" fontSize="small" />
                                  <Typography variant="body2" color="success.main">
                                    {orderTest.certificateId}
                                  </Typography>
                                </Box>
                              ) : orderTest ? (
                                <Chip 
                                  label={orderTest.status} 
                                  size="small" 
                                  color={getStatusColor(orderTest.status) as any}
                                  icon={getStatusIcon(orderTest.status)}
                                />
                              ) : needsQC ? (
                                <Chip 
                                  label="QC Required" 
                                  size="small" 
                                  color="error"
                                  icon={<WarningIcon />}
                                />
                              ) : (
                                <Typography variant="body2" color="textSecondary">-</Typography>
                              )}
                            </TableCell>
                            <TableCell align="right">
                              {!orderTest ? (
                                <Button
                                  size="small"
                                  variant={needsQC ? "contained" : "outlined"}
                                  color={needsQC ? "warning" : "primary"}
                                  startIcon={<AddIcon />}
                                  onClick={() => {
                                    const firstProduct = order.products && order.products.length > 0 ? order.products[0] : null;
                                    if (!firstProduct || !firstProduct.productId) {
                                      alert(t('modules.quality.orderHasNoProducts'));
                                      return;
                                    }
                                    handleOpenTestForm(order.id, firstProduct.productId);
                                  }}
                                >
                                  {needsQC ? 'Create Test (URGENT)' : 'Create Test'}
                                </Button>
                              ) : orderTest.status === 'pending' ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<StartIcon />}
                                  onClick={() => handleRunTest(orderTest.id)}
                                >
                                  Run Test
                                </Button>
                              ) : orderTest.status === 'in_progress' ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<ScienceIcon />}
                                  onClick={() => handleOpenResultsDialog(orderTest)}
                                >
                                  Enter Results
                                </Button>
                              ) : hasCertificate ? (
                                <Button
                                  size="small"
                                  startIcon={<CertificateIcon />}
                                  onClick={() => handleViewTest(orderTest)}
                                >
                                  View Certificate
                                </Button>
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
        </Grid>

        {/* Test Queue */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              {t('modules.quality.testQueue')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {tests.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <ScienceIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                <Typography variant="h6" color="textSecondary" gutterBottom>
                  No QC Tests Yet
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  Create your first quality control test to get started
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenTestForm()}
                >
                  Create QC Test
                </Button>
              </Box>
            ) : (
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
                    {tests.map((test) => (
                      <TableRow 
                        key={test.id}
                        sx={{ 
                          bgcolor: test.orderId && test.status === 'passed' && test.certificateId ? 'success.light' : 
                                  test.orderId ? 'info.light' : 'transparent'
                        }}
                      >
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {test.lotNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>{test.productName}</TableCell>
                        <TableCell>
                          {test.orderNumber ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Chip label={test.orderNumber} size="small" color="primary" />
                              {test.status === 'passed' && test.certificateId && (
                                <Tooltip title="Certificate Generated">
                                  <CheckCircleIcon color="success" fontSize="small" />
                                </Tooltip>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary">Standalone</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={test.status}
                            color={getStatusColor(test.status) as any}
                            size="small"
                            icon={getStatusIcon(test.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" onClick={() => handleViewTest(test)}>
                              View
                            </Button>
                            {test.status === 'pending' && (
                              <Button 
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => handleRunTest(test.id)}
                              >
                                Run Test
                              </Button>
                            )}
                            {test.status === 'in_progress' && (
                              <Button 
                                size="small" 
                                variant="contained"
                                color="success"
                                onClick={() => handleOpenResultsDialog(test)}
                              >
                                Enter Results
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Grid>

        {/* Certificates */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Certificates Issued
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {certificates.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CertificateIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  No certificates issued yet
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 500, overflow: 'auto' }}>
                {certificates.map((cert) => (
                  <Card key={cert.id} sx={{ mb: 2 }}>
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {cert.certificateNumber}
                        </Typography>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </Box>
                      <Typography variant="body2" color="textSecondary">
                        {cert.productName}
                      </Typography>
                      <Typography variant="caption" display="block" color="textSecondary">
                        Lot: {cert.lotNumber}
                      </Typography>
                      {cert.orderNumber && (
                        <Chip 
                          label={cert.orderNumber} 
                          size="small" 
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                    <CardActions sx={{ pt: 0 }}>
                      <Button size="small" startIcon={<CertificateIcon />}>
                        Download
                      </Button>
                    </CardActions>
                  </Card>
                ))}
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Test Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>QC Test: {selectedTest?.lotNumber}</span>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTest && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary" gutterBottom>Product</Typography>
                <Typography variant="body1" gutterBottom>{selectedTest.productName}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary" gutterBottom>Status</Typography>
                <Chip
                  label={selectedTest.status}
                  color={getStatusColor(selectedTest.status) as any}
                  icon={getStatusIcon(selectedTest.status)}
                />
              </Grid>
              {selectedTest.orderNumber && (
                <Grid item xs={12}>
                  <Alert severity="info" icon={<LinkIcon />}>
                    <Typography variant="body2">
                      <strong>Linked to Order:</strong> {selectedTest.orderNumber}
                    </Typography>
                  </Alert>
                </Grid>
              )}
              {selectedTest.certificateId && (
                <Grid item xs={12}>
                  <Alert severity="success" icon={<CertificateIcon />}>
                    <AlertTitle>Certificate Issued</AlertTitle>
                    <Typography variant="body2">
                      <strong>Certificate Number:</strong> {selectedTest.certificateId}
                    </Typography>
                  </Alert>
                </Grid>
              )}
              {selectedTest.results && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>Test Results:</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Parameter</TableCell>
                          <TableCell>Value</TableCell>
                          <TableCell>Result</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>Mesh Size</TableCell>
                          <TableCell>{selectedTest.results.meshSize.value}</TableCell>
                          <TableCell>
                            {selectedTest.results.meshSize.passed ? 
                              <CheckCircleIcon color="success" fontSize="small" /> : 
                              <CancelIcon color="error" fontSize="small" />
                            }
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Purity</TableCell>
                          <TableCell>{selectedTest.results.purity.value}%</TableCell>
                          <TableCell>
                            {selectedTest.results.purity.passed ? 
                              <CheckCircleIcon color="success" fontSize="small" /> : 
                              <CancelIcon color="error" fontSize="small" />
                            }
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Roundness</TableCell>
                          <TableCell>{selectedTest.results.roundness.value}</TableCell>
                          <TableCell>
                            {selectedTest.results.roundness.passed ? 
                              <CheckCircleIcon color="success" fontSize="small" /> : 
                              <CancelIcon color="error" fontSize="small" />
                            }
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>Moisture</TableCell>
                          <TableCell>{selectedTest.results.moisture.value}%</TableCell>
                          <TableCell>
                            {selectedTest.results.moisture.passed ? 
                              <CheckCircleIcon color="success" fontSize="small" /> : 
                              <CancelIcon color="error" fontSize="small" />
                            }
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Test Dialog */}
      <Dialog open={openTestForm} onClose={() => setOpenTestForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Create QC Test</span>
            <IconButton onClick={() => setOpenTestForm(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 3 }}>
            <Step>
              <StepLabel>Test Details</StepLabel>
            </Step>
            <Step>
              <StepLabel>Link to Order</StepLabel>
            </Step>
          </Stepper>

          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('modules.quality.lotNumber')}
                value={testFormData.lotNumber}
                onChange={(e) => setTestFormData({ ...testFormData, lotNumber: e.target.value })}
                required
                placeholder="LOT-2026-XXX"
                helperText="Auto-generated, but you can customize"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label={t('modules.quality.product') + ' *'}
                value={testFormData.productId}
                onChange={(e) => {
                  setTestFormData({ ...testFormData, productId: e.target.value });
                  setActiveStep(1);
                }}
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
                label={t('modules.quality.order') + ' (Optional)'}
                value={testFormData.orderId}
                onChange={(e) => setTestFormData({ ...testFormData, orderId: e.target.value })}
                helperText={testFormData.orderId ? 'Certificate will be linked to this order' : 'Leave blank for standalone test'}
              >
                <MenuItem value="">
                  <em>None - Standalone Test</em>
                </MenuItem>
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
                <Alert severity="info" icon={<InfoIcon />}>
                  <AlertTitle>Order-Linked Test</AlertTitle>
                  <Typography variant="body2">
                    When approved, this test will:
                  </Typography>
                  <Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
                    <li><Typography variant="body2">Generate a QC Certificate</Typography></li>
                    <li><Typography variant="body2">Mark order as ready for dispatch</Typography></li>
                    <li><Typography variant="body2">Allow truck assignment</Typography></li>
                  </Box>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenTestForm(false)}>Cancel</Button>
          <Button 
            onClick={handleCreateTest} 
            variant="contained"
            disabled={!testFormData.lotNumber || !testFormData.productId}
            size="large"
          >
            Create Test
          </Button>
        </DialogActions>
      </Dialog>

      {/* Results Entry Dialog */}
      <Dialog open={openResultsDialog} onClose={() => setOpenResultsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Enter Test Results - {selectedTest?.lotNumber}</span>
            <IconButton onClick={() => setOpenResultsDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3, mt: 2 }}>
            <AlertTitle>Quality Standards</AlertTitle>
            <Typography variant="body2">
              Enter measured values for each parameter. Pass/fail will be calculated automatically.
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {/* Mesh Size */}
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: testResults.meshSize.passed ? 'success.light' : 'grey.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Mesh Size Test
                    </Typography>
                    {testResults.meshSize.passed ? 
                      <CheckCircleIcon color="success" /> : 
                      <WarningIcon color="warning" />
                    }
                  </Box>
                  <TextField
                    fullWidth
                    label="Measured Mesh Size"
                    value={testResults.meshSize.value}
                    onChange={(e) => handleResultChange('meshSize', e.target.value)}
                    placeholder="e.g., 30/50"
                    sx={{ mb: 2 }}
                    helperText={`Required: ${testResults.meshSize.required}`}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={testResults.meshSize.passed}
                        onChange={(e) => handleResultChange('meshSize', e.target.checked, false)}
                        color="success"
                      />
                    }
                    label={testResults.meshSize.passed ? "PASS ✓" : "Fail"}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Purity */}
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: testResults.purity.passed ? 'success.light' : 'grey.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Purity Test
                    </Typography>
                    {testResults.purity.passed ? 
                      <CheckCircleIcon color="success" /> : 
                      <WarningIcon color="warning" />
                    }
                  </Box>
                  <TextField
                    fullWidth
                    type="number"
                    label="Purity (%)"
                    value={testResults.purity.value}
                    onChange={(e) => handleResultChange('purity', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    sx={{ mb: 2 }}
                    helperText={`Minimum required: ${testResults.purity.minRequired}%`}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={testResults.purity.passed}
                        onChange={(e) => handleResultChange('purity', e.target.checked, false)}
                        color="success"
                      />
                    }
                    label={testResults.purity.passed ? "PASS ✓" : "Fail"}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Roundness */}
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: testResults.roundness.passed ? 'success.light' : 'grey.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Roundness Test
                    </Typography>
                    {testResults.roundness.passed ? 
                      <CheckCircleIcon color="success" /> : 
                      <WarningIcon color="warning" />
                    }
                  </Box>
                  <TextField
                    fullWidth
                    type="number"
                    label="Roundness Factor"
                    value={testResults.roundness.value}
                    onChange={(e) => handleResultChange('roundness', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, max: 1, step: 0.01 }}
                    sx={{ mb: 2 }}
                    helperText={`Minimum required: ${testResults.roundness.minRequired}`}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={testResults.roundness.passed}
                        onChange={(e) => handleResultChange('roundness', e.target.checked, false)}
                        color="success"
                      />
                    }
                    label={testResults.roundness.passed ? "PASS ✓" : "Fail"}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Moisture */}
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: testResults.moisture.passed ? 'success.light' : 'grey.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      Moisture Test
                    </Typography>
                    {testResults.moisture.passed ? 
                      <CheckCircleIcon color="success" /> : 
                      <WarningIcon color="warning" />
                    }
                  </Box>
                  <TextField
                    fullWidth
                    type="number"
                    label="Moisture Content (%)"
                    value={testResults.moisture.value}
                    onChange={(e) => handleResultChange('moisture', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, max: 10, step: 0.1 }}
                    sx={{ mb: 2 }}
                    helperText={`Maximum allowed: ${testResults.moisture.maxRequired}%`}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={testResults.moisture.passed}
                        onChange={(e) => handleResultChange('moisture', e.target.checked, false)}
                        color="success"
                      />
                    }
                    label={testResults.moisture.passed ? "PASS ✓" : "Fail"}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Summary */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: allTestsPassed() ? 'success.light' : 'warning.light' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Overall Result:
                  </Typography>
                  <Chip 
                    label={allTestsPassed() ? "ALL TESTS PASSED ✓" : "SOME TESTS FAILED"} 
                    color={allTestsPassed() ? "success" : "warning"}
                    icon={allTestsPassed() ? <CheckCircleIcon /> : <WarningIcon />}
                  />
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button 
            onClick={() => setOpenResultsDialog(false)}
            startIcon={<CloseIcon />}
          >
            Cancel
          </Button>
          {!allTestsPassed() && (
            <Button 
              variant="outlined" 
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => {
                if (selectedTest) {
                  handleRejectTest(selectedTest.id);
                }
              }}
            >
              Reject Lot
            </Button>
          )}
          <Button 
            variant="contained" 
            color="success"
            size="large"
            startIcon={<CheckCircleIcon />}
            onClick={handleSaveResults}
            disabled={!allTestsPassed()}
          >
            Approve & Generate Certificate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QualityPage;