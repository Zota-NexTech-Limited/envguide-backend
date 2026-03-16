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
Routes.get('/api/master-data-setup/material-composition-metal/drop-down-list', Controller.getMaterialCompositionMetalDropDownnList);

// Material Composition Metal Type
Routes.post('/api/master-data-setup/material-composition-metal-type/add', authService.authenticate, Controller.addMaterialCompositionMetalType);
Routes.post('/api/master-data-setup/material-composition-metal-type/update', authService.authenticate, Controller.updateMaterialCompositionMetalType);
Routes.get('/api/master-data-setup/material-composition-metal-type/list/search', authService.authenticate, Controller.getMaterialCompositionMetalTypeList);
Routes.post('/api/master-data-setup/material-composition-metal-type/bulk/add', authService.authenticate, Controller.MaterialCompositionMetalTypeDataSetup);
Routes.post('/api/master-data-setup/material-composition-metal-type/delete', authService.authenticate, Controller.deleteMaterialCompositionMetalType);
Routes.get('/api/master-data-setup/material-composition-metal-type/list', authService.authenticate, Controller.getMaterialCompositionMetalType);


// CountryIsoTwo
Routes.post('/api/master-data-setup/country-iso-two/add', authService.authenticate, Controller.addCountryIsoTwo);
Routes.post('/api/master-data-setup/country-iso-two/update', authService.authenticate, Controller.updateCountryIsoTwo);
Routes.get('/api/master-data-setup/country-iso-two/list/search', authService.authenticate, Controller.getCountryIsoTwoListSearch);
Routes.post('/api/master-data-setup/country-iso-two/bulk/add', authService.authenticate, Controller.CountryIsoTwoDataSetup);
Routes.post('/api/master-data-setup/country-iso-two/delete', authService.authenticate, Controller.deleteCountryIsoTwo);
Routes.get('/api/master-data-setup/country-iso-two/drop-down-list', Controller.getCountryIsoTwoDropDownnList);

// CountryIsoThree
Routes.post('/api/master-data-setup/country-iso-three/add', authService.authenticate, Controller.addCountryIsoThree);
Routes.post('/api/master-data-setup/country-iso-three/update', authService.authenticate, Controller.updateCountryIsoThree);
Routes.get('/api/master-data-setup/country-iso-three/list/search', authService.authenticate, Controller.getCountryIsoThreeListSearch);
Routes.post('/api/master-data-setup/country-iso-three/bulk/add', authService.authenticate, Controller.CountryIsoThreeDataSetup);
Routes.post('/api/master-data-setup/country-iso-three/delete', authService.authenticate, Controller.deleteCountryIsoThree);
Routes.get('/api/master-data-setup/country-iso-three/drop-down-list', Controller.getCountryIsoThreeDropDownnList);

// ScopeTwoMethod
Routes.post('/api/master-data-setup/scope-two-method/add', authService.authenticate, Controller.addScopeTwoMethod);
Routes.post('/api/master-data-setup/scope-two-method/update', authService.authenticate, Controller.updateScopeTwoMethod);
Routes.get('/api/master-data-setup/scope-two-method/list/search', authService.authenticate, Controller.getScopeTwoMethodListSearch);
Routes.post('/api/master-data-setup/scope-two-method/bulk/add', authService.authenticate, Controller.ScopeTwoMethodDataSetup);
Routes.post('/api/master-data-setup/scope-two-method/delete', authService.authenticate, Controller.deleteScopeTwoMethod);
Routes.get('/api/master-data-setup/scope-two-method/drop-down-list', Controller.getScopeTwoMethodDropDownList);

// Method Type
Routes.post('/api/master-data-setup/method-type/add', authService.authenticate, Controller.addMethodType);
Routes.post('/api/master-data-setup/method-type/update', authService.authenticate, Controller.updateMethodType);
Routes.get('/api/master-data-setup/method-type/list/search', authService.authenticate, Controller.getMethodTypeListSearch);
Routes.post('/api/master-data-setup/method-type/bulk/add', authService.authenticate, Controller.MethodTypeDataSetup);
Routes.post('/api/master-data-setup/method-type/delete', authService.authenticate, Controller.deleteMethodType);
Routes.get('/api/master-data-setup/method-type/drop-down-list', Controller.getMethodTypeDropDownList);

