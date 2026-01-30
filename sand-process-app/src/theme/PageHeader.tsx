import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { NavigateNext as NavigateNextIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode;
}

const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs,
  action,
}) => {
  const navigate = useNavigate();

  return (
    <Box sx={{ mb: 3 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          sx={{ mb: 1 }}
        >
          {breadcrumbs.map((item, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            if (isLast || !item.path) {
              return (
                <Typography key={index} color="text.primary" variant="body2">
                  {item.label}
                </Typography>
              );
            }
            
            return (
              <Link
                key={index}
                color="inherit"
                onClick={() => item.path && navigate(item.path)}
                sx={{ cursor: 'pointer' }}
                variant="body2"
              >
                {item.label}
              </Link>
            );
          })}
        </Breadcrumbs>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h4" gutterBottom>
            {title}
          </Typography>
          {subtitle && (
            <Typography variant="body2" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
        
        {action && (
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {action}
          </Box>
        )}
      </Box>
    </Box>
  );
};

export default PageHeader;