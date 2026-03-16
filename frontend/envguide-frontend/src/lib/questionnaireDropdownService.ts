/**
 * Service for Supplier Questionnaire Dropdown APIs
 * Provides dropdown options for various questionnaire fields
 */

import authService from "./authService";
import { getApiBaseUrl } from "./apiBaseUrl";

const API_BASE_URL = getApiBaseUrl();

// Response types
interface ApiResponse<T = any> {
  status: boolean;
  message: string;
  code: number;
  data?: T;
}

// Normalized dropdown item (used by UI)
export interface DropdownItem {
  id: string;
  name: string;
  [key: string]: any;
}

// API response types (different ID field names)
interface FuelTypeApiItem {
  ft_id: string;
  name: string;
  code?: string;
  [key: string]: any;
}

interface SubFuelTypeApiItem {
  sft_id: string;
  name: string;
  ft_id: string;
  fuel_type_name?: string;
  [key: string]: any;
}

interface RefrigerantTypeApiItem {
  rt_id?: string;
  refrigerant_type_id?: string;
  id?: string;
  name: string;
  [key: string]: any;
}

interface EnergySourceApiItem {
  es_id?: string;
  energy_source_id?: string;
  id?: string;
  name: string;
  [key: string]: any;
}

interface EnergyTypeApiItem {
  et_id?: string;
  energy_type_id?: string;
  id?: string;
  name: string;
  es_id?: string;
  [key: string]: any;
}

interface ProcessSpecificEnergyApiItem {
  pse_id?: string;
  id?: string;
  name: string;
  [key: string]: any;
}

interface WasteTypeApiItem {
  wmtef_id?: string;
  wmt_id?: string;
  waste_type_id?: string;
  id?: string;
  name?: string;
  waste_type?: string;
  [key: string]: any;
}

interface WasteTreatmentTypeApiItem {
  wtt_id?: string;
  waste_treatment_type_id?: string;
  id?: string;
  name: string;
  [key: string]: any;
}

interface ProductUnitApiItem {
  pu_id?: string;
  product_unit_id?: string;
  id?: string;
  name: string;
  [key: string]: any;
}

interface TransportModeApiItem {
  tm_id?: string;
  transport_mode_id?: string;
  id?: string;
  name: string;
  [key: string]: any;
}

