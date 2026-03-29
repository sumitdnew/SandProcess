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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { trucksApi, driversApi } from '../services/api';
import { Truck, Driver, TruckStatus } from '../types';

const FleetPage: React.FC = () => {
  const { t } = useTranslation();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [createSaving, setCreateSaving] = useState(false);
  const [newTruck, setNewTruck] = useState({
    licensePlate: '',
    capacity: 25,
    type: 'old' as 'old' | 'new',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [trucksData, driversData] = await Promise.all([
        trucksApi.getAll(),
        driversApi.getAll(),
      ]);
      setTrucks(trucksData);
      setDrivers(driversData);
    } catch (err: any) {
      console.error('Error loading fleet data:', err);
      setError(err.message || 'Failed to load fleet data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: TruckStatus) => {
    const colors: Record<TruckStatus, string> = {
      available: 'success',
      assigned: 'info',
      in_transit: 'warning',
      loading: 'warning',
      delivering: 'warning',
      returning: 'info',
      maintenance: 'error',
      broken_down: 'error',
      stuck: 'error',
    };
    return colors[status] || 'default';
  };

  const handleMarkBreakdown = async (truck: Truck, status: 'broken_down' | 'stuck') => {
    try {
      await trucksApi.updateStatus(truck.id, status);
      await loadData();
    } catch (e: any) {
      setError(e?.message || 'Failed to update truck status.');
    }
  };

  const handleViewTruck = (truck: Truck) => {
    setSelectedTruck(truck);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTruck(null);
  };

  const handleOpenCreateDialog = () => {
    setNewTruck({ licensePlate: '', capacity: 25, type: 'old' });
    setOpenCreateDialog(true);
  };

  const handleCreateTruck = async () => {
    if (!newTruck.licensePlate.trim()) {
      setError(t('modules.fleet.licensePlateRequired'));
      return;
    }
    try {
      setCreateSaving(true);
      setError(null);
      await trucksApi.create(newTruck);
      setOpenCreateDialog(false);
      loadData();
    } catch (err: any) {
      setError(err.message || t('modules.fleet.errorCreatingTruck'));
    } finally {
      setCreateSaving(false);
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ mb: 0 }}>
          {t('modules.fleet.title')}
        </Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpenCreateDialog}>
          {t('modules.fleet.addTruck')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ mt: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label={t('modules.fleet.trucks')} />
          <Tab label={t('modules.fleet.drivers')} />
        </Tabs>

        {tabValue === 0 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>{t('modules.fleet.licensePlate')}</TableCell>
                  <TableCell>{t('modules.fleet.capacity')}</TableCell>
                  <TableCell>{t('modules.fleet.type')}</TableCell>
                  <TableCell>{t('common.status')}</TableCell>
                  <TableCell>{t('common.actions')}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trucks.map((truck) => (
                  <TableRow key={truck.id}>
                    <TableCell>{truck.licensePlate}</TableCell>
                    <TableCell>{truck.capacity} tons</TableCell>
                    <TableCell>{truck.type === 'old' ? t('modules.fleet.oldCapacity') : t('modules.fleet.newCapacity')}</TableCell>
                    <TableCell>
                      <Chip
                        label={t(`truckStatus.${truck.status}`)}
                        color={getStatusColor(truck.status) as any}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleViewTruck(truck)} sx={{ mr: 1 }}>
                        {t('common.view')}
                      </Button>
                      {(truck.status === 'assigned' || truck.status === 'in_transit' || truck.status === 'delivering') && (
                        <>
                          <Button
                            size="small"
                            color="error"
                            variant="outlined"
                            onClick={() => handleMarkBreakdown(truck, 'broken_down')}
                          >
                            Report broken down
                          </Button>
                          <Button
                            size="small"
                            color="warning"
                            variant="outlined"
                            onClick={() => handleMarkBreakdown(truck, 'stuck')}
                            sx={{ ml: 0.5 }}
                          >
                            Mark stuck
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {tabValue === 1 && (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>License Number</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Hours Worked</TableCell>
                  <TableCell>Hours Limit</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {drivers.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>{driver.name}</TableCell>
                    <TableCell>{driver.licenseNumber}</TableCell>
                    <TableCell>{driver.phone}</TableCell>
                    <TableCell>{driver.hoursWorked}</TableCell>
                    <TableCell>{driver.hoursLimit}</TableCell>
                    <TableCell>
                      <Chip
                        label={driver.available ? t('modules.fleet.available') : t('modules.fleet.unavailable')}
                        color={driver.available ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          Truck: {selectedTruck?.licensePlate}
        </DialogTitle>
        <DialogContent>
          {selectedTruck && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <Typography><strong>{t('modules.fleet.licensePlate')}:</strong> {selectedTruck.licensePlate}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>{t('modules.fleet.capacity')}:</strong> {selectedTruck.capacity} tons</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>{t('modules.fleet.type')}:</strong> {selectedTruck.type === 'old' ? 'Old (25-26t)' : 'New (50-55t)'}</Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography><strong>{t('common.status')}:</strong>
                  <Chip
                    label={t(`truckStatus.${selectedTruck.status}`)}
                    color={getStatusColor(selectedTruck.status) as any}
                    size="small"
                    sx={{ ml: 1 }}
                  />
                </Typography>
              </Grid>
              {selectedTruck.driverName && (
                <Grid item xs={12}>
                  <Typography><strong>Driver:</strong> {selectedTruck.driverName}</Typography>
                </Grid>
              )}
              {selectedTruck.lastMaintenance && (
                <Grid item xs={12}>
                  <Typography><strong>Last Maintenance:</strong> {new Date(selectedTruck.lastMaintenance).toLocaleDateString()}</Typography>
                </Grid>
              )}
              {selectedTruck.nextMaintenance && (
                <Grid item xs={12}>
                  <Typography>
                    <strong>Next Maintenance:</strong> 
                    <Chip
                      label={new Date(selectedTruck.nextMaintenance).toLocaleDateString()}
                      color={new Date(selectedTruck.nextMaintenance) < new Date() ? 'error' : 'default'}
                      size="small"
                      sx={{ ml: 1 }}
                    />
                  </Typography>
                </Grid>
              )}
              {selectedTruck.driverName && (
                <Grid item xs={12}>
                  <Typography><strong>Driver:</strong> {selectedTruck.driverName}</Typography>
                </Grid>
              )}
              {selectedTruck.lastMaintenance && (
                <Grid item xs={12}>
                  <Typography><strong>Last Maintenance:</strong> {new Date(selectedTruck.lastMaintenance).toLocaleDateString()}</Typography>
                </Grid>
              )}
              {selectedTruck.nextMaintenance && (
                <Grid item xs={12}>
                  <Typography><strong>Next Maintenance:</strong> {new Date(selectedTruck.nextMaintenance).toLocaleDateString()}</Typography>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>{t('common.cancel')}</Button>
        </DialogActions>
      </Dialog>

      {/* Create Truck Dialog */}
      <Dialog open={openCreateDialog} onClose={() => setOpenCreateDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('modules.fleet.createTruck')}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label={t('modules.fleet.licensePlate')}
                value={newTruck.licensePlate}
                onChange={(e) => setNewTruck({ ...newTruck, licensePlate: e.target.value })}
                placeholder="e.g. ABC-123"
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                type="number"
                label={t('modules.fleet.capacity')}
                value={newTruck.capacity}
                onChange={(e) => setNewTruck({ ...newTruck, capacity: parseInt(e.target.value, 10) || 25 })}
                inputProps={{ min: 1, max: 150 }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                select
                label={t('modules.fleet.type')}
                value={newTruck.type}
                onChange={(e) => setNewTruck({ ...newTruck, type: e.target.value as 'old' | 'new' })}
              >
                <MenuItem value="old">{t('modules.fleet.oldCapacity')}</MenuItem>
                <MenuItem value="new">{t('modules.fleet.newCapacity')}</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>{t('common.cancel')}</Button>
          <Button onClick={handleCreateTruck} variant="contained" disabled={createSaving}>
            {createSaving ? t('common.loading') : t('modules.fleet.createTruck')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FleetPage;

