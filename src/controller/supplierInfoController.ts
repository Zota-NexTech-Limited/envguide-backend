import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';

export async function addSupplierDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { supplier_name, supplier_email, supplier_phone_number } = req.body;
            const id = ulid();

            if (!supplier_name || !supplier_email) {
                return res
                    .status(400)
                    .send(
                        generateResponse(
                            false,
                            "Supplier name and email are required",
                            400,
                            null
                        )
                    );
            }
            // === Generate new code ===
            const lastCodeRes = await client.query(`
        SELECT code 
        FROM supplier_details 
        WHERE code LIKE 'SUP%' 
        ORDER BY created_date DESC 
        LIMIT 1;
      `);

            let newCode = "SUP00001";
            if (lastCodeRes.rows.length > 0) {
                const lastCode = lastCodeRes.rows[0].code; // e.g. "SUP00012"
                const numPart = parseInt(lastCode.replace("SUP", ""), 10);
                const nextNum = numPart + 1;
                newCode = "SUP" + String(nextNum).padStart(5, "0");
            }

            // === Check for existing phone number ===
            const existing = await client.query(
                `SELECT supplier_phone_number FROM supplier_details WHERE supplier_phone_number = $1`,
                [supplier_phone_number]
            );

            if (existing.rows.length > 0) {
                return res
                    .status(400)
                    .send(
                        generateResponse(false, "Supplier phone number is already used", 400, null)
                    );
            }

            // === Insert supplier ===
            const insertQuery = `
        INSERT INTO supplier_details (id, code, supplier_name, supplier_email, supplier_phone_number, created_date)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING *;
      `;
            const result = await client.query(insertQuery, [
                id,
                newCode,
                supplier_name,
                supplier_email,
                supplier_phone_number,
            ]);

            return res.send(
                generateResponse(true, "Added successfully", 200, result.rows[0])
            );
        } catch (error: any) {
            console.error("❌ Error adding supplier:", error);
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function getSupplierDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT * FROM supplier_details;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateSupplierDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id") // prevent overwriting PK
                    .map(([columnName, value], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE supplier_details 
                SET ${columnValuePairs}, update_date = NOW() 
                WHERE id = $${values.length + 1} 
                RETURNING *;
            `;
                const result = await client.query(query, [...values, item.id]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getSupplierDetailsList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;

            let whereClause = '';
            let orderByClause = 'ORDER BY i.created_date ASC';

            if (searchValue) {
                whereClause += ` AND (i.code ILIKE $1 OR i.supplier_name ILIKE $1)`;
            }

            const listQuery = `
            SELECT i.* 
            FROM supplier_details i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM supplier_details i
            WHERE 1=1 ${whereClause};
        `;

            const values = searchValue ? [`%${searchValue}%`] : [];
            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function SupplierDetailsDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            // === Generate new code ===
            const lastCodeRes = await client.query(
                `SELECT code FROM supplier_details 
             WHERE code LIKE 'SUP%' 
             ORDER BY created_date DESC 
             LIMIT 1;`
            );

            let newCode = "SUP00001";
            if (lastCodeRes.rows.length > 0) {
                const lastCode = lastCodeRes.rows[0].code; // e.g. "SUP00012"
                const numPart = parseInt(lastCode.replace("SUP", ""), 10);
                const nextNum = numPart + 1;
                newCode = "SUP" + String(nextNum).padStart(5, "0");
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: newCode,
                supplier_name: item.supplier_name,
                supplier_email: item.supplier_email,
                supplier_phone_number: item.supplier_phone_number
            }));

            const columns = Object.keys(finalData[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            finalData.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                const placeholder = rowValues.map((_, colIndex) => `$${rowIndex * rowValues.length + colIndex + 1}`);
                placeholders.push(`(${placeholder.join(', ')})`);
            });

            const insertQuery = `
            INSERT INTO supplier_details (${columns.join(', ')})
            VALUES ${placeholders.join(', ')}
            RETURNING *;
        `;

            const result = await client.query(insertQuery, values);
            return res.status(200).send(generateResponse(true, "Added successfully", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(generateResponse(false, error.message, 500, null));
        }
    })
}

export async function deleteSupplierDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM supplier_details WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}