// Transport Modes
Routes.post('/api/master-data-setup/transport-modes/add', authService.authenticate, Controller.addTransportMode);
Routes.post('/api/master-data-setup/transport-modes/update', authService.authenticate, Controller.updateTransportMode);
Routes.get('/api/master-data-setup/transport-modes/list/search', authService.authenticate, Controller.getTransportModeListSearch);
Routes.post('/api/master-data-setup/transport-modes/bulk/add', authService.authenticate, Controller.TransportModeDataSetup);
Routes.post('/api/master-data-setup/transport-modes/delete', authService.authenticate, Controller.deleteTransportMode);
Routes.get('/api/master-data-setup/transport-modes/drop-down-list', Controller.getTransportModeDropDownList);

// Transport Routes
Routes.post('/api/master-data-setup/transport-routes/add', authService.authenticate, Controller.addTransportRoute);
Routes.post('/api/master-data-setup/transport-routes/update', authService.authenticate, Controller.updateTransportRoute);
Routes.get('/api/master-data-setup/transport-routes/list/search', authService.authenticate, Controller.getTransportRouteListSearch);
Routes.post('/api/master-data-setup/transport-routes/bulk/add', authService.authenticate, Controller.TransportRouteDataSetup);
Routes.post('/api/master-data-setup/transport-routes/delete', authService.authenticate, Controller.deleteTransportRoute);
Routes.get('/api/master-data-setup/transport-routes/drop-down-list', Controller.getTransportRouteDropDownList);

// Packaging Level
Routes.post('/api/master-data-setup/packaging-level/add', authService.authenticate, Controller.addPackagingLevel);
Routes.post('/api/master-data-setup/packaging-level/update', authService.authenticate, Controller.updatePackagingLevel);
Routes.get('/api/master-data-setup/packaging-level/list/search', authService.authenticate, Controller.getPackagingLevelListSearch);
Routes.post('/api/master-data-setup/packaging-level/bulk/add', authService.authenticate, Controller.PackagingLevelDataSetup);
Routes.post('/api/master-data-setup/packaging-level/delete', authService.authenticate, Controller.deletePackagingLevel);
Routes.get('/api/master-data-setup/packaging-level/drop-down-list', Controller.getPackagingLevelDropDownList);

// Waste Treatment
Routes.post('/api/master-data-setup/waste-treatment/add', authService.authenticate, Controller.addWasteTreatment);
Routes.post('/api/master-data-setup/waste-treatment/update', authService.authenticate, Controller.updateWasteTreatment);
Routes.get('/api/master-data-setup/waste-treatment/list/search', authService.authenticate, Controller.getWasteTreatmentListSearch);
Routes.post('/api/master-data-setup/waste-treatment/bulk/add', authService.authenticate, Controller.WasteTreatmentDataSetup);
Routes.post('/api/master-data-setup/waste-treatment/delete', authService.authenticate, Controller.deleteWasteTreatment);
Routes.get('/api/master-data-setup/waste-treatment/drop-down-list', Controller.getWasteTreatmentDropDownList);

// Refrigerent Type
Routes.post('/api/master-data-setup/refrigerent-type/add', authService.authenticate, Controller.addRefrigerentType);
Routes.post('/api/master-data-setup/refrigerent-type/update', authService.authenticate, Controller.updateRefrigerentType);
Routes.get('/api/master-data-setup/refrigerent-type/list/search', authService.authenticate, Controller.getRefrigerentTypeListSearch);
Routes.post('/api/master-data-setup/refrigerent-type/bulk/add', authService.authenticate, Controller.RefrigerentTypeDataSetup);
Routes.post('/api/master-data-setup/refrigerent-type/delete', authService.authenticate, Controller.deleteRefrigerentType);
Routes.get('/api/master-data-setup/refrigerent-type/drop-down-list', Controller.getRefrigerentTypeDropDownList);

// Liquid Fuel Unit
Routes.post('/api/master-data-setup/liquid-fuel-unit/add', authService.authenticate, Controller.addLiquidFuelUnit);
Routes.post('/api/master-data-setup/liquid-fuel-unit/update', authService.authenticate, Controller.updateLiquidFuelUnit);
Routes.get('/api/master-data-setup/liquid-fuel-unit/list/search', authService.authenticate, Controller.getLiquidFuelUnitListSearch);
Routes.post('/api/master-data-setup/liquid-fuel-unit/bulk/add', authService.authenticate, Controller.LiquidFuelUnitDataSetup);
Routes.post('/api/master-data-setup/liquid-fuel-unit/delete', authService.authenticate, Controller.deleteLiquidFuelUnit);
Routes.get('/api/master-data-setup/liquid-fuel-unit/drop-down-list', Controller.getLiquidFuelUnitDropDownList);


