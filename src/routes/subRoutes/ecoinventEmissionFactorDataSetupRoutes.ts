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
Routes.get('/api/ecoinvent-emission-factor-data-setup/materials-emission-factor/drop-down-list', authService.authenticate, Controller.getMaterialsEmissionFactorDropDownnList);


// Electricity Emission Factor
Routes.post('/api/ecoinvent-emission-factor-data-setup/electricity-emission-factor/add', authService.authenticate, Controller.addElectricityEmissionFactor);
Routes.post('/api/ecoinvent-emission-factor-data-setup/electricity-emission-factor/update', authService.authenticate, Controller.updateElectricityEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/electricity-emission-factor/list/search', authService.authenticate, Controller.getElectricityEmissionFactorListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/electricity-emission-factor/bulk/add', authService.authenticate, Controller.electricityEmissionFactorDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/electricity-emission-factor/delete', authService.authenticate, Controller.deleteElectricityEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/electricity-emission-factor/drop-down-list', authService.authenticate, Controller.getElectricityEmissionFactorDropDownnList);



// fuel Emission Factor
Routes.post('/api/ecoinvent-emission-factor-data-setup/fuel-emission-factor/add', authService.authenticate, Controller.addFuelEmissionFactor);
Routes.post('/api/ecoinvent-emission-factor-data-setup/fuel-emission-factor/update', authService.authenticate, Controller.updateFuelEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/fuel-emission-factor/list/search', authService.authenticate, Controller.getFuelEmissionFactorListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/fuel-emission-factor/bulk/add', authService.authenticate, Controller.fuelEmissionFactorDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/fuel-emission-factor/delete', authService.authenticate, Controller.deleteFuelEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/fuel-emission-factor/drop-down-list', authService.authenticate, Controller.getFuelEmissionFactorDropDownnList);



// Packaging Emission Factor
Routes.post('/api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/add', authService.authenticate, Controller.addPackagingEmissionFactor);
Routes.post('/api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/update', authService.authenticate, Controller.updatePackagingEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/list/search', authService.authenticate, Controller.getPackagingEmissionFactorListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/bulk/add', authService.authenticate, Controller.packagingEmissionFactorDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/delete', authService.authenticate, Controller.deletePackagingEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/drop-down-list', authService.authenticate, Controller.getPackagingEmissionFactorDropDownnList);



// WasteTreatmentType Emission Factor
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste_treatment_type-emission-factor/add', authService.authenticate, Controller.addWasteTreatmentTypeEmissionFactor);
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste_treatment_type-emission-factor/update', authService.authenticate, Controller.updateWasteTreatmentTypeEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/waste_treatment_type-emission-factor/list/search', authService.authenticate, Controller.getWasteTreatmentTypeEmissionFactorListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste_treatment_type-emission-factor/bulk/add', authService.authenticate, Controller.wasteTreatmentTypeEmissionFactorDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste_treatment_type-emission-factor/delete', authService.authenticate, Controller.deleteWasteTreatmentTypeEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/waste_treatment_type-emission-factor/drop-down-list', authService.authenticate, Controller.getWasteTreatmentTypeEmissionFactorDropDownnList);




// WasteMaterialType Emission Factor
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste_material_type-emission-factor/add', authService.authenticate, Controller.addWasteMaterialTypeEmissionFactor);
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste_material_type-emission-factor/update', authService.authenticate, Controller.updateWasteMaterialTypeEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/waste_material_type-emission-factor/list/search', authService.authenticate, Controller.getWasteMaterialTypeEmissionFactorListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste_material_type-emission-factor/bulk/add', authService.authenticate, Controller.wasteMaterialTypeEmissionFactorDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/waste_material_type-emission-factor/delete', authService.authenticate, Controller.deleteWasteMaterialTypeEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/waste_material_type-emission-factor/drop-down-list', authService.authenticate, Controller.getWasteMaterialTypeEmissionFactorDropDownnList);




// VehicleType Emission Factor
Routes.post('/api/ecoinvent-emission-factor-data-setup/vehicle_type-emission-factor/add', authService.authenticate, Controller.addVehicleTypeEmissionFactor);
Routes.post('/api/ecoinvent-emission-factor-data-setup/vehicle_type-emission-factor/update', authService.authenticate, Controller.updateVehicleTypeEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/vehicle_type-emission-factor/list/search', authService.authenticate, Controller.getVehicleTypeEmissionFactorListSearch);
Routes.post('/api/ecoinvent-emission-factor-data-setup/vehicle_type-emission-factor/bulk/add', authService.authenticate, Controller.vehicleTypeEmissionFactorDataSetup);
Routes.post('/api/ecoinvent-emission-factor-data-setup/vehicle_type-emission-factor/delete', authService.authenticate, Controller.deleteVehicleTypeEmissionFactor);
Routes.get('/api/ecoinvent-emission-factor-data-setup/vehicle_type-emission-factor/drop-down-list', authService.authenticate, Controller.getVehicleTypeEmissionFactorDropDownnList);




export default Routes;