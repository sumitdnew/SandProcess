import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import theme from './theme/theme';
import GlobalStyles from './theme/GlobalStyles';
import MainLayout from './components/layout/MainLayout';
import { AppProvider, useApp } from './context/AppContext';
import Dashboard from './pages/Dashboard';
import OrdersPage from './pages/OrdersPage';
import LogisticsPage from './pages/LogisticsPage';
import FleetPage from './pages/FleetPage';
import BillingPage from './pages/BillingPage';
import QualityPage from './pages/QualityPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import ProductionPage from './pages/ProductionPage';
import CustomersPage from './pages/CustomersPage';
import MSAPage from './pages/MSAPage';
import DispatcherPage from './pages/DispatcherPage';
import InventoryManagerPage from './pages/InventoryManagerPage';
import ApprovalsPage from './pages/ApprovalsPage';
import RulesPage from './pages/RulesPage';
import TasksPage from './pages/TasksPage';

const HomeRoute: React.FC = () => {
  const { currentRole } = useApp();
  if (currentRole === 'driver') return <Navigate to="/logistics" replace />;
  if (currentRole === 'operations_manager' || currentRole === 'jefatura') return <Navigate to="/approvals" replace />;
  if (currentRole === 'qc_technician') return <Navigate to="/quality" replace />;
  if (currentRole === 'inventory_manager') return <Navigate to="/inventory" replace />;
  return <Dashboard />;
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles />
      <AppProvider>
        <BrowserRouter>
          <MainLayout>
            <Routes>
              <Route path="/" element={<HomeRoute />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/logistics" element={<LogisticsPage />} />
              <Route path="/inventory" element={<InventoryManagerPage />} />
              <Route path="/fleet" element={<FleetPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/quality" element={<QualityPage />} />
              <Route path="/customer-portal" element={<CustomerPortalPage />} />
              <Route path="/production" element={<ProductionPage />} />
              <Route path="/customers" element={<CustomersPage />} />
              <Route path="/msas" element={<MSAPage />} />
              <Route path="/dispatcher" element={<DispatcherPage />} />
              <Route path="/approvals" element={<ApprovalsPage />} />
              <Route path="/rules" element={<RulesPage />} />
              <Route path="/tasks" element={<TasksPage />} />
            </Routes>
          </MainLayout>
        </BrowserRouter>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;
