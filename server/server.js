const app = require('./app');
const pool = require('./config/db');

const PORT = process.env.PORT || 5000;

// Test database connection before starting server
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.stack);
    process.exit(1);
  }
  console.log('✅ Connected to PostgreSQL database');
  release();
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});