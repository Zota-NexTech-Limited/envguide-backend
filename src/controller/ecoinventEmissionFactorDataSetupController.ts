import { withClient } from '../util/database.js';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes.js';


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

///Materials Emission Factor
export async function addMaterialsEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const {
                ef_code,
                scope,
                layer1,
                layer2,
                layer3,
                layer4,
                region,
                year,
                ef_value,
                unit,
                data_source
            } = req.body;

            if (!ef_code) throw new Error("EF code (Excel ID) is required");
            if (!region) throw new Error("Region is required");
            if (ef_value === undefined || ef_value === null || ef_value === '') {
                throw new Error("EF Value is required");
            }

            const dupCheck = await client.query(
                `SELECT 1 FROM materials_emission_factor WHERE ef_code = $1`,
                [ef_code]
            );
            if (dupCheck.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, `EF code '${ef_code}' already exists`, 400, null));
            }

            const id = ulid();

            const query = `
                INSERT INTO materials_emission_factor (
                    mef_id, ef_code, scope,
                    layer1, layer2, layer3, layer4,
                    region, year, ef_value, unit, data_source,
                    created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *;
            `;

            const result = await client.query(query, [
                id, ef_code, scope,
                layer1, layer2, layer3, layer4,
                region, year, ef_value, unit, data_source,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateMaterialsEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.mef_id) throw new Error("mef_id is required");
                if (!item.ef_code) throw new Error("EF code (Excel ID) is required");
                if (!item.region) throw new Error("Region is required");
                if (item.ef_value === undefined || item.ef_value === null || item.ef_value === '') {
                    throw new Error("EF Value is required");
                }

                const dupCheck = await client.query(
                    `SELECT 1
                     FROM materials_emission_factor
                     WHERE ef_code = $1 AND mef_id <> $2`,
                    [item.ef_code, item.mef_id]
                );

                if (dupCheck.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `EF code '${item.ef_code}' already exists`, 400, null));
                }

                const query = `
                    UPDATE materials_emission_factor SET
                        ef_code     = $2,
                        scope       = $3,
                        layer1      = $4,
                        layer2      = $5,
                        layer3      = $6,
                        layer4      = $7,
                        region      = $8,
                        year        = $9,
                        ef_value    = $10,
                        unit        = $11,
                        data_source = $12,
                        updated_by  = $13
                    WHERE mef_id = $1
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.mef_id, item.ef_code, item.scope,
                    item.layer1, item.layer2, item.layer3, item.layer4,
                    item.region, item.year, item.ef_value, item.unit, item.data_source,
                    req.user_id
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

export async function getMaterialsEmissionFactorListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue, region, year, layer1, layer2, layer3, layer4 } = req.query;
            const filters: string[] = [];
            const values: any[] = [];

            if (searchValue) {
                values.push(`%${searchValue}%`);
                const p = `$${values.length}`;
                filters.push(`(
                    i.ef_code ILIKE ${p}
                    OR i.layer1 ILIKE ${p}
                    OR i.layer2 ILIKE ${p}
                    OR i.layer3 ILIKE ${p}
                    OR i.layer4 ILIKE ${p}
                )`);
            }
            if (region) {
                values.push(region);
                filters.push(`i.region = $${values.length}`);
            }
            if (year) {
                values.push(year);
                filters.push(`i.year = $${values.length}`);
            }
            if (layer1) {
                values.push(layer1);
                filters.push(`i.layer1 = $${values.length}`);
            }
            if (layer2) {
                values.push(layer2);
                filters.push(`i.layer2 = $${values.length}`);
            }
            if (layer3) {
                values.push(layer3);
                filters.push(`i.layer3 = $${values.length}`);
            }
            if (layer4) {
                values.push(layer4);
                filters.push(`i.layer4 = $${values.length}`);
            }

            const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

            const listQuery = `
                SELECT i.*
                FROM materials_emission_factor i
                ${whereClause}
                ORDER BY i.ef_code ASC NULLS LAST, i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM materials_emission_factor i
                ${whereClause};
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

// export async function materialsEmissionFactorDataSetup(req: any, res: any) {
//     return withClient(async (client: any) => {
//         try {
//             const data = req.body;

//             if (!Array.isArray(data) || data.length === 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "Invalid input array", 400, null));
//             }

//             // Check duplicate names inside payload
//             const names = data.map(d => d.element_name.toLowerCase());
//             const duplicatePayloadNames = names.filter(
//                 (n, i) => names.indexOf(n) !== i
//             );

//             if (duplicatePayloadNames.length > 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "Duplicate names in payload", 400, null));
//             }

//             // Check existing names in DB
//             const existing = await client.query(
//                 `SELECT element_name FROM materials_emission_factor WHERE element_name ILIKE ANY($1)`,
//                 [names]
//             );

//             if (existing.rowCount > 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "One or more names already exist", 400, null));
//             }

//             const rows: any[] = [];

//             let nextNumber = await generateDynamicCode(client, 'MEF', 'materials_emission_factor');

//             for (const item of data) {

//                 if (!item.element_name) {
//                     throw new Error("Name is required");
//                 }

//                 const code = formatCode('MEF', nextNumber);
//                 nextNumber++;

