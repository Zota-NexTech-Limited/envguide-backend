import { withClient } from '../util/database';
import { ulid } from 'ulid';

export async function createTaskService(data: any) {
    return withClient(async (client: any) => {
        try {
            const {
                task_title,
                category_id,
                priority,
                assign_to,
                due_date,
                description,
                related_product,
                estimated_hour,
                tags,
                attachments,
                code,
                created_by
            } = data;

            const id = ulid();
            const created_date = new Date();
            const update_date = new Date();

            const insertQuery = `
            INSERT INTO task_managment (
                id,
                task_title,
                category_id,
                priority,
                assign_to,
                due_date,
                description,
                related_product,
                estimated_hour,
                tags,
                attachments,
                update_date,
                created_date,
                code,
                created_by
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8,
                $9, $10, $11, $12, $13, $14, $15
            )
            RETURNING *;
        `;

            const values = [
                id,
                task_title,
                category_id,
                priority,
                assign_to,
                due_date,
                description,
                related_product,
                estimated_hour,
                tags,
                attachments,
                update_date,
                created_date,
                code,
                created_by
            ];

            const result = await client.query(insertQuery, values);
            return result.rows[0];
        } catch (error: any) {
            console.error("Error in createTaskService:", error.message);
            throw new Error(error.message);
        }
    });
}

export async function updateTaskService(id: string, data: any) {
    return withClient(async (client: any) => {
        try {
            // Get keys and values dynamically
            const keys = Object.keys(data);
            const values = Object.values(data);

            if (keys.length === 0) {
                throw new Error("No data provided for update");
            }

            // Generate SET clause dynamically
            const setClause = keys
                .map((key, index) => `${key} = $${index + 1}`)
                .join(", ");

            const query = `
                UPDATE task_managment
                SET ${setClause}
                WHERE id = $${keys.length + 1}
                RETURNING *;
            `;

            const result = await client.query(query, [...values, id]);

            if (result.rows.length === 0) {
                return null; // Not found
            }

            return result.rows[0];
        } catch (error: any) {
            console.error("Error in updateTaskService:", error.message);
            throw new Error(error.message);
        }
    });
}

export async function getTaskByIdService(id: string) {
    return withClient(async (client: any) => {
        try {
            const query = `
                SELECT 
                    t.*,
                    c.code AS category_code,
                    c.name AS category_name,
                    u.user_name AS assigned_user_name,
                    u1.user_name AS created_by_name,
                    u2.user_name AS updated_by_name
                FROM task_managment t
                LEFT JOIN category c ON t.category_id = c.id
                LEFT JOIN users_table u ON t.assign_to = u.user_id
                LEFT JOIN users_table u1 ON t.created_by = u1.user_id
                LEFT JOIN users_table u2 ON t.updated_by = u2.user_id
                WHERE t.id = $1;
            `;

            const result = await client.query(query, [id]);
            return result.rows[0];
        } catch (error: any) {
            console.error("Error in getTaskByIdService:", error.message);
            throw new Error(error.message);
        }
    });
}

export async function deleteTaskService(id: string) {
    return withClient(async (client: any) => {
        try {
            const query = `
                DELETE FROM task_managment
                WHERE id = $1
                RETURNING *;
            `;

            const result = await client.query(query, [id]);
            return result.rows[0]; // null if no row was deleted
        } catch (error: any) {
            console.error("Error in deleteTaskService:", error.message);
            throw new Error(error.message);
        }
    });
}

export async function getTaskListService(filters: any) {
    const { limit, offset, category_name, assigned_user_name, priority, page } = filters;

    return withClient(async (client: any) => {
        try {
            let baseQuery = `
                SELECT t.*,
                       c.name AS category_name,
                       u.user_name AS assigned_user_name,
                       u1.user_name AS created_by_name,
                       u2.user_name AS updated_by_name
                FROM task_managment t
                LEFT JOIN category c ON t.category_id = c.id
                LEFT JOIN users_table u ON t.assign_to = u.user_id
                LEFT JOIN users_table u1 ON t.created_by = u1.user_id
                LEFT JOIN users_table u2 ON t.updated_by = u2.user_id
                WHERE 1=1
            `;

            const countQueryBase = `
                SELECT COUNT(*) AS total_count
                FROM task_managment t
                LEFT JOIN category c ON t.category_id = c.id
                LEFT JOIN users_table u ON t.assign_to = u.user_id
                LEFT JOIN users_table u1 ON t.created_by = u1.user_id
                LEFT JOIN users_table u2 ON t.updated_by = u2.user_id
                WHERE 1=1
            `;

            const values: any[] = [];
            let whereClauses: string[] = [];
            let countValues: any[] = [];

            // Apply filters dynamically
            if (category_name) {
                values.push(`%${category_name}%`);
                countValues.push(`%${category_name}%`);
                whereClauses.push(`c.name ILIKE $${values.length}`);
            }

            if (assigned_user_name) {
                values.push(`%${assigned_user_name}%`);
                countValues.push(`%${assigned_user_name}%`);
                whereClauses.push(`u.user_name ILIKE $${values.length}`);
            }

            if (priority) {
                values.push(priority);
                countValues.push(priority);
                whereClauses.push(`t.priority = $${values.length}`);
            }

            // Append dynamic where clauses
            const whereSQL = whereClauses.length ? " AND " + whereClauses.join(" AND ") : "";

            const finalQuery = `${baseQuery} ${whereSQL} ORDER BY t.created_date DESC LIMIT ${limit} OFFSET ${offset}`;
            const finalCountQuery = `${countQueryBase} ${whereSQL}`;

            const [dataResult, countResult] = await Promise.all([
                client.query(finalQuery, values),
                client.query(finalCountQuery, countValues)
            ]);

            const rows = dataResult.rows;
            const totalCount = parseInt(countResult.rows[0]?.total_count ?? 0);
            const totalPages = Math.ceil(totalCount / limit);

            return {
                data: rows,
                current_page: page,
                total_pages: totalPages,
                total_count: totalCount
            };

        } catch (error: any) {
            console.error("Error in getTaskListService:", error.message);
            throw new Error(error.message);
        }
    });
}
