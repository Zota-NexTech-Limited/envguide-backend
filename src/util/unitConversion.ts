/**
 * Unit Conversion Utility
 * Converts quantities from various units to base units using unit_conversion table
 */

/**
 * Normalizes unit symbols to match unit_conversion table format
 * Handles variations like "Kilograms (kg)" -> "kg", "Tonnes" -> "tonne"
 */
function normalizeUnitSymbol(unitSymbol: string, category: "energy" | "fuel" | "material"): string {
    if (!unitSymbol) return unitSymbol;
    
    const normalized = unitSymbol.trim();
    
           // Material unit normalizations
           if (category === "material") {
               // Handle "Kg" (capital K) -> "kg" (lowercase)
               if (normalized === "Kg") {
                   return "kg";
               }
               // Handle "Kilograms (kg)" or "Kilogram (kg)" -> "kg"
               if (normalized.toLowerCase().includes("kilogram")) {
                   const kgMatch = normalized.match(/\(kg\)/i);
                   if (kgMatch) return "kg";
                   // If just "Kilogram" or "Kilograms", return "kg"
                   if (normalized.toLowerCase() === "kilogram" || normalized.toLowerCase() === "kilograms") {
                       return "kg";
                   }
               }
               // Handle "Tonnes" -> "tonne"
               if (normalized.toLowerCase() === "tonnes" || normalized.toLowerCase() === "tonne") {
                   return "tonne";
               }
               // Handle "Grams" or "Gram" -> "g"
               if (normalized.toLowerCase() === "grams" || normalized.toLowerCase() === "gram") {
                   return "g";
               }
               // Handle "Metric Tonne" -> "tonne"
               if (normalized.toLowerCase().includes("metric tonne")) {
                   return "tonne";
               }
           }
    
    // Energy unit normalizations
    if (category === "energy") {
        // Handle variations like "MWh" should already match, but handle case
        const upper = normalized.toUpperCase();
        if (upper === "MWH") return "MWh";
        if (upper === "KWH") return "kWh";
        if (upper === "GWH") return "GWh";
        if (upper === "TWH") return "TWh";
    }
    
    // Return as-is if no normalization needed
    return normalized;
}

/**
 * Converts a quantity from the given unit to the base unit for the category
 * @param client - Database client
 * @param quantity - The quantity to convert (string or number)
 * @param unitSymbol - The unit symbol (e.g., 'kg', 'g', 'tonne', 'MWh', 'kWh', 'L', 'ml')
 * @param category - The unit category: 'energy', 'fuel', or 'material'
 * @returns Promise<number> - The converted quantity in base unit
 */
export async function convertToBaseUnit(
    client: any,
    quantity: string | number,
    unitSymbol: string | null | undefined,
    category: "energy" | "fuel" | "material"
): Promise<number> {
    const quantityNum = typeof quantity === 'string' ? parseFloat(quantity) : quantity;
    
    // If no unit provided or quantity is invalid, return original
    if (!unitSymbol || isNaN(quantityNum)) {
        return quantityNum || 0;
    }

    try {
        // Normalize the unit symbol to match unit_conversion table format
        const normalizedUnit = normalizeUnitSymbol(unitSymbol, category);
        
        // Query unit_conversion table for conversion factor
        const unitConversionQuery = `
            SELECT conversion_factor_to_base 
            FROM unit_conversion 
            WHERE unit_symbol = $1 AND unit_category = $2;
        `;
        
        const unitConversionResult = await client.query(unitConversionQuery, [normalizedUnit, category]);
        
        if (unitConversionResult.rows[0] && unitConversionResult.rows[0].conversion_factor_to_base) {
            const conversionFactor = parseFloat(unitConversionResult.rows[0].conversion_factor_to_base);
            return quantityNum * conversionFactor;
        }
        
        // If no conversion found, return original quantity
        console.warn(`No conversion factor found for unit: ${unitSymbol}, category: ${category}`);
        return quantityNum;
    } catch (error: any) {
        console.error(`Error converting unit ${unitSymbol} for category ${category}:`, error);
        return quantityNum;
    }
}

/**
 * Returns the base unit name for a category
 * @param category - The unit category
 * @returns The base unit name
 */
export function getBaseUnit(category: "energy" | "fuel" | "material"): string {
    const baseUnits = {
        energy: "kWh",
        fuel: "Liters",
        material: "kg"
    };
    return baseUnits[category];
}

/**
 * Returns the emission factor unit format for a category
 * @param category - The unit category
 * @returns The emission factor unit format
 */
export function getEmissionFactorUnit(category: "energy" | "fuel" | "material"): string {
    const emissionFactorUnits = {
        energy: "KgCo2e/per kWh",
        fuel: "KgCo2e/per Liters",
        material: "KgCo2e/per kg"
    };
    return emissionFactorUnits[category];
}




