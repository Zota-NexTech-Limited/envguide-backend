import { withClient } from '../util/database';
import { ulid } from 'ulid';


export async function finduser(user_email: any) {
    return withClient(async (client: any) => {
        try {

            const query = 'SELECT * FROM users_table WHERE user_email = $1';

            const result = await client.query(query, [user_email]);

            return result

        } catch (error: any) {
            throw new Error(error)
        }
    })
}


export async function findUserByMultiple(user_email: any) {
    return withClient(async (client: any) => {
        try {

            const query = `
        SELECT * FROM users_table 
        WHERE user_email = $1 
        OR user_name = $1 
        OR user_phone_number = $1
        LIMIT 1
    `;

            const result = await client.query(query, [user_email]);

            return result

        } catch (error: any) {
            throw new Error(error)
        }
    })
}


export async function addUser(userData: any) {
    return withClient(async (client: any) => {
        try {

            const columns = Object.keys(userData);
            const values = Object.values(userData);

            // Construct the parameterized query
            const insertQuery = `INSERT INTO users_table (${columns.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *;`;
            console.log(insertQuery);

            // Execute the query with parameterized values
            const result = await client.query(insertQuery, values);

            const user_id = userData.user_id;

            //  const [mainModules, modules, submodules] = await Promise.all([
            //     client.query(`SELECT main_module_id AS id, main_module_name AS name FROM main_module_table`),
            //     client.query(`SELECT module_id AS id, module_name AS name FROM module_table`),
            //     client.query(`SELECT submodule_id AS id, submodule_name AS name FROM submodule_table`)
            // ]);

            const [mainModules, modules] = await Promise.all([
                client.query(`SELECT main_module_id AS id, main_module_name AS name FROM main_module_table`),
                client.query(`SELECT module_id AS id, module_name AS name FROM module_table`)
            ]);

            const permissions: any[] = [];

            const pushPermission = (id: string, name: string) => {
                permissions.push({
                    permission_id: ulid(),
                    user_id,
                    module_id: id,
                    module_name: name,
                    create: false,
                    update: false,
                    delete: false,
                    read: false,
                    print: false,
                    export: false,
                    send: false,
                    all: false
                });
            };

            mainModules.rows.forEach((m: any) => pushPermission(m.id, m.name));
            modules.rows.forEach((m: any) => pushPermission(m.id, m.name));
            // submodules.rows.forEach((s: any) => pushPermission(s.id, s.name));


            for (const perm of permissions) {
                await addUserPermission(perm);
            }

            return result

        } catch (error: any) {

            console.log(error)
            throw new Error(error)
        }
    })
}


export async function getPermissionType(user_id: any, module: any) {
    return withClient(async (client: any) => {
        try {

            const query = `SELECT *
         FROM users_permission_table 
         WHERE user_id = $1 AND module_name = $2`;

            const result = await client.query(query, [user_id, module]);

            return result

        } catch (error: any) {
            throw new Error(error)
        }
    })
}

export async function createRole(roleData: any) {
    return withClient(async (client: any) => {
        try {

            const columns = Object.keys(roleData);
            const values = Object.values(roleData);

            // Construct the parameterized query
            const insertQuery = `INSERT INTO roles_table (${columns.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *;`;
            console.log(insertQuery);

            // Execute the query with parameterized values
            const result = await client.query(insertQuery, values);


            return result

        } catch (error: any) {
            console.log(error)
            throw new Error(error)
        }
    })
}

export async function getRole() {
    return withClient(async (client: any) => {
        try {

            const query = 'SELECT * FROM roles_table ';

            const result = await client.query(query);

            return result

        } catch (error: any) {
            throw new Error(error)
        }
    })
}

export async function createDepartment(departmentData: any) {
    return withClient(async (client: any) => {
        try {

            const columns = Object.keys(departmentData);
            const values = Object.values(departmentData);

            // Construct the parameterized query
            const insertQuery = `INSERT INTO department_table (${columns.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *;`;
            console.log(insertQuery);

            // Execute the query with parameterized values
            const result = await client.query(insertQuery, values);


            return result

        } catch (error: any) {
            throw new Error(error)
        }
    })
}

