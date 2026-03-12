import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';

export async function addOwnEmission(req: any, res: any) {

    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const {
                product_id,
                reporting_period_from,
                reporting_period_to,
                calculation_method_id,
                fuel_combustion_id,
                fuel_combustion_value,
                process_emission_id,
                process_emission_value,
                fugitive_emission_id,
                fugitive_emission_value,
                electicity_location_based_id,
                electicity_location_based_value,
                electicity_market_based_id,
                electicity_market_based_value,
                steam_heat_cooling_id,
                steam_heat_cooling_value,
                additional_notes,
                supporting_documents, // array of docs,
                own_emission_status
            } = req.body;

            const id = ulid();
            const created_by = req.user_id;

            // === Generate new code ===
            const lastCodeRes = await client.query(
                `SELECT code FROM own_emission 
             WHERE code LIKE 'OWNE%' 
             ORDER BY created_date DESC 
             LIMIT 1;`
            );

            let newCode = "OWNE00001";
            if (lastCodeRes.rows.length > 0) {
                const lastCode = lastCodeRes.rows[0].code; // e.g. "OWNE00012"
                const numPart = parseInt(lastCode.replace("OWNE", ""), 10);
                const nextNum = numPart + 1;
                newCode = "OWNE" + String(nextNum).padStart(5, "0");
            }

            const query = `
            INSERT INTO own_emission (
                id, code, reporting_period_from, reporting_period_to,
                calculation_method_id, fuel_combustion_id, fuel_combustion_value,
                process_emission_id, process_emission_value,
                fugitive_emission_id, fugitive_emission_value,
                electicity_location_based_id, electicity_location_based_value,
                electicity_market_based_id, electicity_market_based_value,
                steam_heat_cooling_id, steam_heat_cooling_value,
                additional_notes, created_by,product_id,own_emission_status
            ) VALUES (
                $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21
            ) RETURNING *;
        `;
            const result = await client.query(query, [
                id, newCode, reporting_period_from, reporting_period_to,
                calculation_method_id, fuel_combustion_id, fuel_combustion_value,
                process_emission_id, process_emission_value,
                fugitive_emission_id, fugitive_emission_value,
                electicity_location_based_id, electicity_location_based_value,
                electicity_market_based_id, electicity_market_based_value,
                steam_heat_cooling_id, steam_heat_cooling_value,
                additional_notes, created_by, product_id, own_emission_status
            ]);

            if (Array.isArray(supporting_documents) && supporting_documents.length > 0) {
                const docValues: any[] = [];
                const placeholders: string[] = [];

                supporting_documents.forEach((doc: string, index: number) => {
                    const docId = ulid();
                    docValues.push(docId, id, doc);
                    placeholders.push(`($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`);
                });

                const docQuery = `
                INSERT INTO own_emission_supporting_document (id, own_emission_id, document)
                VALUES ${placeholders.join(", ")};
            `;
                await client.query(docQuery, docValues);
            }

            await client.query("COMMIT");
            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getOwnEmissionById(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.query;

            const query = `
            SELECT oe.*,
                   cm.name AS calculation_method_name,
                   fc.name AS fuel_combustion_name,
                   pe.name AS process_emission_name,
                   fe.name AS fugitive_emission_name,
                   elb.name AS electicity_location_based_name,
                   emb.name AS electicity_market_based_name,
                   shc.name AS steam_heat_cooling_name,
                   u1.user_name AS created_by_name,
                   u2.user_name AS updated_by_name
            FROM own_emission oe
            LEFT JOIN calculation_method cm ON oe.id = cm.id
            LEFT JOIN fuel_combustion fc ON oe.id = fc.id
            LEFT JOIN process_emission pe ON oe.id = pe.id
            LEFT JOIN fugitive_emission fe ON oe.id = fe.id
            LEFT JOIN electicity_location_based elb ON oe.id = elb.id
            LEFT JOIN electicity_market_based emb ON oe.id = emb.id
            LEFT JOIN steam_heat_cooling shc ON oe.id = shc.id
            LEFT JOIN users_table u1 ON oe.created_by = u1.user_id
            LEFT JOIN users_table u2 ON oe.updated_by = u2.user_id
            WHERE oe.id = $1;
        `;
            const result = await client.query(query, [id]);

            if (result.rows.length === 0) {
                return res.status(404).send(generateResponse(false, "Not Found", 404, null));
            }

            // Fetch supporting documents
            const docs = await client.query(
                `SELECT * FROM own_emission_supporting_document WHERE own_emission_id = $1;`,
                [id]
            );

            const response = {
                ...result.rows[0],
                supporting_documents: docs.rows
            };

            return res.send(generateResponse(true, "Fetched successfully", 200, response));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getOwnEmissionList(req: any, res: any) {
    const { pageNumber, pageSize } = req.query;

    const limit = parseInt(pageSize) || 20;
    const page = parseInt(pageNumber) > 0 ? parseInt(pageNumber) : 1;
    const offset = (page - 1) * limit;

    return withClient(async (client: any) => {
        try {
            // Main query with joins
            const query = `
      SELECT oe.*,
             cm.name AS calculation_method_name,
             fc.name AS fuel_combustion_name,
             pe.name AS process_emission_name,
             fe.name AS fugitive_emission_name,
             elb.name AS electicity_location_based_name,
             emb.name AS electicity_market_based_name,
             shc.name AS steam_heat_cooling_name,
             u1.user_name AS created_by_name,
             u2.user_name AS updated_by_name
      FROM own_emission oe
      LEFT JOIN calculation_method cm ON oe.id = cm.id
      LEFT JOIN fuel_combustion fc ON oe.id = fc.id
      LEFT JOIN process_emission pe ON oe.id = pe.id
      LEFT JOIN fugitive_emission fe ON oe.id = fe.id
      LEFT JOIN electicity_location_based elb ON oe.id = elb.id
      LEFT JOIN electicity_market_based emb ON oe.id = emb.id
      LEFT JOIN steam_heat_cooling shc ON oe.id = shc.id
      LEFT JOIN users_table u1 ON oe.created_by = u1.user_id
      LEFT JOIN users_table u2 ON oe.updated_by = u2.user_id
      ORDER BY oe.created_date DESC
      LIMIT ${limit} OFFSET ${offset};
    `;

            // Count query for total pages
            const countQuery = `
      SELECT COUNT(*) AS total_count
      FROM own_emission;
    `;

            const [result, countResult] = await Promise.all([
                client.query(query),
                client.query(countQuery),
            ]);

            const rows = result.rows;

            // Fetch supporting docs for each record
            for (const row of rows) {
                const docs = await client.query(
                    `SELECT * FROM own_emission_supporting_document WHERE own_emission_id = $1;`,
                    [row.id]
                );
                row.supporting_documents = docs.rows;
            }

            const totalCount = parseInt(countResult.rows[0]?.total_count ?? 0);
            const totalPages = Math.ceil(totalCount / limit);

            return res.send(
                generateResponse(true, "Fetched successfully", 200, {
                    data: rows,
                    current_page: page,
                    total_pages: totalPages,
                    total_count: totalCount,
                })
            );
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateOwnEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const {
                id,
                product_id,
                reporting_period_from,
                reporting_period_to,
                calculation_method_id,
                fuel_combustion_id,
                fuel_combustion_value,
                process_emission_id,
                process_emission_value,
                fugitive_emission_id,
                fugitive_emission_value,
                electicity_location_based_id,
                electicity_location_based_value,
                electicity_market_based_id,
                electicity_market_based_value,
                steam_heat_cooling_id,
                steam_heat_cooling_value,
                additional_notes,
                supporting_documents, // array of docs (optional)
                own_emission_status
            } = req.body;

            const updated_by = req.user_id;

            const updateQuery = `
      UPDATE own_emission
      SET reporting_period_from = $1,
          reporting_period_to = $2,
          calculation_method_id = $3,
          fuel_combustion_id = $4,
          fuel_combustion_value = $5,
          process_emission_id = $6,
          process_emission_value = $7,
          fugitive_emission_id = $8,
          fugitive_emission_value = $9,
          electicity_location_based_id = $10,
          electicity_location_based_value = $11,
          electicity_market_based_id = $12,
          electicity_market_based_value = $13,
          steam_heat_cooling_id = $14,
          steam_heat_cooling_value = $15,
          additional_notes = $16,
          updated_by = $17,
          update_date = NOW(),
          product_id = $19,
          own_emission_status = $20
      WHERE id = $18
      RETURNING *;
    `;

            const result = await client.query(updateQuery, [
                reporting_period_from,
                reporting_period_to,
                calculation_method_id,
                fuel_combustion_id,
                fuel_combustion_value,
                process_emission_id,
                process_emission_value,
                fugitive_emission_id,
                fugitive_emission_value,
                electicity_location_based_id,
                electicity_location_based_value,
                electicity_market_based_id,
                electicity_market_based_value,
                steam_heat_cooling_id,
                steam_heat_cooling_value,
                additional_notes,
                updated_by,
                id,
                product_id,
                own_emission_status
            ]);

            if (result.rows.length === 0) {
                await client.query("ROLLBACK");
                return res
                    .status(404)
                    .send(generateResponse(false, "Own emission record not found", 404, null));
            }

            // === Replace supporting documents if provided ===
            if (Array.isArray(supporting_documents)) {
                await client.query(
                    `DELETE FROM own_emission_supporting_document WHERE own_emission_id = $1;`,
                    [id]
                );

                if (supporting_documents.length > 0) {
                    const docValues: any[] = [];
                    const placeholders: string[] = [];

                    supporting_documents.forEach((doc: string, index: number) => {
                        const docId = ulid();
                        docValues.push(docId, id, doc);
                        placeholders.push(`($${index * 3 + 1}, $${index * 3 + 2}, $${index * 3 + 3})`);
                    });

                    const docQuery = `
          INSERT INTO own_emission_supporting_document (id, own_emission_id, document)
          VALUES ${placeholders.join(", ")};
        `;
                    await client.query(docQuery, docValues);
                }
            }

            await client.query("COMMIT");
            return res.send(generateResponse(true, "Updated successfully", 200, result.rows[0]));
        } catch (error: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function deleteOwnEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const { id } = req.body;

            const checkId = await client.query(
                `Select * FROM own_emission WHERE id = $1;`,
                [id]
            );

            if (!checkId) {
                await client.query("ROLLBACK");
                return res
                    .status(404)
                    .send(generateResponse(false, "Own emission record not found", 404, null));
            }

            await client.query(
                `DELETE FROM own_emission_supporting_document WHERE own_emission_id = $1;`,
                [id]
            );

            const result = await client.query(
                `DELETE FROM own_emission WHERE id = $1 RETURNING *;`,
                [id]
            );


            await client.query("COMMIT");
            return res.send(generateResponse(true, "Deleted successfully", 200, result.rows[0]));
        } catch (error: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function deleteSupportingDocument(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            await client.query("BEGIN");

            const { supporting_document_id } = req.body;

            const checkId = await client.query(
                `Select * FROM own_emission_supporting_document WHERE id = $1;`,
                [supporting_document_id]
            );

            if (!checkId) {
                await client.query("ROLLBACK");
                return res
                    .status(404)
                    .send(generateResponse(false, "Own emission supporting document record not found", 404, null));
            }

            const result = await client.query(
                `DELETE FROM own_emission_supporting_document WHERE id = $1;`,
                [supporting_document_id]
            );

            await client.query("COMMIT");
            return res.send(generateResponse(true, "Deleted successfully", 200, result.rows[0]));
        } catch (error: any) {
            await client.query("ROLLBACK");
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// Own Emission supporting team apis ====>
export async function addOwnEmissionSupportingTeam(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { full_name, phone_number, email_address, message } = req.body;
            const id = ulid();

            const query = `
      INSERT INTO own_emission_supporting_team 
      (id, full_name, phone_number, email_address, message)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `;

            const result = await client.query(query, [
                id,
                full_name,
                phone_number,
                email_address,
                message,
            ]);

            return res.send(
                generateResponse(true, "Our Enviguide support team will contact soon", 200, result.rows[0])
            );
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getOwnEmissionSupportingTeamList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            let { page, limit } = req.query;
            page = page ? parseInt(page) : 1;
            limit = limit ? parseInt(limit) : 10;
            const offset = (page - 1) * limit;

            const query = `
      SELECT * 
      FROM own_emission_supporting_team
      ORDER BY created_date DESC
      LIMIT $1 OFFSET $2;
    `;

            const result = await client.query(query, [limit, offset]);

            const countQuery = `SELECT COUNT(*) FROM own_emission_supporting_team;`;
            const countResult = await client.query(countQuery);
            const totalCount = parseInt(countResult.rows[0].count);

            return res.send(
                generateResponse(true, "Fetched successfully", 200, {
                    data: result.rows,
                    pagination: {
                        total: totalCount,
                        page,
                        limit,
                        totalPages: Math.ceil(totalCount / limit),
                    },
                })
            );
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getOwnEmissionSupportingTeamById(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.query;

            const query = `
      SELECT * 
      FROM own_emission_supporting_team
      WHERE id = $1;
    `;

            const result = await client.query(query, [id]);

            if (result.rows.length === 0) {
                return res
                    .status(404)
                    .send(generateResponse(false, "Not found", 404, null));
            }

            return res.send(
                generateResponse(true, "Fetched successfully", 200, result.rows[0])
            );
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}