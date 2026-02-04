
import { generateResponse } from '../util/genRes';
import { updateTaskService } from "../services/taskManagementService";
import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { sendSupplierTaskEmail } from "../services/taskEmail.service";
import pLimit from "p-limit";

// need to confirm below update api needed or not
export async function updateTask(req: any, res: any) {
    try {
        const data = req.body;

        if (!data.id) {
            return res
                .status(400)
                .json(generateResponse(false, "Task ID is required", 400, null));
        }

        //Ensure at least one field to update is provided
        const allowedFields = [
            "id",
            "task_title",
            "category_id",
            "priority",
            "assign_to",
            "due_date",
            "description",
            "related_product",
            "estimated_hour",
            "tags",
            "attachments",
            "bom_id"
        ];

        const fieldsToUpdate = Object.keys(data).filter(field => allowedFields.includes(field));

        if (fieldsToUpdate.length === 0) {
            return res
                .status(400)
                .json(generateResponse(false, "No valid fields provided to update", 400, null));
        }

        data.update_date = new Date();
        data.updated_by = req.user_id;

        const updatedTask = await updateTaskService(data.id, data);

        return res
            .status(200)
            .json(generateResponse(true, "Task updated successfully", 200, updatedTask));

    } catch (error: any) {
        console.error("Error in updateTask:", error.message);
        return res
            .status(500)
            .json(generateResponse(false, "Something went wrong", 500, error.message));
    }
}

