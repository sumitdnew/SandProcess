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
} from '@mui/material';
import { trucksApi, driversApi } from '../services/api';
import { Truck, Driver, TruckStatus } from '../types';
import StatusChip from '../theme/StatusChip';
import PageHeader from '../theme/PageHeader';

const FleetPage: React.FC = () => {
  const { t } = useTranslation();
  const [trucks, setTrucks] = useState<Truck[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [selectedTruck, setSelectedTruck] = useState<Truck | null>(null);
  const [openDialog, setOpenDialog] = useState(false);

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
    };
    return colors[status] || 'default';
  };

  const handleViewTruck = (truck: Truck) => {
    setSelectedTruck(truck);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedTruck(null);
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
      <PageHeader title={t('modules.fleet.title')} />

      {error && (
        <Alert className="animate-slide-in-up" severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
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
                    <TableCell>{truck.type === 'old' ? 'Old (25-26t)' : 'New (50-55t)'}</TableCell>
                    <TableCell>
                      <StatusChip status={truck.status} />
                    </TableCell>
                    <TableCell>
                      <Button size="small" onClick={() => handleViewTruck(truck)}>
                        {t('common.view')}
                      </Button>
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

      <Dialog className="animate-fade-in" open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
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
                  <StatusChip status={selectedTruck.status} sx={{ ml: 1 }} />
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
    </Box>
  );
};

export default FleetPage;

