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

// const client = await pool.connect();
// export default client;

pool.on('connect', () => {
  console.log('Connected to the database');
});

pool.on('error', (err) => {
  console.error('Error connecting to the database:', err);
});

export async function withClient(callback: (client: any) => Promise<any>) {
  let client;
  try {
    client = await pool.connect();
    return await callback(client);
  } catch (error: any) {
    throw new Error(error.message || String(error));
  } finally {
    if (client) client.release();
  }
}

