import React, { useState, useEffect } from 'react';
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
  MenuItem,
  CircularProgress,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RefreshIcon from '@mui/icons-material/Refresh';
import PageHeader from '../theme/PageHeader';
import { rulesApi } from '../services/api';
import { useApp } from '../context/AppContext';
import { Rule, RuleConditionField, RuleConditionOp, RuleActionType } from '../types';

const CONDITION_FIELDS: { value: RuleConditionField; label: string }[] = [
  { value: 'order_size', label: 'Order size (tons)' },
  { value: 'urgency', label: 'Urgency' },
  { value: 'customer', label: 'Customer' },
  { value: 'region', label: 'Region' },
  { value: 'product', label: 'Product' },
];

const CONDITION_OPS: { value: RuleConditionOp; label: string }[] = [
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'eq', label: '=' },
  { value: 'in', label: 'in' },
];

const ACTION_TYPES: { value: RuleActionType; label: string }[] = [
  { value: 'optimization', label: 'Optimization (JIT first)' },
  { value: 'prefer_quarry', label: 'Prefer quarry warehouse' },
  { value: 'prefer_warehouse', label: 'Prefer near-well warehouse' },
  { value: 'allow_redirect', label: 'Allow redirect' },
  { value: 'max_delay_min', label: 'Max delay (min)' },
  { value: 'use_safety_stock_if_urgent', label: 'Use safety stock if urgent' },
];

const RulesPage: React.FC = () => {
  const { currentUser } = useApp();
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [form, setForm] = useState({
    name: '',
    conditionField: 'order_size' as RuleConditionField,
    conditionOp: 'gte' as RuleConditionOp,
    conditionValue: '',
    actionType: 'optimization' as RuleActionType,
    actionValue: '',
    priority: 0,
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await rulesApi.getAll();
      setRules(data);
    } catch (e: any) {
      setError(e?.message || 'Failed to load rules.');
      setRules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: '',
      conditionField: 'order_size',
      conditionOp: 'gte',
      conditionValue: '',
      actionType: 'optimization',
      actionValue: '',
      priority: rules.length,
      active: true,
    });
    setOpenForm(true);
  };

  const openEdit = (r: Rule) => {
    setEditing(r);
    const c = r.condition;
    const a = r.action;
    setForm({
      name: r.name,
      conditionField: (c?.field ?? 'order_size') as RuleConditionField,
      conditionOp: (c?.op ?? 'gte') as RuleConditionOp,
      conditionValue: c?.value != null ? String(c.value) : '',
      actionType: (a?.type ?? 'optimization') as RuleActionType,
      actionValue: a?.value != null ? String(a.value) : '',
      priority: r.priority ?? 0,
      active: !!r.active,
    });
    setOpenForm(true);
  };

  const closeForm = () => {
    setOpenForm(false);
    setEditing(null);
  };

  const parseConditionValue = (): string | number | string[] => {
    const v = form.conditionValue.trim();
    if (form.conditionOp === 'in') {
      return v ? v.split(',').map(s => s.trim()).filter(Boolean) : [];
    }
    const n = Number(v);
    return Number.isNaN(n) ? v : n;
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Name is required.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const condition: Rule['condition'] = {
        field: form.conditionField,
        op: form.conditionOp,
        value: parseConditionValue(),
      };
      const action: Rule['action'] = {
        type: form.actionType,
        value: form.actionValue.trim() ? (Number(form.actionValue) || form.actionValue) : undefined,
      };
      if (editing) {
        await rulesApi.update(editing.id, {
          name: form.name.trim(),
          condition,
          action,
          priority: form.priority,
          active: form.active,
        });
      } else {
        await rulesApi.create({
          name: form.name.trim(),
          condition,
          action,
          priority: form.priority,
          active: form.active,
          createdBy: currentUser?.id,
        });
      }
      closeForm();
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to save rule.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this rule?')) return;
    try {
      await rulesApi.delete(id);
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete rule.');
    }
  };

  return (
    <Box>
      <PageHeader
        title="Recommendation rules"
        subtitle="Configure rules that influence dispatcher recommendations (e.g. prefer warehouse, JIT-first)."
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
              Refresh
            </Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
              Add rule
            </Button>
          </Box>
        }
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Condition</TableCell>
              <TableCell>Action</TableCell>
              <TableCell align="right">Priority</TableCell>
              <TableCell>Active</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No rules yet. Add a rule to influence recommendations.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              rules.map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>
                    {r.condition?.field} {r.condition?.op} {String(r.condition?.value ?? '')}
                  </TableCell>
                  <TableCell>
                    {r.action?.type}
                    {r.action?.value != null ? ` (${r.action.value})` : ''}
                  </TableCell>
                  <TableCell align="right">{r.priority}</TableCell>
                  <TableCell>{r.active ? 'Yes' : 'No'}</TableCell>
                  <TableCell align="right">
                    <Button size="small" startIcon={<EditIcon />} onClick={() => openEdit(r)}>
                      Edit
                    </Button>
                    <Button size="small" color="error" startIcon={<DeleteIcon />} onClick={() => handleDelete(r.id)}>
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openForm} onClose={closeForm} maxWidth="sm" fullWidth>
        <DialogTitle>{editing ? 'Edit rule' : 'Add rule'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              fullWidth
              label="Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
            <Typography variant="subtitle2" color="text.secondary">
              Condition
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField
                select
                label="Field"
                size="small"
                value={form.conditionField}
                onChange={(e) => setForm((f) => ({ ...f, conditionField: e.target.value as RuleConditionField }))}
                sx={{ minWidth: 160 }}
              >
                {CONDITION_FIELDS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Op"
                size="small"
                value={form.conditionOp}
                onChange={(e) => setForm((f) => ({ ...f, conditionOp: e.target.value as RuleConditionOp }))}
                sx={{ minWidth: 80 }}
              >
                {CONDITION_OPS.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                label="Value"
                value={form.conditionValue}
                onChange={(e) => setForm((f) => ({ ...f, conditionValue: e.target.value }))}
                placeholder={form.conditionOp === 'in' ? 'a, b, c' : 'e.g. 100'}
                sx={{ minWidth: 120 }}
              />
            </Box>
            <Typography variant="subtitle2" color="text.secondary">
              Action
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <TextField
                select
                label="Type"
                size="small"
                fullWidth
                value={form.actionType}
                onChange={(e) => setForm((f) => ({ ...f, actionType: e.target.value as RuleActionType }))}
              >
                {ACTION_TYPES.map((o) => (
                  <MenuItem key={o.value} value={o.value}>
                    {o.label}
                  </MenuItem>
                ))}
              </TextField>
              {(form.actionType === 'max_delay_min' || form.actionType === 'use_safety_stock_if_urgent') && (
                <TextField
                  size="small"
                  label="Value"
                  value={form.actionValue}
                  onChange={(e) => setForm((f) => ({ ...f, actionValue: e.target.value }))}
                  placeholder={form.actionType === 'max_delay_min' ? 'minutes' : ''}
                  sx={{ minWidth: 120 }}
                />
              )}
            </Box>
            <TextField
              type="number"
              size="small"
              label="Priority (lower = applied first)"
              value={form.priority}
              onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))}
              inputProps={{ min: 0 }}
              sx={{ maxWidth: 200 }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.active}
                  onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                />
              }
              label="Active"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeForm}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default RulesPage;
