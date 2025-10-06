import { Router } from 'express';
import * as Controller from '../../controller/bomController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/bom/add', authService.authenticate, Controller.createBOMWithDetails);
Routes.post('/api/bom/update', authService.authenticate, Controller.updateBOMWithDetails);
Routes.get('/api/bom/get-by-id', authService.authenticate, Controller.getBOMWithDetails);

export default Routes;