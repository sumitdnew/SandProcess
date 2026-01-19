import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AppProvider } from './context/AppContext';
import './i18n/config';
import MainLayout from './components/layout/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import OrdersPage from './pages/OrdersPage';
import LogisticsPage from './pages/LogisticsPage';
import QualityPage from './pages/QualityPage';
import BillingPage from './pages/BillingPage';
import InventoryPage from './pages/InventoryPage';
import FleetPage from './pages/FleetPage';
import ProductionPage from './pages/ProductionPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import MSAPage from './pages/MSAPage';
import CustomersPage from './pages/CustomersPage';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AppProvider>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/logistics" element={<LogisticsPage />} />
              <Route path="/quality" element={<QualityPage />} />
              <Route path="/billing" element={<BillingPage />} />
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/fleet" element={<FleetPage />} />
              <Route path="/production" element={<ProductionPage />} />
              <Route path="/customer-portal" element={<CustomerPortalPage />} />
              <Route path="/msas" element={<MSAPage />} />
              <Route path="/customers" element={<CustomersPage />} />
            </Routes>
          </MainLayout>
        </Router>
      </AppProvider>
    </ThemeProvider>
  );
}

export default App;

