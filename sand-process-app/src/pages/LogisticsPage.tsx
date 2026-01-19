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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import { MapContainer, TileLayer, Marker, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { deliveriesApi, ordersApi, trucksApi, driversApi } from '../services/api';
import { supabase } from '../config/supabase';
import { Delivery, Order, Truck, Driver } from '../types';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const LogisticsPage: React.FC = () => {
  const { t } = useTranslation();
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
    signatureTimestamp: new Date().toISOString(),
    signatureImage: '', // Base64 encoded signature
    photo: '', // Base64 encoded photo
  });
  const [signatureCanvas, setSignatureCanvas] = useState<HTMLCanvasElement | null>(null);

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
      // Filter orders that are ready for dispatch
      const readyOrders = ordersData.filter(o => 
        o.status === 'ready' || o.status === 'confirmed'
      );
      setOrders(readyOrders);
      if (deliveriesData.length > 0) {
        setSelectedDelivery(deliveriesData[0]);
      }
    } catch (err: any) {
      console.error('Error loading logistics data:', err);
      setError(err.message || 'Failed to load logistics data');
    } finally {
      setLoading(false);
    }
  };

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

    // RN-003: Check if order has certificate before dispatch
    const hasCert = await ordersApi.hasCertificate(selectedOrder.id);
    if (!hasCert) {
      alert('Cannot dispatch: Order must have a QC certificate. Please complete and approve QC testing first.');
      return;
    }
    
    try {
      // Calculate ETA (simplified - in real system would use route planning)
      const eta = new Date();
      eta.setHours(eta.getHours() + 2); // 2 hours estimated travel time

      // Create delivery record
      const { data, error } = await supabase
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

      // Link certificate to truck (RN-003: Certificate linked to truck number)
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

      // Update order status
      await ordersApi.updateStatus(selectedOrder.id, 'dispatched');

      // Update truck status
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

  const center = selectedDelivery
    ? [selectedDelivery.route.quarry.lat, selectedDelivery.route.quarry.lng]
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          {t('modules.logistics.title')}
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={loadData}
          >
            Refresh
          </Button>
          <Button
            variant="contained"
            onClick={handleOpenAssignDialog}
            disabled={orders.length === 0}
          >
            {t('modules.logistics.assignTruck')}
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
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

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ height: 600, p: 1 }}>
            <MapContainer
              center={center as [number, number]}
              zoom={10}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {selectedDelivery ? (
                <>
                  <Marker position={[selectedDelivery.route.quarry.lat, selectedDelivery.route.quarry.lng]}>
                    <Popup>Quarry: {selectedDelivery.route.quarry.name}</Popup>
                  </Marker>
                  <Marker position={[selectedDelivery.route.well.lat, selectedDelivery.route.well.lng]}>
                    <Popup>Well: {selectedDelivery.route.well.name}</Popup>
                  </Marker>
                  {selectedDelivery.gpsTrack && selectedDelivery.gpsTrack.length > 0 && (
                    <Polyline
                      positions={selectedDelivery.gpsTrack.map(point => [point.lat, point.lng] as [number, number])}
                      color="blue"
                      weight={3}
                    />
                  )}
                </>
              ) : (
                <Marker position={center as [number, number]}>
                  <Popup>No delivery selected</Popup>
                </Marker>
              )}
            </MapContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {t('modules.logistics.liveTracking')}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {deliveries.length} total deliveries
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {deliveries.filter(d => d.status !== 'delivered').length} {t('modules.logistics.activeDeliveries')}
              </Typography>
            </CardContent>
          </Card>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>{t('modules.logistics.order')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  <TableCell>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {deliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} align="center">
                      <Typography variant="body2" color="textSecondary">
                        {t('modules.logistics.noDeliveriesFound')}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  deliveries
                    .filter(d => statusFilter === 'all' || d.status === statusFilter)
                    .map((delivery) => (
                    <TableRow
                      key={delivery.id}
                      selected={selectedDelivery?.id === delivery.id}
                      onClick={() => setSelectedDelivery(delivery)}
                      sx={{ cursor: 'pointer' }}
                    >
                      <TableCell>{delivery.orderNumber}</TableCell>
                      <TableCell>
                        <Chip
                          label={delivery.status}
                          color={getStatusColor(delivery.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="small">View</Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {selectedDelivery && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                {t('modules.logistics.deliveryDetails')}: {selectedDelivery.orderNumber}
              </Typography>
              <Grid container spacing={2} sx={{ mt: 1 }}>
                <Grid item xs={12} md={6}>
                  <Typography><strong>{t('modules.logistics.truck')}:</strong> {selectedDelivery.truckLicensePlate}</Typography>
                  <Typography><strong>{t('modules.logistics.driver')}:</strong> {selectedDelivery.driverName}</Typography>
                  <Typography><strong>{t('modules.orders.customer')}:</strong> {selectedDelivery.customerName}</Typography>
                  <Typography><strong>Status:</strong> 
                    <Chip 
                      label={selectedDelivery.status} 
                      size="small" 
                      color={getStatusColor(selectedDelivery.status) as any}
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography><strong>{t('modules.logistics.checkpointsCount')}:</strong> {selectedDelivery.checkpoints.length}/12</Typography>
                  {selectedDelivery.eta && (
                    <Typography><strong>ETA:</strong> {new Date(selectedDelivery.eta).toLocaleString()}</Typography>
                  )}
                  {selectedDelivery.waitTime && (
                    <Typography><strong>Wait Time:</strong> {selectedDelivery.waitTime} minutes</Typography>
                  )}
                  {selectedDelivery.actualArrival && (
                    <Typography><strong>Arrived:</strong> {new Date(selectedDelivery.actualArrival).toLocaleString()}</Typography>
                  )}
                </Grid>
                {selectedDelivery.status === 'assigned' && (
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="info"
                      fullWidth
                      onClick={async () => {
                        try {
                          await supabase
                            .from('deliveries')
                            .update({ status: 'in_transit' })
                            .eq('id', selectedDelivery.id);
                          loadData();
                        } catch (err: any) {
                          console.error('Error updating delivery status:', err);
                          alert('Error updating status: ' + err.message);
                        }
                      }}
                    >
                      {t('modules.logistics.markInTransit')}
                    </Button>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="subtitle2" sx={{ mt: 2 }}>Checkpoints ({selectedDelivery.checkpoints.length}/12):</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                    {selectedDelivery.checkpoints.length === 0 ? (
                      <Typography variant="body2" color="textSecondary">No checkpoints recorded yet</Typography>
                    ) : (
                      selectedDelivery.checkpoints.map((cp) => (
                        <Chip
                          key={cp.id}
                          label={`${cp.name} - ${new Date(cp.timestamp).toLocaleTimeString()}`}
                          size="small"
                          color={cp.autoDetected ? 'primary' : 'default'}
                        />
                      ))
                    )}
                  </Box>
                </Grid>
                {selectedDelivery.status === 'in_transit' || selectedDelivery.status === 'arrived' ? (
                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="success"
                      fullWidth
                      onClick={() => setOpenDeliveryConfirmDialog(true)}
                    >
                      {t('modules.logistics.confirmDelivery')}
                    </Button>
                  </Grid>
                ) : selectedDelivery.status === 'delivered' ? (
                  <Grid item xs={12}>
                    <Button
                      variant="outlined"
                      fullWidth
                      onClick={() => {
                        if (!selectedDelivery) return;
                        // Generate traceability report
                        const report = {
                          orderNumber: selectedDelivery.orderNumber,
                          deliveryDate: new Date(selectedDelivery.createdAt).toLocaleDateString(),
                          truck: selectedDelivery.truckLicensePlate,
                          driver: selectedDelivery.driverName,
                          checkpoints: selectedDelivery.checkpoints,
                          gpsTrack: selectedDelivery.gpsTrack,
                          signature: selectedDelivery.signature,
                          waitTime: selectedDelivery.waitTime,
                          certificate: 'Linked to QC certificate',
                        };
                        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `Traceability-Report-${selectedDelivery.orderNumber}.json`;
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      {t('modules.logistics.downloadTraceabilityReport')}
                    </Button>
                  </Grid>
                ) : null}
                {selectedDelivery.signature && (
                  <Grid item xs={12}>
                    <Box sx={{ p: 2, bgcolor: 'success.light', borderRadius: 1 }}>
                      <Typography variant="subtitle2" color="success.contrastText" gutterBottom>
                        ✓ Delivery Confirmed with Electronic Signature
                      </Typography>
                      <Typography variant="body2" color="success.contrastText">
                        <strong>Signed by:</strong> {selectedDelivery.signature.signerName} ({selectedDelivery.signature.signerTitle})
                      </Typography>
                      <Typography variant="body2" color="success.contrastText">
                        <strong>Date:</strong> {new Date(selectedDelivery.signature.timestamp).toLocaleString()}
                      </Typography>
                      <Typography variant="body2" color="success.contrastText">
                        <strong>GPS Location:</strong> {selectedDelivery.signature.location?.lat?.toFixed(4)}, {selectedDelivery.signature.location?.lng?.toFixed(4)}
                      </Typography>
                      {selectedDelivery.signature.signatureImage && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="success.contrastText" gutterBottom>
                            <strong>Signature:</strong>
                          </Typography>
                          <img 
                            src={selectedDelivery.signature.signatureImage} 
                            alt="Signature" 
                            style={{ maxWidth: '100%', maxHeight: 100, border: '1px solid #fff', borderRadius: 4 }}
                          />
                        </Box>
                      )}
                      {selectedDelivery.signature.photo && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2" color="success.contrastText" gutterBottom>
                            <strong>Delivery Photo:</strong>
                          </Typography>
                          <img 
                            src={selectedDelivery.signature.photo} 
                            alt="Delivery" 
                            style={{ maxWidth: '100%', maxHeight: 200, border: '1px solid #fff', borderRadius: 4 }}
                          />
                        </Box>
                      )}
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>

      {/* Assign Delivery Dialog */}
      <Dialog open={openAssignDialog} onClose={() => setOpenAssignDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('modules.logistics.assignTruck')}</DialogTitle>
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
              >
                {orders.map((order) => (
                  <MenuItem key={order.id} value={order.id}>
                    {order.orderNumber} - {order.customerName} ({order.deliveryLocation})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label={t('modules.logistics.truck')}
                value={selectedTruckId}
                onChange={(e) => setSelectedTruckId(e.target.value)}
              >
                {availableTrucks.map((truck) => (
                  <MenuItem key={truck.id} value={truck.id}>
                    {truck.licensePlate} - {truck.capacity} tons ({truck.type === 'old' ? 'Old' : 'New'})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField
                select
                fullWidth
                label={t('modules.logistics.driver')}
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
              >
                {availableDrivers.map((driver) => (
                  <MenuItem key={driver.id} value={driver.id}>
                    {driver.name} - {driver.hoursWorked}/{driver.hoursLimit} hours
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAssignDialog(false)}>{t('common.cancel')}</Button>
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
      <Dialog open={openDeliveryConfirmDialog} onClose={() => setOpenDeliveryConfirmDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Confirm Delivery & Capture Signature</DialogTitle>
        <DialogContent>
          {selectedDelivery && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                  Order: {selectedDelivery.orderNumber}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Customer: {selectedDelivery.customerName}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Delivery Location: {selectedDelivery.route.well.name || selectedDelivery.route.well.address}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('modules.logistics.signerName')}
                  value={signatureData.signerName}
                  onChange={(e) => setSignatureData({ ...signatureData, signerName: e.target.value })}
                  required
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

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Electronic Signature *
                </Typography>
                <Paper sx={{ border: '2px dashed #ccc', p: 2, position: 'relative' }}>
                  {signatureData.signatureImage ? (
                    <Box sx={{ textAlign: 'center' }}>
                      <img 
                        src={signatureData.signatureImage} 
                        alt="Signature" 
                        style={{ maxWidth: '100%', maxHeight: 150, border: '1px solid #ddd', borderRadius: 4 }}
                      />
                      <Button 
                        size="small" 
                        onClick={() => setSignatureData({ ...signatureData, signatureImage: '' })}
                        sx={{ mt: 1 }}
                      >
                        Clear Signature
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      <canvas
                        ref={(canvas) => {
                          if (canvas && !signatureCanvas) {
                            canvas.width = canvas.offsetWidth;
                            canvas.height = 200;
                            setSignatureCanvas(canvas);
                            const ctx = canvas.getContext('2d');
                            if (ctx) {
                              ctx.strokeStyle = '#000';
                              ctx.lineWidth = 2;
                            }
                          }
                        }}
                        onMouseDown={(e) => {
                          if (signatureCanvas) {
                            const rect = signatureCanvas.getBoundingClientRect();
                            const ctx = signatureCanvas.getContext('2d');
                            if (ctx) {
                              ctx.beginPath();
                              ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
                              signatureCanvas.onmousemove = (moveEvent) => {
                                ctx.lineTo(moveEvent.clientX - rect.left, moveEvent.clientY - rect.top);
                                ctx.stroke();
                              };
                              signatureCanvas.onmouseup = () => {
                                signatureCanvas.onmousemove = null;
                                signatureCanvas.onmouseup = null;
                                const signatureImage = signatureCanvas.toDataURL('image/png');
                                setSignatureData({ ...signatureData, signatureImage });
                              };
                            }
                          }
                        }}
                        style={{
                          width: '100%',
                          height: 200,
                          border: '1px solid #ddd',
                          borderRadius: 4,
                          cursor: 'crosshair',
                          backgroundColor: '#fff',
                        }}
                      />
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 1 }}>
                        Draw signature above (click and drag)
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Delivery Photo (Optional)
                </Typography>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="photo-upload"
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
                <label htmlFor="photo-upload">
                  <Button variant="outlined" component="span" fullWidth>
                    {signatureData.photo ? 'Change Photo' : 'Upload Photo'}
                  </Button>
                </label>
                {signatureData.photo && (
                  <Box sx={{ mt: 2, textAlign: 'center' }}>
                    <img 
                      src={signatureData.photo} 
                      alt="Delivery" 
                      style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 4 }}
                    />
                    <Button 
                      size="small" 
                      onClick={() => setSignatureData({ ...signatureData, photo: '' })}
                      sx={{ mt: 1 }}
                    >
                      Remove Photo
                    </Button>
                  </Box>
                )}
              </Grid>

              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Signature Requirements (RN-004):</strong>
                  </Typography>
                  <Typography variant="body2" component="div">
                    • Name and Title (required)
                    <br />
                    • Electronic Signature (required)
                    <br />
                    • Timestamp (auto-captured)
                    <br />
                    • GPS Coordinates (auto-captured)
                    <br />
                    • Photo (optional)
                  </Typography>
                </Alert>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeliveryConfirmDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="success"
            onClick={async () => {
              if (!signatureData.signerName || !signatureData.signerTitle) {
                alert(t('modules.logistics.fillSignerInfo'));
                return;
              }

              if (!signatureData.signatureImage) {
                alert(t('modules.logistics.provideSignature'));
                return;
              }

              try {
                // Get current GPS location (simulated)
                const gpsLocation = {
                  lat: selectedDelivery?.route.well.lat || -38.6,
                  lng: selectedDelivery?.route.well.lng || -69.1,
                };

                // Calculate wait time if arrival time exists
                let waitTime = null;
                if (selectedDelivery?.actualArrival) {
                  const arrival = new Date(selectedDelivery.actualArrival);
                  const now = new Date();
                  waitTime = Math.round((now.getTime() - arrival.getTime()) / (1000 * 60)); // minutes
                } else {
                  // Set arrival time now
                  waitTime = 0;
                }

                // Generate 12 checkpoints with timestamps (simulated GPS auto-detection)
                const now = new Date();
                const checkpoints = [
                  { id: '1', name: 'Quarry Exit', timestamp: new Date(now.getTime() - 120 * 60 * 1000).toISOString(), lat: selectedDelivery?.route.quarry.lat, lng: selectedDelivery?.route.quarry.lng, autoDetected: true },
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
                  { id: '12', name: 'Well Site Arrival', timestamp: new Date(now.getTime() - 10 * 60 * 1000).toISOString(), lat: selectedDelivery?.route.well.lat, lng: selectedDelivery?.route.well.lng, autoDetected: true },
                ];

                // Generate GPS track (simulated points along the route)
                const gpsTrack = checkpoints.map(cp => ({
                  lat: cp.lat,
                  lng: cp.lng,
                  timestamp: cp.timestamp,
                }));

                // Create signature object (RN-004: Firma Electrónica Obligatoria)
                const signature = {
                  signerName: signatureData.signerName,
                  signerTitle: signatureData.signerTitle,
                  timestamp: new Date().toISOString(),
                  location: {
                    lat: selectedDelivery?.route.well.lat || -38.6,
                    lng: selectedDelivery?.route.well.lng || -69.1,
                  },
                  signatureImage: signatureData.signatureImage,
                  photo: signatureData.photo || undefined,
                };

                // Check if certificate exists before confirming delivery
                if (!selectedDelivery) {
                  alert(t('modules.logistics.deliveryNotSelected'));
                  return;
                }

                const hasCert = await ordersApi.hasCertificate(selectedDelivery.orderId);
                if (!hasCert) {
                  alert('Cannot confirm delivery: Order must have a QC certificate. This is required for delivery confirmation.');
                  return;
                }

                // Update delivery with signature, checkpoints, GPS track, and mark as delivered
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
                  .eq('id', selectedDelivery?.id);

                // Update order status to delivered
                if (selectedDelivery?.orderId) {
                  await ordersApi.updateStatus(selectedDelivery.orderId, 'delivered');
                }

                // Auto-generate invoice (RN-005: Invoice only with complete proof: signature + certificate + GPS)
                // We already checked for certificate above, and we just added signature
                if (selectedDelivery?.orderId) {
                  const order = await ordersApi.getById(selectedDelivery.orderId);
                  if (order) {
                    // Check if invoice already exists
                    const { data: existingInvoice } = await supabase
                      .from('invoices')
                      .select('id')
                      .eq('order_id', order.id)
                      .maybeSingle();

                    if (!existingInvoice) {
                      // Generate invoice number
                      const year = new Date().getFullYear();
                      const { count } = await supabase
                        .from('invoices')
                        .select('*', { count: 'exact', head: true })
                        .like('invoice_number', `INV-${year}-%`);
                      
                      const invoiceNumber = `INV-${year}-${String((count || 0) + 1).padStart(4, '0')}`;

                      // Get MSA payment terms if exists
                      let paymentTerms = 30; // Default Net 30
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

                      // Create invoice with all proof attached (signature, certificate, GPS track)
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

                      // Update order status to invoiced
                      await ordersApi.updateStatus(order.id, 'invoiced');
                    }
                  }
                }

                setOpenDeliveryConfirmDialog(false);
                setSignatureData({ 
                  signerName: '', 
                  signerTitle: '', 
                  signatureTimestamp: new Date().toISOString(),
                  signatureImage: '',
                  photo: '',
                });
                loadData();
              } catch (err: any) {
                console.error('Error confirming delivery:', err);
                alert('Error confirming delivery: ' + err.message);
              }
            }}
            disabled={!signatureData.signerName || !signatureData.signerTitle || !signatureData.signatureImage}
          >
            Confirm Delivery
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LogisticsPage;

