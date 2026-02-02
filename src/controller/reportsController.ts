import { ulid } from 'ulid';
import { withClient } from '../util/database';
import { generateResponse } from '../util/genRes';

//  export async function getMaterialFootPrint(req: any, res: any) {
//     const {
//         pageNumber = 1,
//         pageSize = 20
//     } = req.query;

//     const limit = Number(pageSize);
//     const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
//     const offset = (page - 1) * limit;

//     return withClient(async (client: any) => {
//         try {
//             const query = `
// SELECT
//     b.id,
//     b.code,
//     b.material_number,
//     b.component_name,
//     b.qunatity,
//     b.production_location,
//     b.manufacturer,
//     b.detail_description,
//     b.weight_gms,
//     b.total_weight_gms,
//     b.component_category,
//     b.price,
//     b.total_price,
//     b.economic_ratio,
//     b.supplier_id,
//     b.is_weight_gms,
//     b.created_date,

//     /* ---------- SUPPLIER DETAILS ---------- */
//     jsonb_build_object(
//         'sup_id', sd.sup_id,
//         'code', sd.code,
//         'supplier_name', sd.supplier_name,
//         'supplier_email', sd.supplier_email
//     ) AS supplier_details,


//     /* ---------- Q52 : RAW MATERIAL TYPE DETAILS ---------- */
//     COALESCE(q52.q52_material_type_data, '[]'::jsonb) AS "Q52_material_type_data",

//     /* ---------- Q56 : Recycled Material ---------- */
//     COALESCE(q56.q56_recycled_material_data, '[]'::jsonb) AS "q56_recycled_material_data"
// FROM bom b

// LEFT JOIN supplier_details sd
//     ON sd.sup_id = b.supplier_id


// /* ---------- Q52 : RAW MATERIALS USED ---------- */
// LEFT JOIN LATERAL (
//     SELECT jsonb_agg(
//         jsonb_build_object(
//             'rmuicm_id', rm.rmuicm_id,
//             'stoie_id', rm.stoie_id,
//             'bom_id', rm.bom_id,
//             'material_number', rm.material_number,
//             'material_name', rm.material_name,
//             'percentage', rm.percentage,
//             'created_date', rm.created_date
//         )
//     ) AS q52_material_type_data
//     FROM raw_materials_used_in_component_manufacturing_questions rm
//     WHERE rm.bom_id = b.id
// ) q52 ON TRUE

// /* ---------- Q56 : Recycled materials with percentage ---------- */
// LEFT JOIN LATERAL (
//     SELECT jsonb_agg(
//         jsonb_build_object(
//             'rmwp_id', rmd.rmwp_id,
//             'stoie_id', rmd.stoie_id,
//             'bom_id', rmd.bom_id,
//             'material_number', rmd.material_number,
//             'material_name', rmd.material_name,
//             'percentage', rmd.percentage
//         )
//     ) AS q56_recycled_material_data
//     FROM recycled_materials_with_percentage_questions rmd
//     WHERE rmd.bom_id = b.id
// ) q56 ON TRUE

// WHERE b.is_bom_calculated = TRUE
// ORDER BY b.created_date DESC
// LIMIT $1 OFFSET $2;
// `;

//             const result = await client.query(query, [limit, offset]);

//             return res.status(200).send(
//                 generateResponse(true, "Success!", 200, {
//                     page,
//                     pageSize: limit,
//                     data: result.rows
//                 })
//             );

//         } catch (error: any) {
//             console.error("Error fetching Supplier Footprint:", error);
//             return res.status(500).json({
//                 success: false,
//                 message: error.message || "Failed to fetch Supplier Footprint"
//             });
//         }
//     });
// }
// export async function getMaterialFootPrint(req: any, res: any) {
//     const {
//         pageNumber = 1,
//         pageSize = 20
//     } = req.query;

//     const limit = Number(pageSize);
//     const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
//     const offset = (page - 1) * limit;

//     return withClient(async (client: any) => {
//         try {
//             const query = `
// SELECT
//     b.id,
//     b.code,
//     b.material_number,
//     b.bom_pcf_id,
//     b.component_name,
//     b.qunatity,
//     b.production_location,
//     b.manufacturer,
//     b.detail_description,
//     b.weight_gms,
//     b.total_weight_gms,
//     b.component_category,
//     b.price,
//     b.total_price,
//     b.economic_ratio,
//     b.supplier_id,
//     b.is_weight_gms,
//     b.created_date,

//     /* ---------- SUPPLIER DETAILS ---------- */
//     jsonb_build_object(
//         'sup_id', sd.sup_id,
//         'code', sd.code,
//         'supplier_name', sd.supplier_name,
//         'supplier_email', sd.supplier_email
//     ) AS supplier_details,

//     /* ---------- Q52 RAW MATERIAL DETAILS ---------- */
//     COALESCE(q52.q52_material_type_data, '[]'::jsonb) AS q52_material_type_data,

//     /* ---------- Q56 RECYCLED MATERIAL DETAILS ---------- */
//     COALESCE(q56.q56_recycled_material_data, '[]'::jsonb) AS q56_recycled_material_data

// FROM bom b

// LEFT JOIN supplier_details sd
//     ON sd.sup_id = b.supplier_id

// /* ================= Q52 : RAW MATERIALS (DEDUPED) ================= */
// LEFT JOIN LATERAL (

//     WITH supplier_ctx AS (
//         SELECT
//             sgi.annual_reporting_period AS year,
//             aso.country_iso_three AS iso_country_code
//         FROM supplier_general_info_questions sgi
//         LEFT JOIN availability_of_scope_one_two_three_emissions_questions aso
//             ON aso.sgiq_id = sgi.sgiq_id
//         WHERE sgi.bom_pcf_id = b.bom_pcf_id
//         LIMIT 1
//     )

//     SELECT jsonb_agg(
//         jsonb_build_object(
//             'rmuicm_id', rm.rmuicm_id,
//             'stoie_id', rm.stoie_id,
//             'bom_id', rm.bom_id,
//             'material_name', rm.material_name,
//             'material_number', rm.material_number,
//             'percentage', rm.percentage,
//             'year', ctx.year,
//             'iso_country_code', ctx.iso_country_code,
//             'unit', 'Kg',
//             'ef_eu_region', mef.ef_eu_region,
//             'ef_india_region', mef.ef_india_region,
//             'ef_global_region', mef.ef_global_region
//         )
//     ) AS q52_material_type_data

//     FROM raw_materials_used_in_component_manufacturing_questions rm
//     CROSS JOIN supplier_ctx ctx

//     LEFT JOIN materials_emission_factor mef
//         ON mef.year = ctx.year
//         AND mef.unit = 'Kg'
//         AND mef.iso_country_code = ctx.iso_country_code
//         AND lower(mef.element_name) = lower(rm.material_name)

//     WHERE rm.bom_id = b.id

// ) q52 ON TRUE



// /* ================= Q56 : RECYCLED MATERIAL (FIXED & CLEAN) ================= */
// LEFT JOIN LATERAL (
//     SELECT
//         jsonb_agg(
//             jsonb_build_object(
//                 'rmwp_id', rmd.rmwp_id,
//                 'stoie_id', rmd.stoie_id,
//                 'bom_id', rmd.bom_id,
//                 'material_name', rmd.material_name,
//                 'material_number', rmd.material_number,
//                 'percentage', rmd.percentage,

//                 'bom_weight_kg',
//                     (b.weight_gms::numeric / 1000),

//                 'recycled_weight_kg',
//                     ROUND(
//                         (
//                             (b.weight_gms::numeric / 1000)
//                             * COALESCE(rmd.percentage::numeric, 0)
//                             / 100
//                         ),
//                         4
//                     ),

//                 'emission_factor_used',
//                     COALESCE(
//                         CASE
//                             WHEN aso.country_iso_three = 'IN'
//                                 THEN mef.ef_india_region::numeric
//                             WHEN aso.country_iso_three = 'EU'
//                                 THEN mef.ef_eu_region::numeric
//                             ELSE
//                                 mef.ef_global_region::numeric
//                         END,
//                         0::numeric
//                     ),

//                 'emission_in_co2_eq',
//                     ROUND(
//                         (
//                             (
//                                 (b.weight_gms::numeric / 1000)
//                                 * COALESCE(rmd.percentage::numeric, 0)
//                                 / 100
//                             )
//                             *
//                             COALESCE(
//                                 CASE
//                                     WHEN aso.country_iso_three = 'IN'
//                                         THEN mef.ef_india_region::numeric
//                                     WHEN aso.country_iso_three = 'EU'
//                                         THEN mef.ef_eu_region::numeric
//                                     ELSE
//                                         mef.ef_global_region::numeric
//                                 END,
//                                 0::numeric
//                             )
//                         ),
//                         6
//                     )
//             )
//         ) AS q56_recycled_material_data

//     FROM recycled_materials_with_percentage_questions rmd

//     LEFT JOIN supplier_general_info_questions sgi
//         ON sgi.bom_pcf_id = b.bom_pcf_id

//     LEFT JOIN LATERAL (
//         SELECT country_iso_three
//         FROM availability_of_scope_one_two_three_emissions_questions
//         WHERE sgiq_id = sgi.sgiq_id
//         ORDER BY created_date ASC
//         LIMIT 1
//     ) aso ON TRUE

//     /* 🔑 ONE RAW MATERIAL PER BOM → NO DUPLICATION */
//     LEFT JOIN (
//         SELECT DISTINCT ON (bom_id)
//             bom_id,
//             material_name
//         FROM raw_materials_used_in_component_manufacturing_questions
//         WHERE material_name IS NOT NULL
//         ORDER BY bom_id
//     ) rm ON rm.bom_id = b.id

//     LEFT JOIN materials_emission_factor mef
//         ON mef.year = sgi.annual_reporting_period
//         AND mef.unit = 'kg'
//         AND mef.iso_country_code = aso.country_iso_three
//         AND mef.element_name = rm.material_name

//     WHERE rmd.bom_id = b.id
// ) q56 ON TRUE



// WHERE b.is_bom_calculated = TRUE
// ORDER BY b.created_date DESC
// LIMIT $1 OFFSET $2;
// `;

//             const result = await client.query(query, [limit, offset]);

//             return res.status(200).send(
//                 generateResponse(true, "Success!", 200, {
//                     page,
//                     pageSize: limit,
//                     data: result.rows
//                 })
//             );

//         } catch (error: any) {
//             console.error("Error fetching Supplier Footprint:", error);
//             return res.status(500).json({
//                 success: false,
//                 message: error.message || "Failed to fetch Supplier Footprint"
//             });
//         }
//     });
// }


export async function getProductFootPrint(req: any, res: any) {
    const {
        pageNumber = 1,
        pageSize = 20,

        code,
        material_number,
        component_name,
        production_location,
        manufacturer,
        component_category,

        supplier_code,
        supplier_name,

        material_type, // material_emission.material_type
        mode_of_transport, // transportation_details.mode_of_transport

        search,

        from_date,
        to_date
    } = req.query;

    const limit = Number(pageSize);
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    return withClient(async (client: any) => {
        try {

            // ----- BOM LEVEL FILTERS -----
            if (code) {
                conditions.push(`b.code ILIKE $${paramIndex++}`);
                values.push(`%${code}%`);
            }
            if (material_number) {
                conditions.push(`b.material_number ILIKE $${paramIndex++}`);
                values.push(`%${material_number}%`);
            }
            if (component_name) {
                conditions.push(`b.component_name ILIKE $${paramIndex++}`);
                values.push(`%${component_name}%`);
            }
            if (production_location) {
                conditions.push(`b.production_location ILIKE $${paramIndex++}`);
                values.push(`%${production_location}%`);
            }
            if (manufacturer) {
                conditions.push(`b.manufacturer ILIKE $${paramIndex++}`);
                values.push(`%${manufacturer}%`);
            }
            if (component_category) {
                conditions.push(`b.component_category ILIKE $${paramIndex++}`);
                values.push(`%${component_category}%`);
            }

            // ----- SUPPLIER FILTERS -----
            if (supplier_code) {
                conditions.push(`sd.code ILIKE $${paramIndex++}`);
                values.push(`%${supplier_code}%`);
            }
            if (supplier_name) {
                conditions.push(`sd.supplier_name ILIKE $${paramIndex++}`);
                values.push(`%${supplier_name}%`);

            }

            // ----- MATERIAL EMISSION FILTER -----
            if (material_type) {
                conditions.push(`
                    EXISTS (
                        SELECT 1
                        FROM bom_emission_material_calculation_engine mem
                        WHERE mem.bom_id = b.id
                          AND mem.material_type ILIKE $${paramIndex++}
                    )
                `);
                values.push(`%${material_type}%`);
            }

            // ----- TRANSPORTATION FILTER -----
            if (mode_of_transport) {
                conditions.push(`
                    EXISTS (
                        SELECT 1
                        FROM supplier_general_info_questions sgiq
                        JOIN scope_three_other_indirect_emissions_questions stoie
                            ON stoie.sgiq_id = sgiq.sgiq_id
                        JOIN mode_of_transport_used_for_transportation_questions mt
                            ON mt.stoie_id = stoie.stoie_id
                        WHERE sgiq.sup_id = b.supplier_id 
                          AND sgiq.client_id IS NULL
                          AND mt.mode_of_transport ILIKE $${paramIndex++}
                    )
                `);
                values.push(`%${mode_of_transport}%`);
            }

            // ----- SEARCH ACROSS MULTIPLE FIELDS -----
            if (search) {
                conditions.push(`
                    (
                        b.code ILIKE $${paramIndex}
                        OR b.material_number ILIKE $${paramIndex}
                        OR b.component_name ILIKE $${paramIndex}
                        OR b.production_location ILIKE $${paramIndex}
                        OR b.manufacturer ILIKE $${paramIndex}
                        OR b.component_category ILIKE $${paramIndex}
                        OR sd.code ILIKE $${paramIndex}
                        OR sd.supplier_name ILIKE $${paramIndex}
                    )
                `);
                values.push(`%${search}%`);
                paramIndex++;
            }


            // ----- DATE RANGE -----
            if (from_date) {
                conditions.push(`b.created_date >= $${paramIndex++}::date`);
                values.push(from_date);
            }
            if (to_date) {
                conditions.push(`b.created_date < ($${paramIndex++}::date + INTERVAL '1 day')`);
                values.push(to_date);
            }

            const query = `
SELECT
    b.id,
    b.code,
    b.material_number,
    b.component_name,
    b.qunatity,
    b.production_location,
    b.manufacturer,
    b.detail_description,
    b.weight_gms,
    b.total_weight_gms,
    b.component_category,
    b.price,
    b.total_price,
    b.economic_ratio,
    b.supplier_id,
    b.is_weight_gms,
    b.created_date,

      /* ---------- SUPPLIER DETAILS ---------- */
    jsonb_build_object(
        'sup_id', sd.sup_id,
        'code', sd.code,
        'supplier_name', sd.supplier_name,
        'supplier_email', sd.supplier_email
    ) AS supplier_details,

    /* ---------- MATERIAL EMISSION ---------- */
    (
        SELECT jsonb_agg(to_jsonb(mem))
        FROM bom_emission_material_calculation_engine mem
        WHERE mem.bom_id = b.id AND mem.product_id IS NULL
    ) AS material_emission,

    /* ---------- PRODUCTION EMISSION ---------- */
    (
        SELECT to_jsonb(mep)
        FROM bom_emission_production_calculation_engine mep
        WHERE mep.bom_id = b.id AND mep.product_id IS NULL
        LIMIT 1
    ) AS production_emission_calculation,

    /* ---------- PACKAGING EMISSION ---------- */
    (
        SELECT to_jsonb(mpk)
        FROM bom_emission_packaging_calculation_engine mpk
        WHERE mpk.bom_id = b.id AND mpk.product_id IS NULL
        LIMIT 1
    ) AS packaging_emission_calculation,

    /* ---------- WASTE EMISSION ---------- */
    (
        SELECT to_jsonb(mw)
        FROM bom_emission_waste_calculation_engine mw
        WHERE mw.bom_id = b.id AND mw.product_id IS NULL
        LIMIT 1
    ) AS waste_emission_calculation,

    /* ---------- LOGISTIC EMISSION ---------- */
    (
        SELECT to_jsonb(ml)
        FROM bom_emission_logistic_calculation_engine ml
        WHERE ml.bom_id = b.id AND ml.product_id IS NULL
        LIMIT 1
    ) AS logistic_emission_calculation,

    /* ---------- TOTAL PCF ---------- */
    (
        SELECT to_jsonb(pcfe)
        FROM bom_emission_calculation_engine pcfe
        WHERE pcfe.bom_id = b.id AND pcfe.product_id IS NULL
        LIMIT 1
    ) AS pcf_total_emission_calculation,

    /* ---------- TRANSPORTATION DETAILS ---------- */
    COALESCE(transport.transportation_details, '[]'::jsonb) AS transportation_details,

    /* ---------- ALLOCATION METHODOLOGY ---------- */
    (
        SELECT to_jsonb(am)
        FROM allocation_methodology am
        WHERE am.bom_id = b.id
        LIMIT 1
    ) AS allocation_methodology

FROM bom b
LEFT JOIN supplier_details sd
    ON sd.sup_id = b.supplier_id

/* ---------- TRANSPORTATION (LATERAL) ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'motuft_id', mt.motuft_id,
            'mode_of_transport', mt.mode_of_transport,
            'weight_transported', mt.weight_transported,
            'source_point', mt.source_point,
            'drop_point', mt.drop_point,
            'distance', mt.distance,
            'created_date', mt.created_date
        )
    ) AS transportation_details
    FROM supplier_general_info_questions sgiq
    JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.sgiq_id = sgiq.sgiq_id
    JOIN mode_of_transport_used_for_transportation_questions mt
        ON mt.stoie_id = stoie.stoie_id
    WHERE sgiq.sup_id = b.supplier_id AND sgiq.client_id IS NULL
) transport ON TRUE

WHERE b.is_bom_calculated = TRUE
${conditions.length ? `AND ${conditions.join(' AND ')}` : ''}
ORDER BY b.created_date DESC
LIMIT $${paramIndex++} OFFSET $${paramIndex++};
`;

            values.push(limit, offset);

            const result = await client.query(query, values);

            const rows = result.rows;
            const totalCount = rows.length > 0 ? rows.length : 0;

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    page,
                    pageSize: limit,
                    totalCount,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("Error fetching BOM list:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch BOM list"
            });
        }
    });
}

