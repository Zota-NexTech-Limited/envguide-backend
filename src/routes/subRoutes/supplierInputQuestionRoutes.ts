import { Router } from 'express';
import * as Controller from '../../controller/supplierInputQuestionController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/create-supplier-input-questions', Controller.addSupplierSustainabilityData);
Routes.get('/api/supplier-input-questions-list', authService.authenticate, Controller.getSupplierDetailsList);
Routes.get('/api/supplier-input-questions-get-by-id', authService.authenticate, Controller.getSupplierDetailsById);
Routes.post('/api/update-supplier-input-questions', authService.authenticate, Controller.updateSupplierSustainabilityData);
Routes.get('/api/supplier/material-composition-metal-dropdown', authService.authenticate, Controller.getMaterialCompositionMetal);
Routes.get('/api/supplier/material-composition-metal-type-dropdown', authService.authenticate, Controller.getMaterialCompositionMetalType);
Routes.get('/api/supplier/auto-populate-bom-details', authService.authenticate, Controller.getPCFBOMListToAutoPop);

export default Routes;