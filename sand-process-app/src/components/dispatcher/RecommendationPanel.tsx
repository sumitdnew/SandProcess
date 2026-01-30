import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
  Alert,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Warehouse as WarehouseIcon, LocalShipping as TruckIcon, Build as BuildIcon } from '@mui/icons-material';
import { RecommendationOption, RecommendationSourceType } from '../../types';
import { useNavigate } from 'react-router-dom';
import { dispatcherApi, ordersApi, assignmentRequestsApi, redirectRequestsApi, qcTestsApi } from '../../services/api';
import { useApp } from '../../context/AppContext';
import type { QCTest } from '../../types';

interface RecommendationPanelProps {
  orderId: string | null;
  orderNumber?: string | null;
  orderStatus?: string | null;
  onAssignSuccess: () => void;
}

const sourceLabels: Record<RecommendationSourceType, string> = {
  QUARRY_WAREHOUSE: 'Quarry Warehouse',
  NEAR_WELL_WAREHOUSE: 'On-Site Warehouse',
  TRUCK_IN_TRANSIT: 'Redirect',
  PRODUCE: 'Produce',
};

const SourceIcon: React.FC<{ type: RecommendationSourceType }> = ({ type }) => {
  if (type === 'TRUCK_IN_TRANSIT') return <TruckIcon fontSize="small" />;
  if (type === 'PRODUCE') return <BuildIcon fontSize="small" />;
  return <WarehouseIcon fontSize="small" />;
};