//                 rows.push({
//                     mef_id: ulid(),
//                     code: code,
//                     element_name: item.element_name,
//                     ef_eu_region: item.ef_eu_region,
//                     ef_india_region: item.ef_india_region,
//                     ef_global_region: item.ef_global_region,
//                     year: item.year,
//                     iso_country_code: item.iso_country_code,
//                     unit: item.unit,
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
//                 INSERT INTO materials_emission_factor (${columns.join(', ')})
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
export async function materialsEmissionFactorDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            // Per-row required-field validation (Layer4, Region, EF Value, ef_code/ID)
            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const rowLabel = item.ef_code ? `row ${item.ef_code}` : `row index ${i}`;
                if (!item.ef_code) {
                    return res.status(400).send(
                        generateResponse(false, `Missing ID (ef_code) in ${rowLabel}`, 400, null)
                    );
                }
                if (!item.region) {
                    return res.status(400).send(
                        generateResponse(false, `Missing Region in ${rowLabel}`, 400, null)
                    );
                }
                if (item.ef_value === undefined || item.ef_value === null || item.ef_value === '') {
                    return res.status(400).send(
                        generateResponse(false, `Missing EF Value in ${rowLabel}`, 400, null)
                    );
                }
            }

            // Duplicate ef_code in payload
            const efCodes = data.map((d: any) => d.ef_code);
            const dupCodes = efCodes.filter((c: string, i: number) => efCodes.indexOf(c) !== i);
            if (dupCodes.length > 0) {
                return res.status(400).send(
                    generateResponse(false, `Duplicate ef_code in payload: ${[...new Set(dupCodes)].join(', ')}`, 400, null)
                );
            }

            // Existing ef_codes in DB
            const existing = await client.query(
                `SELECT ef_code FROM materials_emission_factor WHERE ef_code = ANY($1)`,
                [efCodes]
            );

            if (existing.rowCount > 0) {
                const existingCodes = existing.rows.map((r: any) => r.ef_code);
                return res.status(400).send(
                    generateResponse(false, `ef_code(s) already exist: ${existingCodes.join(', ')}`, 400, null)
                );
            }

            // Build rows
            const rows = data.map((item: any) => ({
                mef_id: ulid(),
                ef_code: item.ef_code,
                scope: item.scope || null,
                layer1: item.layer1 || null,
                layer2: item.layer2 || null,
                layer3: item.layer3 || null,
                layer4: item.layer4,
                region: item.region,
                year: item.year || null,
                ef_value: item.ef_value,
                unit: item.unit || null,
                data_source: item.data_source || null,
                created_by: req.user_id
            }));

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
                INSERT INTO materials_emission_factor (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(
                generateResponse(true, "Bulk import successful", 200, result.rows)
            );

        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteMaterialsEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { mef_id } = req.body;

            await client.query(
                `DELETE FROM materials_emission_factor WHERE mef_id = $1`,
                [mef_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getMaterialsEmissionFactorDropDownnList(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            const listQuery = `
                SELECT i.*
                FROM materials_emission_factor i
                ORDER BY i.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getMaterialsPlusMaterialTypeDropDownnList(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT
                    mcm.mcm_id,
                    CONCAT(mcm.name, ' - ', mcmt.name) AS combined_name
                FROM material_composition_metals mcm
                INNER JOIN material_composition_metal_type mcmt
                    ON mcmt.mcm_id = mcm.mcm_id
                ORDER BY mcm.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(
                generateResponse(true, "List fetched successfully", 200, listResult.rows)
            );
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}


///Electricity Emission Factor
export async function addElectricityEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const {
                ef_code, scope,
                layer1, layer2, layer3, layer4,
                region, year, ef_value, unit, data_source
            } = req.body;

            if (!ef_code) throw new Error("EF code (Excel ID) is required");
            if (!region) throw new Error("Region is required");
            if (ef_value === undefined || ef_value === null || ef_value === '') {
                throw new Error("EF Value is required");
            }

            const dupCheck = await client.query(
                `SELECT 1 FROM electricity_emission_factor WHERE ef_code = $1`,
                [ef_code]
            );
            if (dupCheck.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, `EF code '${ef_code}' already exists`, 400, null));
            }

            const id = ulid();

            const query = `
                INSERT INTO electricity_emission_factor (
                    eef_id, ef_code, scope,
                    layer1, layer2, layer3, layer4,
                    region, year, ef_value, unit, data_source,
                    created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *;
            `;

            const result = await client.query(query, [
                id, ef_code, scope,
                layer1, layer2, layer3, layer4,
                region, year, ef_value, unit, data_source,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateElectricityEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.eef_id) throw new Error("eef_id is required");
                if (!item.ef_code) throw new Error("EF code (Excel ID) is required");
                if (!item.region) throw new Error("Region is required");
                if (item.ef_value === undefined || item.ef_value === null || item.ef_value === '') {
                    throw new Error("EF Value is required");
                }

                const dupCheck = await client.query(
                    `SELECT 1
                     FROM electricity_emission_factor
                     WHERE ef_code = $1 AND eef_id <> $2`,
                    [item.ef_code, item.eef_id]
                );

                if (dupCheck.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `EF code '${item.ef_code}' already exists`, 400, null));
                }

                const query = `
                    UPDATE electricity_emission_factor SET
                        ef_code     = $2,
                        scope       = $3,
                        layer1      = $4,
                        layer2      = $5,
                        layer3      = $6,
                        layer4      = $7,
                        region      = $8,
                        year        = $9,
                        ef_value    = $10,
                        unit        = $11,
                        data_source = $12,
                        updated_by  = $13
                    WHERE eef_id = $1
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.eef_id, item.ef_code, item.scope,
                    item.layer1, item.layer2, item.layer3, item.layer4,
                    item.region, item.year, item.ef_value, item.unit, item.data_source,
                    req.user_id
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

export async function getElectricityEmissionFactorListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue, region, year, layer1, layer2, layer3, layer4 } = req.query;
            const filters: string[] = [];
            const values: any[] = [];

            if (searchValue) {
                values.push(`%${searchValue}%`);
                const p = `$${values.length}`;
                filters.push(`(
                    i.ef_code ILIKE ${p}
                    OR i.layer1 ILIKE ${p}
                    OR i.layer2 ILIKE ${p}
                    OR i.layer3 ILIKE ${p}
                    OR i.layer4 ILIKE ${p}
                )`);
            }
            if (region) { values.push(region); filters.push(`i.region = $${values.length}`); }
            if (year) { values.push(year); filters.push(`i.year = $${values.length}`); }
            if (layer1) { values.push(layer1); filters.push(`i.layer1 = $${values.length}`); }
            if (layer2) { values.push(layer2); filters.push(`i.layer2 = $${values.length}`); }
            if (layer3) { values.push(layer3); filters.push(`i.layer3 = $${values.length}`); }
            if (layer4) { values.push(layer4); filters.push(`i.layer4 = $${values.length}`); }

            const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

            const listQuery = `
                SELECT i.*
                FROM electricity_emission_factor i
                ${whereClause}
                ORDER BY i.ef_code ASC NULLS LAST, i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM electricity_emission_factor i
                ${whereClause};
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

// export async function electricityEmissionFactorDataSetup(req: any, res: any) {
//     return withClient(async (client: any) => {
//         try {
//             const data = req.body;

//             if (!Array.isArray(data) || data.length === 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "Invalid input array", 400, null));
//             }

//             // Check duplicate names inside payload
//             const names = data.map(d => d.type_of_energy.toLowerCase());
//             const duplicatePayloadNames = names.filter(
//                 (n, i) => names.indexOf(n) !== i
//             );

//             if (duplicatePayloadNames.length > 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "Duplicate names in payload", 400, null));
//             }

//             // Check existing names in DB
//             const existing = await client.query(
//                 `SELECT type_of_energy FROM electricity_emission_factor WHERE type_of_energy ILIKE ANY($1)`,
//                 [names]
//             );

//             if (existing.rowCount > 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "One or more names already exist", 400, null));
//             }

//             const rows: any[] = [];

//             let nextNumber = await generateDynamicCode(client, 'EEF', 'electricity_emission_factor');

//             for (const item of data) {

//                 if (!item.type_of_energy) {
//                     throw new Error("type_of_energy is required");
//                 }

//                 const code = formatCode('EEF', nextNumber);
//                 nextNumber++;

//                 rows.push({
//                     eef_id: ulid(),
//                     code: code,
//                     type_of_energy: item.type_of_energy,
//                     ef_eu_region: item.ef_eu_region,
//                     ef_india_region: item.ef_india_region,
//                     ef_global_region: item.ef_global_region,
//                     created_by: req.user_id,
//                     year: item.year,
//                     iso_country_code: item.iso_country_code,
//                     unit: item.unit
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
//                 INSERT INTO electricity_emission_factor (${columns.join(', ')})
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
export async function electricityEmissionFactorDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const rowLabel = item.ef_code ? `row ${item.ef_code}` : `row index ${i}`;
                if (!item.ef_code) {
                    return res.status(400).send(generateResponse(false, `Missing ID (ef_code) in ${rowLabel}`, 400, null));
                }
                if (!item.region) {
                    return res.status(400).send(generateResponse(false, `Missing Region in ${rowLabel}`, 400, null));
                }
                if (item.ef_value === undefined || item.ef_value === null || item.ef_value === '') {
                    return res.status(400).send(generateResponse(false, `Missing EF Value in ${rowLabel}`, 400, null));
                }
            }

            const efCodes = data.map((d: any) => d.ef_code);
            const dupCodes = efCodes.filter((c: string, i: number) => efCodes.indexOf(c) !== i);
            if (dupCodes.length > 0) {
                return res.status(400).send(
                    generateResponse(false, `Duplicate ef_code in payload: ${[...new Set(dupCodes)].join(', ')}`, 400, null)
                );
            }

            const existing = await client.query(
                `SELECT ef_code FROM electricity_emission_factor WHERE ef_code = ANY($1)`,
                [efCodes]
            );

            if (existing.rowCount > 0) {
                const existingCodes = existing.rows.map((r: any) => r.ef_code);
                return res.status(400).send(
                    generateResponse(false, `ef_code(s) already exist: ${existingCodes.join(', ')}`, 400, null)
                );
            }

            const rows = data.map((item: any) => ({
                eef_id: ulid(),
                ef_code: item.ef_code,
                scope: item.scope || null,
                layer1: item.layer1 || null,
                layer2: item.layer2 || null,
                layer3: item.layer3 || null,
                layer4: item.layer4,
                region: item.region,
                year: item.year || null,
                ef_value: item.ef_value,
                unit: item.unit || null,
                data_source: item.data_source || null,
                created_by: req.user_id
            }));

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
                INSERT INTO electricity_emission_factor (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(
                generateResponse(true, "Bulk import successful", 200, result.rows)
            );

        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteElectricityEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { eef_id } = req.body;

            await client.query(
                `DELETE FROM electricity_emission_factor WHERE eef_id = $1`,
                [eef_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getElectricityEmissionFactorDropDownnList(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            const listQuery = `
                SELECT i.*
                FROM electricity_emission_factor i
                ORDER BY i.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getEnergySourceEnergyTypeDropDownnList(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT
                    eng.es_id,
                    CONCAT(eng.name, ' - ', engt.name) AS combined_name
                FROM energy_source eng
                INNER JOIN energy_type engt
                    ON engt.es_id = eng.es_id
                ORDER BY eng.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(
                generateResponse(true, "List fetched successfully", 200, listResult.rows)
            );
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}


///Fuel Emission Factor
export async function addFuelEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const {
                ef_code, scope,
                layer1, layer2, layer3, layer4,
                region, year, ef_value, unit, data_source
            } = req.body;

            if (!ef_code) throw new Error("EF code (Excel ID) is required");
            if (!region) throw new Error("Region is required");
            if (ef_value === undefined || ef_value === null || ef_value === '') {
                throw new Error("EF Value is required");
            }

            const dupCheck = await client.query(
                `SELECT 1 FROM fuel_emission_factor WHERE ef_code = $1`,
                [ef_code]
            );
            if (dupCheck.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, `EF code '${ef_code}' already exists`, 400, null));
            }

            const id = ulid();

            const query = `
                INSERT INTO fuel_emission_factor (
                    fef_id, ef_code, scope,
                    layer1, layer2, layer3, layer4,
                    region, year, ef_value, unit, data_source,
                    created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *;
            `;

            const result = await client.query(query, [
                id, ef_code, scope,
                layer1, layer2, layer3, layer4,
                region, year, ef_value, unit, data_source,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateFuelEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.fef_id) throw new Error("fef_id is required");
                if (!item.ef_code) throw new Error("EF code (Excel ID) is required");
                if (!item.region) throw new Error("Region is required");
                if (item.ef_value === undefined || item.ef_value === null || item.ef_value === '') {
                    throw new Error("EF Value is required");
                }

                const dupCheck = await client.query(
                    `SELECT 1
                     FROM fuel_emission_factor
                     WHERE ef_code = $1 AND fef_id <> $2`,
                    [item.ef_code, item.fef_id]
                );

                if (dupCheck.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `EF code '${item.ef_code}' already exists`, 400, null));
                }

                const query = `
                    UPDATE fuel_emission_factor SET
                        ef_code     = $2,
                        scope       = $3,
                        layer1      = $4,
                        layer2      = $5,
                        layer3      = $6,
                        layer4      = $7,
                        region      = $8,
                        year        = $9,
                        ef_value    = $10,
                        unit        = $11,
                        data_source = $12,
                        updated_by  = $13
                    WHERE fef_id = $1
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.fef_id, item.ef_code, item.scope,
                    item.layer1, item.layer2, item.layer3, item.layer4,
                    item.region, item.year, item.ef_value, item.unit, item.data_source,
                    req.user_id
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

export async function getFuelEmissionFactorListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue, region, year, layer1, layer2, layer3, layer4 } = req.query;
            const filters: string[] = [];
            const values: any[] = [];

            if (searchValue) {
                values.push(`%${searchValue}%`);
                const p = `$${values.length}`;
                filters.push(`(
                    i.ef_code ILIKE ${p}
                    OR i.layer1 ILIKE ${p}
                    OR i.layer2 ILIKE ${p}
                    OR i.layer3 ILIKE ${p}
                    OR i.layer4 ILIKE ${p}
                )`);
            }
            if (region) { values.push(region); filters.push(`i.region = $${values.length}`); }
            if (year) { values.push(year); filters.push(`i.year = $${values.length}`); }
            if (layer1) { values.push(layer1); filters.push(`i.layer1 = $${values.length}`); }
            if (layer2) { values.push(layer2); filters.push(`i.layer2 = $${values.length}`); }
            if (layer3) { values.push(layer3); filters.push(`i.layer3 = $${values.length}`); }
            if (layer4) { values.push(layer4); filters.push(`i.layer4 = $${values.length}`); }

            const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

            const listQuery = `
                SELECT i.*
                FROM fuel_emission_factor i
                ${whereClause}
                ORDER BY i.ef_code ASC NULLS LAST, i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM fuel_emission_factor i
                ${whereClause};
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

// export async function fuelEmissionFactorDataSetup(req: any, res: any) {
//     return withClient(async (client: any) => {
//         try {
//             const data = req.body;

//             if (!Array.isArray(data) || data.length === 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "Invalid input array", 400, null));
//             }

//             // Check duplicate names inside payload
//             const names = data.map(d => d.fuel_type.toLowerCase());
//             const duplicatePayloadNames = names.filter(
//                 (n, i) => names.indexOf(n) !== i
//             );

//             if (duplicatePayloadNames.length > 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "Duplicate names in payload", 400, null));
//             }

//             // Check existing names in DB
//             const existing = await client.query(
//                 `SELECT fuel_type FROM fuel_emission_factor WHERE fuel_type ILIKE ANY($1)`,
//                 [names]
//             );

//             if (existing.rowCount > 0) {
//                 return res
//                     .status(400)
//                     .send(generateResponse(false, "One or more names already exist", 400, null));
//             }

//             const rows: any[] = [];

//             let nextNumber = await generateDynamicCode(client, 'FEF', 'fuel_emission_factor');

//             for (const item of data) {

//                 if (!item.fuel_type) {
//                     throw new Error("fuel_type is required");
//                 }

//                 const code = formatCode('FEF', nextNumber);
//                 nextNumber++;

//                 rows.push({
//                     fef_id: ulid(),
//                     code: code,
//                     fuel_type: item.fuel_type,
//                     ef_eu_region: item.ef_eu_region,
//                     ef_india_region: item.ef_india_region,
//                     ef_global_region: item.ef_global_region,
//                     created_by: req.user_id,
//                     year: item.year,
//                     iso_country_code: item.iso_country_code,
//                     unit: item.unit
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
//                 INSERT INTO fuel_emission_factor (${columns.join(', ')})
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
export async function fuelEmissionFactorDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const rowLabel = item.ef_code ? `row ${item.ef_code}` : `row index ${i}`;
                if (!item.ef_code) {
                    return res.status(400).send(generateResponse(false, `Missing ID (ef_code) in ${rowLabel}`, 400, null));
                }
                if (!item.region) {
                    return res.status(400).send(generateResponse(false, `Missing Region in ${rowLabel}`, 400, null));
                }
                if (item.ef_value === undefined || item.ef_value === null || item.ef_value === '') {
                    return res.status(400).send(generateResponse(false, `Missing EF Value in ${rowLabel}`, 400, null));
                }
            }

            const efCodes = data.map((d: any) => d.ef_code);
            const dupCodes = efCodes.filter((c: string, i: number) => efCodes.indexOf(c) !== i);
            if (dupCodes.length > 0) {
                return res.status(400).send(
                    generateResponse(false, `Duplicate ef_code in payload: ${[...new Set(dupCodes)].join(', ')}`, 400, null)
                );
            }

            const existing = await client.query(
                `SELECT ef_code FROM fuel_emission_factor WHERE ef_code = ANY($1)`,
                [efCodes]
            );

            if (existing.rowCount > 0) {
                const existingCodes = existing.rows.map((r: any) => r.ef_code);
                return res.status(400).send(
                    generateResponse(false, `ef_code(s) already exist: ${existingCodes.join(', ')}`, 400, null)
                );
            }

            const rows = data.map((item: any) => ({
                fef_id: ulid(),
                ef_code: item.ef_code,
                scope: item.scope || null,
                layer1: item.layer1 || null,
                layer2: item.layer2 || null,
                layer3: item.layer3 || null,
                layer4: item.layer4,
                region: item.region,
                year: item.year || null,
                ef_value: item.ef_value,
                unit: item.unit || null,
                data_source: item.data_source || null,
                created_by: req.user_id
            }));

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
                INSERT INTO fuel_emission_factor (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(
                generateResponse(true, "Bulk import successful", 200, result.rows)
            );

        } catch (error: any) {
            return res
                .status(500)
                .send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function deleteFuelEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { fef_id } = req.body;

            await client.query(
                `DELETE FROM fuel_emission_factor WHERE fef_id = $1`,
                [fef_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getFuelEmissionFactorDropDownnList(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            const listQuery = `
                SELECT i.*
                FROM fuel_emission_factor i
                ORDER BY i.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getFuelFuelTypeDropDownnList(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const listQuery = `
                SELECT
                    fuel.ft_id,
                    CONCAT(fuel.name, ' - ', fuelt.name) AS combined_name
                FROM fuel_types fuel
                INNER JOIN sub_fuel_types fuelt
                    ON fuelt.ft_id = fuel.ft_id
                ORDER BY fuel.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(
                generateResponse(true, "List fetched successfully", 200, listResult.rows)
            );
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// Packaging Treatment Type
export async function addPackingTreatmentType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name } = req.body;
            const ptt_id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM packaging_treatment_type 
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
            INSERT INTO packaging_treatment_type (ptt_id, code, name)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
            const result = await client.query(query, [ptt_id, code, name]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updatePackingTreatmentType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "ptt_id")
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "ptt_id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE packaging_treatment_type
                SET ${columnValuePairs}, update_date = NOW()
                WHERE ptt_id = $${values.length + 1}
                RETURNING *;
            `;
                const result = await client.query(query, [...values, item.ptt_id]);

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

export async function getPackingTreatmentTypeListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;

            let whereClause = '';
            let orderByClause = 'ORDER BY i.created_date ASC';

            if (searchValue) {
                whereClause += ` AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
            }

            const listQuery = `
            SELECT i.* 
            FROM packaging_treatment_type i
            WHERE 1=1 ${whereClause}
            GROUP BY i.ptt_id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM packaging_treatment_type i
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

export async function PackingTreatmentTypeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                ptt_id: ulid(),
                code: item.code,
                name: item.name,
                created_by: req.user_id,
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
            INSERT INTO packaging_treatment_type (${columns.join(', ')})
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

export async function getPackingTreatmentTypeDropDownList(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            
                        const query = `
    SELECT DISTINCT ON (w.name)
        w.ptt_id,
        w.name,
        w.code
    FROM packaging_treatment_type w
    ORDER BY w.name ASC, w.ptt_id ASC;
`;

            // const query = `SELECT ptt_id, code, name FROM packaging_treatment_type;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function deletePackingTreatmentType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { ptt_id } = req.body;
            const query = `DELETE FROM packaging_treatment_type WHERE ptt_id = $1;`;
            await client.query(query, [ptt_id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

///Packaging Emission Factor
export async function addPackagingEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const {
                ef_code, scope,
                layer1, layer2, layer3, layer4,
                region, year, ef_value, unit, data_source
            } = req.body;

            if (!ef_code) throw new Error("EF code (Excel ID) is required");
            if (!region) throw new Error("Region is required");
            if (ef_value === undefined || ef_value === null || ef_value === '') {
                throw new Error("EF Value is required");
            }

            const dupCheck = await client.query(
                `SELECT 1 FROM packaging_material_treatment_type_emission_factor WHERE ef_code = $1`,
                [ef_code]
            );
            if (dupCheck.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, `EF code '${ef_code}' already exists`, 400, null));
            }

            const pef_id = ulid();

            const insertQuery = `
                INSERT INTO packaging_material_treatment_type_emission_factor (
                    pef_id, ef_code, scope,
                    layer1, layer2, layer3, layer4,
                    region, year, ef_value, unit, data_source,
                    created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *;
            `;

            const result = await client.query(insertQuery, [
                pef_id, ef_code, scope,
                layer1, layer2, layer3, layer4,
                region, year, ef_value, unit, data_source,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updatePackagingEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.pef_id) throw new Error("pef_id is required");
                if (!item.ef_code) throw new Error("EF code (Excel ID) is required");
                if (!item.region) throw new Error("Region is required");
                if (item.ef_value === undefined || item.ef_value === null || item.ef_value === '') {
                    throw new Error("EF Value is required");
                }

                const dupCheck = await client.query(
                    `SELECT 1
                     FROM packaging_material_treatment_type_emission_factor
                     WHERE ef_code = $1 AND pef_id <> $2`,
                    [item.ef_code, item.pef_id]
                );

                if (dupCheck.rowCount > 0) {
                    return res.status(400).send(
                        generateResponse(false, `EF code '${item.ef_code}' already exists`, 400, null)
                    );
                }

                const updateQuery = `
                    UPDATE packaging_material_treatment_type_emission_factor SET
                        ef_code     = $2,
                        scope       = $3,
                        layer1      = $4,
                        layer2      = $5,
                        layer3      = $6,
                        layer4      = $7,
                        region      = $8,
                        year        = $9,
                        ef_value    = $10,
                        unit        = $11,
                        data_source = $12,
                        updated_by  = $13,
                        update_date = CURRENT_TIMESTAMP
                    WHERE pef_id = $1
                    RETURNING *;
                `;

                const result = await client.query(updateQuery, [
                    item.pef_id, item.ef_code, item.scope,
                    item.layer1, item.layer2, item.layer3, item.layer4,
                    item.region, item.year, item.ef_value, item.unit, item.data_source,
                    req.user_id
                ]);

                if (result.rows.length) updatedRows.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function packagingEmissionFactorDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const rowLabel = item.ef_code ? `row ${item.ef_code}` : `row index ${i}`;
                if (!item.ef_code) {
                    return res.status(400).send(generateResponse(false, `Missing ID (ef_code) in ${rowLabel}`, 400, null));
                }
                if (!item.region) {
                    return res.status(400).send(generateResponse(false, `Missing Region in ${rowLabel}`, 400, null));
                }
                if (item.ef_value === undefined || item.ef_value === null || item.ef_value === '') {
                    return res.status(400).send(generateResponse(false, `Missing EF Value in ${rowLabel}`, 400, null));
                }
            }

            const efCodes = data.map((d: any) => d.ef_code);
            const dupCodes = efCodes.filter((c: string, i: number) => efCodes.indexOf(c) !== i);
            if (dupCodes.length > 0) {
                return res.status(400).send(
                    generateResponse(false, `Duplicate ef_code in payload: ${[...new Set(dupCodes)].join(', ')}`, 400, null)
                );
            }

            const existing = await client.query(
                `SELECT ef_code FROM packaging_material_treatment_type_emission_factor WHERE ef_code = ANY($1)`,
                [efCodes]
            );

            if (existing.rowCount > 0) {
                const existingCodes = existing.rows.map((r: any) => r.ef_code);
                return res.status(400).send(
                    generateResponse(false, `ef_code(s) already exist: ${existingCodes.join(', ')}`, 400, null)
                );
            }

            const rows = data.map((item: any) => ({
                pef_id: ulid(),
                ef_code: item.ef_code,
                scope: item.scope || null,
                layer1: item.layer1 || null,
                layer2: item.layer2 || null,
                layer3: item.layer3 || null,
                layer4: item.layer4,
                region: item.region,
                year: item.year || null,
                ef_value: item.ef_value,
                unit: item.unit || null,
                data_source: item.data_source || null,
                created_by: req.user_id
            }));

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
                INSERT INTO packaging_material_treatment_type_emission_factor
                (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function getPackagingEmissionFactorListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue, region, year, layer1, layer2, layer3, layer4 } = req.query;
            const filters: string[] = [];
            const values: any[] = [];

            if (searchValue) {
                values.push(`%${searchValue}%`);
                const p = `$${values.length}`;
                filters.push(`(
                    pef.ef_code ILIKE ${p}
                    OR pef.layer1 ILIKE ${p}
                    OR pef.layer2 ILIKE ${p}
                    OR pef.layer3 ILIKE ${p}
                    OR pef.layer4 ILIKE ${p}
                )`);
            }
            if (region) { values.push(region); filters.push(`pef.region = $${values.length}`); }
            if (year) { values.push(year); filters.push(`pef.year = $${values.length}`); }
            if (layer1) { values.push(layer1); filters.push(`pef.layer1 = $${values.length}`); }
            if (layer2) { values.push(layer2); filters.push(`pef.layer2 = $${values.length}`); }
            if (layer3) { values.push(layer3); filters.push(`pef.layer3 = $${values.length}`); }
            if (layer4) { values.push(layer4); filters.push(`pef.layer4 = $${values.length}`); }

            const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

            const listQuery = `
                SELECT pef.*
                FROM packaging_material_treatment_type_emission_factor pef
                ${whereClause}
                ORDER BY pef.ef_code ASC NULLS LAST, pef.created_date DESC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM packaging_material_treatment_type_emission_factor pef
                ${whereClause};
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

export async function getPackagingEmissionFactorDropDownList(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `
                SELECT
                    pef.pef_id,
                    pef.code,
                    pef.material_type,
                    pef.ptt_id,
                    ptt.name
                FROM packaging_material_treatment_type_emission_factor pef
                LEFT JOIN packaging_treatment_type ptt
                    ON ptt.ptt_id = pef.ptt_id
                ORDER BY pef.material_type ASC;
            `;

            const result = await client.query(query);

            return res.send(
                generateResponse(true, "Dropdown list fetched successfully", 200, result.rows)
            );
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getPackagingTypeEmissionFactorDropDownList(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `
                SELECT
                    pef.pef_id,
                    pef.code,
                    pef.material_type,
                    pef.ptt_id
                FROM packaging_material_treatment_type_emission_factor pef
                ORDER BY pef.material_type ASC;
            `;

            const result = await client.query(query);

            return res.send(
                generateResponse(true, "Dropdown list fetched successfully", 200, result.rows)
            );
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function deletePackagingEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { pef_id } = req.body;

            if (!pef_id) {
                return res
                    .status(400)
                    .send(generateResponse(false, "pef_id is required", 400, null));
            }

            const check = await client.query(
                `SELECT 1 
                 FROM packaging_material_treatment_type_emission_factor 
                 WHERE pef_id = $1`,
                [pef_id]
            );

            if (check.rowCount === 0) {
                return res
                    .status(404)
                    .send(generateResponse(false, "Record not found", 404, null));
            }

            await client.query(
                `DELETE 
                 FROM packaging_material_treatment_type_emission_factor 
                 WHERE pef_id = $1`,
                [pef_id]
            );

            return res.send(
                generateResponse(true, "Deleted successfully", 200, null)
            );
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// Waste Treatment Type
export async function addWasteTreatmentType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name } = req.body;
            const wtt_id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM waste_treatment_type 
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
            INSERT INTO waste_treatment_type (wtt_id, code, name)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
            const result = await client.query(query, [wtt_id, code, name]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateWasteTreatmentType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "wtt_id")
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "wtt_id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE waste_treatment_type
                SET ${columnValuePairs}, update_date = NOW()
                WHERE wtt_id = $${values.length + 1}
                RETURNING *;
            `;
                const result = await client.query(query, [...values, item.wtt_id]);

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

export async function getWasteTreatmentTypeListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;

            let whereClause = '';
            let orderByClause = 'ORDER BY i.created_date ASC';

            if (searchValue) {
                whereClause += ` AND (i.code ILIKE $1 OR i.name ILIKE $1)`;
            }

            const listQuery = `
            SELECT i.* 
            FROM waste_treatment_type i
            WHERE 1=1 ${whereClause}
            GROUP BY i.wtt_id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM waste_treatment_type i
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

export async function WasteTreatmentTypeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                wtt_id: ulid(),
                code: item.code,
                name: item.name,
                created_by: req.user_id,
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
            INSERT INTO waste_treatment_type (${columns.join(', ')})
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

export async function getWasteTreatmentTypeDropDownList(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            // const query = `SELECT wtt_id, code, name FROM waste_treatment_type;`;
            const query = `
    SELECT DISTINCT ON (w.name)
        w.wtt_id,
        w.name,
        w.code
    FROM waste_treatment_type w
    ORDER BY w.name ASC, w.wtt_id ASC;
`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function deleteWasteTreatmentType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { wtt_id } = req.body;
            const query = `DELETE FROM waste_treatment_type WHERE wtt_id = $1;`;
            await client.query(query, [wtt_id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// Waste Emission Factor
export async function addWasteEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const {
                ef_code, scope,
                layer1, layer2, layer3, layer4,
                region, year, ef_value, unit, data_source
            } = req.body;

            if (!ef_code) throw new Error("EF code (Excel ID) is required");
            if (!region) throw new Error("Region is required");
            if (ef_value === undefined || ef_value === null || ef_value === '') {
                throw new Error("EF Value is required");
            }

            const dupCheck = await client.query(
                `SELECT 1 FROM waste_material_treatment_type_emission_factor WHERE ef_code = $1`,
                [ef_code]
            );
            if (dupCheck.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, `EF code '${ef_code}' already exists`, 400, null));
            }

            const wmttef_id = ulid();

            const query = `
                INSERT INTO waste_material_treatment_type_emission_factor (
                    wmttef_id, ef_code, scope,
                    layer1, layer2, layer3, layer4,
                    region, year, ef_value, unit, data_source,
                    created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *;
            `;

            const result = await client.query(query, [
                wmttef_id, ef_code, scope,
                layer1, layer2, layer3, layer4,
                region, year, ef_value, unit, data_source,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateWasteEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;
            const updatedRows: any[] = [];

            for (const item of data) {
                if (!item.wmttef_id) throw new Error("wmttef_id is required");
                if (!item.ef_code) throw new Error("EF code (Excel ID) is required");
                if (!item.region) throw new Error("Region is required");
                if (item.ef_value === undefined || item.ef_value === null || item.ef_value === '') {
                    throw new Error("EF Value is required");
                }

                const dupCheck = await client.query(
                    `SELECT 1
                     FROM waste_material_treatment_type_emission_factor
                     WHERE ef_code = $1 AND wmttef_id <> $2`,
                    [item.ef_code, item.wmttef_id]
                );

                if (dupCheck.rowCount > 0) {
                    return res.status(400).send(
                        generateResponse(false, `EF code '${item.ef_code}' already exists`, 400, null)
                    );
                }

                const query = `
                    UPDATE waste_material_treatment_type_emission_factor SET
                        ef_code     = $2,
                        scope       = $3,
                        layer1      = $4,
                        layer2      = $5,
                        layer3      = $6,
                        layer4      = $7,
                        region      = $8,
                        year        = $9,
                        ef_value    = $10,
                        unit        = $11,
                        data_source = $12,
                        updated_by  = $13,
                        update_date = CURRENT_TIMESTAMP
                    WHERE wmttef_id = $1
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.wmttef_id, item.ef_code, item.scope,
                    item.layer1, item.layer2, item.layer3, item.layer4,
                    item.region, item.year, item.ef_value, item.unit, item.data_source,
                    req.user_id
                ]);

                if (result.rows.length) updatedRows.push(result.rows[0]);
            }

            return res.send(generateResponse(true, "Updated successfully", 200, updatedRows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function wasteEmissionFactorDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res.status(400).send(
                    generateResponse(false, "Invalid input array", 400, null)
                );
            }

            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const rowLabel = item.ef_code ? `row ${item.ef_code}` : `row index ${i}`;
                if (!item.ef_code) {
                    return res.status(400).send(generateResponse(false, `Missing ID (ef_code) in ${rowLabel}`, 400, null));
                }
                if (!item.region) {
                    return res.status(400).send(generateResponse(false, `Missing Region in ${rowLabel}`, 400, null));
                }
                if (item.ef_value === undefined || item.ef_value === null || item.ef_value === '') {
                    return res.status(400).send(generateResponse(false, `Missing EF Value in ${rowLabel}`, 400, null));
                }
            }

            const efCodes = data.map((d: any) => d.ef_code);
            const dupCodes = efCodes.filter((c: string, i: number) => efCodes.indexOf(c) !== i);
            if (dupCodes.length > 0) {
                return res.status(400).send(
                    generateResponse(false, `Duplicate ef_code in payload: ${[...new Set(dupCodes)].join(', ')}`, 400, null)
                );
            }

            const existing = await client.query(
                `SELECT ef_code FROM waste_material_treatment_type_emission_factor WHERE ef_code = ANY($1)`,
                [efCodes]
            );

            if (existing.rowCount > 0) {
                const existingCodes = existing.rows.map((r: any) => r.ef_code);
                return res.status(400).send(
                    generateResponse(false, `ef_code(s) already exist: ${existingCodes.join(', ')}`, 400, null)
                );
            }

            const rows = data.map((item: any) => ({
                wmttef_id: ulid(),
                ef_code: item.ef_code,
                scope: item.scope || null,
                layer1: item.layer1 || null,
                layer2: item.layer2 || null,
                layer3: item.layer3 || null,
                layer4: item.layer4,
                region: item.region,
                year: item.year || null,
                ef_value: item.ef_value,
                unit: item.unit || null,
                data_source: item.data_source || null,
                created_by: req.user_id
            }));

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
                INSERT INTO waste_material_treatment_type_emission_factor
                (${columns.join(', ')})
                VALUES ${placeholders.join(', ')}
                RETURNING *;
            `;

            const result = await client.query(insertQuery, values);

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
        } catch (error: any) {
            return res.status(500).send(
                generateResponse(false, error.message, 500, null)
            );
        }
    });
}

export async function getWasteEmissionFactorListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue, region, year, layer1, layer2, layer3, layer4 } = req.query;
            const filters: string[] = [];
            const values: any[] = [];

            if (searchValue) {
                values.push(`%${searchValue}%`);
                const p = `$${values.length}`;
                filters.push(`(
                    w.ef_code ILIKE ${p}
                    OR w.layer1 ILIKE ${p}
                    OR w.layer2 ILIKE ${p}
                    OR w.layer3 ILIKE ${p}
                    OR w.layer4 ILIKE ${p}
                )`);
            }
            if (region) { values.push(region); filters.push(`w.region = $${values.length}`); }
            if (year) { values.push(year); filters.push(`w.year = $${values.length}`); }
            if (layer1) { values.push(layer1); filters.push(`w.layer1 = $${values.length}`); }
            if (layer2) { values.push(layer2); filters.push(`w.layer2 = $${values.length}`); }
            if (layer3) { values.push(layer3); filters.push(`w.layer3 = $${values.length}`); }
            if (layer4) { values.push(layer4); filters.push(`w.layer4 = $${values.length}`); }

            const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

            const listQuery = `
                SELECT w.*
                FROM waste_material_treatment_type_emission_factor w
                ${whereClause}
                ORDER BY w.ef_code ASC NULLS LAST, w.created_date DESC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM waste_material_treatment_type_emission_factor w
                ${whereClause};
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

