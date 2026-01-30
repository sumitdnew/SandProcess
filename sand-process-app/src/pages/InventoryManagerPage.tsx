import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
  Button,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { Refresh as RefreshIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import PageHeader from '../theme/PageHeader';
import { ordersApi, productsApi, inventoryManagerApi, inventoryApi } from '../services/api';
import type { InventoryRecommendation, InventoryRecommendationAction, Order } from '../types';

interface SiteInventory {
  siteId: string;
  siteName: string;
  productId: string;
  productName: string;
  quantity: number;
  reserved: number;
  available: number;
  minSuggested: number;
  maxSuggested: number;
  status: 'OK' | 'Low' | 'Critical';
}

const SITES = [
  { id: 'quarry', name: 'Quarry warehouse' },
  { id: 'near_well', name: 'Warehouse near wells' },
  { id: 'in-transit', name: 'In transit (trucks)' },
];

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };
const ACTION_ORDER: Record<InventoryRecommendationAction, number> = { increase: 0, decrease: 1, maintain: 2 };

const InventoryManagerPage: React.FC = () => {
  const { t } = useTranslation();
  const [items, setItems] = useState<SiteInventory[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [recommendations, setRecommendations] = useState<InventoryRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterIncreaseDecreaseOnly, setFilterIncreaseDecreaseOnly] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      let balances: { siteId: string; productId: string; quantity: number }[] = [];
      try {
        balances = await inventoryApi.getBalances();
      } catch (e: any) {
        const msg = e?.message ?? '';
        const hint = /inventory_balance|relation.*does not exist|column.*quantity|column.*site_id/i.test(msg)
          ? ' Run database/schema_inventory_and_lots.sql in the Supabase SQL Editor, then refresh.'
          : '';
        throw new Error(`Could not load inventory.${hint}`);
      }
      const [ordersData, products, recs] = await Promise.all([
        ordersApi.getAll(),
        productsApi.getAll(),
        inventoryManagerApi.getInventoryRecommendations(),
      ]);

      setOrders(ordersData);

      const balanceMap = new Map<string, number>();
      for (const b of balances) balanceMap.set(`${b.siteId}-${b.productId}`, b.quantity);

      const inventoryMap = new Map<string, SiteInventory>();

      products.forEach((p) => {
        SITES.forEach((site) => {
          const key = `${site.id}-${p.id}`;
          const qty = site.id === 'in-transit'
            ? 0
            : (balanceMap.get(`${site.id}-${p.id}`) ?? 0);
          const reserved = site.id === 'in-transit' ? 0 : ordersData
            .filter((o) => o.status === 'pending' || o.status === 'confirmed' || o.status === 'ready')
            .reduce((s, o) => {
              const line = o.products.find((i) => i.productId === p.id);
              return s + (line ? line.quantity : 0);
            }, 0);
          const available = Math.max(0, qty - reserved);
          const minSuggested = site.id === 'quarry' ? 400 : site.id === 'near_well' ? 150 : 20;
          const maxSuggested = site.id === 'quarry' ? 1200 : site.id === 'near_well' ? 500 : 80;
          let status: 'OK' | 'Low' | 'Critical' = 'OK';
          if (available < minSuggested * 0.5) status = 'Critical';
          else if (available < minSuggested) status = 'Low';

          inventoryMap.set(key, {
            siteId: site.id,
            siteName: site.name,
            productId: p.id,
            productName: p.name,
            quantity: Math.round(qty * 10) / 10,
            reserved,
            available: Math.round(available * 10) / 10,
            minSuggested,
            maxSuggested,
            status,
          });
        });
      });

      setItems(Array.from(inventoryMap.values()));
      setRecommendations(recs);
    } catch (e: any) {
      setError(e?.message || 'Failed to load inventory.');
      setItems([]);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const statusColor = (s: 'OK' | 'Low' | 'Critical') =>
    ({ OK: 'success', Low: 'warning', Critical: 'error' }[s]);

  const confirmedCount = orders.filter((o) => o.status === 'confirmed').length;
  const inProductionCount = orders.filter((o) => o.status === 'in_production').length;
  const qcCount = orders.filter((o) => o.status === 'qc').length;
  const readyCount = orders.filter((o) => o.status === 'ready').length;

  const filteredRecs = filterIncreaseDecreaseOnly
    ? recommendations.filter((r) => r.action !== 'maintain')
    : recommendations;
  const sortedRecs = [...filteredRecs].sort((a, b) => {
    const pa = PRIORITY_ORDER[a.priority] ?? 2;
    const pb = PRIORITY_ORDER[b.priority] ?? 2;
    if (pa !== pb) return pa - pb;
    return (ACTION_ORDER[a.action] ?? 2) - (ACTION_ORDER[b.action] ?? 2);
  });

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title={t('common.inventory')}
        subtitle="Track production and inventory levels. Use recommendations to maintain appropriate stock at each location (quarry, near-well)."
        action={
          <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {!error && items.length > 0 && items.every((i) => i.quantity === 0) && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No inventory yet. Produce to inventory (Production), then run QC and approve (Quality) to add stock.
        </Alert>
      )}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Production overview
          </Typography>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Confirmed
              </Typography>
              <Typography variant="h5" color="info.main">
                {confirmedCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                In production
              </Typography>
              <Typography variant="h5" color="warning.main">
                {inProductionCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                QC queue
              </Typography>
              <Typography variant="h5" color="error.main">
                {qcCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined">
            <CardContent>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Ready for dispatch
              </Typography>
              <Typography variant="h5" color="success.main">
                {readyCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12}>
          <Button component={Link} to="/production" variant="outlined" size="small" startIcon={<OpenInNewIcon />}>
            View production
          </Button>
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {SITES.map((site) => {
          const siteItems = items.filter((i) => i.siteId === site.id);
          const critical = siteItems.filter((i) => i.status === 'Critical').length;
          const low = siteItems.filter((i) => i.status === 'Low').length;
          return (
            <Grid item xs={12} md={4} key={site.id}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {site.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip label={`${siteItems.length} products`} size="small" />
                    {critical > 0 && <Chip label={`${critical} critical`} size="small" color="error" />}
                    {low > 0 && <Chip label={`${low} low`} size="small" color="warning" />}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    Suggested min/max rules can be configured later.
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Inventory by site and product
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Site</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Quantity</TableCell>
                <TableCell align="right">Reserved</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="right">Min (suggested)</TableCell>
                <TableCell align="right">Max (suggested)</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((row, idx) => (
                <TableRow key={idx}>
                  <TableCell>{row.siteName}</TableCell>
                  <TableCell>{row.productName}</TableCell>
                  <TableCell align="right">{row.quantity} t</TableCell>
                  <TableCell align="right">{row.reserved} t</TableCell>
                  <TableCell align="right">{row.available} t</TableCell>
                  <TableCell align="right">{row.minSuggested} t</TableCell>
                  <TableCell align="right">{row.maxSuggested} t</TableCell>
                  <TableCell>
                    <Chip label={row.status} size="small" color={statusColor(row.status) as any} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Paper sx={{ p: 2, mt: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
          <Typography variant="h6">
            Recommendations
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={filterIncreaseDecreaseOnly}
                onChange={(_, v) => setFilterIncreaseDecreaseOnly(v)}
                size="small"
              />
            }
            label="Only increase / decrease"
          />
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Site</TableCell>
                <TableCell>Product</TableCell>
                <TableCell align="right">Current</TableCell>
                <TableCell align="right">Reserved</TableCell>
                <TableCell align="right">Available</TableCell>
                <TableCell align="right">Min</TableCell>
                <TableCell align="right">Max</TableCell>
                <TableCell>Action</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRecs.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.siteName}</TableCell>
                  <TableCell>{r.productName}</TableCell>
                  <TableCell align="right">{r.currentLevel} t</TableCell>
                  <TableCell align="right">{r.reserved} t</TableCell>
                  <TableCell align="right">{r.available} t</TableCell>
                  <TableCell align="right">{r.suggestedMin} t</TableCell>
                  <TableCell align="right">{r.suggestedMax} t</TableCell>
                  <TableCell>
                    <Chip
                      label={r.action}
                      size="small"
                      color={r.action === 'increase' ? 'warning' : r.action === 'decrease' ? 'info' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={r.priority}
                      size="small"
                      color={r.priority === 'high' ? 'error' : r.priority === 'medium' ? 'warning' : 'default'}
                    />
                  </TableCell>
                  <TableCell>{r.reason}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

export default InventoryManagerPage;
