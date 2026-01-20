import { GlobalStyles as MuiGlobalStyles } from '@mui/material';
import { useTheme } from '@mui/material/styles';

const GlobalStyles = () => {
  const theme = useTheme();

  return (
    <MuiGlobalStyles
      styles={{
        '*': {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        },
        'html, body': {
          width: '100%',
          height: '100%',
          margin: 0,
          padding: 0,
        },
        body: {
          fontFamily: theme.typography.fontFamily,
          backgroundColor: theme.palette.background.default,
          color: theme.palette.text.primary,
          fontSize: '1rem',
          lineHeight: 1.5,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        },
        '#root': {
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        },
        // Scrollbar styling
        '*::-webkit-scrollbar': {
          width: '8px',
          height: '8px',
        },
        '*::-webkit-scrollbar-track': {
          backgroundColor: theme.palette.grey[100],
          borderRadius: '4px',
        },
        '*::-webkit-scrollbar-thumb': {
          backgroundColor: theme.palette.grey[400],
          borderRadius: '4px',
          '&:hover': {
            backgroundColor: theme.palette.grey[500],
          },
        },
        // Smooth transitions
        'a, button': {
          transition: 'all 0.2s ease-in-out',
        },
        // Link styling
        a: {
          color: theme.palette.primary.main,
          textDecoration: 'none',
          '&:hover': {
            textDecoration: 'underline',
          },
        },
        // Focus visible styling
        '*:focus-visible': {
          outline: `2px solid ${theme.palette.primary.main}`,
          outlineOffset: '2px',
          borderRadius: '4px',
        },
        // Improved table styling
        'table': {
          borderCollapse: 'collapse',
          width: '100%',
        },
        // Image styling
        img: {
          maxWidth: '100%',
          height: 'auto',
        },
        // Code styling
        code: {
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          backgroundColor: theme.palette.grey[100],
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.875em',
        },
        pre: {
          fontFamily: 'Monaco, Consolas, "Courier New", monospace',
          backgroundColor: theme.palette.grey[100],
          padding: '16px',
          borderRadius: '8px',
          overflow: 'auto',
          fontSize: '0.875rem',
          lineHeight: 1.6,
        },
        // Selection styling
        '::selection': {
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.contrastText,
        },
        // Custom utility classes
        '.text-center': {
          textAlign: 'center',
        },
        '.text-right': {
          textAlign: 'right',
        },
        '.text-left': {
          textAlign: 'left',
        },
        '.font-bold': {
          fontWeight: 600,
        },
        '.font-medium': {
          fontWeight: 500,
        },
        '.font-normal': {
          fontWeight: 400,
        },
        // Status color utilities
        '.status-success': {
          color: theme.palette.success.main,
        },
        '.status-warning': {
          color: theme.palette.warning.main,
        },
        '.status-error': {
          color: theme.palette.error.main,
        },
        '.status-info': {
          color: theme.palette.info.main,
        },
        // Background color utilities
        '.bg-success-light': {
          backgroundColor: theme.palette.success.light + '20',
        },
        '.bg-warning-light': {
          backgroundColor: theme.palette.warning.light + '20',
        },
        '.bg-error-light': {
          backgroundColor: theme.palette.error.light + '20',
        },
        '.bg-info-light': {
          backgroundColor: theme.palette.info.light + '20',
        },
        // Animation classes
        '@keyframes fadeIn': {
          from: {
            opacity: 0,
          },
          to: {
            opacity: 1,
          },
        },
        '@keyframes slideInUp': {
          from: {
            transform: 'translateY(20px)',
            opacity: 0,
          },
          to: {
            transform: 'translateY(0)',
            opacity: 1,
          },
        },
        '@keyframes pulse': {
          '0%, 100%': {
            opacity: 1,
          },
          '50%': {
            opacity: 0.5,
          },
        },
        '.animate-fade-in': {
          animation: 'fadeIn 0.3s ease-in-out',
        },
        '.animate-slide-in-up': {
          animation: 'slideInUp 0.3s ease-in-out',
        },
        '.animate-pulse': {
          animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        },
        // Card hover effects
        '.card-hover': {
          transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
          cursor: 'pointer',
          '&:hover': {
            transform: 'translateY(-4px)',
            boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.15)',
          },
        },
        // Loading skeleton
        '.skeleton': {
          backgroundColor: theme.palette.grey[200],
          borderRadius: '4px',
          animation: 'pulse 1.5s ease-in-out infinite',
        },
        // Print styles
        '@media print': {
          body: {
            backgroundColor: '#ffffff',
          },
          '.no-print': {
            display: 'none',
          },
        },
      }}
    />
  );
};

export default GlobalStyles;