export async function getWasteEmissionFactorDropDownList(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            // const query = `
            //     SELECT
            //         w.wmttef_id,
            //         w.code,
            //         w.waste_type,
            //         w.wtt_id,
            //         wt.name
            //     FROM waste_material_treatment_type_emission_factor w
            //     LEFT JOIN waste_treatment_type wt
            //         ON wt.wtt_id = w.wtt_id
            //     ORDER BY w.waste_type ASC;
            // `;

                        const query = `
    SELECT DISTINCT ON (w.waste_type)
       w.waste_type,
        w.code
    FROM waste_material_treatment_type_emission_factor w
    ORDER BY w.waste_type ASC;
`;

            const result = await client.query(query);

            return res.send(
                generateResponse(true, "Dropdown list fetched successfully", 200, result.rows)
            );
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function deleteWasteEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { wmttef_id } = req.body;

            if (!wmttef_id) {
                return res.status(400).send(
                    generateResponse(false, "wmttef_id is required", 400, null)
                );
            }

            const check = await client.query(
                `SELECT 1
                 FROM waste_material_treatment_type_emission_factor
                 WHERE wmttef_id = $1`,
                [wmttef_id]
            );

            if (check.rowCount === 0) {
                return res.status(404).send(
                    generateResponse(false, "Record not found", 404, null)
                );
            }

            await client.query(
                `DELETE
                 FROM waste_material_treatment_type_emission_factor
                 WHERE wmttef_id = $1`,
                [wmttef_id]
            );

            return res.send(
                generateResponse(true, "Deleted successfully", 200, null)
            );
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

//vehicle Type Emission Factor
export async function addVehicleTypeEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const {
                ef_code, scope,
                layer1, layer2, layer3, layer4,
                region, year, ef_value, unit, data_source
            } = req.body;

            if (!ef_code) throw new Error("EF code (Excel ID) is required");
            if (!region) throw new Error("Region is required");
            if (ef_value === undefined || ef_value === null || ef_value === '') {
                throw new Error("EF Value is required");
            }

            const dupCheck = await client.query(
                `SELECT 1 FROM vehicle_type_emission_factor WHERE ef_code = $1`,
                [ef_code]
            );
            if (dupCheck.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, `EF code '${ef_code}' already exists`, 400, null));
            }

            const id = ulid();

            const query = `
                INSERT INTO vehicle_type_emission_factor (
                    wtef_id, ef_code, scope,
                    layer1, layer2, layer3, layer4,
                    region, year, ef_value, unit, data_source,
                    created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *;
            `;

            const result = await client.query(query, [
                id, ef_code, scope,
                layer1, layer2, layer3, layer4,
                region, year, ef_value, unit, data_source,
                req.user_id
            ]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateVehicleTypeEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {
                if (!item.wtef_id) throw new Error("wtef_id is required");
                if (!item.ef_code) throw new Error("EF code (Excel ID) is required");
                if (!item.region) throw new Error("Region is required");
                if (item.ef_value === undefined || item.ef_value === null || item.ef_value === '') {
                    throw new Error("EF Value is required");
                }

                const dupCheck = await client.query(
                    `SELECT 1
                     FROM vehicle_type_emission_factor
                     WHERE ef_code = $1 AND wtef_id <> $2`,
                    [item.ef_code, item.wtef_id]
                );

                if (dupCheck.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `EF code '${item.ef_code}' already exists`, 400, null));
                }

                const query = `
                    UPDATE vehicle_type_emission_factor SET
                        ef_code     = $2,
                        scope       = $3,
                        layer1      = $4,
                        layer2      = $5,
                        layer3      = $6,
                        layer4      = $7,
                        region      = $8,
                        year        = $9,
                        ef_value    = $10,
                        unit        = $11,
                        data_source = $12,
                        updated_by  = $13
                    WHERE wtef_id = $1
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.wtef_id, item.ef_code, item.scope,
                    item.layer1, item.layer2, item.layer3, item.layer4,
                    item.region, item.year, item.ef_value, item.unit, item.data_source,
                    req.user_id
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

export async function getVehicleTypeEmissionFactorListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue, region, year, layer1, layer2, layer3, layer4 } = req.query;
            const filters: string[] = [];
            const values: any[] = [];

            if (searchValue) {
                values.push(`%${searchValue}%`);
                const p = `$${values.length}`;
                filters.push(`(
                    i.ef_code ILIKE ${p}
                    OR i.layer1 ILIKE ${p}
                    OR i.layer2 ILIKE ${p}
                    OR i.layer3 ILIKE ${p}
                    OR i.layer4 ILIKE ${p}
                )`);
            }
            if (region) { values.push(region); filters.push(`i.region = $${values.length}`); }
            if (year) { values.push(year); filters.push(`i.year = $${values.length}`); }
            if (layer1) { values.push(layer1); filters.push(`i.layer1 = $${values.length}`); }
            if (layer2) { values.push(layer2); filters.push(`i.layer2 = $${values.length}`); }
            if (layer3) { values.push(layer3); filters.push(`i.layer3 = $${values.length}`); }
            if (layer4) { values.push(layer4); filters.push(`i.layer4 = $${values.length}`); }

            const whereClause = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

            const listQuery = `
                SELECT i.*
                FROM vehicle_type_emission_factor i
                ${whereClause}
                ORDER BY i.ef_code ASC NULLS LAST, i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM vehicle_type_emission_factor i
                ${whereClause};
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

export async function vehicleTypeEmissionFactorDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            for (let i = 0; i < data.length; i++) {
                const item = data[i];
                const rowLabel = item.ef_code ? `row ${item.ef_code}` : `row index ${i}`;
                if (!item.ef_code) {
                    return res.status(400).send(generateResponse(false, `Missing ID (ef_code) in ${rowLabel}`, 400, null));
                }
                if (!item.region) {
                    return res.status(400).send(generateResponse(false, `Missing Region in ${rowLabel}`, 400, null));
                }
                if (item.ef_value === undefined || item.ef_value === null || item.ef_value === '') {
                    return res.status(400).send(generateResponse(false, `Missing EF Value in ${rowLabel}`, 400, null));
                }
            }

            const efCodes = data.map((d: any) => d.ef_code);
            const dupCodes = efCodes.filter((c: string, i: number) => efCodes.indexOf(c) !== i);
            if (dupCodes.length > 0) {
                return res.status(400).send(
                    generateResponse(false, `Duplicate ef_code in payload: ${[...new Set(dupCodes)].join(', ')}`, 400, null)
                );
            }

            const existing = await client.query(
                `SELECT ef_code FROM vehicle_type_emission_factor WHERE ef_code = ANY($1)`,
                [efCodes]
            );

            if (existing.rowCount > 0) {
                const existingCodes = existing.rows.map((r: any) => r.ef_code);
                return res.status(400).send(
                    generateResponse(false, `ef_code(s) already exist: ${existingCodes.join(', ')}`, 400, null)
                );
            }

            const rows = data.map((item: any) => ({
                wtef_id: ulid(),
                ef_code: item.ef_code,
                scope: item.scope || null,
                layer1: item.layer1 || null,
                layer2: item.layer2 || null,
                layer3: item.layer3 || null,
                layer4: item.layer4,
                region: item.region,
                year: item.year || null,
                ef_value: item.ef_value,
                unit: item.unit || null,
                data_source: item.data_source || null,
                created_by: req.user_id
            }));

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
                INSERT INTO vehicle_type_emission_factor (${columns.join(', ')})
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

