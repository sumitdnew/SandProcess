import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MobileStepper,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useApp } from '../../context/AppContext';
import { getGuideStepsForRole } from '../../guide/guideSteps';
import GuideStepScreenPreview from './GuideStepScreenPreview';

export interface GettingStartedGuideProps {
  open: boolean;
  onClose: () => void;
}

const GettingStartedGuide: React.FC<GettingStartedGuideProps> = ({ open, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const theme = useTheme();
  const isNarrow = useMediaQuery(theme.breakpoints.down('sm'));
  const { currentRole } = useApp();

  const steps = useMemo(() => getGuideStepsForRole(currentRole), [currentRole]);
  const maxSteps = steps.length;
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (open) {
      setActiveStep(0);
    }
  }, [open, currentRole]);

  useEffect(() => {
    if (activeStep >= maxSteps && maxSteps > 0) {
      setActiveStep(maxSteps - 1);
    }
  }, [activeStep, maxSteps]);

  const safeIndex = maxSteps === 0 ? 0 : Math.min(activeStep, maxSteps - 1);
  const current = steps[safeIndex];

  const instructionSteps = useMemo(() => {
    if (!current) return [];
    const raw = t(`guide.steps.${current.id}.instructionSteps`, {
      returnObjects: true,
    });
    return Array.isArray(raw)
      ? (raw as unknown[]).filter((x): x is string => typeof x === 'string')
      : [];
  }, [current, t]);

  const nextText = current ? t(`guide.steps.${current.id}.next`) : '';
  const showNext =
    Boolean(current) && nextText && !nextText.startsWith('guide.steps.');

  const handleNext = () => {
    setActiveStep((prev) => Math.min(prev + 1, Math.max(0, maxSteps - 1)));
  };

  const handleBack = () => {
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  const handleGoToPage = () => {
    if (!current) return;
    navigate(current.route);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      fullScreen={isNarrow}
      aria-labelledby="guide-dialog-title"
    >
      <DialogTitle id="guide-dialog-title">{t('guide.title')}</DialogTitle>
      <DialogContent>
        {maxSteps === 0 ? (
          <Typography color="text.secondary">{t('guide.noSteps')}</Typography>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t('guide.stepProgress', { current: safeIndex + 1, total: maxSteps })}
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
              {current ? t(`guide.steps.${current.id}.title`) : ''}
            </Typography>
            {current && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  {t('guide.previewLabel')}
                </Typography>
                <GuideStepScreenPreview stepId={current.id} />
              </Box>
            )}
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ whiteSpace: 'pre-line', mb: 2 }}
            >
              {current ? t(`guide.steps.${current.id}.body`) : ''}
            </Typography>

            {instructionSteps.length > 0 && (
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  {t('guide.instructionsTitle')}
                </Typography>
                <Box
                  component="ol"
                  sx={{
                    m: 0,
                    pl: 2.25,
                    '& li': {
                      mb: 1,
                      pl: 0.5,
                      color: 'text.secondary',
                      fontSize: '0.9375rem',
                      lineHeight: 1.5,
                    },
                  }}
                >
                  {instructionSteps.map((line, i) => (
                    <Typography key={i} component="li" variant="body2">
                      {line}
                    </Typography>
                  ))}
                </Box>
              </Box>
            )}

            {showNext && (
              <Box
                sx={{
                  mb: 2,
                  pl: 2,
                  borderLeft: 3,
                  borderColor: 'primary.main',
                  py: 0.5,
                }}
              >
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  {t('guide.nextTitle')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {nextText}
                </Typography>
              </Box>
            )}

            <Typography variant="caption" color="text.disabled" display="block" sx={{ mb: 2 }}>
              {t('guide.continueGuideHint')}
            </Typography>

            <Box sx={{ mt: 2 }}>
              <MobileStepper
                variant="dots"
                steps={maxSteps}
                position="static"
                activeStep={safeIndex}
                sx={{ flexGrow: 1, bgcolor: 'background.paper', justifyContent: 'center' }}
                nextButton={<Box />}
                backButton={<Box />}
              />
            </Box>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ flexWrap: 'wrap', gap: 1, px: 3, pb: 2 }}>
        <Button onClick={onClose}>{t('common.close')}</Button>
        {maxSteps > 0 && (
          <>
            <Button onClick={handleBack} disabled={safeIndex === 0}>
              {t('guide.back')}
            </Button>
            <Button
              variant="contained"
              onClick={handleGoToPage}
              disabled={!current}
            >
              {t('guide.openPage')}
            </Button>
            <Button onClick={handleNext} disabled={safeIndex >= maxSteps - 1}>
              {t('guide.next')}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default GettingStartedGuide;
