// READ-ONLY: check aircraft/air-freight for a response — what the engine computed
// (pcf_computed_field stage fields) AND the raw Q16a/Q19 transport rows.
import * as dotenv from "dotenv";
import pkg from "pg";
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({
  user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD, port: Number(process.env.DB_PORT) || 5432, ssl: false,
});
const RID = process.argv[2] || "01KXGC7M32VAT8774ZXBCRQ39K"; // brake pedal latest
const c = await pool.connect();
try {
  console.log(`Response ${RID}\n`);

  // 1) computed stage fields (aircraft + the pcf totals)
  const cf = (await c.query(
    `SELECT field_path, value FROM pcf_computed_field
       WHERE response_id=$1 AND (field_path LIKE 'packagingStage.%' OR field_path LIKE 'distributionStage.%')
       ORDER BY field_path`, [RID]
  )).rows;
  console.log("=== computed packaging/distribution stage fields (pcf_computed_field) ===");
  for (const r of cf) console.log(`  ${r.field_path} = ${r.value}`);

  // 2) list transport-ish tables and dump any with mode/air columns
  const tbls = (await c.query(
    `SELECT table_name FROM information_schema.tables
      WHERE table_schema='public' AND (table_name ILIKE 'sq_q16%' OR table_name ILIKE 'sq_q19%' OR table_name ILIKE '%transport%')
      ORDER BY table_name`
  )).rows.map(r => r.table_name);
  console.log(`\n=== candidate transport tables: ${tbls.join(", ") || "(none)"} ===`);
  for (const t of tbls) {
    const rows = (await c.query(`SELECT * FROM ${t} WHERE response_id=$1`, [RID])).rows;
    console.log(`\n-- ${t}: ${rows.length} row(s) --`);
    for (const row of rows) {
      // show only columns that look relevant
      const keep = {};
      for (const [k, v] of Object.entries(row)) {
        if (/mode|transport|air|weight|distance|km|source|destination|dest|leg/i.test(k)) keep[k] = v;
      }
      console.log("   ", JSON.stringify(keep));
    }
  }
} finally { c.release(); await pool.end(); }