export async function getDepartment() {
    return withClient(async (client: any) => {
        try {

            const query = 'SELECT * FROM department_table ';

            const result = await client.query(query);

            return result

        } catch (error: any) {
            throw new Error(error)
        }
    })
}



export async function getAllUser(query: any) {
    return withClient(async (client: any) => {
        try {
            const { pageNumber, pageSize, sortBy, sortOrder, fromDate, toDate, role, searchColumn, searchValue } = query


            const offset = (pageNumber - 1) * pageSize;
            const limit = pageSize;

            let whereClause = '';
            let orderByClause = '';

            // Add date range filter to the WHERE clause
            if (fromDate && toDate) {
                whereClause += ` AND us.created_date >= '${fromDate}' AND us.created_date < '${toDate}'::date + interval '1 day'`;  // Specify the table alias
            }

            // Add payment status filter to the WHERE clause
            if (role) {
                whereClause += ` AND us.user_role = '${role}'`;  // Specify the table alias
            }

            // Add order status filter to the WHERE clause


            // Add sorting to the ORDER BY clause
            if (sortBy && sortOrder) {

                orderByClause = `ORDER BY us.${sortBy} ${sortOrder}`;  // Sort by other columns in sales_order

            } else {
                // Default sorting by created_date in descending order if no sorting parameters provided
                orderByClause = 'ORDER BY us.created_date DESC';
            }




            // Add search condition for the specified column in both tables
            const searchCondition = searchColumn
                ? `AND (LOWER(${searchColumn}) ILIKE LOWER('%${searchValue}%'))`
                : '';

            const queryCount = `SELECT COUNT(*) FROM users_table us WHERE 1=1 ${whereClause} ${searchCondition};`;
            const findquery: any = `SELECT us.user_id, us.user_name,us.user_role, us.user_department, us.user_phone_number, us.user_email FROM users_table us
      WHERE 1=1 ${whereClause} ${searchCondition} ${orderByClause ? orderByClause : ''} OFFSET $1 LIMIT $2;`;

            console.log(query);
            const totalCount = await client.query(queryCount);
            const getUserList = await client.query(findquery, [offset, limit]);
            const totalRowsCount = totalCount.rows[0].count
            const userList = getUserList.rows

            return { totalRowsCount, userList }

        } catch (error: any) {
            throw new Error(error)
        }
    })
}


export async function getAllUserWithoutPagination(query: any) {
    return withClient(async (client: any) => {
        try {
            const { sortBy, sortOrder, role } = query

            console.log("useeee")

            let whereClause = '';
            let orderByClause = '';

            // Add date range filter to the WHERE clause


            // Add payment status filter to the WHERE clause
            if (role) {
                whereClause += ` WHERE user_role = '${role}'`;  // Specify the table alias
            }

            // Add order status filter to the WHERE clause


            // Add sorting to the ORDER BY clause
            if (sortBy && sortOrder) {

                orderByClause = `ORDER BY ${sortBy} ${sortOrder}`;  // Sort by other columns in sales_order

            } else {
                // Default sorting by created_date in descending order if no sorting parameters provided
                orderByClause = 'ORDER BY created_date DESC';
            }



            //const queryCount = `SELECT COUNT(*) FROM users_table us ${whereClause};`;
            const findquery: any = `SELECT user_id, user_name, user_role, user_department, user_phone_number, user_email FROM users_table 
        ${whereClause}  ${orderByClause ? orderByClause : ''}`;
            console.log(findquery)
            console.log(query);
            // const totalCount = await client.query(queryCount);
            const getUserList = await client.query(findquery);
            //  const totalRowsCount = totalCount.rows[0].count
            const userList = getUserList.rows
            console.log(userList)
            return userList

        } catch (error: any) {
            throw new Error(error)
        }
    })
}

export async function getUserById(user_id: any) {
    return withClient(async (client: any) => {
        try {

            const query = 'SELECT * FROM users_table WHERE user_id = $1';

            const result = await client.query(query, [user_id]);

            return result

        } catch (error: any) {
            throw new Error(error)
        }
    })
}


