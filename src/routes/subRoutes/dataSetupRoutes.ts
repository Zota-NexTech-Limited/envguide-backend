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

// product type
Routes.post('/api/data-setup/product-type/add', authService.authenticate, Controller.addProductType);
Routes.post('/api/data-setup/product-type/update', authService.authenticate, Controller.updateProductType);
Routes.get('/api/data-setup/product-type/list/search', authService.authenticate, Controller.getProductTypeList);
Routes.post('/api/data-setup/product-type/bulk/add', authService.authenticate, Controller.ProductTypeDataSetup);
Routes.post('/api/data-setup/product-type/delete', authService.authenticate, Controller.deleteProductType);
Routes.get('/api/data-setup/product-type/list', authService.authenticate, Controller.getProductType);


// product category
Routes.post('/api/data-setup/product-category/add', authService.authenticate, Controller.addProductCategory);
Routes.post('/api/data-setup/product-category/update', authService.authenticate, Controller.updateProductCategory);
Routes.get('/api/data-setup/product-category/list/search', authService.authenticate, Controller.getProductCategoryList);
Routes.post('/api/data-setup/product-category/bulk/add', authService.authenticate, Controller.ProductCategoryDataSetup);
Routes.post('/api/data-setup/product-category/delete', authService.authenticate, Controller.deleteProductCategory);
Routes.get('/api/data-setup/product-category/list', authService.authenticate, Controller.getProductCategory);

// product sub category
Routes.post('/api/data-setup/product-sub-category/add', authService.authenticate, Controller.addProductSubCategory);
Routes.post('/api/data-setup/product-sub-category/update', authService.authenticate, Controller.updateProductSubCategory);
Routes.get('/api/data-setup/product-sub-category/list/search', authService.authenticate, Controller.getProductSubCategoryList);
Routes.post('/api/data-setup/product-sub-category/bulk/add', authService.authenticate, Controller.ProductSubCategoryDataSetup);
Routes.post('/api/data-setup/product-sub-category/delete', authService.authenticate, Controller.deleteProductSubCategory);
Routes.get('/api/data-setup/product-sub-category/list', authService.authenticate, Controller.getProductSubCategory);

// Component Type
Routes.post('/api/data-setup/component-type/add', authService.authenticate, Controller.addComponentType);
Routes.post('/api/data-setup/component-type/update', authService.authenticate, Controller.updateComponentType);
Routes.get('/api/data-setup/component-type/list/search', authService.authenticate, Controller.getComponentTypeList);
Routes.post('/api/data-setup/component-type/bulk/add', authService.authenticate, Controller.ComponentTypeDataSetup);
Routes.post('/api/data-setup/component-type/delete', authService.authenticate, Controller.deleteComponentType);
Routes.get('/api/data-setup/component-type/list', authService.authenticate, Controller.getComponentType);

// Component Category
Routes.post('/api/data-setup/component-category/add', authService.authenticate, Controller.addComponentCategory);
Routes.post('/api/data-setup/component-category/update', authService.authenticate, Controller.updateComponentCategory);
Routes.get('/api/data-setup/component-category/list/search', authService.authenticate, Controller.getComponentCategoryList);
Routes.post('/api/data-setup/component-category/bulk/add', authService.authenticate, Controller.ComponentCategoryDataSetup);
Routes.post('/api/data-setup/component-category/delete', authService.authenticate, Controller.deleteComponentCategory);
Routes.get('/api/data-setup/component-category/list', authService.authenticate, Controller.getComponentCategory);

// Industry
Routes.post('/api/data-setup/industry/add', authService.authenticate, Controller.addIndustry);
Routes.post('/api/data-setup/industry/update', authService.authenticate, Controller.updateIndustry);
Routes.get('/api/data-setup/industry/list/search', authService.authenticate, Controller.getIndustryList);
Routes.post('/api/data-setup/industry/bulk/add', authService.authenticate, Controller.IndustryDataSetup);
Routes.post('/api/data-setup/industry/delete', authService.authenticate, Controller.deleteIndustry);
Routes.get('/api/data-setup/industry/list', authService.authenticate, Controller.getIndustry);

// Category
Routes.post('/api/data-setup/category/add', authService.authenticate, Controller.addCategory);
Routes.post('/api/data-setup/category/update', authService.authenticate, Controller.updateCategory);
Routes.get('/api/data-setup/category/list/search', authService.authenticate, Controller.getCategoryList);
Routes.post('/api/data-setup/category/bulk/add', authService.authenticate, Controller.CategoryDataSetup);
Routes.post('/api/data-setup/category/delete', authService.authenticate, Controller.deleteCategory);
Routes.get('/api/data-setup/category/list', authService.authenticate, Controller.getCategory);

// Tag
Routes.post('/api/data-setup/tag/add', authService.authenticate, Controller.addTag);
Routes.post('/api/data-setup/tag/update', authService.authenticate, Controller.updateTag);
Routes.get('/api/data-setup/tag/list/search', authService.authenticate, Controller.getTagList);
Routes.post('/api/data-setup/tag/bulk/add', authService.authenticate, Controller.TagDataSetup);
Routes.post('/api/data-setup/tag/delete', authService.authenticate, Controller.deleteTag);
Routes.get('/api/data-setup/tag/list', authService.authenticate, Controller.getTag);

// Transport mode
Routes.post('/api/data-setup/transport-mode/add', authService.authenticate, Controller.addTranportMode);
Routes.post('/api/data-setup/transport-mode/update', authService.authenticate, Controller.updateTranportMode);
Routes.get('/api/data-setup/transport-mode/list/search', authService.authenticate, Controller.getTranportModeList);
Routes.post('/api/data-setup/transport-mode/bulk/add', authService.authenticate, Controller.TranportModeDataSetup);
Routes.post('/api/data-setup/transport-mode/delete', authService.authenticate, Controller.deleteTranportMode);
Routes.get('/api/data-setup/transport-mode/list', authService.authenticate, Controller.getTranportMode);

// Material Type
Routes.post('/api/data-setup/material-type/add', authService.authenticate, Controller.addMaterialType);
Routes.post('/api/data-setup/material-type/update', authService.authenticate, Controller.updateMaterialType);
Routes.get('/api/data-setup/material-type/list/search', authService.authenticate, Controller.getMaterialTypeList);
Routes.post('/api/data-setup/material-type/bulk/add', authService.authenticate, Controller.MaterialTypeDataSetup);
Routes.post('/api/data-setup/material-type/delete', authService.authenticate, Controller.deleteMaterialType);
Routes.get('/api/data-setup/material-type/list', authService.authenticate, Controller.getMaterialType);

export default Routes;