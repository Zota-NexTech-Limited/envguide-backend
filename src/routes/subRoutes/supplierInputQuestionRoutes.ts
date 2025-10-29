import { Router } from 'express';
import * as Controller from '../../controller/supplierInputQuestionController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/create-supplier-input-questions', authService.authenticate, Controller.addSupplierSustainabilityData);
Routes.get('/api/get-by-id-supplier-input-questions', authService.authenticate, Controller.getSupplierSustainabilityDataById);

export default Routes;