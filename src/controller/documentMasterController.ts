import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';

export async function addDocument(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const {
                document_type,
                category,
                product_code,
                version,
                document_title,
                description,
                tags,         // array of strings
                access_level,
                document,      // array of docs (paths or ids)
                file_size
            } = req.body;

            const id = ulid();
            const created_by = req.user_id;

            // === Generate new code ===
            const lastCodeRes = await client.query(
                `SELECT code FROM document_master 
         WHERE code LIKE 'DOC%' 
         ORDER BY created_date DESC 
         LIMIT 1;`
            );

            let newCode = "DOC00001";
            if (lastCodeRes.rows.length > 0) {
                const lastCode = lastCodeRes.rows[0].code; // e.g. "DOC00012"
                const numPart = parseInt(lastCode.replace("DOC", ""), 10);
                const nextNum = numPart + 1;
                newCode = "DOC" + String(nextNum).padStart(5, "0");
            }

            const insertQuery = `
        INSERT INTO document_master (
          id, code, document_type, category, product_code, version,
          document_title, description, tags, access_level, document,created_by,file_size
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
        RETURNING *;
      `;

            const result = await client.query(insertQuery, [
                id,
                newCode,
                document_type,
                category,
                product_code,
                version,
                document_title,
                description,
                tags || null,
                access_level,
                document || null,
                created_by,
                file_size || null
            ]);

            await client.query("COMMIT");
            return res.send(generateResponse(true, "Document added successfully", 200, result.rows[0]));
        } catch (error: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateDocument(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const {
                id,
                document_type,
                category,
                product_code,
                version,
                document_title,
                description,
                tags,
                access_level,
                document,
                file_size
            } = req.body;

            const updated_by = req.user_id;

            const updateQuery = `
        UPDATE document_master
        SET document_type = $1,
            category = $2,
            product_code = $3,
            version = $4,
            document_title = $5,
            description = $6,
            tags = $7,
            access_level = $8,
            document = $9,
            updated_by = $11,
            file_size = $12,
            update_date = NOW()
        WHERE id = $10
        RETURNING *;
      `;

            const result = await client.query(updateQuery, [
                document_type,
                category,
                product_code,
                version,
                document_title,
                description,
                tags || null,
                access_level,
                document || null,
                id,
                updated_by,
                file_size || null
            ]);

            if (result.rows.length === 0) {
                await client.query("ROLLBACK");
                return res
                    .status(404)
                    .send(generateResponse(false, "Document not found", 404, null));
            }

            await client.query("COMMIT");
            return res.send(generateResponse(true, "Document updated successfully", 200, result.rows[0]));
        } catch (error: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function deleteDocument(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const { id } = req.body;

            const result = await client.query(
                `DELETE FROM document_master WHERE id = $1 RETURNING *;`,
                [id]
            );

            if (result.rows.length === 0) {
                await client.query("ROLLBACK");
                return res
                    .status(404)
                    .send(generateResponse(false, "Document not found", 404, null));
            }

            await client.query("COMMIT");
            return res.send(generateResponse(true, "Document deleted successfully", 200, result.rows[0]));
        } catch (error: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getDocumentById(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.query;

            // 1️⃣ Fetch the document
            const docResult = await client.query(
                `SELECT * FROM document_master WHERE id = $1`,
                [id]
            );

            if (docResult.rows.length === 0) {
                return res
                    .status(404)
                    .send(generateResponse(false, "Document not found", 404, null));
            }

            const document = docResult.rows[0];

            // 2️⃣ Fetch category details
            let categoryDetails = null;
            if (document.category) {
                const catResult = await client.query(
                    `SELECT id, code, name FROM category WHERE id = $1`,
                    [document.category]
                );
                categoryDetails = catResult.rows[0] || null;
            }

            let createdBy = null;
            if (document.created_by) {
                const catResult = await client.query(
                    `SELECT user_id, user_name FROM users_table WHERE user_id = $1`,
                    [document.created_by]
                );
                createdBy = catResult.rows[0] || null;
            }

            let updatedBy = null;
            if (document.updated_by) {
                const catResult = await client.query(
                    `SELECT user_id, user_name FROM users_table WHERE user_id = $1`,
                    [document.updated_by]
                );
                updatedBy = catResult.rows[0] || null;
            }

            // 3️⃣ Fetch tag details (tags is an array)
            let tagDetails: any[] = [];
            if (document.tags && document.tags.length > 0) {
                const tagResult = await client.query(
                    `SELECT id, code, name FROM tag WHERE id = ANY($1::varchar[])`,
                    [document.tags]
                );
                tagDetails = tagResult.rows;
            }

            // 4️⃣ Combine response
            const response = {
                ...document,
                categoryDetails,
                tagDetails,
                createdBy,
                updatedBy
            };

            return res.send(generateResponse(true, "Document fetched successfully", 200, response));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// export async function listDocumentMaster(req: any, res: any) {
//     return withClient(async (client: any) => {
//         try {
//             const {
//                 pageNumber = 1,
//                 pageSize = 10,
//                 search = "",
//                 status,
//                 category,
//                 sortBy = "created_date",
//                 sortOrder = "DESC"
//             } = req.query;

//             const offset = (pageNumber - 1) * pageSize;
//             const limit = Number(pageSize);

//             const values: any[] = [];
//             let where = `WHERE 1=1`;

//             if (search) {
//                 values.push(`%${search}%`);
//                 where += ` AND (
//                     dm.document_title ILIKE $${values.length} OR
//                     dm.code ILIKE $${values.length} OR
//                     dm.document_type ILIKE $${values.length}
//                 )`;
//             }

//             if (status) {
//                 values.push(status);
//                 where += ` AND dm.status = $${values.length}`;
//             }

//             if (category) {
//                 values.push(category);
//                 where += ` AND dm.category = $${values.length}`;
//             }

//             // Main paginated list
//             const query = `
//                 SELECT 
//                     dm.*,
//                     (
//                         SELECT json_build_object(
//                             'code', c.code,
//                             'name', c.name
//                         )
//                         FROM category c
//                         WHERE c.code = dm.category
//                     ) AS category_details,
//                     (
//                         SELECT jsonb_agg(
//                             json_build_object(
//                                 'id', t.id,
//                                 'code', t.code,
//                                 'name', t.name
//                             )
//                         )
//                         FROM tag t
//                         WHERE t.id = ANY(dm.tags)
//                     ) AS tag_details
//                 FROM document_master dm
//                 ${where}
//                 ORDER BY dm.${sortBy} ${sortOrder}
//                 LIMIT ${limit} OFFSET ${offset};
//             `;

//             const result = await client.query(query, values);

//             // Count total
//             const countQuery = `SELECT COUNT(*) AS total FROM document_master dm ${where}`;
//             const total = await client.query(countQuery, values);

//             // Recent Activity (always fetch 5 recent documents)
//             const recentQuery = `
//                 SELECT 
//                     dm.id,
//                     dm.document_title,
//                     dm.code,
//                     dm.status,
//                     dm.created_by,
//                     dm.created_date
//                 FROM document_master dm
//                 ORDER BY dm.created_date DESC
//                 LIMIT 10;
//             `;
//             const recentActivity = await client.query(recentQuery);

//             return res.status(200).json({
//                 message: "Document list fetched successfully",
//                 currentPage: pageNumber,
//                 totalRecords: total.rows[0].total,
//                 totalPages: Math.ceil(total.rows[0].total / limit),
//                 recentActivity: recentActivity.rows,
//                 data: result.rows
//             });

//         } catch (error) {
//             console.error(error);
//             return res.status(500).json({ message: "Something went wrong", error });
//         }
//     });
// }

export async function listDocumentMaster(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const {
                pageNumber = 1,
                pageSize = 10,
                search = "",
                status,
                category,
                sortBy = "created_date",
                sortOrder = "DESC",
                document_type
            } = req.query;

            const offset = (pageNumber - 1) * pageSize;
            const limit = Number(pageSize);

            const values: any[] = [];
            let where = `WHERE 1=1`;

            if (search) {
                values.push(`%${search}%`);
                where += ` AND (
                    dm.document_title ILIKE $${values.length} OR
                    dm.code ILIKE $${values.length} OR
                    dm.document_type ILIKE $${values.length} OR
                    dm.product_code ILIKE $${values.length}
                )`;
            }

            if (status) {
                values.push(status);
                where += ` AND dm.status = $${values.length}`;
            }

            if (document_type) {
                values.push(document_type);
                where += ` AND dm.document_type = $${values.length}`;
            }

            if (category) {
                values.push(category);
                where += ` AND dm.category = $${values.length}`;
            }

            // Main Query
            const query = `
                SELECT 
                    dm.*,
                    (
                        SELECT json_build_object('code', c.code,'name', c.name)
                        FROM category c
                        WHERE c.code = dm.category
                    ) AS category_details,
                    (
                        SELECT jsonb_agg(json_build_object('id', t.id,'code', t.code,'name', t.name))
                        FROM tag t
                        WHERE t.id = ANY(dm.tags)
                    ) AS tag_details
                FROM document_master dm
                ${where}
                ORDER BY dm.${sortBy} ${sortOrder}
                LIMIT ${limit} OFFSET ${offset};
            `;
            const result = await client.query(query, values);

            const countQuery = `SELECT COUNT(*)::int AS total FROM document_master dm ${where}`;
            const total = await client.query(countQuery, values);

            // Recent 10 Activity
            const recentQuery = `
                SELECT dmm.*
                FROM document_master dmm
                ORDER BY created_date DESC
                LIMIT 10;
            `;
            const recentActivity = await client.query(recentQuery);

            // ---------------------- STATS SECTION ----------------------

            // Total count
            const totalDocuments = await client.query(`
                SELECT COUNT(*) AS count FROM document_master
            `);

            // Pending count
            const pendingDocuments = await client.query(`
                SELECT COUNT(*) AS count FROM document_master WHERE status = 'Pending'
            `);

            // PCF count (case insensitive match)
            const pcfDocuments = await client.query(`
                SELECT COUNT(*) AS count 
                FROM document_master 
                WHERE LOWER(document_type) LIKE '%pcf%'
            `);

            // ---- TIME BASED COUNTS ----
            const stats = async (currentQuery: string, previousQuery: string) => {
                const current = Number((await client.query(currentQuery)).rows[0].count);
                const previous = Number((await client.query(previousQuery)).rows[0].count);

                let progress = 0;

                if (previous === 0 && current > 0) {
                    progress = 100;
                } else if (previous > 0) {
                    progress = Math.min((current / previous) * 100, 100);
                }

                return {
                    current,
                    previous,
                    progress: Number(progress.toFixed(2))
                };
            };


            // Daily
            const daily = await stats(
                `SELECT COUNT(*) FROM document_master WHERE DATE(created_date) = CURRENT_DATE`,
                `SELECT COUNT(*) FROM document_master WHERE DATE(created_date) = CURRENT_DATE - INTERVAL '1 day'`
            );

            // Weekly
            const weekly = await stats(
                `SELECT COUNT(*) FROM document_master WHERE created_date >= date_trunc('week', CURRENT_DATE)`,
                `SELECT COUNT(*) FROM document_master WHERE created_date >= date_trunc('week', CURRENT_DATE - INTERVAL '1 week')
                 AND created_date < date_trunc('week', CURRENT_DATE)`
            );

            // Monthly
            const monthly = await stats(
                `SELECT COUNT(*) FROM document_master WHERE created_date >= date_trunc('month', CURRENT_DATE)`,
                `SELECT COUNT(*) FROM document_master WHERE created_date >= date_trunc('month', CURRENT_DATE - INTERVAL '1 month')
                 AND created_date < date_trunc('month', CURRENT_DATE)`
            );

            // Yearly
            const yearly = await stats(
                `SELECT COUNT(*) FROM document_master WHERE created_date >= date_trunc('year', CURRENT_DATE)`,
                `SELECT COUNT(*) FROM document_master WHERE created_date >= date_trunc('year', CURRENT_DATE - INTERVAL '1 year')
                 AND created_date < date_trunc('year', CURRENT_DATE)`
            );

            // const rows = result.rows;
            // const totalCount = rows.length > 0 ? rows.length : 0;




            return res.status(200).json({
                message: "Document list fetched successfully",
                currentPage: Number(pageNumber),
                totalRecords: total.rows[0].total,
                totalCount: total.rows[0].total,
                totalPages: Math.ceil(total.rows[0].total / limit),
                recentActivity: recentActivity.rows,
                stats: {
                    totalDocuments: Number(totalDocuments.rows[0].count),
                    pendingDocuments: Number(pendingDocuments.rows[0].count),
                    pcfDocuments: Number(pcfDocuments.rows[0].count),
                    daily,
                    weekly,
                    monthly,
                    yearly
                },
                data: result.rows
            });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: "Something went wrong", error });
        }
    });
}


