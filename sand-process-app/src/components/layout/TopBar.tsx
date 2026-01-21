import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Select,
  MenuItem,
  FormControl,
  Menu,
  IconButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useApp } from '../../context/AppContext';
import { UserRole } from '../../types';
import LanguageIcon from '@mui/icons-material/Language';
import AccountCircle from '@mui/icons-material/AccountCircle';

const TopBar: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { currentRole, setCurrentRole } = useApp();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleLanguageChange = (event: any) => {
    i18n.changeLanguage(event.target.value);
    localStorage.setItem('language', event.target.value);
  };

  const handleRoleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleRoleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    handleRoleMenuClose();
  };

  const getRoleLabel = (role: UserRole) => {
    return t(`roles.${role}`);
  };

  React.useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      // Normalize language code (en-US -> en, es-ES -> es)
      const normalizedLang = savedLanguage.split('-')[0];
      if (normalizedLang === 'en' || normalizedLang === 'es') {
        i18n.changeLanguage(normalizedLang);
      }
    } else {
      // Default to 'en' if no saved language
      i18n.changeLanguage('en');
    }
  }, [i18n]);

  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
          Sand Process Management
        </Typography>
        
        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
          {/* Navigation will be added here */}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Language Selector */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <Select
              value={i18n.language.split('-')[0]} // Normalize to base language code
              onChange={handleLanguageChange}
              startAdornment={<LanguageIcon sx={{ mr: 1, fontSize: 20 }} />}
              sx={{ color: 'white', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' } }}
            >
              <MenuItem value="en">{t('common.english')}</MenuItem>
              <MenuItem value="es">{t('common.spanish')}</MenuItem>
            </Select>
          </FormControl>

          {/* Role Selector */}
          <IconButton
            size="large"
            edge="end"
            aria-label="account menu"
            aria-controls="role-menu"
            aria-haspopup="true"
            onClick={handleRoleMenuOpen}
            color="inherit"
          >
            <AccountCircle />
            <Typography variant="body2" sx={{ ml: 1 }}>
              {currentRole ? getRoleLabel(currentRole) : t('common.dashboard')}
            </Typography>
          </IconButton>
          <Menu
            id="role-menu"
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleRoleMenuClose}
          >
            {(['admin', 'driver', 'customer_user'] as UserRole[]).map((role) => (
              <MenuItem
                key={role}
                onClick={() => handleRoleChange(role)}
                selected={currentRole === role}
              >
                {getRoleLabel(role)}
              </MenuItem>
            ))}
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default TopBar;