export async function getSupplierFootPrint(req: any, res: any) {
    const {
        pageNumber = 1,
        pageSize = 20,

        code,
        material_number,
        component_name,
        production_location,
        manufacturer,
        component_category,
        material_name, // Q52
        supplier_code,
        supplier_name,
        search,

        from_date,
        to_date
    } = req.query;

    const limit = Number(pageSize);
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    return withClient(async (client: any) => {
        try {

            if (code) {
                conditions.push(`b.code ILIKE $${paramIndex++}`);
                values.push(`%${code}%`);
            }

            if (material_number) {
                conditions.push(`b.material_number ILIKE $${paramIndex++}`);
                values.push(`%${material_number}%`);
            }

            if (component_name) {
                conditions.push(`b.component_name ILIKE $${paramIndex++}`);
                values.push(`%${component_name}%`);
            }

            if (production_location) {
                conditions.push(`b.production_location ILIKE $${paramIndex++}`);
                values.push(`%${production_location}%`);
            }

            if (manufacturer) {
                conditions.push(`b.manufacturer ILIKE $${paramIndex++}`);
                values.push(`%${manufacturer}%`);
            }

            if (component_category) {
                conditions.push(`b.component_category ILIKE $${paramIndex++}`);
                values.push(`%${component_category}%`);
            }

            if (material_name) {
                conditions.push(`
    EXISTS (
      SELECT 1
      FROM raw_materials_used_in_component_manufacturing_questions rm
      WHERE rm.bom_id = b.id
        AND rm.material_name ILIKE $${paramIndex++}
    )
  `);
                values.push(`%${material_name}%`);
            }

            // ----- SUPPLIER FILTERS -----
            if (supplier_code) {
                conditions.push(`sd.code ILIKE $${paramIndex++}`);
                values.push(`%${supplier_code}%`);
            }
            if (supplier_name) {
                conditions.push(`sd.supplier_name ILIKE $${paramIndex++}`);
                values.push(`%${supplier_name}%`);
            }


            if (search) {
                conditions.push(`
    (
      b.material_number ILIKE $${paramIndex}
      OR b.component_name ILIKE $${paramIndex}
      OR b.production_location ILIKE $${paramIndex}
      OR b.manufacturer ILIKE $${paramIndex}
      OR b.component_category ILIKE $${paramIndex}
    )
  `);
                values.push(`%${search}%`);
                paramIndex++;
            }


            if (from_date) {
                conditions.push(`b.created_date >= $${paramIndex++}::date`);
                values.push(from_date);
            }

            if (to_date) {
                conditions.push(
                    `b.created_date < ($${paramIndex++}::date + INTERVAL '1 day')`
                );
                values.push(to_date);
            }

            const query = `
SELECT
    b.id,
    b.code,
    b.bom_pcf_id,
    b.material_number,
    b.component_name,
    b.qunatity,
    b.production_location,
    b.manufacturer,
    b.weight_gms,
    b.total_weight_gms,
    b.component_category,
    b.price,
    b.total_price,
    b.economic_ratio,
    b.supplier_id,
    b.created_date,
    arp.annual_reporting_period,
    q56rm.percentage AS recycled_content_percentage,
    COALESCE(spcf.supplier_total_pcf_emission, 0) 
    AS supplier_total_pcf_emission,

    /* ---------- SUPPLIER DETAILS ---------- */
    jsonb_build_object(
        'sup_id', sd.sup_id,
        'code', sd.code,
        'supplier_name', sd.supplier_name,
        'supplier_email', sd.supplier_email
    ) AS supplier_details,

    
    /* ---------- Q13 : PRODUCTION SITE DETAILS ---------- */
    COALESCE(q13.q13_data, '[]'::jsonb) AS "Q13_data",

    /* ---------- Q52 : RAW MATERIAL TYPE DETAILS ---------- */
    COALESCE(q52.q52_material_type_data, '[]'::jsonb) AS "Q52_material_type_data",

      /* ---------- SCOPE 2 : PURCHASED ENERGY ---------- */
    COALESCE(q22.Q22_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q22_energy_type_and_energy_quantity",

     /* ---------- Q51 : ENERGY CONSUMPTION ---------- */
    COALESCE(q51.q51_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q51_energy_type_and_energy_quantity",

     /* ---------- Q67 : ENERGY CONSUMPTION ---------- */
    COALESCE(q67.q67_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q67_energy_type_and_energy_quantity"

FROM bom b

LEFT JOIN supplier_details sd
    ON sd.sup_id = b.supplier_id

LEFT JOIN LATERAL (
    SELECT *
    FROM recycled_materials_with_percentage_questions q56rm
    WHERE q56rm.bom_id = b.id
    ORDER BY q56rm.created_date ASC   -- or DESC if you want latest
    LIMIT 1
) q56rm ON TRUE

LEFT JOIN LATERAL (
    SELECT
        SUM(bece.total_pcf_value)::numeric AS supplier_total_pcf_emission
    FROM bom b2
    JOIN bom_emission_calculation_engine bece
        ON bece.bom_id = b2.id AND bece.product_id IS NULL
    WHERE b2.supplier_id = b.supplier_id
) spcf ON TRUE

LEFT JOIN LATERAL (
    SELECT sgiq.annual_reporting_period
    FROM supplier_general_info_questions sgiq
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
      AND sgiq.sup_id = b.supplier_id AND sgiq.client_id IS NULL
    ORDER BY sgiq.created_date ASC
    LIMIT 1
) arp ON TRUE

/* ---------- SINGLE LOCATION (FOR EMISSION FACTOR) ---------- */
LEFT JOIN LATERAL (
    SELECT psd.location
    FROM production_site_details_questions psd
    WHERE psd.bom_id = b.id
    ORDER BY psd.created_date ASC
    LIMIT 1
) loc ON TRUE


/* ---------- Q13 : PRODUCTION SITE DETAILS ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'psd_id', psd.psd_id,
            'spq_id', psd.spq_id,
            'bom_id', psd.bom_id,
            'material_number', psd.material_number,
            'product_name', psd.product_name,
            'location', psd.location,
            'created_date', psd.created_date
        )
    ) AS q13_data
    FROM production_site_details_questions psd
    WHERE psd.bom_id = b.id
) q13 ON TRUE

/* ---------- Q52 : RAW MATERIALS USED ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'rmuicm_id', rm.rmuicm_id,
            'stoie_id', rm.stoie_id,
            'bom_id', rm.bom_id,
            'material_number', rm.material_number,
            'material_name', rm.material_name,
            'percentage', rm.percentage,
            'created_date', rm.created_date
        )
    ) AS q52_material_type_data
    FROM raw_materials_used_in_component_manufacturing_questions rm
    WHERE rm.bom_id = b.id
) q52 ON TRUE

/* ---------- SCOPE 2 : PURCHASED ENERGY ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'stidefpe_id', pe.stidefpe_id,
            'stide_id', pe.stide_id,
            'energy_source', pe.energy_source,
            'energy_type', pe.energy_type,
            'quantity', pe.quantity,
            'unit', pe.unit,
            'sup_id', pe.sup_id,
            'created_date', pe.created_date,

            /* ---------- EMISSION FACTOR ---------- */
           'emission_factor',
COALESCE(
    CASE
        WHEN lower(split_part(pe.energy_source, ' ', 1)) IN
             ('electricity', 'heating', 'steam', 'cooling')
        THEN
            CASE
                WHEN lower(loc.location) = 'india' THEN
                    CASE
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'electricity' THEN ef.ef_india_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'heating'     THEN ef.ef_india_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'steam'       THEN ef.ef_india_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'cooling'     THEN ef.ef_india_region::numeric
                    END
                WHEN lower(loc.location) = 'europe' THEN
                    CASE
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'electricity' THEN ef.ef_eu_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'heating'     THEN ef.ef_eu_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'steam'       THEN ef.ef_eu_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'cooling'     THEN ef.ef_eu_region::numeric
                    END
                ELSE
                    CASE
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'electricity' THEN ef.ef_global_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'heating'     THEN ef.ef_global_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'steam'       THEN ef.ef_global_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'cooling'     THEN ef.ef_global_region::numeric
                    END
            END
        ELSE 0::numeric
    END,
0
)
        )
    ) AS Q22_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_two_indirect_emissions_questions stide
        ON stide.sgiq_id = sgiq.sgiq_id
    JOIN scope_two_indirect_emissions_from_purchased_energy_questions pe
        ON pe.stide_id = stide.stide_id

    /* ---------- ELECTRICITY EMISSION FACTOR JOIN ---------- */
    LEFT JOIN electricity_emission_factor ef
        ON ef.type_of_energy = ('Electricity - ' || pe.energy_type)
        AND ef.year = arp.annual_reporting_period
        AND ef.unit = pe.unit

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id AND sgiq.client_id IS NULL
) q22 ON TRUE


/* ---------- Q51 : ENERGY CONSUMPTION ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'ecfqfo_id', ec.ecfqfo_id,
            'stide_id', ec.stide_id,
            'energy_purchased', ec.energy_purchased,
            'energy_type', ec.energy_type,
            'quantity', ec.quantity,
            'unit', ec.unit,
            'created_date', ec.created_date,

            /* ---------- EMISSION FACTOR ---------- */
            'emission_factor',
            COALESCE(
                CASE
                    WHEN lower(split_part(ec.energy_purchased, ' ', 1)) IN
                         ('electricity', 'heating', 'steam', 'cooling')
                    THEN
                        CASE
                            WHEN lower(loc.location) = 'india'  THEN ef.ef_india_region::numeric
                            WHEN lower(loc.location) = 'europe' THEN ef.ef_eu_region::numeric
                            ELSE ef.ef_global_region::numeric
                        END
                    ELSE 0::numeric
                END,
            0)
        )
    ) AS q51_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_two_indirect_emissions_questions stide
        ON stide.sgiq_id = sgiq.sgiq_id
    JOIN energy_consumption_for_qfiftyone_questions ec
        ON ec.stide_id = stide.stide_id

    /* ---------- EMISSION FACTOR JOIN ---------- */
    LEFT JOIN electricity_emission_factor ef
        ON ef.type_of_energy =
           (initcap(split_part(ec.energy_purchased, ' ', 1)) || ' - ' || ec.energy_type)
        AND ef.year = arp.annual_reporting_period
        AND ef.unit = ec.unit

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id AND sgiq.client_id IS NULL
) q51 ON TRUE


/* ---------- Q67 : ENERGY CONSUMPTION ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'ecfqss_id', ec.ecfqss_id,
            'stoie_id', ec.stoie_id,
            'energy_purchased', ec.energy_purchased,
            'energy_type', ec.energy_type,
            'quantity', ec.quantity,
            'unit', ec.unit,
            'created_date', ec.created_date,

            /* ---------- EMISSION FACTOR ---------- */
            'emission_factor',
            COALESCE(
                CASE
                    WHEN lower(split_part(ec.energy_purchased, ' ', 1)) IN
                         ('electricity', 'heating', 'steam', 'cooling')
                    THEN
                        CASE
                            WHEN lower(loc.location) = 'india'  THEN ef.ef_india_region::numeric
                            WHEN lower(loc.location) = 'europe' THEN ef.ef_eu_region::numeric
                            ELSE ef.ef_global_region::numeric
                        END
                    ELSE 0::numeric
                END,
            0)
        )
    ) AS q67_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.sgiq_id = sgiq.sgiq_id
    JOIN energy_consumption_for_qsixtyseven_questions ec
        ON ec.stoie_id = stoie.stoie_id

    /* ---------- EMISSION FACTOR JOIN ---------- */
    LEFT JOIN electricity_emission_factor ef
        ON ef.type_of_energy =
           (initcap(split_part(ec.energy_purchased, ' ', 1)) || ' - ' || ec.energy_type)
        AND ef.year = arp.annual_reporting_period
        AND ef.unit = ec.unit

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id AND sgiq.client_id IS NULL
) q67 ON TRUE

WHERE b.is_bom_calculated = TRUE
${conditions.length ? `AND ${conditions.join(' AND ')}` : ''}
LIMIT $${paramIndex++} OFFSET $${paramIndex++};
`;

            values.push(limit);
            values.push(offset);
            const result = await client.query(query, values);

            const rows = result.rows;
            const totalCount = rows.length > 0 ? rows.length : 0;

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    page,
                    pageSize: limit,
                    totalCount,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("Error fetching Supplier Footprint:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch Supplier Footprint"
            });
        }
    });
}

