import { Router } from 'express';
import * as Controller from '../../controller/dashboardController.js';
import * as  authService from '../../middleware/authService.js'
const Routes = Router();

Routes.get('/api/dashboard/clients-dropdown', authService.authenticate, Controller.getClients);
Routes.get('/api/dashboard/product-life-cycle', authService.authenticate, Controller.getProductLifeCycleEmission);
Routes.get('/api/dashboard/summary-kpis', authService.authenticate, Controller.getSummaryKpis);

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

// Recyclibitily
Routes.get('/api/dashboard/recyclibility-emission', authService.authenticate, Controller.getRecyclability);
Routes.get('/api/dashboard/virgin-or-recyclibility-emission', authService.authenticate, Controller.getVirginOrRecycledEmission);

// Waste
Routes.get('/api/dashboard/waste-emission', authService.authenticate, Controller.getWasteEmissionDetails);
Routes.get('/api/dashboard/waste-type-dropdown', authService.authenticate, Controller.getWasteTypeDropdown);

// Impact Categories
Routes.get('/api/dashboard/impact-categories', authService.authenticate, Controller.getImpactCategories);

// PCF Visualisation Trends
Routes.get('/api/dashboard/pcf-reduction-emission', authService.authenticate, Controller.getPcfReductionGraph);
Routes.get('/api/dashboard/pcf-actual-emission', authService.authenticate, Controller.getActualPcfEmission);
Routes.get('/api/dashboard/forecasted-emission', authService.authenticate, Controller.getForecastedEmission);

// Super Admin dashboard
Routes.get('/api/dashboard/platform-stats', authService.authenticate, Controller.getPlatformStats);
Routes.get('/api/dashboard/client-status-distribution', authService.authenticate, Controller.getClientStatusDistribution);
Routes.get('/api/dashboard/request-status-distribution', authService.authenticate, Controller.getRequestStatusDistribution);
Routes.get('/api/dashboard/top-emitters', authService.authenticate, Controller.getTopEmitters);
Routes.get('/api/dashboard/recent-activities', authService.authenticate, Controller.getRecentActivities);

// Client dashboard
Routes.get('/api/dashboard/product-emissions', authService.authenticate, Controller.getProductEmissions);
Routes.get('/api/dashboard/monthly-emission-trend', authService.authenticate, Controller.getMonthlyEmissionTrend);
Routes.get('/api/dashboard/scope-breakdown', authService.authenticate, Controller.getScopeBreakdown);
Routes.get('/api/dashboard/packaging-emission-details', authService.authenticate, Controller.getPackagingEmissionDetails);

// Client dashboard — Phase A (logged-in client view)
Routes.get('/api/dashboard/client-kpis', authService.authenticate, Controller.getClientKpis);
Routes.get('/api/dashboard/client-pending-pcf-requests', authService.authenticate, Controller.getClientPendingPcfRequests);
Routes.get('/api/dashboard/client-recent-activity', authService.authenticate, Controller.getClientRecentActivity);
Routes.get('/api/dashboard/client-top-suppliers', authService.authenticate, Controller.getClientTopSuppliers);
Routes.get('/api/dashboard/client-energy-resources', authService.authenticate, Controller.getClientEnergyResources);
Routes.get('/api/dashboard/client-emission-hotspots', authService.authenticate, Controller.getClientEmissionHotspots);
Routes.get('/api/dashboard/client-alerts', authService.authenticate, Controller.getClientAlerts);

export default Routes;