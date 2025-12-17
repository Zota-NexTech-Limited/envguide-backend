import { Router } from 'express';
import * as Controller from '../../controller/materDataSetupController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

// MaterialCompositionMetal
Routes.post('/api/master-data-setup/material-composition-metal/add', authService.authenticate, Controller.addMaterialCompositionMetal);
Routes.post('/api/master-data-setup/material-composition-metal/update', authService.authenticate, Controller.updateMaterialCompositionMetal);
Routes.get('/api/master-data-setup/material-composition-metal/list/search', authService.authenticate, Controller.getMaterialCompositionMetalListSearch);
Routes.post('/api/master-data-setup/material-composition-metal/bulk/add', authService.authenticate, Controller.materialCompositionMetalDataSetup);
Routes.post('/api/master-data-setup/material-composition-metal/delete', authService.authenticate, Controller.deleteMaterialCompositionMetal);
Routes.get('/api/master-data-setup/material-composition-metal/drop-down-list', authService.authenticate, Controller.getMaterialCompositionMetalDropDownnList);

// CountryIsoTwo
Routes.post('/api/master-data-setup/country-iso-two/add', authService.authenticate, Controller.addCountryIsoTwo);
Routes.post('/api/master-data-setup/country-iso-two/update', authService.authenticate, Controller.updateCountryIsoTwo);
Routes.get('/api/master-data-setup/country-iso-two/list/search', authService.authenticate, Controller.getCountryIsoTwoListSearch);
Routes.post('/api/master-data-setup/country-iso-two/bulk/add', authService.authenticate, Controller.CountryIsoTwoDataSetup);
Routes.post('/api/master-data-setup/country-iso-two/delete', authService.authenticate, Controller.deleteCountryIsoTwo);
Routes.get('/api/master-data-setup/country-iso-two/drop-down-list', authService.authenticate, Controller.getCountryIsoTwoDropDownnList);

// CountryIsoThree
Routes.post('/api/master-data-setup/country-iso-three/add', authService.authenticate, Controller.addCountryIsoThree);
Routes.post('/api/master-data-setup/country-iso-three/update', authService.authenticate, Controller.updateCountryIsoThree);
Routes.get('/api/master-data-setup/country-iso-three/list/search', authService.authenticate, Controller.getCountryIsoThreeListSearch);
Routes.post('/api/master-data-setup/country-iso-three/bulk/add', authService.authenticate, Controller.CountryIsoThreeDataSetup);
Routes.post('/api/master-data-setup/country-iso-three/delete', authService.authenticate, Controller.deleteCountryIsoThree);
Routes.get('/api/master-data-setup/country-iso-three/drop-down-list', authService.authenticate, Controller.getCountryIsoThreeDropDownnList);

// ScopeTwoMethod
Routes.post('/api/master-data-setup/scope-two-method/add', authService.authenticate, Controller.addScopeTwoMethod);
Routes.post('/api/master-data-setup/scope-two-method/update', authService.authenticate, Controller.updateScopeTwoMethod);
Routes.get('/api/master-data-setup/scope-two-method/list/search', authService.authenticate, Controller.getScopeTwoMethodListSearch);
Routes.post('/api/master-data-setup/scope-two-method/bulk/add', authService.authenticate, Controller.ScopeTwoMethodDataSetup);
Routes.post('/api/master-data-setup/scope-two-method/delete', authService.authenticate, Controller.deleteScopeTwoMethod);
Routes.get('/api/master-data-setup/scope-two-method/drop-down-list', authService.authenticate, Controller.getScopeTwoMethodDropDownList);

// Method Type
Routes.post('/api/master-data-setup/method-type/add', authService.authenticate, Controller.addMethodType);
Routes.post('/api/master-data-setup/method-type/update', authService.authenticate, Controller.updateMethodType);
Routes.get('/api/master-data-setup/method-type/list/search', authService.authenticate, Controller.getMethodTypeListSearch);
Routes.post('/api/master-data-setup/method-type/bulk/add', authService.authenticate, Controller.MethodTypeDataSetup);
Routes.post('/api/master-data-setup/method-type/delete', authService.authenticate, Controller.deleteMethodType);
Routes.get('/api/master-data-setup/method-type/drop-down-list', authService.authenticate, Controller.getMethodTypeDropDownList);

