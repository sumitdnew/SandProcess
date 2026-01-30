import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Card,
  CardContent,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarehouseIcon from '@mui/icons-material/Warehouse';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import BuildIcon from '@mui/icons-material/Build';
import { RecommendationOption, RecommendationSourceType } from '../../types';
import { dispatcherApi } from '../../services/api';

const sourceLabels: Record<RecommendationSourceType, string> = {
  QUARRY_WAREHOUSE: 'Quarry warehouse',
  NEAR_WELL_WAREHOUSE: 'Near-well warehouse',
  TRUCK_IN_TRANSIT: 'Truck',
  PRODUCE: 'Produce',
};

interface BreakdownResolveDialogProps {
  open: boolean;
  truckId: string;
  truckLabel: string;
  orderId: string;
  orderNumber?: string;
  onClose: () => void;
  onSuccess: () => void;
}

const SourceIcon: React.FC<{ type: RecommendationSourceType }> = ({ type }) => {
  if (type === 'TRUCK_IN_TRANSIT') return <LocalShippingIcon fontSize="small" />;
  if (type === 'PRODUCE') return <BuildIcon fontSize="small" />;
  return <WarehouseIcon fontSize="small" />;
};

export const BreakdownResolveDialog: React.FC<BreakdownResolveDialogProps> = ({
  open,
  truckId,
  truckLabel,
  orderId,
  orderNumber,
  onClose,
  onSuccess,
}) => {
  const [options, setOptions] = useState<RecommendationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !truckId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    setSelectedId(null);
    dispatcherApi
      .getBreakdownRecommendations(truckId)
      .then((data) => {
        if (!cancelled) {
          setOptions(data);
          setSelectedId(data[0]?.id ?? null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Failed to load recommendations.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [open, truckId]);

  const selected = options.find((o) => o.id === selectedId);

  const handleConfirm = async () => {
    if (!orderId || !selected) return;
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        orderId,
        sourceType: selected.sourceType,
        sourceId: selected.sourceId,
        truckId: selected.truckId,
      };
      await dispatcherApi.applyBreakdownReplacement(orderId, truckId, payload);
      onSuccess();
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Replace failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Resolve breakdown: {truckLabel} (Order {orderNumber ?? orderId})
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box sx={{ pt: 1 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                {error}
              </Alert>
            )}
            {options.length === 0 ? (
              <Typography color="text.secondary">No replacement options available.</Typography>
            ) : (
              <FormControl component="fieldset" fullWidth>
                <RadioGroup value={selectedId ?? ''} onChange={(_, v) => setSelectedId(v)}>
                  {options.map((opt) => (
                    <Card
                      key={opt.id}
                      variant="outlined"
                      sx={{
                        mb: 1.5,
                        border: selectedId === opt.id ? 2 : 1,
                        borderColor: selectedId === opt.id ? 'primary.main' : 'divider',
                      }}
                    >
                      <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                        <FormControlLabel
                          value={opt.id}
                          control={<Radio />}
                          label={
                            <Box sx={{ ml: 0.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <SourceIcon type={opt.sourceType} />
                                <Typography variant="body2" fontWeight={600}>
                                  #{opt.rank} {sourceLabels[opt.sourceType]}
                                  {opt.sourceLabel && opt.sourceType !== 'TRUCK_IN_TRANSIT' && ` • ${opt.sourceLabel}`}
                                  {opt.truckLabel && ` • ${opt.truckLabel}`}
                                </Typography>
                              </Box>
                              <Typography variant="caption" color="text.secondary" display="block">
                                ETA: {opt.eta ? new Date(opt.eta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                                {opt.distanceKm != null && ` • ${opt.distanceKm} km`}
                                {opt.estimatedCost != null && ` • ~$${opt.estimatedCost}`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                {opt.reasonText}
                              </Typography>
                            </Box>
                          }
                        />
                      </CardContent>
                    </Card>
                  ))}
                </RadioGroup>
              </FormControl>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          startIcon={<CheckCircleIcon />}
          onClick={handleConfirm}
          disabled={loading || !selected || submitting || options.length === 0}
        >
          {submitting ? 'Applying…' : 'Confirm replacement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
