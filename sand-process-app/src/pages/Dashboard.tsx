import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useApp } from '../context/AppContext';
import {
  Grid,
  Paper,
  Typography,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Link,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as ShippingIcon,
  Receipt as ReceiptIcon,
  Science as ScienceIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { ordersApi, deliveriesApi, invoicesApi, qcTestsApi } from '../services/api';
import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const { currentRole } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalDeliveries: 0,
    totalInvoices: 0,
    totalQCTests: 0,
    pendingOrders: 0,
    inTransitDeliveries: 0,
    pendingInvoices: 0,
    pendingQCTests: 0,
    totalOutstanding: 0,
    averageDSO: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [recentDeliveries, setRecentDeliveries] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [orders, deliveries, invoices, qcTests] = await Promise.all([
        ordersApi.getAll(),
        deliveriesApi.getAll(),
        invoicesApi.getAll(),
        qcTestsApi.getAll(),
      ]);

      const pendingOrders = orders.filter(o => o.status === 'pending' || o.status === 'confirmed').length;
      const inTransitDeliveries = deliveries.filter(d => d.status === 'in_transit').length;
      const pendingInvoices = invoices.filter(i => i.paymentStatus === 'pending').length;
      const pendingQCTests = qcTests.filter(q => q.status === 'pending' || q.status === 'in_progress').length;
      
      const totalOutstanding = invoices
        .filter(i => i.paymentStatus !== 'paid')
        .reduce((sum, i) => sum + i.total, 0);
      
      const averageDSO = invoices.length > 0
        ? invoices.reduce((sum, i) => sum + i.daysOutstanding, 0) / invoices.length
        : 0;

      setStats({
        totalOrders: orders.length,
        totalDeliveries: deliveries.length,
        totalInvoices: invoices.length,
        totalQCTests: qcTests.length,
        pendingOrders,
        inTransitDeliveries,
        pendingInvoices,
        pendingQCTests,
        totalOutstanding,
        averageDSO: Math.round(averageDSO),
      });

      // Get recent orders (last 5)
      setRecentOrders(orders.slice(0, 5));
      setRecentDeliveries(deliveries.slice(0, 5));
    } catch (err: any) {
      console.error('Error loading dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: t('common.orders'),
      value: stats.totalOrders,
      subtitle: `${stats.pendingOrders} pending`,
      icon: <ShoppingCartIcon />,
      color: '#1976d2',
      link: '/orders',
    },
    {
      title: t('common.logistics'),
      value: stats.totalDeliveries,
      subtitle: `${stats.inTransitDeliveries} in transit`,
      icon: <ShippingIcon />,
      color: '#2e7d32',
      link: '/logistics',
    },
    {
      title: t('common.billing'),
      value: stats.totalInvoices,
      subtitle: `$${stats.totalOutstanding.toLocaleString()} outstanding`,
      icon: <ReceiptIcon />,
      color: '#ed6c02',
      link: '/billing',
    },
    {
      title: t('common.quality'),
      value: stats.totalQCTests,
      subtitle: `${stats.pendingQCTests} pending`,
      icon: <ScienceIcon />,
      color: '#9c27b0',
      link: '/quality',
    },
  ];

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
        {t('common.dashboard')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {statCards.map((stat, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card 
              sx={{ cursor: 'pointer', '&:hover': { boxShadow: 4 } }}
              onClick={() => navigate(stat.link)}
            >
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography color="textSecondary" gutterBottom>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4">
                      {stat.value}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 0.5 }}>
                      {stat.subtitle}
                    </Typography>
                  </Box>
                  <Box sx={{ color: stat.color, fontSize: 40 }}>
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Financial Overview
              </Typography>
              <TrendingUpIcon color="primary" />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Total Outstanding:</Typography>
                <Typography variant="h6" color="error">
                  ${stats.totalOutstanding.toLocaleString()}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography>Average DSO:</Typography>
                <Typography variant="h6">
                  {stats.averageDSO} days
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography>Pending Invoices:</Typography>
                <Typography variant="h6" color="warning.main">
                  {stats.pendingInvoices}
                </Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Quick Stats
              </Typography>
              <WarningIcon color="action" />
            </Box>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Pending Orders:</Typography>
                <Typography fontWeight="bold">{stats.pendingOrders}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>In Transit Deliveries:</Typography>
                <Typography fontWeight="bold">{stats.inTransitDeliveries}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography>Pending QC Tests:</Typography>
                <Typography fontWeight="bold">{stats.pendingQCTests}</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Orders
            </Typography>
            {recentOrders.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                No recent orders
              </Typography>
            ) : (
              <List>
                {recentOrders.map((order, idx) => (
                  <React.Fragment key={order.id}>
                    <ListItem 
                      button
                      onClick={() => navigate('/orders')}
                    >
                      <ListItemText
                        primary={order.orderNumber}
                        secondary={`${order.customerName} - ${new Date(order.deliveryDate).toLocaleDateString()}`}
                      />
                    </ListItem>
                    {idx < recentOrders.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Active Deliveries
            </Typography>
            {recentDeliveries.length === 0 ? (
              <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
                No active deliveries
              </Typography>
            ) : (
              <List>
                {recentDeliveries.map((delivery, idx) => (
                  <React.Fragment key={delivery.id}>
                    <ListItem 
                      button
                      onClick={() => navigate('/logistics')}
                    >
                      <ListItemText
                        primary={delivery.orderNumber}
                        secondary={`${delivery.truckLicensePlate} - ${delivery.status}`}
                      />
                    </ListItem>
                    {idx < recentDeliveries.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;

