import { Router } from 'express';
import * as Controller from '../../controller/supplierInfoController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/supplier/add', authService.authenticate, Controller.addSupplierDetails);
Routes.post('/api/supplier/update', authService.authenticate, Controller.updateSupplierDetails);
Routes.get('/api/supplier/list/search', authService.authenticate, Controller.getSupplierDetailsList);
Routes.post('/api/supplier/bulk/add', authService.authenticate, Controller.SupplierDetailsDataSetup);
Routes.post('/api/supplier/delete', authService.authenticate, Controller.deleteSupplierDetails);
Routes.get('/api/supplier/list', authService.authenticate, Controller.getSupplierDetails);

export default Routes;