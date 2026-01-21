import { Router } from 'express';
import * as Controller from '../../controller/ecoinventEmissionFactorDataSetupController';
import * as  authService from '../../middleware/authService'
const Routes = Router();

// Materials Emission Factor
Routes.post('/api/ecoinvent-emission-factor-data-setup/materials-emission-factor/add', authService.authenticate, Controller.addMaterialsEmissionFactor);
Routes.post('/api/ecoinvent-emission-factor-data-setup/materials-emission-factor/update', authService.authenticate, Controller.updateMaterialsEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/materials-emission-factor/list/search', authService.authenticate, Controller.getMaterialsEmissionFactorListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/materials-emission-factor/bulk/add', authService.authenticate, Controller.materialsEmissionFactorDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/materials-emission-factor/delete', authService.authenticate, Controller.deleteMaterialsEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/materials-emission-factor/drop-down-list', Controller.getMaterialsEmissionFactorDropDownnList);

// Electricity Emission Factor
Routes.post('/api/ecoinvent-emission-factor-data-setup/electricity-emission-factor/add', authService.authenticate, Controller.addElectricityEmissionFactor);
Routes.post('/api/ecoinvent-emission-factor-data-setup/electricity-emission-factor/update', authService.authenticate, Controller.updateElectricityEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/electricity-emission-factor/list/search', authService.authenticate, Controller.getElectricityEmissionFactorListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/electricity-emission-factor/bulk/add', authService.authenticate, Controller.electricityEmissionFactorDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/electricity-emission-factor/delete', authService.authenticate, Controller.deleteElectricityEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/electricity-emission-factor/drop-down-list', Controller.getElectricityEmissionFactorDropDownnList);

// fuel Emission Factor
Routes.post('/api/ecoinvent-emission-factor-data-setup/fuel-emission-factor/add', authService.authenticate, Controller.addFuelEmissionFactor);
Routes.post('/api/ecoinvent-emission-factor-data-setup/fuel-emission-factor/update', authService.authenticate, Controller.updateFuelEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/fuel-emission-factor/list/search', authService.authenticate, Controller.getFuelEmissionFactorListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/fuel-emission-factor/bulk/add', authService.authenticate, Controller.fuelEmissionFactorDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/fuel-emission-factor/delete', authService.authenticate, Controller.deleteFuelEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/fuel-emission-factor/drop-down-list', Controller.getFuelEmissionFactorDropDownnList);

// Packaging Treatment Type
Routes.post('/api/ecoinvent-emission-factor-data-setup/packaging-treatment-type/add', authService.authenticate, Controller.addPackingTreatmentType);
Routes.post('/api/ecoinvent-emission-factor-data-setup/packaging-treatment-type/update', authService.authenticate, Controller.updatePackingTreatmentType);
Routes.get('/api/ecoinvent-emission-factor-data-setup/packaging-treatment-type/list/search', authService.authenticate, Controller.getPackingTreatmentTypeListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/packaging-treatment-type/bulk/add', authService.authenticate, Controller.PackingTreatmentTypeDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/packaging-treatment-type/delete', authService.authenticate, Controller.deletePackingTreatmentType);
Routes.get('/api/ecoinvent-emission-factor-data-setup/packaging-treatment-type/drop-down-list', Controller.getPackingTreatmentTypeDropDownList);

// Packaging Emission Factor
Routes.post('/api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/add', authService.authenticate, Controller.addPackagingEmissionFactor);
Routes.post('/api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/update', authService.authenticate, Controller.updatePackagingEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/list/search', authService.authenticate, Controller.getPackagingEmissionFactorListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/bulk/add', authService.authenticate, Controller.packagingEmissionFactorDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/delete', authService.authenticate, Controller.deletePackagingEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/drop-down-list', Controller.getPackagingEmissionFactorDropDownList);

// WasteTreatmentType Emission Factor
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste-treatment-type/add', authService.authenticate, Controller.addWasteTreatmentType);
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste-treatment-type/update', authService.authenticate, Controller.updateWasteTreatmentType);
Routes.get('/api/ecoinvent-emission-factor-data-setup/waste-treatment-type/list/search', authService.authenticate, Controller.getWasteTreatmentTypeListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste-treatment-type/bulk/add', authService.authenticate, Controller.WasteTreatmentTypeDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste-treatment-type/delete', authService.authenticate, Controller.deleteWasteTreatmentType);
Routes.get('/api/ecoinvent-emission-factor-data-setup/waste-treatment-type/drop-down-list', Controller.getWasteTreatmentTypeDropDownList);

// WasteMaterialType Emission Factor
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste-material-type-emission-factor/add', authService.authenticate, Controller.addWasteEmissionFactor);
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste-material-type-emission-factor/update', authService.authenticate, Controller.updateWasteEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/waste-material-type-emission-factor/list/search', authService.authenticate, Controller.getWasteEmissionFactorListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste-material-type-emission-factor/bulk/add', authService.authenticate, Controller.wasteEmissionFactorDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste-material-type-emission-factor/delete', authService.authenticate, Controller.deleteWasteEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/waste-material-type-emission-factor/drop-down-list', Controller.getWasteEmissionFactorDropDownList);

// VehicleType Emission Factor
Routes.post('/api/ecoinvent-emission-factor-data-setup/vehicle-type-emission-factor/add', authService.authenticate, Controller.addVehicleTypeEmissionFactor);
Routes.post('/api/ecoinvent-emission-factor-data-setup/vehicle-type-emission-factor/update', authService.authenticate, Controller.updateVehicleTypeEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/vehicle-type-emission-factor/list/search', authService.authenticate, Controller.getVehicleTypeEmissionFactorListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/vehicle-type-emission-factor/bulk/add', authService.authenticate, Controller.vehicleTypeEmissionFactorDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/vehicle-type-emission-factor/delete', authService.authenticate, Controller.deleteVehicleTypeEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/vehicle-type-emission-factor/drop-down-list', Controller.getVehicleTypeEmissionFactorDropDownnList);




export default Routes;