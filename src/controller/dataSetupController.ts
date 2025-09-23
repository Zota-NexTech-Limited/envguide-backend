import { withClient } from '../util/database';
import { ulid } from 'ulid';
import { generateResponse } from '../util/genRes';

export async function addCalculationMethod(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM calculation_method 
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
            INSERT INTO calculation_method (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getCalculationMethod(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM calculation_method;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateCalculationMethod(req: any, res: any) {
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
                UPDATE calculation_method 
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

export async function getCalculationMethodList(req: any, res: any) {
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
            FROM calculation_method i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM calculation_method i
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

export async function CalculationMethodDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO calculation_method (${columns.join(', ')})
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

export async function deleteCalculationMethod(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM calculation_method WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// fuelCombustion
export async function addFuelCombustion(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM fuel_combustion 
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
            INSERT INTO fuel_combustion (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getFuelCombustion(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM fuel_combustion;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateFuelCombustion(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id") // don’t overwrite PK
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE fuel_combustion
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

export async function getFuelCombustionList(req: any, res: any) {
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
            FROM fuel_combustion i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM fuel_combustion i
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

export async function FuelCombustionDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO fuel_combustion (${columns.join(', ')})
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

export async function deleteFuelCombustion(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM fuel_combustion WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// processEmission

export async function addProcessEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM process_emission 
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
            INSERT INTO process_emission (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getProcessEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM process_emission;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateProcessEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id") // don’t overwrite PK
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE process_emission
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

export async function getProcessEmissionList(req: any, res: any) {
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
            FROM process_emission i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM process_emission i
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

export async function ProcessEmissionDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO process_emission (${columns.join(', ')})
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

export async function deleteProcessEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM process_emission WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// fugitiveEmission
export async function addFugitiveEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();


            const checkExists = await client.query(
                `SELECT * 
             FROM fugitive_emission 
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
            INSERT INTO fugitive_emission (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getFugitiveEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM fugitive_emission;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateFugitiveEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id") // don’t overwrite PK
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE fugitive_emission
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

export async function getFugitiveEmissionList(req: any, res: any) {
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
            FROM fugitive_emission i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM fugitive_emission i
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

export async function FugitiveEmissionDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO fugitive_emission (${columns.join(', ')})
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

export async function deleteFugitiveEmission(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM fugitive_emission WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// electricityLocationBased
export async function addElectricityLocationBased(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM electicity_location_based 
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
            INSERT INTO electicity_location_based (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getElectricityLocationBased(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM electicity_location_based;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateElectricityLocationBased(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE electicity_location_based
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

export async function getElectricityLocationBasedList(req: any, res: any) {
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
            FROM electicity_location_based i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM electicity_location_based i
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

export async function ElectricityLocationBasedDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO electicity_location_based (${columns.join(', ')})
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

export async function deleteElectricityLocationBased(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM electicity_location_based WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// lectricityMarketBased
export async function addElectricityMarketBased(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM electicity_market_based 
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
            INSERT INTO electicity_market_based (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getElectricityMarketBased(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM electicity_market_based;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateElectricityMarketBased(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE electicity_market_based
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

export async function getElectricityMarketBasedList(req: any, res: any) {
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
            FROM electicity_market_based i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM electicity_market_based i
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

export async function ElectricityMarketBasedDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO electicity_market_based (${columns.join(', ')})
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

export async function deleteElectricityMarketBased(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM electicity_market_based WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// steamHeatCooling
export async function addSteamHeatCooling(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM steam_heat_cooling 
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
            INSERT INTO steam_heat_cooling (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getSteamHeatCooling(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM steam_heat_cooling;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateSteamHeatCooling(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE steam_heat_cooling
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

export async function getSteamHeatCoolingList(req: any, res: any) {
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
            FROM steam_heat_cooling i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM steam_heat_cooling i
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

export async function SteamHeatCoolingDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO steam_heat_cooling (${columns.join(', ')})
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

export async function deleteSteamHeatCooling(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM steam_heat_cooling WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// Product Type
export async function addProductType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM product_type 
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
            INSERT INTO product_type (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getProductType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM product_type;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateProductType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE product_type
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

export async function getProductTypeList(req: any, res: any) {
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
            FROM product_type i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM product_type i
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

export async function ProductTypeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO product_type (${columns.join(', ')})
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

export async function deleteProductType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM product_type WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// Product Category
export async function addProductCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM product_category 
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
            INSERT INTO product_category (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getProductCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM product_category;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateProductCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE product_category
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

export async function getProductCategoryList(req: any, res: any) {
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
            FROM product_category i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM product_category i
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

export async function ProductCategoryDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO product_category (${columns.join(', ')})
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

export async function deleteProductCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM product_category WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// Product Sub Category
export async function addProductSubCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM product_sub_category 
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
            INSERT INTO product_sub_category (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getProductSubCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM product_sub_category;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateProductSubCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE product_sub_category
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

export async function getProductSubCategoryList(req: any, res: any) {
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
            FROM product_sub_category i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM product_sub_category i
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

export async function ProductSubCategoryDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO product_sub_category (${columns.join(', ')})
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

export async function deleteProductSubCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM product_sub_category WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// Component Type
export async function addComponentType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM component_type 
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
            INSERT INTO component_type (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getComponentType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM component_type;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateComponentType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE component_type
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

export async function getComponentTypeList(req: any, res: any) {
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
            FROM component_type i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM component_type i
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

export async function ComponentTypeDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO component_type (${columns.join(', ')})
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

export async function deleteComponentType(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM component_type WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// Component Category
export async function addComponentCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM component_category 
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
            INSERT INTO component_category (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getComponentCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM component_category;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateComponentCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE component_category
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

export async function getComponentCategoryList(req: any, res: any) {
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
            FROM component_category i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM component_category i
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

export async function ComponentCategoryDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO component_category (${columns.join(', ')})
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

export async function deleteComponentCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM component_category WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// Industry
export async function addIndustry(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM industry 
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
            INSERT INTO industry (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getIndustry(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM industry;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateIndustry(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE industry
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

export async function getIndustryList(req: any, res: any) {
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
            FROM industry i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM industry i
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

export async function IndustryDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO industry (${columns.join(', ')})
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

export async function deleteIndustry(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM industry WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// Category
export async function addCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM category 
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
            INSERT INTO category (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM category;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE category
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

export async function getCategoryList(req: any, res: any) {
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
            FROM category i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM category i
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

export async function CategoryDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO category (${columns.join(', ')})
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

export async function deleteCategory(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM category WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

// Tag
export async function addTag(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { code, name, description } = req.body;
            const id = ulid();

            const checkExists = await client.query(
                `SELECT * 
             FROM tag 
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
            INSERT INTO tag (id, code, name, description)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;
            const result = await client.query(query, [id, code, name, description]);

            return res.send(generateResponse(true, "Added Successfully", 200, result.rows[0]));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function getTag(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT id, code, name, description FROM tag;`;
            const result = await client.query(query);

            return res.send(generateResponse(true, "Fetched successfully!", 200, result.rows));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}

export async function updateTag(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const updatingData = req.body;
            let updatedRows: any[] = [];

            for (let item of updatingData) {
                const columnValuePairs = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([columnName], index) => `${columnName} = $${index + 1}`)
                    .join(', ');

                const values = Object.entries(item)
                    .filter(([columnName]) => columnName !== "id")
                    .map(([_, value]) => value);

                const query = `
                UPDATE tag
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

export async function getTagList(req: any, res: any) {
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
            FROM tag i
            WHERE 1=1 ${whereClause}
            GROUP BY i.id
            ${orderByClause};
        `;

            const countQuery = `
            SELECT COUNT(*) 
            FROM tag i
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

export async function TagDataSetup(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const obj = req.body;

            if (!Array.isArray(obj) || obj.length === 0) {
                return res.status(400).send(generateResponse(false, "Invalid input array", 400, null));
            }

            const finalData = obj.map((item: any) => ({
                id: ulid(),
                code: item.code,
                name: item.name,
                description: item.description,
                created_by: item.created_by,
                updated_by: item.updated_by
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
            INSERT INTO tag (${columns.join(', ')})
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

export async function deleteTag(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const { id } = req.body;
            const query = `DELETE FROM tag WHERE id = $1;`;
            await client.query(query, [id]);

            return res.status(200).send(generateResponse(true, "Deleted successfully", 200, null));
        } catch (error: any) {
            return res.send(generateResponse(false, error.message, 400, null));
        }
    })
}