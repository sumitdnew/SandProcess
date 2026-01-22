import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { I18nextProvider } from 'react-i18next';
import { AppProvider } from './context/AppContext';
import theme from './theme/theme';
import GlobalStyles from './theme/GlobalStyles';
import i18n from './i18n/config';
import MainLayout from './components/layout/MainLayout';
import Dashboard from './pages/Dashboard';
import OrdersPage from './pages/OrdersPage';
import LogisticsPage from './pages/LogisticsPage';
import QualityPage from './pages/QualityPage';
import BillingPage from './pages/BillingPage';
import InventoryPage from './pages/InventoryPage';
import FleetPage from './pages/FleetPage';
import ProductionPage from './pages/ProductionPage';
import CustomerPortalPage from './pages/CustomerPortalPage';
import DriverPortalPage from './pages/DriverPortalPage';
import CustomersPage from './pages/CustomersPage';
import MSAPage from './pages/MSAPage';

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles />
      <I18nextProvider i18n={i18n}>
        <AppProvider>
          <BrowserRouter>
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
                <Route path="/driver-portal" element={<DriverPortalPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/msas" element={<MSAPage />} />
              </Routes>
            </MainLayout>
          </BrowserRouter>
        </AppProvider>
      </I18nextProvider>
    </ThemeProvider>
  );
}

export default App;
