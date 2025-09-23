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
