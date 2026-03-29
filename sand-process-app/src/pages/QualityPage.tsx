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
import { generateQCCertificatePDF } from '../utils/generateQCCertificatePDF';
import { getOrderStatusLabel } from '../utils/orderStatusLabel';

/** Issuer block on QC certificate PDF */
const QC_CERTIFICATE_COMPANY = {
  name: 'Sand Process Management',
  address: 'Vaca Muerta, Neuquén, Argentina',
  phone: '+54 9 299 000-0000',
  email: 'quality@sandprocess.com',
};

interface TestResults {
  meshSize: { value: string; passed: boolean; required: string };
  purity: { value: number; passed: boolean; minRequired: number };
  roundness: { value: number; passed: boolean; minRequired: number };
  moisture: { value: number; passed: boolean; maxRequired: number };
}

const QualityPage: React.FC = () => {
  const { t } = useTranslation();
  const qcStatusLabel = (status: string) => t(`testStatus.${status}`);
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

  /** Includes `pending` / `confirmed` so newly created orders (delivery or pickup) appear before production moves them. */
  const isOrderVisibleForQc = (o: Order) =>
    ['pending', 'confirmed', 'in_production', 'qc', 'ready', 'dispatched'].includes(o.status);

  const fulfillmentLabel = (o: Order) =>
    o.fulfillmentType === 'pickup'
      ? t('modules.orders.fulfillmentShortPickup')
      : t('modules.orders.fulfillmentShortDelivery');

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
      setError(err.message || t('modules.quality.failedToLoadQc'));
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
      alert(t('modules.quality.fillRequiredFields'));
      return;
    }

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    const productId = testFormData.productId.trim();
    if (!productId || !uuidRegex.test(productId)) {
      alert(t('modules.quality.invalidProductSelected'));
      return;
    }

    let orderId: string | null = null;
    if (testFormData.orderId && testFormData.orderId.trim() !== '') {
      const trimmedOrderId = testFormData.orderId.trim();
      if (!uuidRegex.test(trimmedOrderId)) {
        alert(t('modules.quality.invalidOrderSelected'));
        return;
      }
      orderId = trimmedOrderId;
    }

    let technicianId: string | null = null;
    if (currentUser?.id && uuidRegex.test(currentUser.id)) {
      technicianId = currentUser.id;
    }

    try {
      const { error } = await supabase
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
      
      alert(`✓ ${t('modules.quality.testCreatedSuccess')}\nLot: ${testFormData.lotNumber}`);
    } catch (err: any) {
      console.error('Error creating QC test:', err);
      alert(t('modules.quality.errorCreatingTest') + ': ' + err.message);
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
      alert(t('errors.errorPrefix') + err.message);
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
        t('modules.quality.rejectLotConfirm')
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
      
      const siteKey =
        selectedTest.siteId === 'near_well' ? 'modules.quality.siteNearWell' : 'modules.quality.siteQuarry';
      const produceToInvMsg =
        !selectedTest.orderId && (selectedTest.quantity ?? 0) > 0
          ? '\n\n' +
            t('modules.quality.inventoryIncreasedAt', {
              qty: selectedTest.quantity,
              site: t(siteKey),
            })
          : '';
      const body = selectedTest.orderId
        ? t('modules.quality.testApprovedWithOrderBody')
        : t('modules.quality.testApprovedStandaloneBody') + produceToInvMsg;
      alert(
        `${t('modules.quality.testApprovedTitle')}\n\n${t('modules.quality.testApprovedCertLine', { cert: certNumber })}\n\n${body}`
      );
    } catch (err: any) {
      console.error('Error approving test:', err);
      alert(t('errors.errorPrefix') + err.message);
    }
  };

  const handleDownloadCertificate = (certificateId: string) => {
    const test = tests.find((t) => t.certificateId === certificateId);
    if (!test?.certificateId) {
      alert(t('modules.quality.errorCertificateNotFound'));
      return;
    }
    if (!test.results) {
      alert(t('modules.quality.errorCertificateNoResults'));
      return;
    }
    try {
      generateQCCertificatePDF({
        test,
        companyInfo: QC_CERTIFICATE_COMPANY,
      });
    } catch (err: unknown) {
      console.error('Certificate PDF error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      alert(t('modules.quality.errorCertificatePdf') + (msg ? `: ${msg}` : ''));
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
      
      alert('✗ ' + t('modules.quality.testRejectedMessage'));
    } catch (err: any) {
      console.error('Error rejecting test:', err);
      alert(t('errors.errorPrefix') + err.message);
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
            {pendingTests.length} {t('modules.quality.pendingTestsCount')} • {certificates.length} {t('modules.quality.certificatesIssued')}
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
            {t('modules.quality.createQCTest')}
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
                {t('modules.quality.ordersRequiringQcTitle')}
              </Typography>
              <Chip 
                label={t('modules.quality.ordersCountChip', {
                  count: orders.filter(isOrderVisibleForQc).length,
                })}
                color="warning"
                size="small"
              />
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              {t('modules.quality.ordersRequiringQcHint')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{t('modules.quality.orderNumber')}</TableCell>
                    <TableCell>{t('modules.quality.customer')}</TableCell>
                    <TableCell>{t('modules.quality.product')}</TableCell>
                    <TableCell>{t('modules.orders.fulfillmentType')}</TableCell>
                    <TableCell>{t('modules.quality.orderStatus')}</TableCell>
                    <TableCell>{t('modules.quality.qcTestStatus')}</TableCell>
                    <TableCell align="right">{t('common.actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.filter(isOrderVisibleForQc).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                        <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 1 }} />
                        <Typography variant="body1" color="textSecondary">
                          {t('modules.quality.allOrdersQcOkMessage')}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    orders
                      .filter(isOrderVisibleForQc)
                      .map((order) => {
                        const orderTest = tests.find(t => t.orderId === order.id);
                        const hasCertificate = orderTest?.status === 'passed' && orderTest?.certificateId;
                        const needsQC =
                          order.status === 'qc' ||
                          (order.status === 'ready' && !hasCertificate) ||
                          ((order.status === 'pending' || order.status === 'confirmed') && !hasCertificate);
                        
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
                                size="small"
                                variant="outlined"
                                label={fulfillmentLabel(order)}
                                color={order.fulfillmentType === 'pickup' ? 'warning' : 'default'}
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={getOrderStatusLabel(order, t)}
                                size="small"
                                color={
                                  order.status === 'qc' ? 'warning' : 
                                  order.status === 'in_production' ? 'info' :
                                  order.status === 'ready' ? 'success' :
                                  order.status === 'pending' ? 'default' :
                                  order.status === 'confirmed' ? 'info' :
                                  order.status === 'dispatched' ? 'primary' :
                                  'default'
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
                                  label={qcStatusLabel(orderTest.status)} 
                                  size="small" 
                                  color={getStatusColor(orderTest.status) as any}
                                  icon={getStatusIcon(orderTest.status)}
                                />
                              ) : needsQC ? (
                                <Chip 
                                  label={t('modules.quality.qcRequiredChip')} 
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
                                  {needsQC ? t('modules.quality.createTestUrgent') : t('modules.quality.createTest')}
                                </Button>
                              ) : orderTest.status === 'pending' ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="primary"
                                  startIcon={<StartIcon />}
                                  onClick={() => handleRunTest(orderTest.id)}
                                >
                                  {t('modules.quality.runTestButton')}
                                </Button>
                              ) : orderTest.status === 'in_progress' ? (
                                <Button
                                  size="small"
                                  variant="contained"
                                  color="success"
                                  startIcon={<ScienceIcon />}
                                  onClick={() => handleOpenResultsDialog(orderTest)}
                                >
                                  {t('modules.quality.enterResults')}
                                </Button>
                              ) : hasCertificate ? (
                                <Button
                                  size="small"
                                  startIcon={<CertificateIcon />}
                                  onClick={() => handleViewTest(orderTest)}
                                >
                                  {t('modules.quality.viewCertificate')}
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
                  {t('modules.quality.noTestsYetTitle')}
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                  {t('modules.quality.noTestsYetBody')}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={() => handleOpenTestForm()}
                >
                  {t('modules.quality.createFirstQcTest')}
                </Button>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>{t('modules.quality.testQueueColLot')}</TableCell>
                      <TableCell>{t('modules.quality.product')}</TableCell>
                      <TableCell>{t('modules.quality.testQueueColOrder')}</TableCell>
                      <TableCell>{t('modules.orders.fulfillmentType')}</TableCell>
                      <TableCell>{t('modules.quality.status')}</TableCell>
                      <TableCell>{t('modules.quality.testQueueColActions')}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {tests.map((test) => {
                      const linkedOrder = test.orderId ? orders.find((o) => o.id === test.orderId) : undefined;
                      return (
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
                                <Tooltip title={t('modules.quality.certificateGenerated')}>
                                  <CheckCircleIcon color="success" fontSize="small" />
                                </Tooltip>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" color="textSecondary">{t('modules.quality.standaloneLabel')}</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          {linkedOrder ? (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={fulfillmentLabel(linkedOrder)}
                              color={linkedOrder.fulfillmentType === 'pickup' ? 'warning' : 'default'}
                            />
                          ) : (
                            <Typography variant="body2" color="textSecondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={qcStatusLabel(test.status)}
                            color={getStatusColor(test.status) as any}
                            size="small"
                            icon={getStatusIcon(test.status)}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Button size="small" onClick={() => handleViewTest(test)}>
                              {t('modules.quality.view')}
                            </Button>
                            {test.status === 'pending' && (
                              <Button 
                                size="small"
                                variant="outlined"
                                color="primary"
                                onClick={() => handleRunTest(test.id)}
                              >
                                {t('modules.quality.runTestButton')}
                              </Button>
                            )}
                            {test.status === 'in_progress' && (
                              <Button 
                                size="small" 
                                variant="contained"
                                color="success"
                                onClick={() => handleOpenResultsDialog(test)}
                              >
                                {t('modules.quality.enterResults')}
                              </Button>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                    })}
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
              {t('modules.quality.certificatesIssuedSection')}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            {certificates.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <CertificateIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  {t('modules.quality.noCertificatesYet')}
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
                        {t('modules.quality.lotPrefix', { lot: cert.lotNumber })}
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
                        startIcon={<CertificateIcon />}
                        onClick={() => handleDownloadCertificate(cert.id)}
                      >
                        {t('modules.quality.downloadCertificate')}
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
            <span>{t('modules.quality.qcTestDialogTitle', { lot: selectedTest?.lotNumber ?? '' })}</span>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedTest && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary" gutterBottom>{t('modules.quality.product')}</Typography>
                <Typography variant="body1" gutterBottom>{selectedTest.productName}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary" gutterBottom>{t('modules.quality.status')}</Typography>
                <Chip
                  label={qcStatusLabel(selectedTest.status)}
                  color={getStatusColor(selectedTest.status) as any}
                  icon={getStatusIcon(selectedTest.status)}
                />
              </Grid>
              {selectedTest.orderNumber && (
                <Grid item xs={12}>
                  <Alert severity="info" icon={<LinkIcon />}>
                    <Typography variant="body2">
                      <strong>{t('modules.quality.linkedToOrderLabel')}</strong> {selectedTest.orderNumber}
                    </Typography>
                  </Alert>
                </Grid>
              )}
              {selectedTest.certificateId && (
                <Grid item xs={12}>
                  <Alert severity="success" icon={<CertificateIcon />}>
                    <AlertTitle>{t('modules.quality.certificateIssuedAlert')}</AlertTitle>
                    <Typography variant="body2">
                      <strong>{t('modules.quality.certificateNumberLabel')}</strong> {selectedTest.certificateId}
                    </Typography>
                  </Alert>
                </Grid>
              )}
              {selectedTest.results && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>{t('modules.quality.testResultsHeading')}</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>{t('modules.quality.tableParameter')}</TableCell>
                          <TableCell>{t('modules.quality.tableValue')}</TableCell>
                          <TableCell>{t('modules.quality.tableResult')}</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>{t('modules.quality.paramMeshSize')}</TableCell>
                          <TableCell>{selectedTest.results.meshSize.value}</TableCell>
                          <TableCell>
                            {selectedTest.results.meshSize.passed ? 
                              <CheckCircleIcon color="success" fontSize="small" /> : 
                              <CancelIcon color="error" fontSize="small" />
                            }
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>{t('modules.quality.paramPurityShort')}</TableCell>
                          <TableCell>{selectedTest.results.purity.value}%</TableCell>
                          <TableCell>
                            {selectedTest.results.purity.passed ? 
                              <CheckCircleIcon color="success" fontSize="small" /> : 
                              <CancelIcon color="error" fontSize="small" />
                            }
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>{t('modules.quality.paramRoundnessShort')}</TableCell>
                          <TableCell>{selectedTest.results.roundness.value}</TableCell>
                          <TableCell>
                            {selectedTest.results.roundness.passed ? 
                              <CheckCircleIcon color="success" fontSize="small" /> : 
                              <CancelIcon color="error" fontSize="small" />
                            }
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>{t('modules.quality.paramMoistureShort')}</TableCell>
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
          {selectedTest?.certificateId && selectedTest?.results && (
            <Button
              variant="contained"
              startIcon={<CertificateIcon />}
              onClick={() => handleDownloadCertificate(selectedTest.certificateId!)}
            >
              {t('modules.quality.downloadCertificate')}
            </Button>
          )}
          <Button onClick={handleCloseDialog}>{t('common.close')}</Button>
        </DialogActions>
      </Dialog>

      {/* Create Test Dialog */}
      <Dialog open={openTestForm} onClose={() => setOpenTestForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('modules.quality.createTestDialogTitle')}</span>
            <IconButton onClick={() => setOpenTestForm(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mt: 2, mb: 3 }}>
            <Step>
              <StepLabel>{t('modules.quality.stepTestDetails')}</StepLabel>
            </Step>
            <Step>
              <StepLabel>{t('modules.quality.stepLinkToOrder')}</StepLabel>
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
                helperText={t('modules.quality.autoGeneratedHint')}
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
                label={`${t('modules.quality.order')} ${t('modules.quality.orderOptional')}`}
                value={testFormData.orderId}
                onChange={(e) => setTestFormData({ ...testFormData, orderId: e.target.value })}
                helperText={testFormData.orderId ? t('modules.quality.helperCertLinkedOrder') : t('modules.quality.helperStandaloneNoOrder')}
              >
                <MenuItem value="">
                  <em>{t('modules.quality.noneStandaloneTest')}</em>
                </MenuItem>
                {orders
                  .filter(isOrderVisibleForQc)
                  .map((order) => {
                    const hasTest = tests.some(t => t.orderId === order.id && t.status === 'passed');
                    return (
                      <MenuItem key={order.id} value={order.id}>
                        {order.orderNumber} — {fulfillmentLabel(order)} — {order.customerName}{' '}
                        {hasTest ? '(Has Certificate)' : '(Needs Certificate)'}
                      </MenuItem>
                    );
                  })}
              </TextField>
            </Grid>
            {testFormData.orderId && (
              <Grid item xs={12}>
                <Alert severity="info" icon={<InfoIcon />}>
                  <AlertTitle>{t('modules.quality.orderLinkedAlertTitle')}</AlertTitle>
                  <Typography variant="body2">
                    {t('modules.quality.whenApprovedIntro')}
                  </Typography>
                  <Box component="ul" sx={{ m: 0, mt: 1, pl: 2 }}>
                    <li><Typography variant="body2">{t('modules.quality.bulletGenerateCert')}</Typography></li>
                    <li><Typography variant="body2">{t('modules.quality.bulletMarkReady')}</Typography></li>
                    <li><Typography variant="body2">{t('modules.quality.bulletAllowTruck')}</Typography></li>
                  </Box>
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenTestForm(false)}>{t('common.cancel')}</Button>
          <Button 
            onClick={handleCreateTest} 
            variant="contained"
            disabled={!testFormData.lotNumber || !testFormData.productId}
            size="large"
          >
            {t('modules.quality.createTest')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Results Entry Dialog */}
      <Dialog open={openResultsDialog} onClose={() => setOpenResultsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{t('modules.quality.enterResultsDialogTitle', { lot: selectedTest?.lotNumber ?? '' })}</span>
            <IconButton onClick={() => setOpenResultsDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3, mt: 2 }}>
            <AlertTitle>{t('modules.quality.qualityStandardsTitle')}</AlertTitle>
            <Typography variant="body2">
              {t('modules.quality.qualityStandardsBody')}
            </Typography>
          </Alert>

          <Grid container spacing={3}>
            {/* Mesh Size */}
            <Grid item xs={12} md={6}>
              <Card sx={{ bgcolor: testResults.meshSize.passed ? 'success.light' : 'grey.50' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight="bold">
                      {t('modules.quality.meshSizeTestTitle')}
                    </Typography>
                    {testResults.meshSize.passed ? 
                      <CheckCircleIcon color="success" /> : 
                      <WarningIcon color="warning" />
                    }
                  </Box>
                  <TextField
                    fullWidth
                    label={t('modules.quality.measuredMeshSize')}
                    value={testResults.meshSize.value}
                    onChange={(e) => handleResultChange('meshSize', e.target.value)}
                    placeholder={t('modules.quality.placeholderMeshExample')}
                    sx={{ mb: 2 }}
                    helperText={t('modules.quality.helperRequiredMesh', { value: testResults.meshSize.required })}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={testResults.meshSize.passed}
                        onChange={(e) => handleResultChange('meshSize', e.target.checked, false)}
                        color="success"
                      />
                    }
                    label={testResults.meshSize.passed ? t('modules.quality.passShort') : t('modules.quality.fail')}
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
                      {t('modules.quality.purityTestTitle')}
                    </Typography>
                    {testResults.purity.passed ? 
                      <CheckCircleIcon color="success" /> : 
                      <WarningIcon color="warning" />
                    }
                  </Box>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('modules.quality.purity')}
                    value={testResults.purity.value}
                    onChange={(e) => handleResultChange('purity', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, max: 100, step: 0.1 }}
                    sx={{ mb: 2 }}
                    helperText={t('modules.quality.helperMinPurity', { value: testResults.purity.minRequired })}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={testResults.purity.passed}
                        onChange={(e) => handleResultChange('purity', e.target.checked, false)}
                        color="success"
                      />
                    }
                    label={testResults.purity.passed ? t('modules.quality.passShort') : t('modules.quality.fail')}
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
                      {t('modules.quality.roundnessTestTitle')}
                    </Typography>
                    {testResults.roundness.passed ? 
                      <CheckCircleIcon color="success" /> : 
                      <WarningIcon color="warning" />
                    }
                  </Box>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('modules.quality.roundnessFactor')}
                    value={testResults.roundness.value}
                    onChange={(e) => handleResultChange('roundness', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, max: 1, step: 0.01 }}
                    sx={{ mb: 2 }}
                    helperText={t('modules.quality.helperMinRoundness', { value: testResults.roundness.minRequired })}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={testResults.roundness.passed}
                        onChange={(e) => handleResultChange('roundness', e.target.checked, false)}
                        color="success"
                      />
                    }
                    label={testResults.roundness.passed ? t('modules.quality.passShort') : t('modules.quality.fail')}
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
                      {t('modules.quality.moistureTestTitle')}
                    </Typography>
                    {testResults.moisture.passed ? 
                      <CheckCircleIcon color="success" /> : 
                      <WarningIcon color="warning" />
                    }
                  </Box>
                  <TextField
                    fullWidth
                    type="number"
                    label={t('modules.quality.moistureContent')}
                    value={testResults.moisture.value}
                    onChange={(e) => handleResultChange('moisture', parseFloat(e.target.value) || 0)}
                    inputProps={{ min: 0, max: 10, step: 0.1 }}
                    sx={{ mb: 2 }}
                    helperText={t('modules.quality.helperMaxMoisture', { value: testResults.moisture.maxRequired })}
                  />
                  <FormControlLabel
                    control={
                      <Checkbox 
                        checked={testResults.moisture.passed}
                        onChange={(e) => handleResultChange('moisture', e.target.checked, false)}
                        color="success"
                      />
                    }
                    label={testResults.moisture.passed ? t('modules.quality.passShort') : t('modules.quality.fail')}
                  />
                </CardContent>
              </Card>
            </Grid>

            {/* Summary */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: allTestsPassed() ? 'success.light' : 'warning.light' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    {t('modules.quality.overallResult')}
                  </Typography>
                  <Chip 
                    label={allTestsPassed() ? t('modules.quality.allTestsPassedChip') : t('modules.quality.someTestsFailedChip')} 
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
            {t('common.cancel')}
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
              {t('modules.quality.rejectLotButton')}
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
            {t('modules.quality.approveGenerateCertificate')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default QualityPage;