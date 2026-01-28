import { withClient } from '../util/database';
import { generateResponse } from '../util/genRes';

// Below Code without Filter
// export async function getComponnetMasterList(req: any, res: any) {
//     const { pageNumber = 1, pageSize = 20 } = req.query;

//     const limit = parseInt(pageSize);
//     const page = parseInt(pageNumber) > 0 ? parseInt(pageNumber) : 1;
//     const offset = (page - 1) * limit;

//     return withClient(async (client: any) => {
//         try {

//             const result = await client.query(
//                 `
// SELECT
//     pcf.id,
//     pcf.code,
//     pcf.request_title,
//     pcf.priority,
//     pcf.request_organization,
//     pcf.due_date,
//     pcf.request_description,
//     pcf.product_code,
//     pcf.model_version,
//     pcf.status,
//     pcf.technical_specification_file,
//     pcf.product_images,
//     pcf.created_by,
//     pcf.updated_by,
//     pcf.update_date,
//     pcf.created_date,

//     /* ---------- Product Category ---------- */
//     jsonb_build_object(
//         'id', pc.id,
//         'code', pc.code,
//         'name', pc.name
//     ) AS product_category,

//     /* ---------- Component Category ---------- */
//     jsonb_build_object(
//         'id', cc.id,
//         'code', cc.code,
//         'name', cc.name
//     ) AS component_category,

//     /* ---------- Component Type ---------- */
//     jsonb_build_object(
//         'id', ct.id,
//         'code', ct.code,
//         'name', ct.name
//     ) AS component_type,

//     /* ---------- Manufacturer ---------- */
//     jsonb_build_object(
//         'id', mf.id,
//         'code', mf.code,
//         'name', mf.name,
//         'address', mf.address,
//         'lat', mf.lat,
//         'long', mf.long
//     ) AS manufacturer,

//     /* ---------- Created By ---------- */
//     jsonb_build_object(
//         'user_id', ucb.user_id,
//         'user_name', ucb.user_name,
//         'user_role', ucb.user_role
//     ) AS createdBy,

//     /* ---------- Product Specifications ---------- */
//     COALESCE(ps.specs, '[]'::jsonb) AS product_specifications,

//     /* ---------- BOM DETAILS ---------- */
//     COALESCE(bomd.bom_details, '[]'::jsonb) AS bom_details

// FROM bom_pcf_request pcf

// /* ---------- Master Joins ---------- */
// LEFT JOIN product_category pc ON pc.id = pcf.product_category_id
// LEFT JOIN component_category cc ON cc.id = pcf.component_category_id
// LEFT JOIN component_type ct ON ct.id = pcf.component_type_id
// LEFT JOIN manufacturer mf ON mf.id = pcf.manufacturer_id

// /* ---------- Product Specification ---------- */
// LEFT JOIN LATERAL (
//     SELECT jsonb_agg(
//         jsonb_build_object(
//             'id', ps.id,
//             'specification_name', ps.specification_name,
//             'specification_value', ps.specification_value,
//             'specification_unit', ps.specification_unit
//         )
//     ) AS specs
//     FROM bom_pcf_request_product_specification ps
//     WHERE ps.bom_pcf_id = pcf.id
// ) ps ON TRUE

// /* ---------- BOM DETAILS ---------- */
// LEFT JOIN LATERAL (
//     SELECT jsonb_agg(
//         jsonb_build_object(
//             /* ---------- BOM BASIC ---------- */
//             'id', b.id,
//             'code', b.code,
//             'material_number', b.material_number,
//             'component_name', b.component_name,
//             'quantity', b.qunatity,
//             'production_location', b.production_location,
//             'manufacturer', b.manufacturer,
//             'detail_description', b.detail_description,
//             'weight_gms', b.weight_gms,
//             'total_weight_gms', b.total_weight_gms,
//             'component_category', b.component_category,
//             'price', b.price,
//             'total_price', b.total_price,
//             'economic_ratio', b.economic_ratio,
//             'supplier_id', b.supplier_id,
//             'is_weight_gms', b.is_weight_gms,
//             'created_date', b.created_date,