export async function updateUser(user_id: any, userData: any) {
    return withClient(async (client: any) => {
        try {

            const columnValuePairs = Object.entries(userData)
                .map(([columnName, value], index) => `${columnName} = $${index + 1}`)
                .join(', ');
            // Extracting values from the updatedFields object
            const values = Object.values(userData);

            const query = `
    UPDATE users_table
    SET ${columnValuePairs}
    WHERE user_id = $${Object.keys(userData).length + 1}
    RETURNING *;`;
            console.log(values)
            const result = await client.query(query, [...values, user_id]);
            console.log(result.rows, "result.rows")
            return result

        } catch (error: any) {
            throw new Error(error)
        }
    })
}

export async function addModule(moduleData: any) {
    return withClient(async (client: any) => {
        try {
            await client.query('BEGIN');
            const columns = Object.keys(moduleData);
            const values = Object.values(moduleData);

            // Construct the parameterized query
            const insertQuery = `INSERT INTO module_table (${columns.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *;`;
            console.log(insertQuery);

            // Execute the query with parameterized values
            const result = await client.query(insertQuery, values);

            if (result.rows.length > 0) {
                const getAllUserQuery = 'SELECT * FROM users_table'
                const getAllUserQueryResult = await client.query(getAllUserQuery);

                if (getAllUserQueryResult.rows.length > 0) {
                    for (let user of getAllUserQueryResult.rows) {
                        let permissionobj = {
                            permission_id: ulid(),
                            user_id: user.user_id,
                            module_name: result.rows[0].module_name,
                            module_id: result.rows[0].module_id
                        }
                        console.log(permissionobj, "permissionobj")
                        const userPermission = await addUserPermission(permissionobj)

                    }
                }


            }
            await client.query('COMMIT');

            return result

        } catch (error: any) {
            await client.query('ROLLBACK');
            throw new Error(error)
        }
    })
}

export async function getUserModulePermission(query: any) {
    return withClient(async (client: any) => {
        try {
            console.log(query, "query")
            let findQuery;
            if (query.module_name) {
                // Using parameterized query to prevent SQL injection
                findQuery = {

                    text: `SELECT 
        u.permission_id,
        u.module_name,
        u.module_id,
        u.user_id,
        u.create,
        u.update,
        u.delete,
        u.print,
        u.export,
        u.send,
        u.read,
        u.all,
        mmt.main_module_name,
        mmt.main_module_id 


    FROM 
        users_permission_table u
    JOIN 
        module_table mt ON u.module_id = mt.module_id
    JOIN 
        main_module_table mmt ON mt.main_module_id = mmt.main_module_id
    WHERE 
    u.module_name ILIKE $1 AND u.user_id = $2`,

                    values: [`%${query.module_name}%`, query.user_id],
                };
            } else {
                findQuery = {
                    text: `SELECT 
        u.permission_id,
        u.module_name,
        u.module_id,
        u.user_id,
        u.create,
        u.update,
        u.delete,
        u.print,
        u.export,
        u.send,
        u.read,
        u.all,
        mmt.main_module_name,
        mmt.main_module_id 
    FROM 
        users_permission_table u
    JOIN 
        module_table mt ON u.module_id = mt.module_id
    JOIN 
        main_module_table mmt ON mt.main_module_id = mmt.main_module_id
    WHERE 
        u.user_id = $1`,
                    values: [query.user_id],
                };
            }

            console.log(findQuery, "findQuery");

            const result = await client.query(findQuery);
            console.log(result.rows)

            return result

        } catch (error: any) {
            console.log(error)
            throw new Error(error)
        }
    })
}

// export async function addUserPermission(permissionData: any) {
//     return withClient(async (client: any) => {
//         try {

//             const columns = Object.keys(permissionData);
//             const values = Object.values(permissionData);

//             // Function to handle reserved keywords by enclosing them in double quotes
//             const handleReservedKeywords = (column: any) => (column === 'create' || column === 'update' || column === 'delete' || column === 'read' ? `"${column}"` : column);

//             // Modify columns to handle reserved keywords
//             const columnsWithQuotes = columns.map(handleReservedKeywords);

//             // Construct the parameterized query
//             const insertQuery = ` INSERT INTO users_permission_table (${columnsWithQuotes.join(', ')})
//         VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')})
//         RETURNING *;`;
//             console.log(insertQuery);

//             // Execute the query with parameterized values
//             const result = await client.query(insertQuery, values);

//             return result

