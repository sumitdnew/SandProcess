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
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
} from '@mui/material';
import { inventoryApi } from '../services/api';
import { Inventory } from '../types';
import PageHeader from '../theme/PageHeader';

const InventoryPage: React.FC = () => {
  const { t } = useTranslation();
  const [inventory, setInventory] = useState<Inventory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch inventory from database (includes reserved calculation)
      const data = await inventoryApi.getAll();
      setInventory(data);
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const totalByProduct = inventory.reduce((acc, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = { total: 0, reserved: 0, available: 0, name: item.productName || 'Unknown Product' };
    }
    acc[item.productId].total += item.quantity;
    acc[item.productId].reserved += item.reserved;
    acc[item.productId].available += item.available;
    return acc;
  }, {} as Record<string, { total: number; reserved: number; available: number; name: string }>);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader title={t('modules.inventory.title')} />

      {error && (
        <Alert className="animate-slide-in-up" severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {Object.values(totalByProduct).map((product, idx) => (
          <Grid item xs={12} md={6} key={idx}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {product.name}
                </Typography>
                <Typography>Total: {product.total} tons</Typography>
                <Typography>Reserved: {product.reserved} tons</Typography>
                <Typography>Available: {product.available} tons</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('modules.inventory.stockLevels')} by {t('modules.inventory.location')}
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('modules.inventory.product')}</TableCell>
                    <TableCell>{t('modules.inventory.location')}</TableCell>
                    <TableCell>{t('modules.inventory.quantity')}</TableCell>
                    <TableCell>{t('modules.inventory.reserved')}</TableCell>
                    <TableCell>{t('modules.inventory.available')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {inventory.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} align="center">
                        <Typography color="textSecondary">No inventory data found</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    inventory.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.productName || 'Unknown Product'}</TableCell>
                        <TableCell>
                          <Chip label={item.location} size="small" />
                        </TableCell>
                        <TableCell>{item.quantity.toFixed(2)} tons</TableCell>
                        <TableCell>{item.reserved.toFixed(2)} tons</TableCell>
                        <TableCell>{item.available.toFixed(2)} tons</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default InventoryPage;

