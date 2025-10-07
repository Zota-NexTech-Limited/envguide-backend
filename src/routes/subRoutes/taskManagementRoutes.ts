import { Router } from 'express';
import * as Controller from '../../controller/taskManagementController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/task-management/add', authService.authenticate, Controller.createTask);
Routes.post('/api/task-management/update', authService.authenticate, Controller.updateTask);
Routes.get('/api/task-management/get-by-id', authService.authenticate, Controller.getTaskById);
Routes.get('/api/task-management/list', authService.authenticate, Controller.getTaskList);
Routes.post('/api/task-management/delete', authService.authenticate, Controller.deleteTask);

export default Routes;