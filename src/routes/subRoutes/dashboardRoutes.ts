import { Router } from 'express';
import * as Controller from '../../controller/dashboardController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.get('/api/dashboard/clients-dropdown', authService.authenticate, Controller.getClients);
Routes.get('/api/dashboard/product-life-cycle', authService.authenticate, Controller.getProductLifeCycleEmission);

// Supplier  emission
Routes.get('/api/dashboard/supplier-dropdown', authService.authenticate, Controller.getSupplierDropdown);
Routes.get('/api/dashboard/supplier-emission', authService.authenticate, Controller.getSupplierEmission);
Routes.get('/api/dashboard/component-dropdown', authService.authenticate, Controller.getComponentDropdown);
Routes.get('/api/dashboard/supplier-material-comparition-emission', authService.authenticate, Controller.getSupplierMaterialEmissionComparison);

export default Routes;