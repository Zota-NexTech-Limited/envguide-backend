import { withClient } from '../util/database';

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
