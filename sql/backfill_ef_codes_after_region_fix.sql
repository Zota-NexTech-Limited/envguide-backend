-- ============================================================================
-- BACKFILL ef_code on existing questionnaire rows after the region-fix
-- ============================================================================
-- Why this exists:
--   Before the region-plumbing fix, the save handler called
--   deriveSupplierRegion(data) with a subset of the payload that didn't
--   contain production_site_details_questions. So region resolved to NULL,
--   the resolver skipped its `WHERE region = ?` filter, and ef_code was set
--   to whichever row PostgreSQL returned first when multiple regions
--   (EU / INDIA / GLOBAL) matched the same layers. Most rows got INDIA.
--
-- What this does:
--   For every existing questionnaire row that has layers stored:
--     1. Looks up the supplier's region via production_site_details_questions
--     2. Finds the correct EF row by exact layer + region match,
--        preferring the row whose year equals the supplier's reporting year,
--        else the most recent year available (same fallback the resolver uses)
--     3. Updates ef_code only if the new value differs from the saved one
--
-- Safety:
--   - Wrapped in a single transaction. Rolls back on any error.
--   - Rows without layers (free-text legacy entries) are skipped.
--   - Rows whose supplier has no recognized region (NULL / unmapped) are skipped.
--   - Rows where no EF row matches at all are skipped (ef_code left as-is).
--   - Safe to re-run; only updates rows where the value would change.
--
-- How to run:
--   psql -U envguideuser -d envguide -f backfill_ef_codes_after_region_fix.sql
--   (or paste into pgAdmin's query tool)
-- ============================================================================

BEGIN;

-- Per-sgiq region + reporting year, normalized to EU / INDIA / GLOBAL.
-- Built once and reused across all 7 UPDATE statements via subquery.
-- NOTE: PostgreSQL doesn't share CTEs across statements, so each UPDATE
-- inlines this same logic. Kept identical for consistency.

-- ----------------------------------------------------------------------------
-- 1) Electricity (Q22) → electricity_emission_factor, joins via stide_id
-- ----------------------------------------------------------------------------
WITH supplier_region AS (
    SELECT sgiq.sgiq_id,
           sgiq.annual_reporting_period AS reporting_year,
           CASE LOWER(TRIM(psd.location))
               WHEN 'europe' THEN 'EU'
               WHEN 'eu'     THEN 'EU'
               WHEN 'india'  THEN 'INDIA'
               WHEN 'in'     THEN 'INDIA'
               WHEN 'global' THEN 'GLOBAL'
               ELSE NULLIF(UPPER(TRIM(psd.location)), '')
           END AS region
    FROM supplier_general_info_questions sgiq
    LEFT JOIN supplier_product_questions spq ON spq.sgiq_id = sgiq.sgiq_id
    LEFT JOIN production_site_details_questions psd ON psd.spq_id = spq.spq_id
),
best_match AS (
    SELECT q.stidefpe_id,
           (
               SELECT ef.ef_code
               FROM electricity_emission_factor ef
               WHERE ef.ef_code IS NOT NULL
                 AND ef.layer1 = q.layer1
                 AND ef.layer2 = q.layer2
                 AND ef.layer3 = q.layer3
                 AND ef.layer4 = q.layer4
                 AND ef.region = sr.region
               ORDER BY CASE WHEN ef.year = sr.reporting_year THEN 0 ELSE 1 END,
                        ef.year DESC NULLS LAST
               LIMIT 1
           ) AS new_ef_code
    FROM scope_two_indirect_emissions_from_purchased_energy_questions q
    JOIN scope_two_indirect_emissions_questions stide ON stide.stide_id = q.stide_id
    JOIN supplier_region sr ON sr.sgiq_id = stide.sgiq_id
    WHERE q.layer1 IS NOT NULL AND sr.region IS NOT NULL
)
UPDATE scope_two_indirect_emissions_from_purchased_energy_questions q
SET ef_code = bm.new_ef_code
FROM best_match bm
WHERE q.stidefpe_id = bm.stidefpe_id
  AND bm.new_ef_code IS NOT NULL
  AND q.ef_code IS DISTINCT FROM bm.new_ef_code;

