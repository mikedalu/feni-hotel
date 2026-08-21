require('dotenv').config({ path: './frontend/.env' });
const { Pool } = require('pg');
try {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  pool.connect().then(() => {
    console.log("Connected successfully");
    process.exit(0);
  }).catch(e => {
    console.error("Connection error:", e);
    process.exit(1);
  });
} catch(e) {
  console.error("Sync error:", e);
}
