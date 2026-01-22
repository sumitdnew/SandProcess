import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  LinearProgress,
  Stepper,
  Step,
  StepLabel,
  IconButton,
  Badge,
  Divider,
  AlertTitle,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  LocalShipping as TruckIcon,
  Refresh as RefreshIcon,
  CheckCircle as CheckCircleIcon,
  RadioButtonUnchecked as PendingIcon,
  LocationOn as LocationIcon,
  Timer as TimerIcon,
  Create as SignatureIcon,
  PhotoCamera as PhotoIcon,
  Download as DownloadIcon,
  Close as CloseIcon,
  Speed as SpeedIcon,
} from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { deliveriesApi, ordersApi, trucksApi, driversApi } from '../services/api';
import { supabase } from '../config/supabase';
import { Delivery, Order, Truck, Driver } from '../types';
import StatusChip from '../theme/StatusChip';
import PageHeader from '../theme/PageHeader';
import { useApp } from '../context/AppContext';
import generateTraceabilityPDF from '../utils/generateTraceabilityPDF';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const quarryIcon = L.divIcon({
  html: '<div style="font-size: 24px;">🏭</div>',
  className: 'custom-quarry-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

const wellIcon = L.divIcon({
  html: '<div style="font-size: 24px;">🛢️</div>',
  className: 'custom-well-icon',
  iconSize: [30, 30],
  iconAnchor: [15, 15],
});

// Component to fit map bounds
const MapBoundsSetter: React.FC<{ delivery: Delivery | null }> = ({ delivery }) => {
  const map = useMap();

  useEffect(() => {
    if (delivery) {
      const bounds = L.latLngBounds([
        [delivery.route.quarry.lat, delivery.route.quarry.lng],
        [delivery.route.well.lat, delivery.route.well.lng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [delivery, map]);

  return null;
};

const LogisticsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentRole } = useApp();
  const navigate = useNavigate();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);
  const [openAssignDialog, setOpenAssignDialog] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [availableTrucks, setAvailableTrucks] = useState<Truck[]>([]);
  const [availableDrivers, setAvailableDrivers] = useState<Driver[]>([]);
  const [selectedTruckId, setSelectedTruckId] = useState('');
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [openDeliveryConfirmDialog, setOpenDeliveryConfirmDialog] = useState(false);
  const [signatureData, setSignatureData] = useState({
    signerName: '',
    signerTitle: '',
    signatureImage: '',
    photo: '',
  });
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasSignatureStrokesRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [deliveriesData, ordersData] = await Promise.all([
        deliveriesApi.getAll(),
        ordersApi.getAll(),
      ]);
      setDeliveries(deliveriesData);
      const readyOrders = ordersData.filter(o => 
        o.status === 'ready' || o.status === 'confirmed'
      );
      setOrders(readyOrders);
      // Only set initial delivery if none is selected (one-time initialization)
      setSelectedDelivery(prev => prev || (deliveriesData.length > 0 ? deliveriesData[0] : null));
    } catch (err: any) {
      console.error('Error loading logistics data:', err);
      setError(err.message || 'Failed to load logistics data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      assigned: 'default',
      in_transit: 'info',
      arrived: 'warning',
      delivering: 'warning',
      delivered: 'success',
    };
    return colors[status] || 'default';
  };

  const getStatusIcon = (status: string) => {
    const icons: Record<string, JSX.Element> = {
      assigned: <PendingIcon fontSize="small" />,
      in_transit: <SpeedIcon fontSize="small" />,
      arrived: <LocationIcon fontSize="small" />,
      delivering: <TimerIcon fontSize="small" />,
      delivered: <CheckCircleIcon fontSize="small" />,
    };
    return icons[status] || <PendingIcon fontSize="small" />;
  };

  const handleOpenAssignDialog = async () => {
    try {
      const [trucksData, driversData, ordersData] = await Promise.all([
        trucksApi.getAll(),
        driversApi.getAll(),
        ordersApi.getAll(),
      ]);
      const available = trucksData.filter(t => t.status === 'available');
      const availableDriversList = driversData.filter(d => d.available);
      const readyOrders = ordersData.filter(o => 
        o.status === 'ready' || o.status === 'confirmed'
      );
      setAvailableTrucks(available);
      setAvailableDrivers(availableDriversList);
      setOrders(readyOrders);
      setOpenAssignDialog(true);
    } catch (err: any) {
      console.error('Error loading trucks/drivers:', err);
      setError(err.message);
    }
  };

  const handleCreateDelivery = async () => {
    if (!selectedOrder || !selectedTruckId || !selectedDriverId) {
      alert('Please select an order, truck, and driver');
      return;
    }

    const hasCert = await ordersApi.hasCertificate(selectedOrder.id);
    if (!hasCert) {
      alert('Cannot dispatch: Order must have a QC certificate. Please complete and approve QC testing first.');
      return;
    }
    
    try {
      const eta = new Date();
      eta.setHours(eta.getHours() + 2);

      const { error } = await supabase
        .from('deliveries')
        .insert({
          order_id: selectedOrder.id,
          truck_id: selectedTruckId,
          driver_id: selectedDriverId,
          status: 'assigned',
          eta: eta.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      const { data: certData } = await supabase
        .from('qc_tests')
        .select('id, certificate_id')
        .eq('order_id', selectedOrder.id)
        .eq('status', 'passed')
        .not('certificate_id', 'is', null)
        .single();

      if (certData && certData.certificate_id) {
        await supabase
          .from('qc_tests')
          .update({ truck_id: selectedTruckId })
          .eq('id', certData.id);
      }

      await ordersApi.updateStatus(selectedOrder.id, 'dispatched');

      await supabase
        .from('trucks')
        .update({ 
          status: 'assigned',
          assigned_order_id: selectedOrder.id,
          driver_id: selectedDriverId
        })
        .eq('id', selectedTruckId);

      setOpenAssignDialog(false);
      setSelectedOrder(null);
      setSelectedTruckId('');
      setSelectedDriverId('');
      loadData();
    } catch (err: any) {
      console.error('Error creating delivery:', err);
      alert('Error creating delivery: ' + err.message);
    }
  };

  const handleMarkInTransit = async (deliveryId: string) => {
    try {
      await supabase
        .from('deliveries')
        .update({ status: 'in_transit' })
        .eq('id', deliveryId);
      loadData();
    } catch (err: any) {
      console.error('Error updating delivery status:', err);
      alert('Error updating status: ' + err.message);
    }
  };


  // Signature canvas handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    hasSignatureStrokesRef.current = false;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      hasSignatureStrokesRef.current = true;
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!canvasRef.current) return;
    setIsDrawing(false);
    // If no strokes were drawn, don't capture a signature image
    if (!hasSignatureStrokesRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const signatureImage = canvas.toDataURL('image/png');
    setSignatureData(prev => ({ ...prev, signatureImage }));
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setSignatureData(prev => ({ ...prev, signatureImage: '' }));
    }
  };

  const handleConfirmDelivery = async () => {
    if (!signatureData.signerName || !signatureData.signerTitle) {
      alert(t('modules.logistics.fillSignerInfo'));
      return;
    }

    if (!signatureData.signatureImage) {
      alert(t('modules.logistics.provideSignature'));
      return;
    }

    if (!selectedDelivery) return;

    try {
      let waitTime = 0;
      if (selectedDelivery.actualArrival) {
        const arrival = new Date(selectedDelivery.actualArrival);
        const now = new Date();
        waitTime = Math.round((now.getTime() - arrival.getTime()) / (1000 * 60));
      }

      const now = new Date();
      const checkpoints = [
        { id: '1', name: 'Quarry Exit', timestamp: new Date(now.getTime() - 120 * 60 * 1000).toISOString(), lat: selectedDelivery.route.quarry.lat, lng: selectedDelivery.route.quarry.lng, autoDetected: true },
        { id: '2', name: 'Highway Entry', timestamp: new Date(now.getTime() - 110 * 60 * 1000).toISOString(), lat: -38.52, lng: -69.05, autoDetected: true },
        { id: '3', name: 'Checkpoint 1', timestamp: new Date(now.getTime() - 100 * 60 * 1000).toISOString(), lat: -38.54, lng: -69.06, autoDetected: true },
        { id: '4', name: 'Checkpoint 2', timestamp: new Date(now.getTime() - 90 * 60 * 1000).toISOString(), lat: -38.56, lng: -69.07, autoDetected: true },
        { id: '5', name: 'Checkpoint 3', timestamp: new Date(now.getTime() - 80 * 60 * 1000).toISOString(), lat: -38.57, lng: -69.08, autoDetected: true },
        { id: '6', name: 'Checkpoint 4', timestamp: new Date(now.getTime() - 70 * 60 * 1000).toISOString(), lat: -38.58, lng: -69.09, autoDetected: true },
        { id: '7', name: 'Checkpoint 5', timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(), lat: -38.59, lng: -69.10, autoDetected: true },
        { id: '8', name: 'Checkpoint 6', timestamp: new Date(now.getTime() - 50 * 60 * 1000).toISOString(), lat: -38.60, lng: -69.11, autoDetected: true },
        { id: '9', name: 'Checkpoint 7', timestamp: new Date(now.getTime() - 40 * 60 * 1000).toISOString(), lat: -38.61, lng: -69.12, autoDetected: true },
        { id: '10', name: 'Checkpoint 8', timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(), lat: -38.62, lng: -69.13, autoDetected: true },
        { id: '11', name: 'Well Site Entry', timestamp: new Date(now.getTime() - 20 * 60 * 1000).toISOString(), lat: -38.63, lng: -69.14, autoDetected: true },
        { id: '12', name: 'Well Site Arrival', timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), lat: selectedDelivery.route.well.lat, lng: selectedDelivery.route.well.lng, autoDetected: true },
      ];

      const gpsTrack = checkpoints.map(cp => ({
        lat: cp.lat,
        lng: cp.lng,
        timestamp: cp.timestamp,
      }));

      const signature = {
        signerName: signatureData.signerName,
        signerTitle: signatureData.signerTitle,
        timestamp: new Date().toISOString(),
        location: {
          lat: selectedDelivery.route.well.lat || -38.6,
          lng: selectedDelivery.route.well.lng || -69.1,
        },
        signatureImage: signatureData.signatureImage,
        photo: signatureData.photo || undefined,
      };

      const hasCert = await ordersApi.hasCertificate(selectedDelivery.orderId);
      if (!hasCert) {
        alert('Cannot confirm delivery: Order must have a QC certificate.');
        return;
      }

      await supabase
        .from('deliveries')
        .update({
          status: 'delivered',
          actual_arrival: new Date().toISOString(),
          wait_time: waitTime,
          signature: signature,
          checkpoints: checkpoints,
          gps_track: gpsTrack,
        })
        .eq('id', selectedDelivery.id);

      if (selectedDelivery.orderId) {
        await ordersApi.updateStatus(selectedDelivery.orderId, 'delivered');
      }

      // Auto-generate invoice
      if (selectedDelivery.orderId) {
        const order = await ordersApi.getById(selectedDelivery.orderId);
        if (order) {
          const { data: existingInvoice } = await supabase
            .from('invoices')
            .select('id')
            .eq('order_id', order.id)
            .maybeSingle();

          if (!existingInvoice) {
            const year = new Date().getFullYear();
            const { count } = await supabase
              .from('invoices')
              .select('*', { count: 'exact', head: true })
              .like('invoice_number', `INV-${year}-%`);
            
            const invoiceNumber = `INV-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

            let paymentTerms = 30;
            if (order.msaId) {
              const { data: msaData } = await supabase
                .from('msas')
                .select('payment_terms')
                .eq('id', order.msaId)
                .single();
              if (msaData?.payment_terms) {
                const termsMatch = msaData.payment_terms.match(/\d+/);
                if (termsMatch) paymentTerms = parseInt(termsMatch[0]);
              }
            }

            await supabase
              .from('invoices')
              .insert({
                invoice_number: invoiceNumber,
                order_id: order.id,
                customer_id: order.customerId,
                issue_date: new Date().toISOString().split('T')[0],
                due_date: new Date(Date.now() + paymentTerms * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                subtotal: order.totalAmount,
                tax: 0,
                total: order.totalAmount,
                payment_status: 'pending',
                days_outstanding: 0,
              });

            await ordersApi.updateStatus(order.id, 'invoiced');
          }
        }
      }

      setOpenDeliveryConfirmDialog(false);
      setSignatureData({ 
        signerName: '', 
        signerTitle: '', 
        signatureImage: '',
        photo: '',
      });
      loadData();
    } catch (err: any) {
      console.error('Error confirming delivery:', err);
      alert('Error confirming delivery: ' + err.message);
    }
  };

  const handleDownloadTraceabilityReport = (delivery: Delivery) => {
    try {
      generateTraceabilityPDF(delivery);
    } catch (err: any) {
      console.error('Error generating traceability PDF:', err);
      alert(err.message || 'Failed to generate traceability report');
    }
  };

  const center = selectedDelivery
    ? [selectedDelivery.route.quarry.lat, selectedDelivery.route.quarry.lng]
    : [-38.5, -69.0];

  const filteredDeliveries = statusFilter === 'all' 
    ? deliveries 
    : deliveries.filter(d => d.status === statusFilter);

  const activeDeliveries = deliveries.filter(d => d.status !== 'delivered').length;

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
        title={t('modules.logistics.title')}
        subtitle={
          <>
            <Badge badgeContent={activeDeliveries} color="primary" sx={{ mr: 2 }}>
              <TruckIcon />
            </Badge>
            {activeDeliveries} {t('modules.logistics.activeDeliveries')} • {deliveries.length} {t('modules.logistics.totalDeliveries')}
          </>
        }
        action={
          <>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadData}
            >
              {t('common.refresh')}
            </Button>
            {currentRole !== 'driver' && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleOpenAssignDialog}
                disabled={orders.length === 0}
              >
                {t('modules.logistics.assignTruck')}
              </Button>
            )}
          </>
        }
      />

      {error && (
        <Alert className="animate-slide-in-up" severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Filter */}
      <Box sx={{ mb: 3 }}>
        <TextField
          select
          label={t('modules.logistics.filterByStatus')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="all">{t('modules.logistics.allStatuses')}</MenuItem>
          <MenuItem value="assigned">{t('modules.logistics.assignedDispatched')}</MenuItem>
          <MenuItem value="in_transit">{t('modules.logistics.inTransit')}</MenuItem>
          <MenuItem value="arrived">{t('modules.logistics.arrived')}</MenuItem>
          <MenuItem value="delivering">{t('deliveryStatus.delivering')}</MenuItem>
          <MenuItem value="delivered">{t('deliveryStatus.delivered')}</MenuItem>
        </TextField>
      </Box>

      {deliveries.length === 0 ? (
        /* Empty State */
        <Paper sx={{ p: 8, textAlign: 'center', bgcolor: 'grey.50' }}>
          <TruckIcon sx={{ fontSize: 80, color: 'text.disabled', mb: 3 }} />
          <Typography variant="h5" gutterBottom color="textSecondary">
            No Active Deliveries
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
            {t('modules.logistics.noDeliveriesFound')}
          </Typography>
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/orders')}
          >
            Go to Orders
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {/* Map View */}
          <Grid item xs={12} md={8}>
            <Paper sx={{ height: 600, overflow: 'hidden', position: 'relative' }}>
              {selectedDelivery && (
                <Box sx={{ position: 'absolute', top: 16, left: 16, zIndex: 1000, bgcolor: 'white', p: 2, borderRadius: 1, boxShadow: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    <strong>{selectedDelivery.orderNumber}</strong>
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getStatusIcon(selectedDelivery.status)}
                    <Chip 
                      label={selectedDelivery.status} 
                      size="small" 
                      color={getStatusColor(selectedDelivery.status) as any}
                    />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    🚚 {selectedDelivery.truckLicensePlate}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    👤 {selectedDelivery.driverName}
                  </Typography>
                </Box>
              )}
              <MapContainer
                center={center as [number, number]}
                zoom={10}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {selectedDelivery && (
                  <>
                    <MapBoundsSetter delivery={selectedDelivery} />
                    <Marker 
                      position={[selectedDelivery.route.quarry.lat, selectedDelivery.route.quarry.lng]}
                      icon={quarryIcon}
                    >
                      <Popup>
                        <strong>{t('modules.logistics.quarry')}</strong><br />
                        {selectedDelivery.route.quarry.name}
                      </Popup>
                    </Marker>
                    <Marker 
                      position={[selectedDelivery.route.well.lat, selectedDelivery.route.well.lng]}
                      icon={wellIcon}
                    >
                      <Popup>
                        <strong>{t('modules.logistics.well')}</strong><br />
                        {selectedDelivery.route.well.name || selectedDelivery.route.well.address}
                      </Popup>
                    </Marker>
                    {selectedDelivery.gpsTrack && selectedDelivery.gpsTrack.length > 0 ? (
                      <Polyline
                        positions={selectedDelivery.gpsTrack.map(point => [point.lat, point.lng] as [number, number])}
                        color="#1976d2"
                        weight={4}
                        opacity={0.7}
                      />
                    ) : (
                      <Polyline
                        positions={[
                          [selectedDelivery.route.quarry.lat, selectedDelivery.route.quarry.lng],
                          [selectedDelivery.route.well.lat, selectedDelivery.route.well.lng],
                        ]}
                        color="#90caf9"
                        weight={3}
                        opacity={0.5}
                        dashArray="10, 10"
                      />
                    )}
                  </>
                )}
              </MapContainer>
            </Paper>
          </Grid>

          {/* Deliveries List */}
          <Grid item xs={12} md={4}>
            <Card sx={{ height: 600, overflow: 'auto' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Active Deliveries ({filteredDeliveries.length})
                </Typography>
                <Divider sx={{ mb: 2 }} />
                {filteredDeliveries.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <Typography variant="body2" color="textSecondary">
                      No deliveries match this status
                    </Typography>
                  </Box>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <Card
                      key={delivery.id}
                      className="card-hover"
                      sx={{ 
                        mb: 2, 
                        border: selectedDelivery?.id === delivery.id ? 2 : 1,
                        borderColor: selectedDelivery?.id === delivery.id ? 'primary.main' : 'divider',
                      }}
                      onClick={() => setSelectedDelivery(delivery)}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', mb: 1 }}>
                          <Typography variant="subtitle2" fontWeight="bold">
                            {delivery.orderNumber}
                          </Typography>
                          <StatusChip status={delivery.status} />
                        </Box>
                        <Typography variant="body2" color="textSecondary">
                          {delivery.customerName}
                        </Typography>
                        <Typography variant="caption" display="block" color="textSecondary">
                          🚚 {delivery.truckLicensePlate} • 👤 {delivery.driverName}
                        </Typography>
                        {delivery.eta && (
                          <Typography variant="caption" display="block" color="primary">
                            ETA: {new Date(delivery.eta).toLocaleTimeString()}
                          </Typography>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Delivery Details */}
          {selectedDelivery && (
            <Grid item xs={12}>
              <Paper sx={{ p: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="h6">
                        {t('modules.logistics.deliveryDetails')}: {selectedDelivery.orderNumber}
                      </Typography>
                      <StatusChip status={selectedDelivery.status} />
                    </Box>
                  </Grid>

                  {/* Info Grid */}
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="textSecondary">
                        Truck
                      </Typography>
                      <Typography variant="body1">
                        🚚 {selectedDelivery.truckLicensePlate}
                      </Typography>
                    </Box>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="caption" color="textSecondary">
                        Driver
                      </Typography>
                      <Typography variant="body1">
                        👤 {selectedDelivery.driverName}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" color="textSecondary">
                        Customer
                      </Typography>
                      <Typography variant="body1">
                        {selectedDelivery.customerName}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    {selectedDelivery.eta && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                          ETA
                        </Typography>
                        <Typography variant="body1">
                          {new Date(selectedDelivery.eta).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                    {selectedDelivery.actualArrival && (
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="textSecondary">
                          Actual Arrival
                        </Typography>
                        <Typography variant="body1">
                          {new Date(selectedDelivery.actualArrival).toLocaleString()}
                        </Typography>
                      </Box>
                    )}
                    {selectedDelivery.waitTime !== null && selectedDelivery.waitTime !== undefined && (
                      <Box>
                        <Typography variant="caption" color="textSecondary">
                          Wait Time
                        </Typography>
                        <Typography variant="body1">
                          {selectedDelivery.waitTime} minutes
                        </Typography>
                      </Box>
                    )}
                  </Grid>

                  {/* Checkpoints */}
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('modules.logistics.checkpoints')} ({selectedDelivery.checkpoints?.length || 0}/12)
                    </Typography>
                    {selectedDelivery.checkpoints && selectedDelivery.checkpoints.length > 0 ? (
                      <Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(selectedDelivery.checkpoints.length / 12) * 100} 
                          sx={{ mb: 2, height: 8, borderRadius: 1 }}
                        />
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                          {selectedDelivery.checkpoints.map((cp) => (
                            <Chip
                              key={cp.id}
                              label={`${cp.name}`}
                              size="small"
                              color={cp.autoDetected ? 'primary' : 'default'}
                              icon={cp.autoDetected ? <LocationIcon /> : <SignatureIcon />}
                            />
                          ))}
                        </Box>
                      </Box>
                    ) : (
                      <Alert className="animate-slide-in-up" severity="info" icon={<LocationIcon />}>
                        {t('modules.logistics.noCheckpoints')}
                      </Alert>
                    )}
                  </Grid>

                  {/* Actions */}
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                      {selectedDelivery.status === 'assigned' && (
                        <Button
                          variant="contained"
                          color="info"
                          startIcon={<SpeedIcon />}
                          onClick={() => handleMarkInTransit(selectedDelivery.id)}
                        >
                          {t('modules.logistics.markInTransit')}
                        </Button>
                      )}
                      {(selectedDelivery.status === 'in_transit' || selectedDelivery.status === 'arrived') && (
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => setOpenDeliveryConfirmDialog(true)}
                        >
                          {t('modules.logistics.confirmDelivery')}
                        </Button>
                      )}
                      {selectedDelivery.status === 'delivered' && (
                        <Button
                          variant="outlined"
                          startIcon={<DownloadIcon />}
                          onClick={() => handleDownloadTraceabilityReport(selectedDelivery)}
                        >
                          {t('modules.logistics.downloadTraceabilityReport')}
                        </Button>
                      )}
                    </Box>
                  </Grid>

                  {/* Signature Section (if delivered) */}
                  {selectedDelivery.signature && (
                    <Grid item xs={12}>
                      <Alert className="animate-slide-in-up" severity="success" icon={<CheckCircleIcon />}>
                        <AlertTitle>{t('modules.logistics.deliveryConfirmed')}</AlertTitle>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12} md={6}>
                            <Typography variant="body2">
                              <strong>{t('modules.logistics.signedBy')}</strong> {selectedDelivery.signature.signerName}
                            </Typography>
                            <Typography variant="body2">
                              <strong>{t('modules.logistics.signerTitleLabel')}</strong> {selectedDelivery.signature.signerTitle}
                            </Typography>
                            <Typography variant="body2">
                              <strong>{t('modules.logistics.date')}</strong> {new Date(selectedDelivery.signature.timestamp).toLocaleString()}
                            </Typography>
                            <Typography variant="body2">
                              <strong>{t('modules.logistics.location')}</strong> {selectedDelivery.signature.location?.lat?.toFixed(4)}, {selectedDelivery.signature.location?.lng?.toFixed(4)}
                            </Typography>
                          </Grid>
                          {selectedDelivery.signature.signatureImage && (
                            <Grid item xs={12} md={6}>
                              <Typography variant="body2" gutterBottom>
                                <strong>{t('modules.logistics.signature')}</strong>
                              </Typography>
                              <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1, bgcolor: 'white' }}>
                                <img 
                                  src={selectedDelivery.signature.signatureImage} 
                                  alt="Signature" 
                                  style={{ maxWidth: '100%', maxHeight: 100 }}
                                />
                              </Box>
                            </Grid>
                          )}
                          {selectedDelivery.signature.photo && (
                            <Grid item xs={12}>
                              <Typography variant="body2" gutterBottom>
                                <strong>Delivery Photo:</strong>
                              </Typography>
                              <Box sx={{ border: '1px solid #ddd', borderRadius: 1, p: 1, bgcolor: 'white' }}>
                                <img 
                                  src={selectedDelivery.signature.photo} 
                                  alt="Delivery" 
                                  style={{ maxWidth: '100%', maxHeight: 200 }}
                                />
                              </Box>
                            </Grid>
                          )}
                        </Grid>
                      </Alert>
                    </Grid>
                  )}
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      {/* Assign Delivery Dialog */}
      <Dialog className="animate-fade-in" open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {t('modules.logistics.assignTruck')}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label={t('modules.logistics.order')}
                value={selectedOrder?.id || ''}
                onChange={(e) => {
                  const order = orders.find(o => o.id === e.target.value);
                  setSelectedOrder(order || null);
                }}
                required
              >
                {orders.map((order) => (
                  <MenuItem key={order.id} value={order.id}>
                    {order.orderNumber} - {order.customerName} ({order.deliveryLocation})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            {selectedOrder && (
              <Grid item xs={12}>
                <Alert className="animate-slide-in-up" severity="info">
                  <Typography variant="body2">
                    <strong>Customer:</strong> {selectedOrder.customerName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Delivery Location:</strong> {selectedOrder.deliveryLocation}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Total Amount:</strong> ${selectedOrder.totalAmount.toLocaleString()}
                  </Typography>
                </Alert>
              </Grid>
            )}
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label={t('modules.logistics.truck')}
                value={selectedTruckId}
                onChange={(e) => setSelectedTruckId(e.target.value)}
                required
                helperText={availableTrucks.length === 0 ? 'No available trucks' : `${availableTrucks.length} trucks available`}
              >
                {availableTrucks.length === 0 ? (
                  <MenuItem disabled>No available trucks</MenuItem>
                ) : (
                  availableTrucks.map((truck) => (
                    <MenuItem key={truck.id} value={truck.id}>
                      🚚 {truck.licensePlate} - {truck.capacity} tons ({truck.type === 'old' ? 'Old' : 'New'})
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label={t('modules.logistics.driver')}
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                required
                helperText={availableDrivers.length === 0 ? 'No available drivers' : `${availableDrivers.length} drivers available`}
              >
                {availableDrivers.length === 0 ? (
                  <MenuItem disabled>No available drivers</MenuItem>
                ) : (
                  availableDrivers.map((driver) => (
                    <MenuItem key={driver.id} value={driver.id}>
                      👤 {driver.name} - {driver.hoursWorked}/{driver.hoursLimit} hours
                    </MenuItem>
                  ))
                )}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>
            {t('common.cancel')}
          </Button>
          <Button 
            onClick={handleCreateDelivery} 
            variant="contained"
            disabled={!selectedOrder || !selectedTruckId || !selectedDriverId}
          >
            {t('common.save')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delivery Confirmation Dialog */}
      <Dialog 
        className="animate-fade-in"
        open={openDeliveryConfirmDialog} 
        onClose={() => setOpenDeliveryConfirmDialog(false)} 
        maxWidth="md" 
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>Confirm Delivery & Capture Signature</span>
            <IconButton onClick={() => setOpenDeliveryConfirmDialog(false)} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedDelivery && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              {/* Order Info */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body2" gutterBottom>
                    <strong>Order:</strong> {selectedDelivery.orderNumber}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Customer:</strong> {selectedDelivery.customerName}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Delivery Location:</strong> {selectedDelivery.route.well.name || selectedDelivery.route.well.address}
                  </Typography>
                </Paper>
              </Grid>

              {/* Stepper */}
              <Grid item xs={12}>
                <Stepper activeStep={2} sx={{ mb: 2 }}>
                  <Step completed>
                    <StepLabel>Signer Details</StepLabel>
                  </Step>
                  <Step completed={!!signatureData.signatureImage}>
                    <StepLabel>Signature</StepLabel>
                  </Step>
                  <Step completed={!!signatureData.photo}>
                    <StepLabel>Photo (Optional)</StepLabel>
                  </Step>
                </Stepper>
              </Grid>

              {/* Signer Details */}
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('modules.logistics.signerName')}
                  value={signatureData.signerName}
                  onChange={(e) => setSignatureData({ ...signatureData, signerName: e.target.value })}
                  required
                  placeholder="e.g., John Smith"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('modules.logistics.signerTitle')}
                  value={signatureData.signerTitle}
                  onChange={(e) => setSignatureData({ ...signatureData, signerTitle: e.target.value })}
                  required
                  placeholder={t('modules.logistics.signerTitlePlaceholder')}
                />
              </Grid>

              {/* Signature Canvas */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('modules.logistics.electronicSignature')} *
                </Typography>
                <Paper 
                  sx={{ 
                    border: '2px dashed',
                    borderColor: signatureData.signatureImage ? 'success.main' : 'grey.400',
                    p: 2,
                    bgcolor: 'grey.50',
                    borderRadius: 2,
                  }}
                >
                  {!signatureData.signatureImage ? (
                    <>
                      <Typography variant="caption" display="block" gutterBottom color="textSecondary" sx={{ textAlign: 'center' }}>
                        ✍️ Draw your signature below using your mouse or touch screen
                      </Typography>
                      <canvas
                        ref={(canvas) => {
                          if (canvas && !canvasRef.current) {
                            canvas.width = canvas.offsetWidth;
                            canvas.height = 150;
                            canvasRef.current = canvas;
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.strokeStyle = '#000';
                              ctx.lineWidth = 2;
                              ctx.lineCap = 'round';
                            }
                          }
                        }}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        style={{
                          width: '100%',
                          height: 150,
                          border: '1px solid #ddd',
                          borderRadius: 4,
                          cursor: 'crosshair',
                          backgroundColor: '#fff',
                        }}
                      />
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                        <Button 
                          size="small" 
                          onClick={clearSignature}
                          disabled={!signatureData.signatureImage}
                        >
                          {t('modules.logistics.clearSignature')}
                        </Button>
                      </Box>
                    </>
                  ) : (
                    <Box sx={{ textAlign: 'center' }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                      <Typography variant="body2" color="success.main" gutterBottom>
                        Signature Captured ✓
                      </Typography>
                      <img 
                        src={signatureData.signatureImage} 
                        alt="Signature" 
                        style={{ maxWidth: '100%', maxHeight: 150, border: '1px solid #ddd', borderRadius: 4 }}
                      />
                      <Box sx={{ mt: 1 }}>
                        <Button 
                          size="small" 
                          onClick={clearSignature}
                          startIcon={<CloseIcon />}
                        >
                          Clear & Redraw
                        </Button>
                      </Box>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Photo Upload */}
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Delivery Photo (Optional)
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="photo-upload-button"
                  type="file"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setSignatureData({ ...signatureData, photo: reader.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
                <label htmlFor="photo-upload-button">
                  <Button 
                    variant="outlined" 
                    component="span" 
                    fullWidth
                    startIcon={<PhotoIcon />}
                  >
                    {signatureData.photo ? 'Change Photo' : t('modules.logistics.uploadPhoto')}
                  </Button>
                </label>
                {signatureData.photo && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img 
                      src={signatureData.photo} 
                      alt="Delivery" 
                      style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4, border: '1px solid #ddd' }}
                    />
                    <Box sx={{ mt: 1 }}>
                      <Button 
                        size="small" 
                        onClick={() => setSignatureData({ ...signatureData, photo: '' })}
                        startIcon={<CloseIcon />}
                      >
                        Remove Photo
                      </Button>
                    </Box>
                  </Box>
                )}
              </Grid>

              {/* Requirements Alert */}
              <Grid item xs={12}>
                <Alert className="animate-slide-in-up" severity="info" icon={<CheckCircleIcon />}>
                  <AlertTitle>Signature Requirements (RN-004)</AlertTitle>
                  <Box component="ul" sx={{ m: 0, pl: 2 }}>
                    <li>
                      <Typography variant="body2">
                        Name and Title {signatureData.signerName && signatureData.signerTitle ? '✓' : ''}
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Electronic Signature {signatureData.signatureImage ? '✓' : ''}
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Timestamp (auto-captured) ✓
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        GPS Coordinates (auto-captured) ✓
                      </Typography>
                    </li>
                    <li>
                      <Typography variant="body2">
                        Photo {signatureData.photo ? '✓ (optional)' : '(optional)'}
                      </Typography>
                    </li>
                  </Box>
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={() => setOpenDeliveryConfirmDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            size="large"
            onClick={handleConfirmDelivery}
            disabled={!signatureData.signerName || !signatureData.signerTitle || !signatureData.signatureImage}
            startIcon={<CheckCircleIcon />}
          >
            Confirm Delivery
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LogisticsPage;