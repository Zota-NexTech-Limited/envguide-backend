import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';


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


            const { element_name, ef_eu_region, ef_india_region, ef_global_region, year, unit, iso_country_code } = req.body;

            console.log(req.user_id, "user_id");

            if (!element_name) {
                throw new Error("Element name is required");
            }

            if (!ef_eu_region) {
                throw new Error("Ef Eu region is required");
            }

            if (!ef_india_region) {
                throw new Error("Ef India region is required");
            }

            if (!ef_global_region) {
                throw new Error("Ef global region is required");
            }


            const checkName = await client.query(
                `SELECT 1 FROM materials_emission_factor WHERE element_name ILIKE $1`,
                [element_name]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Element name already exists", 400, null));
            }

            const id = ulid();


            const nextNumber = await generateDynamicCode(client, 'MEF', 'materials_emission_factor');

            const code = formatCode('MEF', nextNumber);

            const query = `
                INSERT INTO materials_emission_factor (mef_id,element_name,ef_eu_region,ef_india_region,ef_global_region, code, created_by,year,iso_country_code,unit)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8 ,$9, $10)
                RETURNING *;
            `;

            const result = await client.query(query, [id, element_name, ef_eu_region, ef_india_region, ef_global_region, code, req.user_id, year, iso_country_code, unit]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateMaterialsEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            console.log(req.user_id, "user_id");

            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {

                if (!item.element_name) {
                    throw new Error("Element name is required");
                }


                if (!item.ef_eu_region) {
                    throw new Error("Ef Eu region is required");
                }

                if (!item.ef_india_region) {
                    throw new Error("Ef India region is required");
                }

                if (!item.ef_global_region) {
                    throw new Error("Ef global region is required");
                }


                const checkName = await client.query(
                    `SELECT 1 
                     FROM materials_emission_factor 
                     WHERE element_name ILIKE $1 AND mef_id <> $2`,
                    [item.element_name, item.mef_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Element Name '${item.element_name}' already exists`, 400, null));
                }

                const query = `
                    UPDATE materials_emission_factor
                    SET
                    element_name        = $2,
                    ef_eu_region        = $3,
                    ef_india_region     = $4,
                    ef_global_region    = $5,
                     updated_by          = $6,
                     year= $7,
                     iso_country_code= $8,
                     unit = $9
                     WHERE mef_id = $1
                     RETURNING *;

                `;

                const result = await client.query(query, [item.mef_id, item.element_name, item.ef_eu_region, item.ef_india_region, item.ef_global_region, req.user_id, item.year, item.iso_country_code, item.unit]);

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
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.element_name ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM materials_emission_factor i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM materials_emission_factor i
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

            // ------------------------------------
            // Build combined names
            // ------------------------------------
            const combinedNames = data.map(d =>
                `${d.element_name} - ${d.element_type}`.toLowerCase()
            );

            // ------------------------------------
            // Check duplicate combined names in payload
            // ------------------------------------
            const duplicatePayloadNames = combinedNames.filter(
                (n, i) => combinedNames.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate element_name + element_type in payload", 400, null));
            }

            // ------------------------------------
            // Validate element_name from material_composition_metals
            // ------------------------------------
            const elementNames = [...new Set(data.map(d => d.element_name))];

            const metalsCheck = await client.query(
                `SELECT name FROM material_composition_metals WHERE name = ANY($1)`,
                [elementNames]
            );

            if (metalsCheck.rowCount !== elementNames.length) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid element_name (not found in material_composition_metals)", 400, null));
            }

            // ------------------------------------
            // Validate element_type from material_composition_metal_type
            // ------------------------------------
            const elementTypes = [...new Set(data.map(d => d.element_type))];

            const metalTypeCheck = await client.query(
                `SELECT name FROM material_composition_metal_type WHERE name = ANY($1)`,
                [elementTypes]
            );

            // Get existing names from DB
            const existingTypes = metalTypeCheck.rows.map((r: any) => r.name);

            // Find missing ones
            const missingTypes = elementTypes.filter(
                type => !existingTypes.includes(type)
            );

            if (missingTypes.length > 0) {
                return res.status(400).send(
                    generateResponse(
                        false,
                        `Invalid element_type(s): ${missingTypes.join(", ")}`,
                        400,
                        null
                    )
                );
            }

            // const elementTypes = [...new Set(data.map(d => d.element_type))];

            // const metalTypeCheck = await client.query(
            //     `SELECT name FROM material_composition_metal_type WHERE name = ANY($1)`,
            //     [elementTypes]
            // );

            // if (metalTypeCheck.rowCount !== elementTypes.length) {
            //     return res
            //         .status(400)
            //         .send(generateResponse(false, "Invalid element_type (not found in material_composition_metal_type)", 400, null));
            // }

            // ------------------------------------
            // Check existing combined names in materials_emission_factor
            // ------------------------------------
            const existing = await client.query(
                `SELECT element_name FROM materials_emission_factor WHERE LOWER(element_name) = ANY($1)`,
                [combinedNames]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Element already exists in materials_emission_factor", 400, null));
            }

            // ------------------------------------
            // Insert data
            // ------------------------------------
            const rows: any[] = [];
            let nextNumber = await generateDynamicCode(client, 'MEF', 'materials_emission_factor');

            for (const item of data) {
                const code = formatCode('MEF', nextNumber++);
                const combinedName = `${item.element_name} - ${item.element_type}`;

                rows.push({
                    mef_id: ulid(),
                    code,
                    element_name: combinedName,
                    ef_eu_region: item.ef_eu_region,
                    ef_india_region: item.ef_india_region,
                    ef_global_region: item.ef_global_region,
                    year: item.year,
                    iso_country_code: item.iso_country_code,
                    unit: item.unit,
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

export async function getMaterialsEmissionFactorDropDownnList(req: any, res: any) {
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

export async function getMaterialsPlusMaterialTypeDropDownnList(req: any, res: any) {
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


            const { type_of_energy, ef_eu_region, ef_india_region, ef_global_region, year, unit, iso_country_code } = req.body;

            console.log(req.user_id, "user_id");

            if (!type_of_energy) {
                throw new Error("Type of energy is required");
            }

            if (!ef_eu_region) {
                throw new Error("Ef Eu region is required");
            }

            if (!ef_india_region) {
                throw new Error("Ef India region is required");
            }

            if (!ef_global_region) {
                throw new Error("Ef global region is required");
            }



            const checkName = await client.query(
                `SELECT 1 FROM electricity_emission_factor WHERE type_of_energy ILIKE $1`,
                [type_of_energy]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Type of energy already exists", 400, null));
            }

            const id = ulid();


            const nextNumber = await generateDynamicCode(client, 'FEF', 'electricity_emission_factor');

            const code = formatCode('FEF', nextNumber);

            const query = `
                INSERT INTO electricity_emission_factor (eef_id,type_of_energy,ef_eu_region,ef_india_region,ef_global_region,code, created_by,year,unit,iso_country_code)
                VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10)
                RETURNING *;
            `;

            const result = await client.query(query, [id, type_of_energy, ef_eu_region, ef_india_region, ef_global_region, code, req.user_id, year, unit, iso_country_code]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateElectricityEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            console.log(req.user_id, "user_id");

            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {

                if (!item.type_of_energy) {
                    throw new Error("Type of energy is required");
                }


                if (!item.ef_eu_region) {
                    throw new Error("Ef Eu region is required");
                }

                if (!item.ef_india_region) {
                    throw new Error("Ef India region is required");
                }

                if (!item.ef_global_region) {
                    throw new Error("Ef global region is required");
                }

                const checkName = await client.query(
                    `SELECT 1 
                     FROM electricity_emission_factor 
                     WHERE type_of_energy ILIKE $1 AND eef_id <> $2`,
                    [item.type_of_energy, item.eef_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Type of energy '${item.type_of_energy}' already exists`, 400, null));
                }

                const query = `
                    UPDATE electricity_emission_factor
                    SET
                    type_of_energy        = $2,
                    ef_eu_region        = $3,
                    ef_india_region     = $4,
                    ef_global_region    = $5,
                     updated_by          = $6,
                     year =$7,
                     unit=$8,
                     iso_country_code=$9
                     WHERE eef_id = $1
                     RETURNING *;

                `;

                const result = await client.query(query, [item.eef_id, item.type_of_energy, item.ef_eu_region, item.ef_india_region, item.ef_global_region, req.user_id, item.year, item.unit, item.iso_country_code]);

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
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.type_of_energy ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM electricity_emission_factor i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM electricity_emission_factor i
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

            // ------------------------------------
            // Build combined names
            // ------------------------------------
            const combinedNames = data.map(d =>
                `${d.type_of_energy} - ${d.treatment_type}`.toLowerCase()
            );

            // ------------------------------------
            // Check duplicate combined names in payload
            // ------------------------------------
            const duplicatePayloadNames = combinedNames.filter(
                (n, i) => combinedNames.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate type_of_energy + treatment_type in payload", 400, null));
            }

            // ------------------------------------
            // Validate type_of_energy from energy_source
            // ------------------------------------
            const energySources = [...new Set(data.map(d => d.type_of_energy))];

            const energySourceCheck = await client.query(
                `SELECT name FROM energy_source WHERE name = ANY($1)`,
                [energySources]
            );

            if (energySourceCheck.rowCount !== energySources.length) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid type_of_energy (not found in energy_source)", 400, null));
            }

            // ------------------------------------
            // Validate treatment_type from energy_type
            // ------------------------------------
            const treatmentTypes = [...new Set(data.map(d => d.treatment_type))];

            const treatmentTypeCheck = await client.query(
                `SELECT name FROM energy_type WHERE name = ANY($1)`,
                [treatmentTypes]
            );

            if (treatmentTypeCheck.rowCount !== treatmentTypes.length) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid treatment_type (not found in energy_type)", 400, null));
            }

            // ------------------------------------
            // Check existing combined names in electricity_emission_factor
            // ------------------------------------
            const existing = await client.query(
                `SELECT type_of_energy 
                 FROM electricity_emission_factor 
                 WHERE LOWER(type_of_energy) = ANY($1)`,
                [combinedNames]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Energy type already exists in electricity_emission_factor", 400, null));
            }

            // ------------------------------------
            // Insert records
            // ------------------------------------
            const rows: any[] = [];
            let nextNumber = await generateDynamicCode(client, 'EEF', 'electricity_emission_factor');

            for (const item of data) {
                if (!item.type_of_energy || !item.treatment_type) {
                    throw new Error("type_of_energy and treatment_type are required");
                }

                const code = formatCode('EEF', nextNumber++);
                const combinedName = `${item.type_of_energy} - ${item.treatment_type}`;

                rows.push({
                    eef_id: ulid(),
                    code,
                    type_of_energy: combinedName,
                    ef_eu_region: item.ef_eu_region,
                    ef_india_region: item.ef_india_region,
                    ef_global_region: item.ef_global_region,
                    year: item.year,
                    iso_country_code: item.iso_country_code,
                    unit: item.unit,
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

export async function getElectricityEmissionFactorDropDownnList(req: any, res: any) {
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

export async function getEnergySourceEnergyTypeDropDownnList(req: any, res: any) {
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


            const { fuel_type, ef_eu_region, ef_india_region, ef_global_region, year, unit, iso_country_code } = req.body;

            console.log(req.user_id, "user_id");

            if (!fuel_type) {
                throw new Error("Type of energy is required");
            }

            if (!ef_eu_region) {
                throw new Error("Ef Eu region is required");
            }

            if (!ef_india_region) {
                throw new Error("Ef India region is required");
            }

            if (!ef_global_region) {
                throw new Error("Ef global region is required");
            }



            const checkName = await client.query(
                `SELECT 1 FROM fuel_emission_factor WHERE fuel_type ILIKE $1`,
                [fuel_type]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Type of energy already exists", 400, null));
            }

            const id = ulid();


            const nextNumber = await generateDynamicCode(client, 'FEF', 'fuel_emission_factor');

            const code = formatCode('FEF', nextNumber);

            const query = `
                INSERT INTO fuel_emission_factor (fef_id,fuel_type,ef_eu_region,ef_india_region,ef_global_region,code, created_by,year, unit, iso_country_code)
                VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10)
                RETURNING *;
            `;

            const result = await client.query(query, [id, fuel_type, ef_eu_region, ef_india_region, ef_global_region, code, req.user_id, year, unit, iso_country_code]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateFuelEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            console.log(req.user_id, "user_id");

            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {

                if (!item.fuel_type) {
                    throw new Error("Type of energy is required");
                }


                if (!item.ef_eu_region) {
                    throw new Error("Ef Eu region is required");
                }

                if (!item.ef_india_region) {
                    throw new Error("Ef India region is required");
                }

                if (!item.ef_global_region) {
                    throw new Error("Ef global region is required");
                }

                const checkName = await client.query(
                    `SELECT 1 
                     FROM fuel_emission_factor 
                     WHERE fuel_type ILIKE $1 AND fef_id <> $2`,
                    [item.fuel_type, item.fef_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Type of energy '${item.fuel_type}' already exists`, 400, null));
                }

                const query = `
                    UPDATE fuel_emission_factor
                    SET
                    fuel_type        = $2,
                    ef_eu_region        = $3,
                    ef_india_region     = $4,
                    ef_global_region    = $5,
                    updated_by          = $6,
                    year=$7,
                    unit=$8,
                    iso_country_code=$9
                     WHERE fef_id = $1
                     RETURNING *;

                `;

                const result = await client.query(query, [item.fef_id, item.fuel_type, item.ef_eu_region, item.ef_india_region, item.ef_global_region, req.user_id, item.year, item.unit, item.iso_country_code]);

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
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.fuel_type ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM fuel_emission_factor i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM fuel_emission_factor i
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

            // ------------------------------------
            // Build combined names
            // ------------------------------------
            const combinedNames = data.map(d =>
                `${d.fuel_type} - ${d.sub_fuel_type}`.toLowerCase()
            );

            // ------------------------------------
            // Check duplicate combined names in payload
            // ------------------------------------
            const duplicatePayloadNames = combinedNames.filter(
                (n, i) => combinedNames.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate fuel_type + sub_fuel_type in payload", 400, null));
            }

            // ------------------------------------
            // Validate fuel_type from fuel_types
            // ------------------------------------
            const fuelTypes = [...new Set(data.map(d => d.fuel_type))];

            const fuelTypeCheck = await client.query(
                `SELECT name FROM fuel_types WHERE name = ANY($1)`,
                [fuelTypes]
            );

            if (fuelTypeCheck.rowCount !== fuelTypes.length) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid fuel_type (not found in fuel_types)", 400, null));
            }

            // ------------------------------------
            // Validate sub_fuel_type from sub_fuel_types
            // ------------------------------------
            const subFuelTypes = [...new Set(data.map(d => d.sub_fuel_type))];

            const subFuelTypeCheck = await client.query(
                `SELECT name FROM sub_fuel_types WHERE name = ANY($1)`,
                [subFuelTypes]
            );

            // Existing names from DB
            const existingSubFuelTypes = subFuelTypeCheck.rows.map((r: { name: string }) => r.name);

            // Find missing ones
            const missingSubFuelTypes = subFuelTypes.filter(
                type => !existingSubFuelTypes.includes(type)
            );

            if (missingSubFuelTypes.length > 0) {
                return res.status(400).send(
                    generateResponse(
                        false,
                        `Invalid sub_fuel_type(s): ${missingSubFuelTypes.join(", ")}`,
                        400,
                        null
                    )
                );
            }


            // const subFuelTypes = [...new Set(data.map(d => d.sub_fuel_type))];

            // const subFuelTypeCheck = await client.query(
            //     `SELECT name FROM sub_fuel_types WHERE name = ANY($1)`,
            //     [subFuelTypes]
            // );

            // if (subFuelTypeCheck.rowCount !== subFuelTypes.length) {
            //     return res
            //         .status(400)
            //         .send(generateResponse(false, "Invalid sub_fuel_type (not found in sub_fuel_types)", 400, null));
            // }

            // ------------------------------------
            // Check existing combined names in fuel_emission_factor
            // ------------------------------------
            const existing = await client.query(
                `SELECT fuel_type
                 FROM fuel_emission_factor
                 WHERE LOWER(fuel_type) = ANY($1)`,
                [combinedNames]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Fuel emission factor already exists", 400, null));
            }

            // ------------------------------------
            // Insert records
            // ------------------------------------
            const rows: any[] = [];
            let nextNumber = await generateDynamicCode(client, 'FEF', 'fuel_emission_factor');

            for (const item of data) {
                if (!item.fuel_type || !item.sub_fuel_type) {
                    throw new Error("fuel_type and sub_fuel_type are required");
                }

                const code = formatCode('FEF', nextNumber++);
                const combinedName = `${item.fuel_type} - ${item.sub_fuel_type}`;

                rows.push({
                    fef_id: ulid(),
                    code,
                    fuel_type: combinedName,
                    ef_eu_region: item.ef_eu_region,
                    ef_india_region: item.ef_india_region,
                    ef_global_region: item.ef_global_region,
                    year: item.year,
                    iso_country_code: item.iso_country_code,
                    unit: item.unit,
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

export async function getFuelEmissionFactorDropDownnList(req: any, res: any) {
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

export async function getFuelFuelTypeDropDownnList(req: any, res: any) {
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

export async function getPackingTreatmentTypeDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT ptt_id, code, name FROM packaging_treatment_type;`;
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
                material_type,
                ptt_id,
                ef_eu_region,
                ef_india_region,
                ef_global_region,
                year,
                unit,
                iso_country_code
            } = req.body;

            if (!material_type) throw new Error("material_type is required");
            if (!ptt_id) throw new Error("ptt_id is required");
            if (!ef_eu_region) throw new Error("ef_eu_region is required");
            if (!ef_india_region) throw new Error("ef_india_region is required");
            if (!ef_global_region) throw new Error("ef_global_region is required");

            const check = await client.query(
                `SELECT 1 
                 FROM packaging_material_treatment_type_emission_factor 
                 WHERE material_type ILIKE $1 AND ptt_id = $2`,
                [material_type, ptt_id]
            );

            if (check.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Combination already exists", 400, null));
            }

            const pef_id = ulid();
            const nextNumber = await generateDynamicCode(
                client,
                'PEF',
                'packaging_material_treatment_type_emission_factor'
            );
            const code = formatCode('PEF', nextNumber);

            const insertQuery = `
                INSERT INTO packaging_material_treatment_type_emission_factor (
                    pef_id,
                    material_type,
                    ptt_id,
                    ef_eu_region,
                    ef_india_region,
                    ef_global_region,
                    year,
                    unit,
                    iso_country_code,
                    code,
                    created_by
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                RETURNING *;
            `;

            const result = await client.query(insertQuery, [
                pef_id,
                material_type,
                ptt_id,
                ef_eu_region,
                ef_india_region,
                ef_global_region,
                year,
                unit,
                iso_country_code,
                code,
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

                const duplicateCheck = await client.query(
                    `SELECT 1
                     FROM packaging_material_treatment_type_emission_factor
                     WHERE material_type ILIKE $1
                       AND ptt_id = $2
                       AND pef_id <> $3`,
                    [item.material_type, item.ptt_id, item.pef_id]
                );

                if (duplicateCheck.rowCount > 0) {
                    return res.status(400).send(
                        generateResponse(false, "Combination already exists", 400, null)
                    );
                }

                const updateQuery = `
                    UPDATE packaging_material_treatment_type_emission_factor
                    SET
                        material_type     = $2,
                        ptt_id            = $3,
                        ef_eu_region      = $4,
                        ef_india_region   = $5,
                        ef_global_region  = $6,
                        year              = $7,
                        unit              = $8,
                        iso_country_code  = $9,
                        updated_by        = $10,
                        update_date       = CURRENT_TIMESTAMP
                    WHERE pef_id = $1
                    RETURNING *;
                `;

                const result = await client.query(updateQuery, [
                    item.pef_id,
                    item.material_type,
                    item.ptt_id,
                    item.ef_eu_region,
                    item.ef_india_region,
                    item.ef_global_region,
                    item.year,
                    item.unit,
                    item.iso_country_code,
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

            const rows: any[] = [];
            let nextNumber = await generateDynamicCode(
                client,
                'PEF',
                'packaging_material_treatment_type_emission_factor'
            );

            for (const item of data) {
                if (!item.material_type) throw new Error("material_type is required");
                if (!item.treatment_type_name) throw new Error("treatment_type_name is required");

                // 🔹 Fetch ptt_id from name
                const treatment = await client.query(
                    `SELECT ptt_id 
                     FROM packaging_treatment_type
                     WHERE name ILIKE $1`,
                    [item.treatment_type_name]
                );

                if (treatment.rowCount === 0) {
                    throw new Error(
                        `Treatment type '${item.treatment_type_name}' not found`
                    );
                }

                const ptt_id = treatment.rows[0].ptt_id;
                const code = formatCode('PEF', nextNumber++);

                rows.push({
                    pef_id: ulid(),
                    code,
                    material_type: item.material_type,
                    ptt_id,
                    ef_eu_region: item.ef_eu_region,
                    ef_india_region: item.ef_india_region,
                    ef_global_region: item.ef_global_region,
                    year: item.year,
                    unit: item.unit,
                    iso_country_code: item.iso_country_code,
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
            const { searchValue } = req.query;
            const values: any[] = [];
            let whereClause = '';

            if (searchValue) {
                whereClause = `
                    AND (
                        pef.code ILIKE $1
                        OR pef.material_type ILIKE $1
                        OR ptt.treatment_type_name ILIKE $1
                    )
                `;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT
                    pef.*,
                    ptt.name
                FROM packaging_material_treatment_type_emission_factor pef
                LEFT JOIN packaging_treatment_type ptt
                    ON ptt.ptt_id = pef.ptt_id
                WHERE 1=1
                ${whereClause}
                ORDER BY pef.created_date DESC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM packaging_material_treatment_type_emission_factor pef
                LEFT JOIN packaging_treatment_type ptt
                    ON ptt.ptt_id = pef.ptt_id
                WHERE 1=1
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

export async function getPackagingEmissionFactorDropDownList(req: any, res: any) {
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

export async function getPackagingTypeEmissionFactorDropDownList(req: any, res: any) {
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

export async function getWasteTreatmentTypeDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT wtt_id, code, name FROM waste_treatment_type;`;
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
                waste_type,
                wtt_id,
                ef_eu_region,
                ef_india_region,
                ef_global_region,
                year,
                unit,
                iso_country_code
            } = req.body;

            if (!waste_type) throw new Error("waste_type is required");
            if (!wtt_id) throw new Error("wtt_id is required");

            const duplicate = await client.query(
                `SELECT 1
                 FROM waste_material_treatment_type_emission_factor
                 WHERE waste_type ILIKE $1 AND wtt_id = $2`,
                [waste_type, wtt_id]
            );

            if (duplicate.rowCount > 0) {
                return res.status(400).send(
                    generateResponse(false, "Combination already exists", 400, null)
                );
            }

            const wmttef_id = ulid();
            const nextNumber = await generateDynamicCode(
                client,
                'WMTTEF',
                'waste_material_treatment_type_emission_factor'
            );
            const code = formatCode('WMTTEF', nextNumber);

            const query = `
                INSERT INTO waste_material_treatment_type_emission_factor (
                    wmttef_id,
                    waste_type,
                    wtt_id,
                    ef_eu_region,
                    ef_india_region,
                    ef_global_region,
                    year,
                    unit,
                    iso_country_code,
                    code,
                    created_by
                )
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                RETURNING *;
            `;

            const result = await client.query(query, [
                wmttef_id,
                waste_type,
                wtt_id,
                ef_eu_region,
                ef_india_region,
                ef_global_region,
                year,
                unit,
                iso_country_code,
                code,
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

                const duplicate = await client.query(
                    `SELECT 1
                     FROM waste_material_treatment_type_emission_factor
                     WHERE waste_type ILIKE $1
                       AND wtt_id = $2
                       AND wmttef_id <> $3`,
                    [item.waste_type, item.wtt_id, item.wmttef_id]
                );

                if (duplicate.rowCount > 0) {
                    return res.status(400).send(
                        generateResponse(false, "Combination already exists", 400, null)
                    );
                }

                const query = `
                    UPDATE waste_material_treatment_type_emission_factor
                    SET
                        waste_type        = $2,
                        wtt_id            = $3,
                        ef_eu_region      = $4,
                        ef_india_region   = $5,
                        ef_global_region  = $6,
                        year              = $7,
                        unit              = $8,
                        iso_country_code  = $9,
                        updated_by        = $10,
                        update_date       = CURRENT_TIMESTAMP
                    WHERE wmttef_id = $1
                    RETURNING *;
                `;

                const result = await client.query(query, [
                    item.wmttef_id,
                    item.waste_type,
                    item.wtt_id,
                    item.ef_eu_region,
                    item.ef_india_region,
                    item.ef_global_region,
                    item.year,
                    item.unit,
                    item.iso_country_code,
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

            const rows: any[] = [];
            let nextNumber = await generateDynamicCode(
                client,
                'WMTTEF',
                'waste_material_treatment_type_emission_factor'
            );

            for (const item of data) {
                if (!item.waste_type) throw new Error("waste_type is required");
                if (!item.treatment_type_name)
                    throw new Error("treatment_type_name is required");

                const treatment = await client.query(
                    `SELECT wtt_id
                     FROM waste_treatment_type
                     WHERE name ILIKE $1`,
                    [item.treatment_type_name]
                );

                if (treatment.rowCount === 0) {
                    throw new Error(
                        `Waste Treatment type '${item.treatment_type_name}' not found`
                    );
                }

                const code = formatCode('WMTTEF', nextNumber++);
                const wtt_id = treatment.rows[0].wtt_id;

                rows.push({
                    wmttef_id: ulid(),
                    code,
                    waste_type: item.waste_type,
                    wtt_id,
                    ef_eu_region: item.ef_eu_region,
                    ef_india_region: item.ef_india_region,
                    ef_global_region: item.ef_global_region,
                    year: item.year,
                    unit: item.unit,
                    iso_country_code: item.iso_country_code,
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
            const { searchValue } = req.query;
            const values: any[] = [];
            let whereClause = '';

            if (searchValue) {
                whereClause = `
                    AND (
                        w.code ILIKE $1
                        OR w.waste_type ILIKE $1
                        OR wt.name ILIKE $1
                    )
                `;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT
                    w.*,
                    wt.name
                FROM waste_material_treatment_type_emission_factor w
                LEFT JOIN waste_treatment_type wt
                    ON wt.wtt_id = w.wtt_id
                WHERE 1=1
                ${whereClause}
                ORDER BY w.created_date DESC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM waste_material_treatment_type_emission_factor w
                LEFT JOIN waste_treatment_type wt
                    ON wt.wtt_id = w.wtt_id
                WHERE 1=1
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

export async function getWasteEmissionFactorDropDownList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `
                SELECT
                    w.wmttef_id,
                    w.code,
                    w.waste_type,
                    w.wtt_id,
                    wt.name
                FROM waste_material_treatment_type_emission_factor w
                LEFT JOIN waste_treatment_type wt
                    ON wt.wtt_id = w.wtt_id
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


            const { vehicle_type, ef_eu_region, ef_india_region, ef_global_region, year, unit, iso_country_code } = req.body;

            console.log(req.user_id, "user_id");

            if (!vehicle_type) {
                throw new Error("Type of energy is required");
            }

            if (!ef_eu_region) {
                throw new Error("Ef Eu region is required");
            }

            if (!ef_india_region) {
                throw new Error("Ef India region is required");
            }

            if (!ef_global_region) {
                throw new Error("Ef global region is required");
            }



            const checkName = await client.query(
                `SELECT 1 FROM vehicle_type_emission_factor WHERE vehicle_type ILIKE $1`,
                [vehicle_type]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Type of energy already exists", 400, null));
            }

            const id = ulid();


            const nextNumber = await generateDynamicCode(client, 'VTEF', 'vehicle_type_emission_factor');

            const code = formatCode('VTEF', nextNumber);

            const query = `
                INSERT INTO vehicle_type_emission_factor (wtef_id,vehicle_type,ef_eu_region,ef_india_region,ef_global_region,code, created_by,year, unit, iso_country_code)
                VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10)
                RETURNING *;
            `;

            const result = await client.query(query, [id, vehicle_type, ef_eu_region, ef_india_region, ef_global_region, code, req.user_id, year, unit, iso_country_code]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateVehicleTypeEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            console.log(req.user_id, "user_id");

            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {

                if (!item.vehicle_type) {
                    throw new Error("Type of energy is required");
                }


                if (!item.ef_eu_region) {
                    throw new Error("Ef Eu region is required");
                }

                if (!item.ef_india_region) {
                    throw new Error("Ef India region is required");
                }

                if (!item.ef_global_region) {
                    throw new Error("Ef global region is required");
                }

                const checkName = await client.query(
                    `SELECT 1 
                     FROM vehicle_type_emission_factor 
                     WHERE vehicle_type ILIKE $1 AND wtef_id <> $2`,
                    [item.vehicle_type, item.wtef_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Type of energy '${item.vehicle_type}' already exists`, 400, null));
                }

                const query = `
                    UPDATE vehicle_type_emission_factor
                    SET
                    vehicle_type        = $2,
                    ef_eu_region        = $3,
                    ef_india_region     = $4,
                    ef_global_region    = $5,
                     updated_by          = $6,
                     year=$7,
                    unit=$8,
                    iso_country_code=$9
                     WHERE wtef_id = $1
                     RETURNING *;

                `;

                const result = await client.query(query, [item.wtef_id, item.vehicle_type, item.ef_eu_region, item.ef_india_region, item.ef_global_region, req.user_id, item.year, item.unit, item.iso_country_code]);

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
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.vehicle_type ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM vehicle_type_emission_factor i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM vehicle_type_emission_factor i
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

export async function vehicleTypeEmissionFactorDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            // Check duplicate names inside payload
            const names = data.map(d => d.vehicle_type.toLowerCase());
            const duplicatePayloadNames = names.filter(
                (n, i) => names.indexOf(n) !== i
            );

            if (duplicatePayloadNames.length > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Duplicate names in payload", 400, null));
            }

            // ------------------------------------
            // Validate vehicle_type from vehicle_types table
            // ------------------------------------
            const vehicleTypes = [...new Set(data.map(d => d.vehicle_type))];

            const vehicleTypeCheck = await client.query(
                `SELECT name FROM vehicle_types WHERE name = ANY($1)`,
                [vehicleTypes]
            );

            if (vehicleTypeCheck.rowCount !== vehicleTypes.length) {
                return res
                    .status(400)
                    .send(generateResponse(
                        false,
                        "Invalid vehicle_type (not found in vehicle_types)",
                        400,
                        null
                    ));
            }

            // Check existing names in DB
            const existing = await client.query(
                `SELECT vehicle_type FROM vehicle_type_emission_factor WHERE vehicle_type ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            const rows: any[] = [];

            let nextNumber = await generateDynamicCode(client, 'VTEF', 'vehicle_type_emission_factor');

            for (const item of data) {

                if (!item.vehicle_type) {
                    throw new Error("vehicle_type is required");
                }

                const code = formatCode('VTEF', nextNumber);
                nextNumber++;

                rows.push({
                    wtef_id: ulid(),
                    code: code,
                    vehicle_type: item.vehicle_type,
                    ef_eu_region: item.ef_eu_region,
                    ef_india_region: item.ef_india_region,
                    ef_global_region: item.ef_global_region,
                    created_by: req.user_id,
                    year: item.year,
                    iso_country_code: item.iso_country_code,
                    unit: item.unit
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

export async function getVehicleTypeEmissionFactorDropDownnList(req: any, res: any) {
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