export async function getMaterialFootPrint(req: any, res: any) {
    const {
        pageNumber = 1,
        pageSize = 20,

        search,                // global search
        from_date,              // date range start
        to_date,                // date range end

        code,
        material_number,
        component_name,
        production_location,
        manufacturer,
        component_category,
        supplier_code,
        supplier_name,
        material_name           // Q52 material_name
    } = req.query;

    const limit = Number(pageSize);
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    return withClient(async (client: any) => {
        try {

            if (code) {
                conditions.push(`b.code ILIKE $${idx++}`);
                values.push(`%${code}%`);
            }

            if (material_number) {
                conditions.push(`b.material_number ILIKE $${idx++}`);
                values.push(`%${material_number}%`);
            }

            if (component_name) {
                conditions.push(`b.component_name ILIKE $${idx++}`);
                values.push(`%${component_name}%`);
            }

            if (production_location) {
                conditions.push(`b.production_location ILIKE $${idx++}`);
                values.push(`%${production_location}%`);
            }

            if (manufacturer) {
                conditions.push(`b.manufacturer ILIKE $${idx++}`);
                values.push(`%${manufacturer}%`);
            }

            if (component_category) {
                conditions.push(`b.component_category ILIKE $${idx++}`);
                values.push(`%${component_category}%`);
            }

            if (supplier_code) {
                conditions.push(`sd.code ILIKE $${idx++}`);
                values.push(`%${supplier_code}%`);
            }

            if (supplier_name) {
                conditions.push(`sd.supplier_name ILIKE $${idx++}`);
                values.push(`%${supplier_name}%`);
            }

            if (material_name) {
                conditions.push(`
    EXISTS (
      SELECT 1
      FROM raw_materials_used_in_component_manufacturing_questions rmf
      WHERE rmf.bom_id = b.id
      AND rmf.material_name ILIKE $${idx++}
    )
  `);
                values.push(`%${material_name}%`);
            }


            if (search) {
                conditions.push(`
    (
      b.code ILIKE $${idx}
      OR b.material_number ILIKE $${idx}
      OR b.component_name ILIKE $${idx}
      OR b.production_location ILIKE $${idx}
      OR b.manufacturer ILIKE $${idx}
      OR b.component_category ILIKE $${idx}
      OR sd.code ILIKE $${idx}
      OR sd.supplier_name ILIKE $${idx}
      OR EXISTS (
          SELECT 1
          FROM raw_materials_used_in_component_manufacturing_questions rmf
          WHERE rmf.bom_id = b.id
          AND rmf.material_name ILIKE $${idx}
      )
    )
  `);
                values.push(`%${search}%`);
                idx++;
            }


            if (from_date) {
                conditions.push(`b.created_date >= $${idx++}::date`);
                values.push(from_date);
            }

            if (to_date) {
                conditions.push(
                    `b.created_date < ($${idx++}::date + INTERVAL '1 day')`
                );
                values.push(to_date);
            }


            const query = `
SELECT
    b.id,
    b.code,
    b.material_number,
    b.bom_pcf_id,
    b.component_name,
    b.qunatity,
    b.production_location,
    b.manufacturer,
    b.detail_description,
    b.weight_gms,
    b.total_weight_gms,
    b.component_category,
    b.price,
    b.total_price,
    b.economic_ratio,
    b.supplier_id,
    b.is_weight_gms,
    b.created_date,

    /* ---------- SUPPLIER DETAILS ---------- */
    jsonb_build_object(
        'sup_id', sd.sup_id,
        'code', sd.code,
        'supplier_name', sd.supplier_name,
        'supplier_email', sd.supplier_email
    ) AS supplier_details,

    /* ---------- Q52 RAW MATERIAL DETAILS ---------- */
    COALESCE(q52.q52_material_type_data, '[]'::jsonb) AS q52_material_type_data


FROM bom b

LEFT JOIN supplier_details sd
    ON sd.sup_id = b.supplier_id

/* ---------- SINGLE LOCATION (FOR EMISSION FACTOR) ---------- */
LEFT JOIN LATERAL (
    SELECT psd.location
    FROM production_site_details_questions psd
    WHERE psd.bom_id = b.id
    ORDER BY psd.created_date ASC
    LIMIT 1
) loc ON TRUE

/* ---------- RECYCLED PERCENTAGE (BOM LEVEL) ---------- */
LEFT JOIN LATERAL (
    SELECT rmd.percentage::numeric AS recycled_percentage
    FROM recycled_materials_with_percentage_questions rmd
    WHERE rmd.bom_id = b.id
    ORDER BY rmd.created_date ASC
    LIMIT 1
) rmp ON TRUE

/* ================= Q52 : RAW MATERIALS ================= */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        DISTINCT jsonb_build_object(
            'rmuicm_id', rm.rmuicm_id,
            'stoie_id', rm.stoie_id,
            'bom_id', rm.bom_id,

            'material_name', rm.material_name,
            'material_number', rm.material_number,
            'percentage', rm.percentage,

            'unit', 'Kg',
            'year', sgi.annual_reporting_period,

            'bom_weight_kg', (b.weight_gms::numeric / 1000),

            'recycled_percentage', COALESCE(rmp.recycled_percentage, 0),

            'recycled_weight_kg',
            ROUND(
                ((b.weight_gms::numeric / 1000) / 100)
                * COALESCE(rmp.recycled_percentage, 0),
                6
            ),

            'emission_factor_used',
            COALESCE(
                CASE
                    WHEN lower(loc.location) = 'india' THEN mef.ef_india_region::numeric
                    WHEN lower(loc.location) = 'europe' THEN mef.ef_eu_region::numeric
                    ELSE mef.ef_global_region::numeric
                END,
                0::numeric
            ),

'emission_in_co2_eq',
ROUND(
    (
        ((b.weight_gms::numeric / 1000)
         * COALESCE(rmp.recycled_percentage, 0) / 100)
        *
        COALESCE(
            CASE
                WHEN lower(loc.location) = 'india' THEN mef.ef_india_region::numeric
                WHEN lower(loc.location) = 'europe' THEN mef.ef_eu_region::numeric
                ELSE mef.ef_global_region::numeric
            END,
            0::numeric
        )
    ),
    6
)
        )
    ) AS q52_material_type_data
    FROM raw_materials_used_in_component_manufacturing_questions rm
    LEFT JOIN supplier_general_info_questions sgi
        ON sgi.bom_pcf_id = b.bom_pcf_id AND sgi.client_id IS NULL
    LEFT JOIN materials_emission_factor mef
        ON mef.year = sgi.annual_reporting_period
        AND mef.unit = 'Kg'
        AND lower(mef.element_name) = lower(rm.material_name)
    WHERE rm.bom_id = b.id
) q52 ON TRUE

WHERE b.is_bom_calculated = TRUE
${conditions.length ? `AND ${conditions.join(' AND ')}` : ''}
LIMIT $${idx++} OFFSET $${idx++};
`;

            values.push(limit);
            values.push(offset);
            const result = await client.query(query, values);

            const rows = result.rows;
            const totalCount = rows.length > 0 ? rows.length : 0;

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    page,
                    pageSize: limit,
                    totalCount,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("Error fetching Supplier Footprint:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch Supplier Footprint"
            });
        }
    });
}

export async function getElectricityFootPrint(req: any, res: any) {
    //     const {
    //         pageNumber = 1,
    //         pageSize = 20
    //     } = req.query;

    //     const limit = Number(pageSize);
    //     const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    //     const offset = (page - 1) * limit;

    //     return withClient(async (client: any) => {
    //         try {
    //             const query = `
    // SELECT
    //     b.id,
    //     b.code,
    //     b.material_number,
    //     b.component_name,
    //     b.qunatity,
    //     b.production_location,
    //     b.manufacturer,
    //     b.detail_description,
    //     b.weight_gms,
    //     b.total_weight_gms,
    //     b.component_category,
    //     b.price,
    //     b.total_price,
    //     b.economic_ratio,
    //     b.supplier_id,
    //     b.is_weight_gms,
    //     b.created_date,

    //     /* ---------- SUPPLIER DETAILS ---------- */
    //     jsonb_build_object(
    //         'sup_id', sd.sup_id,
    //         'code', sd.code,
    //         'supplier_name', sd.supplier_name,
    //         'supplier_email', sd.supplier_email
    //     ) AS supplier_details,

    //       /* ---------- SCOPE 2 : PURCHASED ENERGY ---------- */
    //     COALESCE(q22.Q22_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q22_energy_type_and_energy_quantity",

    //      /* ---------- Q51 : ENERGY CONSUMPTION ---------- */
    //     COALESCE(q51.q51_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q51_energy_type_and_energy_quantity",

    //      /* ---------- Q67 : ENERGY CONSUMPTION ---------- */
    //     COALESCE(q67.q67_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q67_energy_type_and_energy_quantity"
    // FROM bom b

    // LEFT JOIN supplier_details sd
    //     ON sd.sup_id = b.supplier_id

    // /* ---------- SCOPE 2 : PURCHASED ENERGY ---------- */
    // LEFT JOIN LATERAL (
    //     SELECT jsonb_agg(
    //         jsonb_build_object(
    //             'stidefpe_id', pe.stidefpe_id,
    //             'stide_id', pe.stide_id,
    //             'energy_source', pe.energy_source,
    //             'energy_type', pe.energy_type,
    //             'quantity', pe.quantity,
    //             'unit', pe.unit,
    //             'sup_id', pe.sup_id,
    //             'created_date', pe.created_date
    //         )
    //     ) AS Q22_energy_type_and_energy_quantity
    //     FROM supplier_general_info_questions sgiq
    //     JOIN scope_two_indirect_emissions_questions stide
    //         ON stide.sgiq_id = sgiq.sgiq_id
    //     JOIN scope_two_indirect_emissions_from_purchased_energy_questions pe
    //         ON pe.stide_id = stide.stide_id
    //     WHERE sgiq.bom_pcf_id = b.bom_pcf_id
    // ) q22 ON TRUE

    // /* ---------- Q51 : ENERGY CONSUMPTION ---------- */
    // LEFT JOIN LATERAL (
    //     SELECT jsonb_agg(
    //         jsonb_build_object(
    //             'ecfqfo_id', ec.ecfqfo_id,
    //             'stide_id', ec.stide_id,
    //             'energy_purchased', ec.energy_purchased,
    //             'energy_type', ec.energy_type,
    //             'quantity', ec.quantity,
    //             'unit', ec.unit,
    //             'created_date', ec.created_date
    //         )
    //     ) AS q51_energy_type_and_energy_quantity
    //     FROM supplier_general_info_questions sgiq
    //     JOIN scope_two_indirect_emissions_questions stide
    //         ON stide.sgiq_id = sgiq.sgiq_id
    //     JOIN energy_consumption_for_qfiftyone_questions ec
    //         ON ec.stide_id = stide.stide_id
    //     WHERE sgiq.bom_pcf_id = b.bom_pcf_id
    // ) q51 ON TRUE

    // /* ---------- Q67 join (NEW) ---------- */
    // LEFT JOIN LATERAL (
    //     SELECT jsonb_agg(
    //         jsonb_build_object(
    //             'ecfqss_id', ec.ecfqss_id,
    //             'stoie_id', ec.stoie_id,
    //             'energy_purchased', ec.energy_purchased,
    //             'energy_type', ec.energy_type,
    //             'quantity', ec.quantity,
    //             'unit', ec.unit,
    //             'created_date', ec.created_date
    //         )
    //     ) AS q67_energy_type_and_energy_quantity
    //     FROM supplier_general_info_questions sgiq
    //     JOIN scope_three_other_indirect_emissions_questions stoie
    //         ON stoie.sgiq_id = sgiq.sgiq_id
    //     JOIN energy_consumption_for_qsixtyseven_questions ec
    //         ON ec.stoie_id = stoie.stoie_id
    //     WHERE sgiq.bom_pcf_id = b.bom_pcf_id
    // ) q67 ON TRUE

    // WHERE b.is_bom_calculated = TRUE
    // ORDER BY b.created_date DESC
    // LIMIT $1 OFFSET $2;
    // `;

    //             const result = await client.query(query, [limit, offset]);

    //             return res.status(200).send(
    //                 generateResponse(true, "Success!", 200, {
    //                     page,
    //                     pageSize: limit,
    //                     data: result.rows
    //                 })
    //             );

    //         } catch (error: any) {
    //             console.error("Error fetching Supplier Footprint:", error);
    //             return res.status(500).json({
    //                 success: false,
    //                 message: error.message || "Failed to fetch Supplier Footprint"
    //             });
    //         }
    //     });

    const {
        pageNumber = 1,
        pageSize = 20,

        code,
        material_number,
        component_name,
        production_location,
        manufacturer,
        component_category,
        material_name, // Q52
        supplier_code,
        supplier_name,
        search,

        from_date,
        to_date
    } = req.query;

    const limit = Number(pageSize);
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    return withClient(async (client: any) => {
        try {

            if (code) {
                conditions.push(`b.code ILIKE $${paramIndex++}`);
                values.push(`%${code}%`);
            }

            if (material_number) {
                conditions.push(`b.material_number ILIKE $${paramIndex++}`);
                values.push(`%${material_number}%`);
            }

            if (component_name) {
                conditions.push(`b.component_name ILIKE $${paramIndex++}`);
                values.push(`%${component_name}%`);
            }

            if (production_location) {
                conditions.push(`b.production_location ILIKE $${paramIndex++}`);
                values.push(`%${production_location}%`);
            }

            if (manufacturer) {
                conditions.push(`b.manufacturer ILIKE $${paramIndex++}`);
                values.push(`%${manufacturer}%`);
            }

            if (component_category) {
                conditions.push(`b.component_category ILIKE $${paramIndex++}`);
                values.push(`%${component_category}%`);
            }

            if (material_name) {
                conditions.push(`
    EXISTS (
      SELECT 1
      FROM raw_materials_used_in_component_manufacturing_questions rm
      WHERE rm.bom_id = b.id
        AND rm.material_name ILIKE $${paramIndex++}
    )
  `);
                values.push(`%${material_name}%`);
            }

            // ----- SUPPLIER FILTERS -----
            if (supplier_code) {
                conditions.push(`sd.code ILIKE $${paramIndex++}`);
                values.push(`%${supplier_code}%`);
            }
            if (supplier_name) {
                conditions.push(`sd.supplier_name ILIKE $${paramIndex++}`);
                values.push(`%${supplier_name}%`);
            }


            if (search) {
                conditions.push(`
    (
      b.material_number ILIKE $${paramIndex}
      OR b.component_name ILIKE $${paramIndex}
      OR b.production_location ILIKE $${paramIndex}
      OR b.manufacturer ILIKE $${paramIndex}
      OR b.component_category ILIKE $${paramIndex}
    )
  `);
                values.push(`%${search}%`);
                paramIndex++;
            }


            if (from_date) {
                conditions.push(`b.created_date >= $${paramIndex++}::date`);
                values.push(from_date);
            }

            if (to_date) {
                conditions.push(
                    `b.created_date < ($${paramIndex++}::date + INTERVAL '1 day')`
                );
                values.push(to_date);
            }

            const query = `
SELECT
    b.id,
    b.code,
    b.bom_pcf_id,
    b.material_number,
    b.component_name,
    b.qunatity,
    b.production_location,
    b.manufacturer,
    b.weight_gms,
    b.total_weight_gms,
    b.component_category,
    b.price,
    b.total_price,
    b.economic_ratio,
    b.supplier_id,
    b.created_date,
    arp.annual_reporting_period,

    /* ---------- SUPPLIER DETAILS ---------- */
    jsonb_build_object(
        'sup_id', sd.sup_id,
        'code', sd.code,
        'supplier_name', sd.supplier_name,
        'supplier_email', sd.supplier_email
    ) AS supplier_details,

      /* ---------- SCOPE 2 : PURCHASED ENERGY ---------- */
    COALESCE(q22.Q22_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q22_energy_type_and_energy_quantity",

     /* ---------- Q51 : ENERGY CONSUMPTION ---------- */
    COALESCE(q51.q51_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q51_energy_type_and_energy_quantity",

     /* ---------- Q67 : ENERGY CONSUMPTION ---------- */
    COALESCE(q67.q67_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q67_energy_type_and_energy_quantity"

FROM bom b

LEFT JOIN supplier_details sd
    ON sd.sup_id = b.supplier_id

LEFT JOIN LATERAL (
    SELECT
        SUM(bece.total_pcf_value)::numeric AS supplier_total_pcf_emission
    FROM bom b2
    JOIN bom_emission_calculation_engine bece
        ON bece.bom_id = b2.id AND bece.product_id IS NULL
    WHERE b2.supplier_id = b.supplier_id
) spcf ON TRUE

LEFT JOIN LATERAL (
    SELECT sgiq.annual_reporting_period
    FROM supplier_general_info_questions sgiq
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
      AND sgiq.sup_id = b.supplier_id AND sgiq.client_id IS NULL
    ORDER BY sgiq.created_date ASC
    LIMIT 1
) arp ON TRUE

/* ---------- SINGLE LOCATION (FOR EMISSION FACTOR) ---------- */
LEFT JOIN LATERAL (
    SELECT psd.location
    FROM production_site_details_questions psd
    WHERE psd.bom_id = b.id
    ORDER BY psd.created_date ASC
    LIMIT 1
) loc ON TRUE

/* ---------- Q52 : RAW MATERIALS USED ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'rmuicm_id', rm.rmuicm_id,
            'stoie_id', rm.stoie_id,
            'bom_id', rm.bom_id,
            'material_number', rm.material_number,
            'material_name', rm.material_name,
            'percentage', rm.percentage,
            'created_date', rm.created_date
        )
    ) AS q52_material_type_data
    FROM raw_materials_used_in_component_manufacturing_questions rm
    WHERE rm.bom_id = b.id
) q52 ON TRUE

/* ---------- SCOPE 2 : PURCHASED ENERGY ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'stidefpe_id', pe.stidefpe_id,
            'stide_id', pe.stide_id,
            'energy_source', pe.energy_source,
            'energy_type', pe.energy_type,
            'quantity', pe.quantity,
            'unit', pe.unit,
            'sup_id', pe.sup_id,
            'created_date', pe.created_date,

            /* ---------- EMISSION FACTOR ---------- */
           'emission_factor',
COALESCE(
    CASE
        WHEN lower(split_part(pe.energy_source, ' ', 1)) IN
             ('electricity', 'heating', 'steam', 'cooling')
        THEN
            CASE
                WHEN lower(loc.location) = 'india' THEN
                    CASE
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'electricity' THEN ef.ef_india_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'heating'     THEN ef.ef_india_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'steam'       THEN ef.ef_india_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'cooling'     THEN ef.ef_india_region::numeric
                    END
                WHEN lower(loc.location) = 'europe' THEN
                    CASE
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'electricity' THEN ef.ef_eu_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'heating'     THEN ef.ef_eu_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'steam'       THEN ef.ef_eu_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'cooling'     THEN ef.ef_eu_region::numeric
                    END
                ELSE
                    CASE
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'electricity' THEN ef.ef_global_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'heating'     THEN ef.ef_global_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'steam'       THEN ef.ef_global_region::numeric
                        WHEN lower(split_part(pe.energy_source, ' ', 1)) = 'cooling'     THEN ef.ef_global_region::numeric
                    END
            END
        ELSE 0::numeric
    END,
0
),
'calculated_emission',
  /*----Coverting quantity into KW    ---------- */
ROUND(
    COALESCE(pe.quantity::numeric, 0) / 1000
    *
    COALESCE(
        CASE
            WHEN lower(split_part(pe.energy_source, ' ', 1)) IN
                 ('electricity', 'heating', 'steam', 'cooling')
            THEN
                CASE
                    WHEN lower(loc.location) = 'india' THEN ef.ef_india_region::numeric
                    WHEN lower(loc.location) = 'europe' THEN ef.ef_eu_region::numeric
                    ELSE ef.ef_global_region::numeric
                END
            ELSE 0::numeric
        END,
    0),
6
)

        )
    ) AS Q22_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_two_indirect_emissions_questions stide
        ON stide.sgiq_id = sgiq.sgiq_id
    JOIN scope_two_indirect_emissions_from_purchased_energy_questions pe
        ON pe.stide_id = stide.stide_id

    /* ---------- ELECTRICITY EMISSION FACTOR JOIN ---------- */
    LEFT JOIN electricity_emission_factor ef
        ON ef.type_of_energy = ('Electricity - ' || pe.energy_type)
        AND ef.year = arp.annual_reporting_period
        AND ef.unit = pe.unit

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id AND sgiq.client_id IS NULL
) q22 ON TRUE


/* ---------- Q51 : ENERGY CONSUMPTION ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'ecfqfo_id', ec.ecfqfo_id,
            'stide_id', ec.stide_id,
            'energy_purchased', ec.energy_purchased,
            'energy_type', ec.energy_type,
            'quantity', ec.quantity,
            'unit', ec.unit,
            'created_date', ec.created_date,

            /* ---------- EMISSION FACTOR ---------- */
            'emission_factor',
            COALESCE(
                CASE
                    WHEN lower(split_part(ec.energy_purchased, ' ', 1)) IN
                         ('electricity', 'heating', 'steam', 'cooling')
                    THEN
                        CASE
                            WHEN lower(loc.location) = 'india'  THEN ef.ef_india_region::numeric
                            WHEN lower(loc.location) = 'europe' THEN ef.ef_eu_region::numeric
                            ELSE ef.ef_global_region::numeric
                        END
                    ELSE 0::numeric
                END,
            0),
           'calculated_emission',
             /*----Coverting quantity into KW    ---------- */
ROUND(
    COALESCE(ec.quantity::numeric, 0) / 1000
    *
    COALESCE(
        CASE
            WHEN lower(split_part(ec.energy_purchased, ' ', 1)) IN
                 ('electricity', 'heating', 'steam', 'cooling')
            THEN
                CASE
                    WHEN lower(loc.location) = 'india'  THEN ef.ef_india_region::numeric
                    WHEN lower(loc.location) = 'europe' THEN ef.ef_eu_region::numeric
                    ELSE ef.ef_global_region::numeric
                END
            ELSE 0::numeric
        END,
    0),
6
)

        )
    ) AS q51_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_two_indirect_emissions_questions stide
        ON stide.sgiq_id = sgiq.sgiq_id
    JOIN energy_consumption_for_qfiftyone_questions ec
        ON ec.stide_id = stide.stide_id

    /* ---------- EMISSION FACTOR JOIN ---------- */
    LEFT JOIN electricity_emission_factor ef
        ON ef.type_of_energy =
           (initcap(split_part(ec.energy_purchased, ' ', 1)) || ' - ' || ec.energy_type)
        AND ef.year = arp.annual_reporting_period
        AND ef.unit = ec.unit

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id AND sgiq.client_id IS NULL
) q51 ON TRUE


/* ---------- Q67 : ENERGY CONSUMPTION ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'ecfqss_id', ec.ecfqss_id,
            'stoie_id', ec.stoie_id,
            'energy_purchased', ec.energy_purchased,
            'energy_type', ec.energy_type,
            'quantity', ec.quantity,
            'unit', ec.unit,
            'created_date', ec.created_date,

            /* ---------- EMISSION FACTOR ---------- */
            'emission_factor',
            COALESCE(
                CASE
                    WHEN lower(split_part(ec.energy_purchased, ' ', 1)) IN
                         ('electricity', 'heating', 'steam', 'cooling')
                    THEN
                        CASE
                            WHEN lower(loc.location) = 'india'  THEN ef.ef_india_region::numeric
                            WHEN lower(loc.location) = 'europe' THEN ef.ef_eu_region::numeric
                            ELSE ef.ef_global_region::numeric
                        END
                    ELSE 0::numeric
                END,
            0),
            'calculated_emission',
        /*----Coverting quantity into KW    ---------- */
ROUND(
    COALESCE(ec.quantity::numeric, 0) / 1000
    *
    COALESCE(
        CASE
            WHEN lower(split_part(ec.energy_purchased, ' ', 1)) IN
                 ('electricity', 'heating', 'steam', 'cooling')
            THEN
                CASE
                    WHEN lower(loc.location) = 'india'  THEN ef.ef_india_region::numeric
                    WHEN lower(loc.location) = 'europe' THEN ef.ef_eu_region::numeric
                    ELSE ef.ef_global_region::numeric
                END
            ELSE 0::numeric
        END,
    0),
6
)

        )
    ) AS q67_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.sgiq_id = sgiq.sgiq_id
    JOIN energy_consumption_for_qsixtyseven_questions ec
        ON ec.stoie_id = stoie.stoie_id

    /* ---------- EMISSION FACTOR JOIN ---------- */
    LEFT JOIN electricity_emission_factor ef
        ON ef.type_of_energy =
           (initcap(split_part(ec.energy_purchased, ' ', 1)) || ' - ' || ec.energy_type)
        AND ef.year = arp.annual_reporting_period
        AND ef.unit = ec.unit

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id AND sgiq.client_id IS NULL
) q67 ON TRUE

WHERE b.is_bom_calculated = TRUE
${conditions.length ? `AND ${conditions.join(' AND ')}` : ''}
LIMIT $${paramIndex++} OFFSET $${paramIndex++};
`;

            values.push(limit);
            values.push(offset);
            const result = await client.query(query, values);

            const rows = result.rows;
            const totalCount = rows.length > 0 ? rows.length : 0;

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    page,
                    pageSize: limit,
                    totalCount,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("Error fetching Supplier Footprint:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch Supplier Footprint"
            });
        }
    });
}

