import React from 'react';
import { Chip, ChipProps } from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  PlayArrow as InProgressIcon,
  LocalShipping as ShippingIcon,
  Receipt as InvoicedIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';

interface StatusChipProps extends Omit<ChipProps, 'color'> {
  status: string;
  showIcon?: boolean;
}

const STATUS_CONFIG: Record<string, {
  color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning';
  icon?: React.ReactElement;
  label?: string;
}> = {
  // Order statuses
  pending: {
    color: 'default',
    icon: <PendingIcon fontSize="small" />,
    label: 'Pending',
  },
  confirmed: {
    color: 'info',
    icon: <CheckCircleIcon fontSize="small" />,
    label: 'Confirmed',
  },
  in_production: {
    color: 'info',
    icon: <InProgressIcon fontSize="small" />,
    label: 'In Production',
  },
  qc: {
    color: 'warning',
    icon: <WarningIcon fontSize="small" />,
    label: 'QC',
  },
  ready: {
    color: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
    label: 'Ready',
  },
  dispatched: {
    color: 'info',
    icon: <ShippingIcon fontSize="small" />,
    label: 'Dispatched',
  },
  delivered: {
    color: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
    label: 'Delivered',
  },
  invoiced: {
    color: 'success',
    icon: <InvoicedIcon fontSize="small" />,
    label: 'Invoiced',
  },
  cancelled: {
    color: 'error',
    icon: <CancelIcon fontSize="small" />,
    label: 'Cancelled',
  },
  
  // Delivery statuses
  assigned: {
    color: 'default',
    icon: <PendingIcon fontSize="small" />,
    label: 'Assigned',
  },
  in_transit: {
    color: 'info',
    icon: <ShippingIcon fontSize="small" />,
    label: 'In Transit',
  },
  arrived: {
    color: 'warning',
    icon: <InfoIcon fontSize="small" />,
    label: 'Arrived',
  },
  delivering: {
    color: 'warning',
    icon: <InProgressIcon fontSize="small" />,
    label: 'Delivering',
  },
  
  // QC statuses
  in_progress: {
    color: 'warning',
    icon: <InProgressIcon fontSize="small" />,
    label: 'In Progress',
  },
  passed: {
    color: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
    label: 'Passed',
  },
  failed: {
    color: 'error',
    icon: <CancelIcon fontSize="small" />,
    label: 'Failed',
  },
  
  // Invoice statuses
  paid: {
    color: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
    label: 'Paid',
  },
  overdue: {
    color: 'error',
    icon: <WarningIcon fontSize="small" />,
    label: 'Overdue',
  },
  
  // Production statuses
  crushing: {
    color: 'info',
    icon: <InProgressIcon fontSize="small" />,
    label: 'Crushing',
  },
  washing: {
    color: 'info',
    icon: <InProgressIcon fontSize="small" />,
    label: 'Washing',
  },
  drying: {
    color: 'warning',
    icon: <InProgressIcon fontSize="small" />,
    label: 'Drying',
  },
  screening: {
    color: 'info',
    icon: <InProgressIcon fontSize="small" />,
    label: 'Screening',
  },
  packaging: {
    color: 'warning',
    icon: <InProgressIcon fontSize="small" />,
    label: 'Packaging',
  },
  completed: {
    color: 'success',
    icon: <CheckCircleIcon fontSize="small" />,
    label: 'Completed',
  },
};

const StatusChip: React.FC<StatusChipProps> = ({ 
  status, 
  showIcon = true, 
  label,
  ...otherProps 
}) => {
  const normalizedStatus = status.toLowerCase().replace(/\s+/g, '_');
  const config = STATUS_CONFIG[normalizedStatus] || {
    color: 'default' as const,
    icon: <InfoIcon fontSize="small" />,
    label: status,
  };

  return (
    <Chip
      label={label || config.label || status}
      color={config.color}
      size="small"
      icon={showIcon ? config.icon : undefined}
      {...otherProps}
    />
  );
};

export default StatusChip;