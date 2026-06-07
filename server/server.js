const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

// Test database connection before starting server.
pool.connect((err, client, release) => {
  if (err) {
    console.error('Database connection failed.');
    console.error(
      `Check DB_HOST=${process.env.DB_HOST || 'localhost'}, DB_PORT=${process.env.DB_PORT || '5432'}, DB_USER=${process.env.DB_USER || 'postgres'}, DB_NAME=${process.env.DB_NAME || 'air_collection'} in server/.env.`
    );
    console.error(err.stack);
    process.exit(1);
  }

  console.log('Connected to PostgreSQL database');
  release();

  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop the existing Node server or set a different PORT in server/.env.`);
    } else {
      console.error('Server failed to start:', error);
    }

    process.exit(1);
  });
});
