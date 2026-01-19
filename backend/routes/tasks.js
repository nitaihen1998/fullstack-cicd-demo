const express = require('express');
const db = require('../config/database');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get all tasks for logged-in user with optional status filter
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM tasks WHERE user_id = ?';
    const params = [req.user.id];

    if (status && (status === 'pending' || status === 'completed')) {
      query += ' AND status = ?';
      params.push(status);
    }

    query += ' ORDER BY created_at DESC';

    db.all(query, params, (err, tasks) => {
      if (err) {
        console.error('Get tasks error:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      res.json(tasks);
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a single task by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    db.get(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id],
      (err, task) => {
        if (err) {
          console.error('Get task error:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }

        res.json(task);
      }
    );
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create a new task
router.post('/', async (req, res) => {
  try {
    const { title, description } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    db.run(
      'INSERT INTO tasks (user_id, title, description, status) VALUES (?, ?, ?, ?)',
      [req.user.id, title, description || '', 'pending'],
      function(err) {
        if (err) {
          console.error('Create task error:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        const taskId = this.lastID;
        db.get('SELECT * FROM tasks WHERE id = ?', [taskId], (err, task) => {
          if (err) {
            return res.status(500).json({ error: 'Server error' });
          }
          res.status(201).json(task);
        });
      }
    );
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a task
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status } = req.body;

    // Check if task exists and belongs to user
    db.get(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id],
      (err, task) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }

        // Validate status if provided
        if (status && status !== 'pending' && status !== 'completed') {
          return res.status(400).json({ error: 'Invalid status value' });
        }

        const updateTitle = title !== undefined ? title : task.title;
        const updateDesc = description !== undefined ? description : task.description;
        const updateStatus = status !== undefined ? status : task.status;

        db.run(
          'UPDATE tasks SET title = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
          [updateTitle, updateDesc, updateStatus, id, req.user.id],
          function(err) {
            if (err) {
              console.error('Update error:', err);
              return res.status(500).json({ error: 'Server error' });
            }

            db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, updatedTask) => {
              if (err) {
                return res.status(500).json({ error: 'Server error' });
              }
              res.json(updatedTask);
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a task
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    db.get(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id],
      (err, task) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }

        db.run('DELETE FROM tasks WHERE id = ? AND user_id = ?', [id, req.user.id], (err) => {
          if (err) {
            console.error('Delete error:', err);
            return res.status(500).json({ error: 'Server error' });
          }

          res.json({ message: 'Task deleted successfully', task });
        });
      }
    );
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Toggle task status (mark as complete/incomplete)
router.patch('/:id/toggle', async (req, res) => {
  try {
    const { id } = req.params;

    db.get(
      'SELECT * FROM tasks WHERE id = ? AND user_id = ?',
      [id, req.user.id],
      (err, task) => {
        if (err) {
          console.error('Database error:', err);
          return res.status(500).json({ error: 'Server error' });
        }

        if (!task) {
          return res.status(404).json({ error: 'Task not found' });
        }

        const newStatus = task.status === 'pending' ? 'completed' : 'pending';

        db.run(
          'UPDATE tasks SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
          [newStatus, id, req.user.id],
          function(err) {
            if (err) {
              console.error('Toggle error:', err);
              return res.status(500).json({ error: 'Server error' });
            }

            db.get('SELECT * FROM tasks WHERE id = ?', [id], (err, updatedTask) => {
              if (err) {
                return res.status(500).json({ error: 'Server error' });
              }
              res.json(updatedTask);
            });
          }
        );
      }
    );
  } catch (error) {
    console.error('Toggle task error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