export const RecommendationPanel: React.FC<RecommendationPanelProps> = ({ orderId, orderNumber, orderStatus, onAssignSuccess }) => {
  const navigate = useNavigate();
  const { currentUser } = useApp();
  const [options, setOptions] = useState<RecommendationOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [requestSubmitted, setRequestSubmitted] = useState(false);
  const [produceStarted, setProduceStarted] = useState(false);
  const [availableLots, setAvailableLots] = useState<QCTest[]>([]);

  useEffect(() => {
    if (!orderId) {
      setOptions([]);
      setSelectedId(null);
      setError(null);
      setRequestSubmitted(false);
      setProduceStarted(false);
      setAvailableLots([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    dispatcherApi
      .getOrderRecommendations(orderId)
      .then((data) => {
        if (!cancelled) {
          setOptions(data);
          const first = data.find((o) => !o.redirectUnavailable) ?? data[0];
          setSelectedId(first?.id ?? null);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || 'Failed to load recommendations.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [orderId]);

  useEffect(() => {
    if (!selectedId) {
      setAvailableLots([]);
      return;
    }
    const opt = options.find((o) => o.id === selectedId);
    const siteId =
      opt?.sourceType === 'NEAR_WELL_WAREHOUSE' ? 'near_well' :
      opt?.sourceType === 'QUARRY_WAREHOUSE' ? 'quarry' : undefined;
    if (!siteId) {
      setAvailableLots([]);
      return;
    }
    let cancelled = false;
    qcTestsApi.getAvailableLots(siteId).then((lots) => {
      if (!cancelled) setAvailableLots(lots);
    }).catch(() => {
      if (!cancelled) setAvailableLots([]);
    });
    return () => { cancelled = true; };
  }, [selectedId, options]);

  const selected = options.find((o) => o.id === selectedId);
  const canSubmit = selected && !selected.redirectUnavailable && !!currentUser;

  const handleSubmit = async () => {
    if (!orderId || !selected || !currentUser) return;
    setSubmitting(true);
    setError(null);
    setRequestSubmitted(false);
    setProduceStarted(false);
    try {
      if (selected.sourceType === 'PRODUCE') {
        if (orderStatus === 'pending') {
          await ordersApi.updateStatus(orderId, 'confirmed');
        }
        await ordersApi.updateStatus(orderId, 'in_production');
        setProduceStarted(true);
        onAssignSuccess();
      } else if (selected.isRedirect && selected.fromOrderId && selected.truckId) {
        await redirectRequestsApi.create({
          fromOrderId: selected.fromOrderId,
          fromOrderNumber: selected.fromOrderNumber ?? undefined,
          toOrderId: orderId,
          toOrderNumber: orderNumber ?? undefined,
          truckId: selected.truckId,
          truckLabel: selected.truckLabel ?? undefined,
          reason: selected.reasonText ?? undefined,
          impactOnOriginalOrder: selected.impactOnOriginalOrder ?? undefined,
          requestedBy: currentUser.id,
          requestedByName: currentUser.name ?? undefined,
        });
        setRequestSubmitted(true);
        onAssignSuccess();
      } else {
        await assignmentRequestsApi.create({
          orderId,
          sourceType: selected.sourceType,
          sourceId: selected.sourceId,
          sourceLabel: selected.sourceLabel ?? undefined,
          truckId: selected.truckId ?? undefined,
          truckLabel: selected.truckLabel ?? undefined,
          reason: selected.reasonText ?? undefined,
          requestedBy: currentUser.id,
          requestedByName: currentUser.name ?? undefined,
        });
        setRequestSubmitted(true);
        onAssignSuccess();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Submit failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!orderId) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography color="text.secondary">Select an order to see recommendations.</Typography>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography variant="subtitle1" fontWeight={600}>
        Recommendations
      </Typography>
      {error && (
        <Alert severity="error" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {requestSubmitted && (
        <Alert
          severity="success"
          action={
            <Button color="inherit" size="small" onClick={() => navigate('/approvals')}>
              Go to Approvals
            </Button>
          }
          onClose={() => setRequestSubmitted(false)}
        >
          Submitted for approval. Operations Manager approves → QC tests & certificate → Driver picks up.
        </Alert>
      )}
      {produceStarted && (
        <Alert severity="success" onClose={() => setProduceStarted(false)}>
          Production started. Order moved to Production.
        </Alert>
      )}
      {options.length === 0 ? (
        <Typography color="text.secondary">No recommendations available for this order.</Typography>
      ) : (
        <>
          <FormControl component="fieldset">
            <RadioGroup
              value={selectedId ?? ''}
              onChange={(_, v) => setSelectedId(v)}
            >
              {options.map((opt) => (
                <Card
                  key={opt.id}
                  variant="outlined"
                  sx={{
                    mb: 1.5,
                    border: selectedId === opt.id ? 2 : 1,
                    borderColor: selectedId === opt.id ? 'primary.main' : 'divider',
                    opacity: opt.redirectUnavailable ? 0.7 : 1,
                  }}
                >
                  <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <FormControlLabel
                      value={opt.id}
                      control={<Radio />}
                      disabled={!!opt.redirectUnavailable}
                      label={
                        <Box sx={{ ml: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <SourceIcon type={opt.sourceType} />
                            <Typography variant="body2" fontWeight={600}>
                              Option {opt.rank}: {opt.redirectUnavailable ? 'Redirect — not available' : sourceLabels[opt.sourceType]}
                              {!opt.redirectUnavailable && opt.sourceLabel && opt.sourceType !== 'TRUCK_IN_TRANSIT' && opt.sourceType !== 'PRODUCE' && ` • ${opt.sourceLabel}`}
                            </Typography>
                          </Box>
                          {!opt.redirectUnavailable && (
                            <>
                              <Typography variant="caption" color="text.secondary" display="block">
                                Inventory: {opt.inventoryAvailable === 'N/A' ? 'N/A' : `${opt.inventoryAvailable} tons`}
                                {opt.distanceKm != null && ` • ${opt.distanceKm} km`}
                                • ETA: {opt.etaMinutes != null ? `${opt.etaMinutes} min` : '—'}
                              </Typography>
                              {opt.trucksAvailable && opt.trucksAvailable.length > 0 && (
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Trucks: {opt.trucksAvailable.join(', ')}
                                </Typography>
                              )}
                              <Typography variant="caption" fontWeight={600} color={opt.canFulfill ? 'success.main' : 'error.main'} display="block">
                                {opt.canFulfill ? 'Can fulfill' : 'Cannot fulfill'}
                                {!opt.canFulfill && opt.cannotFulfillReason && ` — ${opt.cannotFulfillReason}`}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                                {opt.reasonText}
                              </Typography>
                              {opt.isRedirect && opt.impactOnOriginalOrder && (
                                <Typography variant="caption" color="warning.main" display="block" sx={{ mt: 0.5 }}>
                                  Redirect: {opt.impactOnOriginalOrder}
                                </Typography>
                              )}
                            </>
                          )}
                          {opt.redirectUnavailable && (
                            <Typography variant="caption" color="text.secondary">{opt.reasonText}</Typography>
                          )}
                        </Box>
                      }
                    />
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </FormControl>
          {selected?.isRedirect && selected?.impactOnOriginalOrder && (
            <Typography variant="body2" color="warning.main" sx={{ px: 0.5 }}>
              This is a redirect. {selected.impactOnOriginalOrder}
            </Typography>
          )}
          {selected && (selected.sourceType === 'NEAR_WELL_WAREHOUSE' || selected.sourceType === 'QUARRY_WAREHOUSE') && (
            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Available lots at this site (fulfillment)
              </Typography>
              {availableLots.length === 0 ? (
                <Typography variant="caption" color="text.secondary">
                  No passed-QC lots at this site. Produce to inventory and run QC to add lots.
                </Typography>
              ) : (
                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 180 }}>
                  <Table size="small" stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell>Lot</TableCell>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Quantity (t)</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {availableLots.map((lot) => (
                        <TableRow key={lot.id}>
                          <TableCell>{lot.lotNumber}</TableCell>
                          <TableCell>{lot.productName}</TableCell>
                          <TableCell align="right">{lot.quantity ?? '—'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}
          <Button
            variant="contained"
            startIcon={<CheckCircleIcon />}
            onClick={handleSubmit}
            disabled={!canSubmit || submitting}
            fullWidth
          >
            {submitting ? 'Submitting…' : selected?.redirectUnavailable ? 'Not available' : selected?.sourceType === 'PRODUCE' ? 'Start production' : 'Request approval'}
          </Button>
        </>
      )}
    </Box>
  );
};