//         } catch (error: any) {
//             console.log(error)
//             throw new Error(error)
//         }
//     })
// }
export async function addUserPermission(permissionData: any) {
    return withClient(async (client: any) => {
        try {
            const columns = Object.keys(permissionData);
            const values = Object.values(permissionData);

            // ✅ Reserved SQL keywords
            const reserved = new Set([
                "create",
                "update",
                "delete",
                "read",
                "print",
                "export",
                "send",
                "all"
            ]);

            const handleReserved = (column: string) =>
                reserved.has(column) ? `"${column}"` : column;

            // ✅ Apply quoting
            const columnsWithQuotes = columns.map(handleReserved);

            const insertQuery = `
            INSERT INTO users_permission_table (${columnsWithQuotes.join(", ")})
            VALUES (${values.map((_, i) => `$${i + 1}`).join(", ")})
            RETURNING *;
        `;

            const result = await client.query(insertQuery, values);
            return result;

        } catch (error: any) {
            console.error(error);
            throw new Error(error.message);
        }
    })
}

export async function updatePermission(PersonalData: any) {
    return withClient(async (client: any) => {
        try {

            const { permission_id } = PersonalData

            console.log(PersonalData, "eeeee")

            const handleReservedKeywords = (columnName: string) => (columnName === 'create' || columnName === 'update' || columnName === 'read' || columnName === 'delete' || columnName === 'all' ? `"${columnName}"` : columnName);

            // Creating SET columnValuePairs with proper handling of reserved keywords
            const columnValuePairs = Object.entries(PersonalData)
                .map(([columnName, value], index) => `${handleReservedKeywords(columnName)} = $${index + 1}`)
                .join(', ');

            // Extracting values from the PersonalData object
            const values = Object.values(PersonalData);

            // Constructing the SQL query
            const query = `
            UPDATE users_permission_table
            SET ${columnValuePairs}
            WHERE permission_id = $${values.length + 1} 
            RETURNING *;`;


            // console.log(values)

            const result = await client.query(query, [...values, permission_id]);
            console.log(result.rows, "eeeee")

            return result

        } catch (error: any) {
            console.log(error, PersonalData, "eeeeeeeeeerrrrrrrrrrrrr")
            throw new Error(error)
        }
    })
}

export async function getPermission(user_id: any) {

    return withClient(async (client: any) => {
        try {

            const query = `SELECT  * FROM  users_permission_table  WHERE  user_id = $1`;

            const result = await client.query(query, [user_id]);

            return result

        } catch (error: any) {
            throw new Error(error)
        }
    })
}

export async function getModule() {
    return withClient(async (client: any) => {
        try {
            const query = `SELECT * FROM module_table`
            const result = await client.query(query)

            return result
        } catch (error: any) {
            throw new Error(error)
        }
    })
}


export async function addMainModule(moduleData: any) {
    return withClient(async (client: any) => {
        try {

            const columns = Object.keys(moduleData);
            const values = Object.values(moduleData);

            // Construct the parameterized query
            const insertQuery = `INSERT INTO main_module_table (${columns.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *;`;
            console.log(insertQuery);

            // Execute the query with parameterized values
            const result = await client.query(insertQuery, values);


            return result

        } catch (error: any) {
            throw new Error(error)
        }
    })
}


export async function addUpdateUpdateModule(subModuleData: any) {
    return withClient(async (client: any) => {
        try {
            const { module_id } = subModuleData
            const columnValuePairs = Object.entries(subModuleData)
                .map(([columnName, value], index) => `${columnName} = $${index + 1}`)
                .join(', ');
            // Extracting values from the updatedFields object
            const values = Object.values(subModuleData);

            const query = `
    UPDATE module_table
    SET ${columnValuePairs}
    WHERE module_id = $${Object.keys(subModuleData).length + 1}
    RETURNING *;`;
            console.log(values)
            const result = await client.query(query, [...values, module_id]);

            return result

        } catch (error: any) {
            throw new Error(error)
        }
    })
}



