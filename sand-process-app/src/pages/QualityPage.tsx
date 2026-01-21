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
  Download as DownloadIcon,
} from '@mui/icons-material';
import { qcTestsApi, ordersApi, productsApi } from '../services/api';
import { supabase } from '../config/supabase';
import { useApp } from '../context/AppContext';
import { QCTest, QCStatus, Order, Product } from '../types';
import StatusChip from '../theme/StatusChip';
import PageHeader from '../theme/PageHeader';
import generateQCCertificatePDF from '../utils/generateQCCertificatePDF';

interface TestResults {
  meshSize: { value: string; passed: boolean; required: string };
  purity: { value: number; passed: boolean; minRequired: number };
  roundness: { value: number; passed: boolean; minRequired: number };
  moisture: { value: number; passed: boolean; maxRequired: number };
}


const QualityPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useApp();
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
  const [autoDecision, setAutoDecision] = useState<'pass' | 'fail' | null>(null);
  const [testResults, setTestResults] = useState<TestResults>({
    meshSize: { value: '', passed: false, required: '' },
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

  const handleOpenTestForm = async (orderId?: string, productId?: string) => {
    // Generate lot number based on existing lots from Supabase
    const year = new Date().getFullYear();
    const { count } = await supabase
      .from('qc_tests')
      .select('*', { count: 'exact', head: true })
      .like('lot_number', `LOT-${year}-%`);
    
    const lotNumber = `LOT-${year}-${String((count || 0) + 1).padStart(4, '0')}`;
    
    setTestFormData({
      lotNumber: lotNumber,
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

  const handleOpenResultsDialog = async (test: QCTest) => {
    setSelectedTest(test);
    setAutoDecision(null);
    
    // Load existing results from Supabase if available
    if (test.results) {
      const existingResults = test.results as any;
      setTestResults({
        meshSize: {
          value: existingResults.meshSize?.value || '',
          passed: existingResults.meshSize?.passed || false,
          required: existingResults.meshSize?.required || ''
        },
        purity: {
          value: existingResults.purity?.value || 0,
          passed: existingResults.purity?.passed || false,
          minRequired: existingResults.purity?.minRequired || 95
        },
        roundness: {
          value: existingResults.roundness?.value || 0,
          passed: existingResults.roundness?.passed || false,
          minRequired: existingResults.roundness?.minRequired || 0.8
        },
        moisture: {
          value: existingResults.moisture?.value || 0,
          passed: existingResults.moisture?.passed || false,
          maxRequired: existingResults.moisture?.maxRequired || 1.0
        },
      });
    } else {
      // If no existing results, fetch product specs from Supabase
      const product = products.find(p => p.id === test.productId);
      const meshSize = product?.meshSize || '';
      
      // Fetch quality specs from product or use defaults
      // For now, using standard defaults, but these could come from a product_specs table
      const { data: productData } = await supabase
        .from('products')
        .select('*')
        .eq('id', test.productId)
        .single();
      
      const requiredMeshSize = productData?.mesh_size || meshSize || '';
      
      setTestResults({
        meshSize: { value: requiredMeshSize, passed: false, required: requiredMeshSize },
        purity: { value: 0, passed: false, minRequired: 95 },
        roundness: { value: 0, passed: false, minRequired: 0.8 },
        moisture: { value: 0, passed: false, maxRequired: 1.0 },
      });
    }
    
    setOpenResultsDialog(true);
  };

  /**
   * Apply auto-generated results for Pass / Fail flows.
   * This keeps the on-screen summary simple while allowing the certificate
   * generator to use richer data stored in Supabase.
   */
  const applyAutoResults = (mode: 'pass' | 'fail') => {
    setAutoDecision(mode);

    if (mode === 'pass') {
      setTestResults(prev => ({
        meshSize: {
          value: prev.meshSize.required || prev.meshSize.value || '30/50',
          passed: true,
          required: prev.meshSize.required || '30/50',
        },
        purity: {
          value: Math.max(prev.purity.minRequired, 97),
          passed: true,
          minRequired: prev.purity.minRequired || 95,
        },
        roundness: {
          value: Math.max(prev.roundness.minRequired, 0.8),
          passed: true,
          minRequired: prev.roundness.minRequired || 0.8,
        },
        moisture: {
          value: Math.min(prev.moisture.maxRequired, 0.3),
          passed: true,
          maxRequired: prev.moisture.maxRequired || 0.5,
        },
      }));
    } else {
      // Fail mode: keep values realistic but set at least one parameter to fail
      setTestResults(prev => ({
        meshSize: {
          value: prev.meshSize.required || prev.meshSize.value || '30/50',
          passed: true,
          required: prev.meshSize.required || '30/50',
        },
        purity: {
          value: Math.max(prev.purity.minRequired, 96),
          passed: true,
          minRequired: prev.purity.minRequired || 95,
        },
        roundness: {
          value: Math.max(prev.roundness.minRequired, 0.8),
          passed: true,
          minRequired: prev.roundness.minRequired || 0.8,
        },
        moisture: {
          value: Math.max(prev.moisture.maxRequired + 0.5, 1.5),
          passed: false,
          maxRequired: prev.moisture.maxRequired || 1.0,
        },
      }));
    }
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
        // When isValueField is false, value is always a boolean
        updated[field].passed = typeof value === 'boolean' ? value : false;
      }
      
      return updated;
    });
  };

  const allTestsPassed = () => {
    return Object.values(testResults).every(result => result.passed);
  };

  const handleDownloadCertificate = async (test: QCTest) => {
    if (!test.certificateId) {
      alert('No certificate available. Please approve the test first.');
      return;
    }

    try {
      await generateQCCertificatePDF(test.id);
    } catch (error: any) {
      console.error('Error generating certificate:', error);
      alert(error.message || 'Failed to generate certificate. Please try again.');
    }
  };

  const handleSaveResults = async () => {
    if (!selectedTest) return;

    // If user explicitly chose FAIL, immediately reject the lot
    if (autoDecision === 'fail') {
      await handleRejectTest(selectedTest.id);
      return;
    }

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

      // Base simple results (kept for backwards compatibility)
      const results: QCTest['results'] = {
        meshSize: {
          passed: testResults.meshSize.passed,
          value: testResults.meshSize.value,
          required: testResults.meshSize.required || testResults.meshSize.value,
        },
        purity: {
          passed: testResults.purity.passed,
          value: testResults.purity.value,
          minRequired: testResults.purity.minRequired,
        },
        roundness: {
          passed: testResults.roundness.passed,
          value: testResults.roundness.value,
          minRequired: testResults.roundness.minRequired,
        },
        moisture: {
          passed: testResults.moisture.passed,
          value: testResults.moisture.value,
          maxRequired: testResults.moisture.maxRequired,
        },
      };

      // Enrich with comprehensive results for certificate of analysis
      results.sieveAnalysis = {
        mesh20: { retained: 0.2, spec: '<2.0%', passed: true },
        mesh30: { retained: 5.8, spec: '3.0–10.0%', passed: true },
        mesh40: { retained: 82.5, spec: '>75.0%', passed: true },
        mesh50: { retained: 10.2, spec: '5.0–15.0%', passed: true },
        mesh70: { retained: 1.0, spec: '<3.0%', passed: true },
        mesh100: { retained: 0.3, spec: '<1.0%', passed: true },
        pan: { retained: 0.1, spec: '<0.5%', passed: true },
      };

      results.bulkDensity = {
        value: 1.58,
        spec: '1.50–1.70 g/cm³',
        passed: true,
      };

      results.crushResistance = {
        pressurePsi: 6000,
        finesPercent: 7.2,
        spec: '<10.0% fines @ 6,000 psi',
        passed: true,
      };

      results.acidSolubility = {
        hclPercent: 1.2,
        hfPercent: 0.8,
        totalPercent: 2.0,
        spec: '<3.0% total; HCl <2.0%, HF <3.0%',
        passed: true,
      };

      results.turbidity = {
        ntu: 35,
        spec: '<50 NTU',
        passed: true,
      };

      results.moistureDetailed = {
        percent: 0.3,
        spec: '<0.5%',
        passed: true,
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
        await ordersApi.updateStatus(selectedTest.orderId, 'ready');
      }

      setOpenResultsDialog(false);
      setSelectedTest(null);
      loadData();
      
      const download = window.confirm(
        `✓ Test APPROVED!\n\nCertificate: ${certNumber}\n\n${selectedTest.orderId ? 'Order marked as ready for dispatch.' : 'Standalone test completed.'}\n\nWould you like to download the certificate now?`
      );
      
      if (download) {
        await handleDownloadCertificate(selectedTest);
      }
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
      <PageHeader
        title={t('modules.quality.title')}
        subtitle={
          <>
            <Badge badgeContent={pendingTests.length} color="warning" sx={{ mr: 2 }}>
              <ScienceIcon />
            </Badge>
            {pendingTests.length} pending tests • {certificates.length} certificates issued
          </>
        }
        action={
          <>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
            >
              {t('common.refresh')}
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => handleOpenTestForm()}
            >
              Create QC Test
            </Button>
          </>
        }
      />

      {error && (
        <Alert className="animate-slide-in-up" severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
                label={`${orders.filter(o => o.status === 'qc' || o.status === 'in_production').length} orders`} 
                color="warning"
                size="small"
              />
            </Box>
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
                      .filter(o => o.status === 'qc' || o.status === 'in_production' || o.status === 'ready')
                      .map((order) => {
                        const orderTest = tests.find(t => t.orderId === order.id);
                        const hasCertificate = orderTest?.status === 'passed' && orderTest?.certificateId;
                        const needsQC = order.status === 'qc';
                        
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
                              <StatusChip status={order.status} />
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
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Button
                                    size="small"
                                    startIcon={<CertificateIcon />}
                                    onClick={() => handleViewTest(orderTest)}
                                  >
                                    View
                                  </Button>
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    startIcon={<DownloadIcon />}
                                    onClick={() => handleDownloadCertificate(orderTest)}
                                  >
                                    Download
                                  </Button>
                                </Box>
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
                          <StatusChip status={test.status} />
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
                      <Button 
                        size="small" 
                        startIcon={<DownloadIcon />}
                        onClick={() => {
                          const test = tests.find(t => t.certificateId === cert.certificateNumber);
                          if (test) handleDownloadCertificate(test);
                        }}
                      >
                        Download PDF
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
      <Dialog className="animate-fade-in" open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
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
                <StatusChip status={selectedTest.status} />
              </Grid>
              {selectedTest.orderNumber && (
                <Grid item xs={12}>
                  <Alert className="animate-slide-in-up" severity="info" icon={<LinkIcon />}>
                    <Typography variant="body2">
                      <strong>Linked to Order:</strong> {selectedTest.orderNumber}
                    </Typography>
                  </Alert>
                </Grid>
              )}
              {selectedTest.certificateId && (
                <Grid item xs={12}>
                  <Alert className="animate-slide-in-up" severity="success" icon={<CertificateIcon />}>
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
          {selectedTest?.status === 'passed' && selectedTest?.certificateId && (
            <Button 
              startIcon={<DownloadIcon />}
              onClick={() => handleDownloadCertificate(selectedTest)}
              variant="outlined"
            >
              Download Certificate
            </Button>
          )}
          <Button onClick={handleCloseDialog}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Create Test Dialog */}
      <Dialog className="animate-fade-in" open={openTestForm} onClose={() => setOpenTestForm(false)} maxWidth="sm" fullWidth>
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
                placeholder={testFormData.lotNumber || "Auto-generated lot number"}
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
                <Alert className="animate-slide-in-up" severity="info" icon={<InfoIcon />}>
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
      <Dialog className="animate-fade-in" open={openResultsDialog} onClose={() => setOpenResultsDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Enter Test Results - {selectedTest?.lotNumber}</span>
            <IconButton onClick={() => setOpenResultsDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent sx={{ maxHeight: '80vh', overflowY: 'auto' }}>
          <Alert className="animate-slide-in-up" severity="info" sx={{ mb: 3, mt: 2 }}>
            <AlertTitle>Quality Standards</AlertTitle>
            <Typography variant="body2" sx={{ mb: 1 }}>
              Choose one of the quick actions below for this prototype:
            </Typography>
            <Typography variant="body2">
              <strong>Pass Test</strong> will auto-fill all parameters with passing values and generate a full certificate.
              <br />
              <strong>Fail Test</strong> will mark the lot as rejected.
            </Typography>
          </Alert>

          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
            <Button
              variant={autoDecision === 'pass' ? 'contained' : 'outlined'}
              color="success"
              size="large"
              startIcon={<CheckCircleIcon />}
              onClick={() => applyAutoResults('pass')}
            >
              Pass Test
            </Button>
            <Button
              variant={autoDecision === 'fail' ? 'contained' : 'outlined'}
              color="error"
              size="large"
              startIcon={<CancelIcon />}
              onClick={() => applyAutoResults('fail')}
            >
              Fail Test
            </Button>
          </Box>

          <Grid container spacing={3}>
            {/* Summary */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: allTestsPassed() ? 'success.light' : 'warning.light' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Overall Result (Preview):
                  </Typography>
                  <Chip 
                    label={allTestsPassed() ? "ALL TESTS PASSED ✓" : "SOME TESTS FAILED"} 
                    color={allTestsPassed() ? "success" : "warning"}
                    icon={allTestsPassed() ? <CheckCircleIcon /> : <WarningIcon />}
                  />
                </Box>
              </Paper>
            </Grid>

            {/* Comprehensive Test Results */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Comprehensive Test Report
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            {/* 1. Sieve Analysis */}
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    1. Sieve Analysis (ISO 13503-2)
                  </Typography>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Mesh Size</TableCell>
                          <TableCell align="right">% Retained</TableCell>
                          <TableCell>Specification</TableCell>
                          <TableCell align="center">Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          { label: '20 mesh', key: 'mesh20', retained: 0.2, spec: '<2.0%', passed: true },
                          { label: '30 mesh', key: 'mesh30', retained: 5.8, spec: '3.0–10.0%', passed: true },
                          { label: '40 mesh', key: 'mesh40', retained: 82.5, spec: '>75.0%', passed: true },
                          { label: '50 mesh', key: 'mesh50', retained: 10.2, spec: '5.0–15.0%', passed: true },
                          { label: '70 mesh', key: 'mesh70', retained: 1.0, spec: '<3.0%', passed: true },
                          { label: '100 mesh', key: 'mesh100', retained: 0.3, spec: '<1.0%', passed: true },
                          { label: 'Pan', key: 'pan', retained: 0.1, spec: '<0.5%', passed: true },
                        ].map((row) => (
                          <TableRow key={row.key}>
                            <TableCell>{row.label}</TableCell>
                            <TableCell align="right">{row.retained.toFixed(1)}%</TableCell>
                            <TableCell>{row.spec}</TableCell>
                            <TableCell align="center">
                              {row.passed ? (
                                <CheckCircleIcon color="success" fontSize="small" />
                              ) : (
                                <CancelIcon color="error" fontSize="small" />
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            </Grid>

            {/* 2. Roundness & Sphericity */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    2. Roundness & Sphericity (Krumbein Method)
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Roundness</TableCell>
                        <TableCell>{testResults.roundness.value.toFixed(1)}</TableCell>
                        <TableCell>≥{testResults.roundness.minRequired.toFixed(1)}</TableCell>
                        <TableCell align="center">
                          {testResults.roundness.passed ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <CancelIcon color="error" fontSize="small" />
                          )}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Sphericity</TableCell>
                        <TableCell>0.8</TableCell>
                        <TableCell>≥0.6</TableCell>
                        <TableCell align="center">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            {/* 3. Bulk Density */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    3. Bulk Density (API RP 19C)
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Apparent Density</TableCell>
                        <TableCell>1.58 g/cm³</TableCell>
                        <TableCell>1.50–1.70 g/cm³</TableCell>
                        <TableCell align="center">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            {/* 4. Crush Resistance */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    4. Crush Resistance (API RP 56)
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Test Pressure</TableCell>
                        <TableCell>6,000 psi</TableCell>
                        <TableCell>-</TableCell>
                        <TableCell align="center">-</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Fines Generated</TableCell>
                        <TableCell>7.2%</TableCell>
                        <TableCell>&lt;10.0%</TableCell>
                        <TableCell align="center">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            {/* 5. Acid Solubility */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    5. Acid Solubility (HCl/HF)
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>HCl Solubility</TableCell>
                        <TableCell>1.2%</TableCell>
                        <TableCell>&lt;2.0%</TableCell>
                        <TableCell align="center">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>HF Solubility</TableCell>
                        <TableCell>0.8%</TableCell>
                        <TableCell>&lt;3.0%</TableCell>
                        <TableCell align="center">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>Total</TableCell>
                        <TableCell>2.0%</TableCell>
                        <TableCell>&lt;3.0%</TableCell>
                        <TableCell align="center">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            {/* 6. Turbidity */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    6. Turbidity
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Turbidity (NTU)</TableCell>
                        <TableCell>35</TableCell>
                        <TableCell>&lt;50</TableCell>
                        <TableCell align="center">
                          <CheckCircleIcon color="success" fontSize="small" />
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            {/* 7. Moisture Content */}
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    7. Moisture Content
                  </Typography>
                  <Table size="small">
                    <TableBody>
                      <TableRow>
                        <TableCell>Moisture</TableCell>
                        <TableCell>{testResults.moisture.value.toFixed(1)}%</TableCell>
                        <TableCell>&lt;0.5%</TableCell>
                        <TableCell align="center">
                          {testResults.moisture.passed ? (
                            <CheckCircleIcon color="success" fontSize="small" />
                          ) : (
                            <CancelIcon color="error" fontSize="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </Grid>

            {/* Info Alert */}
            <Grid item xs={12}>
              <Alert className="animate-slide-in-up" severity="info">
                <AlertTitle>What happens next?</AlertTitle>
                <Typography variant="body2">
                  When you click <strong>Approve &amp; Generate Certificate</strong>, the system will:
                </Typography>
                <Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
                  <li>
                    <Typography variant="body2">Store a full detailed test report in the database.</Typography>
                  </li>
                  <li>
                    <Typography variant="body2">Generate a comprehensive Certificate of Analysis PDF.</Typography>
                  </li>
                  {selectedTest?.orderId && (
                    <li>
                      <Typography variant="body2">Mark the linked order as ready for dispatch.</Typography>
                    </li>
                  )}
                </Box>
              </Alert>
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