import * as dotenv from "dotenv"; import pkg from "pg"; dotenv.config();
const { Pool } = pkg;
const pool = new Pool({ user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME, password: process.env.DB_PASSWORD, port: Number(process.env.DB_PORT)||5432, ssl:false });
const RID = process.argv[2] || "01KXGC7M32VAT8774ZXBCRQ39K";
const c = await pool.connect();
try {
  for (const t of ["sq_q16a_packaging_transport","sq_q19_transport_legs"]) {
    const rows = (await c.query(`SELECT * FROM ${t} WHERE response_id=$1`, [RID])).rows;
    console.log(`\n-- ${t}: ${rows.length} row(s) --`);
    for (const row of rows) console.log("  ", JSON.stringify(row));
  }
} finally { c.release(); await pool.end(); }