-- ----------------------------------------------------------------------------
-- 2) Raw materials (Q52) → materials_emission_factor, joins via stoie_id
-- ----------------------------------------------------------------------------
WITH supplier_region AS (
    SELECT sgiq.sgiq_id,
           sgiq.annual_reporting_period AS reporting_year,
           CASE LOWER(TRIM(psd.location))
               WHEN 'europe' THEN 'EU'
               WHEN 'eu'     THEN 'EU'
               WHEN 'india'  THEN 'INDIA'
               WHEN 'in'     THEN 'INDIA'
               WHEN 'global' THEN 'GLOBAL'
               ELSE NULLIF(UPPER(TRIM(psd.location)), '')
           END AS region
    FROM supplier_general_info_questions sgiq
    LEFT JOIN supplier_product_questions spq ON spq.sgiq_id = sgiq.sgiq_id
    LEFT JOIN production_site_details_questions psd ON psd.spq_id = spq.spq_id
),
best_match AS (
    SELECT q.rmuicm_id,
           (
               SELECT ef.ef_code
               FROM materials_emission_factor ef
               WHERE ef.ef_code IS NOT NULL
                 AND ef.layer1 = q.layer1
                 AND ef.layer2 = q.layer2
                 AND ef.layer3 = q.layer3
                 AND ef.layer4 = q.layer4
                 AND ef.region = sr.region
               ORDER BY CASE WHEN ef.year = sr.reporting_year THEN 0 ELSE 1 END,
                        ef.year DESC NULLS LAST
               LIMIT 1
           ) AS new_ef_code
    FROM raw_materials_used_in_component_manufacturing_questions q
    JOIN scope_three_other_indirect_emissions_questions stoie ON stoie.stoie_id = q.stoie_id
    JOIN supplier_region sr ON sr.sgiq_id = stoie.sgiq_id
    WHERE q.layer1 IS NOT NULL AND sr.region IS NOT NULL
)
UPDATE raw_materials_used_in_component_manufacturing_questions q
SET ef_code = bm.new_ef_code
FROM best_match bm
WHERE q.rmuicm_id = bm.rmuicm_id
  AND bm.new_ef_code IS NOT NULL
  AND q.ef_code IS DISTINCT FROM bm.new_ef_code;

-- ----------------------------------------------------------------------------
-- 3) Recycled materials → materials_emission_factor, joins via stoie_id
-- ----------------------------------------------------------------------------
WITH supplier_region AS (
    SELECT sgiq.sgiq_id,
           sgiq.annual_reporting_period AS reporting_year,
           CASE LOWER(TRIM(psd.location))
               WHEN 'europe' THEN 'EU'
               WHEN 'eu'     THEN 'EU'
               WHEN 'india'  THEN 'INDIA'
               WHEN 'in'     THEN 'INDIA'
               WHEN 'global' THEN 'GLOBAL'
               ELSE NULLIF(UPPER(TRIM(psd.location)), '')
           END AS region
    FROM supplier_general_info_questions sgiq
    LEFT JOIN supplier_product_questions spq ON spq.sgiq_id = sgiq.sgiq_id
    LEFT JOIN production_site_details_questions psd ON psd.spq_id = spq.spq_id
),
best_match AS (
    SELECT q.rmwp_id,
           (
               SELECT ef.ef_code
               FROM materials_emission_factor ef
               WHERE ef.ef_code IS NOT NULL
                 AND ef.layer1 = q.layer1
                 AND ef.layer2 = q.layer2
                 AND ef.layer3 = q.layer3
                 AND ef.layer4 = q.layer4
                 AND ef.region = sr.region
               ORDER BY CASE WHEN ef.year = sr.reporting_year THEN 0 ELSE 1 END,
                        ef.year DESC NULLS LAST
               LIMIT 1
           ) AS new_ef_code
    FROM recycled_materials_with_percentage_questions q
    JOIN scope_three_other_indirect_emissions_questions stoie ON stoie.stoie_id = q.stoie_id
    JOIN supplier_region sr ON sr.sgiq_id = stoie.sgiq_id
    WHERE q.layer1 IS NOT NULL AND sr.region IS NOT NULL
)
UPDATE recycled_materials_with_percentage_questions q
SET ef_code = bm.new_ef_code
FROM best_match bm
WHERE q.rmwp_id = bm.rmwp_id
  AND bm.new_ef_code IS NOT NULL
  AND q.ef_code IS DISTINCT FROM bm.new_ef_code;

