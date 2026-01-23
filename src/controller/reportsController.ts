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
        WHERE mem.bom_id = b.id
    ) AS material_emission,

    /* ---------- PRODUCTION EMISSION ---------- */
    (
        SELECT to_jsonb(mep)
        FROM bom_emission_production_calculation_engine mep
        WHERE mep.bom_id = b.id
        LIMIT 1
    ) AS production_emission_calculation,

    /* ---------- PACKAGING EMISSION ---------- */
    (
        SELECT to_jsonb(mpk)
        FROM bom_emission_packaging_calculation_engine mpk
        WHERE mpk.bom_id = b.id
        LIMIT 1
    ) AS packaging_emission_calculation,

    /* ---------- WASTE EMISSION ---------- */
    (
        SELECT to_jsonb(mw)
        FROM bom_emission_waste_calculation_engine mw
        WHERE mw.bom_id = b.id
        LIMIT 1
    ) AS waste_emission_calculation,

    /* ---------- LOGISTIC EMISSION ---------- */
    (
        SELECT to_jsonb(ml)
        FROM bom_emission_logistic_calculation_engine ml
        WHERE ml.bom_id = b.id
        LIMIT 1
    ) AS logistic_emission_calculation,

    /* ---------- TOTAL PCF ---------- */
    (
        SELECT to_jsonb(pcfe)
        FROM bom_emission_calculation_engine pcfe
        WHERE pcfe.bom_id = b.id
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
    WHERE sgiq.sup_id = b.supplier_id
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
        ON bece.bom_id = b2.id
    WHERE b2.supplier_id = b.supplier_id
) spcf ON TRUE

LEFT JOIN LATERAL (
    SELECT sgiq.annual_reporting_period
    FROM supplier_general_info_questions sgiq
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
      AND sgiq.sup_id = b.supplier_id
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

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
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

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
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

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
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
        ON sgi.bom_pcf_id = b.bom_pcf_id
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
        ON bece.bom_id = b2.id
    WHERE b2.supplier_id = b.supplier_id
) spcf ON TRUE

LEFT JOIN LATERAL (
    SELECT sgiq.annual_reporting_period
    FROM supplier_general_info_questions sgiq
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
      AND sgiq.sup_id = b.supplier_id
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

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
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

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
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

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
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
      WHERE sgiq.bom_pcf_id = b.bom_pcf_id
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
          WHERE sgiq.bom_pcf_id = b.bom_pcf_id
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
    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
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
        ON sgiq.sgiq_id = stoie.sgiq_id
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
        ON sgiq.sgiq_id = stoie.sgiq_id
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
          ON sgiq.sgiq_id = stoie.sgiq_id
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
      AND sgiq.sup_id = b.supplier_id
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

    WHERE sgiq.bom_pcf_id = b.bom_pcf_id
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