// Transport Modes
Routes.post('/api/master-data-setup/transport-modes/add', authService.authenticate, Controller.addTransportMode);
Routes.post('/api/master-data-setup/transport-modes/update', authService.authenticate, Controller.updateTransportMode);
Routes.get('/api/master-data-setup/transport-modes/list/search', authService.authenticate, Controller.getTransportModeListSearch);
Routes.post('/api/master-data-setup/transport-modes/bulk/add', authService.authenticate, Controller.TransportModeDataSetup);
Routes.post('/api/master-data-setup/transport-modes/delete', authService.authenticate, Controller.deleteTransportMode);
Routes.get('/api/master-data-setup/transport-modes/drop-down-list', authService.authenticate, Controller.getTransportModeDropDownList);

// Transport Routes
Routes.post('/api/master-data-setup/transport-routes/add', authService.authenticate, Controller.addTransportRoute);
Routes.post('/api/master-data-setup/transport-routes/update', authService.authenticate, Controller.updateTransportRoute);
Routes.get('/api/master-data-setup/transport-routes/list/search', authService.authenticate, Controller.getTransportRouteListSearch);
Routes.post('/api/master-data-setup/transport-routes/bulk/add', authService.authenticate, Controller.TransportRouteDataSetup);
Routes.post('/api/master-data-setup/transport-routes/delete', authService.authenticate, Controller.deleteTransportRoute);
Routes.get('/api/master-data-setup/transport-routes/drop-down-list', authService.authenticate, Controller.getTransportRouteDropDownList);

// Packaging Level
Routes.post('/api/master-data-setup/packaging-level/add', authService.authenticate, Controller.addPackagingLevel);
Routes.post('/api/master-data-setup/packaging-level/update', authService.authenticate, Controller.updatePackagingLevel);
Routes.get('/api/master-data-setup/packaging-level/list/search', authService.authenticate, Controller.getPackagingLevelListSearch);
Routes.post('/api/master-data-setup/packaging-level/bulk/add', authService.authenticate, Controller.PackagingLevelDataSetup);
Routes.post('/api/master-data-setup/packaging-level/delete', authService.authenticate, Controller.deletePackagingLevel);
Routes.get('/api/master-data-setup/packaging-level/drop-down-list', authService.authenticate, Controller.getPackagingLevelDropDownList);

// Waste Treatment
Routes.post('/api/master-data-setup/waste-treatment/add', authService.authenticate, Controller.addWasteTreatment);
Routes.post('/api/master-data-setup/waste-treatment/update', authService.authenticate, Controller.updateWasteTreatment);
Routes.get('/api/master-data-setup/waste-treatment/list/search', authService.authenticate, Controller.getWasteTreatmentListSearch);
Routes.post('/api/master-data-setup/waste-treatment/bulk/add', authService.authenticate, Controller.WasteTreatmentDataSetup);
Routes.post('/api/master-data-setup/waste-treatment/delete', authService.authenticate, Controller.deleteWasteTreatment);
Routes.get('/api/master-data-setup/waste-treatment/drop-down-list', authService.authenticate, Controller.getWasteTreatmentDropDownList);

// Refrigerent Type
Routes.post('/api/master-data-setup/refrigerent-type/add', authService.authenticate, Controller.addRefrigerentType);
Routes.post('/api/master-data-setup/refrigerent-type/update', authService.authenticate, Controller.updateRefrigerentType);
Routes.get('/api/master-data-setup/refrigerent-type/list/search', authService.authenticate, Controller.getRefrigerentTypeListSearch);
Routes.post('/api/master-data-setup/refrigerent-type/bulk/add', authService.authenticate, Controller.RefrigerentTypeDataSetup);
Routes.post('/api/master-data-setup/refrigerent-type/delete', authService.authenticate, Controller.deleteRefrigerentType);
Routes.get('/api/master-data-setup/refrigerent-type/drop-down-list', authService.authenticate, Controller.getRefrigerentTypeDropDownList);

// Liquid Fuel Unit
Routes.post('/api/master-data-setup/liquid-fuel-unit/add', authService.authenticate, Controller.addLiquidFuelUnit);
Routes.post('/api/master-data-setup/liquid-fuel-unit/update', authService.authenticate, Controller.updateLiquidFuelUnit);
Routes.get('/api/master-data-setup/liquid-fuel-unit/list/search', authService.authenticate, Controller.getLiquidFuelUnitListSearch);
Routes.post('/api/master-data-setup/liquid-fuel-unit/bulk/add', authService.authenticate, Controller.LiquidFuelUnitDataSetup);
Routes.post('/api/master-data-setup/liquid-fuel-unit/delete', authService.authenticate, Controller.deleteLiquidFuelUnit);
Routes.get('/api/master-data-setup/liquid-fuel-unit/drop-down-list', authService.authenticate, Controller.getLiquidFuelUnitDropDownList);


export default Routes;