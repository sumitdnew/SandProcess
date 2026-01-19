import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
  Tabs,
  Tab,
  LinearProgress,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as RadioButtonUncheckedIcon,
  PlayArrow as PlayArrowIcon,
  Stop as StopIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import { ordersApi } from '../services/api';
import { Order, OrderStatus } from '../types';

interface ProductionStage {
  id: string;
  name: string;
  key: 'drying' | 'sieving' | 'classification' | 'qc';
  completed: boolean;
  inProgress: boolean;
  startTime?: string;
  endTime?: string;
  orderId: string;
}

const ProductionPage: React.FC = () => {
  const { t } = useTranslation();
  const [productionOrders, setProductionOrders] = useState<Order[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [openOrderDialog, setOpenOrderDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const orders = await ordersApi.getAll();
      setAllOrders(orders);
      
      // Filter orders for production view
      const production = orders.filter(o => 
        o.status === 'confirmed' || 
        o.status === 'in_production' || 
        o.status === 'qc' || 
        o.status === 'ready'
      );
      setProductionOrders(production);
    } catch (err: any) {
      console.error('Error loading production data:', err);
      setError(err.message || 'Failed to load production data');
    } finally {
      setLoading(false);
    }
  };

  const getProductionStages = (order: Order): ProductionStage[] => {
    return [
      {
        id: `${order.id}-drying`,
        name: 'Drying (Secado)',
        key: 'drying',
        completed: order.status !== 'pending' && order.status !== 'confirmed',
        inProgress: order.status === 'confirmed',
        orderId: order.id,
      },
      {
        id: `${order.id}-sieving`,
        name: 'Sieving (Tamizado)',
        key: 'sieving',
        completed: order.status === 'in_production' || order.status === 'qc' || order.status === 'ready',
        inProgress: order.status === 'in_production',
        orderId: order.id,
      },
      {
        id: `${order.id}-classification`,
        name: 'Classification (Clasificación)',
        key: 'classification',
        completed: order.status === 'qc' || order.status === 'ready',
        inProgress: false,
        orderId: order.id,
      },
      {
        id: `${order.id}-qc`,
        name: 'QC Testing',
        key: 'qc',
        completed: order.status === 'ready',
        inProgress: order.status === 'qc',
        orderId: order.id,
      },
    ];
  };

  const handleStartProduction = async (orderId: string) => {
    try {
      await ordersApi.updateStatus(orderId, 'in_production');
      loadData();
    } catch (err: any) {
      console.error('Error starting production:', err);
      alert('Error starting production: ' + err.message);
    }
  };

  const handleCompleteStage = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await ordersApi.updateStatus(orderId, nextStatus);
      loadData();
    } catch (err: any) {
      console.error('Error updating production stage:', err);
      alert('Error updating stage: ' + err.message);
    }
  };

  const handleViewOrder = (order: Order) => {
    setSelectedOrder(order);
    setOpenOrderDialog(true);
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
      <Typography variant="h4" gutterBottom>
        {t('common.production')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Confirmed Orders
              </Typography>
              <Typography variant="h3" color="info.main">
                {allOrders.filter(o => o.status === 'confirmed').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                In Production
              </Typography>
              <Typography variant="h3" color="warning.main">
                {allOrders.filter(o => o.status === 'in_production').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                QC Queue
              </Typography>
              <Typography variant="h3" color="error.main">
                {allOrders.filter(o => o.status === 'qc').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="h6" color="textSecondary" gutterBottom>
                Ready for Dispatch
              </Typography>
              <Typography variant="h3" color="success.main">
                {allOrders.filter(o => o.status === 'ready').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 3 }}>
        <Tab label={t('modules.production.productionSchedule')} />
        <Tab label={t('modules.production.inProduction')} />
        <Tab label={t('modules.production.qcQueue')} />
        <Tab label={t('modules.production.readyForDispatch')} />
      </Tabs>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {tabValue === 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Production Schedule
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2, mb: 3 }}>
                Overview of all orders in the production pipeline
              </Typography>
              {productionOrders.length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  No orders in production pipeline
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order Number</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Delivery Date</TableCell>
                        <TableCell>Products</TableCell>
                        <TableCell>Progress</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productionOrders.map((order) => {
                        const stages = getProductionStages(order);
                        const completedStages = stages.filter(s => s.completed).length;
                        const progress = (completedStages / stages.length) * 100;

                        return (
                          <TableRow key={order.id}>
                            <TableCell>
                              <Button size="small" onClick={() => handleViewOrder(order)}>
                                {order.orderNumber}
                              </Button>
                            </TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>{new Date(order.deliveryDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              {order.products.map((p, idx) => (
                                <Typography key={idx} variant="body2">
                                  {p.productName}: {p.quantity} tons
                                </Typography>
                              ))}
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <LinearProgress 
                                  variant="determinate" 
                                  value={progress} 
                                  sx={{ width: 100, height: 8, borderRadius: 1 }} 
                                />
                                <Typography variant="body2">{Math.round(progress)}%</Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip 
                                label={order.status} 
                                size="small" 
                                color={
                                  order.status === 'ready' ? 'success' :
                                  order.status === 'qc' ? 'warning' :
                                  order.status === 'in_production' ? 'info' : 'default'
                                }
                              />
                            </TableCell>
                            <TableCell>
                              {order.status === 'confirmed' && (
                                <Tooltip title={t('modules.production.startProduction')}>
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleStartProduction(order.id)}
                                  >
                                    <PlayArrowIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              {order.status === 'in_production' && (
                                <Tooltip title="Send to QC">
                                  <IconButton
                                    size="small"
                                    color="warning"
                                    onClick={() => handleCompleteStage(order.id, 'qc')}
                                  >
                                    <RefreshIcon />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Button size="small" onClick={() => handleViewOrder(order)}>
                                View Details
                              </Button>
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
        )}

        {tabValue === 1 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Orders In Production
              </Typography>
              {productionOrders.filter(o => o.status === 'in_production').length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  No orders currently in production
                </Typography>
              ) : (
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {productionOrders
                    .filter(o => o.status === 'in_production')
                    .map((order) => {
                      const stages = getProductionStages(order);
                      return (
                        <Grid item xs={12} md={6} key={order.id}>
                          <Card sx={{ p: 2 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 2 }}>
                              <Box>
                                <Typography variant="h6">{order.orderNumber}</Typography>
                                <Typography variant="body2" color="textSecondary">
                                  {order.customerName}
                                </Typography>
                              </Box>
                              <Chip label={order.status} size="small" color="info" />
                            </Box>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              Delivery: {new Date(order.deliveryDate).toLocaleDateString()}
                            </Typography>
                            <Box sx={{ mb: 2 }}>
                              {stages.map((stage) => (
                                <Box key={stage.id} sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                  {stage.completed ? (
                                    <CheckCircleIcon color="success" sx={{ fontSize: 20, mr: 1 }} />
                                  ) : stage.inProgress ? (
                                    <PlayArrowIcon color="info" sx={{ fontSize: 20, mr: 1 }} />
                                  ) : (
                                    <RadioButtonUncheckedIcon sx={{ fontSize: 20, mr: 1, color: 'text.disabled' }} />
                                  )}
                                  <Typography variant="body2">{stage.name}</Typography>
                                </Box>
                              ))}
                            </Box>
                            <Button
                              variant="contained"
                              color="warning"
                              fullWidth
                              onClick={() => handleCompleteStage(order.id, 'qc')}
                            >
                              {t('modules.production.completeProduction')}
                            </Button>
                          </Card>
                        </Grid>
                      );
                    })}
                </Grid>
              )}
            </Paper>
          </Grid>
        )}

        {tabValue === 2 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                QC Queue
              </Typography>
              {productionOrders.filter(o => o.status === 'qc').length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  No orders in QC queue
                </Typography>
              ) : (
                productionOrders
                  .filter(o => o.status === 'qc')
                  .map((order) => (
                    <Card key={order.id} sx={{ mt: 2, p: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                          <Typography><strong>{order.orderNumber}</strong> - {order.customerName}</Typography>
                          <Typography variant="body2" color="textSecondary">
                            Waiting for QC testing
                          </Typography>
                        </Box>
                        <Button variant="outlined" size="small" onClick={() => window.location.href = '/quality'}>
                          View QC Tests
                        </Button>
                      </Box>
                    </Card>
                  ))
              )}
            </Paper>
          </Grid>
        )}

        {tabValue === 3 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Ready for Dispatch
              </Typography>
              {productionOrders.filter(o => o.status === 'ready').length === 0 ? (
                <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                  No orders ready for dispatch
                </Typography>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Order Number</TableCell>
                        <TableCell>Customer</TableCell>
                        <TableCell>Products</TableCell>
                        <TableCell>Total Amount</TableCell>
                        <TableCell>Delivery Date</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {productionOrders
                        .filter(o => o.status === 'ready')
                        .map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>{order.orderNumber}</TableCell>
                            <TableCell>{order.customerName}</TableCell>
                            <TableCell>
                              {order.products.map((p, idx) => (
                                <Typography key={idx} variant="body2">
                                  {p.productName}: {p.quantity} tons
                                </Typography>
                              ))}
                            </TableCell>
                            <TableCell>${order.totalAmount.toLocaleString()}</TableCell>
                            <TableCell>{new Date(order.deliveryDate).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Button 
                                variant="contained" 
                                size="small" 
                                onClick={() => window.location.href = '/orders'}
                              >
                                Go to Dispatch
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Order Details Dialog */}
      <Dialog open={openOrderDialog} onClose={() => setOpenOrderDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Production Details: {selectedOrder?.orderNumber}
        </DialogTitle>
        <DialogContent>
          {selectedOrder && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography><strong>Customer:</strong> {selectedOrder.customerName}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Delivery Date:</strong> {new Date(selectedOrder.deliveryDate).toLocaleDateString()}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>Delivery Location:</strong> {selectedOrder.deliveryLocation}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2 }}>Production Stages:</Typography>
                <Box sx={{ mt: 2 }}>
                  {getProductionStages(selectedOrder).map((stage) => (
                    <Box key={stage.id} sx={{ display: 'flex', alignItems: 'center', mb: 2, p: 1, bgcolor: stage.completed ? 'success.light' : stage.inProgress ? 'info.light' : 'grey.100', borderRadius: 1 }}>
                      {stage.completed ? (
                        <CheckCircleIcon color="success" sx={{ fontSize: 24, mr: 2 }} />
                      ) : stage.inProgress ? (
                        <PlayArrowIcon color="info" sx={{ fontSize: 24, mr: 2 }} />
                      ) : (
                        <RadioButtonUncheckedIcon sx={{ fontSize: 24, mr: 2, color: 'text.disabled' }} />
                      )}
                      <Typography variant="body1" sx={{ flexGrow: 1 }}>{stage.name}</Typography>
                      {stage.inProgress && (
                        <Chip label={t('modules.production.inProgress')} size="small" color="info" />
                      )}
                      {stage.completed && (
                        <Chip label={t('modules.production.completed')} size="small" color="success" />
                      )}
                    </Box>
                  ))}
                </Box>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2 }}>Products:</Typography>
                {selectedOrder.products.map((p, idx) => (
                  <Typography key={idx} variant="body2">
                    - {p.productName}: {p.quantity} tons @ ${p.unitPrice}/ton
                  </Typography>
                ))}
              </Grid>
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ mt: 2 }}>Total Amount:</Typography>
                <Typography variant="h5" color="primary">
                  ${selectedOrder.totalAmount.toLocaleString()}
                </Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenOrderDialog(false)}>Close</Button>
          {selectedOrder?.status === 'confirmed' && (
            <Button
              variant="contained"
              color="primary"
              onClick={() => {
                handleStartProduction(selectedOrder.id);
                setOpenOrderDialog(false);
              }}
            >
              {t('modules.production.startProduction')}
            </Button>
          )}
          {selectedOrder?.status === 'in_production' && (
            <Button
              variant="contained"
              color="warning"
              onClick={() => {
                handleCompleteStage(selectedOrder.id, 'qc');
                setOpenOrderDialog(false);
              }}
            >
              Complete Production → Send to QC
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProductionPage;

