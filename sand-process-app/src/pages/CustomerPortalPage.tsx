import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { deliveriesApi, ordersApi } from '../services/api';
import { Delivery, Order } from '../types';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const CustomerPortalPage: React.FC = () => {
  const { t } = useTranslation();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [customerOrders, setCustomerOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  // In real app, get customer ID from authentication context
  const customerId = '1'; // YPF for demo

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [deliveriesData, ordersData] = await Promise.all([
        deliveriesApi.getAll(),
        ordersApi.getAll(),
      ]);
      setDeliveries(deliveriesData);
      // Filter orders for this customer
      const customerOrdersList = ordersData.filter(o => o.customerId === customerId);
      setCustomerOrders(customerOrdersList);
      if (deliveriesData.length > 0) {
        setSelectedDelivery(deliveriesData[0]);
      }
    } catch (err: any) {
      console.error('Error loading customer portal data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const center = selectedDelivery
    ? [selectedDelivery.route.well.lat, selectedDelivery.route.well.lng]
    : [-38.5, -69.0];

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
        {t('common.customerPortal')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: 500, p: 1, mb: 2 }}>
            <Typography variant="h6" sx={{ p: 2 }}>
              Live Tracking
            </Typography>
            <MapContainer
              center={center as [number, number]}
              zoom={10}
              style={{ height: 'calc(100% - 80px)', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {selectedDelivery && (
                <>
                  <Marker position={[selectedDelivery.route.quarry.lat, selectedDelivery.route.quarry.lng]}>
                    <Popup>Quarry</Popup>
                  </Marker>
                  <Marker position={[selectedDelivery.route.well.lat, selectedDelivery.route.well.lng]}>
                    <Popup>Your Well: {selectedDelivery.route.well.name}</Popup>
                  </Marker>
                  {selectedDelivery.gpsTrack && selectedDelivery.gpsTrack.length > 0 && (
                    <Polyline
                      positions={selectedDelivery.gpsTrack.map(point => [point.lat, point.lng] as [number, number])}
                      color="blue"
                      weight={3}
                    />
                  )}
                </>
              )}
            </MapContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Orders
              </Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Order</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {customerOrders.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={2} align="center">
                          <Typography color="textSecondary">No orders found</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      customerOrders.map((order) => (
                        <TableRow
                          key={order.id}
                          selected={selectedDelivery?.orderId === order.id}
                          onClick={() => {
                            const delivery = deliveries.find(d => d.orderId === order.id);
                            if (delivery) setSelectedDelivery(delivery);
                          }}
                          sx={{ cursor: 'pointer' }}
                        >
                          <TableCell>{order.orderNumber}</TableCell>
                          <TableCell>
                            <Chip label={order.status} size="small" />
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {selectedDelivery && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Delivery Details: {selectedDelivery.orderNumber}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Truck:</strong> {selectedDelivery.truckLicensePlate}</Typography>
                  <Typography><strong>Driver:</strong> {selectedDelivery.driverName}</Typography>
                  {selectedDelivery.eta && (
                    <Typography><strong>ETA:</strong> {new Date(selectedDelivery.eta).toLocaleString()}</Typography>
                  )}
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography><strong>Status:</strong> {selectedDelivery.status}</Typography>
                  <Typography><strong>Checkpoints:</strong> {selectedDelivery.checkpoints.length}/12</Typography>
                  {selectedDelivery.signature && (
                    <Typography><strong>Signed by:</strong> {selectedDelivery.signature.signerName}</Typography>
                  )}
                </Grid>
                <Grid item xs={12}>
                  <Button variant="outlined" sx={{ mr: 1 }}>Download Certificate</Button>
                  <Button variant="outlined">Download Traceability Report</Button>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default CustomerPortalPage;

