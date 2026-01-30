import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Paper,
  Chip,
  Button,
  IconButton,
  Divider,
  LinearProgress,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  ShoppingCart as OrderIcon,
  LocalShipping as TruckIcon,
  Science as QCIcon,
  Receipt as InvoiceIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  AttachMoney as MoneyIcon,
  Inventory as InventoryIcon,
  Speed as SpeedIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { ordersApi, deliveriesApi, qcTestsApi, invoicesApi, tasksApi } from '../services/api';
import { Order, Delivery, QCTest, Invoice, TaskItem } from '../types';
import { useApp } from '../context/AppContext';

// Color palette
const COLORS = {
  primary: '#1976d2',
  success: '#2e7d32',
  warning: '#ed6c02',
  error: '#d32f2f',
  info: '#0288d1',
  purple: '#9c27b0',
  teal: '#00897b',
};

const CHART_COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0', '#00897b'];

interface DashboardMetrics {
  totalRevenue: number;
  revenueChange: number;
  totalOrders: number;
  ordersChange: number;
  activeDeliveries: number;
  deliveriesChange: number;
  qcPassRate: number;
  qcPassRateChange: number;
  pendingInvoices: number;
  overdueInvoices: number;
  avgDeliveryTime: number;
  productionCapacity: number;
}