//             /* ---------- MATERIAL EMISSION ---------- */
//             'material_emission',
//             (
//                 SELECT jsonb_agg(to_jsonb(mem))
//                 FROM bom_emission_material_calculation_engine mem
//                 WHERE mem.bom_id = b.id
//             ),

//             /* ---------- PRODUCTION EMISSION ---------- */
//             'production_emission_calculation',
//             (
//                 SELECT to_jsonb(mep)
//                 FROM bom_emission_production_calculation_engine mep
//                 WHERE mep.bom_id = b.id
//                 LIMIT 1
//             ),

//             /* ---------- PACKAGING EMISSION ---------- */
//             'packaging_emission_calculation',
//             (
//                 SELECT to_jsonb(mpk)
//                 FROM bom_emission_packaging_calculation_engine mpk
//                 WHERE mpk.bom_id = b.id
//                 LIMIT 1
//             ),

//             /* ---------- WASTE EMISSION ---------- */
//             'waste_emission_calculation',
//             (
//                 SELECT to_jsonb(mw)
//                 FROM bom_emission_waste_calculation_engine mw
//                 WHERE mw.bom_id = b.id
//                 LIMIT 1
//             ),

//             /* ---------- LOGISTIC EMISSION ---------- */
//             'logistic_emission_calculation',
//             (
//                 SELECT to_jsonb(ml)
//                 FROM bom_emission_logistic_calculation_engine ml
//                 WHERE ml.bom_id = b.id
//                 LIMIT 1
//             ),

//             /* ---------- TOTAL PCF ---------- */
//             'pcf_total_emission_calculation',
//             (
//                 SELECT to_jsonb(pcfe)
//                 FROM bom_emission_calculation_engine pcfe
//                 WHERE pcfe.bom_id = b.id
//                 LIMIT 1
//             ),

//             /* ---------- ALLOCATION METHODOLOGY ---------- */
//             'allocation_methodology',
//             (
//                 SELECT to_jsonb(am)
//                 FROM allocation_methodology am
//                 WHERE am.bom_id = b.id
//                 LIMIT 1
//             )
//         )
//     ) AS bom_details
//     FROM bom b
//     WHERE b.bom_pcf_id = pcf.id AND b.is_bom_calculated = TRUE
// ) bomd ON TRUE

// /* ---------- PCF Stages ---------- */
// LEFT JOIN pcf_request_stages prs ON prs.bom_pcf_id = pcf.id
// LEFT JOIN users_table ucb ON ucb.user_id = prs.pcf_request_created_by
// LEFT JOIN users_table usb ON usb.user_id = prs.pcf_request_submitted_by

// WHERE pcf.is_task_created = TRUE
// AND EXISTS (
//     SELECT 1
//     FROM bom b
//     WHERE b.bom_pcf_id = pcf.id
//       AND b.is_bom_calculated = TRUE
// )
// ORDER BY pcf.created_date DESC
// LIMIT $1 OFFSET $2;
// `,
//                 [limit, offset]
//             );


//             return res.status(200).send(
//                 generateResponse(true, "Success!", 200, {
//                     success: true,
//                     page,
//                     pageSize: limit,
//                     data: result.rows
//                 })
//             );

//         } catch (error: any) {
//             console.error("Error fetching PCF BOM list:", error);
//             return res.status(500).json({
//                 success: false,
//                 message: error.message || "Failed to fetch PCF BOM list"
//             });
//         }
//     });
// }

