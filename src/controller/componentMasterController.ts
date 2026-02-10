import { withClient } from '../util/database';
import { generateResponse } from '../util/genRes';

// Below Code also working PCF Level not bom level

// export async function getComponnetMasterList(req: any, res: any) {
//     const {
//         pageNumber = 1,
//         pageSize = 20,
//         fromDate,
//         toDate,
//         productCategoryCode,
//         componentCategoryCode,
//         componentTypeCode,
//         manufacturerCode,
//         productCategoryName,
//         componentCategoryName,
//         componentTypeName,
//         manufacturerName,
//         createdBy,
//         pcfCode,
//         productCode,
//         requestTitle,
//         search,
//         pcf_status,
//         product_code
//     } = req.query;

//     const page = pageNumber;
//     const limit = pageSize;
//     const offset = (Number(page) - 1) * Number(limit);

//     return withClient(async (client: any) => {
//         try {
//             const whereConditions: string[] = [];
//             const values: any[] = [];
//             let idx = 1;

//             /* ---------- BASE CONDITIONS ---------- */
//             // need calrification is_bom_calculated only need to show calculated one or not
//             whereConditions.push(`pcf.is_task_created = TRUE`);
//             if (req.user_id) {
//                 whereConditions.push(`pcf.created_by = $${idx}`);
//                 values.push(req.user_id);
//                 idx++;
//             }
//             // whereConditions.push(`
//             //     EXISTS (
//             //         SELECT 1 FROM bom b
//             //         WHERE b.bom_pcf_id = pcf.id
//             //         /* ---------- AND b.is_bom_calculated = TRUE ---------- */
//             //     )
//             // `);

//             /* ---------- DATE RANGE ---------- */
//             if (fromDate && toDate) {
//                 whereConditions.push(`
//         pcf.created_date >= $${idx}
//         AND pcf.created_date < ($${idx + 1}::date + INTERVAL '1 day')
//     `);
//                 values.push(fromDate, toDate);
//                 idx += 2;
//             }

//             if (product_code) {
//                 whereConditions.push(`pcf.product_code = $${idx}`);
//                 values.push(product_code);
//                 idx++;
//             }

//             if (pcf_status) {
//                 whereConditions.push(`pcf.status = $${idx}`);
//                 values.push(pcf_status);
//                 idx++;
//             }

//             /* ---------- EXACT FILTERS ---------- */
//             const exactFilters: any[] = [
//                 { field: 'pc.code', value: productCategoryCode },
//                 { field: 'pc.name', value: productCategoryName },
//                 { field: 'cc.code', value: componentCategoryCode },
//                 { field: 'cc.name', value: componentCategoryName },
//                 { field: 'ct.code', value: componentTypeCode },
//                 { field: 'ct.name', value: componentTypeName },
//                 { field: 'mf.code', value: manufacturerCode },
//                 { field: 'mf.name', value: manufacturerName },
//                 { field: 'pcf.code', value: pcfCode },
//                 { field: 'pcf.product_code', value: productCode },
//                 { field: 'pcf.request_title', value: requestTitle },
//                 { field: 'ucb.user_name', value: createdBy }
//             ];

//             exactFilters.forEach(f => {
//                 if (f.value) {
//                     whereConditions.push(`${f.field} = $${idx++}`);
//                     values.push(f.value);
//                 }
//             });

//             /* ---------- GLOBAL SEARCH ---------- */
//             if (search) {
//                 whereConditions.push(`
//                     (
//                         pcf.code ILIKE $${idx}
//                         OR pcf.product_code ILIKE $${idx}
//                         OR pcf.request_title ILIKE $${idx}
//                         OR pc.name ILIKE $${idx}
//                         OR pc.code ILIKE $${idx}
//                         OR cc.name ILIKE $${idx}
//                         OR cc.code ILIKE $${idx}
//                         OR ct.name ILIKE $${idx}
//                         OR ct.code ILIKE $${idx}
//                         OR mf.name ILIKE $${idx}
//                         OR mf.code ILIKE $${idx}
//                         OR ucb.user_name ILIKE $${idx}
//                     )
//                 `);
//                 values.push(`%${search}%`);
//                 idx++;
//             }