interface ChartData {
  name: string;
  value: number;
  color?: string;
}

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentRole } = useApp();
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    totalRevenue: 0,
    revenueChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    activeDeliveries: 0,
    deliveriesChange: 0,
    qcPassRate: 0,
    qcPassRateChange: 0,
    pendingInvoices: 0,
    overdueInvoices: 0,
    avgDeliveryTime: 0,
    productionCapacity: 75,
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [tests, setTests] = useState<QCTest[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [revenueData, setRevenueData] = useState<ChartData[]>([]);
  const [orderStatusData, setOrderStatusData] = useState<ChartData[]>([]);
  const [productionData, setProductionData] = useState<ChartData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!currentRole) {
      setTasks([]);
      return;
    }
    let cancelled = false;
    tasksApi
      .getForRole(currentRole)
      .then((data) => {
        if (!cancelled) setTasks(data);
      })
      .catch(() => {
        if (!cancelled) setTasks([]);
      });
    return () => {
      cancelled = true;
    };
  }, [currentRole]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [ordersData, deliveriesData, testsData, invoicesData] = await Promise.all([
        ordersApi.getAll(),
        deliveriesApi.getAll(),
        qcTestsApi.getAll(),
        invoicesApi.getAll(),
      ]);

      setOrders(ordersData);
      setDeliveries(deliveriesData);
      setTests(testsData);
      setInvoices(invoicesData);

      calculateMetrics(ordersData, deliveriesData, testsData, invoicesData);
      generateChartData(ordersData, deliveriesData, testsData);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateMetrics = (
    ordersData: Order[],
    deliveriesData: Delivery[],
    testsData: QCTest[],
    invoicesData: Invoice[]
  ) => {
    // Revenue calculations
    const totalRevenue = invoicesData
      .filter(inv => inv.paymentStatus === 'paid')
      .reduce((sum, inv) => sum + inv.total, 0);

    // Orders calculations
    const totalOrders = ordersData.length;
    const activeDeliveries = deliveriesData.filter(d => d.status !== 'delivered').length;

    // QC calculations
    const totalTests = testsData.length;
    const passedTests = testsData.filter(t => t.status === 'passed').length;
    const qcPassRate = totalTests > 0 ? (passedTests / totalTests) * 100 : 0;

    // Invoice calculations
    const pendingInvoices = invoicesData.filter(inv => inv.paymentStatus === 'pending').length;
    const overdueInvoices = invoicesData.filter(inv => inv.paymentStatus === 'overdue').length;

    // Delivery time calculations
    const completedDeliveries = deliveriesData.filter(d => 
      d.status === 'delivered' && d.actualArrival && d.createdAt
    );
    const avgDeliveryTime = completedDeliveries.length > 0
      ? completedDeliveries.reduce((sum, d) => {
          const start = new Date(d.createdAt).getTime();
          const end = new Date(d.actualArrival!).getTime();
          return sum + (end - start) / (1000 * 60 * 60); // hours
        }, 0) / completedDeliveries.length
      : 0;

    setMetrics({
      totalRevenue,
      revenueChange: 12.5, // Mock - would calculate from historical data
      totalOrders,
      ordersChange: 8.3,
      activeDeliveries,
      deliveriesChange: -5.2,
      qcPassRate,
      qcPassRateChange: 2.1,
      pendingInvoices,
      overdueInvoices,
      avgDeliveryTime,
      productionCapacity: 75,
    });
  };

  const generateChartData = (
    ordersData: Order[],
    deliveriesData: Delivery[],
    testsData: QCTest[]
  ) => {
    // Revenue trend (last 6 months)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const revenueByMonth = months.map((month, index) => ({
      name: month,
      value: Math.floor(Math.random() * 50000) + 30000, // Mock data
    }));
    setRevenueData(revenueByMonth);

    // Order status distribution
    const statusCounts: Record<string, number> = {};
    ordersData.forEach(order => {
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1;
    });

    const statusData = Object.entries(statusCounts).map(([status, count]) => ({
      name: status,
      value: count,
    }));
    setOrderStatusData(statusData);

    // Production by product
    const productCounts: Record<string, number> = {};
    ordersData.forEach(order => {
      order.products?.forEach(product => {
        const name = product.productName || 'Unknown';
        productCounts[name] = (productCounts[name] || 0) + product.quantity;
      });
    });

    const prodData = Object.entries(productCounts)
      .map(([name, quantity]) => ({
        name,
        value: quantity,
      }))
      .slice(0, 5); // Top 5 products
    setProductionData(prodData);
  };

  const getRecentActivity = () => {
    const activities: Array<{
      id: string;
      type: 'order' | 'delivery' | 'qc' | 'invoice';
      title: string;
      subtitle: string;
      time: Date;
      status: string;
    }> = [];

    // Recent orders
    orders.slice(0, 3).forEach(order => {
      activities.push({
        id: order.id,
        type: 'order',
        title: `Order ${order.orderNumber}`,
        subtitle: order.customerName,
        time: new Date(order.createdAt),
        status: order.status,
      });
    });

    // Recent deliveries
    deliveries.slice(0, 2).forEach(delivery => {
      activities.push({
        id: delivery.id,
        type: 'delivery',
        title: `Delivery ${delivery.orderNumber}`,
        subtitle: delivery.customerName,
        time: new Date(delivery.createdAt),
        status: delivery.status,
      });
    });

    // Recent QC tests
    tests.slice(0, 2).forEach(test => {
      activities.push({
        id: test.id,
        type: 'qc',
        title: `QC Test ${test.lotNumber}`,
        subtitle: test.productName,
        time: new Date(test.createdAt || test.testDate || Date.now()),
        status: test.status,
      });
    });

    return activities
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, 6);
  };

  const getActivityIcon = (type: string) => {
    const icons = {
      order: <OrderIcon />,
      delivery: <TruckIcon />,
      qc: <QCIcon />,
      invoice: <InvoiceIcon />,
    };
    return icons[type as keyof typeof icons] || <OrderIcon />;
  };

  const getActivityColor = (type: string) => {
    const colors = {
      order: COLORS.primary,
      delivery: COLORS.info,
      qc: COLORS.success,
      invoice: COLORS.warning,
    };
    return colors[type as keyof typeof colors] || COLORS.primary;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  const recentActivities = getRecentActivity();
  const urgentOrders = orders.filter(o => o.status === 'qc' && !tests.some(t => t.orderId === o.id));

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={loadData}
        >
          Refresh
        </Button>
      </Box>

      {/* Alerts */}
      {urgentOrders.length > 0 && (
        <Alert 
          severity="warning" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/quality')}>
              View
            </Button>
          }
        >
          {urgentOrders.length} orders awaiting QC testing
        </Alert>
      )}

      {metrics.overdueInvoices > 0 && (
        <Alert 
          severity="error" 
          sx={{ mb: 3 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/billing')}>
              View
            </Button>
          }
        >
          {metrics.overdueInvoices} overdue invoices require attention
        </Alert>
      )}

      {/* My tasks */}
      {tasks.length > 0 && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">My tasks</Typography>
            <Button size="small" onClick={() => navigate('/tasks')} endIcon={<ArrowForwardIcon />}>
              View all
            </Button>
          </Box>
          <Grid container spacing={2}>
            {tasks.map((task) => (
              <Grid item xs={12} sm={6} md={4} key={task.id}>
                <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => navigate(task.link)}>
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Typography variant="subtitle2">{task.title}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {task.count} {task.count === 1 ? 'task' : 'tasks'}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}

      {/* KPI Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {/* Revenue Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Total Revenue
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {formatCurrency(metrics.totalRevenue)}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {metrics.revenueChange >= 0 ? (
                      <TrendingUpIcon fontSize="small" sx={{ color: 'success.main' }} />
                    ) : (
                      <TrendingDownIcon fontSize="small" sx={{ color: 'error.main' }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{ color: metrics.revenueChange >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {Math.abs(metrics.revenueChange)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      vs last month
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark' }}>
                  <MoneyIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Orders Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Total Orders
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {metrics.totalOrders}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {metrics.ordersChange >= 0 ? (
                      <TrendingUpIcon fontSize="small" sx={{ color: 'success.main' }} />
                    ) : (
                      <TrendingDownIcon fontSize="small" sx={{ color: 'error.main' }} />
                    )}
                    <Typography
                      variant="body2"
                      sx={{ color: metrics.ordersChange >= 0 ? 'success.main' : 'error.main' }}
                    >
                      {Math.abs(metrics.ordersChange)}%
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      vs last month
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark' }}>
                  <OrderIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Deliveries Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    Active Deliveries
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {metrics.activeDeliveries}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <SpeedIcon fontSize="small" sx={{ color: 'info.main' }} />
                    <Typography variant="body2" color="textSecondary">
                      {metrics.avgDeliveryTime > 0 
                        ? `Avg: ${metrics.avgDeliveryTime.toFixed(1)}h`
                        : 'No data'
                      }
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'info.light', color: 'info.dark' }}>
                  <TruckIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* QC Pass Rate Card */}
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <Box sx={{ flex: 1 }}>
                  <Typography color="textSecondary" variant="body2" gutterBottom>
                    QC Pass Rate
                  </Typography>
                  <Typography variant="h4" sx={{ mb: 1 }}>
                    {metrics.qcPassRate.toFixed(0)}%
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <CheckCircleIcon fontSize="small" sx={{ color: 'success.main' }} />
                    <Typography variant="body2" color="textSecondary">
                      {tests.filter(t => t.status === 'passed').length} / {tests.length} tests
                    </Typography>
                  </Box>
                </Box>
                <Avatar sx={{ bgcolor: 'warning.light', color: 'warning.dark' }}>
                  <QCIcon />
                </Avatar>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        {/* Revenue Trend Chart */}
        <Grid item xs={12} lg={8}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Revenue Trend</Typography>
              <Chip label="Last 6 months" size="small" />
            </Box>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip 
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={COLORS.success} 
                  strokeWidth={3}
                  name="Revenue"
                  dot={{ fill: COLORS.success, r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Order Status Distribution */}
        <Grid item xs={12} lg={4}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>
              Order Status
            </Typography>
            {orderStatusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={orderStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {orderStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body2" color="textSecondary">
                  No order data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Production Volume Chart */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Production Volume (Tons)</Typography>
              <Chip label="Top 5 Products" size="small" />
            </Box>
            {productionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={productionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="value" fill={COLORS.primary} name="Quantity (tons)" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="body2" color="textSecondary">
                  No production data available
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} lg={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">Recent Activity</Typography>
              <Button size="small" endIcon={<ArrowForwardIcon />}>
                View All
              </Button>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {recentActivities.length > 0 ? (
              <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                {recentActivities.map((activity) => (
                  <Box
                    key={activity.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      py: 1.5,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <Avatar
                      sx={{
                        bgcolor: getActivityColor(activity.type) + '20',
                        color: getActivityColor(activity.type),
                        width: 40,
                        height: 40,
                      }}
                    >
                      {getActivityIcon(activity.type)}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={500}>
                        {activity.title}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {activity.subtitle}
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Chip
                        label={activity.status}
                        size="small"
                        sx={{ mb: 0.5 }}
                      />
                      <Typography variant="caption" display="block" color="textSecondary">
                        {formatTimeAgo(activity.time)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Box sx={{ textAlign: 'center', py: 4 }}>
                <ScheduleIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="body2" color="textSecondary">
                  No recent activity
                </Typography>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Quick Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Quick Stats
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Pending Invoices
                  </Typography>
                  <Typography variant="h4" color="warning.main">
                    {metrics.pendingInvoices}
                  </Typography>
                  <Button 
                    size="small" 
                    sx={{ mt: 1 }}
                    onClick={() => navigate('/billing')}
                  >
                    View
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Overdue Invoices
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {metrics.overdueInvoices}
                  </Typography>
                  <Button 
                    size="small" 
                    sx={{ mt: 1 }}
                    onClick={() => navigate('/billing')}
                  >
                    View
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    Production Capacity
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <Typography variant="h4" color="info.main">
                      {metrics.productionCapacity}%
                    </Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={metrics.productionCapacity} 
                    sx={{ mt: 2, height: 8, borderRadius: 1 }}
                  />
                </Box>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary" gutterBottom>
                    QC Pending
                  </Typography>
                  <Typography variant="h4" color="primary.main">
                    {tests.filter(t => t.status === 'pending' || t.status === 'in_progress').length}
                  </Typography>
                  <Button 
                    size="small" 
                    sx={{ mt: 1 }}
                    onClick={() => navigate('/quality')}
                  >
                    View
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;