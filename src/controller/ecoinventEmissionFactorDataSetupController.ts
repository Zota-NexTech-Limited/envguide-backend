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


            const { element_name, ef_eu_region, ef_india_region, ef_global_region, source, time, location, year, unit, iso_country_code } = req.body;

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
                INSERT INTO materials_emission_factor (mef_id,element_name,ef_eu_region,ef_india_region,ef_global_region,source,time,location, code, created_by,year,iso_country_code,unit)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8 ,$9, $10,$11,$12,13)
                RETURNING *;
            `;

            const result = await client.query(query, [id, element_name, ef_eu_region, ef_india_region, ef_global_region, source, time, location, code, req.user_id, year, iso_country_code, unit]);

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
                    source              = $6,
                     time                = $7,
                     location            = $8,
                     updated_by          = $9,
                     year= $10,
                     iso_country_code= $11,
                     unit = $12
                     WHERE mef_id = $1
                     RETURNING *;

                `;

                const result = await client.query(query, [item.mef_id, item.element_name, item.ef_eu_region, item.ef_india_region, item.ef_global_region, item.source, item.time, item.location, req.user_id, item.year, item.iso_country_code, item.unit]);

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

export async function materialsEmissionFactorDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            // Check duplicate names inside payload
            const names = data.map(d => d.element_name.toLowerCase());
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
                `SELECT name FROM materials_emission_factor WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            const rows: any[] = [];

            let nextNumber = await generateDynamicCode(client, 'MEF', 'materials_emission_factor');

            for (const item of data) {

                if (!item.element_name) {
                    throw new Error("Name is required");
                }

                const code = formatCode('MEF', nextNumber);
                nextNumber++;

                rows.push({
                    mef_id: ulid(),
                    code: code,
                    element_name: item.element_name,
                    ef_eu_region: item.ef_eu_region,
                    ef_india_region: item.ef_india_region,
                    ef_global_region: item.ef_global_region,
                    source: item.source,
                    time: item.time,
                    location: item.location,
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

            return res.send(generateResponse(true, "Bulk import successful", 200, result.rows));
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

export async function electricityEmissionFactorDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            // Check duplicate names inside payload
            const names = data.map(d => d.type_of_energy.toLowerCase());
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
                `SELECT name FROM electricity_emission_factor WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            const rows: any[] = [];

            let nextNumber = await generateDynamicCode(client, 'EEF', 'electricity_emission_factor');

            for (const item of data) {

                if (!item.type_of_energy) {
                    throw new Error("type_of_energy is required");
                }

                const code = formatCode('EEF', nextNumber);
                nextNumber++;

                rows.push({
                    eef_id: ulid(),
                    code: code,
                    type_of_energy: item.type_of_energy,
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
                INSERT INTO electricity_emission_factor (${columns.join(', ')})
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

export async function fuelEmissionFactorDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            // Check duplicate names inside payload
            const names = data.map(d => d.fuel_type.toLowerCase());
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
                `SELECT name FROM fuel_emission_factor WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            const rows: any[] = [];

            let nextNumber = await generateDynamicCode(client, 'FEF', 'fuel_emission_factor');

            for (const item of data) {

                if (!item.fuel_type) {
                    throw new Error("fuel_type is required");
                }

                const code = formatCode('FEF', nextNumber);
                nextNumber++;

                rows.push({
                    fef_id: ulid(),
                    code: code,
                    fuel_type: item.fuel_type,
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
                INSERT INTO fuel_emission_factor (${columns.join(', ')})
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



///Packaging Emission Factor
export async function addPackagingEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {


            const { material_type, ef_eu_region, ef_india_region, ef_global_region, year, unit, iso_country_code } = req.body;

            console.log(req.user_id, "user_id");

            if (!material_type) {
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
                `SELECT 1 FROM packaging_emission_factor WHERE material_type ILIKE $1`,
                [material_type]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Type of energy already exists", 400, null));
            }

            const id = ulid();


            const nextNumber = await generateDynamicCode(client, 'PEF', 'packaging_emission_factor');

            const code = formatCode('PEF', nextNumber);

            const query = `
                INSERT INTO packaging_emission_factor (pef_id,material_type,ef_eu_region,ef_india_region,ef_global_region,code, created_by,year, unit, iso_country_code)
                VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10)
                RETURNING *;
            `;

            const result = await client.query(query, [id, material_type, ef_eu_region, ef_india_region, ef_global_region, code, req.user_id, year, unit, iso_country_code]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updatePackagingEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            console.log(req.user_id, "user_id");

            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {

                if (!item.material_type) {
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
                     FROM packaging_emission_factor 
                     WHERE material_type ILIKE $1 AND pef_id <> $2`,
                    [item.material_type, item.pef_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Type of energy '${item.material_type}' already exists`, 400, null));
                }

                const query = `
                    UPDATE packaging_emission_factor
                    SET
                    material_type        = $2,
                    ef_eu_region        = $3,
                    ef_india_region     = $4,
                    ef_global_region    = $5,
                     updated_by          = $6,
                     year=$7,
                    unit=$8,
                    iso_country_code=$9
                     WHERE pef_id = $1
                     RETURNING *;

                `;

                const result = await client.query(query, [item.pef_id, item.material_type, item.ef_eu_region, item.ef_india_region, item.ef_global_region, req.user_id, item.year, item.unit, item.iso_country_code]);

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

export async function getPackagingEmissionFactorListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.material_type ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM packaging_emission_factor i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM packaging_emission_factor i
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

export async function packagingEmissionFactorDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            // Check duplicate names inside payload
            const names = data.map(d => d.material_type.toLowerCase());
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
                `SELECT name FROM packaging_emission_factor WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            const rows: any[] = [];

            let nextNumber = await generateDynamicCode(client, 'PEF', 'packaging_emission_factor');

            for (const item of data) {

                if (!item.material_type) {
                    throw new Error("material_type is required");
                }

                const code = formatCode('PEF', nextNumber);
                nextNumber++;

                rows.push({
                    pef_id: ulid(),
                    code: code,
                    material_type: item.material_type,
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
                INSERT INTO packaging_emission_factor (${columns.join(', ')})
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

export async function deletePackagingEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { pef_id } = req.body;

            await client.query(
                `DELETE FROM packaging_emission_factor WHERE pef_id = $1`,
                [pef_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getPackagingEmissionFactorDropDownnList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            const listQuery = `
                SELECT i.*
                FROM packaging_emission_factor i
                ORDER BY i.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}




///Waste Treatment Type Emission Factor
export async function addWasteTreatmentTypeEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {


            const { treatment_type, ef_eu_region, ef_india_region, ef_global_region, year, unit, iso_country_code } = req.body;

            console.log(req.user_id, "user_id");

            if (!treatment_type) {
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
                `SELECT 1 FROM waste_treatment_type_emission_factor WHERE treatment_type ILIKE $1`,
                [treatment_type]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Type of energy already exists", 400, null));
            }

            const id = ulid();


            const nextNumber = await generateDynamicCode(client, 'ETTEF', 'waste_treatment_type_emission_factor');

            const code = formatCode('WTTEF', nextNumber);

            const query = `
                INSERT INTO waste_treatment_type_emission_factor (wttef_id,treatment_type,ef_eu_region,ef_india_region,ef_global_region,code, created_by, year, unit, iso_country_code)
                VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10)
                RETURNING *;
            `;

            const result = await client.query(query, [id, treatment_type, ef_eu_region, ef_india_region, ef_global_region, code, req.user_id, year, unit, iso_country_code]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateWasteTreatmentTypeEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            console.log(req.user_id, "user_id");

            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {

                if (!item.treatment_type) {
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
                     FROM waste_treatment_type_emission_factor 
                     WHERE treatment_type ILIKE $1 AND wttef_id <> $2`,
                    [item.treatment_type, item.wttef_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Type of energy '${item.treatment_type}' already exists`, 400, null));
                }

                const query = `
                    UPDATE waste_treatment_type_emission_factor
                    SET
                    treatment_type        = $2,
                    ef_eu_region        = $3,
                    ef_india_region     = $4,
                    ef_global_region    = $5,
                     updated_by          = $6,
                      year=$7,
                    unit=$8,
                    iso_country_code=$9
                     WHERE wttef_id = $1
                     RETURNING *;

                `;

                const result = await client.query(query, [item.wttef_id, item.treatment_type, item.ef_eu_region, item.ef_india_region, item.ef_global_region, req.user_id, item.year, item.unit, item.iso_country_code]);

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

export async function getWasteTreatmentTypeEmissionFactorListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.treatment_type ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM waste_treatment_type_emission_factor i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM waste_treatment_type_emission_factor i
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

export async function wasteTreatmentTypeEmissionFactorDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            // Check duplicate names inside payload
            const names = data.map(d => d.treatment_type.toLowerCase());
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
                `SELECT name FROM waste_treatment_type_emission_factor WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            const rows: any[] = [];

            let nextNumber = await generateDynamicCode(client, 'WTTEF', 'waste_treatment_type_emission_factor');

            for (const item of data) {

                if (!item.treatment_type) {
                    throw new Error("treatment_type is required");
                }

                const code = formatCode('WTTEF', nextNumber);
                nextNumber++;

                rows.push({
                    wttef_id: ulid(),
                    code: code,
                    treatment_type: item.treatment_type,
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
                INSERT INTO waste_treatment_type_emission_factor (${columns.join(', ')})
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

export async function deleteWasteTreatmentTypeEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { wttef_id } = req.body;

            await client.query(
                `DELETE FROM waste_treatment_type_emission_factor WHERE wttef_id = $1`,
                [wttef_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getWasteTreatmentTypeEmissionFactorDropDownnList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            const listQuery = `
                SELECT i.*
                FROM waste_treatment_type_emission_factor i
                ORDER BY i.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}



///Waste Material Type Emission Factor
export async function addWasteMaterialTypeEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {


            const { waste_type, ef_eu_region, ef_india_region, ef_global_region, year, unit, iso_country_code } = req.body;

            console.log(req.user_id, "user_id");

            if (!waste_type) {
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
                `SELECT 1 FROM waste_material_type_emission_factor WHERE waste_type ILIKE $1`,
                [waste_type]
            );

            if (checkName.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Type of energy already exists", 400, null));
            }

            const id = ulid();


            const nextNumber = await generateDynamicCode(client, 'WMTEF', 'waste_material_type_emission_factor');

            const code = formatCode('WMTEF', nextNumber);

            const query = `
                INSERT INTO waste_material_type_emission_factor (wmtef_id,waste_type,ef_eu_region,ef_india_region,ef_global_region,code, created_by,year, unit, iso_country_code)
                VALUES ($1, $2, $3, $4, $5, $6, $7,$8,$9,$10)
                RETURNING *;
            `;

            const result = await client.query(query, [id, waste_type, ef_eu_region, ef_india_region, ef_global_region, code, req.user_id, year, unit, iso_country_code]);

            return res.send(generateResponse(true, "Added successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function updateWasteMaterialTypeEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            console.log(req.user_id, "user_id");

            const updatingData = req.body;
            const updatedRows: any[] = [];

            for (const item of updatingData) {

                if (!item.waste_type) {
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
                     FROM waste_material_type_emission_factor 
                     WHERE waste_type ILIKE $1 AND wmtef_id <> $2`,
                    [item.waste_type, item.wmtef_id]
                );

                if (checkName.rowCount > 0) {
                    return res
                        .status(400)
                        .send(generateResponse(false, `Type of energy '${item.waste_type}' already exists`, 400, null));
                }

                const query = `
                    UPDATE waste_material_type_emission_factor
                    SET
                    waste_type        = $2,
                    ef_eu_region        = $3,
                    ef_india_region     = $4,
                    ef_global_region    = $5,
                     updated_by          = $6,
                     year=$7,
                    unit=$8,
                    iso_country_code=$9
                     WHERE wmtef_id = $1
                     RETURNING *;

                `;

                const result = await client.query(query, [item.wmtef_id, item.waste_type, item.ef_eu_region, item.ef_india_region, item.ef_global_region, req.user_id, item.year, item.unit, item.iso_country_code]);

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

export async function getWasteMaterialTypeEmissionFactorListSearch(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { searchValue } = req.query;
            let whereClause = '';
            const values: any[] = [];

            if (searchValue) {
                whereClause = `AND (i.code ILIKE $1 OR i.waste_type ILIKE $1)`;
                values.push(`%${searchValue}%`);
            }

            const listQuery = `
                SELECT i.*
                FROM waste_material_type_emission_factor i
                WHERE 1=1 ${whereClause}
                ORDER BY i.created_date ASC;
            `;

            const countQuery = `
                SELECT COUNT(*)
                FROM waste_material_type_emission_factor i
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

export async function wasteMaterialTypeEmissionFactorDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const data = req.body;

            if (!Array.isArray(data) || data.length === 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "Invalid input array", 400, null));
            }

            // Check duplicate names inside payload
            const names = data.map(d => d.waste_type.toLowerCase());
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
                `SELECT name FROM waste_material_type_emission_factor WHERE name ILIKE ANY($1)`,
                [names]
            );

            if (existing.rowCount > 0) {
                return res
                    .status(400)
                    .send(generateResponse(false, "One or more names already exist", 400, null));
            }

            const rows: any[] = [];

            let nextNumber = await generateDynamicCode(client, 'WMTEF', 'waste_material_type_emission_factor');

            for (const item of data) {

                if (!item.waste_type) {
                    throw new Error("waste_type is required");
                }

                const code = formatCode('WMTEF', nextNumber);
                nextNumber++;

                rows.push({
                    wmtef_id: ulid(),
                    code: code,
                    waste_type: item.waste_type,
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
                INSERT INTO waste_material_type_emission_factor (${columns.join(', ')})
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

export async function deleteWasteMaterialTypeEmissionFactor(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { wmtef_id } = req.body;

            await client.query(
                `DELETE FROM waste_material_type_emission_factor WHERE wmtef_id = $1`,
                [wmtef_id]
            );

            return res.send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}

export async function getWasteMaterialTypeEmissionFactorDropDownnList(req: any, res: any) {
    return withClient(async (client: any) => {
        try {

            const listQuery = `
                SELECT i.*
                FROM waste_material_type_emission_factor i
                ORDER BY i.created_date ASC;
            `;

            const listResult = await client.query(listQuery);

            return res.send(generateResponse(true, "List fetched successfully", 200, listResult.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    });
}



///vehicle Type Emission Factor
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

            // Check existing names in DB
            const existing = await client.query(
                `SELECT name FROM vehicle_type_emission_factor WHERE name ILIKE ANY($1)`,
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