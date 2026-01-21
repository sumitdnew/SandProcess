import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ScienceIcon from '@mui/icons-material/Science';
import ReceiptIcon from '@mui/icons-material/Receipt';
import InventoryIcon from '@mui/icons-material/Inventory';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import FactoryIcon from '@mui/icons-material/Factory';
import PersonIcon from '@mui/icons-material/Person';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: string[];
}

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { currentRole } = useApp();

  const navItems: NavItem[] = [
    {
      path: '/',
      label: t('common.dashboard'),
      icon: <DashboardIcon />,
      roles: ['admin', 'operations_manager', 'dispatcher', 'production_manager', 'sales_rep', 'customer_service', 'accounting_manager'],
    },
    {
      path: '/orders',
      label: t('common.orders'),
      icon: <ShoppingCartIcon />,
      roles: ['admin', 'operations_manager', 'sales_rep', 'customer_service'],
    },
    {
      path: '/logistics',
      label: t('common.logistics'),
      icon: <LocalShippingIcon />,
      roles: ['admin', 'operations_manager', 'dispatcher', 'customer_service'],
    },
    {
      path: '/quality',
      label: t('common.quality'),
      icon: <ScienceIcon />,
      roles: ['admin', 'operations_manager', 'production_manager', 'qc_technician'],
    },
    {
      path: '/billing',
      label: t('common.billing'),
      icon: <ReceiptIcon />,
      roles: ['admin', 'operations_manager', 'accounting_manager', 'customer_service'],
    },
    {
      path: '/inventory',
      label: t('common.inventory'),
      icon: <InventoryIcon />,
      roles: ['admin', 'operations_manager', 'production_manager'],
    },
    {
      path: '/fleet',
      label: t('common.fleet'),
      icon: <DirectionsCarIcon />,
      roles: ['admin', 'operations_manager', 'dispatcher'],
    },
    {
      path: '/production',
      label: t('common.production'),
      icon: <FactoryIcon />,
      roles: ['admin', 'operations_manager', 'production_manager'],
    },
    {
      path: '/customer-portal',
      label: t('common.customerPortal'),
      icon: <PersonIcon />,
      roles: ['customer_user'],
    },
    {
      path: '/msas',
      label: 'MSAs',
      icon: <DescriptionIcon />,
      roles: ['admin', 'operations_manager', 'sales_rep'],
    },
    {
      path: '/customers',
      label: 'Customers',
      icon: <BusinessIcon />,
      roles: ['admin', 'operations_manager', 'sales_rep', 'customer_service'],
    },
  ];

  const visibleItems = navItems.filter(item => 
    !currentRole || item.roles.includes(currentRole)
  );

  return (
    <Paper sx={{ width: 250, p: 1 }}>
      <List>
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding>
              <ListItemButton
                selected={isActive}
                onClick={() => navigate(item.path)}
              >
                <ListItemIcon sx={{ color: isActive ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Paper>
  );
};

export default Navigation;