// Gaseous Fuel Unit
Routes.post('/api/master-data-setup/gaseous-fuel-unit/add', authService.authenticate, Controller.addGaseousFuelUnit);
Routes.post('/api/master-data-setup/gaseous-fuel-unit/update', authService.authenticate, Controller.updateGaseousFuelUnit);
Routes.get('/api/master-data-setup/gaseous-fuel-unit/list/search', authService.authenticate, Controller.getGaseousFuelUnitListSearch);
Routes.post('/api/master-data-setup/gaseous-fuel-unit/bulk/add', authService.authenticate, Controller.GaseousFuelUnitDataSetup);
Routes.post('/api/master-data-setup/gaseous-fuel-unit/delete', authService.authenticate, Controller.deleteGaseousFuelUnit);
Routes.get('/api/master-data-setup/gaseous-fuel-unit/drop-down-list', Controller.getGaseousFuelUnitDropDownList);

// Solid Fuel Unit
Routes.post('/api/master-data-setup/solid-fuel-unit/add', authService.authenticate, Controller.addSolidFuelUnit);
Routes.post('/api/master-data-setup/solid-fuel-unit/update', authService.authenticate, Controller.updateSolidFuelUnit);
Routes.get('/api/master-data-setup/solid-fuel-unit/list/search', authService.authenticate, Controller.getSolidFuelUnitListSearch);
Routes.post('/api/master-data-setup/solid-fuel-unit/bulk/add', authService.authenticate, Controller.SolidFuelUnitDataSetup);
Routes.post('/api/master-data-setup/solid-fuel-unit/delete', authService.authenticate, Controller.deleteSolidFuelUnit);
Routes.get('/api/master-data-setup/solid-fuel-unit/drop-down-list', Controller.getSolidFuelUnitDropDownList);

// Process Specific Energy
Routes.post('/api/master-data-setup/process-specific-energy/add', authService.authenticate, Controller.addProcessSpecificEnergy);
Routes.post('/api/master-data-setup/process-specific-energy/update', authService.authenticate, Controller.updateProcessSpecificEnergy);
Routes.get('/api/master-data-setup/process-specific-energy/list/search', authService.authenticate, Controller.getProcessSpecificEnergyListSearch);
Routes.post('/api/master-data-setup/process-specific-energy/bulk/add', authService.authenticate, Controller.ProcessSpecificEnergyDataSetup);
Routes.post('/api/master-data-setup/process-specific-energy/delete', authService.authenticate, Controller.deleteProcessSpecificEnergy);
Routes.get('/api/master-data-setup/process-specific-energy/drop-down-list', Controller.getProcessSpecificEnergyDropDownList);

// FuelType
Routes.post('/api/master-data-setup/fuel-type/add', authService.authenticate, Controller.addFuelType);
Routes.post('/api/master-data-setup/fuel-type/update', authService.authenticate, Controller.updateFuelType);
Routes.get('/api/master-data-setup/fuel-type/list/search', authService.authenticate, Controller.getFuelTypeListSearch);
Routes.post('/api/master-data-setup/fuel-type/bulk/add', authService.authenticate, Controller.FuelTypeDataSetup);
Routes.post('/api/master-data-setup/fuel-type/delete', authService.authenticate, Controller.deleteFuelType);
Routes.get('/api/master-data-setup/fuel-type/drop-down-list', Controller.getFuelTypeDropDownList);

// SubFuelType
Routes.post('/api/master-data-setup/sub-fuel-type/add', authService.authenticate, Controller.addSubFuelType);
Routes.post('/api/master-data-setup/sub-fuel-type/update', authService.authenticate, Controller.updateSubFuelType);
Routes.get('/api/master-data-setup/sub-fuel-type/list/search', authService.authenticate, Controller.getSubFuelTypeListSearch);
Routes.post('/api/master-data-setup/sub-fuel-type/bulk/add', authService.authenticate, Controller.SubFuelTypeDataSetup);
Routes.post('/api/master-data-setup/sub-fuel-type/delete', authService.authenticate, Controller.deleteSubFuelType);
Routes.get('/api/master-data-setup/sub-fuel-type/drop-down-list', Controller.getSubFuelTypeDropDownList);
Routes.get('/api/master-data-setup/sub-fuel-type/drop-down-list-using-ft-id', Controller.getSubFuelTypeDropDownListUsingId);