// Helper function to make authenticated GET requests
async function fetchDropdown<T>(endpoint: string): Promise<T[]> {
  const token = authService.getToken();

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch dropdown: ${response.statusText}`);
  }

  const result: ApiResponse<T[]> = await response.json();

  if (!result.status || !result.data) {
    throw new Error(result.message || "Failed to fetch dropdown data");
  }

  return result.data;
}

// Helper to normalize API items to standard DropdownItem format
function normalizeItems<T extends Record<string, any>>(
  items: T[],
  idField: string
): DropdownItem[] {
  return items.map(item => ({
    ...item,
    id: item[idField] || item.id || '',
    name: item.name || '',
  }));
}

/**
 * Q16 - Fuel Type Dropdown for Stationary Combustion
 * GET /api/master-data-setup/fuel-type/drop-down-list
 * Response: { ft_id, name, code }
 */
export async function getFuelTypeDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<FuelTypeApiItem>("/api/master-data-setup/fuel-type/drop-down-list");
  return normalizeItems(data, 'ft_id');
}

/**
 * Q16 - Sub-Fuel Type Dropdown (depends on Fuel Type selection)
 * GET /api/master-data-setup/sub-fuel-type/drop-down-list-using-ft-id?ft_id={fuelTypeId}
 * Response: { sft_id, name, ft_id, fuel_type_name }
 */
export async function getSubFuelTypeByFuelTypeDropdown(fuelTypeId: string): Promise<DropdownItem[]> {
  const data = await fetchDropdown<SubFuelTypeApiItem>(`/api/master-data-setup/sub-fuel-type/drop-down-list-using-ft-id?ft_id=${fuelTypeId}`);
  return normalizeItems(data, 'sft_id');
}

/**
 * Q17 - All Sub-Fuel Types Dropdown for Mobile Combustion
 * GET /api/master-data-setup/sub-fuel-type/drop-down-list
 * Response: { sft_id, name, ft_id, fuel_type_name }
 */
export async function getSubFuelTypeDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<SubFuelTypeApiItem>("/api/master-data-setup/sub-fuel-type/drop-down-list");
  return normalizeItems(data, 'sft_id');
}

/**
 * Q19 - Refrigerant Type Dropdown
 * GET /api/master-data-setup/refrigerent-type/drop-down-list
 */
export async function getRefrigerantTypeDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<RefrigerantTypeApiItem>("/api/master-data-setup/refrigerent-type/drop-down-list");
  // Try different possible ID field names
  return data.map(item => ({
    ...item,
    id: item.rt_id || item.refrigerant_type_id || item.id || '',
    name: item.name || '',
  }));
}

/**
 * Q22, Q44, Q51 - Energy Source Dropdown
 * GET /api/master-data-setup/energy-source/drop-down-list
 */
export async function getEnergySourceDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<EnergySourceApiItem>("/api/master-data-setup/energy-source/drop-down-list");
  return data.map(item => ({
    ...item,
    id: item.es_id || item.energy_source_id || item.id || '',
    name: item.name || '',
  }));
}

/**
 * Q22, Q44, Q51 - Energy Type Dropdown (depends on Energy Source selection)
 * GET /api/master-data-setup/energy-type/drop-down-list?es_id={energySourceId}
 */
export async function getEnergyTypeBySourceDropdown(energySourceId: string): Promise<DropdownItem[]> {
  const data = await fetchDropdown<EnergyTypeApiItem>(`/api/master-data-setup/energy-type/drop-down-list?es_id=${energySourceId}`);
  return data.map(item => ({
    ...item,
    id: item.et_id || item.energy_type_id || item.id || '',
    name: item.name || '',
  }));
}

/**
 * Q28 - Process Specific Energy Dropdown
 * GET /api/master-data-setup/process-specific-energy/drop-down-list
 */
export async function getProcessSpecificEnergyDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<ProcessSpecificEnergyApiItem>("/api/master-data-setup/process-specific-energy/drop-down-list");
  return data.map(item => ({
    ...item,
    id: item.pse_id || item.id || '',
    name: item.name || '',
  }));
}

/**
 * Q28 - Energy Type Dropdown (all energy types)
 * GET /api/master-data-setup/energy-type/drop-down-list
 */
export async function getEnergyTypeDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<EnergyTypeApiItem>("/api/master-data-setup/energy-type/drop-down-list");
  return data.map(item => ({
    ...item,
    id: item.et_id || item.energy_type_id || item.id || '',
    name: item.name || '',
  }));
}

/**
 * Q40, Q68 - Waste Material Type Dropdown
 * GET /api/ecoinvent-emission-factor-data-setup/waste-material-type-emission-factor/drop-down-list
 */
export async function getWasteTypeDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<WasteTypeApiItem>("/api/ecoinvent-emission-factor-data-setup/waste-material-type-emission-factor/drop-down-list");
  return data.map(item => ({
    ...item,
    id: item.wmtef_id || item.wmt_id || item.waste_type_id || item.id || item.waste_type || '',
    name: item.waste_type || item.name || '',
  }));
}

/**
 * Q40, Q68 - Waste Treatment Type Dropdown
 * GET /api/ecoinvent-emission-factor-data-setup/waste-treatment-type/drop-down-list
 */
export async function getWasteTreatmentTypeDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<WasteTreatmentTypeApiItem>("/api/ecoinvent-emission-factor-data-setup/waste-treatment-type/drop-down-list");
  return data.map(item => ({
    ...item,
    id: item.wtt_id || item.waste_treatment_type_id || item.id || '',
    name: item.name || '',
  }));
}

/**
 * Unit of Measure Dropdown (Product Unit)
 * GET /api/master-data-setup/product-unit/drop-down-list
 */
export async function getProductUnitDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<ProductUnitApiItem>("/api/master-data-setup/product-unit/drop-down-list");
  return data.map(item => ({
    ...item,
    id: item.pu_id || item.product_unit_id || item.id || '',
    name: item.name || '',
  }));
}

/**
 * Transport Mode Dropdown
 * GET /api/master-data-setup/vehicle-type/drop-down-list
 */
export async function getTransportModeDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<TransportModeApiItem>("/api/master-data-setup/vehicle-type/drop-down-list");
  return data.map(item => ({
    ...item,
    id: item.tm_id || item.transport_mode_id || item.id || '',
    name: item.name || '',
  }));
}

// Generic unit API item interface
interface UnitApiItem {
  id?: string;
  name: string;
  [key: string]: any;
}

/**
 * Q16, Q17 - Liquid/Gaseous/Solid/Water Unit Dropdown
 * GET /api/master-data-setup/liquid-gaseous-solid-water-unit/drop-down-list
 */
export async function getLiquidGaseousSolidWaterUnitDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<UnitApiItem>("/api/master-data-setup/liquid-gaseous-solid-water-unit/drop-down-list");
  return normalizeItems(data, 'id');
}

/**
 * Q19, Q35 - Liquid/Gaseous/Solid Unit Dropdown
 * GET /api/master-data-setup/liquid-gaseous-solid-unit/drop-down-list
 */
export async function getLiquidGaseousSolidUnitDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<UnitApiItem>("/api/master-data-setup/liquid-gaseous-solid-unit/drop-down-list");
  return normalizeItems(data, 'id');
}

/**
 * Q21 - Gaseous Fuel Unit Dropdown
 * GET /api/master-data-setup/gaseous-fuel-unit/drop-down-list
 */
export async function getGaseousFuelUnitDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<UnitApiItem>("/api/master-data-setup/gaseous-fuel-unit/drop-down-list");
  return normalizeItems(data, 'gfu_id');
}

/**
 * Q22, Q27, Q28, Q30, Q33, Q44, Q47, Q51, Q67 - Energy Unit Dropdown
 * GET /api/master-data-setup/energy-unit/drop-down-list
 * Response: { eu_id, code, name }
 */
export async function getEnergyUnitDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<UnitApiItem>("/api/master-data-setup/energy-unit/drop-down-list");
  return normalizeItems(data, 'eu_id');
}

/**
 * Q32, Q48 - QC Equipment Unit Dropdown
 * GET /api/master-data-setup/qc-equipment/drop-down-list
 * Response: { qcqu_id, code, name }
 */
export async function getQcEquipmentUnitDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<UnitApiItem>("/api/master-data-setup/qc-equipment/drop-down-list");
  return normalizeItems(data, 'qcqu_id');
}

/**
 * Q34 - Liquid/Gaseous Unit Dropdown
 * GET /api/master-data-setup/liquid-gaseous-unit/drop-down-list
 */
export async function getLiquidGaseousUnitDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<UnitApiItem>("/api/master-data-setup/liquid-gaseous-unit/drop-down-list");
  return normalizeItems(data, 'id');
}

/**
 * Q37, Q61, Q68 - Solid Fuel Unit Dropdown
 * GET /api/master-data-setup/solid-fuel-unit/drop-down-list
 * Response: { sfu_id, code, name }
 */
export async function getSolidFuelUnitDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<UnitApiItem>("/api/master-data-setup/solid-fuel-unit/drop-down-list");
  return normalizeItems(data, 'sfu_id');
}

/**
 * Q40 - Liquid/Solid Unit Dropdown
 * GET /api/master-data-setup/liquid-solid-unit/drop-down-list
 */
export async function getLiquidSolidUnitDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<UnitApiItem>("/api/master-data-setup/liquid-solid-unit/drop-down-list");
  return normalizeItems(data, 'id');
}

/**
 * Q60, Q62 - Packing Unit Dropdown
 * GET /api/master-data-setup/packing-unit/drop-down-list
 * Response: { pau_id, code, name }
 */
export async function getPackingUnitDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<UnitApiItem>("/api/master-data-setup/packing-unit/drop-down-list");
  return normalizeItems(data, 'pau_id');
}

/**
 * Q52 - Material/Material Type Dropdown
 * GET /api/ecoinvent-emission-factor-data-setup/materials-emission-factor/material-materialtype-drop-down-list
 * Response: { mcm_id, combined_name }
 */
export async function getMaterialTypeDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<UnitApiItem>("/api/ecoinvent-emission-factor-data-setup/materials-emission-factor/material-materialtype-drop-down-list");
  // This API uses combined_name instead of name
  return data.map(item => ({
    ...item,
    id: item.mcm_id || item.id || '',
    name: item.combined_name || item.name || '',
  }));
}

/**
 * Q60 - Packing Type Dropdown
 * GET /api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/drop-down-list-only-packing-type
 * Response: { pef_id, code, material_type, ptt_id }
 */
export async function getPackingTypeDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<UnitApiItem>("/api/ecoinvent-emission-factor-data-setup/packaging-emission-factor/drop-down-list-only-packing-type");
  // This API uses material_type instead of name
  return data.map(item => ({
    ...item,
    id: item.pef_id || item.id || '',
    name: item.material_type || item.name || '',
  }));
}

/**
 * Q60 - Packaging Treatment Type Dropdown
 * GET /api/ecoinvent-emission-factor-data-setup/packaging-treatment-type/drop-down-list
 * Response: { ptt_id, code, name }
 */
export async function getPackagingTreatmentTypeDropdown(): Promise<DropdownItem[]> {
  const data = await fetchDropdown<UnitApiItem>("/api/ecoinvent-emission-factor-data-setup/packaging-treatment-type/drop-down-list");
  return normalizeItems(data, 'ptt_id');
}

// Export all functions as a service object
const questionnaireDropdownService = {
  getFuelTypeDropdown,
  getSubFuelTypeByFuelTypeDropdown,
  getSubFuelTypeDropdown,
  getRefrigerantTypeDropdown,
  getEnergySourceDropdown,
  getEnergyTypeBySourceDropdown,
  getProcessSpecificEnergyDropdown,
  getEnergyTypeDropdown,
  getWasteTypeDropdown,
  getWasteTreatmentTypeDropdown,
  getProductUnitDropdown,
  getTransportModeDropdown,
  // UOM dropdowns
  getLiquidGaseousSolidWaterUnitDropdown,
  getLiquidGaseousSolidUnitDropdown,
  getGaseousFuelUnitDropdown,
  getEnergyUnitDropdown,
  getQcEquipmentUnitDropdown,
  getLiquidGaseousUnitDropdown,
  getSolidFuelUnitDropdown,
  getLiquidSolidUnitDropdown,
  getPackingUnitDropdown,
  // Q52 and Q60 specific dropdowns
  getMaterialTypeDropdown,
  getPackingTypeDropdown,
  getPackagingTreatmentTypeDropdown,
};

export default questionnaireDropdownService;