export async function getTransportationFootPrint(req: any, res: any) {
    const {
        pageNumber = 1,
        pageSize = 20,

        search,              // global search
        from_date,           // date range
        to_date,

        code,
        material_number,
        component_name,
        production_location,
        manufacturer,
        component_category,

        supplier_code,
        supplier_name,

        mode_of_transport
    } = req.query;

    const limit = Number(pageSize);
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;

    return withClient(async (client: any) => {
        try {

            if (code) {
                conditions.push(`b.code ILIKE $${idx++}`);
                values.push(`%${code}%`);
            }

            if (material_number) {
                conditions.push(`b.material_number ILIKE $${idx++}`);
                values.push(`%${material_number}%`);
            }

            if (component_name) {
                conditions.push(`b.component_name ILIKE $${idx++}`);
                values.push(`%${component_name}%`);
            }

            if (production_location) {
                conditions.push(`b.production_location ILIKE $${idx++}`);
                values.push(`%${production_location}%`);
            }

            if (manufacturer) {
                conditions.push(`b.manufacturer ILIKE $${idx++}`);
                values.push(`%${manufacturer}%`);
            }

            if (component_category) {
                conditions.push(`b.component_category ILIKE $${idx++}`);
                values.push(`%${component_category}%`);
            }

            // ---------- SUPPLIER ----------
            if (supplier_code) {
                conditions.push(`sd.code ILIKE $${idx++}`);
                values.push(`%${supplier_code}%`);
            }

            if (supplier_name) {
                conditions.push(`sd.supplier_name ILIKE $${idx++}`);
                values.push(`%${supplier_name}%`);
            }


            if (from_date) {
                conditions.push(`b.created_date >= $${idx++}::date`);
                values.push(from_date);
            }

            if (to_date) {
                conditions.push(
                    `b.created_date < ($${idx++}::date + INTERVAL '1 day')`
                );
                values.push(to_date);
            }

            // ---------- TRANSPORT ----------
            if (mode_of_transport) {
                conditions.push(`
    EXISTS (
      SELECT 1
      FROM supplier_general_info_questions sgiq
      JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.sgiq_id = sgiq.sgiq_id
      JOIN mode_of_transport_used_for_transportation_questions ec
        ON ec.stoie_id = stoie.stoie_id
      WHERE sgiq.bom_pcf_id = b.bom_pcf_id AND sgiq.client_id IS NULL
        AND ec.mode_of_transport ILIKE $${idx++}
    )
  `);
                values.push(`%${mode_of_transport}%`);
            }

            if (search) {
                conditions.push(`
    (
      b.code ILIKE $${idx}
      OR b.material_number ILIKE $${idx}
      OR b.component_name ILIKE $${idx}
      OR b.production_location ILIKE $${idx}
      OR b.manufacturer ILIKE $${idx}
      OR b.component_category ILIKE $${idx}
      OR sd.code ILIKE $${idx}
      OR sd.supplier_name ILIKE $${idx}
      OR EXISTS (
          SELECT 1
          FROM supplier_general_info_questions sgiq
          JOIN scope_three_other_indirect_emissions_questions stoie
            ON stoie.sgiq_id = sgiq.sgiq_id
          JOIN mode_of_transport_used_for_transportation_questions ec
            ON ec.stoie_id = stoie.stoie_id
          WHERE sgiq.bom_pcf_id = b.bom_pcf_id AND sgiq.client_id IS NULL
            AND ec.mode_of_transport ILIKE $${idx}
      )
    )
  `);
                values.push(`%${search}%`);
                idx++;
            }

            const query = `
SELECT
    b.id,
    b.code,
    b.material_number,
    b.component_name,
    b.qunatity,
    b.production_location,
    b.manufacturer,
    b.detail_description,
    b.weight_gms,
    b.total_weight_gms,
    b.component_category,
    b.price,
    b.total_price,
    b.economic_ratio,
    b.supplier_id,
    b.is_weight_gms,
    b.created_date,
    arp.annual_reporting_period,

    /* ---------- SUPPLIER DETAILS ---------- */
    jsonb_build_object(
        'sup_id', sd.sup_id,
        'code', sd.code,
        'supplier_name', sd.supplier_name,
        'supplier_email', sd.supplier_email
    ) AS supplier_details,

     /* ---------- Q74 : ENERGY CONSUMPTION ---------- */
    COALESCE(q74.q74_transport, '[]'::jsonb) AS "Q74_transport"
FROM bom b

LEFT JOIN supplier_details sd
    ON sd.sup_id = b.supplier_id

LEFT JOIN LATERAL (
    SELECT sgiq.annual_reporting_period
    FROM supplier_general_info_questions sgiq
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
      AND sgiq.sup_id = b.supplier_id
      AND sgiq.client_id IS NULL
    ORDER BY sgiq.created_date ASC
    LIMIT 1
) arp ON TRUE

/* ---------- SINGLE LOCATION (FOR EMISSION FACTOR) ---------- */
LEFT JOIN LATERAL (
    SELECT psd.location
    FROM production_site_details_questions psd
    WHERE psd.bom_id = b.id
    ORDER BY psd.created_date ASC
    LIMIT 1
) loc ON TRUE

/* ---------- Q74 join (NEW) ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
       jsonb_build_object(
    'motuft_id', ec.motuft_id,
    'stoie_id', ec.stoie_id,
    'mode_of_transport', ec.mode_of_transport,
    'weight_transported', ec.weight_transported,
    'source_point', ec.source_point,
    'drop_point', ec.drop_point,
    'distance', ec.distance,

    /* ---------- NUMERIC VALUES ---------- */
    'distance_numeric',
    COALESCE(
        regexp_replace(ec.distance, '[^0-9\.]', '', 'g')::numeric,
        0
    ),

    'weight_numeric_kg',
    COALESCE(
        regexp_replace(ec.weight_transported, '[^0-9\.]', '', 'g')::numeric,
        0
    ),

    /* ---------- EMISSION FACTOR ---------- */
    'emission_factor_used',
    COALESCE(
        CASE
            WHEN lower(loc.location) = 'india' THEN mef.ef_india_region::numeric
            WHEN lower(loc.location) = 'europe' THEN mef.ef_eu_region::numeric
            ELSE mef.ef_global_region::numeric
        END,
        0
    ),

    /* ---------- WEIGHT IN TONS (ton-km) ---------- */
    'weight_in_tons',
    ROUND(
        (
            COALESCE(regexp_replace(ec.weight_transported, '[^0-9\.]', '', 'g')::numeric, 0) / 1000
        )
        *
        COALESCE(regexp_replace(ec.distance, '[^0-9\.]', '', 'g')::numeric, 0),
        6
    ),

    /* ---------- TRANSPORTED EMISSION ---------- */
    'transported_emission',
    ROUND(
        (
            (
                COALESCE(regexp_replace(ec.weight_transported, '[^0-9\.]', '', 'g')::numeric, 0) / 1000
            )
            *
            COALESCE(regexp_replace(ec.distance, '[^0-9\.]', '', 'g')::numeric, 0)
        )
        *
        COALESCE(
            CASE
                WHEN lower(loc.location) = 'india' THEN mef.ef_india_region::numeric
                WHEN lower(loc.location) = 'europe' THEN mef.ef_eu_region::numeric
                ELSE mef.ef_global_region::numeric
            END,
            0
        ),
        6
    )
)
    ) AS q74_transport 
    FROM supplier_general_info_questions sgiq
    JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.sgiq_id = sgiq.sgiq_id
    JOIN mode_of_transport_used_for_transportation_questions ec
        ON ec.stoie_id = stoie.stoie_id
    LEFT JOIN vehicle_type_emission_factor mef
        ON mef.year = arp.annual_reporting_period
        AND mef.unit = 'Kms'
        AND lower(mef.vehicle_type) = lower(ec.mode_of_transport)
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id AND sgiq.client_id IS NULL
) q74 ON TRUE

WHERE b.is_bom_calculated = TRUE
${conditions.length ? `AND ${conditions.join(' AND ')}` : ''}
LIMIT $${idx++} OFFSET $${idx++};
`;

            values.push(limit);
            values.push(offset);
            const result = await client.query(query, values);

            const rows = result.rows;
            const totalCount = rows.length > 0 ? rows.length : 0;

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    page,
                    pageSize: limit,
                    totalCount,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("Error fetching Supplier Footprint:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch Supplier Footprint"
            });
        }
    });
}

