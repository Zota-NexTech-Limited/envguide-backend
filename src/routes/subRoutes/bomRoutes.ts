import { Router } from 'express';
import * as Controller from '../../controller/bomController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/bom/add', authService.authenticate, Controller.createBOMWithDetails);
Routes.get('/api/bom/get-by-id', authService.authenticate, Controller.getBOMWithDetails);

export default Routes;