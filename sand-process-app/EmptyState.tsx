import React from 'react';
import { Box, Typography, Button, SvgIconProps } from '@mui/material';
import { useNavigate } from 'react-router-dom';

interface EmptyStateProps {
  icon: React.ComponentType<SvgIconProps>;
  title: string;
  description: string;
  actionLabel?: string;
  actionPath?: string;
  onAction?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  actionPath,
  onAction,
  size = 'medium',
}) => {
  const navigate = useNavigate();

  const handleAction = () => {
    if (onAction) {
      onAction();
    } else if (actionPath) {
      navigate(actionPath);
    }
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return { iconSize: 48, py: 4, maxWidth: 300 };
      case 'large':
        return { iconSize: 80, py: 10, maxWidth: 500 };
      default:
        return { iconSize: 64, py: 8, maxWidth: 400 };
    }
  };

  const config = getSizeConfig();

  return (
    <Box
      sx={{
        textAlign: 'center',
        py: config.py,
        px: 3,
      }}
    >
      <Icon
        sx={{
          fontSize: config.iconSize,
          color: 'text.disabled',
          mb: 2,
        }}
      />
      <Typography
        variant={size === 'large' ? 'h5' : 'h6'}
        color="textSecondary"
        gutterBottom
        sx={{ fontWeight: 500 }}
      >
        {title}
      </Typography>
      <Typography
        variant="body2"
        color="textSecondary"
        sx={{ mb: 3, maxWidth: config.maxWidth, mx: 'auto' }}
      >
        {description}
      </Typography>
      {(actionLabel && (actionPath || onAction)) && (
        <Button
          variant="contained"
          onClick={handleAction}
          size={size === 'large' ? 'large' : 'medium'}
          sx={{ mt: 1 }}
        >
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;