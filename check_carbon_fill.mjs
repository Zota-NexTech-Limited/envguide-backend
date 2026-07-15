// READ-ONLY: find PCF request(s) by product name and show the Q8 carbon fields
// the supplier actually entered. No writes.
import * as dotenv from "dotenv";
import pkg from "pg";
dotenv.config();
const { Pool } = pkg;
const pool = new Pool({
  user: process.env.DB_USER, host: process.env.DB_HOST, database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD, port: Number(process.env.DB_PORT) || 5432, ssl: false,
});
const term = process.argv[2] || "pedal";
const c = await pool.connect();
try {
  const resp = (await c.query(
    `SELECT id, product_name_company, product_mass_per_declared_unit, created_date
       FROM supplier_questionnaire_response
      WHERE product_name_company ILIKE $1
      ORDER BY created_date DESC NULLS LAST
      LIMIT 10`, [`%${term}%`]
  )).rows;
  console.log(`Responses matching "%${term}%": ${resp.length}\n`);
  for (const r of resp) {
    console.log(`==================================================================`);
    console.log(`Product: ${r.product_name_company}   id=${r.id}   mass=${r.product_mass_per_declared_unit}`);
    const rows = (await c.query(
      `SELECT material, mass_pct, carbon_pct, biogenic_y_n, biogenic_carbon_pct,
              recycled_y_n, recycled_carbon_pct
         FROM sq_q8_bom WHERE response_id=$1 ORDER BY row_order`, [r.id]
    )).rows;
    console.log(`  Q8 materials: ${rows.length}`);
    for (const m of rows) {
      console.log(`   - ${m.material || "(no name)"}: mass%=${m.mass_pct} carbon%=${m.carbon_pct} | ` +
        `biogenic? ${JSON.stringify(m.biogenic_y_n)} biogenic%=${m.biogenic_carbon_pct} | ` +
        `recycled? ${JSON.stringify(m.recycled_y_n)} recycled%=${m.recycled_carbon_pct}`);
    }
    // also show what got persisted for carbon content
    const cc = (await c.query(
      `SELECT field_path, value FROM pcf_computed_field
         WHERE response_id=$1 AND field_path LIKE 'carbonContent%' ORDER BY field_path`, [r.id]
    )).rows;
    console.log(`  pcf_computed_field carbonContent rows: ${cc.length}`);
    for (const x of cc) console.log(`      ${x.field_path} = ${x.value}`);
    console.log("");
  }
} finally { c.release(); await pool.end(); }