export async function getComponnetMasterList(req: any, res: any) {
    const {
        pageNumber = 1,
        pageSize = 20,
        fromDate,
        toDate,
        productCategoryCode,
        componentCategoryCode,
        componentTypeCode,
        manufacturerCode,
        productCategoryName,
        componentCategoryName,
        componentTypeName,
        manufacturerName,
        createdBy,
        pcfCode,
        productCode,
        requestTitle,
        search,
        pcf_status
    } = req.query;

    const limit = Number(pageSize);
    const page = Number(pageNumber) > 0 ? Number(pageNumber) : 1;
    const offset = (page - 1) * limit;

    return withClient(async (client: any) => {
        try {
            const whereConditions: string[] = [];
            const values: any[] = [];
            let idx = 1;

            /* ---------- BASE CONDITIONS ---------- */
            whereConditions.push(`pcf.is_task_created = TRUE`);
            whereConditions.push(`
                EXISTS (
                    SELECT 1 FROM bom b
                    WHERE b.bom_pcf_id = pcf.id
                    AND b.is_bom_calculated = TRUE
                )
            `);

            /* ---------- DATE RANGE ---------- */
            if (fromDate && toDate) {
                whereConditions.push(`
        pcf.created_date >= $${idx}
        AND pcf.created_date < ($${idx + 1}::date + INTERVAL '1 day')
    `);
                values.push(fromDate, toDate);
                idx += 2;
            }

            if (pcf_status) {
                whereConditions.push(`pcf.status = $${idx}`);
                values.push(pcf_status);
                idx++;
            }

            /* ---------- EXACT FILTERS ---------- */
            const exactFilters: any[] = [
                { field: 'pc.code', value: productCategoryCode },
                { field: 'pc.name', value: productCategoryName },
                { field: 'cc.code', value: componentCategoryCode },
                { field: 'cc.name', value: componentCategoryName },
                { field: 'ct.code', value: componentTypeCode },
                { field: 'ct.name', value: componentTypeName },
                { field: 'mf.code', value: manufacturerCode },
                { field: 'mf.name', value: manufacturerName },
                { field: 'pcf.code', value: pcfCode },
                { field: 'pcf.product_code', value: productCode },
                { field: 'pcf.request_title', value: requestTitle },
                { field: 'ucb.user_name', value: createdBy }
            ];

            exactFilters.forEach(f => {
                if (f.value) {
                    whereConditions.push(`${f.field} = $${idx++}`);
                    values.push(f.value);
                }
            });

            /* ---------- GLOBAL SEARCH ---------- */
            if (search) {
                whereConditions.push(`
                    (
                        pcf.code ILIKE $${idx}
                        OR pcf.product_code ILIKE $${idx}
                        OR pcf.request_title ILIKE $${idx}
                        OR pc.name ILIKE $${idx}
                        OR pc.code ILIKE $${idx}
                        OR cc.name ILIKE $${idx}
                        OR cc.code ILIKE $${idx}
                        OR ct.name ILIKE $${idx}
                        OR ct.code ILIKE $${idx}
                        OR mf.name ILIKE $${idx}
                        OR mf.code ILIKE $${idx}
                        OR ucb.user_name ILIKE $${idx}
                    )
                `);
                values.push(`%${search}%`);
                idx++;
            }

            const whereClause = whereConditions.length
                ? `WHERE ${whereConditions.join(' AND ')}`
                : '';

            const query = `
SELECT
    pcf.id,
    pcf.code,
    pcf.request_title,
    pcf.priority,
    pcf.request_organization,
    pcf.due_date,
    pcf.request_description,
    pcf.product_code,
    pcf.model_version,
    pcf.status,
    pcf.technical_specification_file,
    pcf.product_images,
    pcf.created_by,
    pcf.updated_by,
    pcf.update_date,
    pcf.created_date,

    jsonb_build_object('id', pc.id, 'code', pc.code, 'name', pc.name) AS product_category,
    jsonb_build_object('id', cc.id, 'code', cc.code, 'name', cc.name) AS component_category,
    jsonb_build_object('id', ct.id, 'code', ct.code, 'name', ct.name) AS component_type,
    jsonb_build_object('id', mf.id, 'code', mf.code, 'name', mf.name) AS manufacturer,
    jsonb_build_object('user_id', ucb.user_id, 'user_name', ucb.user_name) AS createdBy,

    COALESCE(ps.specs, '[]'::jsonb) AS product_specifications,
    COALESCE(bomd.bom_details, '[]'::jsonb) AS bom_details

FROM bom_pcf_request pcf
LEFT JOIN product_category pc ON pc.id = pcf.product_category_id
LEFT JOIN component_category cc ON cc.id = pcf.component_category_id
LEFT JOIN component_type ct ON ct.id = pcf.component_type_id
LEFT JOIN manufacturer mf ON mf.id = pcf.manufacturer_id

LEFT JOIN pcf_request_stages prs ON prs.bom_pcf_id = pcf.id AND prs.client_id IS NULL
LEFT JOIN users_table ucb ON ucb.user_id = prs.pcf_request_created_by

LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ps.id,
            'specification_name', ps.specification_name,
            'specification_value', ps.specification_value,
            'specification_unit', ps.specification_unit
        )
    ) AS specs
    FROM bom_pcf_request_product_specification ps
    WHERE ps.bom_pcf_id = pcf.id
) ps ON TRUE

/* ---------- BOM DETAILS (FULL) ---------- */
LEFT JOIN LATERAL (
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', b.id,
            'code', b.code,
            'material_number', b.material_number,
            'component_name', b.component_name,
            'quantity', b.qunatity,
            'production_location', b.production_location,
            'manufacturer', b.manufacturer,
            'detail_description', b.detail_description,
            'weight_gms', b.weight_gms,
            'total_weight_gms', b.total_weight_gms,
            'component_category', b.component_category,
            'price', b.price,
            'total_price', b.total_price,
            'economic_ratio', b.economic_ratio,
            'supplier_id', b.supplier_id,
            'is_weight_gms', b.is_weight_gms,
            'created_date', b.created_date,

            'material_emission',
            (SELECT jsonb_agg(to_jsonb(mem))
             FROM bom_emission_material_calculation_engine mem
             WHERE mem.bom_id = b.id),

            'production_emission_calculation',
            (SELECT to_jsonb(mep)
             FROM bom_emission_production_calculation_engine mep
             WHERE mep.bom_id = b.id
             LIMIT 1),

            'packaging_emission_calculation',
            (SELECT to_jsonb(mpk)
             FROM bom_emission_packaging_calculation_engine mpk
             WHERE mpk.bom_id = b.id
             LIMIT 1),

            'waste_emission_calculation',
            (SELECT to_jsonb(mw)
             FROM bom_emission_waste_calculation_engine mw
             WHERE mw.bom_id = b.id
             LIMIT 1),

            'logistic_emission_calculation',
            (SELECT to_jsonb(ml)
             FROM bom_emission_logistic_calculation_engine ml
             WHERE ml.bom_id = b.id
             LIMIT 1),

            'pcf_total_emission_calculation',
            (SELECT to_jsonb(pcfe)
             FROM bom_emission_calculation_engine pcfe
             WHERE pcfe.bom_id = b.id
             LIMIT 1),

            'allocation_methodology',
            (SELECT to_jsonb(am)
             FROM allocation_methodology am
             WHERE am.bom_id = b.id
             LIMIT 1)
        )
    ) AS bom_details
    FROM bom b
    WHERE b.bom_pcf_id = pcf.id
      AND b.is_bom_calculated = TRUE
) bomd ON TRUE

${whereClause}
ORDER BY pcf.created_date DESC
LIMIT $${idx++} OFFSET $${idx++};
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
            console.error("Error fetching PCF BOM list:", error);
            return res.status(500).json({
                success: false,
                message: error.message || "Failed to fetch PCF BOM list"
            });
        }
    });
}
