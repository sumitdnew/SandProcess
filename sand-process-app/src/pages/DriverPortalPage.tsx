import React, { useEffect, useState, useCallback } from 'react';
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
  TableHead,
  TableRow,
  Button,
  Alert,
  CircularProgress,
  TextField,
} from '@mui/material';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { supabase } from '../config/supabase';
import { deliveriesApi, ordersApi } from '../services/api';
import { Delivery } from '../types';
import { useApp } from '../context/AppContext';
import PageHeader from '../theme/PageHeader';
import StatusChip from '../theme/StatusChip';
import SignatureCapture from '../components/common/SignatureCapture';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const DriverPortalPage: React.FC = () => {
  const { currentUser } = useApp();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signerName, setSignerName] = useState('');
  const [signerTitle, setSignerTitle] = useState('');
  const [signatureImage, setSignatureImage] = useState('');
  const [confirming, setConfirming] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const allDeliveries = await deliveriesApi.getAll();

      // Prefer deliveries assigned to this driver (by name), fall back to all active
      const driverName = currentUser?.name || '';
      let driverDeliveries = allDeliveries.filter(
        d => d.driverName === driverName && d.status !== 'delivered'
      );

      if (driverDeliveries.length === 0) {
        // Fallback: show all non-delivered deliveries so prototype is always usable
        driverDeliveries = allDeliveries.filter(d => d.status !== 'delivered');
      }

      setDeliveries(driverDeliveries);
      setSelectedDelivery(driverDeliveries[0] || null);
    } catch (err: any) {
      console.error('Error loading driver deliveries:', err);
      setError(err.message || 'Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const center = selectedDelivery
    ? [selectedDelivery.route.well.lat, selectedDelivery.route.well.lng]
    : [-38.5, -69.0];

  const handleUpdateDeliveryStatus = async (newStatus: 'in_transit' | 'arrived') => {
    if (!selectedDelivery) return;
    try {
      await supabase
        .from('deliveries')
        .update({ status: newStatus })
        .eq('id', selectedDelivery.id);
      await loadData();
    } catch (err: any) {
      console.error('Error updating delivery status from driver portal:', err);
      alert(err.message || 'Failed to update delivery status');
    }
  };

  const handleConfirmDelivery = async () => {
    if (!selectedDelivery) return;
    if (!signerName || !signerTitle) {
      alert('Please fill in client name and title.');
      return;
    }
    if (!signatureImage) {
      alert('Please capture signature before confirming delivery.');
      return;
    }

    // Check if certificate exists before confirming delivery
    const hasCert = await ordersApi.hasCertificate(selectedDelivery.orderId);
    if (!hasCert) {
      alert('Cannot confirm delivery: Order must have a QC certificate.');
      return;
    }

    try {
      setConfirming(true);

      // Generate 12 simulated checkpoints
      const checkpoints = Array.from({ length: 12 }, (_, i) => {
        const progress = i / 11;
        const lat = selectedDelivery.route.quarry.lat + 
          (selectedDelivery.route.well.lat - selectedDelivery.route.quarry.lat) * progress;
        const lng = selectedDelivery.route.quarry.lng + 
          (selectedDelivery.route.well.lng - selectedDelivery.route.quarry.lng) * progress;
        return {
          id: `cp-${i + 1}`,
          name: `Checkpoint ${i + 1}`,
          lat,
          lng,
          timestamp: new Date(Date.now() - (11 - i) * 60000).toISOString(),
        };
      });

      // Generate GPS track from checkpoints
      const gpsTrack = checkpoints.map(cp => ({
        lat: cp.lat,
        lng: cp.lng,
        timestamp: cp.timestamp,
      }));

      // Mirror Logistics flow: update deliveries row directly
      await supabase
        .from('deliveries')
        .update({
          status: 'delivered',
          signature: {
            signerName,
            signerTitle,
            timestamp: new Date().toISOString(),
            location: {
              lat: selectedDelivery.route.well.lat,
              lng: selectedDelivery.route.well.lng,
            },
            signatureImage,
          },
          checkpoints,
          gps_track: gpsTrack,
        })
        .eq('id', selectedDelivery.id);

      alert('Delivery confirmed with signature.');
      setSignerName('');
      setSignerTitle('');
      setSignatureImage('');
      loadData();
    } catch (err: any) {
      console.error('Error confirming delivery from driver portal:', err);
      alert(err.message || 'Failed to confirm delivery');
    } finally {
      setConfirming(false);
    }
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
      <PageHeader
        title="Driver Portal"
        subtitle={currentUser ? currentUser.name : undefined}
      />

      {error && (
        <Alert className="animate-slide-in-up" severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card sx={{ height: 500, overflow: 'auto' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                My Active Deliveries ({deliveries.length})
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Order</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deliveries.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Typography color="textSecondary">No active deliveries</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    deliveries.map((d) => (
                      <TableRow
                        key={d.id}
                        selected={selectedDelivery?.id === d.id}
                        onClick={() => setSelectedDelivery(d)}
                        sx={{ cursor: 'pointer' }}
                      >
                        <TableCell>{d.orderNumber}</TableCell>
                        <TableCell>{d.customerName}</TableCell>
                        <TableCell>
                          <StatusChip status={d.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          {selectedDelivery ? (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Route & Confirmation
              </Typography>
              <Box sx={{ height: 260, mb: 2 }}>
                <MapContainer
                  center={center as [number, number]}
                  zoom={10}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={[selectedDelivery.route.quarry.lat, selectedDelivery.route.quarry.lng]}>
                    <Popup>Quarry</Popup>
                  </Marker>
                  <Marker position={[selectedDelivery.route.well.lat, selectedDelivery.route.well.lng]}>
                    <Popup>Well Site: {selectedDelivery.route.well.name}</Popup>
                  </Marker>
                  {selectedDelivery.gpsTrack && selectedDelivery.gpsTrack.length > 0 && (
                    <Polyline
                      positions={selectedDelivery.gpsTrack.map(p => [p.lat, p.lng] as [number, number])}
                      color="blue"
                      weight={3}
                    />
                  )}
                </MapContainer>
              </Box>

              <Typography variant="subtitle1" gutterBottom>
                Capture Client Signature
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Client Name"
                    value={signerName}
                    onChange={(e) => setSignerName(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />
                  <TextField
                    fullWidth
                    label="Client Title"
                    value={signerTitle}
                    onChange={(e) => setSignerTitle(e.target.value)}
                    required
                    sx={{ mb: 2 }}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <SignatureCapture
                    value={signatureImage}
                    onChange={setSignatureImage}
                    label="Client Signature"
                    required
                  />
                </Grid>
              </Grid>

              <Box sx={{ mt: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  variant="outlined"
                  disabled={!selectedDelivery || selectedDelivery.status !== 'assigned'}
                  onClick={() => handleUpdateDeliveryStatus('in_transit')}
                >
                  Mark In Transit
                </Button>
                <Button
                  variant="outlined"
                  disabled={!selectedDelivery || selectedDelivery.status !== 'in_transit'}
                  onClick={() => handleUpdateDeliveryStatus('arrived')}
                >
                  Mark Arrived at Site
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  disabled={
                    confirming ||
                    !signerName ||
                    !signerTitle ||
                    !signatureImage ||
                    !selectedDelivery ||
                    (selectedDelivery.status !== 'arrived' &&
                      selectedDelivery.status !== 'in_transit')
                  }
                  onClick={handleConfirmDelivery}
                >
                  Confirm Delivery & Save Signature
                </Button>
              </Box>
            </Paper>
          ) : (
            <Paper sx={{ p: 3 }}>
              <Typography color="textSecondary">
                Select a delivery on the left to see route and capture signature.
              </Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default DriverPortalPage;


