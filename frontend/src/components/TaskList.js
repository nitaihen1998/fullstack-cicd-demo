import React from 'react';
import {
  List,
  ListItem,
  Paper,
  Typography,
  Box,
  IconButton,
  Checkbox,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';

const TaskList = ({ tasks, onToggle, onEdit, onDelete }) => {
  if (tasks.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          No tasks found. Create your first task!
        </Typography>
      </Paper>
    );
  }

  return (
    <List>
      {tasks.map((task) => (
        <Paper key={task.id} sx={{ mb: 2 }}>
          <ListItem
            sx={{
              display: 'flex',
              alignItems: 'flex-start',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <Checkbox
              checked={task.status === 'completed'}
              onChange={() => onToggle(task.id)}
              sx={{ mt: 0.5 }}
            />
            <Box sx={{ flexGrow: 1, ml: 1 }}>
              <Typography
                variant="h6"
                sx={{
                  textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  color: task.status === 'completed' ? 'text.secondary' : 'text.primary',
                }}
              >
                {task.title}
              </Typography>
              {task.description && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 0.5,
                    textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                  }}
                >
                  {task.description}
                </Typography>
              )}
              <Box sx={{ mt: 1 }}>
                <Chip
                  label={task.status}
                  size="small"
                  color={task.status === 'completed' ? 'success' : 'warning'}
                  sx={{ textTransform: 'capitalize' }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                  Created: {new Date(task.created_at).toLocaleDateString()}
                </Typography>
              </Box>
            </Box>
            <Box>
              <IconButton
                onClick={() => onEdit(task)}
                color="primary"
                size="small"
              >
                <EditIcon />
              </IconButton>
              <IconButton
                onClick={() => onDelete(task.id)}
                color="error"
                size="small"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </ListItem>
        </Paper>
      ))}
    </List>
  );
};

export default TaskList;
