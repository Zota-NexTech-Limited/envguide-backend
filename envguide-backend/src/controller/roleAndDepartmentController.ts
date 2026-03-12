import { generateResponse } from '../util/genRes';
import * as roleAndDeptService from '../services/roleAndDepartmentService';

export async function createDepartment(req: any, res: any) {
  try {
    const departmentData = req.body

    departmentData.created_by = req.user_id;
    const createDepartment = await roleAndDeptService.createDepartment(departmentData)

    if (createDepartment.rows.length > 0) {
      return res.status(200).send(
        generateResponse(true, "deparment added successfully", 200, createDepartment.rows[0])
      );
    } else {
      return res.status(400).send(
        generateResponse(false, "deparment adding unsuccessful", 400, null)
      );
    }

  } catch (error: any) {
    console.log(error, "error");
    return res.status(400).send(generateResponse(false, error.message, 400, null));
  }
}

export async function updateDepartment(req: any, res: any) {
  try {
    const updateArray = req.body;

    if (!Array.isArray(updateArray) || updateArray.length === 0) {
      return res.status(400).send(
        generateResponse(false, "Request body must be a non-empty array", 400, null)
      );
    }

    // Add updated_by to each record
    const userId = req.user_id;
    updateArray.forEach(item => {
      item.updated_by = userId;
    });

    console.log(updateArray, "updateArray");

    const updatedResults = await roleAndDeptService.updateDepartment(updateArray);

    return res.status(200).send(
      generateResponse(true, "Departments updated successfully", 200, updatedResults)
    );

  } catch (error: any) {
    console.error(error);
    return res.status(400).send(generateResponse(false, error.message, 400, null));
  }
}

export async function deleteDepartment(req: any, res: any) {
  try {
    const { department_id } = req.body;

    if (!department_id) {
      return res.status(400).send(
        generateResponse(false, "department_id is required", 400, null)
      );
    }

    const deleted = await roleAndDeptService.deleteDepartment(department_id);

    if (deleted && deleted.rowCount && deleted.rowCount > 0) {
      return res.status(200).send(
        generateResponse(true, "department deleted successfully", 200, null)
      );
    } else {
      return res.status(404).send(
        generateResponse(false, "department not found", 404, null)
      );
    }

  } catch (error: any) {
    console.error(error);
    return res.status(400).send(generateResponse(false, error.message, 400, null));
  }
}

export async function getDepartmentList(req: any, res: any) {
  try {
    const { search = "" } = req.query;

    const list = await roleAndDeptService.getDepartmentList(search);

    return res.status(200).send(
      generateResponse(true, "Departments fetched successfully", 200, list)
    );

  } catch (error: any) {
    console.error(error);
    return res.status(400).send(
      generateResponse(false, error.message, 400, null)
    );
  }
}

export async function getDepartmentById(req: any, res: any) {
  try {
    const { department_id } = req.query;

    if (!department_id) {
      return res.status(400).send(
        generateResponse(false, "department_id is required", 400, null)
      );
    }

    const department = await roleAndDeptService.getDepartmentById(department_id);

    if (department) {
      return res.status(200).send(
        generateResponse(true, "Department fetched successfully", 200, department)
      );
    } else {
      return res.status(404).send(
        generateResponse(false, "Department not found", 404, null)
      );
    }

  } catch (error: any) {
    console.error(error);
    return res.status(400).send(
      generateResponse(false, error.message, 400, null)
    );
  }
}

import { ulid } from "ulid";

export async function bulkImportDepartments(req: any, res: any) {
  try {
    const departmentArray = req.body;

    if (!Array.isArray(departmentArray) || departmentArray.length === 0) {
      return res.status(400).send(
        generateResponse(false, "Request body must be a non-empty array", 400, null)
      );
    }

    const createdBy = req.user_id;

    const departmentsToInsert = departmentArray.map(dep => ({
      department_id: ulid(),
      department_name: dep.department_name,
      description: dep.description,
      department_code: dep.department_code,
      created_by: createdBy,
    }));

    const result = await roleAndDeptService.bulkInsertDepartments(departmentsToInsert);

    return res.status(200).send(
      generateResponse(true, "Departments imported successfully", 200, result)
    );

  } catch (error: any) {
    console.error(error);
    return res.status(400).send(
      generateResponse(false, error.message, 400, null)
    );
  }
}

export async function createRole(req: any, res: any) {
  try {
    const roleData = req.body;
    roleData.role_id = ulid();
    roleData.created_by = req.user_id;

    const created = await roleAndDeptService.createRole(roleData);

    if (created.rows.length > 0) {
      return res.status(200).send(generateResponse(true, "Role added successfully", 200, created.rows[0]));
    } else {
      return res.status(400).send(generateResponse(false, "Role creation failed", 400, null));
    }
  } catch (error: any) {
    console.error(error);
    return res.status(400).send(generateResponse(false, error.message, 400, null));
  }
}