//             const whereClause = whereConditions.length
//                 ? `WHERE ${whereConditions.join(' AND ')}`
//                 : '';

//             // below query is working pcf after bom level
//             const query = `
//             SELECT
//                 pcf.id,
//                 pcf.code,
//                 pcf.request_title,
//                 pcf.priority,
//                 pcf.request_organization,
//                 pcf.due_date,
//                 pcf.request_description,
//                 pcf.product_code,
//                 pcf.model_version,
//                 pcf.status,
//                 pcf.technical_specification_file,
//                 pcf.product_images,
//                 pcf.created_by,
//                 pcf.updated_by,
//                 pcf.update_date,
//                 pcf.created_date,

//                 jsonb_build_object('id', pc.id, 'code', pc.code, 'name', pc.name) AS product_category,
//                 jsonb_build_object('id', cc.id, 'code', cc.code, 'name', cc.name) AS component_category,
//                 jsonb_build_object('id', ct.id, 'code', ct.code, 'name', ct.name) AS component_type,
//                 jsonb_build_object('id', mf.id, 'code', mf.code, 'name', mf.name) AS manufacturer,
//                 jsonb_build_object('user_id', ucb.user_id, 'user_name', ucb.user_name) AS createdBy,

//                 COALESCE(ps.specs, '[]'::jsonb) AS product_specifications,
//                 COALESCE(bomd.bom_details, '[]'::jsonb) AS bom_details

//             FROM bom_pcf_request pcf
//             LEFT JOIN product_category pc ON pc.id = pcf.product_category_id
//             LEFT JOIN component_category cc ON cc.id = pcf.component_category_id
//             LEFT JOIN component_type ct ON ct.id = pcf.component_type_id
//             LEFT JOIN manufacturer mf ON mf.id = pcf.manufacturer_id

//             LEFT JOIN pcf_request_stages prs ON prs.bom_pcf_id = pcf.id
//             LEFT JOIN users_table ucb ON ucb.user_id = prs.pcf_request_created_by

//             LEFT JOIN LATERAL (
//                 SELECT jsonb_agg(
//                     jsonb_build_object(
//                         'id', ps.id,
//                         'specification_name', ps.specification_name,
//                         'specification_value', ps.specification_value,
//                         'specification_unit', ps.specification_unit
//                     )
//                 ) AS specs
//                 FROM bom_pcf_request_product_specification ps
//                 WHERE ps.bom_pcf_id = pcf.id
//             ) ps ON TRUE

//             /* ---------- BOM DETAILS (FULL) ---------- */
//             LEFT JOIN LATERAL (
//                 SELECT jsonb_agg(
//                     jsonb_build_object(
//                         'id', b.id,
//                         'code', b.code,
//                         'material_number', b.material_number,
//                         'component_name', b.component_name,
//                         'quantity', b.qunatity,
//                         'production_location', b.production_location,
//                         'manufacturer', b.manufacturer,
//                         'detail_description', b.detail_description,
//                         'weight_gms', b.weight_gms,
//                         'total_weight_gms', b.total_weight_gms,
//                         'component_category', b.component_category,
//                         'price', b.price,
//                         'total_price', b.total_price,
//                         'economic_ratio', b.economic_ratio,
//                         'supplier_id', b.supplier_id,
//                         'is_weight_gms', b.is_weight_gms,
//                         'created_date', b.created_date,

//                         'material_emission',
//                         (SELECT jsonb_agg(to_jsonb(mem))
//                          FROM bom_emission_material_calculation_engine mem
//                          WHERE mem.bom_id = b.id),

//                         'production_emission_calculation',
//                         (SELECT to_jsonb(mep)
//                          FROM bom_emission_production_calculation_engine mep
//                          WHERE mep.bom_id = b.id
//                          LIMIT 1),

//                         'packaging_emission_calculation',
//                         (SELECT to_jsonb(mpk)
//                          FROM bom_emission_packaging_calculation_engine mpk
//                          WHERE mpk.bom_id = b.id
//                          LIMIT 1),

//                         'waste_emission_calculation',
//                         (SELECT to_jsonb(mw)
//                          FROM bom_emission_waste_calculation_engine mw
//                          WHERE mw.bom_id = b.id
//                          LIMIT 1),

