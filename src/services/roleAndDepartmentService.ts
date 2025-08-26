import client from '../util/database';
import { ulid } from 'ulid';

export async function createDepartment(departmentData: any) {
  try {

    departmentData.department_id = ulid();

    const columns = Object.keys(departmentData);
    const values = Object.values(departmentData);

    const insertQuery = `INSERT INTO department_table (${columns.join(', ')}) VALUES (${values.map((_, i) => `$${i + 1}`).join(', ')}) RETURNING *;`;
    console.log(insertQuery);

    const result = await client.query(insertQuery, values);

    return result

  } catch (error: any) {
    throw new Error(error)
  }
}


export async function updateDepartment(updateArray: any[]) {
  try {
    const allowedFields = ["department_name", "description", "department_code", "updated_by"];

    // Run updates in parallel using Promise.all
    const promises = updateArray.map(async (updateData) => {
      if (!updateData.department_id) {
        throw new Error("department_id is required for update");
      }

      const keys = Object.keys(updateData).filter(key => allowedFields.includes(key));
      if (keys.length === 0) {
        throw new Error(`No valid fields to update for department_id: ${updateData.department_id}`);
      }

      const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
      const values = keys.map(key => updateData[key]);

      const query = `
        UPDATE department_table
        SET ${setClause}
        WHERE department_id = $${keys.length + 1}
        RETURNING *;
      `;

      const result = await client.query(query, [...values, updateData.department_id]);
      return result.rows[0] || null;
    });

    const results = await Promise.all(promises);

    // Filter out null (failed updates)
    return results.filter(r => r !== null);

  } catch (error: any) {
    if ((error as any).code === '23505') {
      throw new Error("Department code must be unique");
    }
    throw new Error((error as Error).message);
  }
}

