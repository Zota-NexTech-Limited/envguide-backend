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

// Manufacturing
Routes.get('/api/dashboard/manufacturing-process-emission', authService.authenticate, Controller.getManufacturingProcessEmission);
Routes.get('/api/dashboard/process-energy-emission', authService.authenticate, Controller.processEnergyEmission);
Routes.get('/api/dashboard/material-composition-emission', authService.authenticate, Controller.getMaterialComposition);
Routes.get('/api/dashboard/material-carbon-intensity-emission', authService.authenticate, Controller.getMaterialCarbonIntensity);
Routes.get('/api/dashboard/percentage-share-of-total-emission', authService.authenticate, Controller.getPercentageShareOfTotalEmission);

// Transportation
Routes.get('/api/dashboard/mode-of-transportation-emission', authService.authenticate, Controller.getModeOfTransportEmission);
Routes.get('/api/dashboard/distance-vs-correlation-emission', authService.authenticate, Controller.getDistanceVsCorrelationEmission);

// Energy Source 
Routes.get('/api/dashboard/energy-source-emission', authService.authenticate, Controller.getEnergySourceEmission);
Routes.get('/api/dashboard/process-wise-energy-consumption-emission', authService.authenticate, Controller.getProcessWiseEnergyConsumption);

export default Routes;