export async function getPackagingFootPrint(req: any, res: any) {
    const {
        pageNumber = 1,
        pageSize = 20,

        code,
        material_number,
        component_name,
        production_location,
        manufacturer,
        component_category,

        supplier_code,
        supplier_name,

        packagin_type,       // Q60
        energy_purchased,    // Q67
        energy_type,         // Q67

        search,
        from_date,
        to_date
    } = req.query;

    const limit = Number(pageSize);
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const values: any[] = [];
    let idx = 1;


    return withClient(async (client: any) => {
        try {


            if (code) {
                conditions.push(`b.code ILIKE $${idx++}`);
                values.push(`%${code}%`);
            }

            if (material_number) {
                conditions.push(`b.material_number ILIKE $${idx++}`);
                values.push(`%${material_number}%`);
            }

            if (component_name) {
                conditions.push(`b.component_name ILIKE $${idx++}`);
                values.push(`%${component_name}%`);
            }

            if (production_location) {
                conditions.push(`b.production_location ILIKE $${idx++}`);
                values.push(`%${production_location}%`);
            }

            if (manufacturer) {
                conditions.push(`b.manufacturer ILIKE $${idx++}`);
                values.push(`%${manufacturer}%`);
            }

            if (component_category) {
                conditions.push(`b.component_category ILIKE $${idx++}`);
                values.push(`%${component_category}%`);
            }

            if (supplier_code) {
                conditions.push(`sd.code ILIKE $${idx++}`);
                values.push(`%${supplier_code}%`);
            }

            if (supplier_name) {
                conditions.push(`sd.supplier_name ILIKE $${idx++}`);
                values.push(`%${supplier_name}%`);
            }


            if (packagin_type) {
                conditions.push(`
    EXISTS (
      SELECT 1
      FROM type_of_pack_mat_used_for_delivering_questions pmu
      WHERE pmu.bom_id = b.id
        AND pmu.packagin_type ILIKE $${idx++}
    )
  `);
                values.push(`%${packagin_type}%`);
            }


            if (energy_purchased) {
                conditions.push(`
    EXISTS (
      SELECT 1
      FROM energy_consumption_for_qsixtyseven_questions ec
      JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.stoie_id = ec.stoie_id
      JOIN supplier_general_info_questions sgiq
        ON sgiq.sgiq_id = stoie.sgiq_id AND sgiq.client_id IS NULL
      WHERE sgiq.bom_pcf_id = b.bom_pcf_id
        AND ec.energy_purchased ILIKE $${idx++}
    )
  `);
                values.push(`%${energy_purchased}%`);
            }

            if (energy_type) {
                conditions.push(`
    EXISTS (
      SELECT 1
      FROM energy_consumption_for_qsixtyseven_questions ec
      JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.stoie_id = ec.stoie_id
      JOIN supplier_general_info_questions sgiq
        ON sgiq.sgiq_id = stoie.sgiq_id AND sgiq.client_id IS NULL
      WHERE sgiq.bom_pcf_id = b.bom_pcf_id
        AND ec.energy_type ILIKE $${idx++}
    )
  `);
                values.push(`%${energy_type}%`);
            }

            if (search) {
                conditions.push(`
    (
      b.code ILIKE $${idx}
      OR b.material_number ILIKE $${idx}
      OR b.component_name ILIKE $${idx}
      OR b.production_location ILIKE $${idx}
      OR b.manufacturer ILIKE $${idx}
      OR b.component_category ILIKE $${idx}
      OR sd.code ILIKE $${idx}
      OR sd.supplier_name ILIKE $${idx}

      OR EXISTS (
        SELECT 1
        FROM type_of_pack_mat_used_for_delivering_questions pmu
        WHERE pmu.bom_id = b.id
          AND pmu.packagin_type ILIKE $${idx}
      )

      OR EXISTS (
        SELECT 1
        FROM energy_consumption_for_qsixtyseven_questions ec
        JOIN scope_three_other_indirect_emissions_questions stoie
          ON stoie.stoie_id = ec.stoie_id
        JOIN supplier_general_info_questions sgiq
          ON sgiq.sgiq_id = stoie.sgiq_id AND sgiq.client_id IS NULL
        WHERE sgiq.bom_pcf_id = b.bom_pcf_id
          AND (
            ec.energy_purchased ILIKE $${idx}
            OR ec.energy_type ILIKE $${idx}
          )
      )
    )
  `);
                values.push(`%${search}%`);
                idx++;
            }

            if (from_date) {
                conditions.push(`b.created_date >= $${idx++}::date`);
                values.push(from_date);
            }

            if (to_date) {
                conditions.push(
                    `b.created_date < ($${idx++}::date + INTERVAL '1 day')`
                );
                values.push(to_date);
            }

            const query = `
SELECT
    b.id,
    b.code,
    b.material_number,
    b.component_name,
    b.qunatity,
    b.production_location,
    b.manufacturer,
    b.detail_description,
    b.weight_gms,
    b.total_weight_gms,
    b.component_category,
    b.price,
    b.total_price,
    b.economic_ratio,
    b.supplier_id,
    b.is_weight_gms,
    b.created_date,
    arp.annual_reporting_period,

    /* ---------- SUPPLIER DETAILS ---------- */
    jsonb_build_object(
        'sup_id', sd.sup_id,
        'code', sd.code,
        'supplier_name', sd.supplier_name,
        'supplier_email', sd.supplier_email
    ) AS supplier_details,

    /* ---------- Q60 : ENERGY CONSUMPTION ---------- */
    COALESCE(q60.q60_packaging_material, '[]'::jsonb) AS "Q60_packaging_material",

     /* ---------- Q67 : ENERGY CONSUMPTION ---------- */
    COALESCE(q67.q67_energy_type_and_energy_quantity, '[]'::jsonb) AS "Q67_energy_type_and_energy_quantity"


FROM bom b

LEFT JOIN supplier_details sd
    ON sd.sup_id = b.supplier_id

LEFT JOIN LATERAL (
    SELECT sgiq.annual_reporting_period
    FROM supplier_general_info_questions sgiq
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
      AND sgiq.sup_id = b.supplier_id AND sgiq.client_id IS NULL
    ORDER BY sgiq.created_date ASC
    LIMIT 1
) arp ON TRUE

/* ---------- SINGLE LOCATION (FOR EMISSION FACTOR) ---------- */
LEFT JOIN LATERAL (
    SELECT psd.location
    FROM production_site_details_questions psd
    WHERE psd.bom_id = b.id
    ORDER BY psd.created_date ASC
    LIMIT 1
) loc ON TRUE

/* ---------- Q60 Packaging Material ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'topmudp_id', pmu.topmudp_id,
            'stoie_id', pmu.stoie_id,
            'bom_id', pmu.bom_id,
            'material_number', pmu.material_number,
            'component_name', pmu.component_name,
            'packagin_type', pmu.packagin_type,
            'packaging_size', pmu.packaging_size,
            'unit', pmu.unit,
            'percentage_of_recycled_content_used_in_packaging',stoie.percentage_of_recycled_content_used_in_packaging
        )
    ) AS q60_packaging_material
    FROM type_of_pack_mat_used_for_delivering_questions pmu
    LEFT JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.stoie_id = pmu.stoie_id
    WHERE pmu.bom_id = b.id
) q60 ON TRUE


/* ---------- Q67 join (NEW) ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'ecfqss_id', ec.ecfqss_id,
            'stoie_id', ec.stoie_id,
            'energy_purchased', ec.energy_purchased,
            'energy_type', ec.energy_type,
            'quantity', ec.quantity,
            'unit', ec.unit,
            'created_date', ec.created_date,
            'percentage_of_recycled_content_used_in_packaging',stoie.percentage_of_recycled_content_used_in_packaging,
            /* ---------- EMISSION FACTOR ---------- */
            'emission_factor',
            COALESCE(
                CASE
                    WHEN lower(split_part(ec.energy_purchased, ' ', 1)) IN
                         ('electricity', 'heating', 'steam', 'cooling')
                    THEN
                        CASE
                            WHEN lower(loc.location) = 'india'  THEN ef.ef_india_region::numeric
                            WHEN lower(loc.location) = 'europe' THEN ef.ef_eu_region::numeric
                            ELSE ef.ef_global_region::numeric
                        END
                    ELSE 0::numeric
                END,
            0),
            'calculated_emission',
ROUND(
    COALESCE(ec.quantity::numeric, 0) / 1000
    *
    COALESCE(
        CASE
            WHEN lower(split_part(ec.energy_purchased, ' ', 1)) IN
                 ('electricity', 'heating', 'steam', 'cooling')
            THEN
                CASE
                    WHEN lower(loc.location) = 'india'  THEN ef.ef_india_region::numeric
                    WHEN lower(loc.location) = 'europe' THEN ef.ef_eu_region::numeric
                    ELSE ef.ef_global_region::numeric
                END
            ELSE 0::numeric
        END,
    0),
6
),

'calculated_emission_factor_Point25',
ROUND(
    (
        COALESCE(ec.quantity::numeric, 0) / 1000
        *
        COALESCE(
            CASE
                WHEN lower(split_part(ec.energy_purchased, ' ', 1)) IN
                     ('electricity', 'heating', 'steam', 'cooling')
                THEN
                    CASE
                        WHEN lower(loc.location) = 'india'  THEN ef.ef_india_region::numeric
                        WHEN lower(loc.location) = 'europe' THEN ef.ef_eu_region::numeric
                        ELSE ef.ef_global_region::numeric
                    END
                ELSE 0::numeric
            END,
        0)
    ) * 0.25,
6
),

'calculated_emission_factor_Point5',
ROUND(
    (
        COALESCE(ec.quantity::numeric, 0) / 1000
        *
        COALESCE(
            CASE
                WHEN lower(split_part(ec.energy_purchased, ' ', 1)) IN
                     ('electricity', 'heating', 'steam', 'cooling')
                THEN
                    CASE
                        WHEN lower(loc.location) = 'india'  THEN ef.ef_india_region::numeric
                        WHEN lower(loc.location) = 'europe' THEN ef.ef_eu_region::numeric
                        ELSE ef.ef_global_region::numeric
                    END
                ELSE 0::numeric
            END,
        0)
    ) * 0.5,
6
)       
        )
    ) AS q67_energy_type_and_energy_quantity
    FROM supplier_general_info_questions sgiq
    JOIN scope_three_other_indirect_emissions_questions stoie
        ON stoie.sgiq_id = sgiq.sgiq_id
    JOIN energy_consumption_for_qsixtyseven_questions ec
        ON ec.stoie_id = stoie.stoie_id

        /* ---------- EMISSION FACTOR JOIN ---------- */
    LEFT JOIN electricity_emission_factor ef
        ON ef.type_of_energy =
           (initcap(split_part(ec.energy_purchased, ' ', 1)) || ' - ' || ec.energy_type)
        AND ef.year = arp.annual_reporting_period
        AND ef.unit = ec.unit

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id AND sgiq.client_id IS NULL
) q67 ON TRUE

WHERE b.is_bom_calculated = TRUE
${conditions.length ? `AND ${conditions.join(' AND ')}` : ''}
ORDER BY b.created_date DESC
LIMIT $${idx++} OFFSET $${idx++};
`;

            values.push(limit);
            values.push(offset);

            const result = await client.query(query, values);

            const rows = result.rows;
            const totalCount = rows.length > 0 ? rows.length : 0;

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    page,
                    pageSize: limit,
                    totalCount,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("Error fetching Supplier Footprint:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch Supplier Footprint"
            });
        }
    });
}