export async function deleteDepartment(department_id: string) {
  try {
    const query = `DELETE FROM department_table WHERE department_id = $1`;
    const result = await client.query(query, [department_id]);
    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function getDepartmentList(search: string = "") {
  try {
    const searchQuery = `%${search.toLowerCase()}%`;

    const baseWhereClause = `
      LOWER(d.department_name) LIKE $1 OR
      LOWER(d.description) LIKE $1 OR
      LOWER(d.department_code) LIKE $1 OR
      LOWER(cu.user_name) LIKE $1 OR
      LOWER(uu.user_name) LIKE $1
    `;

    // 1. Get filtered rows
    const dataQuery = `
      SELECT 
        d.department_id,
        d.department_name,
        d.description,
        d.department_code,
        d.created_by,
        d.updated_by,
        cu.user_name AS created_by_name,
        uu.user_name AS updated_by_name,
        d.created_date,
        d.update_date
      FROM department_table d
      LEFT JOIN users_table cu ON d.created_by = cu.user_id
      LEFT JOIN users_table uu ON d.updated_by = uu.user_id
      WHERE ${baseWhereClause}
      ORDER BY d.created_date DESC;
    `;

    const dataResult = await client.query(dataQuery, [searchQuery]);

    // 2. Get count of matched rows
    const countQuery = `
      SELECT COUNT(*) AS total_count
      FROM department_table d
      LEFT JOIN users_table cu ON d.created_by = cu.user_id
      LEFT JOIN users_table uu ON d.updated_by = uu.user_id
      WHERE ${baseWhereClause};
    `;

    const countResult = await client.query(countQuery, [searchQuery]);
    const totalCount = parseInt(countResult.rows[0].total_count, 10);

    return {
      totalCount,
      rows: dataResult.rows
    };

  } catch (error: any) {
    throw new Error(error.message);
  }
}


export async function getDepartmentById(department_id: string) {
  try {
    const query = `
      SELECT 
        d.department_id,
        d.department_name,
        d.description,
        d.department_code,
        d.created_by,
        d.updated_by,
        cu.user_name AS created_by_name,
        uu.user_name AS updated_by_name,
        d.created_date,
        d.update_date
      FROM department_table d
      LEFT JOIN users_table cu ON d.created_by = cu.user_id
      LEFT JOIN users_table uu ON d.updated_by = uu.user_id
      WHERE d.department_id = $1
      LIMIT 1;
    `;

    const result = await client.query(query, [department_id]);
    return result.rows[0];

  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function bulkInsertDepartments(departments: any[]) {
  try {
    const columns = ["department_id", "department_name", "description", "department_code", "created_by"];
    const values: any[] = [];
    const valuePlaceholders: string[] = [];

    departments.forEach((dep, index) => {
      const valueOffset = index * columns.length;
      valuePlaceholders.push(
        `(${columns.map((_, i) => `$${valueOffset + i + 1}`).join(", ")})`
      );
      values.push(
        dep.department_id,
        dep.department_name,
        dep.description,
        dep.department_code,
        dep.created_by
      );
    });

    const query = `
      INSERT INTO department_table (${columns.join(", ")})
      VALUES ${valuePlaceholders.join(", ")}
      RETURNING *;
    `;

    const result = await client.query(query, values);
    return result.rows;

  } catch (error: any) {
    if ((error as any).code === '23505') {
      throw new Error("Duplicate department code found");
    }
    throw new Error((error as Error).message);
  }
}

export async function createRole(roleData: any) {
  try {
    const columns = Object.keys(roleData);
    const values = Object.values(roleData);
    const query = `
      INSERT INTO roles_table (${columns.join(", ")})
      VALUES (${columns.map((_, i) => `$${i + 1}`).join(", ")})
      RETURNING *;
    `;
    return await client.query(query, values);
  } catch (error: any) {
    // if ((error as any).code === "23505") throw new Error("Role code must be unique");
    throw new Error((error as Error).message);
  }
}

export async function updateRole(rolesArray: any[]) {
  try {
    const allowedFields = ["role_name", "description", "role_code", "updated_by"];

    const promises = rolesArray.map(async (roleData) => {
      if (!roleData.role_id) {
        throw new Error("role_id is required for update");
      }

      const keys = Object.keys(roleData).filter(k => allowedFields.includes(k));
      if (keys.length === 0) {
        throw new Error(`No valid fields to update for role_id: ${roleData.role_id}`);
      }

      const setClause = keys.map((k, i) => `${k} = $${i + 1}`).join(", ");
      const values = keys.map(k => roleData[k]);

      const query = `
        UPDATE roles_table
        SET ${setClause}, update_date = now()
        WHERE role_id = $${keys.length + 1}
        RETURNING *;
      `;

      const result = await client.query(query, [...values, roleData.role_id]);
      return result.rows[0] || null;
    });

    const results = await Promise.all(promises);
    return results.filter(r => r !== null);

  } catch (error: any) {
    if ((error as any).code === "23505") {
      throw new Error("Role code must be unique");
    }
    throw new Error((error as Error).message);
  }
}


export async function deleteRole(role_id: string) {
  const query = `DELETE FROM roles_table WHERE role_id = $1`;
  return await client.query(query, [role_id]);
}

export async function getRoleList(search: string = "") {
  try {
    const searchQuery = `%${search.toLowerCase()}%`;

    const baseWhereClause = `
      LOWER(r.role_name) LIKE $1 OR 
      LOWER(r.description) LIKE $1 OR 
      LOWER(r.role_code) LIKE $1 OR 
      LOWER(cu.user_name) LIKE $1 OR 
      LOWER(uu.user_name) LIKE $1
    `;

    // 1. Fetch roles data with user names
    const dataQuery = `
      SELECT 
        r.*, 
        cu.user_name AS created_by_name,
        uu.user_name AS updated_by_name
      FROM roles_table r
      LEFT JOIN users_table cu ON r.created_by = cu.user_id
      LEFT JOIN users_table uu ON r.updated_by = uu.user_id
      WHERE ${baseWhereClause}
      ORDER BY r.created_date DESC;
    `;

    const dataResult = await client.query(dataQuery, [searchQuery]);

    // 2. Count query for total matching rows
    const countQuery = `
      SELECT COUNT(*) AS total_count
      FROM roles_table r
      LEFT JOIN users_table cu ON r.created_by = cu.user_id
      LEFT JOIN users_table uu ON r.updated_by = uu.user_id
      WHERE ${baseWhereClause};
    `;

    const countResult = await client.query(countQuery, [searchQuery]);
    const totalCount = parseInt(countResult.rows[0].total_count, 10);

    return {
      totalCount,
      rows: dataResult.rows
    };

  } catch (error: any) {
    throw new Error(error.message);
  }
}


export async function getRoleById(role_id: string) {
  const query = `
    SELECT 
      r.*, 
      cu.user_name as created_by_name,
      uu.user_name as updated_by_name
    FROM roles_table r
    LEFT JOIN users_table cu ON r.created_by = cu.user_id
    LEFT JOIN users_table uu ON r.updated_by = uu.user_id
    WHERE r.role_id = $1
    LIMIT 1;
  `;
  const result = await client.query(query, [role_id]);
  return result.rows[0];
}

export async function bulkInsertRoles(roles: any[]) {
  const columns = ["role_id", "role_name", "description", "role_code", "created_by"];
  const values: any[] = [];
  const valuePlaceholders: string[] = [];

  roles.forEach((role, index) => {
    const offset = index * columns.length;
    valuePlaceholders.push(`(${columns.map((_, i) => `$${offset + i + 1}`).join(", ")})`);
    values.push(role.role_id, role.role_name, role.description, role.role_code, role.created_by);
  });

  const query = `
    INSERT INTO roles_table (${columns.join(", ")})
    VALUES ${valuePlaceholders.join(", ")}
    RETURNING *;
  `;

  return (await client.query(query, values)).rows;
}

export async function attachRoleToDepartment(department_id: string, roles_id: string[]) {
  try {
    const query = `
      UPDATE department_table
      SET roles_id = $1, is_mapping = true
      WHERE department_id = $2
      RETURNING *;
    `;

    const result = await client.query(query, [roles_id, department_id]);
    return result; // return updated record
  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function listRolesFromDepartment(search: string = "") {
  try {
    const searchTerm = `%${search.toLowerCase()}%`;

    // Step 1: Fetch departments with user names
    const deptQuery = `
      SELECT 
        d.department_id,
        d.department_name,
        d.department_code,
        d.roles_id,
        d.created_by,
        d.updated_by,
        d.is_mapping,
        cu.user_name AS created_by_name,
        uu.user_name AS updated_by_name
      FROM department_table d
      LEFT JOIN users_table cu ON d.created_by = cu.user_id
      LEFT JOIN users_table uu ON d.updated_by = uu.user_id
      WHERE 
      is_mapping = true AND(
        LOWER(d.department_name) LIKE $1 OR
        LOWER(d.department_code) LIKE $1 OR
        LOWER(cu.user_name) LIKE $1 OR
        LOWER(uu.user_name) LIKE $1
        )
      ORDER BY d.created_date DESC;
    `;

    const deptResult = await client.query(deptQuery, [searchTerm]);
    const departments = deptResult.rows;
    const totalCount = departments.length;

    if (totalCount === 0) {
      return { totalCount: 0, rows: [] };
    }

    // Step 2: Collect all unique role_ids
    const allRoleIds = departments
      .flatMap(dep => dep.roles_id || [])
      .filter((value, index, self) => self.indexOf(value) === index); // unique

    let rolesMap: Record<string, any> = {};

    if (allRoleIds.length > 0) {
      const placeholders = allRoleIds.map((_, i) => `$${i + 1}`).join(", ");
      const roleQuery = `
        SELECT role_id, role_name, role_code 
        FROM roles_table 
        WHERE role_id IN (${placeholders})
      `;
      const roleResult = await client.query(roleQuery, allRoleIds);

      rolesMap = roleResult.rows.reduce((acc, role) => {
        acc[role.role_id] = role;
        return acc;
      }, {});
    }

    // Step 3: Attach roles to departments
    const enrichedDepartments = departments.map(dep => {
      const attachedRoles = (dep.roles_id || []).map((id: string) => rolesMap[id]).filter(Boolean);
      return {
        department_id: dep.department_id,
        department_name: dep.department_name,
        department_code: dep.department_code,
        is_mapping: dep.is_mapping,
        created_by: dep.created_by,
        created_by_name: dep.created_by_name,
        updated_by: dep.updated_by,
        updated_by_name: dep.updated_by_name,
        roles: attachedRoles
      };
    });

    return { totalCount, rows: enrichedDepartments };
    // return enrichedDepartments;

  } catch (error: any) {
    throw new Error(error.message);
  }
}

export async function deleteMappingFromRoleToDepartment(department_id: string) {
  try {
    const query = `
  UPDATE department_table
  SET is_mapping = false, roles_id = ARRAY[]::TEXT[]
  WHERE department_id = $1
  RETURNING *;
`;

    const result = await client.query(query, [department_id]);
    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
}