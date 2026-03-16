import { Router } from 'express';
import * as Controller from '../../controller/componentMasterController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.get('/api/component-master/list', authService.authenticate, Controller.getComponnetMasterList);

export default Routes;