export async function updateRole(req: any, res: any) {
  try {
    const rolesArray = req.body;

    if (!Array.isArray(rolesArray) || rolesArray.length === 0) {
      return res.status(400).send(
        generateResponse(false, "Request body must be a non-empty array", 400, null)
      );
    }

    const userId = req.user_id;
    rolesArray.forEach(role => {
      role.updated_by = userId;
    });

    console.log(rolesArray, "rolesArray");

    const updatedResults = await roleAndDeptService.updateRole(rolesArray);

    return res.status(200).send(
      generateResponse(true, "Roles updated successfully", 200, updatedResults)
    );

  } catch (error: any) {
    console.error(error);
    return res.status(400).send(generateResponse(false, error.message, 400, null));
  }
}

export async function deleteRole(req: any, res: any) {
  try {
    const { role_id } = req.body;

    if (!role_id) return res.status(400).send(generateResponse(false, "role_id is required", 400, null));

    const deleted = await roleAndDeptService.deleteRole(role_id);

    if (deleted && deleted.rowCount && deleted.rowCount > 0) {
      return res.status(200).send(generateResponse(true, "Role deleted successfully", 200, null));
    } else {
      return res.status(404).send(generateResponse(false, "Role not found", 404, null));
    }
  } catch (error: any) {
    console.error(error);
    return res.status(400).send(generateResponse(false, error.message, 400, null));
  }
}

export async function getRoleList(req: any, res: any) {
  try {
    const { search = "" } = req.query;
    const roles = await roleAndDeptService.getRoleList(search);
    return res.status(200).send(generateResponse(true, "Roles fetched successfully", 200, roles));
  } catch (error: any) {
    return res.status(400).send(generateResponse(false, error.message, 400, null));
  }
}

export async function getRoleById(req: any, res: any) {
  try {
    const { role_id } = req.query;

    if (!role_id) return res.status(400).send(generateResponse(false, "role_id is required", 400, null));

    const role = await roleAndDeptService.getRoleById(role_id);

    if (role) {
      return res.status(200).send(generateResponse(true, "Role fetched successfully", 200, role));
    } else {
      return res.status(404).send(generateResponse(false, "Role not found", 404, null));
    }

  } catch (error: any) {
    return res.status(400).send(generateResponse(false, error.message, 400, null));
  }
}

export async function bulkImportRoles(req: any, res: any) {
  try {
    const roles = req.body;

    if (!Array.isArray(roles) || roles.length === 0)
      return res.status(400).send(generateResponse(false, "Body must be non-empty array", 400, null));

    const created_by = req.user_id;

    const rolesToInsert = roles.map(role => ({
      role_id: ulid(),
      role_name: role.role_name,
      description: role.description,
      role_code: role.role_code,
      created_by
    }));

    const result = await roleAndDeptService.bulkInsertRoles(rolesToInsert);

    return res.status(200).send(generateResponse(true, "Roles imported successfully", 200, result));
  } catch (error: any) {
    return res.status(400).send(generateResponse(false, error.message, 400, null));
  }
}

export async function attachRoleToDepartment(req: any, res: any) {
  try {
    const { department_id, roles_id } = req.body;

    if (!department_id || !Array.isArray(roles_id) || roles_id.length === 0) {
      return res.status(400).send(
        generateResponse(false, "department_id and roles_id[] are required", 400, null)
      );
    }

    const updated = await roleAndDeptService.attachRoleToDepartment(department_id, roles_id);

    if (updated && updated.rows && updated.rows.length > 0) {
      return res.status(200).send(
        generateResponse(true, "Roles attached to department successfully", 200, updated.rows[0])
      );
    } else {
      return res.status(404).send(
        generateResponse(false, "Department not found", 404, null)
      );
    }

  } catch (error: any) {
    console.error(error);
    return res.status(400).send(generateResponse(false, error.message, 400, null));
  }
}

export async function listRolesFromDepartment(req: any, res: any) {
  try {
    const { search = "" } = req.query;
    const result = await roleAndDeptService.listRolesFromDepartment(search);
    return res.status(200).send(
      generateResponse(true, "Department roles fetched successfully", 200, result)
    );
  } catch (error: any) {
    console.error(error);
    return res.status(400).send(
      generateResponse(false, error.message, 400, null)
    );
  }
}

export async function deleteMappingFromRoleToDepartmentList(req: any, res: any) {
  try {
    const { department_id } = req.body;

    if (!department_id) {
      return res.status(400).send(
        generateResponse(false, "department_id are required", 400, null)
      );
    }

    const updated = await roleAndDeptService.deleteMappingFromRoleToDepartment(department_id);

    if (updated && updated.rows && updated.rows.length > 0) {
      return res.status(200).send(
        generateResponse(true, "Mapping deleted from list successfully", 200, "Success")
      );
    } else {
      return res.status(404).send(
        generateResponse(false, "Department not found", 404, null)
      );
    }

  } catch (error: any) {
    console.error(error);
    return res.status(400).send(generateResponse(false, error.message, 400, null));
  }
}