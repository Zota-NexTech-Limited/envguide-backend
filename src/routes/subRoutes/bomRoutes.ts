import { Router } from 'express';
import * as Controller from '../../controller/pcfBomController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/pcf-bom/add', authService.authenticate, Controller.createBOMWithDetails);
Routes.get('/api/pcf-bom/get-by-id', authService.authenticate, Controller.getPcfBOMWithDetails);

export default Routes;