//                         'logistic_emission_calculation',
//                         (SELECT to_jsonb(ml)
//                          FROM bom_emission_logistic_calculation_engine ml
//                          WHERE ml.bom_id = b.id
//                          LIMIT 1),

//                         'pcf_total_emission_calculation',
//                         (SELECT to_jsonb(pcfe)
//                          FROM bom_emission_calculation_engine pcfe
//                          WHERE pcfe.bom_id = b.id
//                          LIMIT 1),

//                         'allocation_methodology',
//                         (SELECT to_jsonb(am)
//                          FROM allocation_methodology am
//                          WHERE am.bom_id = b.id
//                          LIMIT 1)
//                     )
//                 ) AS bom_details
//                 FROM bom b
//                 WHERE b.bom_pcf_id = pcf.id
//                 /* ---------- AND b.is_bom_calculated = TRUE ---------- */
//             ) bomd ON TRUE

//             ${whereClause}
//             ORDER BY pcf.created_date DESC
//             LIMIT $${idx++} OFFSET $${idx++};
//             `;

//             // need calrification is_bom_calculated above only need to show calculated one or not

//             values.push(limit, offset);

//             const result = await client.query(query, values);


//             const statsQuery = `
// SELECT
//     COUNT(*) AS total_pcf_count,

//     COUNT(*) FILTER (
//         WHERE pcf.status = 'Approved'
//         OR pcf.status ='Submitted'
//     ) AS approved_count,

//     COUNT(*) FILTER (
//         WHERE pcf.status = 'In Progress'
//     ) AS in_progress_count,

//     COUNT(*) FILTER (
//         WHERE pcf.status = 'Rejected'
//     ) AS rejected_count,

//     COUNT(*) FILTER (
//         WHERE pcf.is_draft = TRUE
//     ) AS draft_count,

//     COUNT(*) FILTER (
//         WHERE 
//             pcf.status = 'Open'
//             OR pcf.status IS NULL
//     ) AS pending_count

// FROM bom_pcf_request pcf
// LEFT JOIN product_category pc ON pc.id = pcf.product_category_id
// LEFT JOIN component_category cc ON cc.id = pcf.component_category_id
// LEFT JOIN component_type ct ON ct.id = pcf.component_type_id
// LEFT JOIN manufacturer mf ON mf.id = pcf.manufacturer_id
// LEFT JOIN pcf_request_stages prs ON prs.bom_pcf_id = pcf.id
// LEFT JOIN users_table ucb ON ucb.user_id = prs.pcf_request_created_by
// WHERE pcf.is_task_created = TRUE AND pcf.created_by =$1; 
// `;


//             const statsResult = await client.query(statsQuery, [req.user_id]);

//             const stats = statsResult.rows[0];

//             const countQuery = `
//                 SELECT COUNT(*) AS total
//                 FROM bom_pcf_request t
//                 WHERE t.is_task_created = TRUE AND t.created_by =$1;
//             `;

//             const countResult = await client.query(
//                 countQuery,
//                 [req.user_id]
//             );

//             const total = Number(countResult.rows[0].total);


