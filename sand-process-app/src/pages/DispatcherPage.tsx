import React, { useState, useEffect } from 'react';
import { Box, Grid, Paper, Typography, Alert, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import PageHeader from '../theme/PageHeader';
import { OrderListTable } from '../components/dispatcher/OrderListTable';
import { OrderDetailPanel } from '../components/dispatcher/OrderDetailPanel';
import { RecommendationPanel } from '../components/dispatcher/RecommendationPanel';
import { BreakdownResolveDialog } from '../components/dispatcher/BreakdownResolveDialog';
import { ordersApi, deliveriesApi, redirectRequestsApi, trucksApi } from '../services/api';
import { useApp } from '../context/AppContext';
import { Order, RedirectRequest, Truck } from '../types';

const DispatcherPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser } = useApp();
  const [orders, setOrders] = useState<Order[]>([]);
  const [deliveryOrderIds, setDeliveryOrderIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('unassigned');
  const [searchTerm, setSearchTerm] = useState('');
  const [pendingRedirects, setPendingRedirects] = useState<RedirectRequest[]>([]);
  const [breakdownTrucks, setBreakdownTrucks] = useState<Truck[]>([]);
  const [breakdownResolve, setBreakdownResolve] = useState<{
    truckId: string;
    truckLabel: string;
    orderId: string;
    orderNumber?: string;
  } | null>(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const ordersData = await ordersApi.getAll();
      setOrders(ordersData || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load orders.');
      setOrders([]);
    } finally {
      setLoading(false);
    }
    try {
      const deliveriesData = await deliveriesApi.getAll();
      const ids = (deliveriesData || []).filter((d) => d.status !== 'delivered').map((d) => d.orderId);
      setDeliveryOrderIds(new Set(ids));
    } catch {
      setDeliveryOrderIds(new Set());
    }
  };

  const loadPendingRedirects = async () => {
    if (!currentUser) return;
    try {
      const all = await redirectRequestsApi.getAll();
      const pending = ['pending_jefatura', 'pending_gerencia', 'pending_approval'];
      const mine = all.filter(
        (r) => pending.includes(r.status) && r.requestedBy === currentUser.id
      );
      setPendingRedirects(mine);
    } catch {
      setPendingRedirects([]);
    }
  };

  const loadBreakdownTrucks = async () => {
    try {
      const all = await trucksApi.getAll();
      const broken = all.filter(
        (t) => (t.status === 'broken_down' || t.status === 'stuck') && t.assignedOrderId
      );
      setBreakdownTrucks(broken);
    } catch {
      setBreakdownTrucks([]);
    }
  };

  const [breakdownOrderNumbers, setBreakdownOrderNumbers] = useState<Record<string, string>>({});
  useEffect(() => {
    const load = async () => {
      const map: Record<string, string> = {};
      for (const t of breakdownTrucks) {
        if (!t.assignedOrderId || map[t.assignedOrderId]) continue;
        try {
          const o = await ordersApi.getById(t.assignedOrderId);
          if (o) map[t.assignedOrderId] = o.orderNumber;
        } catch {
          /* ignore */
        }
      }
      setBreakdownOrderNumbers(map);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breakdownTrucks.length]);

  useEffect(() => {
    loadOrders();
  }, []);

  useEffect(() => {
    loadPendingRedirects();
    loadBreakdownTrucks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const handleSelectOrder = (order: Order) => {
    setSelectedOrder(order);
  };

  const handleAssignSuccess = () => {
    loadOrders();
    loadPendingRedirects();
    loadBreakdownTrucks();
    setSelectedOrder(null);
  };

  return (
    <Box>
      <PageHeader
        title="Dispatcher"
        subtitle="View orders, get recommendations, and assign warehouse or truck."
        action={
          <Button
            startIcon={<RefreshIcon />}
            onClick={() => {
              loadOrders();
              loadPendingRedirects();
              loadBreakdownTrucks();
            }}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Orders
            </Typography>
            <OrderListTable
              orders={orders}
              deliveryOrderIds={deliveryOrderIds}
              selectedOrderId={selectedOrder?.id ?? null}
              onSelectOrder={handleSelectOrder}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              searchTerm={searchTerm}
              onSearchTermChange={setSearchTerm}
              loading={loading}
            />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" fontWeight={600} gutterBottom>
              Order details
            </Typography>
            <OrderDetailPanel order={selectedOrder} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <RecommendationPanel
              orderId={selectedOrder?.id ?? null}
              orderNumber={selectedOrder?.orderNumber ?? null}
              orderStatus={selectedOrder?.status ?? null}
              onAssignSuccess={handleAssignSuccess}
            />
          </Paper>
        </Grid>
        {currentUser && pendingRedirects.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                My pending redirect requests
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>From order</TableCell>
                      <TableCell>To order</TableCell>
                      <TableCell>Truck</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Submitted</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {pendingRedirects.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.fromOrderNumber ?? r.fromOrderId}</TableCell>
                        <TableCell>{r.toOrderNumber ?? r.toOrderId}</TableCell>
                        <TableCell>{r.truckLabel ?? '—'}</TableCell>
                        <TableCell>{r.status === 'pending_jefatura' ? t('modules.approvals.statusLevel1') : t('modules.approvals.statusLevel2')}</TableCell>
                        <TableCell>{r.requestedAt ? new Date(r.requestedAt).toLocaleString() : '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
        {breakdownTrucks.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Breakdowns (resolve replacement)
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Truck</TableCell>
                      <TableCell>Order</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {breakdownTrucks.map((t) => (
                      <TableRow key={t.id}>
                        <TableCell>{t.licensePlate}</TableCell>
                        <TableCell>{breakdownOrderNumbers[t.assignedOrderId!] ?? t.assignedOrderId}</TableCell>
                        <TableCell>{t.status}</TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            color="primary"
                            onClick={() =>
                              setBreakdownResolve({
                                truckId: t.id,
                                truckLabel: t.licensePlate,
                                orderId: t.assignedOrderId!,
                                orderNumber: breakdownOrderNumbers[t.assignedOrderId!],
                              })
                            }
                          >
                            Resolve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          </Grid>
        )}
      </Grid>
      {breakdownResolve && (
        <BreakdownResolveDialog
          open={!!breakdownResolve}
          truckId={breakdownResolve.truckId}
          truckLabel={breakdownResolve.truckLabel}
          orderId={breakdownResolve.orderId}
          orderNumber={breakdownResolve.orderNumber}
          onClose={() => setBreakdownResolve(null)}
          onSuccess={handleAssignSuccess}
        />
      )}
    </Box>
  );
};

export default DispatcherPage;