// VehicleType
Routes.post('/api/master-data-setup/vehicle-type/add', authService.authenticate, Controller.addVehicleType);
Routes.post('/api/master-data-setup/vehicle-type/update', authService.authenticate, Controller.updateVehicleType);
Routes.get('/api/master-data-setup/vehicle-type/list/search', authService.authenticate, Controller.getVehicleTypeListSearch);
Routes.post('/api/master-data-setup/vehicle-type/bulk/add', authService.authenticate, Controller.VehicleTypeDataSetup);
Routes.post('/api/master-data-setup/vehicle-type/delete', authService.authenticate, Controller.deleteVehicleType);
Routes.get('/api/master-data-setup/vehicle-type/drop-down-list', Controller.getVehicleTypeDropDownList);

// EnergySource
Routes.post('/api/master-data-setup/energy-source/add', authService.authenticate, Controller.addEnergySource);
Routes.post('/api/master-data-setup/energy-source/update', authService.authenticate, Controller.updateEnergySource);
Routes.get('/api/master-data-setup/energy-source/list/search', authService.authenticate, Controller.getEnergySourceListSearch);
Routes.post('/api/master-data-setup/energy-source/bulk/add', authService.authenticate, Controller.EnergySourceDataSetup);
Routes.post('/api/master-data-setup/energy-source/delete', authService.authenticate, Controller.deleteEnergySource);
Routes.get('/api/master-data-setup/energy-source/drop-down-list', Controller.getEnergySourceDropDownList);

// EnergyType
Routes.post('/api/master-data-setup/energy-type/add', authService.authenticate, Controller.addEnergyType);
Routes.post('/api/master-data-setup/energy-type/update', authService.authenticate, Controller.updateEnergyType);
Routes.get('/api/master-data-setup/energy-type/list/search', authService.authenticate, Controller.getEnergyTypeListSearch);
Routes.post('/api/master-data-setup/energy-type/bulk/add', authService.authenticate, Controller.EnergyTypeDataSetup);
Routes.post('/api/master-data-setup/energy-type/delete', authService.authenticate, Controller.deleteEnergyType);
Routes.get('/api/master-data-setup/energy-type/drop-down-list', Controller.getEnergyTypeDropDownList);

// EnergyUnit
Routes.post('/api/master-data-setup/energy-unit/add', authService.authenticate, Controller.addEnergyUnit);
Routes.post('/api/master-data-setup/energy-unit/update', authService.authenticate, Controller.updateEnergyUnit);
Routes.get('/api/master-data-setup/energy-unit/list/search', authService.authenticate, Controller.getEnergyUnitListSearch);
Routes.post('/api/master-data-setup/energy-unit/bulk/add', authService.authenticate, Controller.EnergyUnitDataSetup);
Routes.post('/api/master-data-setup/energy-unit/delete', authService.authenticate, Controller.deleteEnergyUnit);
Routes.get('/api/master-data-setup/energy-unit/drop-down-list', Controller.getEnergyUnitDropDownList);

// EFUnit
Routes.post('/api/master-data-setup/ef-unit/add', authService.authenticate, Controller.addEFUnit);
Routes.post('/api/master-data-setup/ef-unit/update', authService.authenticate, Controller.updateEFUnit);
Routes.get('/api/master-data-setup/ef-unit/list/search', authService.authenticate, Controller.getEFUnitListSearch);
Routes.post('/api/master-data-setup/ef-unit/bulk/add', authService.authenticate, Controller.EFUnitDataSetup);
Routes.post('/api/master-data-setup/ef-unit/delete', authService.authenticate, Controller.deleteEFUnit);
Routes.get('/api/master-data-setup/ef-unit/drop-down-list', Controller.getEFUnitDropDownList);

