// test-formula-engine.mjs — seed a small synthetic supplier response,
// run the formula engine, print computed v9 fields, then clean up.
//
// RUN ORDER:
//   1. npm run build-main
//   2. node test-formula-engine.mjs
import "dotenv/config";
import { existsSync } from "node:fs";

const dist = "./dist/services/formulaEngine.js";
if (!existsSync(dist)) {
    console.error("❌ Compiled output not found. Run `npm run build-main` first.");
    process.exit(1);
}

const { computePcfFields } = await import("./dist/services/formulaEngine.js");
const { withClient } = await import("./dist/util/database.js");
const { ulid } = await import("ulid");

const responseId = `test_resp_${ulid()}`;
const siteId = ulid();
const bom1 = ulid();
const bom2 = ulid();
const elec = ulid();
const fuel = ulid();
const waste = ulid();
const pkg = ulid();
const xport = ulid();

// Seed synthetic supplier data.
await withClient(async (client) => {
    await client.query(
        `INSERT INTO supplier_questionnaire_response (
            id, bom_pcf_request_id, supplier_id, status,
            company_name, product_name_company, product_mass_per_declared_unit,
            declared_unit, declared_unit_amount,
            reference_period_start, reference_period_end,
            co_products_present, packaging_emissions_included, distribution_stage_included,
            ipcc_gwp_version,
            total_production_volume, certified_volume,
            verified_volume_1st_party, verified_volume_2nd_party, verified_volume_3rd_party,
            total_product_volume
        ) VALUES (
            $1, 'TEST_PCF', 'TEST_SUP', 'draft',
            'ABC Automotive Pvt Ltd', 'Front Bumper Bracket', 2.5,
            'piece', 1,
            '2025-01-01', '2025-12-31',
            FALSE, TRUE, TRUE,
            'AR6',
            10000, 8000, 10000, 0, 5000, 10000
        )`,
        [responseId]
    );

    await client.query(
        `INSERT INTO sq_q4_sites (id, response_id, site_name, country, region, is_primary, row_order)
         VALUES ($1, $2, 'Plant A', 'IN', 'Asia', TRUE, 0)`,
        [siteId, responseId]
    );

    // Q8 BOM: 70% aluminium (fossil + 5% biogenic), 30% steel
    await client.query(
        `INSERT INTO sq_q8_bom (
            id, response_id, component_name, material, process,
            mass_pct, carbon_pct, biogenic_y_n, biogenic_carbon_pct,
            recycled_y_n, recycled_carbon_pct, row_order
         ) VALUES
            ($1, $2, 'Aluminium body',  'Aluminium', 'Die Casting', 70, 30, TRUE,  5,  TRUE, 10, 0),
            ($3, $2, 'Steel reinforcer', 'Steel',     'Stamping',   30, 20, FALSE, 0,  FALSE, 0, 1)`,
        [bom1, responseId, bom2]
    );

    // Q10 electricity
    await client.query(
        `INSERT INTO sq_q10_electricity (
            id, response_id, electricity_type, quantity, unit, renewable_pct, row_order
         ) VALUES ($1, $2, 'Grid', 4.5, 'kWh', 30, 0)`,
        [elec, responseId]
    );

    // Q11 fuel
    await client.query(
        `INSERT INTO sq_q11_fuels (
            id, response_id, fuel_carrier, quantity, unit, biogenic_y_n, row_order
         ) VALUES ($1, $2, 'Natural gas', 0.2, 'kg', FALSE, 0)`,
        [fuel, responseId]
    );

    // Q14 production waste
    await client.query(
        `INSERT INTO sq_q14_production_waste (
            id, response_id, waste_type, treatment_type, quantity, unit, row_order
         ) VALUES ($1, $2, 'Aluminium', 'Recycling', 0.1, 'kg', 0)`,
        [waste, responseId]
    );

    // Q16 packaging
    await client.query(
        `INSERT INTO sq_q16_packaging_materials (
            id, response_id, packaging_type, packaging_weight, unit, country, region, recycled_pct, row_order
         ) VALUES ($1, $2, 'Cardboard', 0.05, 'kg', 'IN', 'Asia', 60, 0)`,
        [pkg, responseId]
    );

    // Q19 transport leg (road)
    await client.query(
        `INSERT INTO sq_q19_transport_legs (
            id, response_id, transport_mode, source, destination,
            weight, unit, distance_km, row_order
         ) VALUES ($1, $2, 'Truck', 'Mysore', 'Chennai', 2.5, 'kg', 500, 0)`,
        [xport, responseId]
    );
});

console.log("\n=== Running formula engine ===\n");
const start = Date.now();
let computed;
try {
    computed = await computePcfFields(responseId);
} catch (err) {
    console.error("❌ engine error:", err.message);
    console.error(err.stack);
    await cleanup();
    process.exit(1);
}
const ms = Date.now() - start;

console.log(JSON.stringify(computed, null, 2));
console.log(`\n⏱  elapsed: ${ms}ms`);

console.log("\n=== pcf_computed_field rows ===");
await withClient(async (client) => {
    const r = await client.query(
        `SELECT field_path, value FROM pcf_computed_field WHERE response_id = $1 ORDER BY field_path`,
        [responseId]
    );
    for (const row of r.rows) {
        console.log(`  ${row.field_path.padEnd(60)} = ${row.value}`);
    }
});

console.log("\n=== ef_match_audit summary ===");
await withClient(async (client) => {
    const r = await client.query(
        `SELECT source_question, confidence_band, COUNT(*) as cnt
           FROM ef_match_audit
          WHERE response_id = $1
          GROUP BY source_question, confidence_band
          ORDER BY source_question`,
        [responseId]
    );
    for (const row of r.rows) {
        console.log(`  ${row.source_question.padEnd(30)} ${row.confidence_band.padEnd(10)} ${row.cnt}`);
    }
});

await cleanup();
console.log("\n🧹 cleanup done.");
process.exit(0);

async function cleanup() {
    await withClient(async (client) => {
        await client.query(`DELETE FROM pcf_computed_field WHERE response_id = $1`, [responseId]);
        await client.query(`DELETE FROM ef_match_audit WHERE response_id = $1`, [responseId]);
        await client.query(`DELETE FROM sq_q8_bom WHERE response_id = $1`, [responseId]);
        await client.query(`DELETE FROM sq_q10_electricity WHERE response_id = $1`, [responseId]);
        await client.query(`DELETE FROM sq_q11_fuels WHERE response_id = $1`, [responseId]);
        await client.query(`DELETE FROM sq_q14_production_waste WHERE response_id = $1`, [responseId]);
        await client.query(`DELETE FROM sq_q16_packaging_materials WHERE response_id = $1`, [responseId]);
        await client.query(`DELETE FROM sq_q19_transport_legs WHERE response_id = $1`, [responseId]);
        await client.query(`DELETE FROM sq_q4_sites WHERE response_id = $1`, [responseId]);
        await client.query(`DELETE FROM supplier_questionnaire_response WHERE id = $1`, [responseId]);
    });
}
