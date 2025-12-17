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