// AllocationMethod
Routes.post('/api/master-data-setup/allocation-method/add', authService.authenticate, Controller.addAllocationMethod);
Routes.post('/api/master-data-setup/allocation-method/update', authService.authenticate, Controller.updateAllocationMethod);
Routes.get('/api/master-data-setup/allocation-method/list/search', authService.authenticate, Controller.getAllocationMethodListSearch);
Routes.post('/api/master-data-setup/allocation-method/bulk/add', authService.authenticate, Controller.AllocationMethodDataSetup);
Routes.post('/api/master-data-setup/allocation-method/delete', authService.authenticate, Controller.deleteAllocationMethod);
Routes.get('/api/master-data-setup/allocation-method/drop-down-list', Controller.getAllocationMethodDropDownList);

// CertificateType
Routes.post('/api/master-data-setup/certificate-type/add', authService.authenticate, Controller.addCertificateType);
Routes.post('/api/master-data-setup/certificate-type/update', authService.authenticate, Controller.updateCertificateType);
Routes.get('/api/master-data-setup/certificate-type/list/search', authService.authenticate, Controller.getCertificateTypeListSearch);
Routes.post('/api/master-data-setup/certificate-type/bulk/add', authService.authenticate, Controller.CertificateTypeDataSetup);
Routes.post('/api/master-data-setup/certificate-type/delete', authService.authenticate, Controller.deleteCertificateType);
Routes.get('/api/master-data-setup/certificate-type/drop-down-list', Controller.getCertificateTypeDropDownList);

// verification status
Routes.post('/api/master-data-setup/verification-status/add', authService.authenticate, Controller.addVerificationStatus);
Routes.post('/api/master-data-setup/verification-status/update', authService.authenticate, Controller.updateVerificationStatus);
Routes.get('/api/master-data-setup/verification-status/list/search', authService.authenticate, Controller.getVerificationStatusListSearch);
Routes.post('/api/master-data-setup/verification-status/bulk/add', authService.authenticate, Controller.VerificationStatusDataSetup);
Routes.post('/api/master-data-setup/verification-status/delete', authService.authenticate, Controller.deleteVerificationStatus);
Routes.get('/api/master-data-setup/verification-status/drop-down-list', Controller.getVerificationStatusDropDownList);

// reporting standard
Routes.post('/api/master-data-setup/reporting-standard/add', authService.authenticate, Controller.addReportingStandard);
Routes.post('/api/master-data-setup/reporting-standard/update', authService.authenticate, Controller.updateReportingStandard);
Routes.get('/api/master-data-setup/reporting-standard/list/search', authService.authenticate, Controller.getReportingStandardListSearch);
Routes.post('/api/master-data-setup/reporting-standard/bulk/add', authService.authenticate, Controller.ReportingStandardDataSetup);
Routes.post('/api/master-data-setup/reporting-standard/delete', authService.authenticate, Controller.deleteReportingStandard);
Routes.get('/api/master-data-setup/reporting-standard/drop-down-list', Controller.getReportingStandardDropDownList);

// Life Cycle Boundary
Routes.post('/api/master-data-setup/life-cycle-boundary/add', authService.authenticate, Controller.addLifeCycleBoundary);
Routes.post('/api/master-data-setup/life-cycle-boundary/update', authService.authenticate, Controller.updateLifeCycleBoundary);
Routes.get('/api/master-data-setup/life-cycle-boundary/list/search', authService.authenticate, Controller.getLifeCycleBoundaryListSearch);
Routes.post('/api/master-data-setup/life-cycle-boundary/bulk/add', authService.authenticate, Controller.LifeCycleBoundaryDataSetup);
Routes.post('/api/master-data-setup/life-cycle-boundary/delete', authService.authenticate, Controller.deleteLifeCycleBoundary);
Routes.get('/api/master-data-setup/life-cycle-boundary/drop-down-list', Controller.getLifeCycleBoundaryDropDownList);

// Life Cycle Stages of Product
Routes.post('/api/master-data-setup/life-cycle-stage/add', authService.authenticate, Controller.addLifeCycleStageOfProduct);
Routes.post('/api/master-data-setup/life-cycle-stage/update', authService.authenticate, Controller.updateLifeCycleStageOfProduct);
Routes.get('/api/master-data-setup/life-cycle-stage/list/search', authService.authenticate, Controller.getLifeCycleStageOfProductListSearch);
Routes.post('/api/master-data-setup/life-cycle-stage/bulk/add', authService.authenticate, Controller.LifeCycleStageOfProductDataSetup);
Routes.post('/api/master-data-setup/life-cycle-stage/delete', authService.authenticate, Controller.deleteLifeCycleStageOfProduct);
Routes.get('/api/master-data-setup/life-cycle-stage/drop-down-list', Controller.getLifeCycleStageOfProductDropDownList);

