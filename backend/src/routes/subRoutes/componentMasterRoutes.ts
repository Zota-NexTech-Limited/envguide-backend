import { Router } from 'express';
import * as Controller from '../../controller/componentMasterController.js';
import * as  authService from '../../middleware/authService.js'
const Routes = Router();

Routes.get('/api/component-master/list', authService.authenticate, Controller.getComponnetMasterList);

export default Routes;