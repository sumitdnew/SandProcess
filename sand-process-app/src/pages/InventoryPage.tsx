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
import { ordersApi, productsApi } from '../services/api';

interface InventoryItem {
  productId: string;
  productName: string;
  location: string;
  quantity: number;
  reserved: number;
  available: number;
}

const InventoryPage: React.FC = () => {
  const { t } = useTranslation();
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadInventory();
  }, []);

  const loadInventory = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [orders, products] = await Promise.all([
        ordersApi.getAll(),
        productsApi.getAll(),
      ]);

      // Calculate inventory from orders
      // For now, we'll simulate inventory based on orders
      // In a real system, you'd have a separate inventory table
      const inventoryMap = new Map<string, InventoryItem>();

      // Initialize with products
      products.forEach(product => {
        const key = `${product.id}-Cantera Principal`;
        inventoryMap.set(key, {
          productId: product.id,
          productName: product.name,
          location: 'Cantera Principal',
          quantity: 0,
          reserved: 0,
          available: 0,
        });
      });

      // Calculate reserved quantities from pending/confirmed orders
      orders.forEach(order => {
        if (order.status === 'pending' || order.status === 'confirmed' || order.status === 'ready') {
          order.products.forEach(item => {
            const key = `${item.productId}-Cantera Principal`;
            const invItem = inventoryMap.get(key);
            if (invItem) {
              invItem.reserved += item.quantity;
            }
          });
        }
      });

      // Set total quantities (simulated - in real system this comes from inventory table)
      inventoryMap.forEach(item => {
        // Simulate total quantity based on product type
        item.quantity = 1000 + Math.random() * 500; // Random between 1000-1500 tons
        item.available = item.quantity - item.reserved;
      });

      setInventory(Array.from(inventoryMap.values()));
    } catch (err: any) {
      console.error('Error loading inventory:', err);
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const totalByProduct = inventory.reduce((acc, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = { total: 0, reserved: 0, available: 0, name: item.productName };
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
      <Typography variant="h4" gutterBottom>
        {t('modules.inventory.title')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
                  {inventory.map((item, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{item.productName}</TableCell>
                      <TableCell>
                        <Chip label={item.location} size="small" />
                      </TableCell>
                      <TableCell>{item.quantity} tons</TableCell>
                      <TableCell>{item.reserved} tons</TableCell>
                      <TableCell>{item.available} tons</TableCell>
                    </TableRow>
                  ))}
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

