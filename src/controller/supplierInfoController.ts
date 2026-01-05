import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';

export async function addSupplierDetails(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { supplier_name, supplier_email, supplier_phone_number } = req.body;
            const id = ulid();

            if (!supplier_name || !supplier_email || !supplier_phone_number) {
                return res
                    .status(400)
                    .send(
                        generateResponse(
                            false,
                            "Supplier name, email and phone number are required",
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

            // === Check for existing supplier_email ===
            const existingEmail = await client.query(
                `SELECT supplier_email FROM supplier_details WHERE supplier_email = $1`,
                [supplier_email]
            );

            if (existingEmail.rows.length > 0) {
                return res
                    .status(400)
                    .send(
                        generateResponse(false, "Supplier email is already used", 400, null)
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
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                const { id, supplier_email, supplier_phone_number } = item;

                if (!id) {
                    throw new Error("Supplier ID is required");
                }

                /* --------------------------------
                   1️⃣ EMAIL UNIQUE CHECK (exclude self)
                -------------------------------- */
                if (supplier_email) {
                    const emailCheckQuery = `
                        SELECT 1 
                        FROM supplier_details 
                        WHERE supplier_email = $1 
                        AND id != $2
                        LIMIT 1;
                    `;
                    const emailResult = await client.query(emailCheckQuery, [
                        supplier_email,
                        id
                    ]);

                    if ((emailResult.rowCount ?? 0) > 0) {
                        throw new Error(`Supplier email already exists: ${supplier_email}`);
                    }
                }

                /* --------------------------------
                   2️⃣ PHONE UNIQUE CHECK (exclude self)
                -------------------------------- */
                if (supplier_phone_number) {
                    const phoneCheckQuery = `
                        SELECT 1 
                        FROM supplier_details 
                        WHERE supplier_phone_number = $1 
                        AND id != $2
                        LIMIT 1;
                    `;
                    const phoneResult = await client.query(phoneCheckQuery, [
                        supplier_phone_number,
                        id
                    ]);

                    if ((phoneResult.rowCount ?? 0) > 0) {
                        throw new Error(`Supplier phone number already exists`);
                    }
                }

                /* --------------------------------
                   3️⃣ BUILD UPDATE QUERY
                -------------------------------- */
                const columnValuePairs = Object.entries(item)
                    .filter(([key]) => key !== "id")
                    .map(([key], index) => `${key} = $${index + 1}`)
                    .join(", ");

                const values = Object.entries(item)
                    .filter(([key]) => key !== "id")
                    .map(([_, value]) => value);

                if (!columnValuePairs) continue;

                const updateQuery = `
                    UPDATE supplier_details
                    SET ${columnValuePairs}, update_date = NOW()
                    WHERE id = $${values.length + 1}
                    RETURNING *;
                `;

                const result = await client.query(updateQuery, [...values, id]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.status(200).send(
                generateResponse(true, "Updated successfully", 200, updatedRows)
            );

        } catch (error: any) {
            console.error(error);
            return res.status(400).send(
                generateResponse(false, error.message, 400, null)
            );
        }
    });
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

// export async function SupplierDetailsDataSetup(req: any, res: any) {
//     return withClient(async (client: any) => {
//         try {
//             const obj = req.body;

//             if (!Array.isArray(obj) || obj.length === 0) {
//                 return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
//             }

//             // === Generate new code ===
//             const lastCodeRes = await client.query(
//                 `SELECT code FROM supplier_details 
//              WHERE code LIKE 'SUP%' 
//              ORDER BY created_date DESC 
//              LIMIT 1;`
//             );

//             let newCode = "SUP00001";
//             if (lastCodeRes.rows.length > 0) {
//                 const lastCode = lastCodeRes.rows[0].code; // e.g. "SUP00012"
//                 const numPart = parseInt(lastCode.replace("SUP", ""), 10);
//                 const nextNum = numPart + 1;
//                 newCode = "SUP" + String(nextNum).padStart(5, "0");
//             }

//             const finalData = obj.map((item: any) => ({
//                 id: ulid(),
//                 code: newCode,
//                 supplier_name: item.supplier_name,
//                 supplier_email: item.supplier_email,
//                 supplier_phone_number: item.supplier_phone_number
//             }));

//             const columns = Object.keys(finalData[0]);
//             const values: any[] = [];
//             const placeholders: string[] = [];

//             finalData.forEach((row, rowIndex) => {
//                 const rowValues = Object.values(row);
//                 values.push(...rowValues);
//                 const placeholder = rowValues.map((_, colIndex) => `$${rowIndex * rowValues.length + colIndex + 1}`);
//                 placeholders.push(`(${placeholder.join(', ')})`);
//             });

//             const insertQuery = `
//             INSERT INTO supplier_details (${columns.join(', ')})
//             VALUES ${placeholders.join(', ')}
//             RETURNING *;
//         `;

//             const result = await client.query(insertQuery, values);
//             return res.status(200).send(generateResponse(true, "Added successfully", 200, result.rows));
//         } catch (error: any) {
//             return res.status(500).send(generateResponse(false, error.message, 500, null));
//         }
//     })
// }
export async function SupplierDetailsDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            /* ------------------------------------------------
               1️⃣ Check duplicates INSIDE request body
            ------------------------------------------------ */
            const emails = obj.map((i: any) => i.supplier_email).filter(Boolean);
            const phones = obj.map((i: any) => i.supplier_phone_number).filter(Boolean);

            const hasDuplicate = (arr: any[]) =>
                new Set(arr).size !== arr.length;

            if (hasDuplicate(emails)) {
                throw new Error("Duplicate supplier_email found in request");
            }

            if (hasDuplicate(phones)) {
                throw new Error("Duplicate supplier_phone_number found in request");
            }

            /* ------------------------------------------------
               2️⃣ Check EMAIL exists in DB
            ------------------------------------------------ */
            if (emails.length > 0) {
                const emailCheckQuery = `
                    SELECT supplier_email
                    FROM supplier_details
                    WHERE supplier_email = ANY($1);
                `;
                const emailResult = await client.query(emailCheckQuery, [emails]);

                if ((emailResult.rowCount ?? 0) > 0) {
                    const existingEmails = emailResult.rows.map(
                        (r: any) => r.supplier_email
                    );
                    throw new Error(
                        `Supplier email already exists: ${existingEmails.join(", ")}`
                    );
                }
            }

            /* ------------------------------------------------
               3️⃣ Check PHONE exists in DB
            ------------------------------------------------ */
            if (phones.length > 0) {
                const phoneCheckQuery = `
                    SELECT supplier_phone_number
                    FROM supplier_details
                    WHERE supplier_phone_number = ANY($1);
                `;
                const phoneResult = await client.query(phoneCheckQuery, [phones]);

                if ((phoneResult.rowCount ?? 0) > 0) {
                    throw new Error("Supplier phone number already exists");
                }
            }

            /* ------------------------------------------------
               4️⃣ Generate supplier code
            ------------------------------------------------ */
            const lastCodeRes = await client.query(`
                SELECT code 
                FROM supplier_details 
                WHERE code LIKE 'SUP%' 
                ORDER BY created_date DESC 
                LIMIT 1;
            `);

            let newCode = "SUP00001";
            if (lastCodeRes.rows.length > 0) {
                const lastCode = lastCodeRes.rows[0].code;
                const numPart = parseInt(lastCode.replace("SUP", ""), 10) + 1;
                newCode = "SUP" + String(numPart).padStart(5, "0");
            }

            /* ------------------------------------------------
               5️⃣ Prepare insert data
            ------------------------------------------------ */
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

                const rowPlaceholders = rowValues.map(
                    (_, colIndex) =>
                        `$${rowIndex * rowValues.length + colIndex + 1}`
                );

                placeholders.push(`(${rowPlaceholders.join(", ")})`);
            });

            const insertQuery = `
                INSERT INTO supplier_details (${columns.join(", ")})
                VALUES ${placeholders.join(", ")}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.status(200).send(
                generateResponse(true, "Added successfully", 200, result.rows)
            );

        } catch (error: any) {
            console.error(error);
            return res.status(400).send(
                generateResponse(false, error.message, 400, null)
            );
        }
    });
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