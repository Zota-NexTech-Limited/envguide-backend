// READ-ONLY: trace bomPcfRequestId -> components -> response -> carbonContent,
// and show what the FIXED publish payload's carbonContentDetail would be
// vs the current fallback. No writes.
import * as dotenv from "dotenv";
import pkg from "pg";
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({
  user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD, port: Number(process.env.DB_PORT) || 5432, ssl: false,
});
const term = process.argv[2] || "Brake Pedal";
const c = await pool.connect();
try {
  // most recent request for this product
  const resp = (await c.query(
    `SELECT id, bom_pcf_request_id, supplier_id, product_name_company
       FROM supplier_questionnaire_response
      WHERE product_name_company ILIKE $1
      ORDER BY created_date DESC NULLS LAST LIMIT 1`, [`%${term}%`]
  )).rows[0];
  if (!resp) { console.log("no response for", term); process.exit(0); }
  const reqId = resp.bom_pcf_request_id;
  console.log(`Response ${resp.id}`);
  console.log(`  product   = ${resp.product_name_company}`);
  console.log(`  requestId = ${reqId}\n`);

  // replicate loadComponentResponses(bomPcfId)
  const boms = (await c.query(
    `SELECT id, component_name, supplier_id FROM bom WHERE bom_pcf_id = $1`, [reqId]
  )).rows;
  console.log(`Components (bom rows) for request: ${boms.length}`);
  const responseIds = [];
  for (const b of boms) {
    if (!b.supplier_id) { console.log(`  - ${b.component_name}: no supplier_id (skipped)`); continue; }
    const r = (await c.query(
      `SELECT id FROM supplier_questionnaire_response
        WHERE bom_pcf_request_id=$1 AND supplier_id=$2 ORDER BY id DESC LIMIT 1`,
      [reqId, b.supplier_id]
    )).rows[0];
    console.log(`  - ${b.component_name}: response = ${r ? r.id : "(none)"}`);
    if (r) responseIds.push(r.id);
  }

  // aggregate carbonContent from pcf_computed_field across those responses
  const agg = { biogenicCarbonContent:0, fossilCarbonContent:0, recycledCarbonContent:0, carbonContentTotal:0, packagingBiogenicCarbonContent:0 };
  for (const rid of responseIds) {
    const rows = (await c.query(
      `SELECT field_path, value FROM pcf_computed_field
        WHERE response_id=$1 AND field_path LIKE 'carbonContent.%'`, [rid]
    )).rows;
    for (const x of rows) {
      const k = x.field_path.replace("carbonContent.", "");
      if (k in agg) agg[k] += Number(x.value);
    }
  }
  // current publish fallback total = overall PCF
  const em = (await c.query(
    `SELECT COALESCE(SUM(total_pcf_value),0) AS t FROM bom_emission_calculation_engine WHERE product_bom_pcf_id=$1`, [reqId]
  )).rows[0];

  console.log(`\n=== carbonContent the FIXED publish would send ===`);
  for (const k of Object.keys(agg)) console.log(`  ${k} = ${Math.round(agg[k]*1e6)/1e6}`);
  console.log(`\n=== what Quintari shows now (fallback) ===`);
  console.log(`  carbonContentTotal = ${em.t}  (overall PCF, WRONG slot)`);
  console.log(`  biogenic/fossil/recycled/packaging = 0`);
} finally { c.release(); await pool.end(); }
