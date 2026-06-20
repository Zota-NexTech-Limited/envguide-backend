// Production / electricity emission calculator.
//
// The factory's purchased energy (Q6) is allocated to a single component by the
// component's share of total factory production weight, then multiplied by the
// electricity emission factor. The No. of products cancels out algebraically, so
// the result depends only on the four inputs below.
//
//   energy_per_unit    = (component_weight / factory_weight) × factory_energy
//   production_emission = energy_per_unit × electricity_EF
//
// Worked example (manager's sheet):
//   (0.3 / 50000) × 5000 = 0.03 kWh/unit ; 0.03 × 0.9 = 0.027

export interface ProductionEmissionResult {
    component_weight_kg: number;
    factory_weight_kg: number;
    factory_energy_kwh: number;
    electricity_ef: number;
    weight_share: number;            // component_weight / factory_weight
    energy_per_unit_kwh: number;     // weight_share × factory_energy
    production_emission: number;     // energy_per_unit × EF
}

export function calculateProductionEmission(
    componentWeightKg: number,
    factoryWeightKg: number,
    factoryEnergyKwh: number,
    electricityEf: number,
): ProductionEmissionResult {
    const weightShare = factoryWeightKg > 0 ? componentWeightKg / factoryWeightKg : 0;
    const energyPerUnit = weightShare * factoryEnergyKwh;
    const emission = energyPerUnit * electricityEf;
    return {
        component_weight_kg: componentWeightKg,
        factory_weight_kg: factoryWeightKg,
        factory_energy_kwh: factoryEnergyKwh,
        electricity_ef: electricityEf,
        weight_share: Number(weightShare.toFixed(8)),
        energy_per_unit_kwh: Number(energyPerUnit.toFixed(6)),
        production_emission: Number(emission.toFixed(6)),
    };
}
