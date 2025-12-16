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

export default Routes;