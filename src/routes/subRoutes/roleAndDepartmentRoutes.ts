import { Router } from 'express';
import * as roleAndDeptController from '../../controller/roleAndDepartmentController';
import * as  authService from '../../middleware/authService'
const roleAndDeptRoutes = Router();

roleAndDeptRoutes.post('/api/create-department', authService.authenticate, roleAndDeptController.createDepartment);
roleAndDeptRoutes.post('/api/update-department', authService.authenticate, roleAndDeptController.updateDepartment);
roleAndDeptRoutes.post('/api/delete-department', authService.authenticate, roleAndDeptController.deleteDepartment)
roleAndDeptRoutes.get('/api/get-department-list', authService.authenticate, roleAndDeptController.getDepartmentList)
roleAndDeptRoutes.get('/api/get-department-by-id', authService.authenticate, roleAndDeptController.getDepartmentById)
roleAndDeptRoutes.post('/api/departments-bulk-import', authService.authenticate, roleAndDeptController.bulkImportDepartments);

roleAndDeptRoutes.post('/api/create-role', authService.authenticate, roleAndDeptController.createRole);
roleAndDeptRoutes.post('/api/update-role', authService.authenticate, roleAndDeptController.updateRole);
roleAndDeptRoutes.post('/api/delete-role', authService.authenticate, roleAndDeptController.deleteRole)
roleAndDeptRoutes.get('/api/get-role-list', authService.authenticate, roleAndDeptController.getRoleList)
roleAndDeptRoutes.get('/api/get-role-by-id', authService.authenticate, roleAndDeptController.getRoleById)
roleAndDeptRoutes.post('/api/roles-bulk-import', authService.authenticate, roleAndDeptController.bulkImportRoles);

roleAndDeptRoutes.post('/api/roles-attach-to-department', authService.authenticate, roleAndDeptController.attachRoleToDepartment);
roleAndDeptRoutes.post('/api/list-attached-roles-from-department', authService.authenticate, roleAndDeptController.listRolesFromDepartment);
roleAndDeptRoutes.post('/api/delete-mapping-from-role-department-list', authService.authenticate, roleAndDeptController.deleteMappingFromRoleToDepartmentList);

export default roleAndDeptRoutes;