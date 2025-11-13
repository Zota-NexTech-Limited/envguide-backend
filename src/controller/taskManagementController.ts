
import { generateResponse } from '../util/genRes';
import { createTaskService, updateTaskService, getTaskByIdService, deleteTaskService, getTaskListService } from "../services/taskManagementService";
import { withClient } from '../util/database';

export async function createTask(req: any, res: any) {
    try {
        const data = req.body;

        // Validation
        if (!data.task_title || !data.category_id || !data.assign_to) {
            return res
                .status(400)
                .json(generateResponse(false, "Task title, category, and assign_to are required", 400, null));
        }

        const code = `TASK-${Date.now()}`;
        data.code = code;
        data.created_by = req.user_id;

        // here i need to send email for supplier input question
        const task = await createTaskService(data);

        return res
            .status(200)
            .json(generateResponse(true, "Task created successfully", 200, task));
    } catch (error: any) {
        console.error("Error in createTask:", error.message);
        return res
            .status(500)
            .json(generateResponse(false, "Something went wrong", 500, error.message));
    }
}

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

export async function getTaskById(req: any, res: any) {
    try {
        const { id } = req.query;

        if (!id) {
            return res
                .status(400)
                .json(generateResponse(false, "Task ID is required", 400, null));
        }

        const task = await getTaskByIdService(id);

        if (!task) {
            return res
                .status(404)
                .json(generateResponse(false, "Task not found", 404, null));
        }

        return res
            .status(200)
            .json(generateResponse(true, "Task fetched successfully", 200, task));

    } catch (error: any) {
        console.error("Error in getTaskById:", error.message);
        return res
            .status(500)
            .json(generateResponse(false, "Something went wrong", 500, error.message));
    }
}

export async function deleteTask(req: any, res: any) {
    try {
        const { id } = req.body;

        if (!id) {
            return res
                .status(400)
                .json(generateResponse(false, "Task ID is required", 400, null));
        }

        const deletedTask = await deleteTaskService(id);

        if (!deletedTask) {
            return res
                .status(404)
                .json(generateResponse(false, "Task not found", 404, null));
        }

        return res
            .status(200)
            .json(generateResponse(true, "Task deleted successfully", 200, deletedTask));

    } catch (error: any) {
        console.error("Error in deleteTask:", error.message);
        return res
            .status(500)
            .json(generateResponse(false, "Something went wrong", 500, error.message));
    }
}

export async function getTaskList(req: any, res: any) {
    const { pageNumber, pageSize, category_name, assigned_user_name, priority } = req.query;

    const limit = parseInt(pageSize) || 20;
    const page = parseInt(pageNumber) > 0 ? parseInt(pageNumber) : 1;
    const offset = (page - 1) * limit;

    try {
        const result = await getTaskListService({ limit, offset, category_name, assigned_user_name, priority, page });

        return res.status(200).json(
            generateResponse(true, "Fetched successfully", 200, result)
        );
    } catch (error: any) {
        console.error("Error in getTaskList:", error.message);
        return res.status(500).json(generateResponse(false, "Something went wrong", 500, error.message));
    }
}

export async function getPCFListDropDown(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `
                SELECT 
                    p.id AS pcf_id,
                    p.code AS pcf_code,
                    p.request_title,
                    p.priority,
                    p.request_organization,
                    b.id AS bom_id,
                    b.code AS bom_code,
                    b.component_name,
                    b.material_number
                FROM bom_pcf_request p
                JOIN bom b ON p.id = b.bom_pcf_id
                ORDER BY p.created_date DESC
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

export async function getBomSuppierListDropDown(req: any, res: any) {
    const { bom_id } = req.query;

    return withClient(async (client: any) => {
        try {
            if (!bom_id) {
                return res.status(400).json(
                    generateResponse(false, "Missing required parameter: bom_id", 400, null)
                );
            }

            // 1️⃣ Fetch all supplier_ids arrays from BOM records linked to this PCF
            const bomQuery = `
                SELECT supplier_ids
                FROM bom 
                WHERE id = $1
            `;
            const bomResult = await client.query(bomQuery, [bom_id]);

            if (bomResult.rows.length === 0) {
                return res.status(404).json(
                    generateResponse(false, "No BOMs found for the given BOM ID", 404, null)
                );
            }

            // 2️⃣ Flatten and clean supplier_ids
            const supplierIds = bomResult.rows
                .flatMap((row: any) => row.supplier_ids || [])
                .filter((id: string) => id); // remove null/empty values

            if (supplierIds.length === 0) {
                return res.status(200).json(
                    generateResponse(true, "No suppliers found for this BOM", 200, {
                        suppliers: [],
                        bom_ids: bomResult.rows.map((row: any) => row.bom_id)
                    })
                );
            }

            // 3️⃣ Fetch supplier details
            const supplierQuery = `
                SELECT 
                    id,
                    code AS supplier_code,
                    supplier_name,
                    supplier_email,
                    supplier_phone_number
                FROM supplier_details
                WHERE id = ANY($1::varchar[])
            `;
            const supplierResult = await client.query(supplierQuery, [supplierIds]);

            return res.status(200).json(
                generateResponse(true, "Fetched successfully", 200, {
                    suppliers: supplierResult.rows,
                })
            );
        } catch (error: any) {
            console.error("❌ Error in getBomSuppierListDropDown:", error);
            return res.status(500).json(
                generateResponse(false, "Something went wrong", 500, error.message)
            );
        }
    });
}