export async function userSync(data: any) {
    return withClient(async (client: any) => {
        try {
            for (const user of data) {
                const { permissions } = user
                const userObj = {
                    user_id: user.user_id,
                    user_name: user.user_name,
                    user_role_id: user.user_role_id,
                    user_role: user.user_role,
                    user_email: user.user_email,
                    user_password: user.user_password,
                    user_store_id: user.user_store_id,
                    user_phone_number: user.user_phone_number,
                    user_department: user.user_department,
                    change_password_next_login: user.change_password_next_login,
                    password_never_expires: user.password_never_expires,
                    password_expiry_date: user.password_expiry_date,
                    pos_id: user.pos_id
                }
                // console.log(permissions,"e34r56")
                if (Array.isArray(user.permissions)) {
                    const extractedBatchData: any = []
                    // Push each itemBatchData object into the extractedBatchData array
                    user.permissions.forEach((permission: any) => {
                        extractedBatchData.push(permission);
                    });
                }
                const updateOrInsertUserInfo = await updateOrInsertuserSync(userObj)
                const updateOrInsertPersmission = await updateOrInsertPersmissionSync(permissions)
            }

        } catch (error: any) {
            throw new Error(error)
        }
    })
}

async function updateOrInsertuserSync(userInfo: any) {
    return withClient(async (client: any) => {
        try {
            const columns = Object.keys(userInfo);
            // Create placeholders for the values dynamically (e.g., $1, $2, ...)
            const valuePlaceholders = columns.map((_, idx) => `$${idx + 1}`);

            // Generate the "SET" part of the update statement dynamically
            const updateSetClause = columns
                .filter(column => column !== 'user_id')  // Exclude the primary key from the update
                .map(column => `${column} = EXCLUDED.${column}`)
                .join(', ');

            const query = `
          INSERT INTO users_table (${columns.join(', ')})
          VALUES (${valuePlaceholders.join(', ')})
          ON CONFLICT (user_id)
          DO UPDATE SET
          ${updateSetClause}
          RETURNING *;
      `;

            // Get the values from the object in the same order as the columns
            const values = columns.map(column => userInfo[column]);


            const result = await client.query(query, values);
        } catch (error) {
            console.log(error)
        }
    })
}


export async function updateOrInsertPersmissionSync(persmission: any) {
    return withClient(async (client: any) => {
        try {
            for (let item of persmission) {
                // Get the keys of the object dynamically
                const columns = Object.keys(item);
                // Create placeholders for the values dynamically (e.g., $1, $2, ...)

                const handleReservedKeywords = (column: any) => (column === 'create' || column === 'update' || column === 'delete' || column === 'read' || column === 'all' ? `"${column}"` : column);
                const columnsWithQuotes = columns.map(handleReservedKeywords);
                const valuePlaceholders = columns.map((_, idx) => `$${idx + 1}`);
                // Generate the "SET" part of the update statement dynamically
                const updateSetClause = columnsWithQuotes
                    .filter(columnsWithQuotes => columnsWithQuotes !== 'permission_id')  // Exclude the primary key from the update
                    .map(columnsWithQuotes => `${columnsWithQuotes} = EXCLUDED.${columnsWithQuotes}`)
                    .join(', ');
                // console.log(updateSetClause)
                const query = `
            INSERT INTO users_permission_table (${columnsWithQuotes.join(', ')})
            VALUES (${valuePlaceholders.join(', ')})
            ON CONFLICT (permission_id)
            DO UPDATE SET
            ${updateSetClause}
            RETURNING *;
        `;
                // console.log(query,"wer34er")
                // Get the values from the object in the same order as the columns
                const values = columns.map(column => item[column]);


                const result = await client.query(query, values);
                //  console.log(result.rows[0]);
            }


        }
        catch (error: any) {
            console.error('Error in upsert:', error);
            throw error;
        }
    })
}


export async function createDocumentType(roleData: any) {
    return withClient(async (client: any) => {
        try {
            roleData.document_id = ulid();
            const columns = Object.keys(roleData);
            const values = Object.values(roleData);

            // Construct the parameterized query
            const insertQuery = `INSERT INTO document_type_table (${columns.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *;`;
            console.log(insertQuery);

            // Execute the query with parameterized values
            const result = await client.query(insertQuery, values);


            return result

        } catch (error: any) {
            console.log(error)
            throw new Error(error)
        }
    })
}


export async function getDocumentDropDown() {
    return withClient(async (client: any) => {
        try {

            const query = 'SELECT * FROM document_type_table ';

            const result = await client.query(query);

            return result

        } catch (error: any) {
            throw new Error(error)
        }
    })
}