export async function deleteVehicleTypeEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { wtef_id } = req.body;

            await client.query(
                `DELETE FROM vehicle_type_emission_factor WHERE wtef_id = $1`,
                [wtef_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getVehicleTypeEmissionFactorDropDownnList(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            const listQuery = `
                SELECT i.*
                FROM vehicle_type_emission_factor i
                ORDER BY i.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

// ============================================================
// Unified Categorized Emission Factor endpoints.
// One router handles all 6 EF types via `ef_group` param/body field.
// Used by the new frontend EF setup pages AND by the supplier
// questionnaire layer cascade. The list endpoint is intentionally
// public — unauthenticated supplier links must read the rows.
// ============================================================

type EfGroup = "materials" | "electricity" | "fuel" | "packaging" | "vehicle" | "waste";

interface EfGroupConfig {
    table: string;
    pk: string;
}

const EF_GROUP_CONFIG: Record<EfGroup, EfGroupConfig> = {
    materials:   { table: "materials_emission_factor",                         pk: "mef_id"    },
    electricity: { table: "electricity_emission_factor",                       pk: "eef_id"    },
    fuel:        { table: "fuel_emission_factor",                              pk: "fef_id"    },
    packaging:   { table: "packaging_material_treatment_type_emission_factor", pk: "pef_id"    },
    vehicle:     { table: "vehicle_type_emission_factor",                      pk: "wtef_id"   },
    waste:       { table: "waste_material_treatment_type_emission_factor",     pk: "wmttef_id" },
};

function resolveGroup(ef_group: any): EfGroupConfig | null {
    if (typeof ef_group !== "string") return null;
    const key = ef_group.toLowerCase() as EfGroup;
    return EF_GROUP_CONFIG[key] || null;
}

function toCategorizedRow(ef_group: string, row: any): Record<string, any> {
    return {
        ef_group,
        ef_id: row.ef_code ?? null,
        scope: row.scope ?? null,
        layer1: row.layer1 ?? null,
        layer2: row.layer2 ?? null,
        layer3: row.layer3 ?? null,
        layer4: row.layer4 ?? null,
        region: row.region ?? null,
        year: row.year != null ? String(row.year) : null,
        ef_value: row.ef_value != null ? String(row.ef_value) : null,
        unit: row.unit ?? null,
        data_source: row.data_source ?? null,
        category: null,
    };
}

// GET /list?ef_group=materials  — PUBLIC (no auth, supplier link uses it)
export async function listCategorizedEmissionFactors(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const cfg = resolveGroup(req.query?.ef_group);
            if (!cfg) {
                return res.status(400).send(
                    generateResponse(false, "Invalid or missing ef_group", 400, null)
                );
            }
            const result = await client.query(
                `SELECT ef_code, scope, layer1, layer2, layer3, layer4,
                        region, year, ef_value, unit, data_source
                 FROM ${cfg.table}
                 WHERE ef_code IS NOT NULL
                 ORDER BY ef_code ASC;`
            );
            const rows = result.rows.map((r: any) => toCategorizedRow(req.query.ef_group, r));
            return res.send(generateResponse(true, "List fetched", 200, rows));
        } catch (error: any) {
            return res.status(500).send(generateResponse(false, error.message, 500, null));
        }
    });
}

export async function addCategorizedEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { ef_group, ef_id, scope, layer1, layer2, layer3, layer4,
                    region, year, ef_value, unit, data_source } = req.body || {};
            const cfg = resolveGroup(ef_group);
            if (!cfg) throw new Error("Invalid or missing ef_group");
            if (!ef_id) throw new Error("ef_id is required");
            if (!region) throw new Error("region is required");
            if (ef_value === undefined || ef_value === null || ef_value === "") {
                throw new Error("ef_value is required");
            }

            const dup = await client.query(
                `SELECT 1 FROM ${cfg.table} WHERE ef_code = $1`,
                [ef_id]
            );
            if (dup.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, `ef_id '${ef_id}' already exists`, 400, null)
                );
            }

            const insertSql = `
                INSERT INTO ${cfg.table} (
                    ${cfg.pk}, ef_code, scope,
                    layer1, layer2, layer3, layer4,
                    region, year, ef_value, unit, data_source,
                    created_by
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                RETURNING *;
            `;
            const result = await client.query(insertSql, [
                ulid(), ef_id, scope || null,
                layer1 || null, layer2 || null, layer3 || null, layer4 || null,
                region, year || null, ef_value, unit || null, data_source || null,
                req.user_id || null,
            ]);
            return res.send(generateResponse(true, "Added", 200, toCategorizedRow(ef_group, result.rows[0])));
        } catch (error: any) {
            return res.status(400).send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateCategorizedEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { ef_group, ef_id, scope, layer1, layer2, layer3, layer4,
                    region, year, ef_value, unit, data_source } = req.body || {};
            const cfg = resolveGroup(ef_group);
            if (!cfg) throw new Error("Invalid or missing ef_group");
            if (!ef_id) throw new Error("ef_id is required");

            const updateSql = `
                UPDATE ${cfg.table} SET
                    scope       = $2,
                    layer1      = $3,
                    layer2      = $4,
                    layer3      = $5,
                    layer4      = $6,
                    region      = $7,
                    year        = $8,
                    ef_value    = $9,
                    unit        = $10,
                    data_source = $11,
                    updated_by  = $12,
                    update_date = CURRENT_TIMESTAMP
                WHERE ef_code = $1
                RETURNING *;
            `;
            const result = await client.query(updateSql, [
                ef_id, scope || null,
                layer1 || null, layer2 || null, layer3 || null, layer4 || null,
                region || null, year || null, ef_value ?? null, unit || null, data_source || null,
                req.user_id || null,
            ]);
            if (result.rowCount === 0) {
                return res.status(404).send(generateResponse(false, `ef_id '${ef_id}' not found`, 404, null));
            }
            return res.send(generateResponse(true, "Updated", 200, toCategorizedRow(ef_group, result.rows[0])));
        } catch (error: any) {
            return res.status(400).send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function deleteCategorizedEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { ef_group, ef_id } = req.body || {};
            const cfg = resolveGroup(ef_group);
            if (!cfg) throw new Error("Invalid or missing ef_group");
            if (!ef_id) throw new Error("ef_id is required");
            await client.query(`DELETE FROM ${cfg.table} WHERE ef_code = $1`, [ef_id]);
            return res.send(generateResponse(true, "Deleted", 200, null));
        } catch (error: any) {
            return res.status(400).send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function bulkAddCategorizedEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { ef_group, rows } = req.body || {};
            const cfg = resolveGroup(ef_group);
            if (!cfg) throw new Error("Invalid or missing ef_group");
            if (!Array.isArray(rows) || rows.length === 0) {
                return res.status(400).send(generateResponse(false, "rows array is required", 400, null));
            }

            const efIds = rows.map((r: any) => r.ef_id).filter(Boolean);
            const existing = await client.query(
                `SELECT ef_code FROM ${cfg.table} WHERE ef_code = ANY($1)`,
                [efIds]
            );
            if (existing.rowCount > 0) {
                const existingCodes = existing.rows.map((r: any) => r.ef_code);
                return res.status(400).send(
                    generateResponse(false, `ef_id(s) already exist: ${existingCodes.join(", ")}`, 400, null)
                );
            }

            const built = rows.map((item: any) => ({
                [cfg.pk]: ulid(),
                ef_code: item.ef_id,
                scope: item.scope || null,
                layer1: item.layer1 || null,
                layer2: item.layer2 || null,
                layer3: item.layer3 || null,
                layer4: item.layer4 || null,
                region: item.region,
                year: item.year || null,
                ef_value: item.ef_value,
                unit: item.unit || null,
                data_source: item.data_source || null,
                created_by: req.user_id || null,
            }));

            const columns = Object.keys(built[0]);
            const values: any[] = [];
            const placeholders: string[] = [];
            built.forEach((row, rowIndex) => {
                const rowValues = Object.values(row);
                values.push(...rowValues);
                placeholders.push(
                    `(${rowValues.map((_, i) => `$${rowIndex * rowValues.length + i + 1}`).join(", ")})`
                );
            });

            const insertSql = `
                INSERT INTO ${cfg.table} (${columns.join(", ")})
                VALUES ${placeholders.join(", ")}
                RETURNING *;
            `;
            const result = await client.query(insertSql, values);
            const out = result.rows.map((r: any) => toCategorizedRow(ef_group, r));
            return res.send(generateResponse(true, "Bulk added", 200, out));
        } catch (error: any) {
            return res.status(500).send(generateResponse(false, error.message, 500, null));
        }
    });
}

// Helper for supplier questionnaire — resolve ef_code by layer match.
export async function resolveEfCodeForGroup(
    client: any,
    ef_group: EfGroup,
    layers: { layer1?: any; layer2?: any; layer3?: any; layer4?: any },
    region?: any,
    year?: any
): Promise<string | null> {
    const cfg = EF_GROUP_CONFIG[ef_group];
    if (!cfg) return null;

    // Builds and runs a lookup with the given filters. Returns null if no match.
    const runLookup = async (includeYear: boolean): Promise<string | null> => {
        const conds: string[] = [];
        const params: any[] = [];
        const addEq = (col: string, val: any) => {
            if (val === undefined || val === null || val === "") {
                conds.push(`(${col} IS NULL OR ${col} = '')`);
            } else {
                params.push(val);
                conds.push(`${col} = $${params.length}`);
            }
        };
        addEq("layer1", layers.layer1);
        addEq("layer2", layers.layer2);
        addEq("layer3", layers.layer3);
        addEq("layer4", layers.layer4);
        if (region) {
            params.push(region);
            conds.push(`region = $${params.length}`);
        }
        if (includeYear && year) {
            params.push(year);
            conds.push(`year = $${params.length}`);
        }

        const sql = `
            SELECT ef_code FROM ${cfg.table}
            WHERE ef_code IS NOT NULL AND ${conds.join(" AND ")}
            ORDER BY year DESC NULLS LAST
            LIMIT 1;
        `;
        const result = await client.query(sql, params);
        return result.rows[0]?.ef_code || null;
    };

    // Try exact year match first (preserves existing behavior when EF exists for the requested year).
    if (year) {
        const exact = await runLookup(true);
        if (exact) return exact;
    }
    // Fall back to most recent available year. Many EF tables aren't republished
    // every year; without this fallback, valid combos return NULL for newer reporting periods.
    return await runLookup(false);
}