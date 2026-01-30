import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActionArea,
  Button,
  CircularProgress,
  Alert,
  Grid,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import AssignmentIcon from '@mui/icons-material/Assignment';
import PageHeader from '../theme/PageHeader';
import { tasksApi } from '../services/api';
import { useApp } from '../context/AppContext';
import type { TaskItem } from '../types';

const TasksPage: React.FC = () => {
  const { currentRole } = useApp();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!currentRole) {
      setTasks([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const data = await tasksApi.getForRole(currentRole);
      setTasks(data);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load tasks.');
      setTasks([]);
    } finally {
      setLoading(false);
    }
  }, [currentRole]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <PageHeader
        title="Tasks"
        subtitle="Tasks assigned to your role. Open a task to view details."
        action={
          <Button startIcon={<RefreshIcon />} onClick={load} disabled={loading}>
            Refresh
          </Button>
        }
      />
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {tasks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <AssignmentIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No tasks right now
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Tasks will appear here when there is work assigned to your role.
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {tasks.map((t) => (
            <Grid item xs={12} sm={6} md={4} key={t.id}>
              <Card variant="outlined">
                <CardActionArea onClick={() => navigate(t.link)}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t.title}
                    </Typography>
                    {t.subtitle && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {t.subtitle}
                      </Typography>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                      <Typography variant="body2" color="primary" fontWeight={600}>
                        {t.count} {t.count === 1 ? 'task' : 'tasks'}
                      </Typography>
                      <Button size="small" endIcon={<ArrowForwardIcon />}>
                        View
                      </Button>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default TasksPage;