export async function getSupplierDqrRatingReport(req: any, res: any) {
    const { pageNumber = 1, pageSize = 20 } = req.query;

    return withClient(async (client: any) => {

        const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
        const limit = Number(pageSize) > 0 ? Number(pageSize) : 20;
        const offset = (page - 1) * limit;

        try {
            const query = `
               WITH supplier_sgiq AS (
    SELECT
        sgiq.sgiq_id,
        sgiq.sup_id,
        sup.supplier_name,
        sup.code AS supplier_code,
        sup.supplier_email
    FROM supplier_general_info_questions sgiq
    JOIN pcf_request_data_rating_stage prdrs
        ON prdrs.bom_pcf_id = sgiq.bom_pcf_id
       AND prdrs.sup_id = sgiq.sup_id
    JOIN supplier_details sup
        ON sup.sup_id = sgiq.sup_id
    WHERE prdrs.is_submitted = TRUE
),

dqr_union AS (

    /* ================= Q9 ================= */
    SELECT
        ss.sup_id,
        CASE WHEN q9.ter_tag_value IN ('1','2','3','4','5') THEN q9.ter_tag_value::int ELSE 0 END AS ter,
        CASE WHEN q9.tir_tag_value IN ('1','2','3','4','5') THEN q9.tir_tag_value::int ELSE 0 END AS tir,
        CASE WHEN q9.gr_tag_value  IN ('1','2','3','4','5') THEN q9.gr_tag_value::int  ELSE 0 END AS gr,
        CASE WHEN q9.c_tag_value   IN ('1','2','3','4','5') THEN q9.c_tag_value::int   ELSE 0 END AS c,
        CASE WHEN q9.pds_tag_value IN ('1','2','3','4','5') THEN q9.pds_tag_value::int ELSE 0 END AS pds
    FROM dqr_emission_data_rating_qnine q9
    JOIN supplier_sgiq ss ON ss.sgiq_id = q9.sgiq_id

    UNION ALL

    /* ================= Q11 ================= */
    SELECT
        ss.sup_id,
        CASE WHEN q11.ter_tag_value IN ('1','2','3','4','5') THEN q11.ter_tag_value::int ELSE 0 END,
        CASE WHEN q11.tir_tag_value IN ('1','2','3','4','5') THEN q11.tir_tag_value::int ELSE 0 END,
        CASE WHEN q11.gr_tag_value  IN ('1','2','3','4','5') THEN q11.gr_tag_value::int  ELSE 0 END,
        CASE WHEN q11.c_tag_value   IN ('1','2','3','4','5') THEN q11.c_tag_value::int   ELSE 0 END,
        CASE WHEN q11.pds_tag_value IN ('1','2','3','4','5') THEN q11.pds_tag_value::int ELSE 0 END
    FROM dqr_supplier_product_questions_rating_qeleven q11
    JOIN supplier_sgiq ss ON ss.sgiq_id = q11.sgiq_id

    UNION ALL

    /* ================= Q12 ================= */
    SELECT
        ss.sup_id,
        CASE WHEN q12.ter_tag_value IN ('1','2','3','4','5') THEN q12.ter_tag_value::int ELSE 0 END,
        CASE WHEN q12.tir_tag_value IN ('1','2','3','4','5') THEN q12.tir_tag_value::int ELSE 0 END,
        CASE WHEN q12.gr_tag_value  IN ('1','2','3','4','5') THEN q12.gr_tag_value::int  ELSE 0 END,
        CASE WHEN q12.c_tag_value   IN ('1','2','3','4','5') THEN q12.c_tag_value::int   ELSE 0 END,
        CASE WHEN q12.pds_tag_value IN ('1','2','3','4','5') THEN q12.pds_tag_value::int ELSE 0 END
    FROM dqr_supplier_product_questions_rating_qtwelve q12
    JOIN supplier_sgiq ss ON ss.sgiq_id = q12.sgiq_id

    UNION ALL

    /* ================= Q13 ================= */
    SELECT
        ss.sup_id,
        CASE WHEN q13.ter_tag_value IN ('1','2','3','4','5') THEN q13.ter_tag_value::int ELSE 0 END,
        CASE WHEN q13.tir_tag_value IN ('1','2','3','4','5') THEN q13.tir_tag_value::int ELSE 0 END,
        CASE WHEN q13.gr_tag_value  IN ('1','2','3','4','5') THEN q13.gr_tag_value::int  ELSE 0 END,
        CASE WHEN q13.c_tag_value   IN ('1','2','3','4','5') THEN q13.c_tag_value::int   ELSE 0 END,
        CASE WHEN q13.pds_tag_value IN ('1','2','3','4','5') THEN q13.pds_tag_value::int ELSE 0 END
    FROM dqr_production_site_detail_rating_qthirteen q13
    JOIN supplier_sgiq ss ON ss.sgiq_id = q13.sgiq_id

    UNION ALL

    /* ================= Q15 ================= */
    SELECT ss.sup_id,
           CASE WHEN q15.ter_tag_value IN ('1','2','3','4','5') THEN q15.ter_tag_value::int ELSE 0 END,
           CASE WHEN q15.tir_tag_value IN ('1','2','3','4','5') THEN q15.tir_tag_value::int ELSE 0 END,
           CASE WHEN q15.gr_tag_value  IN ('1','2','3','4','5') THEN q15.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q15.c_tag_value   IN ('1','2','3','4','5') THEN q15.c_tag_value::int   ELSE 0 END,
           CASE WHEN q15.pds_tag_value IN ('1','2','3','4','5') THEN q15.pds_tag_value::int ELSE 0 END
    FROM dqr_product_component_manufactured_rating_qfiften q15
    JOIN supplier_sgiq ss ON ss.sgiq_id = q15.sgiq_id

    UNION ALL
    /* ================= Q15.1 ================= */
    SELECT ss.sup_id,
           CASE WHEN q151.ter_tag_value IN ('1','2','3','4','5') THEN q151.ter_tag_value::int ELSE 0 END,
           CASE WHEN q151.tir_tag_value IN ('1','2','3','4','5') THEN q151.tir_tag_value::int ELSE 0 END,
           CASE WHEN q151.gr_tag_value  IN ('1','2','3','4','5') THEN q151.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q151.c_tag_value   IN ('1','2','3','4','5') THEN q151.c_tag_value::int   ELSE 0 END,
           CASE WHEN q151.pds_tag_value IN ('1','2','3','4','5') THEN q151.pds_tag_value::int ELSE 0 END
    FROM dqr_co_product_component_manufactured_rating_qfiftenone q151
    JOIN supplier_sgiq ss ON ss.sgiq_id = q151.sgiq_id

    UNION ALL
    /* ================= Q16 ================= */
    SELECT ss.sup_id,
           CASE WHEN q16.ter_tag_value IN ('1','2','3','4','5') THEN q16.ter_tag_value::int ELSE 0 END,
           CASE WHEN q16.tir_tag_value IN ('1','2','3','4','5') THEN q16.tir_tag_value::int ELSE 0 END,
           CASE WHEN q16.gr_tag_value  IN ('1','2','3','4','5') THEN q16.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q16.c_tag_value   IN ('1','2','3','4','5') THEN q16.c_tag_value::int   ELSE 0 END,
           CASE WHEN q16.pds_tag_value IN ('1','2','3','4','5') THEN q16.pds_tag_value::int ELSE 0 END
    FROM dqr_stationary_combustion_on_site_energy_rating_qsixten q16
    JOIN supplier_sgiq ss ON ss.sgiq_id = q16.sgiq_id

    UNION ALL
    /* ================= Q17 ================= */
    SELECT ss.sup_id,
           CASE WHEN q17.ter_tag_value IN ('1','2','3','4','5') THEN q17.ter_tag_value::int ELSE 0 END,
           CASE WHEN q17.tir_tag_value IN ('1','2','3','4','5') THEN q17.tir_tag_value::int ELSE 0 END,
           CASE WHEN q17.gr_tag_value  IN ('1','2','3','4','5') THEN q17.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q17.c_tag_value   IN ('1','2','3','4','5') THEN q17.c_tag_value::int   ELSE 0 END,
           CASE WHEN q17.pds_tag_value IN ('1','2','3','4','5') THEN q17.pds_tag_value::int ELSE 0 END
    FROM dqr_mobile_combustion_company_owned_vehicles_rating_qseventen q17
    JOIN supplier_sgiq ss ON ss.sgiq_id = q17.sgiq_id

    UNION ALL
    /* ================= Q19 ================= */
    SELECT ss.sup_id,
           CASE WHEN q19.ter_tag_value IN ('1','2','3','4','5') THEN q19.ter_tag_value::int ELSE 0 END,
           CASE WHEN q19.tir_tag_value IN ('1','2','3','4','5') THEN q19.tir_tag_value::int ELSE 0 END,
           CASE WHEN q19.gr_tag_value  IN ('1','2','3','4','5') THEN q19.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q19.c_tag_value   IN ('1','2','3','4','5') THEN q19.c_tag_value::int   ELSE 0 END,
           CASE WHEN q19.pds_tag_value IN ('1','2','3','4','5') THEN q19.pds_tag_value::int ELSE 0 END
    FROM dqr_refrigerants_rating_qnineten q19
    JOIN supplier_sgiq ss ON ss.sgiq_id = q19.sgiq_id

    UNION ALL
    /* ================= Q21 ================= */
    SELECT ss.sup_id,
           CASE WHEN q21.ter_tag_value IN ('1','2','3','4','5') THEN q21.ter_tag_value::int ELSE 0 END,
           CASE WHEN q21.tir_tag_value IN ('1','2','3','4','5') THEN q21.tir_tag_value::int ELSE 0 END,
           CASE WHEN q21.gr_tag_value  IN ('1','2','3','4','5') THEN q21.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q21.c_tag_value   IN ('1','2','3','4','5') THEN q21.c_tag_value::int   ELSE 0 END,
           CASE WHEN q21.pds_tag_value IN ('1','2','3','4','5') THEN q21.pds_tag_value::int ELSE 0 END
    FROM dqr_process_emissions_sources_qtwentyone q21
    JOIN supplier_sgiq ss ON ss.sgiq_id = q21.sgiq_id

    UNION ALL
    /* ================= Q22 ================= */
    SELECT ss.sup_id,
           CASE WHEN q22.ter_tag_value IN ('1','2','3','4','5') THEN q22.ter_tag_value::int ELSE 0 END,
           CASE WHEN q22.tir_tag_value IN ('1','2','3','4','5') THEN q22.tir_tag_value::int ELSE 0 END,
           CASE WHEN q22.gr_tag_value  IN ('1','2','3','4','5') THEN q22.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q22.c_tag_value   IN ('1','2','3','4','5') THEN q22.c_tag_value::int   ELSE 0 END,
           CASE WHEN q22.pds_tag_value IN ('1','2','3','4','5') THEN q22.pds_tag_value::int ELSE 0 END
    FROM dqr_scope_two_indirect_emis_from_pur_energy_qtwentytwo q22
    JOIN supplier_sgiq ss ON ss.sgiq_id = q22.sgiq_id

    UNION ALL
    /* ================= Q24 ================= */
    SELECT ss.sup_id,
           CASE WHEN q24.ter_tag_value IN ('1','2','3','4','5') THEN q24.ter_tag_value::int ELSE 0 END,
           CASE WHEN q24.tir_tag_value IN ('1','2','3','4','5') THEN q24.tir_tag_value::int ELSE 0 END,
           CASE WHEN q24.gr_tag_value  IN ('1','2','3','4','5') THEN q24.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q24.c_tag_value   IN ('1','2','3','4','5') THEN q24.c_tag_value::int   ELSE 0 END,
           CASE WHEN q24.pds_tag_value IN ('1','2','3','4','5') THEN q24.pds_tag_value::int ELSE 0 END
    FROM dqr_scope_two_indirect_emissions_certificates_qtwentyfour q24
    JOIN supplier_sgiq ss ON ss.sgiq_id = q24.sgiq_id

    UNION ALL
    /* ================= Q26 ================= */
    SELECT ss.sup_id,
           CASE WHEN q26.ter_tag_value IN ('1','2','3','4','5') THEN q26.ter_tag_value::int ELSE 0 END,
           CASE WHEN q26.tir_tag_value IN ('1','2','3','4','5') THEN q26.tir_tag_value::int ELSE 0 END,
           CASE WHEN q26.gr_tag_value  IN ('1','2','3','4','5') THEN q26.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q26.c_tag_value   IN ('1','2','3','4','5') THEN q26.c_tag_value::int   ELSE 0 END,
           CASE WHEN q26.pds_tag_value IN ('1','2','3','4','5') THEN q26.pds_tag_value::int ELSE 0 END
    FROM dqr_scope_two_indirect_emissions_qtwentysix q26
    JOIN supplier_sgiq ss ON ss.sgiq_id = q26.sgiq_id

    UNION ALL
    /* ================= Q27 ================= */
    SELECT ss.sup_id,
           CASE WHEN q27.ter_tag_value IN ('1','2','3','4','5') THEN q27.ter_tag_value::int ELSE 0 END,
           CASE WHEN q27.tir_tag_value IN ('1','2','3','4','5') THEN q27.tir_tag_value::int ELSE 0 END,
           CASE WHEN q27.gr_tag_value  IN ('1','2','3','4','5') THEN q27.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q27.c_tag_value   IN ('1','2','3','4','5') THEN q27.c_tag_value::int   ELSE 0 END,
           CASE WHEN q27.pds_tag_value IN ('1','2','3','4','5') THEN q27.pds_tag_value::int ELSE 0 END
    FROM dqr_energy_intensity_of_pro_est_kwhor_mj_qtwentyseven q27
    JOIN supplier_sgiq ss ON ss.sgiq_id = q27.sgiq_id

    UNION ALL
    /* ================= Q28 ================= */
    SELECT ss.sup_id,
           CASE WHEN q28.ter_tag_value IN ('1','2','3','4','5') THEN q28.ter_tag_value::int ELSE 0 END,
           CASE WHEN q28.tir_tag_value IN ('1','2','3','4','5') THEN q28.tir_tag_value::int ELSE 0 END,
           CASE WHEN q28.gr_tag_value  IN ('1','2','3','4','5') THEN q28.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q28.c_tag_value   IN ('1','2','3','4','5') THEN q28.c_tag_value::int   ELSE 0 END,
           CASE WHEN q28.pds_tag_value IN ('1','2','3','4','5') THEN q28.pds_tag_value::int ELSE 0 END
    FROM dqr_process_specific_energy_usage_qtwentyeight q28
    JOIN supplier_sgiq ss ON ss.sgiq_id = q28.sgiq_id


     UNION ALL
    /* ================= Q30 ================= */
    SELECT ss.sup_id,
           CASE WHEN q30.ter_tag_value IN ('1','2','3','4','5') THEN q30.ter_tag_value::int ELSE 0 END,
           CASE WHEN q30.tir_tag_value IN ('1','2','3','4','5') THEN q30.tir_tag_value::int ELSE 0 END,
           CASE WHEN q30.gr_tag_value  IN ('1','2','3','4','5') THEN q30.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q30.c_tag_value   IN ('1','2','3','4','5') THEN q30.c_tag_value::int   ELSE 0 END,
           CASE WHEN q30.pds_tag_value IN ('1','2','3','4','5') THEN q30.pds_tag_value::int ELSE 0 END
    FROM dqr_abatement_systems_used_qthirty q30
    JOIN supplier_sgiq ss ON ss.sgiq_id = q30.sgiq_id

    UNION ALL
    /* ================= Q31 ================= */
    SELECT ss.sup_id,
           CASE WHEN q31.ter_tag_value IN ('1','2','3','4','5') THEN q31.ter_tag_value::int ELSE 0 END,
           CASE WHEN q31.tir_tag_value IN ('1','2','3','4','5') THEN q31.tir_tag_value::int ELSE 0 END,
           CASE WHEN q31.gr_tag_value  IN ('1','2','3','4','5') THEN q31.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q31.c_tag_value   IN ('1','2','3','4','5') THEN q31.c_tag_value::int   ELSE 0 END,
           CASE WHEN q31.pds_tag_value IN ('1','2','3','4','5') THEN q31.pds_tag_value::int ELSE 0 END
    FROM dqr_scope_two_indirect_emissions_qthirtyone q31
    JOIN supplier_sgiq ss ON ss.sgiq_id = q31.sgiq_id

    UNION ALL
    /* ================= Q32 ================= */
    SELECT ss.sup_id,
           CASE WHEN q32.ter_tag_value IN ('1','2','3','4','5') THEN q32.ter_tag_value::int ELSE 0 END,
           CASE WHEN q32.tir_tag_value IN ('1','2','3','4','5') THEN q32.tir_tag_value::int ELSE 0 END,
           CASE WHEN q32.gr_tag_value  IN ('1','2','3','4','5') THEN q32.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q32.c_tag_value   IN ('1','2','3','4','5') THEN q32.c_tag_value::int   ELSE 0 END,
           CASE WHEN q32.pds_tag_value IN ('1','2','3','4','5') THEN q32.pds_tag_value::int ELSE 0 END
    FROM dqr_type_of_quality_control_equipment_usage_qthirtytwo q32
    JOIN supplier_sgiq ss ON ss.sgiq_id = q32.sgiq_id

    UNION ALL
    /* ================= Q33 ================= */
    SELECT ss.sup_id,
           CASE WHEN q33.ter_tag_value IN ('1','2','3','4','5') THEN q33.ter_tag_value::int ELSE 0 END,
           CASE WHEN q33.tir_tag_value IN ('1','2','3','4','5') THEN q33.tir_tag_value::int ELSE 0 END,
           CASE WHEN q33.gr_tag_value  IN ('1','2','3','4','5') THEN q33.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q33.c_tag_value   IN ('1','2','3','4','5') THEN q33.c_tag_value::int   ELSE 0 END,
           CASE WHEN q33.pds_tag_value IN ('1','2','3','4','5') THEN q33.pds_tag_value::int ELSE 0 END
    FROM dqr_electricity_consumed_for_quality_control_qthirtythree q33
    JOIN supplier_sgiq ss ON ss.sgiq_id = q33.sgiq_id


     UNION ALL
    /* ================= Q34 ================= */
    SELECT ss.sup_id,
           CASE WHEN q34.ter_tag_value IN ('1','2','3','4','5') THEN q34.ter_tag_value::int ELSE 0 END,
           CASE WHEN q34.tir_tag_value IN ('1','2','3','4','5') THEN q34.tir_tag_value::int ELSE 0 END,
           CASE WHEN q34.gr_tag_value  IN ('1','2','3','4','5') THEN q34.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q34.c_tag_value   IN ('1','2','3','4','5') THEN q34.c_tag_value::int   ELSE 0 END,
           CASE WHEN q34.pds_tag_value IN ('1','2','3','4','5') THEN q34.pds_tag_value::int ELSE 0 END
    FROM dqr_quality_control_process_usage_qthirtyfour q34
    JOIN supplier_sgiq ss ON ss.sgiq_id = q34.sgiq_id

    UNION ALL
    /* ================= Q341 ================= */
    SELECT ss.sup_id,
           CASE WHEN q341.ter_tag_value IN ('1','2','3','4','5') THEN q341.ter_tag_value::int ELSE 0 END,
           CASE WHEN q341.tir_tag_value IN ('1','2','3','4','5') THEN q341.tir_tag_value::int ELSE 0 END,
           CASE WHEN q341.gr_tag_value  IN ('1','2','3','4','5') THEN q341.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q341.c_tag_value   IN ('1','2','3','4','5') THEN q341.c_tag_value::int   ELSE 0 END,
           CASE WHEN q341.pds_tag_value IN ('1','2','3','4','5') THEN q341.pds_tag_value::int ELSE 0 END
    FROM dqr_quality_control_process_usage_pressure_or_flow_qthirtyfour q341
    JOIN supplier_sgiq ss ON ss.sgiq_id = q341.sgiq_id

    UNION ALL
    /* ================= Q35 ================= */
    SELECT ss.sup_id,
           CASE WHEN q35.ter_tag_value IN ('1','2','3','4','5') THEN q35.ter_tag_value::int ELSE 0 END,
           CASE WHEN q35.tir_tag_value IN ('1','2','3','4','5') THEN q35.tir_tag_value::int ELSE 0 END,
           CASE WHEN q35.gr_tag_value  IN ('1','2','3','4','5') THEN q35.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q35.c_tag_value   IN ('1','2','3','4','5') THEN q35.c_tag_value::int   ELSE 0 END,
           CASE WHEN q35.pds_tag_value IN ('1','2','3','4','5') THEN q35.pds_tag_value::int ELSE 0 END
    FROM dqr_quality_control_use_any_consumables_qthirtyfive q35
    JOIN supplier_sgiq ss ON ss.sgiq_id = q35.sgiq_id


    UNION ALL
    /* ================= Q37 ================= */
    SELECT ss.sup_id,
           CASE WHEN q37.ter_tag_value IN ('1','2','3','4','5') THEN q37.ter_tag_value::int ELSE 0 END,
           CASE WHEN q37.tir_tag_value IN ('1','2','3','4','5') THEN q37.tir_tag_value::int ELSE 0 END,
           CASE WHEN q37.gr_tag_value  IN ('1','2','3','4','5') THEN q37.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q37.c_tag_value   IN ('1','2','3','4','5') THEN q37.c_tag_value::int   ELSE 0 END,
           CASE WHEN q37.pds_tag_value IN ('1','2','3','4','5') THEN q37.pds_tag_value::int ELSE 0 END
    FROM dqr_weight_of_samples_destroyed_qthirtyseven q37
    JOIN supplier_sgiq ss ON ss.sgiq_id = q37.sgiq_id

    UNION ALL
    /* ================= Q38 ================= */
    SELECT ss.sup_id,
           CASE WHEN q38.ter_tag_value IN ('1','2','3','4','5') THEN q38.ter_tag_value::int ELSE 0 END,
           CASE WHEN q38.tir_tag_value IN ('1','2','3','4','5') THEN q38.tir_tag_value::int ELSE 0 END,
           CASE WHEN q38.gr_tag_value  IN ('1','2','3','4','5') THEN q38.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q38.c_tag_value   IN ('1','2','3','4','5') THEN q38.c_tag_value::int   ELSE 0 END,
           CASE WHEN q38.pds_tag_value IN ('1','2','3','4','5') THEN q38.pds_tag_value::int ELSE 0 END
    FROM dqr_defect_or_rej_rate_identified_by_quality_control_qthirtyeight q38
    JOIN supplier_sgiq ss ON ss.sgiq_id = q38.sgiq_id


     UNION ALL
    /* ================= Q39 ================= */
    SELECT ss.sup_id,
           CASE WHEN q39.ter_tag_value IN ('1','2','3','4','5') THEN q39.ter_tag_value::int ELSE 0 END,
           CASE WHEN q39.tir_tag_value IN ('1','2','3','4','5') THEN q39.tir_tag_value::int ELSE 0 END,
           CASE WHEN q39.gr_tag_value  IN ('1','2','3','4','5') THEN q39.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q39.c_tag_value   IN ('1','2','3','4','5') THEN q39.c_tag_value::int   ELSE 0 END,
           CASE WHEN q39.pds_tag_value IN ('1','2','3','4','5') THEN q39.pds_tag_value::int ELSE 0 END
    FROM dqr_rework_rate_due_to_quality_control_qthirtynine q39
    JOIN supplier_sgiq ss ON ss.sgiq_id = q39.sgiq_id

    UNION ALL
    /* ================= Q40 ================= */
    SELECT ss.sup_id,
           CASE WHEN q40.ter_tag_value IN ('1','2','3','4','5') THEN q40.ter_tag_value::int ELSE 0 END,
           CASE WHEN q40.tir_tag_value IN ('1','2','3','4','5') THEN q40.tir_tag_value::int ELSE 0 END,
           CASE WHEN q40.gr_tag_value  IN ('1','2','3','4','5') THEN q40.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q40.c_tag_value   IN ('1','2','3','4','5') THEN q40.c_tag_value::int   ELSE 0 END,
           CASE WHEN q40.pds_tag_value IN ('1','2','3','4','5') THEN q40.pds_tag_value::int ELSE 0 END
    FROM dqr_weight_of_quality_control_waste_generated_qforty q40
    JOIN supplier_sgiq ss ON ss.sgiq_id = q40.sgiq_id

    UNION ALL
    /* ================= Q41 ================= */
    SELECT ss.sup_id,
           CASE WHEN q41.ter_tag_value IN ('1','2','3','4','5') THEN q41.ter_tag_value::int ELSE 0 END,
           CASE WHEN q41.tir_tag_value IN ('1','2','3','4','5') THEN q41.tir_tag_value::int ELSE 0 END,
           CASE WHEN q41.gr_tag_value  IN ('1','2','3','4','5') THEN q41.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q41.c_tag_value   IN ('1','2','3','4','5') THEN q41.c_tag_value::int   ELSE 0 END,
           CASE WHEN q41.pds_tag_value IN ('1','2','3','4','5') THEN q41.pds_tag_value::int ELSE 0 END
    FROM dqr_scope_two_indirect_emissions_qfortyone q41
    JOIN supplier_sgiq ss ON ss.sgiq_id = q41.sgiq_id


     UNION ALL
    /* ================= Q44 ================= */
    SELECT ss.sup_id,
           CASE WHEN q44.ter_tag_value IN ('1','2','3','4','5') THEN q44.ter_tag_value::int ELSE 0 END,
           CASE WHEN q44.tir_tag_value IN ('1','2','3','4','5') THEN q44.tir_tag_value::int ELSE 0 END,
           CASE WHEN q44.gr_tag_value  IN ('1','2','3','4','5') THEN q44.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q44.c_tag_value   IN ('1','2','3','4','5') THEN q44.c_tag_value::int   ELSE 0 END,
           CASE WHEN q44.pds_tag_value IN ('1','2','3','4','5') THEN q44.pds_tag_value::int ELSE 0 END
    FROM dqr_energy_consumption_for_qfortyfour_qfortyfour q44
    JOIN supplier_sgiq ss ON ss.sgiq_id = q44.sgiq_id


     UNION ALL
    /* ================= Q46 ================= */
    SELECT ss.sup_id,
           CASE WHEN q46.ter_tag_value IN ('1','2','3','4','5') THEN q46.ter_tag_value::int ELSE 0 END,
           CASE WHEN q46.tir_tag_value IN ('1','2','3','4','5') THEN q46.tir_tag_value::int ELSE 0 END,
           CASE WHEN q46.gr_tag_value  IN ('1','2','3','4','5') THEN q46.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q46.c_tag_value   IN ('1','2','3','4','5') THEN q46.c_tag_value::int   ELSE 0 END,
           CASE WHEN q46.pds_tag_value IN ('1','2','3','4','5') THEN q46.pds_tag_value::int ELSE 0 END
    FROM dqr_cloud_provider_details_qfortysix q46
    JOIN supplier_sgiq ss ON ss.sgiq_id = q46.sgiq_id

    UNION ALL
    /* ================= Q47 ================= */
    SELECT ss.sup_id,
           CASE WHEN q47.ter_tag_value IN ('1','2','3','4','5') THEN q47.ter_tag_value::int ELSE 0 END,
           CASE WHEN q47.tir_tag_value IN ('1','2','3','4','5') THEN q47.tir_tag_value::int ELSE 0 END,
           CASE WHEN q47.gr_tag_value  IN ('1','2','3','4','5') THEN q47.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q47.c_tag_value   IN ('1','2','3','4','5') THEN q47.c_tag_value::int   ELSE 0 END,
           CASE WHEN q47.pds_tag_value IN ('1','2','3','4','5') THEN q47.pds_tag_value::int ELSE 0 END
    FROM dqr_dedicated_monitoring_sensor_usage_qfortyseven q47
    JOIN supplier_sgiq ss ON ss.sgiq_id = q47.sgiq_id

    UNION ALL
    /* ================= Q48 ================= */
    SELECT ss.sup_id,
           CASE WHEN q48.ter_tag_value IN ('1','2','3','4','5') THEN q48.ter_tag_value::int ELSE 0 END,
           CASE WHEN q48.tir_tag_value IN ('1','2','3','4','5') THEN q48.tir_tag_value::int ELSE 0 END,
           CASE WHEN q48.gr_tag_value  IN ('1','2','3','4','5') THEN q48.gr_tag_value::int  ELSE 0 END,
           CASE WHEN q48.c_tag_value   IN ('1','2','3','4','5') THEN q48.c_tag_value::int   ELSE 0 END,
           CASE WHEN q48.pds_tag_value IN ('1','2','3','4','5') THEN q48.pds_tag_value::int ELSE 0 END
    FROM dqr_annual_replacement_rate_of_sensor_qfortyeight q48
    JOIN supplier_sgiq ss ON ss.sgiq_id = q48.sgiq_id

    UNION ALL
    /* ================= Q51 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q51.ter_tag_value IN ('1','2','3','4','5') THEN q51.ter_tag_value::int ELSE 0 END AS ter,
    CASE WHEN q51.tir_tag_value IN ('1','2','3','4','5') THEN q51.tir_tag_value::int ELSE 0 END AS tir,
    CASE WHEN q51.gr_tag_value  IN ('1','2','3','4','5') THEN q51.gr_tag_value::int  ELSE 0 END AS gr,
    CASE WHEN q51.c_tag_value   IN ('1','2','3','4','5') THEN q51.c_tag_value::int   ELSE 0 END AS c,
    CASE WHEN q51.pds_tag_value IN ('1','2','3','4','5') THEN q51.pds_tag_value::int ELSE 0 END AS pds
FROM dqr_energy_consumption_for_qfiftyone_qfiftyone q51
JOIN supplier_sgiq ss ON ss.sgiq_id = q51.sgiq_id

UNION ALL

/* ================= Q52 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q52.ter_tag_value IN ('1','2','3','4','5') THEN q52.ter_tag_value::int ELSE 0 END,
    CASE WHEN q52.tir_tag_value IN ('1','2','3','4','5') THEN q52.tir_tag_value::int ELSE 0 END,
    CASE WHEN q52.gr_tag_value  IN ('1','2','3','4','5') THEN q52.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q52.c_tag_value   IN ('1','2','3','4','5') THEN q52.c_tag_value::int   ELSE 0 END,
    CASE WHEN q52.pds_tag_value IN ('1','2','3','4','5') THEN q52.pds_tag_value::int ELSE 0 END
FROM dqr_raw_materials_used_in_component_manufacturing_qfiftytwo q52
JOIN supplier_sgiq ss ON ss.sgiq_id = q52.sgiq_id

UNION ALL

/* ================= Q53 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q53.ter_tag_value IN ('1','2','3','4','5') THEN q53.ter_tag_value::int ELSE 0 END,
    CASE WHEN q53.tir_tag_value IN ('1','2','3','4','5') THEN q53.tir_tag_value::int ELSE 0 END,
    CASE WHEN q53.gr_tag_value  IN ('1','2','3','4','5') THEN q53.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q53.c_tag_value   IN ('1','2','3','4','5') THEN q53.c_tag_value::int   ELSE 0 END,
    CASE WHEN q53.pds_tag_value IN ('1','2','3','4','5') THEN q53.pds_tag_value::int ELSE 0 END
FROM dqr_scope_three_other_indirect_emissions_qfiftythree q53
JOIN supplier_sgiq ss ON ss.sgiq_id = q53.sgiq_id

UNION ALL

/* ================= Q54 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q54.ter_tag_value IN ('1','2','3','4','5') THEN q54.ter_tag_value::int ELSE 0 END,
    CASE WHEN q54.tir_tag_value IN ('1','2','3','4','5') THEN q54.tir_tag_value::int ELSE 0 END,
    CASE WHEN q54.gr_tag_value  IN ('1','2','3','4','5') THEN q54.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q54.c_tag_value   IN ('1','2','3','4','5') THEN q54.c_tag_value::int   ELSE 0 END,
    CASE WHEN q54.pds_tag_value IN ('1','2','3','4','5') THEN q54.pds_tag_value::int ELSE 0 END
FROM dqr_scope_three_other_indirect_emissions_qfiftyfour q54
JOIN supplier_sgiq ss ON ss.sgiq_id = q54.sgiq_id

UNION ALL

/* ================= Q56 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q56.ter_tag_value IN ('1','2','3','4','5') THEN q56.ter_tag_value::int ELSE 0 END AS ter,
    CASE WHEN q56.tir_tag_value IN ('1','2','3','4','5') THEN q56.tir_tag_value::int ELSE 0 END AS tir,
    CASE WHEN q56.gr_tag_value  IN ('1','2','3','4','5') THEN q56.gr_tag_value::int  ELSE 0 END AS gr,
    CASE WHEN q56.c_tag_value   IN ('1','2','3','4','5') THEN q56.c_tag_value::int   ELSE 0 END AS c,
    CASE WHEN q56.pds_tag_value IN ('1','2','3','4','5') THEN q56.pds_tag_value::int ELSE 0 END AS pds
FROM dqr_recycled_materials_with_percentage_qfiftysix q56
JOIN supplier_sgiq ss ON ss.sgiq_id = q56.sgiq_id

UNION ALL

/* ================= Q58 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q58.ter_tag_value IN ('1','2','3','4','5') THEN q58.ter_tag_value::int ELSE 0 END,
    CASE WHEN q58.tir_tag_value IN ('1','2','3','4','5') THEN q58.tir_tag_value::int ELSE 0 END,
    CASE WHEN q58.gr_tag_value  IN ('1','2','3','4','5') THEN q58.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q58.c_tag_value   IN ('1','2','3','4','5') THEN q58.c_tag_value::int   ELSE 0 END,
    CASE WHEN q58.pds_tag_value IN ('1','2','3','4','5') THEN q58.pds_tag_value::int ELSE 0 END
FROM dqr_pre_post_consumer_reutilization_percentage_qfiftyeight q58
JOIN supplier_sgiq ss ON ss.sgiq_id = q58.sgiq_id

UNION ALL

/* ================= Q59 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q59.ter_tag_value IN ('1','2','3','4','5') THEN q59.ter_tag_value::int ELSE 0 END,
    CASE WHEN q59.tir_tag_value IN ('1','2','3','4','5') THEN q59.tir_tag_value::int ELSE 0 END,
    CASE WHEN q59.gr_tag_value  IN ('1','2','3','4','5') THEN q59.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q59.c_tag_value   IN ('1','2','3','4','5') THEN q59.c_tag_value::int   ELSE 0 END,
    CASE WHEN q59.pds_tag_value IN ('1','2','3','4','5') THEN q59.pds_tag_value::int ELSE 0 END
FROM dqr_pir_pcr_material_percentage_qfiftynine q59
JOIN supplier_sgiq ss ON ss.sgiq_id = q59.sgiq_id

UNION ALL

/* ================= Q60 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q60.ter_tag_value IN ('1','2','3','4','5') THEN q60.ter_tag_value::int ELSE 0 END,
    CASE WHEN q60.tir_tag_value IN ('1','2','3','4','5') THEN q60.tir_tag_value::int ELSE 0 END,
    CASE WHEN q60.gr_tag_value  IN ('1','2','3','4','5') THEN q60.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q60.c_tag_value   IN ('1','2','3','4','5') THEN q60.c_tag_value::int   ELSE 0 END,
    CASE WHEN q60.pds_tag_value IN ('1','2','3','4','5') THEN q60.pds_tag_value::int ELSE 0 END
FROM dqr_type_of_pack_mat_used_for_delivering_qsixty q60
JOIN supplier_sgiq ss ON ss.sgiq_id = q60.sgiq_id

UNION ALL

/* ================= Q61 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q61.ter_tag_value IN ('1','2','3','4','5') THEN q61.ter_tag_value::int ELSE 0 END,
    CASE WHEN q61.tir_tag_value IN ('1','2','3','4','5') THEN q61.tir_tag_value::int ELSE 0 END,
    CASE WHEN q61.gr_tag_value  IN ('1','2','3','4','5') THEN q61.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q61.c_tag_value   IN ('1','2','3','4','5') THEN q61.c_tag_value::int   ELSE 0 END,
    CASE WHEN q61.pds_tag_value IN ('1','2','3','4','5') THEN q61.pds_tag_value::int ELSE 0 END
FROM dqr_weight_of_packaging_per_unit_product_qsixtyone q61
JOIN supplier_sgiq ss ON ss.sgiq_id = q61.sgiq_id

UNION ALL

/* ================= Q64 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q64.ter_tag_value IN ('1','2','3','4','5') THEN q64.ter_tag_value::int ELSE 0 END AS ter,
    CASE WHEN q64.tir_tag_value IN ('1','2','3','4','5') THEN q64.tir_tag_value::int ELSE 0 END AS tir,
    CASE WHEN q64.gr_tag_value  IN ('1','2','3','4','5') THEN q64.gr_tag_value::int  ELSE 0 END AS gr,
    CASE WHEN q64.c_tag_value   IN ('1','2','3','4','5') THEN q64.c_tag_value::int   ELSE 0 END AS c,
    CASE WHEN q64.pds_tag_value IN ('1','2','3','4','5') THEN q64.pds_tag_value::int ELSE 0 END AS pds
FROM dqr_scope_three_other_indirect_emissions_qsixtyfour q64
JOIN supplier_sgiq ss ON ss.sgiq_id = q64.sgiq_id

UNION ALL

/* ================= Q67 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q67.ter_tag_value IN ('1','2','3','4','5') THEN q67.ter_tag_value::int ELSE 0 END,
    CASE WHEN q67.tir_tag_value IN ('1','2','3','4','5') THEN q67.tir_tag_value::int ELSE 0 END,
    CASE WHEN q67.gr_tag_value  IN ('1','2','3','4','5') THEN q67.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q67.c_tag_value   IN ('1','2','3','4','5') THEN q67.c_tag_value::int   ELSE 0 END,
    CASE WHEN q67.pds_tag_value IN ('1','2','3','4','5') THEN q67.pds_tag_value::int ELSE 0 END
FROM dqr_energy_consumption_for_qsixtyseven_qsixtyseven q67
JOIN supplier_sgiq ss ON ss.sgiq_id = q67.sgiq_id

UNION ALL

/* ================= Q68 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q68.ter_tag_value IN ('1','2','3','4','5') THEN q68.ter_tag_value::int ELSE 0 END,
    CASE WHEN q68.tir_tag_value IN ('1','2','3','4','5') THEN q68.tir_tag_value::int ELSE 0 END,
    CASE WHEN q68.gr_tag_value  IN ('1','2','3','4','5') THEN q68.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q68.c_tag_value   IN ('1','2','3','4','5') THEN q68.c_tag_value::int   ELSE 0 END,
    CASE WHEN q68.pds_tag_value IN ('1','2','3','4','5') THEN q68.pds_tag_value::int ELSE 0 END
FROM dqr_weight_of_pro_packaging_waste_qsixtyeight q68
JOIN supplier_sgiq ss ON ss.sgiq_id = q68.sgiq_id

UNION ALL

/* ================= Q69 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q69.ter_tag_value IN ('1','2','3','4','5') THEN q69.ter_tag_value::int ELSE 0 END,
    CASE WHEN q69.tir_tag_value IN ('1','2','3','4','5') THEN q69.tir_tag_value::int ELSE 0 END,
    CASE WHEN q69.gr_tag_value  IN ('1','2','3','4','5') THEN q69.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q69.c_tag_value   IN ('1','2','3','4','5') THEN q69.c_tag_value::int   ELSE 0 END,
    CASE WHEN q69.pds_tag_value IN ('1','2','3','4','5') THEN q69.pds_tag_value::int ELSE 0 END
FROM dqr_scope_three_other_indirect_emissions_qsixtynine q69
JOIN supplier_sgiq ss ON ss.sgiq_id = q69.sgiq_id

UNION ALL
/* ================= Q71 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q71.ter_tag_value IN ('1','2','3','4','5') THEN q71.ter_tag_value::int ELSE 0 END AS ter,
    CASE WHEN q71.tir_tag_value IN ('1','2','3','4','5') THEN q71.tir_tag_value::int ELSE 0 END AS tir,
    CASE WHEN q71.gr_tag_value  IN ('1','2','3','4','5') THEN q71.gr_tag_value::int  ELSE 0 END AS gr,
    CASE WHEN q71.c_tag_value   IN ('1','2','3','4','5') THEN q71.c_tag_value::int   ELSE 0 END AS c,
    CASE WHEN q71.pds_tag_value IN ('1','2','3','4','5') THEN q71.pds_tag_value::int ELSE 0 END AS pds
FROM dqr_type_of_by_product_qseventyone q71
JOIN supplier_sgiq ss ON ss.sgiq_id = q71.sgiq_id

UNION ALL

/* ================= Q73 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q73.ter_tag_value IN ('1','2','3','4','5') THEN q73.ter_tag_value::int ELSE 0 END,
    CASE WHEN q73.tir_tag_value IN ('1','2','3','4','5') THEN q73.tir_tag_value::int ELSE 0 END,
    CASE WHEN q73.gr_tag_value  IN ('1','2','3','4','5') THEN q73.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q73.c_tag_value   IN ('1','2','3','4','5') THEN q73.c_tag_value::int   ELSE 0 END,
    CASE WHEN q73.pds_tag_value IN ('1','2','3','4','5') THEN q73.pds_tag_value::int ELSE 0 END
FROM dqr_co_two_emission_of_raw_material_qseventythree q73
JOIN supplier_sgiq ss ON ss.sgiq_id = q73.sgiq_id

UNION ALL

/* ================= Q74 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q74.ter_tag_value IN ('1','2','3','4','5') THEN q74.ter_tag_value::int ELSE 0 END,
    CASE WHEN q74.tir_tag_value IN ('1','2','3','4','5') THEN q74.tir_tag_value::int ELSE 0 END,
    CASE WHEN q74.gr_tag_value  IN ('1','2','3','4','5') THEN q74.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q74.c_tag_value   IN ('1','2','3','4','5') THEN q74.c_tag_value::int   ELSE 0 END,
    CASE WHEN q74.pds_tag_value IN ('1','2','3','4','5') THEN q74.pds_tag_value::int ELSE 0 END
FROM dqr_mode_of_transport_used_for_transportation_qseventyfour q74
JOIN supplier_sgiq ss ON ss.sgiq_id = q74.sgiq_id

UNION ALL

/* ================= Q75 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q75.ter_tag_value IN ('1','2','3','4','5') THEN q75.ter_tag_value::int ELSE 0 END,
    CASE WHEN q75.tir_tag_value IN ('1','2','3','4','5') THEN q75.tir_tag_value::int ELSE 0 END,
    CASE WHEN q75.gr_tag_value  IN ('1','2','3','4','5') THEN q75.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q75.c_tag_value   IN ('1','2','3','4','5') THEN q75.c_tag_value::int   ELSE 0 END,
    CASE WHEN q75.pds_tag_value IN ('1','2','3','4','5') THEN q75.pds_tag_value::int ELSE 0 END
FROM dqr_destination_plant_component_transportation_qseventyfive q75
JOIN supplier_sgiq ss ON ss.sgiq_id = q75.sgiq_id

UNION ALL

/* ================= Q79 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q79.ter_tag_value IN ('1','2','3','4','5') THEN q79.ter_tag_value::int ELSE 0 END,
    CASE WHEN q79.tir_tag_value IN ('1','2','3','4','5') THEN q79.tir_tag_value::int ELSE 0 END,
    CASE WHEN q79.gr_tag_value  IN ('1','2','3','4','5') THEN q79.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q79.c_tag_value   IN ('1','2','3','4','5') THEN q79.c_tag_value::int   ELSE 0 END,
    CASE WHEN q79.pds_tag_value IN ('1','2','3','4','5') THEN q79.pds_tag_value::int ELSE 0 END
FROM dqr_scope_three_other_indirect_emissions_qseventynine q79
JOIN supplier_sgiq ss ON ss.sgiq_id = q79.sgiq_id

UNION ALL

/* ================= Q80 ================= */
SELECT
    ss.sup_id,
    CASE WHEN q80.ter_tag_value IN ('1','2','3','4','5') THEN q80.ter_tag_value::int ELSE 0 END,
    CASE WHEN q80.tir_tag_value IN ('1','2','3','4','5') THEN q80.tir_tag_value::int ELSE 0 END,
    CASE WHEN q80.gr_tag_value  IN ('1','2','3','4','5') THEN q80.gr_tag_value::int  ELSE 0 END,
    CASE WHEN q80.c_tag_value   IN ('1','2','3','4','5') THEN q80.c_tag_value::int   ELSE 0 END,
    CASE WHEN q80.pds_tag_value IN ('1','2','3','4','5') THEN q80.pds_tag_value::int ELSE 0 END
FROM dqr_scope_three_other_indirect_emissions_qeighty q80
JOIN supplier_sgiq ss ON ss.sgiq_id = q80.sgiq_id


),
 dqr_scores AS (
    SELECT
        du.sup_id,
        ROUND(AVG(du.ter)::numeric, 2) AS total_average_value_ter,
        ROUND(AVG(du.tir)::numeric, 2) AS total_average_value_tir,
        ROUND(AVG(du.gr)::numeric, 2)  AS total_average_value_gr,
        ROUND(AVG(du.c)::numeric, 2)   AS total_average_value_c,
        ROUND(AVG(du.pds)::numeric, 2) AS total_average_value_pds,
        ROUND(
            (AVG(du.ter) + AVG(du.tir) + AVG(du.gr) + AVG(du.c) + AVG(du.pds)) / 5,
            2
        ) AS overall_dqr_score
    FROM dqr_union du
    GROUP BY du.sup_id
)

SELECT
    ds.sup_id,
    ss.supplier_name,
    ss.supplier_code,
    ss.supplier_email,
    ds.total_average_value_ter,
    ds.total_average_value_tir,
    ds.total_average_value_gr,
    ds.total_average_value_c,
    ds.total_average_value_pds,
    ds.overall_dqr_score,
    CASE
        WHEN ds.overall_dqr_score <= 1.5 THEN '1 (Very Good)'
        WHEN ds.overall_dqr_score <= 2.5 THEN '2 (Good)'
        WHEN ds.overall_dqr_score <= 3.5 THEN '3 (Fair)'
        WHEN ds.overall_dqr_score <= 4.5 THEN '4 (Poor)'
        ELSE '5 (Very Poor)'
    END AS criterion,
    CASE
        WHEN ds.overall_dqr_score <= 1.5 THEN 'Fully representative, verified, recent, primary data'
        WHEN ds.overall_dqr_score <= 2.5 THEN 'High representativeness, partly verified'
        WHEN ds.overall_dqr_score <= 3.5 THEN 'Moderate accuracy, based on industry averages'
        WHEN ds.overall_dqr_score <= 4.5 THEN 'Outdated, estimated, or incomplete data'
        ELSE 'Non-representative / missing key data'
    END AS meaning_description
FROM dqr_scores ds
JOIN supplier_sgiq ss ON ss.sup_id = ds.sup_id AND ss.client_id IS NULL
ORDER BY ds.overall_dqr_score DESC 
LIMIT ${limit} OFFSET ${offset};


            `;

            const result = await client.query(query);

            const rows = result.rows;
            const totalCount = rows.length > 0 ? rows.length : 0;

            return res.send(
                generateResponse(true, "Success!", 200, {
                    page,
                    pageSize: limit,
                    totalCount,
                    data: result.rows
                })
            );

        } catch (error: any) {
            console.error("❌ Error fetching supplier DQR rating:", error);
            return res.send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function upsertFavoriteReports(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const {
                user_id,
                is_product_footprint = false,
                is_supplier_footprint = false,
                is_material_footprint = false,
                is_electricity_footprint = false,
                is_transportation_footprint = false,
                is_packaging_footprint = false,
                is_dqr_rating_footprint = false
            } = req.body;

            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const query = `
                INSERT INTO favorite_reports (
                    fr_id,
                    user_id,
                    is_product_footprint,
                    is_supplier_footprint,
                    is_material_footprint,
                    is_electricity_footprint,
                    is_transportation_footprint,
                    is_packaging_footprint,
                    is_dqr_rating_footprint
                )
                VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9
                )
                ON CONFLICT (user_id)
                DO UPDATE SET
                    is_product_footprint = EXCLUDED.is_product_footprint,
                    is_supplier_footprint = EXCLUDED.is_supplier_footprint,
                    is_material_footprint = EXCLUDED.is_material_footprint,
                    is_electricity_footprint = EXCLUDED.is_electricity_footprint,
                    is_transportation_footprint = EXCLUDED.is_transportation_footprint,
                    is_packaging_footprint = EXCLUDED.is_packaging_footprint,
                    is_dqr_rating_footprint = EXCLUDED.is_dqr_rating_footprint,
                    update_date = CURRENT_TIMESTAMP
                RETURNING *;
            `;

            const values = [
                ulid(),              // fr_id
                user_id,
                is_product_footprint,
                is_supplier_footprint,
                is_material_footprint,
                is_electricity_footprint,
                is_transportation_footprint,
                is_packaging_footprint,
                is_dqr_rating_footprint
            ];

            const result = await client.query(query, values);

            return res.status(200).send({
                success: true,
                message: "Favorite reports saved successfully",
                data: result.rows[0]
            });

        } catch (error: any) {
            console.error("Favorite reports error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}

export async function getFavoriteReportsByUserId(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { user_id } = req.query;

            if (!user_id) {
                return res.status(400).send({
                    success: false,
                    message: "user_id is required"
                });
            }

            const result = await client.query(
                `
                SELECT
                    fr_id,
                    user_id,
                    is_product_footprint,
                    is_supplier_footprint,
                    is_material_footprint,
                    is_electricity_footprint,
                    is_transportation_footprint,
                    is_packaging_footprint,
                    is_dqr_rating_footprint,
                    created_by,
                    updated_by,
                    update_date,
                    created_date
                FROM favorite_reports
                WHERE user_id = $1
                LIMIT 1
                `,
                [user_id]
            );

            /* ---------- if no record ---------- */
            if (result.rowCount === 0) {
                return res.status(200).send({
                    success: true,
                    message: "No favorite reports found",
                    data: {
                        user_id,
                        is_product_footprint: false,
                        is_supplier_footprint: false,
                        is_material_footprint: false,
                        is_electricity_footprint: false,
                        is_transportation_footprint: false,
                        is_packaging_footprint: false,
                        is_dqr_rating_footprint: false
                    }
                });
            }

            return res.status(200).send({
                success: true,
                message: "Favorite reports fetched successfully",
                data: result.rows[0]
            });

        } catch (error: any) {
            console.error("Fetch favorite reports error:", error);
            return res.status(500).send({
                success: false,
                message: error.message
            });
        }
    });
}