// Time Zone
Routes.post('/api/master-data-setup/time-zone/add', authService.authenticate, Controller.addTimeZone);
Routes.post('/api/master-data-setup/time-zone/update', authService.authenticate, Controller.updateTimeZone);
Routes.get('/api/master-data-setup/time-zone/list/search', authService.authenticate, Controller.getTimeZoneListSearch);
Routes.post('/api/master-data-setup/time-zone/bulk/add', authService.authenticate, Controller.TimeZoneDataSetup);
Routes.post('/api/master-data-setup/time-zone/delete', authService.authenticate, Controller.deleteTimeZone);
Routes.get('/api/master-data-setup/time-zone/drop-down-list', Controller.getTimeZoneDropDownList);

// Product Unit
Routes.post('/api/master-data-setup/product-unit/add', authService.authenticate, Controller.addProductUnit);
Routes.post('/api/master-data-setup/product-unit/update', authService.authenticate, Controller.updateProductUnit);
Routes.get('/api/master-data-setup/product-unit/list/search', authService.authenticate, Controller.getProductUnitListSearch);
Routes.post('/api/master-data-setup/product-unit/bulk/add', authService.authenticate, Controller.ProductUnitDataSetup);
Routes.post('/api/master-data-setup/product-unit/delete', authService.authenticate, Controller.deleteProductUnit);
Routes.get('/api/master-data-setup/product-unit/drop-down-list', Controller.getProductUnitDropDownList);

// Supplier Tier
Routes.post('/api/master-data-setup/supplier-tier/add', authService.authenticate, Controller.addSupplierTier);
Routes.post('/api/master-data-setup/supplier-tier/update', authService.authenticate, Controller.updateSupplierTier);
Routes.get('/api/master-data-setup/supplier-tier/list/search', authService.authenticate, Controller.getSupplierTierListSearch);
Routes.post('/api/master-data-setup/supplier-tier/bulk/add', authService.authenticate, Controller.SupplierTierDataSetup);
Routes.post('/api/master-data-setup/supplier-tier/delete', authService.authenticate, Controller.deleteSupplierTier);
Routes.get('/api/master-data-setup/supplier-tier/drop-down-list', Controller.getSupplierTierDropDownList);

// Credit Method
Routes.post('/api/master-data-setup/credit-method/add', authService.authenticate, Controller.addCreditMethod);
Routes.post('/api/master-data-setup/credit-method/update', authService.authenticate, Controller.updateCreditMethod);
Routes.get('/api/master-data-setup/credit-method/list/search', authService.authenticate, Controller.getCreditMethodListSearch);
Routes.post('/api/master-data-setup/credit-method/bulk/add', authService.authenticate, Controller.CreditMethodDataSetup);
Routes.post('/api/master-data-setup/credit-method/delete', authService.authenticate, Controller.deleteCreditMethod);
Routes.get('/api/master-data-setup/credit-method/drop-down-list', Controller.getCreditMethodDropDownList);

// Water Source
Routes.post('/api/master-data-setup/water-source/add', authService.authenticate, Controller.addWaterSource);
Routes.post('/api/master-data-setup/water-source/update', authService.authenticate, Controller.updateWaterSource);
Routes.get('/api/master-data-setup/water-source/list/search', authService.authenticate, Controller.getWaterSourceListSearch);
Routes.post('/api/master-data-setup/water-source/bulk/add', authService.authenticate, Controller.WaterSourceDataSetup);
Routes.post('/api/master-data-setup/water-source/delete', authService.authenticate, Controller.deleteWaterSource);
Routes.get('/api/master-data-setup/water-source/drop-down-list', Controller.getWaterSourceDropDownList);

