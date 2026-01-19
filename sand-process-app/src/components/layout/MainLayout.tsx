import React from 'react';
import { Container, Box } from '@mui/material';
import TopBar from './TopBar';
import Navigation from './Navigation';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <TopBar />
      <Container maxWidth="xl">
        <Box sx={{ display: 'flex', gap: 3, mt: 2 }}>
          <Navigation />
          <Box sx={{ flexGrow: 1, mb: 4 }}>
            {children}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default MainLayout;


