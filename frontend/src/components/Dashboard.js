import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  Chip,
  Alert,
} from '@mui/material';
import { Add as AddIcon, ExitToApp as LogoutIcon } from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { tasksAPI } from '../services/api';
import TaskList from './TaskList';
import TaskForm from './TaskForm';

const Dashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState('all');
  const [openForm, setOpenForm] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { user, logout } = useAuth();

  const fetchTasks = async () => {
    try {
      const filterParam = filter === 'all' ? null : filter;
      const response = await tasksAPI.getTasks(filterParam);
      setTasks(response.data);
    } catch (error) {
      setError('Failed to fetch tasks');
    }
  };

  useEffect(() => {
    fetchTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const handleCreateTask = async (taskData) => {
    try {
      await tasksAPI.createTask(taskData);
      setSuccess('Task created successfully');
      setOpenForm(false);
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to create task');
    }
  };

  const handleUpdateTask = async (id, taskData) => {
    try {
      await tasksAPI.updateTask(id, taskData);
      setSuccess('Task updated successfully');
      setEditingTask(null);
      setOpenForm(false);
      fetchTasks();
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('Failed to update task');
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksAPI.deleteTask(id);
        setSuccess('Task deleted successfully');
        fetchTasks();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        setError('Failed to delete task');
      }
    }
  };

  const handleToggleTask = async (id) => {
    try {
      await tasksAPI.toggleTask(id);
      fetchTasks();
    } catch (error) {
      setError('Failed to toggle task');
    }
  };

  const handleEdit = (task) => {
    setEditingTask(task);
    setOpenForm(true);
  };

  const handleCloseForm = () => {
    setOpenForm(false);
    setEditingTask(null);
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Task Manager
          </Typography>
          <Typography variant="body1" sx={{ mr: 2 }}>
            Welcome, {user?.username}
          </Typography>
          <Button color="inherit" onClick={logout} startIcon={<LogoutIcon />}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      <Container maxWidth="md" sx={{ mt: 4 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
            My Tasks
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenForm(true)}
          >
            Add Task
          </Button>
        </Box>

        <Box sx={{ mb: 3, display: 'flex', gap: 1 }}>
          <Chip
            label="All"
            onClick={() => setFilter('all')}
            color={filter === 'all' ? 'primary' : 'default'}
            clickable
          />
          <Chip
            label="Pending"
            onClick={() => setFilter('pending')}
            color={filter === 'pending' ? 'primary' : 'default'}
            clickable
          />
          <Chip
            label="Completed"
            onClick={() => setFilter('completed')}
            color={filter === 'completed' ? 'primary' : 'default'}
            clickable
          />
        </Box>

        <TaskList
          tasks={tasks}
          onToggle={handleToggleTask}
          onEdit={handleEdit}
          onDelete={handleDeleteTask}
        />

        <TaskForm
          open={openForm}
          onClose={handleCloseForm}
          onSubmit={editingTask ? (data) => handleUpdateTask(editingTask.id, data) : handleCreateTask}
          task={editingTask}
        />
      </Container>
    </Box>
  );
};

export default Dashboard;