// Water Unit
Routes.post('/api/master-data-setup/water-unit/add', authService.authenticate, Controller.addWaterUnit);
Routes.post('/api/master-data-setup/water-unit/update', authService.authenticate, Controller.updateWaterUnit);
Routes.get('/api/master-data-setup/water-unit/list/search', authService.authenticate, Controller.getWaterUnitListSearch);
Routes.post('/api/master-data-setup/water-unit/bulk/add', authService.authenticate, Controller.WaterUnitDataSetup);
Routes.post('/api/master-data-setup/water-unit/delete', authService.authenticate, Controller.deleteWaterUnit);
Routes.get('/api/master-data-setup/water-unit/drop-down-list', Controller.getWaterUnitDropDownList);

// Water Treatment
Routes.post('/api/master-data-setup/water-treatment/add', authService.authenticate, Controller.addWaterTreatment);
Routes.post('/api/master-data-setup/water-treatment/update', authService.authenticate, Controller.updateWaterTreatment);
Routes.get('/api/master-data-setup/water-treatment/list/search', authService.authenticate, Controller.getWaterTreatmentListSearch);
Routes.post('/api/master-data-setup/water-treatment/bulk/add', authService.authenticate, Controller.WaterTreatmentDataSetup);
Routes.post('/api/master-data-setup/water-treatment/delete', authService.authenticate, Controller.deleteWaterTreatment);
Routes.get('/api/master-data-setup/water-treatment/drop-down-list', Controller.getWaterTreatmentDropDownList);

// Discharge Destination
Routes.post('/api/master-data-setup/discharge-destination/add', authService.authenticate, Controller.addDischargeDestination);
Routes.post('/api/master-data-setup/discharge-destination/update', authService.authenticate, Controller.updateDischargeDestination);
Routes.get('/api/master-data-setup/discharge-destination/list/search', authService.authenticate, Controller.getDischargeDestinationListSearch);
Routes.post('/api/master-data-setup/discharge-destination/bulk/add', authService.authenticate, Controller.DischargeDestinationDataSetup);
Routes.post('/api/master-data-setup/discharge-destination/delete', authService.authenticate, Controller.deleteDischargeDestination);
Routes.get('/api/master-data-setup/discharge-destination/drop-down-list', Controller.getDischargeDestinationDropDownList);

// QCEquipmentUnit
Routes.post('/api/master-data-setup/qc-equipment/add', authService.authenticate, Controller.addQCEquipmentUnit);
Routes.post('/api/master-data-setup/qc-equipment/update', authService.authenticate, Controller.updateQCEquipmentUnit);
Routes.get('/api/master-data-setup/qc-equipment/list/search', authService.authenticate, Controller.getQCEquipmentUnitListSearch);
Routes.post('/api/master-data-setup/qc-equipment/bulk/add', authService.authenticate, Controller.QCEquipmentUnitDataSetup);
Routes.post('/api/master-data-setup/qc-equipment/delete', authService.authenticate, Controller.deleteQCEquipmentUnit);
Routes.get('/api/master-data-setup/qc-equipment/drop-down-list', Controller.getQCEquipmentUnitDropDownnList);

// PackgingUnit
Routes.post('/api/master-data-setup/packing-unit/add', authService.authenticate, Controller.addPackgingUnit);
Routes.post('/api/master-data-setup/packing-unit/update', authService.authenticate, Controller.updatePackgingUnit);
Routes.get('/api/master-data-setup/packing-unit/list/search', authService.authenticate, Controller.getPackgingUnitListSearch);
Routes.post('/api/master-data-setup/packing-unit/bulk/add', authService.authenticate, Controller.PackgingUnitDataSetup);
Routes.post('/api/master-data-setup/packing-unit/delete', authService.authenticate, Controller.deletePackgingUnit);
Routes.get('/api/master-data-setup/packing-unit/drop-down-list', Controller.getPackgingUnitDropDownnList);


// UOM DropDowns
Routes.get('/api/master-data-setup/liquid-gaseous-solid-water-unit/drop-down-list', Controller.getLiquidGaseousSolidWaterUnitDropDownList);
Routes.get('/api/master-data-setup/liquid-gaseous-solid-unit/drop-down-list', Controller.getLiquidGaseousSolidUnitDropDownList);
Routes.get('/api/master-data-setup/liquid-gaseous-unit/drop-down-list', Controller.getLiquidGaseousUnitDropDownList);
Routes.get('/api/master-data-setup/liquid-solid-unit/drop-down-list', Controller.getLiquidSolidUnitDropDownList);

export default Routes;