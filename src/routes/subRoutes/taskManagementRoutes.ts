import { Router } from 'express';
import * as Controller from '../../controller/taskManagementController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.get('/api/task-management/get-pcf-dropdown', authService.authenticate, Controller.getPCFListDropDown);
Routes.get('/api/task-management/get-bom-suppier-list-dropdown', authService.authenticate, Controller.getPCFBOMSupplierListDropDown);
Routes.post('/api/task-management/create', authService.authenticate, Controller.createTask);
Routes.get('/api/task-management/list', authService.authenticate, Controller.getTaskList);
Routes.get('/api/task-management/get-by-id', authService.authenticate, Controller.getTaskById);
Routes.post('/api/task-management/delete', authService.authenticate, Controller.deleteTask);
Routes.post('/api/task-management/test-email', authService.authenticate, Controller.sampleEmailTest);

export default Routes;