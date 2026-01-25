const { Pool } = require('pg');
require('dotenv').config();

// Create PostgreSQL connection pool with AWS RDS support
const poolConfig = {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  // SSL configuration for AWS RDS (required for RDS)
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  // Connection pool settings
  max: parseInt(process.env.DB_POOL_MAX) || 20,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT) || 30000,
  connectionTimeoutMillis: parseInt(process.env.DB_CONNECT_TIMEOUT) || 10000,
};

const pool = new Pool(poolConfig);

// Test the connection with enhanced logging
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err.stack);
    console.error('Connection details:', {
      host: poolConfig.host,
      port: poolConfig.port,
      database: poolConfig.database,
      ssl: poolConfig.ssl ? 'enabled' : 'disabled'
    });
    process.exit(1);
  } else {
    console.log('Connected to PostgreSQL database');
    console.log('Database:', poolConfig.database);
    console.log('Host:', poolConfig.host);
    console.log('SSL:', poolConfig.ssl ? 'enabled' : 'disabled');
    release();
  }
});

// Graceful shutdown handling
const gracefulShutdown = async () => {
  console.log('Received shutdown signal, closing database connections...');
  try {
    await pool.end();
    console.log('Database connections closed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error during graceful shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

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