-- ----------------------------------------------------------------------------
-- 4) PIR/PCR materials → materials_emission_factor, joins via stoie_id
-- ----------------------------------------------------------------------------
WITH supplier_region AS (
    SELECT sgiq.sgiq_id,
           sgiq.annual_reporting_period AS reporting_year,
           CASE LOWER(TRIM(psd.location))
               WHEN 'europe' THEN 'EU'
               WHEN 'eu'     THEN 'EU'
               WHEN 'india'  THEN 'INDIA'
               WHEN 'in'     THEN 'INDIA'
               WHEN 'global' THEN 'GLOBAL'
               ELSE NULLIF(UPPER(TRIM(psd.location)), '')
           END AS region
    FROM supplier_general_info_questions sgiq
    LEFT JOIN supplier_product_questions spq ON spq.sgiq_id = sgiq.sgiq_id
    LEFT JOIN production_site_details_questions psd ON psd.spq_id = spq.spq_id
),
best_match AS (
    SELECT q.ppmp_id,
           (
               SELECT ef.ef_code
               FROM materials_emission_factor ef
               WHERE ef.ef_code IS NOT NULL
                 AND ef.layer1 = q.layer1
                 AND ef.layer2 = q.layer2
                 AND ef.layer3 = q.layer3
                 AND ef.layer4 = q.layer4
                 AND ef.region = sr.region
               ORDER BY CASE WHEN ef.year = sr.reporting_year THEN 0 ELSE 1 END,
                        ef.year DESC NULLS LAST
               LIMIT 1
           ) AS new_ef_code
    FROM pir_pcr_material_percentage_questions q
    JOIN scope_three_other_indirect_emissions_questions stoie ON stoie.stoie_id = q.stoie_id
    JOIN supplier_region sr ON sr.sgiq_id = stoie.sgiq_id
    WHERE q.layer1 IS NOT NULL AND sr.region IS NOT NULL
)
UPDATE pir_pcr_material_percentage_questions q
SET ef_code = bm.new_ef_code
FROM best_match bm
WHERE q.ppmp_id = bm.ppmp_id
  AND bm.new_ef_code IS NOT NULL
  AND q.ef_code IS DISTINCT FROM bm.new_ef_code;

-- ----------------------------------------------------------------------------
-- 5) Packaging (Q60) → packaging_material_treatment_type_emission_factor
-- ----------------------------------------------------------------------------
WITH supplier_region AS (
    SELECT sgiq.sgiq_id,
           sgiq.annual_reporting_period AS reporting_year,
           CASE LOWER(TRIM(psd.location))
               WHEN 'europe' THEN 'EU'
               WHEN 'eu'     THEN 'EU'
               WHEN 'india'  THEN 'INDIA'
               WHEN 'in'     THEN 'INDIA'
               WHEN 'global' THEN 'GLOBAL'
               ELSE NULLIF(UPPER(TRIM(psd.location)), '')
           END AS region
    FROM supplier_general_info_questions sgiq
    LEFT JOIN supplier_product_questions spq ON spq.sgiq_id = sgiq.sgiq_id
    LEFT JOIN production_site_details_questions psd ON psd.spq_id = spq.spq_id
),
best_match AS (
    SELECT q.topmudp_id,
           (
               SELECT ef.ef_code
               FROM packaging_material_treatment_type_emission_factor ef
               WHERE ef.ef_code IS NOT NULL
                 AND ef.layer1 = q.layer1
                 AND ef.layer2 = q.layer2
                 AND ef.layer3 = q.layer3
                 AND ef.layer4 = q.layer4
                 AND ef.region = sr.region
               ORDER BY CASE WHEN ef.year = sr.reporting_year THEN 0 ELSE 1 END,
                        ef.year DESC NULLS LAST
               LIMIT 1
           ) AS new_ef_code
    FROM type_of_pack_mat_used_for_delivering_questions q
    JOIN scope_three_other_indirect_emissions_questions stoie ON stoie.stoie_id = q.stoie_id
    JOIN supplier_region sr ON sr.sgiq_id = stoie.sgiq_id
    WHERE q.layer1 IS NOT NULL AND sr.region IS NOT NULL
)
UPDATE type_of_pack_mat_used_for_delivering_questions q
SET ef_code = bm.new_ef_code
FROM best_match bm
WHERE q.topmudp_id = bm.topmudp_id
  AND bm.new_ef_code IS NOT NULL
  AND q.ef_code IS DISTINCT FROM bm.new_ef_code;

