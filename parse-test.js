require('dotenv').config({ path: './frontend/.env' });
const { parse } = require('pg-connection-string');
console.log("Parsed:", parse(process.env.DATABASE_URL));
