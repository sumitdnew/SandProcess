import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  CircularProgress,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { ordersApi, pickupReleasesApi } from '../services/api';
import { Order } from '../types';
import { getOrderStatusLabel } from '../utils/orderStatusLabel';

const ACCEPT_DOCS = 'image/*,.pdf,application/pdf';

const PickupReleasePage: React.FC = () => {
  const { t } = useTranslation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Order | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    emptyWeightTons: '',
    loadedWeightTons: '',
    driverName: '',
    driverLicenseNumber: '',
    driverIdDocument: '',
    vehiclePlate: '',
    notes: '',
  });
  const [dniFile, setDniFile] = useState<File | null>(null);
  const [licenseFile, setLicenseFile] = useState<File | null>(null);
  const [otherFiles, setOtherFiles] = useState<File[]>([]);

  const dniInputRef = useRef<HTMLInputElement>(null);
  const licenseInputRef = useRef<HTMLInputElement>(null);
  const otherInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const all = await ordersApi.getAll();
      setOrders(all);
    } catch (e: any) {
      setError(e?.message || t('modules.pickup.errorLoad'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eligible = useMemo(() => {
    return orders.filter(
      (o) =>
        o.fulfillmentType === 'pickup' &&
        ['ready', 'dispatched'].includes(o.status) &&
        !o.pickupRelease
    );
  }, [orders]);

  const openRelease = (o: Order) => {
    setSelected(o);
    setForm({
      emptyWeightTons: '',
      loadedWeightTons: '',
      driverName: '',
      driverLicenseNumber: '',
      driverIdDocument: '',
      vehiclePlate: '',
      notes: '',
    });
    setDniFile(null);
    setLicenseFile(null);
    setOtherFiles([]);
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!selected) return;
    const empty = parseFloat(form.emptyWeightTons);
    const loaded = parseFloat(form.loadedWeightTons);
    if (Number.isNaN(empty) || Number.isNaN(loaded) || loaded < empty) {
      alert(t('modules.pickup.invalidWeights'));
      return;
    }
    if (!form.driverName.trim()) {
      alert(t('modules.pickup.driverNameRequired'));
      return;
    }
    setSubmitting(true);
    try {
      const hasDocs = !!(dniFile || licenseFile || otherFiles.length);
      await pickupReleasesApi.create({
        orderId: selected.id,
        emptyWeightTons: empty,
        loadedWeightTons: loaded,
        driverName: form.driverName.trim(),
        driverLicenseNumber: form.driverLicenseNumber.trim() || undefined,
        driverIdDocument: form.driverIdDocument.trim() || undefined,
        vehiclePlate: form.vehiclePlate.trim() || undefined,
        notes: form.notes.trim() || undefined,
        files: hasDocs
          ? {
              dni: dniFile || undefined,
              driverLicense: licenseFile || undefined,
              other: otherFiles.length ? otherFiles : undefined,
            }
          : undefined,
      });
      setDialogOpen(false);
      setSelected(null);
      await load();
    } catch (e: any) {
      alert(e?.message || t('modules.pickup.errorSave'));
    } finally {
      setSubmitting(false);
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
      <Typography variant="h4" gutterBottom>
        {t('modules.pickup.title')}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t('modules.pickup.subtitle')}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t('modules.orders.orderNumber')}</TableCell>
                <TableCell>{t('modules.orders.customer')}</TableCell>
                <TableCell>{t('common.status')}</TableCell>
                <TableCell>{t('modules.pickup.pickupLocation')}</TableCell>
                <TableCell align="right">{t('common.actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {eligible.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    {t('modules.pickup.noEligible')}
                  </TableCell>
                </TableRow>
              ) : (
                eligible.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.orderNumber}</TableCell>
                    <TableCell>{o.customerName}</TableCell>
                    <TableCell>
                      <Chip size="small" label={getOrderStatusLabel(o, t)} />
                    </TableCell>
                    <TableCell>{o.pickupLocation || o.deliveryLocation}</TableCell>
                    <TableCell align="right">
                      <Button size="small" variant="contained" onClick={() => openRelease(o)}>
                        {t('modules.pickup.recordRelease')}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !submitting && setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{t('modules.pickup.dialogTitle')}</DialogTitle>
        <DialogContent>
          {selected && (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  {selected.orderNumber} · {selected.customerName}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  label={t('modules.pickup.emptyWeight')}
                  type="number"
                  value={form.emptyWeightTons}
                  onChange={(e) => setForm({ ...form, emptyWeightTons: e.target.value })}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  required
                  label={t('modules.pickup.loadedWeight')}
                  type="number"
                  value={form.loadedWeightTons}
                  onChange={(e) => setForm({ ...form, loadedWeightTons: e.target.value })}
                  inputProps={{ min: 0, step: 0.01 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label={t('modules.pickup.driverName')}
                  value={form.driverName}
                  onChange={(e) => setForm({ ...form, driverName: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('modules.pickup.driverLicense')}
                  value={form.driverLicenseNumber}
                  onChange={(e) => setForm({ ...form, driverLicenseNumber: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label={t('modules.pickup.driverDni')}
                  value={form.driverIdDocument}
                  onChange={(e) => setForm({ ...form, driverIdDocument: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('modules.pickup.vehiclePlate')}
                  value={form.vehiclePlate}
                  onChange={(e) => setForm({ ...form, vehiclePlate: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label={t('common.optional')}
                  multiline
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle2" gutterBottom>
                  {t('modules.pickup.documentsSection')}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1.5 }}>
                  {t('modules.pickup.documentsHint')}
                </Typography>

                <input
                  ref={dniInputRef}
                  type="file"
                  accept={ACCEPT_DOCS}
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setDniFile(f);
                    e.target.value = '';
                  }}
                />
                <input
                  ref={licenseInputRef}
                  type="file"
                  accept={ACCEPT_DOCS}
                  hidden
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) setLicenseFile(f);
                    e.target.value = '';
                  }}
                />
                <input
                  ref={otherInputRef}
                  type="file"
                  accept={ACCEPT_DOCS}
                  hidden
                  multiple
                  onChange={(e) => {
                    const list = e.target.files;
                    if (list?.length) {
                      setOtherFiles((prev) => [...prev, ...Array.from(list)]);
                    }
                    e.target.value = '';
                  }}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Button size="small" variant="outlined" onClick={() => dniInputRef.current?.click()}>
                      {t('modules.pickup.uploadDni')}
                    </Button>
                    {dniFile && (
                      <Chip size="small" label={dniFile.name} onDelete={() => setDniFile(null)} />
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Button size="small" variant="outlined" onClick={() => licenseInputRef.current?.click()}>
                      {t('modules.pickup.uploadLicenseDoc')}
                    </Button>
                    {licenseFile && (
                      <Chip size="small" label={licenseFile.name} onDelete={() => setLicenseFile(null)} />
                    )}
                  </Box>
                  <Box>
                    <Button size="small" variant="outlined" onClick={() => otherInputRef.current?.click()}>
                      {t('modules.pickup.addOtherDocuments')}
                    </Button>
                    {otherFiles.length > 0 && (
                      <List dense sx={{ mt: 1 }}>
                        {otherFiles.map((f, idx) => (
                          <ListItem
                            key={`${f.name}-${idx}`}
                            secondaryAction={
                              <IconButton edge="end" size="small" onClick={() => setOtherFiles((prev) => prev.filter((_, i) => i !== idx))}>
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            }
                          >
                            <ListItemText primary={f.name} primaryTypographyProps={{ variant: 'body2' }} />
                          </ListItem>
                        ))}
                      </List>
                    )}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} disabled={submitting}>
            {t('common.cancel')}
          </Button>
          <Button variant="contained" onClick={handleSubmit} disabled={submitting}>
            {submitting ? t('common.loading') : t('modules.pickup.confirmRelease')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PickupReleasePage;