-- ----------------------------------------------------------------------------
-- 6) Production/packaging waste (Q68) → waste_material_treatment_type_emission_factor
-- ----------------------------------------------------------------------------
WITH supplier_region AS (
    SELECT sgiq.sgiq_id,
           sgiq.annual_reporting_period AS reporting_year,
           CASE LOWER(TRIM(psd.location))
               WHEN 'europe' THEN 'EU'
               WHEN 'eu'     THEN 'EU'
               WHEN 'india'  THEN 'INDIA'
               WHEN 'in'     THEN 'INDIA'
               WHEN 'global' THEN 'GLOBAL'
               ELSE NULLIF(UPPER(TRIM(psd.location)), '')
           END AS region
    FROM supplier_general_info_questions sgiq
    LEFT JOIN supplier_product_questions spq ON spq.sgiq_id = sgiq.sgiq_id
    LEFT JOIN production_site_details_questions psd ON psd.spq_id = spq.spq_id
),
best_match AS (
    SELECT q.woppw_id,
           (
               SELECT ef.ef_code
               FROM waste_material_treatment_type_emission_factor ef
               WHERE ef.ef_code IS NOT NULL
                 AND ef.layer1 = q.layer1
                 AND ef.layer2 = q.layer2
                 AND ef.layer3 = q.layer3
                 AND ef.layer4 = q.layer4
                 AND ef.region = sr.region
               ORDER BY CASE WHEN ef.year = sr.reporting_year THEN 0 ELSE 1 END,
                        ef.year DESC NULLS LAST
               LIMIT 1
           ) AS new_ef_code
    FROM weight_of_pro_packaging_waste_questions q
    JOIN scope_three_other_indirect_emissions_questions stoie ON stoie.stoie_id = q.stoie_id
    JOIN supplier_region sr ON sr.sgiq_id = stoie.sgiq_id
    WHERE q.layer1 IS NOT NULL AND sr.region IS NOT NULL
)
UPDATE weight_of_pro_packaging_waste_questions q
SET ef_code = bm.new_ef_code
FROM best_match bm
WHERE q.woppw_id = bm.woppw_id
  AND bm.new_ef_code IS NOT NULL
  AND q.ef_code IS DISTINCT FROM bm.new_ef_code;

-- ----------------------------------------------------------------------------
-- 7) Transport (Q74) → vehicle_type_emission_factor, joins via stoie_id
-- ----------------------------------------------------------------------------
WITH supplier_region AS (
    SELECT sgiq.sgiq_id,
           sgiq.annual_reporting_period AS reporting_year,
           CASE LOWER(TRIM(psd.location))
               WHEN 'europe' THEN 'EU'
               WHEN 'eu'     THEN 'EU'
               WHEN 'india'  THEN 'INDIA'
               WHEN 'in'     THEN 'INDIA'
               WHEN 'global' THEN 'GLOBAL'
               ELSE NULLIF(UPPER(TRIM(psd.location)), '')
           END AS region
    FROM supplier_general_info_questions sgiq
    LEFT JOIN supplier_product_questions spq ON spq.sgiq_id = sgiq.sgiq_id
    LEFT JOIN production_site_details_questions psd ON psd.spq_id = spq.spq_id
),
best_match AS (
    SELECT q.motuft_id,
           (
               SELECT ef.ef_code
               FROM vehicle_type_emission_factor ef
               WHERE ef.ef_code IS NOT NULL
                 AND ef.layer1 = q.layer1
                 AND ef.layer2 = q.layer2
                 AND ef.layer3 = q.layer3
                 AND ef.layer4 = q.layer4
                 AND ef.region = sr.region
               ORDER BY CASE WHEN ef.year = sr.reporting_year THEN 0 ELSE 1 END,
                        ef.year DESC NULLS LAST
               LIMIT 1
           ) AS new_ef_code
    FROM mode_of_transport_used_for_transportation_questions q
    JOIN scope_three_other_indirect_emissions_questions stoie ON stoie.stoie_id = q.stoie_id
    JOIN supplier_region sr ON sr.sgiq_id = stoie.sgiq_id
    WHERE q.layer1 IS NOT NULL AND sr.region IS NOT NULL
)
UPDATE mode_of_transport_used_for_transportation_questions q
SET ef_code = bm.new_ef_code
FROM best_match bm
WHERE q.motuft_id = bm.motuft_id
  AND bm.new_ef_code IS NOT NULL
  AND q.ef_code IS DISTINCT FROM bm.new_ef_code;

COMMIT;

-- ============================================================================
-- Post-run verification queries (run these AFTER committing to sanity-check)
-- ============================================================================

-- a) Confirm Q22 electricity rows now point to a region-matched EF
-- SELECT q.stidefpe_id, q.ef_code, ef.region, ef.year, ef.ef_value, psd.location
-- FROM scope_two_indirect_emissions_from_purchased_energy_questions q
-- JOIN electricity_emission_factor ef ON ef.ef_code = q.ef_code
-- JOIN scope_two_indirect_emissions_questions stide ON stide.stide_id = q.stide_id
-- JOIN supplier_general_info_questions sgiq ON sgiq.sgiq_id = stide.sgiq_id
-- LEFT JOIN supplier_product_questions spq ON spq.sgiq_id = sgiq.sgiq_id
-- LEFT JOIN production_site_details_questions psd ON psd.spq_id = spq.spq_id
-- LIMIT 20;

-- b) Same template can be run for the other 6 tables — swap the joins.
