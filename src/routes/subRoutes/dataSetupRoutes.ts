import { Router } from 'express';
import * as Controller from '../../controller/dataSetupController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

Routes.post('/api/data-setup/calculation-method/add', authService.authenticate, Controller.addCalculationMethod);
Routes.post('/api/data-setup/calculation-method/update', authService.authenticate, Controller.updateCalculationMethod);
Routes.get('/api/data-setup/calculation-method/list/search', authService.authenticate, Controller.getCalculationMethodList);
Routes.post('/api/data-setup/calculation-method/bulk/add', authService.authenticate, Controller.CalculationMethodDataSetup);
Routes.post('/api/data-setup/calculation-method/delete', authService.authenticate, Controller.deleteCalculationMethod);
Routes.get('/api/data-setup/calculation-method/list', authService.authenticate, Controller.getCalculationMethod);

// fuelCombustion
Routes.post('/api/data-setup/fuel-combustion/add', authService.authenticate, Controller.addFuelCombustion);
Routes.post('/api/data-setup/fuel-combustion/update', authService.authenticate, Controller.updateFuelCombustion);
Routes.get('/api/data-setup/fuel-combustion/list/search', authService.authenticate, Controller.getFuelCombustionList);
Routes.post('/api/data-setup/fuel-combustion/bulk/add', authService.authenticate, Controller.FuelCombustionDataSetup);
Routes.post('/api/data-setup/fuel-combustion/delete', authService.authenticate, Controller.deleteFuelCombustion);
Routes.get('/api/data-setup/fuel-combustion/list', authService.authenticate, Controller.getFuelCombustion);

// processEmission
Routes.post('/api/data-setup/process-emission/add', authService.authenticate, Controller.addProcessEmission);
Routes.post('/api/data-setup/process-emission/update', authService.authenticate, Controller.updateProcessEmission);
Routes.get('/api/data-setup/process-emission/list/search', authService.authenticate, Controller.getProcessEmissionList);
Routes.post('/api/data-setup/process-emission/bulk/add', authService.authenticate, Controller.ProcessEmissionDataSetup);
Routes.post('/api/data-setup/process-emission/delete', authService.authenticate, Controller.deleteProcessEmission);
Routes.get('/api/data-setup/process-emission/list', authService.authenticate, Controller.getProcessEmission);

// fugitiveEmission
Routes.post('/api/data-setup/fugitive-emission/add', authService.authenticate, Controller.addFugitiveEmission);
Routes.post('/api/data-setup/fugitive-emission/update', authService.authenticate, Controller.updateFugitiveEmission);
Routes.get('/api/data-setup/fugitive-emission/list/search', authService.authenticate, Controller.getFugitiveEmissionList);
Routes.post('/api/data-setup/fugitive-emission/bulk/add', authService.authenticate, Controller.FugitiveEmissionDataSetup);
Routes.post('/api/data-setup/fugitive-emission/delete', authService.authenticate, Controller.deleteFugitiveEmission);
Routes.get('/api/data-setup/fugitive-emission/list', authService.authenticate, Controller.getFugitiveEmission);

// electricityLocationBased
Routes.post('/api/data-setup/electricity-location-based/add', authService.authenticate, Controller.addElectricityLocationBased);
Routes.post('/api/data-setup/electricity-location-based/update', authService.authenticate, Controller.updateElectricityLocationBased);
Routes.get('/api/data-setup/electricity-location-based/list/search', authService.authenticate, Controller.getElectricityLocationBasedList);
Routes.post('/api/data-setup/electricity-location-based/bulk/add', authService.authenticate, Controller.ElectricityLocationBasedDataSetup);
Routes.post('/api/data-setup/electricity-location-based/delete', authService.authenticate, Controller.deleteElectricityLocationBased);
Routes.get('/api/data-setup/electricity-location-based/list', authService.authenticate, Controller.getElectricityLocationBased);

// electricityMarketBased
Routes.post('/api/data-setup/electricity-market-based/add', authService.authenticate, Controller.addElectricityMarketBased);
Routes.post('/api/data-setup/electricity-market-based/update', authService.authenticate, Controller.updateElectricityMarketBased);
Routes.get('/api/data-setup/electricity-market-based/list/search', authService.authenticate, Controller.getElectricityMarketBasedList);
Routes.post('/api/data-setup/electricity-market-based/bulk/add', authService.authenticate, Controller.ElectricityMarketBasedDataSetup);
Routes.post('/api/data-setup/electricity-market-based/delete', authService.authenticate, Controller.deleteElectricityMarketBased);
Routes.get('/api/data-setup/electricity-market-based/list', authService.authenticate, Controller.getElectricityMarketBased);

// steamHeatCooling
Routes.post('/api/data-setup/steam-heat-cooling/add', authService.authenticate, Controller.addSteamHeatCooling);
Routes.post('/api/data-setup/steam-heat-cooling/update', authService.authenticate, Controller.updateSteamHeatCooling);
Routes.get('/api/data-setup/steam-heat-cooling/list/search', authService.authenticate, Controller.getSteamHeatCoolingList);
Routes.post('/api/data-setup/steam-heat-cooling/bulk/add', authService.authenticate, Controller.SteamHeatCoolingDataSetup);
Routes.post('/api/data-setup/steam-heat-cooling/delete', authService.authenticate, Controller.deleteSteamHeatCooling);
Routes.get('/api/data-setup/steam-heat-cooling/list', authService.authenticate, Controller.getSteamHeatCooling);

export default Routes;