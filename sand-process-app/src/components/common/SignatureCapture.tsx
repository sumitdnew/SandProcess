import React, { useRef, useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
} from '@mui/material';
import { CheckCircle as CheckCircleIcon, Close as CloseIcon } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface SignatureCaptureProps {
  value: string;
  onChange: (signatureImage: string) => void;
  onClear?: () => void;
  label?: string;
  required?: boolean;
}

const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  value,
  onChange,
  onClear,
  label,
  required = false,
}) => {
  const { t } = useTranslation();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const hasSignatureStrokesRef = useRef(false);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    hasSignatureStrokesRef.current = false;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    if (ctx) {
      hasSignatureStrokesRef.current = true;
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    if (!canvasRef.current) return;
    setIsDrawing(false);
    // If no strokes were drawn, don't capture a signature image
    if (!hasSignatureStrokesRef.current) {
      return;
    }
    const canvas = canvasRef.current;
    const signatureImage = canvas.toDataURL('image/png');
    onChange(signatureImage);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasSignatureStrokesRef.current = false;
      onChange('');
      if (onClear) onClear();
    }
  };

  // Initialize canvas on mount
  useEffect(() => {
    if (canvasRef.current && !value) {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = 150;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
      }
    }
  }, [value]);

  return (
    <Box>
      {label && (
        <Typography variant="subtitle2" gutterBottom>
          {label} {required && '*'}
        </Typography>
      )}
      <Paper
        sx={{
          border: '2px dashed',
          borderColor: value ? 'success.main' : 'grey.400',
          p: 2,
          bgcolor: 'grey.50',
          borderRadius: 2,
        }}
      >
        {!value ? (
          <>
            <Typography
              variant="caption"
              display="block"
              gutterBottom
              color="textSecondary"
              sx={{ textAlign: 'center' }}
            >
              ✍️ {t('modules.logistics.drawSignature') || 'Draw your signature below using your mouse or touch screen'}
            </Typography>
            <canvas
              ref={canvasRef}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              style={{
                width: '100%',
                height: 150,
                border: '1px solid #ddd',
                borderRadius: 4,
                cursor: 'crosshair',
                backgroundColor: '#fff',
              }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
              <Button
                size="small"
                onClick={clearSignature}
                disabled={!value}
              >
                {t('modules.logistics.clearSignature') || 'Clear'}
              </Button>
            </Box>
          </>
        ) : (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="body2" color="success.main" gutterBottom>
              {t('modules.logistics.signatureCaptured') || 'Signature Captured ✓'}
            </Typography>
            <img
              src={value}
              alt="Signature"
              style={{ maxWidth: '100%', maxHeight: 150, border: '1px solid #ddd', borderRadius: 4 }}
            />
            <Box sx={{ mt: 1 }}>
              <Button
                size="small"
                onClick={clearSignature}
                startIcon={<CloseIcon />}
              >
                {t('modules.logistics.clearAndRedraw') || 'Clear & Redraw'}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default SignatureCapture;