// =============== NEW API ===================
export async function getPCFListDropDown(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.code,
                    p.request_title,
                    p.priority,
                    p.request_organization,
                    p.is_client,
                    p.client_id
                FROM bom_pcf_request p
                WHERE p.is_task_created = FALSE
                ORDER BY p.created_date DESC;
            `;

            const result = await client.query(query);

            if (result.rows.length === 0) {
                return res
                    .status(200)
                    .json(generateResponse(true, "No PCF records with BOM found", 200, []));
            }

            return res.status(200).json(
                generateResponse(true, "Fetched successfully", 200, result.rows)
            );
        } catch (error: any) {
            console.error("❌ Error in getPCFListDropDown:", error);
            return res.status(500).json(
                generateResponse(false, "Something went wrong", 500, error.message)
            );
        }
    });
}

export async function getPCFBOMSupplierListDropDown(req: any, res: any) {
    const { bom_pcf_id } = req.query;

    return withClient(async (client: any) => {
        try {
            const query = `
                  SELECT DISTINCT ON (b.supplier_id)
                    b.code AS bom_code,
                    b.bom_pcf_id,
                    b.supplier_id,
                    s.code AS supplier_code,
                    s.supplier_name,
                    s.supplier_email
                FROM bom b
                JOIN supplier_details s 
                    ON s.sup_id = b.supplier_id
                WHERE b.bom_pcf_id = $1
                ORDER BY b.supplier_id, b.created_date DESC;
            `;

            const result = await client.query(query, [bom_pcf_id]);

            if (result.rows.length === 0) {
                return res
                    .status(200)
                    .json(generateResponse(true, "No supplier records found in BOM", 200, []));
            }

            return res.status(200).json(
                generateResponse(true, "Fetched successfully", 200, result.rows)
            );
        } catch (error: any) {
            console.error("❌ Error in getPCFBOMSupplierListDropDown:", error);
            return res.status(500).json(
                generateResponse(false, "Something went wrong", 500, error.message)
            );
        }
    });
}

export async function createTask(req: any, res: any) {
    const {
        task_title,
        category_id,
        priority,
        bom_pcf_id,
        assign_to,
        due_date,
        description,
        product,
        estimated_hour,
        tags,
        attachments,
        is_client,
        client_id
    } = req.body;

    const created_by = req.user_id; // assuming auth middleware

    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            if (!task_title || !category_id || !assign_to || !bom_pcf_id) {
                return res
                    .status(400)
                    .json(generateResponse(false, "Task title, category,bom_pcf_id and assign_to are required", 400, null));
            }

            /* INSERT TASK */
            const task_id = ulid();

            const insertTaskQuery = `
                INSERT INTO task_managment (
                    id,
                    task_title,
                    category_id,
                    priority,
                    bom_pcf_id,
                    assign_to,
                    due_date,
                    description,
                    product,
                    estimated_hour,
                    tags,
                    attachments,
                    created_by
                )
                VALUES (
                    $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13
                )
                RETURNING *;
            `;

            const taskResult = await client.query(insertTaskQuery, [
                task_id,
                task_title,
                category_id,
                priority,
                bom_pcf_id,
                assign_to,
                due_date,
                description,
                product,
                estimated_hour,
                tags,
                attachments,
                created_by
            ]);

            /* FETCH SUPPLIER EMAILS FROM assign_to */
            const supplierEmailQuery = `
                    SELECT sup_id, supplier_email
                    FROM supplier_details
                    WHERE sup_id = ANY($1::VARCHAR[]);
                `;

            const supplierEmailResult = await client.query(supplierEmailQuery, [assign_to]);

            const supplierEmailMap = new Map<string, string>();

            supplierEmailResult.rows.forEach((row: any) => {
                supplierEmailMap.set(row.sup_id, row.supplier_email);
            });

            console.log("📧 Assigned Supplier Emails:", supplierEmailMap);

            /* FETCH BOM DATA USING bom_pcf_id */
            const bomQuery = `
                SELECT DISTINCT ON (supplier_id)
                id,supplier_id
                FROM bom
                WHERE bom_pcf_id = $1
                ORDER BY supplier_id;
            `;

            const bomResult = await client.query(bomQuery, [bom_pcf_id]);

            if (!bomResult.rows.length) {
                throw new Error("No BOM records found for given bom_pcf_id");
            }

            /* INSERT INTO pcf_request_data_collection_stage (BULK) */
            const pcfValues: any[] = [];
            const pcfPlaceholders: string[] = [];
            const emailPayloads: any[] = [];

            bomResult.rows.forEach((bom: any, index: number) => {
                const baseIndex = index * 4;

                pcfValues.push(
                    ulid(),          // id
                    bom_pcf_id,      // bom_pcf_id
                    bom.id,          // bom_id
                    bom.supplier_id  // sup_id
                );

                pcfPlaceholders.push(
                    `($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`
                );

                const email = supplierEmailMap.get(bom.supplier_id);

                if (email) {
                    emailPayloads.push({
                        email,
                        bom_pcf_id,
                        bom_id: bom.id,
                        supplier_id: bom.supplier_id
                    });
                }
            });

            const insertPCFQuery = `
                INSERT INTO pcf_request_data_collection_stage (
                    id,
                    bom_pcf_id,
                    bom_id,
                    sup_id
                )
                VALUES ${pcfPlaceholders.join(", ")}
                ON CONFLICT DO NOTHING;
            `;

            await client.query(insertPCFQuery, pcfValues);

            const insertPCFDataRatingQuery = `
                INSERT INTO pcf_request_data_rating_stage (
                    id,
                    bom_pcf_id,
                    bom_id,
                    sup_id
                )
                VALUES ${pcfPlaceholders.join(", ")}
                ON CONFLICT DO NOTHING;
            `;

            await client.query(insertPCFDataRatingQuery, pcfValues);

            const updatePCFRequest = `
                    UPDATE bom_pcf_request
                    SET is_task_created = TRUE,
                        update_date = NOW()
                    WHERE id = $1;
                `;

            await client.query(updatePCFRequest, [bom_pcf_id]);

            if (is_client) {
                const dataCollectionId = ulid();
                const dataRatingId = ulid();

                const insertPCFQuery = `
            INSERT INTO pcf_request_data_collection_stage (
                    id, bom_pcf_id, client_id
                )
                VALUES ($1,$2,$3)
                RETURNING *;
            `;

                await client.query(insertPCFQuery, [dataCollectionId, bom_pcf_id, client_id]);

                const insertPCFDataRatingQuery = `
             INSERT INTO pcf_request_data_rating_stage (
                    id, bom_pcf_id, client_id
                )
                VALUES ($1,$2,$3)
                RETURNING *;
            `;

                await client.query(insertPCFDataRatingQuery, [dataRatingId, bom_pcf_id, client_id]);
            }

            await client.query("COMMIT");

            /* SEND EMAILS */
            // const limit = pLimit(5);

            // for (const payload of emailPayloads) {
            //     try {
            //         // await Promise.allSettled(
            //         //     emailPayloads.map(payload =>
            //         //         limit(() => sendSupplierTaskEmail(payload))
            //         //     )
            //         // );
            //         console.log(`✅ Email sent to ${payload.email}`);
            //     } catch (err) {
            //         console.error(`❌ Email failed for ${payload.email}`, err);
            //         continue; // 🔥 THIS is what you asked for
            //     }
            // }

            setImmediate(() => {
                const limit = pLimit(5); // concurrency limit

                Promise.allSettled(
                    emailPayloads.map(payload =>
                        limit(() => sendSupplierTaskEmail(payload))
                    )
                ).then(results => {
                    results.forEach((r, i) => {
                        if (r.status === "fulfilled") {
                            console.log(`✅ Email sent: ${emailPayloads[i].email}`);
                        } else {
                            console.error(
                                `❌ Email failed: ${emailPayloads[i].email}`,
                                r.reason
                            );
                        }
                    });
                });
            });

            return res.status(200).json(
                generateResponse(
                    true,
                    "Task created successfully",
                    201,
                    taskResult.rows[0],
                )
            );



        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error("❌ Error in createTask:", error);

            return res.status(500).json(
                generateResponse(false, "Task creation failed", 500, error.message)
            );
        }
    });
}

export async function getTaskList(req: any, res: any) {
    const {
        pageNumber = 1,
        pageSize = 20,
        priority,
        category
    } = req.query;

    const page = pageNumber;
    const limit = pageSize;
    const offset = (Number(page) - 1) * Number(limit);

    return withClient(async (client: any) => {
        try {
            const filters: string[] = [];
            const values: any[] = [];
            let idx = 1;

            /* FILTERS */
            if (priority) {
                filters.push(`t.priority = $${idx++}`);
                values.push(priority);
            }

            if (category) {
                filters.push(`t.category_id = $${idx++}`);
                values.push(category);
            }

            const whereClause = filters.length
                ? `WHERE ${filters.join(" AND ")}`
                : "";

            /* MAIN QUERY */
            const query = `
                SELECT
                    t.*,

                    /* CATEGORY */
                    jsonb_build_object(
                        'id', c.id,
                        'code', c.code,
                        'name', c.name
                    ) AS category,

                    /* Product */
                    jsonb_build_object(
                        'id', p.id,
                        'product_code', p.product_code,
                        'product_name', p.product_name
                    ) AS product,

                    /* BOM PCF REQUEST */
                    jsonb_build_object(
                        'id', bpr.id,
                        'code', bpr.code,
                        'request_title', bpr.request_title
                    ) AS bom_pcf_request,

                    /* CREATED BY */
                    jsonb_build_object(
                        'user_id', cu.user_id,
                        'user_name', cu.user_name
                    ) AS created_by_user,

                    /* UPDATED BY */
                    jsonb_build_object(
                        'user_id', uu.user_id,
                        'user_name', uu.user_name
                    ) AS updated_by_user,

                    /* ASSIGNED SUPPLIERS */
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'sup_id', s.sup_id,
                                'code', s.code,
                                'supplier_name', s.supplier_name,
                                'supplier_email', s.supplier_email,
                                'supplier_phone_number', s.supplier_phone_number
                            )
                        )
                        FROM supplier_details s
                        WHERE s.sup_id = ANY(t.assign_to)
                    ) AS assigned_suppliers

                FROM task_managment t

                /* JOINS */
                LEFT JOIN category c
                    ON c.id = t.category_id

                LEFT JOIN product p
                    ON p.id = t.product    

                LEFT JOIN bom_pcf_request bpr
                    ON bpr.id = t.bom_pcf_id

                LEFT JOIN users_table cu
                    ON cu.user_id = t.created_by

                LEFT JOIN users_table uu
                    ON uu.user_id = t.updated_by

                ${whereClause}

                ORDER BY t.created_date DESC
                LIMIT $${idx++}
                OFFSET $${idx};
            `;

            values.push(Number(limit), offset);

            const result = await client.query(query, values);

            /* TOTAL COUNT */
            const countQuery = `
                SELECT COUNT(*) AS total
                FROM task_managment t
                ${whereClause};
            `;

            const countResult = await client.query(
                countQuery
                // values.slice(0, values.length - 2)
            );

            const total = Number(countResult.rows[0].total);

            return res.status(200).json(
                generateResponse(true, "Fetched successfully", 200, {
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
            console.error("❌ Error in listTasks:", error);
            return res.status(500).json(
                generateResponse(false, "Failed to fetch tasks", 500, error.message)
            );
        }
    });
}

export async function getTaskById(req: any, res: any) {
    const { id } = req.query;

    return withClient(async (client: any) => {
        try {

            /* MAIN QUERY */
            const query = `
                SELECT
                    t.*,

                    /* CATEGORY */
                    jsonb_build_object(
                        'id', c.id,
                        'code', c.code,
                        'name', c.name
                    ) AS category,

                    /* Product */
                    jsonb_build_object(
                        'id', p.id,
                        'product_code', p.product_code,
                        'product_name', p.product_name
                    ) AS product,

                    /* BOM PCF REQUEST */
                    jsonb_build_object(
                        'id', bpr.id,
                        'code', bpr.code,
                        'request_title', bpr.request_title
                    ) AS bom_pcf_request,

                    /* CREATED BY */
                    jsonb_build_object(
                        'user_id', cu.user_id,
                        'user_name', cu.user_name
                    ) AS created_by_user,

                    /* UPDATED BY */
                    jsonb_build_object(
                        'user_id', uu.user_id,
                        'user_name', uu.user_name
                    ) AS updated_by_user,

                    /* ASSIGNED SUPPLIERS */
                    (
                        SELECT jsonb_agg(
                            jsonb_build_object(
                                'sup_id', s.sup_id,
                                'code', s.code,
                                'supplier_name', s.supplier_name,
                                'supplier_email', s.supplier_email,
                                'supplier_phone_number', s.supplier_phone_number
                            )
                        )
                        FROM supplier_details s
                        WHERE s.sup_id = ANY(t.assign_to)
                    ) AS assigned_suppliers

                FROM task_managment t

                /* JOINS */
                LEFT JOIN category c
                    ON c.id = t.category_id

                LEFT JOIN product p
                    ON p.id = t.product 

                LEFT JOIN bom_pcf_request bpr
                    ON bpr.id = t.bom_pcf_id

                LEFT JOIN users_table cu
                    ON cu.user_id = t.created_by

                LEFT JOIN users_table uu
                    ON uu.user_id = t.updated_by

                WHERE t.id = $1
            `;

            const result = await client.query(query, [id]);

            return res.status(200).json(
                generateResponse(true, "Fetched successfully", 200, result.rows)
            );

        } catch (error: any) {
            console.error("❌ Error in listTasks:", error);
            return res.status(500).json(
                generateResponse(false, "Failed to fetch tasks", 500, error.message)
            );
        }
    });
}

export async function deleteTask(req: any, res: any) {
    const { task_id } = req.body; // task_managment.id

    if (!task_id) {
        return res.status(400).json(
            generateResponse(false, "task_id is required", 400, null)
        );
    }

    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            /* 1️⃣ FETCH bom_pcf_id FROM TASK */
            const fetchTaskQuery = `
                SELECT bom_pcf_id
                FROM task_managment
                WHERE id = $1;
            `;

            const taskResult = await client.query(fetchTaskQuery, [task_id]);

            if (!taskResult.rows.length) {
                await client.query("ROLLBACK");
                return res.status(404).json(
                    generateResponse(false, "Task not found", 404, null)
                );
            }

            const { bom_pcf_id } = taskResult.rows[0];

            /* 2️⃣ DELETE PCF REQUEST DATA COLLECTION STAGE */
            const deletePCFQuery = `
                DELETE FROM pcf_request_data_collection_stage
                WHERE bom_pcf_id = $1;
            `;

            await client.query(deletePCFQuery, [bom_pcf_id]);

            /* 3️⃣ DELETE TASK */
            const deleteTaskQuery = `
                DELETE FROM task_managment
                WHERE id = $1;
            `;

            await client.query(deleteTaskQuery, [task_id]);

            await client.query("COMMIT");

            return res.status(200).json(
                generateResponse(
                    true,
                    "Task and related PCF data deleted successfully",
                    200,
                    { task_id, bom_pcf_id }
                )
            );

        } catch (error: any) {
            await client.query("ROLLBACK");
            console.error("❌ Error in deleteTask:", error);

            return res.status(500).json(
                generateResponse(false, "Failed to delete task", 500, error.message)
            );
        }
    });
}

export async function sampleEmailTest(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const payload = {
                email: "chethan@zotanextech.com",
                bom_pcf_id: "01KADE43VDJRKCMGFTAPYK17M7",
                bom_id: "01KADE43VDJRKCMGFTAPYK17M7",
                supplier_id: "01KADE43VDJRKCMGFTAPYK17M7",
            }
            sendSupplierTaskEmail(payload);
        } catch (error) {
            await client.query("ROLLBACK");
            console.error("❌ Error in deleteTask:", error);

            return res.status(500).json(
                generateResponse(false, "Failed to delete task", 500, error)
            );
        }
    });
}