import pkg from "pg";
const { Pool } = pkg;

// Create pool connection using env variables
const pool = new Pool({
  user: "envguideuser",
  host: "139.162.161.40",
  database: "envguide",
  password: "1234567890",
  port: 5432,
  max: 40,
  idleTimeoutMillis: 30,
  connectionTimeoutMillis: 8000,
});

const client = await pool.connect();

export default client;
