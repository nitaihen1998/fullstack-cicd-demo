const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'taskmanager',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err.stack);
    process.exit(1);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
  }
});

// Helper function to convert SQLite-style queries to PostgreSQL
// For compatibility with existing route code
const db = {
  // Execute a query that returns multiple rows
  all: (query, params, callback) => {
    pool.query(query, params)
      .then(result => callback(null, result.rows))
      .catch(err => callback(err));
  },

  // Execute a query that returns a single row
  get: (query, params, callback) => {
    pool.query(query, params)
      .then(result => callback(null, result.rows[0]))
      .catch(err => callback(err));
  },

  // Execute a query that modifies data (INSERT, UPDATE, DELETE)
  run: (query, params, callback) => {
    pool.query(query, params)
      .then(result => {
        // Mimic SQLite's this.lastID and this.changes
        const context = {
          lastID: result.rows[0]?.id,
          changes: result.rowCount
        };
        callback.call(context, null);
      })
      .catch(err => callback(err));
  }
};

module.exports = db;