// In this below api based on PCF Bom Based Documenst are there
export async function getDocumentMasterList(req: any, res: any) {
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

    COALESCE(ps.specs, '[]'::jsonb) AS product_specifications

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

${whereClause}
ORDER BY pcf.created_date DESC
LIMIT $${idx++} OFFSET $${idx++};
`;

            values.push(limit, offset);

            const result = await client.query(query, values);

            // const rows = result.rows;
            // const totalCount = rows.length > 0 ? rows.length : 0;

            const countQuery = `
                SELECT COUNT(*) AS total
                FROM bom_pcf_request t;
            `;

            const countResult = await client.query(
                countQuery,
                values.slice(0, values.length - 2)
            );

            const total = Number(countResult.rows[0].total);


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
                    }
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

export async function updatePcfDocuments(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query("BEGIN");
        try {
            const {
                id, technical_specification_file, product_images
            } = req.body;

            const updated_by = req.user_id;

            if (!id) {
                return res.send(
                    generateResponse(false, "id is required", 400, null)
                );
            }

            const updatePCFQuery = `
                UPDATE bom_pcf_request
                SET
                    technical_specification_file = $1,
                    product_images = $2,
                    updated_by = $3,
                    update_date = CURRENT_TIMESTAMP
                WHERE id = $4
                RETURNING *;
            `;

            const result = await client.query(updatePCFQuery, [
                technical_specification_file,
                product_images,
                updated_by,
                id
            ]);

            await client.query("COMMIT");

            return res.send(
                generateResponse(true, "PCF documents updated successfully", 200, result.rows)
            );

        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error("❌ Error updating PCF documents:", error);
            return res.send(
                generateResponse(false, error.message || "Update failed", 500, null)
            );
        }
    });
}
