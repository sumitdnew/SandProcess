import React from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

/** Compact static mock UI so the guide shows how each area looks (not live data). */
const PreviewChrome: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Paper
    variant="outlined"
    sx={{
      p: 1.5,
      bgcolor: 'grey.50',
      borderStyle: 'dashed',
      maxHeight: 300,
      overflow: 'auto',
    }}
  >
    {children}
  </Paper>
);

const Watermark: React.FC = () => {
  const { t } = useTranslation();
  return (
    <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 1 }}>
      {t('guide.previewHint')}
    </Typography>
  );
};

const DashboardPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
      {[
        { k: 'Revenue', v: '$1.2M' },
        { k: 'Orders', v: '48' },
        { k: 'Deliveries', v: '12' },
        { k: 'QC pass', v: '94%' },
      ].map((x) => (
        <Paper key={x.k} sx={{ p: 1, minWidth: 72, flex: '1 1 60px' }} elevation={0}>
          <Typography variant="caption" color="text.secondary">
            {x.k}
          </Typography>
          <Typography variant="subtitle2" fontWeight="bold">
            {x.v}
          </Typography>
        </Paper>
      ))}
    </Box>
    <Box sx={{ height: 56, bgcolor: 'action.hover', borderRadius: 1, mb: 0.5 }} />
    <Typography variant="caption" color="text.secondary">
      Recent: ORD-1001 confirmed · ORD-1002 in QC
    </Typography>
  </PreviewChrome>
);

const OrdersPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
      <Button size="small" variant="contained" disabled sx={{ pointerEvents: 'none' }}>
        Create order
      </Button>
    </Box>
    <Table size="small" padding="none">
      <TableHead>
        <TableRow>
          <TableCell>Order</TableCell>
          <TableCell>Customer</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>ORD-1001</TableCell>
          <TableCell>Acme SA</TableCell>
          <TableCell>
            <Chip size="small" label="QC" color="warning" />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>ORD-1002</TableCell>
          <TableCell>Vaca Muerta LLC</TableCell>
          <TableCell>
            <Chip size="small" label="Ready" color="success" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </PreviewChrome>
);

const DispatcherPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
      Fulfillment: Delivery only
    </Typography>
    <Card variant="outlined" sx={{ mb: 1 }}>
      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
        <Typography variant="subtitle2">ORD-1002 · 120 t · Well A-4</Typography>
        <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip size="small" label="WH: North" variant="outlined" />
          <Chip size="small" label="Truck: T-07" variant="outlined" />
          <Button size="small" variant="outlined" disabled>
            Assign
          </Button>
        </Box>
      </CardContent>
    </Card>
    <Card variant="outlined">
      <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
        <Typography variant="subtitle2">ORD-1003 · Pickup</Typography>
        <Typography variant="caption" color="text.secondary">
          Use Pickup release when load leaves yard
        </Typography>
      </CardContent>
    </Card>
  </PreviewChrome>
);

const ApprovalsPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 1, display: 'flex', gap: 2 }}>
      <Typography variant="caption" fontWeight="bold" sx={{ pb: 0.5, borderBottom: 2, borderColor: 'primary.main' }}>
        Level 1
      </Typography>
      <Typography variant="caption" color="text.secondary">
        Level 2
      </Typography>
    </Box>
    <Table size="small">
      <TableBody>
        <TableRow>
          <TableCell>Redirect ORD-998 → WH-2</TableCell>
          <TableCell align="right">
            <Button size="small" color="success" disabled>
              Approve
            </Button>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </PreviewChrome>
);

const RulesPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Active</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>Prefer near-well WH</TableCell>
          <TableCell>
            <Chip size="small" label="On" color="success" />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>JIT urgent</TableCell>
          <TableCell>
            <Chip size="small" label="On" color="success" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </PreviewChrome>
);

const QualityPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Order</TableCell>
          <TableCell>Test</TableCell>
          <TableCell>Result</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>ORD-1001</TableCell>
          <TableCell>Gradation</TableCell>
          <TableCell>
            <Chip size="small" label="Pass" color="success" />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>ORD-1004</TableCell>
          <TableCell>Moisture</TableCell>
          <TableCell>
            <Chip size="small" label="Pending" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </PreviewChrome>
);

const LogisticsPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Box
      sx={{
        height: 100,
        borderRadius: 1,
        mb: 1,
        background: 'linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 50%, #81c784 100%)',
        position: 'relative',
      }}
    >
      <Typography variant="caption" sx={{ position: 'absolute', bottom: 4, left: 8, bgcolor: 'background.paper', px: 0.5, borderRadius: 0.5 }}>
        Map · quarry → site
      </Typography>
    </Box>
    <Typography variant="subtitle2">DEL-55 · In transit</Typography>
    <LinearProgress variant="determinate" value={62} sx={{ mt: 0.5, mb: 0.5 }} />
    <Typography variant="caption" color="text.secondary">
      ETA 14:30 · Driver M. López
    </Typography>
  </PreviewChrome>
);

const PickupReleasePreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Typography variant="subtitle2" gutterBottom>
      ORD-1003 · Pickup
    </Typography>
    <Box sx={{ display: 'grid', gap: 1, gridTemplateColumns: '1fr 1fr' }}>
      <Paper sx={{ p: 1 }} variant="outlined">
        <Typography variant="caption" color="text.secondary">
          Gross (t)
        </Typography>
        <Typography variant="body2">30.2</Typography>
      </Paper>
      <Paper sx={{ p: 1 }} variant="outlined">
        <Typography variant="caption" color="text.secondary">
          Tare (t)
        </Typography>
        <Typography variant="body2">10.1</Typography>
      </Paper>
      <Paper sx={{ p: 1, gridColumn: '1 / -1' }} variant="outlined">
        <Typography variant="caption" color="text.secondary">
          Driver ID
        </Typography>
        <Typography variant="body2">D-4401</Typography>
      </Paper>
    </Box>
    <Button fullWidth sx={{ mt: 1 }} variant="contained" disabled>
      Complete release
    </Button>
  </PreviewChrome>
);

const BillingPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Invoice</TableCell>
          <TableCell>Amount</TableCell>
          <TableCell>Status</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>INV-2025-014</TableCell>
          <TableCell>$42,100</TableCell>
          <TableCell>
            <Chip size="small" label="Sent" />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>INV-2025-015</TableCell>
          <TableCell>$18,400</TableCell>
          <TableCell>
            <Chip size="small" label="PDF ✓" color="success" variant="outlined" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </PreviewChrome>
);

const InventoryPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Site</TableCell>
          <TableCell>Product</TableCell>
          <TableCell align="right">Tons</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>North WH</TableCell>
          <TableCell>40/70 mesh</TableCell>
          <TableCell align="right">1,240</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Quarry A</TableCell>
          <TableCell>100 mesh</TableCell>
          <TableCell align="right">860</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </PreviewChrome>
);

const FleetPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
      {[
        { id: 'T-07', s: 'Assigned' },
        { id: 'T-12', s: 'Available' },
        { id: 'T-03', s: 'In transit' },
      ].map((tr) => (
        <Paper key={tr.id} sx={{ p: 1, minWidth: 100 }} variant="outlined">
          <Typography variant="subtitle2">{tr.id}</Typography>
          <Chip size="small" label={tr.s} sx={{ mt: 0.5 }} />
        </Paper>
      ))}
    </Box>
  </PreviewChrome>
);

const ProductionPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Typography variant="subtitle2" gutterBottom>
      Volume by product (demo)
    </Typography>
    {[
      { n: '40/70', v: 72 },
      { n: '100 mesh', v: 45 },
    ].map((r) => (
      <Box key={r.n} sx={{ mb: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="caption">{r.n}</Typography>
          <Typography variant="caption">{r.v}%</Typography>
        </Box>
        <LinearProgress variant="determinate" value={r.v} />
      </Box>
    ))}
  </PreviewChrome>
);

const TasksPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {[
        { t: 'QC tests to run', c: 3 },
        { t: 'Orders to assign', c: 2 },
        { t: 'Active deliveries', c: 5 },
      ].map((x) => (
        <Paper key={x.t} variant="outlined" sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">{x.t}</Typography>
          <Chip size="small" label={String(x.c)} color="primary" />
        </Paper>
      ))}
    </Box>
  </PreviewChrome>
);

const MsasPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Table size="small">
      <TableBody>
        <TableRow>
          <TableCell>MSA-2024-Acme</TableCell>
          <TableCell align="right">
            <Chip size="small" label="Active" color="success" />
          </TableCell>
        </TableRow>
        <TableRow>
          <TableCell>MSA-2023-VM</TableCell>
          <TableCell align="right">
            <Chip size="small" label="Active" color="success" />
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </PreviewChrome>
);

const CustomersPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Name</TableCell>
          <TableCell>Region</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        <TableRow>
          <TableCell>Acme SA</TableCell>
          <TableCell>Neuquén</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>Vaca Muerta LLC</TableCell>
          <TableCell>Rincón</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </PreviewChrome>
);

const CustomerPortalPreview: React.FC = () => (
  <PreviewChrome>
    <Watermark />
    <Box sx={{ pl: 1, borderLeft: 3, borderColor: 'primary.main' }}>
      <Typography variant="caption" display="block">
        Order placed
      </Typography>
      <Typography variant="caption" display="block" color="text.secondary">
        In production
      </Typography>
      <Typography variant="caption" display="block" color="text.secondary">
        QC
      </Typography>
      <Typography variant="caption" display="block" fontWeight="bold">
        Delivered
      </Typography>
    </Box>
    <Paper sx={{ mt: 1, p: 1 }} variant="outlined">
      <Typography variant="caption" color="text.secondary">
        Invoice
      </Typography>
      <Typography variant="body2">INV-2025-014.pdf</Typography>
      <Button size="small" sx={{ mt: 0.5 }} disabled>
        Download
      </Button>
    </Paper>
  </PreviewChrome>
);

const GenericPreview: React.FC<{ stepId: string }> = ({ stepId }) => (
  <PreviewChrome>
    <Watermark />
    <Typography variant="body2" color="text.secondary">
      Preview for “{stepId}” (static)
    </Typography>
  </PreviewChrome>
);

export interface GuideStepScreenPreviewProps {
  stepId: string;
}

const GuideStepScreenPreview: React.FC<GuideStepScreenPreviewProps> = ({ stepId }) => {
  switch (stepId) {
    case 'dashboard':
      return <DashboardPreview />;
    case 'orders':
      return <OrdersPreview />;
    case 'dispatcher':
      return <DispatcherPreview />;
    case 'approvals':
      return <ApprovalsPreview />;
    case 'rules':
      return <RulesPreview />;
    case 'quality':
      return <QualityPreview />;
    case 'logistics':
      return <LogisticsPreview />;
    case 'pickupRelease':
      return <PickupReleasePreview />;
    case 'billing':
      return <BillingPreview />;
    case 'inventory':
      return <InventoryPreview />;
    case 'fleet':
      return <FleetPreview />;
    case 'production':
      return <ProductionPreview />;
    case 'tasks':
      return <TasksPreview />;
    case 'msas':
      return <MsasPreview />;
    case 'customers':
      return <CustomersPreview />;
    case 'customerPortal':
      return <CustomerPortalPreview />;
    default:
      return <GenericPreview stepId={stepId} />;
  }
};

export default GuideStepScreenPreview;