//             return res.status(200).send(
//                 generateResponse(true, "Success!", 200, {
//                     // page,
//                     // pageSize: limit,
//                     // totalCount,
//                     data: result.rows,
//                     pagination: {
//                         total,
//                         page: Number(page),
//                         limit: Number(limit),
//                         totalPages: Math.ceil(total / Number(limit))
//                     },
//                     stats: stats
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
        pcf_status,
        product_code,
        bom_code
    } = req.query;

    const page = Number(pageNumber);
    const limit = Number(pageSize);
    const offset = (page - 1) * limit;

    return withClient(async (client: any) => {
        try {
            const whereConditions: string[] = [];
            const values: any[] = [];
            let idx = 1;

            /* ---------- BASE CONDITIONS ---------- */
            // if (req.user_id) {
            //     whereConditions.push(`pcf.created_by = $${idx}`);
            //     values.push(req.user_id);
            //     idx++;

            // }
            if (req.user_id) {
                // First, check the user's role
                const userRoleQuery = `
        SELECT user_role 
        FROM users_table 
        WHERE user_id = $1
    `;

                const userRoleResult = await client.query(userRoleQuery, [req.user_id]);

                if (userRoleResult.rows.length > 0) {
                    const userRole = userRoleResult.rows[0].user_role;

                    // Only apply created_by filter if user is NOT a super admin
                    const isSuperAdmin = userRole && (
                        userRole.toLowerCase() === 'superadmin' ||
                        userRole.toLowerCase() === 'super admin'
                    );

                    if (!isSuperAdmin) {
                        whereConditions.push(`pcf.created_by = $${idx}`);
                        values.push(req.user_id);
                        idx++;
                    }
                    // If super admin, no filter is applied - they see all data
                }
            }

            // whereConditions.push(`
            //     EXISTS (
            //         SELECT 1 FROM bom b
            //         WHERE b.bom_pcf_id = pcf.id
            //         /* ---------- AND b.is_bom_calculated = TRUE ---------- */
            //     )
            // `);

            /* ---------- DATE RANGE ---------- */
            if (fromDate && toDate) {
                whereConditions.push(`
        pcf.created_date >= $${idx}
        AND pcf.created_date < ($${idx + 1}::date + INTERVAL '1 day')
    `);
                values.push(fromDate, toDate);
                idx += 2;
            }

            if (bom_code) {
                whereConditions.push(`b.code = $${idx}`);
                values.push(bom_code);
                idx++;
            }

            if (product_code) {
                whereConditions.push(`pcf.product_code = $${idx}`);
                values.push(product_code);
                idx++;
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
                        b.code ILIKE $${idx}
                        OR pcf.code ILIKE $${idx}
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

            const whereClause =
                whereConditions.length > 0
                    ? `WHERE ${whereConditions.join(' AND ')}`
                    : '';

            const query = `SELECT
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

    /* ---------- PCF REQUEST ---------- */
    jsonb_build_object(
        'id', pcf.id,
        'code', pcf.code,
        'request_title', pcf.request_title,
        'priority', pcf.priority,
        'due_date', pcf.due_date,
        'request_description', pcf.request_description,
        'product_code', pcf.product_code,
        'model_version', pcf.model_version,
        'status', pcf.status,
        'technical_specification_file', pcf.technical_specification_file,
        'product_images',  pcf.product_images,
        'created_by',   pcf.created_by,
        'created_by',    pcf.created_by,
        'created_date', pcf.created_date,
        'update_date',    pcf.update_date,

            /* ---------- Product Details ---------- */
    jsonb_build_object(
        'id', pd.id,
        'product_name', pd.product_name
    ) AS product_details,

        'product_category', jsonb_build_object(
            'id', pc.id, 'code', pc.code, 'name', pc.name
        ),

        'component_category', jsonb_build_object(
            'id', cc.id, 'code', cc.code, 'name', cc.name
        ),

        'component_type', jsonb_build_object(
            'id', ct.id, 'code', ct.code, 'name', ct.name
        ),

        'manufacturer', jsonb_build_object(
            'id', mf.id, 'code', mf.code, 'name', mf.name
        ),

        'createdBy', jsonb_build_object(
            'user_id', ucb.user_id,
            'user_name', ucb.user_name
        )
        
    ) AS pcf_request,

    /* ---------- PRODUCT SPECS ---------- */
    COALESCE(ps.specs, '[]'::jsonb) AS product_specifications,

    /* ---------- EMISSIONS ---------- */
    (SELECT jsonb_agg(to_jsonb(mem))
     FROM bom_emission_material_calculation_engine mem
     WHERE mem.bom_id = b.id) AS material_emission,

    (SELECT to_jsonb(mep)
     FROM bom_emission_production_calculation_engine mep
     WHERE mep.bom_id = b.id
     LIMIT 1) AS production_emission_calculation,

    (SELECT to_jsonb(mpk)
     FROM bom_emission_packaging_calculation_engine mpk
     WHERE mpk.bom_id = b.id
     LIMIT 1) AS packaging_emission_calculation,

    (SELECT to_jsonb(mw)
     FROM bom_emission_waste_calculation_engine mw
     WHERE mw.bom_id = b.id
     LIMIT 1) AS waste_emission_calculation,

    (SELECT to_jsonb(ml)
     FROM bom_emission_logistic_calculation_engine ml
     WHERE ml.bom_id = b.id
     LIMIT 1) AS logistic_emission_calculation,

    (SELECT to_jsonb(pcfe)
     FROM bom_emission_calculation_engine pcfe
     WHERE pcfe.bom_id = b.id
     LIMIT 1) AS pcf_total_emission_calculation,

    (SELECT to_jsonb(am)
     FROM allocation_methodology am
     WHERE am.bom_id = b.id
     LIMIT 1) AS allocation_methodology

FROM bom b
JOIN bom_pcf_request pcf ON pcf.id = b.bom_pcf_id AND pcf.is_task_created = TRUE

LEFT JOIN product pd ON pd.product_code = pcf.product_code
LEFT JOIN product_category pc ON pc.id = pcf.product_category_id
LEFT JOIN component_category cc ON cc.id = pcf.component_category_id
LEFT JOIN component_type ct ON ct.id = pcf.component_type_id
LEFT JOIN manufacturer mf ON mf.id = pcf.manufacturer_id

/* ---------- CREATED BY (SAFE) ---------- */
LEFT JOIN LATERAL (
    SELECT u.user_id, u.user_name
    FROM pcf_request_stages prs
    JOIN users_table u ON u.user_id = prs.pcf_request_created_by
    WHERE prs.bom_pcf_id = pcf.id
    ORDER BY prs.created_date DESC
    LIMIT 1
) ucb ON TRUE

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

${whereClause}
ORDER BY b.created_date DESC
LIMIT $${idx} OFFSET $${idx + 1};
;
`;
            // need calrification is_bom_calculated above only need to show calculated one or not

            values.push(limit, offset);

            const result = await client.query(query, values);

            /* =====================================================
               COUNT QUERY (BOM BASED)
            ===================================================== */
            const countQuery = `
SELECT COUNT(*) AS total
FROM bom b
JOIN bom_pcf_request pcf ON pcf.id = b.bom_pcf_id AND pcf.created_by =$1
LEFT JOIN product_category pc ON pc.id = pcf.product_category_id
LEFT JOIN component_category cc ON cc.id = pcf.component_category_id
LEFT JOIN component_type ct ON ct.id = pcf.component_type_id
LEFT JOIN manufacturer mf ON mf.id = pcf.manufacturer_id
LEFT JOIN pcf_request_stages prs ON prs.bom_pcf_id = pcf.id
LEFT JOIN users_table ucb ON ucb.user_id = prs.pcf_request_created_by;
`;

            const countResult = await client.query(countQuery, [req.user_id]);

            const total = Number(countResult.rows[0].total);

            /* =====================================================
               STATS QUERY
            ===================================================== */
            const statsQuery = `
SELECT
    COUNT(*) FILTER (WHERE pcf.status IN ('Completed')) AS completed_count,
    COUNT(*) FILTER (WHERE pcf.status IN ('Approved')) AS approved_count,
    COUNT(*) FILTER (WHERE pcf.status = 'In Progress') AS in_progress_count,
    COUNT(*) FILTER (WHERE pcf.status = 'Rejected') AS rejected_count,
    COUNT(*) FILTER (WHERE pcf.is_draft = TRUE) AS draft_count,
    COUNT(*) FILTER (WHERE pcf.status IS NULL OR pcf.status = 'Open') AS pending_count
FROM bom b
JOIN bom_pcf_request pcf ON pcf.id = b.bom_pcf_id AND pcf.created_by =$1
LEFT JOIN pcf_request_stages prs ON prs.bom_pcf_id = pcf.id
LEFT JOIN users_table ucb ON ucb.user_id = prs.pcf_request_created_by;
`;

            const statsResult = await client.query(statsQuery, [req.user_id]);

            const stats = statsResult.rows[0];

            return res.status(200).send(
                generateResponse(true, "Success!", 200, {
                    // page,
                    // pageSize: limit,
                    // totalCount,
                    data: result.rows,
                    pagination: {
                        total,
                        page: Number(page),
                        limit: Number(limit),
                        totalPages: Math.ceil(total / Number(limit))
                    },
                    stats: stats
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