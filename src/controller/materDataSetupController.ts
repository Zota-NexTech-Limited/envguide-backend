import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';

// =========> Generation codes =============>

export async function generateDynamicCode(
    client: any,
    prefix: string,
    table: string,
    column: string = 'code'
): Promise<number> {
    const result = await client.query(`
        SELECT ${column}
        FROM ${table}
        WHERE ${column} LIKE $1
        ORDER BY ${column} DESC
        LIMIT 1
    `, [`${prefix}%`]);

    if (result.rowCount === 0) {
        return 1;
    }

    return parseInt(
        result.rows[0][column].replace(prefix, ''),
        10
    ) + 1;
}

export function formatCode(prefix: string, number: number, length = 5): string {
    return `${prefix}${number.toString().padStart(length, '0')}`;
}

export async function addMaterialCompositionMetal(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            console.log(req.user_id, "user_id");

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM material_composition_metals WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const mcm_id = ulid();
            // const code = await generateDynamicCode(client, 'MCM', 'material_composition_metals');

            const nextNumber = await generateDynamicCode(client, 'MCM', 'material_composition_metals');

            const code = formatCode('MCM', nextNumber);

            const query = `
                INSERT INTO material_composition_metals (mcm_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [mcm_id, code, name, req.user_id]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateMaterialCompositionMetal(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            console.log(req.user_id, "user_id");

            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {

                if (!item.name) {
                    throw new Error("Name is required");
                }


                const checkName = await client.query(
                    `SELECT 1 
                     FROM material_composition_metals 
                     WHERE name ILIKE $1 AND mcm_id <> $2`,
                    [item.name, item.mcm_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE material_composition_metals
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE mcm_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.mcm_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getMaterialCompositionMetalListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM material_composition_metals i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM material_composition_metals i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function materialCompositionMetalDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            // Check duplicate names inside payload
            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            // Check existing names in DB
            const existing = await client.query(
                `SELECT name FROM material_composition_metals WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            const rows: any[] = [];

            let nextNumber = await generateDynamicCode(client, 'MCM', 'material_composition_metals');

            for (const item of data) {

                if (!item.name) {
                    throw new Error("Name is required");
                }

                const code = formatCode('MCM', nextNumber);
                nextNumber++;

                rows.push({
                    mcm_id: ulid(),
                    code: code,
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO material_composition_metals (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteMaterialCompositionMetal(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { mcm_id } = req.body;

            await client.query(
                `DELETE FROM material_composition_metals WHERE mcm_id = $1`,
                [mcm_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getMaterialCompositionMetalDropDownnList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            const listQuery = `
                SELECT i.*
                FROM material_composition_metals i
                ORDER BY i.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// Material Composition Metal Type
export async function addMaterialCompositionMetalType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { mcm_id, code, name, description } = req.body;
            const mcmt_id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM material_composition_metal_type 
             WHERE code ILIKE $1 OR name ILIKE $2;`,
                [code, name]
            );

            if (checkExists.rows.length > 0) {
                const existing = checkExists.rows[0];
                if (existing.code.toLowerCase() === code.toLowerCase()) {
                    return res
                        .status(400)
                        .send(generateResponse(false, "Code is already used", 400, null));
                }
                if (existing.name.toLowerCase() === name.toLowerCase()) {
                    return res
                        .status(400)
                        .send(generateResponse(false, "Name is already used", 400, null));
                }
            }

            const query = `
            INSERT INTO material_composition_metal_type (mcmt_id, code, name, description,mcm_id)
            VALUES ($1, $2, $3, $4,$5)
            RETURNING *;
        `;
            const result = await client.query(query, [mcmt_id, code, name, description, mcm_id]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getMaterialCompositionMetalType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            const query = `
            SELECT 
            mcmt.code AS mcmt_code,
            mcmt.name AS mcmt_name,
            mcmt.description AS mcmt_description,
            mcm.mcm_id AS mcm_id,
            mcm.code AS mcm_code,
            mcm.name AS mcm_name,
            mcm.description AS mcm_description
            FROM material_composition_metal_type mcmt
            LEFT JOIN material_composition_metal mcm ON mcm.mcm_id = mcmt.mcm_id;`;

            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateMaterialCompositionMetalType(req: any, res: any) {
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
                UPDATE material_composition_metal_type 
                SET ${columnValuePairs}, update_date = NOW() 
                WHERE mcmt_id = $${values.length + 1} 
                RETURNING *;
            `;
                const result = await client.query(query, [...values, item.mcmt_id]);

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

export async function getMaterialCompositionMetalTypeList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;

            let whereClause = '';
            let orderByClause = 'ORDER BY i.created_date ASC';
            const values = [];

            if (searchValue) {
                values.push(`%${searchValue}%`);
                whereClause += ` AND (i.code ILIKE $${values.length} OR i.name ILIKE $${values.length})`;
            }

            const listQuery = `
                SELECT 
                    i.*,
                    mcm.mcm_id AS mcm_id,
                    mcm.code AS mcm_code,
                    mcm.name AS mcm_name,
                    mcm.description AS mcm_description
                FROM material_composition_metal_type i
                LEFT JOIN material_composition_metal mcm ON mcm.mcm_id = i.mcm_id
                WHERE 1=1 ${whereClause}
                ${orderByClause};
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM material_composition_metal_type i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function MaterialCompositionMetalTypeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            // 1️⃣ Validate each item and fetch mcm_id based on mcm_name
            const validatedData = [];

            for (const item of obj) {
                if (!item.mcm_name) {
                    return res.status(400).send(generateResponse(false, "mcm_name is required for all items", 400, null));
                }

                const mcmLookup = await client.query(
                    `SELECT mcm_id FROM material_composition_metal WHERE name = $1`,
                    [item.mcm_name]
                );

                if (mcmLookup.rows.length === 0) {
                    return res.status(400).send(
                        generateResponse(false, `Material composition metal not found for name: ${item.mcm_name}`, 400, null)
                    );
                }

                const mcm_id = mcmLookup.rows[0].mcm_id;

                validatedData.push({
                    mcmt_id: ulid(),
                    mcm_id: mcm_id,
                    code: item.code,
                    name: item.name,
                    description: item.description,
                    created_by: req.user_id,
                });
            }

            // 2️⃣ Prepare INSERT (bulk)
            const columns = Object.keys(validatedData[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            validatedData.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);

                const placeholder = rowValues.map(
                    (_, colIndex) => `$${rowIndex * rowValues.length + colIndex + 1}`
                );

                placeholders.push(`(${placeholder.join(', ')})`);
            });

            const insertQuery = `
                INSERT INTO material_composition_metal_type (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.status(200).send(
                generateResponse(true, "Added successfully", 200, result.rows)
            );

        } catch (error: any) {
            console.error("Error in MaterialCompositionMetalTypeDataSetup:", error);
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}


export async function deleteMaterialCompositionMetalType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { mcmt_id } = req.body;
            const query = `DELETE FROM material_composition_metal_type WHERE mcmt_id = $1;`;
            await client.query(query, [mcmt_id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// ===>
export async function addCountryIsoTwo(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            console.log(req.user_id, "user_id");

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM country_iso_two WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const citw_id = ulid();

            const nextNumber = await generateDynamicCode(client, 'CIT', 'country_iso_two');

            const code = formatCode('CIT', nextNumber);

            const query = `
                INSERT INTO country_iso_two (citw_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [citw_id, code, name, req.user_id]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateCountryIsoTwo(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            console.log(req.user_id, "user_id");

            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {

                if (!item.name) {
                    throw new Error("Name is required");
                }


                const checkName = await client.query(
                    `SELECT 1 
                     FROM country_iso_two 
                     WHERE name ILIKE $1 AND citw_id <> $2`,
                    [item.name, item.citw_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE country_iso_two
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE citw_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.citw_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getCountryIsoTwoListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM country_iso_two i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM country_iso_two i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function CountryIsoTwoDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            // Check duplicate names inside payload
            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            // Check existing names in DB
            const existing = await client.query(
                `SELECT name FROM country_iso_two WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            const rows: any[] = [];

            let nextNumber = await generateDynamicCode(client, 'CIT', 'country_iso_two');

            for (const item of data) {

                if (!item.name) {
                    throw new Error("Name is required");
                }

                const code = formatCode('CIT', nextNumber);
                nextNumber++;

                rows.push({
                    citw_id: ulid(),
                    code: code,
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO country_iso_two (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteCountryIsoTwo(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { citw_id } = req.body;

            await client.query(
                `DELETE FROM country_iso_two WHERE citw_id = $1`,
                [citw_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getCountryIsoTwoDropDownnList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            const listQuery = `
                SELECT i.*
                FROM country_iso_two i
                ORDER BY i.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>

export async function addCountryIsoThree(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            console.log(req.user_id, "user_id");

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM country_iso_three WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const cith_id = ulid();

            const nextNumber = await generateDynamicCode(client, 'CITH', 'country_iso_three');

            const code = formatCode('CITH', nextNumber);

            const query = `
                INSERT INTO country_iso_three (cith_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [cith_id, code, name, req.user_id]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateCountryIsoThree(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            console.log(req.user_id, "user_id");

            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {

                if (!item.name) {
                    throw new Error("Name is required");
                }


                const checkName = await client.query(
                    `SELECT 1 
                     FROM country_iso_three 
                     WHERE name ILIKE $1 AND cith_id <> $2`,
                    [item.name, item.cith_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE country_iso_three
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE cith_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.cith_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getCountryIsoThreeListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM country_iso_three i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM country_iso_three i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function CountryIsoThreeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            // Check duplicate names inside payload
            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            // Check existing names in DB
            const existing = await client.query(
                `SELECT name FROM country_iso_three WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            const rows: any[] = [];

            let nextNumber = await generateDynamicCode(client, 'CITH', 'country_iso_three');

            for (const item of data) {

                if (!item.name) {
                    throw new Error("Name is required");
                }

                const code = formatCode('CITH', nextNumber);
                nextNumber++;

                rows.push({
                    cith_id: ulid(),
                    code: code,
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO country_iso_three (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteCountryIsoThree(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { cith_id } = req.body;

            await client.query(
                `DELETE FROM country_iso_three WHERE cith_id = $1`,
                [cith_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getCountryIsoThreeDropDownnList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            const listQuery = `
                SELECT i.*
                FROM country_iso_three i
                ORDER BY i.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>

export async function addScopeTwoMethod(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM scope_two_method WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const stm_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'STM', 'scope_two_method');
            const code = formatCode('STM', nextNumber);

            const query = `
                INSERT INTO scope_two_method (stm_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                stm_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateScopeTwoMethod(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1 
                     FROM scope_two_method 
                     WHERE name ILIKE $1 AND stm_id <> $2`,
                    [item.name, item.stm_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE scope_two_method
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE stm_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.stm_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getScopeTwoMethodListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM scope_two_method i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM scope_two_method i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function ScopeTwoMethodDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM scope_two_method WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'STM', 'scope_two_method');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    stm_id: ulid(),
                    code: formatCode('STM', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO scope_two_method (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteScopeTwoMethod(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { stm_id } = req.body;

            await client.query(
                `DELETE FROM scope_two_method WHERE stm_id = $1`,
                [stm_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getScopeTwoMethodDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM scope_two_method
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}
// ===>

export async function addMethodType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM method_type WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const mt_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'MT', 'method_type');
            const code = formatCode('MT', nextNumber);

            const query = `
                INSERT INTO method_type (mt_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                mt_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateMethodType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1 
                     FROM method_type 
                     WHERE name ILIKE $1 AND mt_id <> $2`,
                    [item.name, item.mt_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE method_type
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE mt_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.mt_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getMethodTypeListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM method_type i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM method_type i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function MethodTypeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM method_type WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'MT', 'method_type');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    mt_id: ulid(),
                    code: formatCode('MT', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO method_type (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteMethodType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { mt_id } = req.body;

            await client.query(
                `DELETE FROM method_type WHERE mt_id = $1`,
                [mt_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getMethodTypeDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM method_type
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addTransportMode(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM transport_modes WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const tm_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'TM', 'transport_modes');
            const code = formatCode('TM', nextNumber);

            const query = `
                INSERT INTO transport_modes (tm_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                tm_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}
export async function updateTransportMode(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM transport_modes
                     WHERE name ILIKE $1 AND tm_id <> $2`,
                    [item.name, item.tm_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE transport_modes
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE tm_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.tm_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getTransportModeListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM transport_modes i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM transport_modes i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function TransportModeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM transport_modes WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'TM', 'transport_modes');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    tm_id: ulid(),
                    code: formatCode('TM', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO transport_modes (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteTransportMode(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { tm_id } = req.body;

            await client.query(
                `DELETE FROM transport_modes WHERE tm_id = $1`,
                [tm_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getTransportModeDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM transport_modes
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addTransportRoute(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM transport_routes WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const tr_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'TR', 'transport_routes');
            const code = formatCode('TR', nextNumber);

            const query = `
                INSERT INTO transport_routes (tr_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                tr_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}
export async function updateTransportRoute(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM transport_routes
                     WHERE name ILIKE $1 AND tr_id <> $2`,
                    [item.name, item.tr_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE transport_routes
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE tr_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.tr_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getTransportRouteListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM transport_routes i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM transport_routes i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function TransportRouteDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM transport_routes WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'TR', 'transport_routes');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    tr_id: ulid(),
                    code: formatCode('TR', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO transport_routes (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteTransportRoute(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { tr_id } = req.body;

            await client.query(
                `DELETE FROM transport_routes WHERE tr_id = $1`,
                [tr_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getTransportRouteDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM transport_routes
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addPackagingLevel(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM packaging_level WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const pl_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'PL', 'packaging_level');
            const code = formatCode('PL', nextNumber);

            const query = `
                INSERT INTO packaging_level (pl_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                pl_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updatePackagingLevel(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM packaging_level
                     WHERE name ILIKE $1 AND pl_id <> $2`,
                    [item.name, item.pl_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE packaging_level
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE pl_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.pl_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getPackagingLevelListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM packaging_level i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM packaging_level i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function PackagingLevelDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM packaging_level WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'PL', 'packaging_level');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    pl_id: ulid(),
                    code: formatCode('PL', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO packaging_level (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deletePackagingLevel(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { pl_id } = req.body;

            await client.query(
                `DELETE FROM packaging_level WHERE pl_id = $1`,
                [pl_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getPackagingLevelDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM packaging_level
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addWasteTreatment(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM waste_treatment WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const wt_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'WT', 'waste_treatment');
            const code = formatCode('WT', nextNumber);

            const query = `
                INSERT INTO waste_treatment (wt_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                wt_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateWasteTreatment(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM waste_treatment
                     WHERE name ILIKE $1 AND wt_id <> $2`,
                    [item.name, item.wt_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE waste_treatment
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE wt_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.wt_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getWasteTreatmentListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM waste_treatment i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM waste_treatment i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function WasteTreatmentDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM waste_treatment WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'WT', 'waste_treatment');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    wt_id: ulid(),
                    code: formatCode('WT', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO waste_treatment (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteWasteTreatment(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { wt_id } = req.body;

            await client.query(
                `DELETE FROM waste_treatment WHERE wt_id = $1`,
                [wt_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getWasteTreatmentDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM waste_treatment
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addRefrigerentType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM refrigerent_type WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const rt_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'RT', 'refrigerent_type');
            const code = formatCode('RT', nextNumber);

            const query = `
                INSERT INTO refrigerent_type (rt_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                rt_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateRefrigerentType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM refrigerent_type
                     WHERE name ILIKE $1 AND rt_id <> $2`,
                    [item.name, item.rt_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE refrigerent_type
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE rt_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.rt_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getRefrigerentTypeListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM refrigerent_type i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM refrigerent_type i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function RefrigerentTypeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM refrigerent_type WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'RT', 'refrigerent_type');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    rt_id: ulid(),
                    code: formatCode('RT', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO refrigerent_type (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteRefrigerentType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { rt_id } = req.body;

            await client.query(
                `DELETE FROM refrigerent_type WHERE rt_id = $1`,
                [rt_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getRefrigerentTypeDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM refrigerent_type
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addLiquidFuelUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM liquid_fuel_unit WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const lfu_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'LFU', 'liquid_fuel_unit');
            const code = formatCode('LFU', nextNumber);

            const query = `
                INSERT INTO liquid_fuel_unit (lfu_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                lfu_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateLiquidFuelUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM liquid_fuel_unit
                     WHERE name ILIKE $1 AND lfu_id <> $2`,
                    [item.name, item.lfu_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE liquid_fuel_unit
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE lfu_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.lfu_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getLiquidFuelUnitListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM liquid_fuel_unit i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM liquid_fuel_unit i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function LiquidFuelUnitDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM liquid_fuel_unit WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'LFU', 'liquid_fuel_unit');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    lfu_id: ulid(),
                    code: formatCode('LFU', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO liquid_fuel_unit (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteLiquidFuelUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { lfu_id } = req.body;

            await client.query(
                `DELETE FROM liquid_fuel_unit WHERE lfu_id = $1`,
                [lfu_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getLiquidFuelUnitDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM liquid_fuel_unit
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addGaseousFuelUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM gaseous_fuel_unit WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const gfu_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'GFU', 'gaseous_fuel_unit');
            const code = formatCode('GFU', nextNumber);

            const query = `
                INSERT INTO gaseous_fuel_unit (gfu_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                gfu_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateGaseousFuelUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM gaseous_fuel_unit
                     WHERE name ILIKE $1 AND gfu_id <> $2`,
                    [item.name, item.gfu_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE gaseous_fuel_unit
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE gfu_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.gfu_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getGaseousFuelUnitListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM gaseous_fuel_unit i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM gaseous_fuel_unit i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function GaseousFuelUnitDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM gaseous_fuel_unit WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'GFU', 'gaseous_fuel_unit');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    gfu_id: ulid(),
                    code: formatCode('GFU', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO gaseous_fuel_unit (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteGaseousFuelUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { gfu_id } = req.body;

            await client.query(
                `DELETE FROM gaseous_fuel_unit WHERE gfu_id = $1`,
                [gfu_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getGaseousFuelUnitDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM gaseous_fuel_unit
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addSolidFuelUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM solid_fuel_unit WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const sfu_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'SFU', 'solid_fuel_unit');
            const code = formatCode('SFU', nextNumber);

            const query = `
                INSERT INTO solid_fuel_unit (sfu_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                sfu_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateSolidFuelUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM solid_fuel_unit
                     WHERE name ILIKE $1 AND sfu_id <> $2`,
                    [item.name, item.sfu_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE solid_fuel_unit
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE sfu_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.sfu_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getSolidFuelUnitListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM solid_fuel_unit i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM solid_fuel_unit i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function SolidFuelUnitDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM solid_fuel_unit WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'SFU', 'solid_fuel_unit');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    sfu_id: ulid(),
                    code: formatCode('SFU', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO solid_fuel_unit (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteSolidFuelUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { sfu_id } = req.body;

            await client.query(
                `DELETE FROM solid_fuel_unit WHERE sfu_id = $1`,
                [sfu_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getSolidFuelUnitDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM solid_fuel_unit
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addProcessSpecificEnergy(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM process_specific_energy WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const pse_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'PSE', 'process_specific_energy');
            const code = formatCode('PSE', nextNumber);

            const query = `
                INSERT INTO process_specific_energy (pse_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                pse_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateProcessSpecificEnergy(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM process_specific_energy
                     WHERE name ILIKE $1 AND pse_id <> $2`,
                    [item.name, item.pse_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE process_specific_energy
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE pse_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.pse_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getProcessSpecificEnergyListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM process_specific_energy i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM process_specific_energy i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function ProcessSpecificEnergyDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM process_specific_energy WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'PSE', 'process_specific_energy');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    pse_id: ulid(),
                    code: formatCode('PSE', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO process_specific_energy (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteProcessSpecificEnergy(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { pse_id } = req.body;

            await client.query(
                `DELETE FROM process_specific_energy WHERE pse_id = $1`,
                [pse_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getProcessSpecificEnergyDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM process_specific_energy
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addFuelType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM fuel_types WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const ft_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'FT', 'fuel_types');
            const code = formatCode('FT', nextNumber);

            const query = `
                INSERT INTO fuel_types (ft_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                ft_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateFuelType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM fuel_types
                     WHERE name ILIKE $1 AND ft_id <> $2`,
                    [item.name, item.ft_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE fuel_types
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE ft_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.ft_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getFuelTypeListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM fuel_types i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM fuel_types i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function FuelTypeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM fuel_types WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'FT', 'fuel_types');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    ft_id: ulid(),
                    code: formatCode('FT', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO fuel_types (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteFuelType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { ft_id } = req.body;

            await client.query(
                `DELETE FROM fuel_types WHERE ft_id = $1`,
                [ft_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getFuelTypeDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM fuel_types
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ======>
export async function addSubFuelType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { ft_id, name } = req.body;

            if (!ft_id || !name) {
                throw new Error("Fuel Type and Name are required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM sub_fuel_types WHERE name ILIKE $1 AND ft_id = $2`,
                [name, ft_id]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const sft_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'SFT', 'sub_fuel_types');
            const code = formatCode('SFT', nextNumber);

            const query = `
                INSERT INTO sub_fuel_types (sft_id, ft_id, code, name, created_by)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;

            const result = await client.query(query, [
                sft_id,
                ft_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}


export async function updateSubFuelType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name || !item.ft_id) {
                    throw new Error("Fuel Type and Name are required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM sub_fuel_types
                     WHERE name ILIKE $1
                       AND ft_id = $2
                       AND sft_id <> $3`,
                    [item.name, item.ft_id, item.sft_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE sub_fuel_types
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE sft_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.sft_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getSubFuelTypeListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue, ft_id } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (ft_id) {
                values.push(ft_id);
                whereClause += ` AND s.ft_id = $${values.length}`;
            }

            if (searchValue) {
                values.push(`%${searchValue}%`);
                whereClause += `
                    AND (s.code ILIKE $${values.length}
                    OR s.name ILIKE $${values.length})
                `;
            }

            const listQuery = `
                SELECT s.*, f.name AS fuel_type_name
                FROM sub_fuel_types s
                LEFT JOIN fuel_types f ON f.ft_id = s.ft_id
                WHERE 1=1 ${whereClause}
                ORDER BY s.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM sub_fuel_types s
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function SubFuelTypeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            // Collect fuel type names
            const fuelTypeNames = [...new Set(
                data.map(d => d.fuel_type_name.toLowerCase())
            )];

            const fuelTypes = await client.query(
                `SELECT ft_id, name FROM fuel_types WHERE name ILIKE ANY($1)`,
                [fuelTypeNames]
            );

            if (fuelTypes.rowCount !== fuelTypeNames.length) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more fuel types not found", 400, null));
            }

            const fuelTypeMap = new Map(
                fuelTypes.rows.map((f: any) => [f.name.toLowerCase(), f.ft_id])
            );

            let nextNumber = await generateDynamicCode(client, 'SFT', 'sub_fuel_types');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name || !item.fuel_type_name) {
                    throw new Error("Fuel Type Name and Sub Fuel Type Name are required");
                }

                rows.push({
                    sft_id: ulid(),
                    ft_id: fuelTypeMap.get(item.fuel_type_name.toLowerCase()),
                    code: formatCode('SFT', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO sub_fuel_types (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteSubFuelType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { sft_id } = req.body;

            await client.query(
                `DELETE FROM sub_fuel_types WHERE sft_id = $1`,
                [sft_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getSubFuelTypeDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT s.sft_id, s.name, s.ft_id, f.name AS fuel_type_name
                FROM sub_fuel_types s
                LEFT JOIN fuel_types f ON f.ft_id = s.ft_id
                ORDER BY s.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getSubFuelTypeDropDownListUsingId(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT s.sft_id, s.name, s.ft_id
                FROM sub_fuel_types s
                WHERE s.ft_id = $1;
            `;

            const listResult = await client.query(listQuery, [req.query.ft_id]);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addVehicleType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM vehicle_types WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const vt_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'VT', 'vehicle_types');
            const code = formatCode('VT', nextNumber);

            const query = `
                INSERT INTO vehicle_types (vt_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                vt_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateVehicleType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM vehicle_types
                     WHERE name ILIKE $1 AND vt_id <> $2`,
                    [item.name, item.vt_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE vehicle_types
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE vt_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.vt_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getVehicleTypeListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM vehicle_types i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM vehicle_types i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function VehicleTypeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM vehicle_types WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'VT', 'vehicle_types');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    vt_id: ulid(),
                    code: formatCode('VT', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO vehicle_types (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteVehicleType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { vt_id } = req.body;

            await client.query(
                `DELETE FROM vehicle_types WHERE vt_id = $1`,
                [vt_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getVehicleTypeDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM vehicle_types
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addEnergySource(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM energy_source WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const es_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'ES', 'energy_source');
            const code = formatCode('ES', nextNumber);

            const query = `
                INSERT INTO energy_source (es_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                es_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateEnergySource(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM energy_source
                     WHERE name ILIKE $1 AND es_id <> $2`,
                    [item.name, item.es_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE energy_source
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE es_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.es_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getEnergySourceListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM energy_source i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM energy_source i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function EnergySourceDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM energy_source WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'ES', 'energy_source');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    es_id: ulid(),
                    code: formatCode('ES', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO energy_source (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteEnergySource(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { es_id } = req.body;

            await client.query(
                `DELETE FROM energy_source WHERE es_id = $1`,
                [es_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getEnergySourceDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM energy_source
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
async function getEnergySourceId(client: any, energy_source_name: string) {
    const result = await client.query(
        `SELECT es_id FROM energy_source WHERE name ILIKE $1`,
        [energy_source_name]
    );

    if (result.rowCount === 0) {
        throw new Error(`Energy source '${energy_source_name}' not found`);
    }

    return result.rows[0].es_id;
}

// export async function addEnergyType(req: any, res: any) {
//     return withClient(async (client: any) => {
//         try {
//             const { name, energy_source_id } = req.body;

//             if (!name) {
//                 throw new Error("Name is required");
//             }

//             const checkName = await client.query(
//                 `SELECT 1 FROM energy_type WHERE name ILIKE $1`,
//                 [name]
//             );

//             if (checkName.rowCount > 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "Name already exists", 400, null));
//             }

//             const et_id = ulid();
//             const nextNumber = await generateDynamicCode(client, 'ET', 'energy_type');
//             const code = formatCode('ET', nextNumber);

//             const query = `
//                 INSERT INTO energy_type (et_id, code, name, created_by)
//                 VALUES ($1, $2, $3, $4)
//                 RETURNING *;
//             `;

//             const result = await client.query(query, [
//                 et_id,
//                 code,
//                 name,
//                 req.user_id
//             ]);

//             return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
//         } catch (error: any) {
//             return res.send(generateResponse(false, error.message, 400, null));
//         }
//     });
// }

export async function addEnergyType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name, es_id } = req.body;

            if (!name || !es_id) {
                throw new Error("Name and es_id are required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM energy_type WHERE name ILIKE $1 AND es_id = $2`,
                [name, es_id]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const et_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'ET', 'energy_type');
            const code = formatCode('ET', nextNumber);

            const query = `
                INSERT INTO energy_type (et_id, es_id, code, name, created_by)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;

            const result = await client.query(query, [
                et_id,
                es_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateEnergyType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM energy_type
                     WHERE name ILIKE $1 AND et_id <> $2`,
                    [item.name, item.et_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE energy_type
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW(),
                        es_id = $4
                    WHERE et_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.et_id,
                    item.es_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getEnergyTypeListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*, es.name AS energy_source_name
                FROM energy_type i
                LEFT JOIN energy_source es ON es.es_id = i.es_id
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM energy_type i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// export async function EnergyTypeDataSetup(req: any, res: any) {
//     return withClient(async (client: any) => {
//         try {
//             const data = req.body;

//             if (!Array.isArray(data) || data.length === 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "Invalid input array", 400, null));
//             }

//             const names = data.map(d => d.name.toLowerCase());
//             const duplicatePayloadNames = names.filter(
//                 (n, i) => names.indexOf(n) !== i
//             );

//             if (duplicatePayloadNames.length > 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "Duplicate names in payload", 400, null));
//             }

//             const existing = await client.query(
//                 `SELECT name FROM energy_type WHERE name ILIKE ANY($1)`,
//                 [names]
//             );

//             if (existing.rowCount > 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "One or more names already exist", 400, null));
//             }

//             let nextNumber = await generateDynamicCode(client, 'ET', 'energy_type');
//             const rows: any[] = [];

//             for (const item of data) {
//                 if (!item.name) {
//                     throw new Error("Name is required");
//                 }

//                 rows.push({
//                     et_id: ulid(),
//                     code: formatCode('ET', nextNumber++),
//                     name: item.name,
//                     created_by: req.user_id
//                 });
//             }

//             const columns = Object.keys(rows[0]);
//             const values: any[] = [];
//             const placeholders: string[] = [];

//             rows.forEach((row, rowIndex) => {
//                 const rowValues = Object.values(row);
//                 values.push(...rowValues);
//                 placeholders.push(
//                     `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
//                 );
//             });

//             const insertQuery = `
//                 INSERT INTO energy_type (${columns.join(', ')})
//                 VALUES ${placeholders.join(', ')}
//                 RETURNING *;
//             `;

//             const result = await client.query(insertQuery, values);

//             return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
//         } catch (error: any) {
//             return res
//                 .status(500)
//                 .send(generateResponse(false, error.message, 500, null));
//         }
//     });
// }
export async function EnergyTypeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM energy_type WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'ET', 'energy_type');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name || !item.energy_source_name) {
                    throw new Error("Name and energy_source_name are required");
                }

                const es_id = await getEnergySourceId(client, item.energy_source_name);

                rows.push({
                    et_id: ulid(),
                    es_id,
                    code: formatCode('ET', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO energy_type (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteEnergyType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { et_id } = req.body;

            await client.query(
                `DELETE FROM energy_type WHERE et_id = $1`,
                [et_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getEnergyTypeDropDownList(req: any, res: any) {
    const { es_id } = req.query
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM energy_type
                WHERE energy_type.es_id =$1;
            `;

            const listResult = await client.query(listQuery, [es_id]);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addEnergyUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM energy_unit WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const eu_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'EU', 'energy_unit');
            const code = formatCode('EU', nextNumber);

            const query = `
                INSERT INTO energy_unit (eu_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                eu_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateEnergyUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM energy_unit
                     WHERE name ILIKE $1 AND eu_id <> $2`,
                    [item.name, item.eu_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE energy_unit
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE eu_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.eu_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getEnergyUnitListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM energy_unit i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM energy_unit i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function EnergyUnitDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM energy_unit WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'EU', 'energy_unit');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    eu_id: ulid(),
                    code: formatCode('EU', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO energy_unit (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteEnergyUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { eu_id } = req.body;

            await client.query(
                `DELETE FROM energy_unit WHERE eu_id = $1`,
                [eu_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getEnergyUnitDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM energy_unit
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addEFUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM ef_unit WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const efu_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'EFU', 'ef_unit');
            const code = formatCode('EFU', nextNumber);

            const query = `
                INSERT INTO ef_unit (efu_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                efu_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateEFUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM ef_unit
                     WHERE name ILIKE $1 AND efu_id <> $2`,
                    [item.name, item.efu_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE ef_unit
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE efu_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.efu_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getEFUnitListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM ef_unit i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM ef_unit i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function EFUnitDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM ef_unit WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'EFU', 'ef_unit');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    efu_id: ulid(),
                    code: formatCode('EFU', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO ef_unit (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteEFUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { efu_id } = req.body;

            await client.query(
                `DELETE FROM ef_unit WHERE efu_id = $1`,
                [efu_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getEFUnitDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM ef_unit
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addAllocationMethod(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM allocation_method WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const am_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'AM', 'allocation_method');
            const code = formatCode('AM', nextNumber);

            const query = `
                INSERT INTO allocation_method (am_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                am_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateAllocationMethod(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM allocation_method
                     WHERE name ILIKE $1 AND am_id <> $2`,
                    [item.name, item.am_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE allocation_method
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE am_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.am_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getAllocationMethodListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM allocation_method i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM allocation_method i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function AllocationMethodDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM allocation_method WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'AM', 'allocation_method');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    am_id: ulid(),
                    code: formatCode('AM', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO allocation_method (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteAllocationMethod(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { am_id } = req.body;

            await client.query(
                `DELETE FROM allocation_method WHERE am_id = $1`,
                [am_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getAllocationMethodDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM allocation_method
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ===>
export async function addCertificateType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;

            if (!name) {
                throw new Error("Name is required");
            }

            const checkName = await client.query(
                `SELECT 1 FROM certificate_type WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Name already exists", 400, null));
            }

            const ct_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'CFT', 'certificate_type');
            const code = formatCode('CFT', nextNumber);

            const query = `
                INSERT INTO certificate_type (ct_id, code, name, created_by)
                VALUES ($1, $2, $3, $4)
                RETURNING *;
            `;

            const result = await client.query(query, [
                ct_id,
                code,
                name,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateCertificateType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                const checkName = await client.query(
                    `SELECT 1
                     FROM certificate_type
                     WHERE name ILIKE $1 AND ct_id <> $2`,
                    [item.name, item.ct_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Name '${item.name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE certificate_type
                    SET name = $1,
                        updated_by = $2,
                        update_date = NOW()
                    WHERE ct_id = $3
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.name,
                    req.user_id,
                    item.ct_id
                ]);

                if (result.rows.length > 0) {
                    updatedRows.push(result.rows[0]);
                }
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getCertificateTypeListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM certificate_type i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM certificate_type i
                WHERE 1=1 ${whereClause};
            `;

            const totalCount = await client.query(countQuery, values);
            const listResult = await client.query(listQuery, values);

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: totalCount.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function CertificateTypeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            const names = data.map(d => d.name.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            const existing = await client.query(
                `SELECT name FROM certificate_type WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            let nextNumber = await generateDynamicCode(client, 'CFT', 'certificate_type');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) {
                    throw new Error("Name is required");
                }

                rows.push({
                    ct_id: ulid(),
                    code: formatCode('CFT', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const insertQuery = `
                INSERT INTO certificate_type (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteCertificateType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { ct_id } = req.body;

            await client.query(
                `DELETE FROM certificate_type WHERE ct_id = $1`,
                [ct_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getCertificateTypeDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT *
                FROM certificate_type
                ORDER BY created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ====>
export async function addVerificationStatus(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;
            if (!name) throw new Error("Name is required");

            const checkName = await client.query(
                `SELECT 1 FROM verification_status WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "Name already exists", 400, null)
                );
            }

            const vs_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'VS', 'verification_status');
            const code = formatCode('VS', nextNumber);

            const result = await client.query(
                `INSERT INTO verification_status (vs_id, code, name, created_by)
                 VALUES ($1, $2, $3, $4) RETURNING *`,
                [vs_id, code, name, req.user_id]
            );

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateVerificationStatus(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatedRows: any[] = [];

            for (const item of req.body) {
                if (!item.name) throw new Error("Name is required");

                const checkName = await client.query(
                    `SELECT 1 FROM verification_status
                     WHERE name ILIKE $1 AND vs_id <> $2`,
                    [item.name, item.vs_id]
                );

                if (checkName.rowCount > 0) {
                    return res.status(400).send(
                        generateResponse(false, `Name '${item.name}' already exists`, 400, null)
                    );
                }

                const result = await client.query(
                    `UPDATE verification_status
                     SET name=$1, updated_by=$2, update_date=NOW()
                     WHERE vs_id=$3 RETURNING *`,
                    [item.name, req.user_id, item.vs_id]
                );

                if (result.rows.length) updatedRows.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getVerificationStatusListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            const values: any[] = [];
            let whereClause = '';

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const list = await client.query(
                `SELECT i.* FROM verification_status i
                 WHERE 1=1 ${whereClause}
                 ORDER BY created_date ASC`,
                values
            );

            const count = await client.query(
                `SELECT COUNT(*) FROM verification_status i
                 WHERE 1=1 ${whereClause}`,
                values
            );

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: count.rows[0].count,
                list: list.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function VerificationStatusDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            if (!Array.isArray(data) || !data.length) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            const names = data.map(d => d.name.toLowerCase());
            const existing = await client.query(
                `SELECT name FROM verification_status WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "One or more names already exist", 400, null)
                );
            }

            let nextNumber = await generateDynamicCode(client, 'VS', 'verification_status');
            const rows = data.map(item => ({
                vs_id: ulid(),
                code: formatCode('VS', nextNumber++),
                name: item.name,
                created_by: req.user_id
            }));

            const cols = Object.keys(rows[0]);
            const vals: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((r, i) => {
                const rv = Object.values(r);
                vals.push(...rv);
                placeholders.push(
                    `(${rv.map((_, j) => `$${i * rv.length + j + 1}`).join(', ')})`
                );
            });

            const result = await client.query(
                `INSERT INTO verification_status (${cols.join(',')})
                 VALUES ${placeholders.join(',')} RETURNING *`,
                vals
            );

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteVerificationStatus(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query(
            `DELETE FROM verification_status WHERE vs_id=$1`,
            [req.body.vs_id]
        );
        return res.send(generateResponse(true, "Deleted successfully", 200, null));
    });
}

export async function getVerificationStatusDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        const result = await client.query(
            `SELECT * FROM verification_status ORDER BY created_date ASC`
        );
        return res.send(generateResponse(true, "List fetched successfully", 200, result.rows));
    });
}

// =====>
export async function addReportingStandard(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;
            if (!name) throw new Error("Name is required");

            const checkName = await client.query(
                `SELECT 1 FROM reporting_standard WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "Name already exists", 400, null)
                );
            }

            const rs_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'RS', 'reporting_standard');
            const code = formatCode('RS', nextNumber);

            const result = await client.query(
                `INSERT INTO reporting_standard (rs_id, code, name, created_by)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [rs_id, code, name, req.user_id]
            );

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateReportingStandard(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatedRows: any[] = [];

            for (const item of req.body) {
                if (!item.name) throw new Error("Name is required");

                const checkName = await client.query(
                    `SELECT 1 FROM reporting_standard
                     WHERE name ILIKE $1 AND rs_id <> $2`,
                    [item.name, item.rs_id]
                );

                if (checkName.rowCount > 0) {
                    return res.status(400).send(
                        generateResponse(false, `Name '${item.name}' already exists`, 400, null)
                    );
                }

                const result = await client.query(
                    `UPDATE reporting_standard
                     SET name = $1,
                         updated_by = $2,
                         update_date = NOW()
                     WHERE rs_id = $3
                     RETURNING *`,
                    [item.name, req.user_id, item.rs_id]
                );

                if (result.rows.length) updatedRows.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getReportingStandardListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listResult = await client.query(
                `SELECT i.*
                 FROM reporting_standard i
                 WHERE 1=1 ${whereClause}
                 ORDER BY i.created_date ASC`,
                values
            );

            const countResult = await client.query(
                `SELECT COUNT(*)
                 FROM reporting_standard i
                 WHERE 1=1 ${whereClause}`,
                values
            );

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: countResult.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function ReportingStandardDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            const names = data.map(d => d.name.toLowerCase());
            const existing = await client.query(
                `SELECT name FROM reporting_standard WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "One or more names already exist", 400, null)
                );
            }

            let nextNumber = await generateDynamicCode(client, 'RS', 'reporting_standard');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                rows.push({
                    rs_id: ulid(),
                    code: formatCode('RS', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const result = await client.query(
                `INSERT INTO reporting_standard (${columns.join(', ')})
                 VALUES ${placeholders.join(', ')}
                 RETURNING *`,
                values
            );

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function deleteReportingStandard(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query(
            `DELETE FROM reporting_standard WHERE rs_id = $1`,
            [req.body.rs_id]
        );

        return res.send(generateResponse(true, "Deleted successfully", 200, null));
    });
}

export async function getReportingStandardDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        const result = await client.query(
            `SELECT * FROM reporting_standard ORDER BY created_date ASC`
        );

        return res.send(generateResponse(true, "List fetched successfully", 200, result.rows));
    });
}

// =======>
export async function addLifeCycleBoundary(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;
            if (!name) throw new Error("Name is required");

            const checkName = await client.query(
                `SELECT 1 FROM life_cycle_boundary WHERE name ILIKE $1`,
                [name]
            );

            if (checkName.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "Name already exists", 400, null)
                );
            }

            const lcb_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'LCB', 'life_cycle_boundary');
            const code = formatCode('LCB', nextNumber);

            const result = await client.query(
                `INSERT INTO life_cycle_boundary (lcb_id, code, name, created_by)
                 VALUES ($1, $2, $3, $4)
                 RETURNING *`,
                [lcb_id, code, name, req.user_id]
            );

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateLifeCycleBoundary(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatedRows: any[] = [];

            for (const item of req.body) {
                if (!item.name) throw new Error("Name is required");

                const checkName = await client.query(
                    `SELECT 1 FROM life_cycle_boundary
                     WHERE name ILIKE $1 AND lcb_id <> $2`,
                    [item.name, item.lcb_id]
                );

                if (checkName.rowCount > 0) {
                    return res.status(400).send(
                        generateResponse(false, `Name '${item.name}' already exists`, 400, null)
                    );
                }

                const result = await client.query(
                    `UPDATE life_cycle_boundary
                     SET name = $1,
                         updated_by = $2,
                         update_date = NOW()
                     WHERE lcb_id = $3
                     RETURNING *`,
                    [item.name, req.user_id, item.lcb_id]
                );

                if (result.rows.length) updatedRows.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getLifeCycleBoundaryListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listResult = await client.query(
                `SELECT i.*
                 FROM life_cycle_boundary i
                 WHERE 1=1 ${whereClause}
                 ORDER BY i.created_date ASC`,
                values
            );

            const countResult = await client.query(
                `SELECT COUNT(*)
                 FROM life_cycle_boundary i
                 WHERE 1=1 ${whereClause}`,
                values
            );

            return res.send(generateResponse(true, "List fetched successfully", 200, {
                totalCount: countResult.rows[0].count,
                list: listResult.rows
            }));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function LifeCycleBoundaryDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            const names = data.map(d => d.name.toLowerCase());
            const existing = await client.query(
                `SELECT name FROM life_cycle_boundary WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "One or more names already exist", 400, null)
                );
            }

            let nextNumber = await generateDynamicCode(client, 'LCB', 'life_cycle_boundary');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                rows.push({
                    lcb_id: ulid(),
                    code: formatCode('LCB', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const result = await client.query(
                `INSERT INTO life_cycle_boundary (${columns.join(', ')})
                 VALUES ${placeholders.join(', ')}
                 RETURNING *`,
                values
            );

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function deleteLifeCycleBoundary(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query(
            `DELETE FROM life_cycle_boundary WHERE lcb_id = $1`,
            [req.body.lcb_id]
        );

        return res.send(generateResponse(true, "Deleted successfully", 200, null));
    });
}

export async function getLifeCycleBoundaryDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        const result = await client.query(
            `SELECT * FROM life_cycle_boundary ORDER BY created_date ASC`
        );

        return res.send(generateResponse(true, "List fetched successfully", 200, result.rows));
    });
}

// ======>

export async function addLifeCycleStageOfProduct(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;
            if (!name) throw new Error("Name is required");

            const exists = await client.query(
                `SELECT 1 FROM life_cycle_stages_of_product WHERE name ILIKE $1`,
                [name]
            );
            if (exists.rowCount > 0) {
                return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
            }

            const lcsp_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'LCSP', 'life_cycle_stages_of_product');
            const code = formatCode('LCSP', nextNumber);

            const result = await client.query(
                `INSERT INTO life_cycle_stages_of_product (lcsp_id, code, name, created_by)
                 VALUES ($1,$2,$3,$4) RETURNING *`,
                [lcsp_id, code, name, req.user_id]
            );

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function updateLifeCycleStageOfProduct(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            const updated: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                const exists = await client.query(
                    `SELECT 1 FROM life_cycle_stages_of_product 
                     WHERE name ILIKE $1 AND lcsp_id <> $2`,
                    [item.name, item.lcsp_id]
                );
                if (exists.rowCount > 0) {
                    return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
                }

                const result = await client.query(
                    `UPDATE life_cycle_stages_of_product
                     SET name=$1, updated_by=$2, update_date=NOW()
                     WHERE lcsp_id=$3 RETURNING *`,
                    [item.name, req.user_id, item.lcsp_id]
                );
                updated.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updated));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function getLifeCycleStageOfProductListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        const { searchValue } = req.query;
        const values: any[] = [];
        let where = '';

        if (searchValue) {
            where = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
            values.push(`%${searchValue}%`);
        }

        const list = await client.query(
            `SELECT i.* FROM life_cycle_stages_of_product i WHERE 1=1 ${where} ORDER BY created_date ASC`,
            values
        );

        const count = await client.query(
            `SELECT COUNT(*) FROM life_cycle_stages_of_product i WHERE 1=1 ${where}`,
            values
        );

        return res.send(generateResponse(true, "List fetched successfully", 200, {
            totalCount: count.rows[0].count,
            list: list.rows
        }));
    });
}

export async function LifeCycleStageOfProductDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            const names = data.map(d => d.name.toLowerCase());
            const existing = await client.query(
                `SELECT name FROM life_cycle_stages_of_product WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "One or more names already exist", 400, null)
                );
            }

            let nextNumber = await generateDynamicCode(client, 'LCSP', 'life_cycle_stages_of_product');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                rows.push({
                    lcsp_id: ulid(),
                    code: formatCode('LCSP', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const result = await client.query(
                `INSERT INTO life_cycle_stages_of_product (${columns.join(', ')})
                 VALUES ${placeholders.join(', ')}
                 RETURNING *`,
                values
            );

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}


export async function deleteLifeCycleStageOfProduct(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query(
            `DELETE FROM life_cycle_stages_of_product WHERE lcsp_id=$1`,
            [req.body.lcsp_id]
        );
        return res.send(generateResponse(true, "Deleted successfully", 200, null));
    });
}

export async function getLifeCycleStageOfProductDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        const result = await client.query(
            `SELECT * FROM life_cycle_stages_of_product ORDER BY created_date ASC`
        );
        return res.send(generateResponse(true, "List fetched successfully", 200, result.rows));
    });
}

// ======>

export async function addTimeZone(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;
            if (!name) throw new Error("Name is required");

            const exists = await client.query(
                `SELECT 1 FROM time_zone WHERE name ILIKE $1`,
                [name]
            );
            if (exists.rowCount > 0) {
                return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
            }

            const tmz_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'TMZ', 'time_zone');
            const code = formatCode('TMZ', nextNumber);

            const result = await client.query(
                `INSERT INTO time_zone (tmz_id, code, name, created_by)
                 VALUES ($1,$2,$3,$4) RETURNING *`,
                [tmz_id, code, name, req.user_id]
            );

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function updateTimeZone(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            const updated: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                const exists = await client.query(
                    `SELECT 1 FROM time_zone 
                     WHERE name ILIKE $1 AND tmz_id <> $2`,
                    [item.name, item.tmz_id]
                );
                if (exists.rowCount > 0) {
                    return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
                }

                const result = await client.query(
                    `UPDATE time_zone
                     SET name=$1, updated_by=$2, update_date=NOW()
                     WHERE tmz_id=$3 RETURNING *`,
                    [item.name, req.user_id, item.tmz_id]
                );
                updated.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updated));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function getTimeZoneListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        const { searchValue } = req.query;
        const values: any[] = [];
        let where = '';

        if (searchValue) {
            where = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
            values.push(`%${searchValue}%`);
        }

        const list = await client.query(
            `SELECT i.* FROM time_zone i WHERE 1=1 ${where} ORDER BY created_date ASC`,
            values
        );

        const count = await client.query(
            `SELECT COUNT(*) FROM time_zone i WHERE 1=1 ${where}`,
            values
        );

        return res.send(generateResponse(true, "List fetched successfully", 200, {
            totalCount: count.rows[0].count,
            list: list.rows
        }));
    });
}

export async function TimeZoneDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            const names = data.map(d => d.name.toLowerCase());
            const existing = await client.query(
                `SELECT name FROM time_zone WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "One or more names already exist", 400, null)
                );
            }

            let nextNumber = await generateDynamicCode(client, 'TMZ', 'time_zone');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                rows.push({
                    tmz_id: ulid(),
                    code: formatCode('TMZ', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const result = await client.query(
                `INSERT INTO time_zone (${columns.join(', ')})
                 VALUES ${placeholders.join(', ')}
                 RETURNING *`,
                values
            );

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function deleteTimeZone(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query(
            `DELETE FROM time_zone WHERE tmz_id=$1`,
            [req.body.tmz_id]
        );
        return res.send(generateResponse(true, "Deleted successfully", 200, null));
    });
}

export async function getTimeZoneDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        const result = await client.query(
            `SELECT * FROM time_zone ORDER BY created_date ASC`
        );
        return res.send(generateResponse(true, "List fetched successfully", 200, result.rows));
    });
}

// ======>

export async function addProductUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;
            if (!name) throw new Error("Name is required");

            const exists = await client.query(
                `SELECT 1 FROM product_unit WHERE name ILIKE $1`,
                [name]
            );
            if (exists.rowCount > 0) {
                return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
            }

            const pu_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'PU', 'product_unit');
            const code = formatCode('PU', nextNumber);

            const result = await client.query(
                `INSERT INTO product_unit (pu_id, code, name, created_by)
                 VALUES ($1,$2,$3,$4) RETURNING *`,
                [pu_id, code, name, req.user_id]
            );

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function updateProductUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            const updated: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                const exists = await client.query(
                    `SELECT 1 FROM product_unit 
                     WHERE name ILIKE $1 AND pu_id <> $2`,
                    [item.name, item.pu_id]
                );
                if (exists.rowCount > 0) {
                    return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
                }

                const result = await client.query(
                    `UPDATE product_unit
                     SET name=$1, updated_by=$2, update_date=NOW()
                     WHERE pu_id=$3 RETURNING *`,
                    [item.name, req.user_id, item.pu_id]
                );
                updated.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updated));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function getProductUnitListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        const { searchValue } = req.query;
        const values: any[] = [];
        let where = '';

        if (searchValue) {
            where = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
            values.push(`%${searchValue}%`);
        }

        const list = await client.query(
            `SELECT i.* FROM product_unit i WHERE 1=1 ${where} ORDER BY created_date ASC`,
            values
        );

        const count = await client.query(
            `SELECT COUNT(*) FROM product_unit i WHERE 1=1 ${where}`,
            values
        );

        return res.send(generateResponse(true, "List fetched successfully", 200, {
            totalCount: count.rows[0].count,
            list: list.rows
        }));
    });
}

export async function ProductUnitDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            const names = data.map(d => d.name.toLowerCase());
            const existing = await client.query(
                `SELECT name FROM product_unit WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "One or more names already exist", 400, null)
                );
            }

            let nextNumber = await generateDynamicCode(client, 'PU', 'product_unit');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                rows.push({
                    pu_id: ulid(),
                    code: formatCode('PU', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const result = await client.query(
                `INSERT INTO product_unit (${columns.join(', ')})
                 VALUES ${placeholders.join(', ')}
                 RETURNING *`,
                values
            );

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function deleteProductUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query(
            `DELETE FROM product_unit WHERE pu_id=$1`,
            [req.body.pu_id]
        );
        return res.send(generateResponse(true, "Deleted successfully", 200, null));
    });
}

export async function getProductUnitDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        const result = await client.query(
            `SELECT * FROM product_unit ORDER BY created_date ASC`
        );
        return res.send(generateResponse(true, "List fetched successfully", 200, result.rows));
    });
}


// ======>

export async function addSupplierTier(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;
            if (!name) throw new Error("Name is required");

            const exists = await client.query(
                `SELECT 1 FROM supplier_tier WHERE name ILIKE $1`,
                [name]
            );
            if (exists.rowCount > 0) {
                return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
            }

            const st_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'ST', 'supplier_tier');
            const code = formatCode('ST', nextNumber);

            const result = await client.query(
                `INSERT INTO supplier_tier (st_id, code, name, created_by)
                 VALUES ($1,$2,$3,$4) RETURNING *`,
                [st_id, code, name, req.user_id]
            );

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function updateSupplierTier(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            const updated: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                const exists = await client.query(
                    `SELECT 1 FROM supplier_tier 
                     WHERE name ILIKE $1 AND st_id <> $2`,
                    [item.name, item.st_id]
                );
                if (exists.rowCount > 0) {
                    return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
                }

                const result = await client.query(
                    `UPDATE supplier_tier
                     SET name=$1, updated_by=$2, update_date=NOW()
                     WHERE st_id=$3 RETURNING *`,
                    [item.name, req.user_id, item.st_id]
                );
                updated.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updated));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function getSupplierTierListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        const { searchValue } = req.query;
        const values: any[] = [];
        let where = '';

        if (searchValue) {
            where = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
            values.push(`%${searchValue}%`);
        }

        const list = await client.query(
            `SELECT i.* FROM supplier_tier i WHERE 1=1 ${where} ORDER BY created_date ASC`,
            values
        );

        const count = await client.query(
            `SELECT COUNT(*) FROM supplier_tier i WHERE 1=1 ${where}`,
            values
        );

        return res.send(generateResponse(true, "List fetched successfully", 200, {
            totalCount: count.rows[0].count,
            list: list.rows
        }));
    });
}

export async function SupplierTierDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            const names = data.map(d => d.name.toLowerCase());
            const existing = await client.query(
                `SELECT name FROM supplier_tier WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "One or more names already exist", 400, null)
                );
            }

            let nextNumber = await generateDynamicCode(client, 'ST', 'supplier_tier');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                rows.push({
                    st_id: ulid(),
                    code: formatCode('ST', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const result = await client.query(
                `INSERT INTO supplier_tier (${columns.join(', ')})
                 VALUES ${placeholders.join(', ')}
                 RETURNING *`,
                values
            );

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function deleteSupplierTier(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query(
            `DELETE FROM supplier_tier WHERE st_id=$1`,
            [req.body.st_id]
        );
        return res.send(generateResponse(true, "Deleted successfully", 200, null));
    });
}

export async function getSupplierTierDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        const result = await client.query(
            `SELECT * FROM supplier_tier ORDER BY created_date ASC`
        );
        return res.send(generateResponse(true, "List fetched successfully", 200, result.rows));
    });
}

// ======>

export async function addCreditMethod(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;
            if (!name) throw new Error("Name is required");

            const exists = await client.query(
                `SELECT 1 FROM credit_method WHERE name ILIKE $1`,
                [name]
            );
            if (exists.rowCount > 0) {
                return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
            }

            const cm_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'CM', 'credit_method');
            const code = formatCode('CM', nextNumber);

            const result = await client.query(
                `INSERT INTO credit_method (cm_id, code, name, created_by)
                 VALUES ($1,$2,$3,$4) RETURNING *`,
                [cm_id, code, name, req.user_id]
            );

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function updateCreditMethod(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            const updated: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                const exists = await client.query(
                    `SELECT 1 FROM credit_method 
                     WHERE name ILIKE $1 AND cm_id <> $2`,
                    [item.name, item.cm_id]
                );
                if (exists.rowCount > 0) {
                    return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
                }

                const result = await client.query(
                    `UPDATE credit_method
                     SET name=$1, updated_by=$2, update_date=NOW()
                     WHERE cm_id=$3 RETURNING *`,
                    [item.name, req.user_id, item.cm_id]
                );
                updated.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updated));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function getCreditMethodListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        const { searchValue } = req.query;
        const values: any[] = [];
        let where = '';

        if (searchValue) {
            where = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
            values.push(`%${searchValue}%`);
        }

        const list = await client.query(
            `SELECT i.* FROM credit_method i WHERE 1=1 ${where} ORDER BY created_date ASC`,
            values
        );

        const count = await client.query(
            `SELECT COUNT(*) FROM credit_method i WHERE 1=1 ${where}`,
            values
        );

        return res.send(generateResponse(true, "List fetched successfully", 200, {
            totalCount: count.rows[0].count,
            list: list.rows
        }));
    });
}

export async function CreditMethodDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            const names = data.map(d => d.name.toLowerCase());
            const existing = await client.query(
                `SELECT name FROM credit_method WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "One or more names already exist", 400, null)
                );
            }

            let nextNumber = await generateDynamicCode(client, 'CM', 'credit_method');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                rows.push({
                    cm_id: ulid(),
                    code: formatCode('CM', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const result = await client.query(
                `INSERT INTO credit_method (${columns.join(', ')})
                 VALUES ${placeholders.join(', ')}
                 RETURNING *`,
                values
            );

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function deleteCreditMethod(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query(
            `DELETE FROM credit_method WHERE cm_id=$1`,
            [req.body.cm_id]
        );
        return res.send(generateResponse(true, "Deleted successfully", 200, null));
    });
}

export async function getCreditMethodDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        const result = await client.query(
            `SELECT * FROM credit_method ORDER BY created_date ASC`
        );
        return res.send(generateResponse(true, "List fetched successfully", 200, result.rows));
    });
}

// ======>

export async function addWaterSource(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;
            if (!name) throw new Error("Name is required");

            const exists = await client.query(
                `SELECT 1 FROM water_source WHERE name ILIKE $1`,
                [name]
            );
            if (exists.rowCount > 0) {
                return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
            }

            const ws_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'WS', 'water_source');
            const code = formatCode('WS', nextNumber);

            const result = await client.query(
                `INSERT INTO water_source (ws_id, code, name, created_by)
                 VALUES ($1,$2,$3,$4) RETURNING *`,
                [ws_id, code, name, req.user_id]
            );

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function updateWaterSource(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            const updated: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                const exists = await client.query(
                    `SELECT 1 FROM water_source 
                     WHERE name ILIKE $1 AND ws_id <> $2`,
                    [item.name, item.ws_id]
                );
                if (exists.rowCount > 0) {
                    return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
                }

                const result = await client.query(
                    `UPDATE water_source
                     SET name=$1, updated_by=$2, update_date=NOW()
                     WHERE ws_id=$3 RETURNING *`,
                    [item.name, req.user_id, item.ws_id]
                );
                updated.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updated));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function getWaterSourceListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        const { searchValue } = req.query;
        const values: any[] = [];
        let where = '';

        if (searchValue) {
            where = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
            values.push(`%${searchValue}%`);
        }

        const list = await client.query(
            `SELECT i.* FROM water_source i WHERE 1=1 ${where} ORDER BY created_date ASC`,
            values
        );

        const count = await client.query(
            `SELECT COUNT(*) FROM water_source i WHERE 1=1 ${where}`,
            values
        );

        return res.send(generateResponse(true, "List fetched successfully", 200, {
            totalCount: count.rows[0].count,
            list: list.rows
        }));
    });
}

export async function WaterSourceDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            const names = data.map(d => d.name.toLowerCase());
            const existing = await client.query(
                `SELECT name FROM water_source WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "One or more names already exist", 400, null)
                );
            }

            let nextNumber = await generateDynamicCode(client, 'WS', 'water_source');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                rows.push({
                    ws_id: ulid(),
                    code: formatCode('WS', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const result = await client.query(
                `INSERT INTO water_source (${columns.join(', ')})
                 VALUES ${placeholders.join(', ')}
                 RETURNING *`,
                values
            );

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function deleteWaterSource(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query(
            `DELETE FROM water_source WHERE ws_id=$1`,
            [req.body.cm_id]
        );
        return res.send(generateResponse(true, "Deleted successfully", 200, null));
    });
}

export async function getWaterSourceDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        const result = await client.query(
            `SELECT * FROM water_source ORDER BY created_date ASC`
        );
        return res.send(generateResponse(true, "List fetched successfully", 200, result.rows));
    });
}


// ======>

export async function addWaterUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;
            if (!name) throw new Error("Name is required");

            const exists = await client.query(
                `SELECT 1 FROM water_unit WHERE name ILIKE $1`,
                [name]
            );
            if (exists.rowCount > 0) {
                return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
            }

            const wu_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'WU', 'water_unit');
            const code = formatCode('WU', nextNumber);

            const result = await client.query(
                `INSERT INTO water_unit (wu_id, code, name, created_by)
                 VALUES ($1,$2,$3,$4) RETURNING *`,
                [wu_id, code, name, req.user_id]
            );

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function updateWaterUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            const updated: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                const exists = await client.query(
                    `SELECT 1 FROM water_unit 
                     WHERE name ILIKE $1 AND wu_id <> $2`,
                    [item.name, item.wu_id]
                );
                if (exists.rowCount > 0) {
                    return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
                }

                const result = await client.query(
                    `UPDATE water_unit
                     SET name=$1, updated_by=$2, update_date=NOW()
                     WHERE wu_id=$3 RETURNING *`,
                    [item.name, req.user_id, item.wu_id]
                );
                updated.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updated));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function getWaterUnitListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        const { searchValue } = req.query;
        const values: any[] = [];
        let where = '';

        if (searchValue) {
            where = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
            values.push(`%${searchValue}%`);
        }

        const list = await client.query(
            `SELECT i.* FROM water_unit i WHERE 1=1 ${where} ORDER BY created_date ASC`,
            values
        );

        const count = await client.query(
            `SELECT COUNT(*) FROM water_unit i WHERE 1=1 ${where}`,
            values
        );

        return res.send(generateResponse(true, "List fetched successfully", 200, {
            totalCount: count.rows[0].count,
            list: list.rows
        }));
    });
}

export async function WaterUnitDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            const names = data.map(d => d.name.toLowerCase());
            const existing = await client.query(
                `SELECT name FROM water_unit WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "One or more names already exist", 400, null)
                );
            }

            let nextNumber = await generateDynamicCode(client, 'WU', 'water_unit');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                rows.push({
                    wu_id: ulid(),
                    code: formatCode('WU', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const result = await client.query(
                `INSERT INTO water_unit (${columns.join(', ')})
                 VALUES ${placeholders.join(', ')}
                 RETURNING *`,
                values
            );

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function deleteWaterUnit(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query(
            `DELETE FROM water_unit WHERE wu_id=$1`,
            [req.body.cm_id]
        );
        return res.send(generateResponse(true, "Deleted successfully", 200, null));
    });
}

export async function getWaterUnitDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        const result = await client.query(
            `SELECT * FROM water_unit ORDER BY created_date ASC`
        );
        return res.send(generateResponse(true, "List fetched successfully", 200, result.rows));
    });
}

// ======>

export async function addWaterTreatment(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;
            if (!name) throw new Error("Name is required");

            const exists = await client.query(
                `SELECT 1 FROM water_treatment WHERE name ILIKE $1`,
                [name]
            );
            if (exists.rowCount > 0) {
                return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
            }

            const wt_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'WT', 'water_treatment');
            const code = formatCode('WT', nextNumber);

            const result = await client.query(
                `INSERT INTO water_treatment (wt_id, code, name, created_by)
                 VALUES ($1,$2,$3,$4) RETURNING *`,
                [wt_id, code, name, req.user_id]
            );

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function updateWaterTreatment(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            const updated: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                const exists = await client.query(
                    `SELECT 1 FROM water_treatment 
                     WHERE name ILIKE $1 AND wt_id <> $2`,
                    [item.name, item.wt_id]
                );
                if (exists.rowCount > 0) {
                    return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
                }

                const result = await client.query(
                    `UPDATE water_treatment
                     SET name=$1, updated_by=$2, update_date=NOW()
                     WHERE wt_id=$3 RETURNING *`,
                    [item.name, req.user_id, item.wt_id]
                );
                updated.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updated));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function getWaterTreatmentListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        const { searchValue } = req.query;
        const values: any[] = [];
        let where = '';

        if (searchValue) {
            where = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
            values.push(`%${searchValue}%`);
        }

        const list = await client.query(
            `SELECT i.* FROM water_treatment i WHERE 1=1 ${where} ORDER BY created_date ASC`,
            values
        );

        const count = await client.query(
            `SELECT COUNT(*) FROM water_treatment i WHERE 1=1 ${where}`,
            values
        );

        return res.send(generateResponse(true, "List fetched successfully", 200, {
            totalCount: count.rows[0].count,
            list: list.rows
        }));
    });
}

export async function WaterTreatmentDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            const names = data.map(d => d.name.toLowerCase());
            const existing = await client.query(
                `SELECT name FROM water_treatment WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "One or more names already exist", 400, null)
                );
            }

            let nextNumber = await generateDynamicCode(client, 'WT', 'water_treatment');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                rows.push({
                    wt_id: ulid(),
                    code: formatCode('WT', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const result = await client.query(
                `INSERT INTO water_treatment (${columns.join(', ')})
                 VALUES ${placeholders.join(', ')}
                 RETURNING *`,
                values
            );

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function deleteWaterTreatment(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query(
            `DELETE FROM water_treatment WHERE wt_id=$1`,
            [req.body.cm_id]
        );
        return res.send(generateResponse(true, "Deleted successfully", 200, null));
    });
}

export async function getWaterTreatmentDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        const result = await client.query(
            `SELECT * FROM water_treatment ORDER BY created_date ASC`
        );
        return res.send(generateResponse(true, "List fetched successfully", 200, result.rows));
    });
}

// ======>

export async function addDischargeDestination(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { name } = req.body;
            if (!name) throw new Error("Name is required");

            const exists = await client.query(
                `SELECT 1 FROM discharge_destination WHERE name ILIKE $1`,
                [name]
            );
            if (exists.rowCount > 0) {
                return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
            }

            const dd_id = ulid();
            const nextNumber = await generateDynamicCode(client, 'DD', 'discharge_destination');
            const code = formatCode('DD', nextNumber);

            const result = await client.query(
                `INSERT INTO discharge_destination (dd_id, code, name, created_by)
                 VALUES ($1,$2,$3,$4) RETURNING *`,
                [dd_id, code, name, req.user_id]
            );

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function updateDischargeDestination(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            const updated: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                const exists = await client.query(
                    `SELECT 1 FROM discharge_destination 
                     WHERE name ILIKE $1 AND dd_id <> $2`,
                    [item.name, item.dd_id]
                );
                if (exists.rowCount > 0) {
                    return res.status(400).send(generateResponse(false, "Name already exists", 400, null));
                }

                const result = await client.query(
                    `UPDATE discharge_destination
                     SET name=$1, updated_by=$2, update_date=NOW()
                     WHERE dd_id=$3 RETURNING *`,
                    [item.name, req.user_id, item.dd_id]
                );
                updated.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updated));
        } catch (e: any) {
            return res.send(generateResponse(false, e.message, 400, null));
        }
    });
}

export async function getDischargeDestinationListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        const { searchValue } = req.query;
        const values: any[] = [];
        let where = '';

        if (searchValue) {
            where = `AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
            values.push(`%${searchValue}%`);
        }

        const list = await client.query(
            `SELECT i.* FROM discharge_destination i WHERE 1=1 ${where} ORDER BY created_date ASC`,
            values
        );

        const count = await client.query(
            `SELECT COUNT(*) FROM discharge_destination i WHERE 1=1 ${where}`,
            values
        );

        return res.send(generateResponse(true, "List fetched successfully", 200, {
            totalCount: count.rows[0].count,
            list: list.rows
        }));
    });
}

export async function DischargeDestinationDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            const names = data.map(d => d.name.toLowerCase());
            const existing = await client.query(
                `SELECT name FROM discharge_destination WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "One or more names already exist", 400, null)
                );
            }

            let nextNumber = await generateDynamicCode(client, 'DD', 'discharge_destination');
            const rows: any[] = [];

            for (const item of data) {
                if (!item.name) throw new Error("Name is required");

                rows.push({
                    dd_id: ulid(),
                    code: formatCode('DD', nextNumber++),
                    name: item.name,
                    created_by: req.user_id
                });
            }

            const columns = Object.keys(rows[0]);
            const values: any[] = [];
            const placeholders: string[] = [];

            rows.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(', ')})`
                );
            });

            const result = await client.query(
                `INSERT INTO discharge_destination (${columns.join(', ')})
                 VALUES ${placeholders.join(', ')}
                 RETURNING *`,
                values
            );

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function deleteDischargeDestination(req: any, res: any) {
    return withClient(async (client: any) => {
        await client.query(
            `DELETE FROM discharge_destination WHERE dd_id=$1`,
            [req.body.cm_id]
        );
        return res.send(generateResponse(true, "Deleted successfully", 200, null));
    });
}

export async function getDischargeDestinationDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        const result = await client.query(
            `SELECT * FROM discharge_destination ORDER BY created_date ASC`
        );
        return res.send(generateResponse(true, "List fetched successfully", 200, result.rows));
    });
}