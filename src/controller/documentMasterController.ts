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


            return res.status(200).json({
                message: "Document list fetched successfully",
                currentPage: Number(pageNumber),
                totalRecords: total.rows[0].total,
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


