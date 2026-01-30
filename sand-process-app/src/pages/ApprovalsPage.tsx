import React, { useState, useEffect, useCallback } from 'react';
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
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useTranslation } from 'react-i18next';
import PageHeader from '../theme/PageHeader';
import { assignmentRequestsApi, redirectRequestsApi } from '../services/api';
import { useApp } from '../context/AppContext';
import { AssignmentRequest, RedirectRequest } from '../types';

type PendingItem =
  | { type: 'assignment'; id: string; req: AssignmentRequest }
  | { type: 'redirect'; id: string; req: RedirectRequest };

const ApprovalsPage: React.FC = () => {
  const { t } = useTranslation();
  const { currentUser, currentRole } = useApp();
  const [pending, setPending] = useState<PendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    item: PendingItem | null;
    reason: string;
  }>({ open: false, item: null, reason: '' });
  const [acting, setActing] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [assignments, redirects] = await Promise.all([
        assignmentRequestsApi.getAll({ status: 'pending_approval' }).catch(() => [] as AssignmentRequest[]),
        redirectRequestsApi.getAll().then((all) =>
          all.filter((r) => ['pending_approval', 'pending_jefatura', 'pending_gerencia'].includes(r.status))
        ).catch(() => [] as RedirectRequest[]),
      ]);
      const list: PendingItem[] = [
        ...assignments.map((r) => ({ type: 'assignment' as const, id: `a-${r.id}`, req: r })),
        ...redirects.map((r) => ({ type: 'redirect' as const, id: `r-${r.id}`, req: r })),
      ].sort((a, b) => {
        const ta = a.req.requestedAt ? new Date(a.req.requestedAt).getTime() : 0;
        const tb = b.req.requestedAt ? new Date(b.req.requestedAt).getTime() : 0;
        return tb - ta;
      });
      setPending(list);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('modules.approvals.errorLoad'));
      setPending([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [load]);

  const canApprove = (currentRole === 'operations_manager' || currentRole === 'jefatura' || currentRole === 'admin') && !!currentUser;

  const handleApprove = async (item: PendingItem) => {
    if (!currentUser || !canApprove) return;
    setActing(true);
    setError(null);
    try {
      if (item.type === 'assignment') {
        await assignmentRequestsApi.approve(item.req.id, currentUser.id);
      } else {
        await redirectRequestsApi.approve(item.req.id, currentUser.id);
      }
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Approve failed.');
    } finally {
      setActing(false);
    }
  };

  const handleRejectClick = (item: PendingItem) => {
    setRejectDialog({ open: true, item, reason: '' });
  };

  const handleRejectConfirm = async () => {
    const { item, reason } = rejectDialog;
    if (!item) return;
    setActing(true);
    setError(null);
    try {
      if (item.type === 'assignment') {
        await assignmentRequestsApi.reject(item.req.id, reason || null);
      } else {
        await redirectRequestsApi.reject(item.req.id, reason || null);
      }
      setRejectDialog({ open: false, item: null, reason: '' });
      await load();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t('modules.approvals.errorReject'));
    } finally {
      setActing(false);
    }
  };

  return (
    <Box>
      <PageHeader
        title={t('modules.approvals.title')}
        subtitle="Approve assignment and redirect requests from the dispatcher."
        action={
          <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
            {t('common.refresh')}
          </Button>
        }
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <TableContainer component={Paper}>
        <Typography variant="subtitle1" fontWeight={600} sx={{ px: 2, py: 1 }}>
          Pending approval
        </Typography>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Order</TableCell>
              <TableCell>{t('modules.approvals.truck')}</TableCell>
              <TableCell>{t('modules.approvals.requestedBy')}</TableCell>
              <TableCell>{t('modules.approvals.date')}</TableCell>
              {canApprove && <TableCell align="right">{t('modules.approvals.actions')}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : pending.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No pending requests.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              pending.map((it) => {
                const r = it.req;
                const orderLabel = it.type === 'assignment'
                  ? ((r as AssignmentRequest).orderNumber ?? (r as AssignmentRequest).orderId)
                  : `${(r as RedirectRequest).fromOrderNumber ?? (r as RedirectRequest).fromOrderId} → ${(r as RedirectRequest).toOrderNumber ?? (r as RedirectRequest).toOrderId}`;
                return (
                  <TableRow key={it.id}>
                    <TableCell>{it.type === 'assignment' ? 'Assignment' : 'Redirect'}</TableCell>
                    <TableCell>{orderLabel}</TableCell>
                    <TableCell>{r.truckLabel ?? r.truckId ?? '—'}</TableCell>
                    <TableCell>{r.requestedByName ?? r.requestedBy}</TableCell>
                    <TableCell>{r.requestedAt ? new Date(r.requestedAt).toLocaleString() : '—'}</TableCell>
                    {canApprove && (
                      <TableCell align="right">
                        <Button
                          size="small"
                          color="primary"
                          variant="contained"
                          startIcon={<CheckCircleIcon />}
                          onClick={() => handleApprove(it)}
                          disabled={acting}
                          sx={{ mr: 1 }}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          variant="outlined"
                          startIcon={<CancelIcon />}
                          onClick={() => handleRejectClick(it)}
                          disabled={acting}
                        >
                          {t('modules.approvals.reject')}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={rejectDialog.open}
        onClose={() => setRejectDialog({ open: false, item: null, reason: '' })}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{t('modules.approvals.rejectTitle')}</DialogTitle>
        <DialogContent>
          {rejectDialog.item && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {rejectDialog.item.type === 'assignment'
                ? `Order ${rejectDialog.item.req.orderNumber ?? rejectDialog.item.req.orderId}`
                : `${(rejectDialog.item.req as RedirectRequest).fromOrderNumber ?? (rejectDialog.item.req as RedirectRequest).fromOrderId} → ${(rejectDialog.item.req as RedirectRequest).toOrderNumber ?? (rejectDialog.item.req as RedirectRequest).toOrderId}`}
            </Typography>
          )}
          <TextField
            fullWidth
            label={t('modules.approvals.rejectReason')}
            multiline
            rows={2}
            value={rejectDialog.reason}
            onChange={(e) => setRejectDialog((prev) => ({ ...prev, reason: e.target.value }))}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectDialog({ open: false, item: null, reason: '' })}>
            {t('common.cancel')}
          </Button>
          <Button color="error" variant="contained" onClick={handleRejectConfirm} disabled={acting}>
            {t('modules.approvals.reject')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ApprovalsPage;
