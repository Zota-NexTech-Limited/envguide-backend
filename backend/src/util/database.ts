import pkg from "pg";
const { Pool } = pkg;

// Create pool connection using env variables
const pool = new Pool({
  user: "envguideuser",
  host: "139.162.161.40",
  database: "envguide",
  password: "1234567890",
  port: 5432,
  max: 20, // Reduced from 40 to prevent pool exhaustion
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000, // 20 seconds
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// const client = await pool.connect();
// export default client;

pool.on('connect', () => {
  console.log('Connected to the database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client:', err);
  process.exit(-1);
});

export async function withClient(callback: (client: any) => Promise<any>) {
  let client;
  let retries = 3;
  let lastError;
  
  while (retries > 0) {
    try {
      client = await pool.connect();
      return await callback(client);
    } catch (error: any) {
      lastError = error;
      console.error(`Database connection error (${retries} retries left):`, error.message);
      
      // If it's a connection timeout or connection error, retry
      if (error.message.includes('timeout') || error.message.includes('Connection terminated') || error.code === 'ECONNREFUSED') {
        retries--;
        if (retries > 0) {
          console.log(`Retrying database connection in 2 seconds...`);
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      } else {
        // For other errors, don't retry
        break;
      }
    } finally {
      if (client) {
        client.release();
        client = null;
      }
    }
  }
  
  console.error('Database connection failed after retries:', lastError?.message);
  throw new Error(`Database error: ${lastError?.message || String(lastError)}`);
}

