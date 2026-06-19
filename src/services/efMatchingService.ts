// EF matching service. Boss's fallback chain (in order):
//
//   1. Supplier Region    — BAFU region code matching (RER for European
//                           suppliers, RAS for Asian, RME for Middle East, …)
//   2. Supplier Country   — exact ISO country match (CH, DE, IN, …)
//   3. Nearby Country     — countries sharing a border with the supplier
//   4. Continent          — any country on the supplier's continent
//   5. Global             — GLO pseudo-code
//   6. Europe             — RER pseudo-code (BAFU is European-leaning so this
//                           is a useful last-resort)
//
// The actual match within each step is by `embedding_text` equality. The
// supplier's input is turned into a comma-separated string in the exact same
// format the friend uses when populating the CSV:
//
//   "category, sub_category_1, sub_category_2, country_code, country_name, year, unit"
//
// — all lowercase, comma + space separator, empty fields kept (`, ,`).

import { withClient } from "../util/database.js";
import {
    getCountryInfo,
    countriesOnContinent,
} from "../util/countryLookup.js";

export interface SupplierEfInput {
    category: string;
    sub_category_1?: string | null;
    sub_category_2?: string | null;
    country_code: string;     // supplier's actual country (ISO alpha-2)
    country_name?: string | null;
    year: number;
    unit: string;
}

export interface MatchResult {
    matched: boolean;
    ef_id?: string;
    kgco2e_per_unit?: number | string;
    unit?: string;
    country_code?: string;
    country_name?: string;
    matched_step?: string;     // which fallback step won (for audit trail)
    matched_embedding?: string; // the embedding text that matched
    supplier_embedding: string; // what we built from supplier input
    tried_steps: string[];      // every step we walked (audit)
}

// Format a single embedding text from its component fields. Mirrors the
// friend's CSV population format exactly.
function formatEmbedding(
    category: string,
    sub1: string | null | undefined,
    sub2: string | null | undefined,
    countryCode: string,
    countryName: string | null | undefined,
    year: number,
    unit: string,
): string {
    const parts = [
        (category || "").toLowerCase().trim(),
        (sub1 || "").toLowerCase().trim(),
        (sub2 || "").toLowerCase().trim(),
        (countryCode || "").trim(),                       // keep ISO case (CH not ch)
        (countryName || "").toLowerCase().trim(),
        String(year),
        (unit || "").trim(),
    ];
    return parts.join(", ");
}

// Look up a country's official name from BAFU itself (it has the canonical
// names already). Falls back to the supplied name or the code.
async function resolveCountryName(client: any, code: string, fallback?: string | null): Promise<string> {
    if (fallback && fallback.trim()) return fallback.trim();
    try {
        const r = await client.query(
            `SELECT country_name FROM emission_factors
             WHERE country_code = $1 AND country_name IS NOT NULL AND country_name <> ''
             LIMIT 1`,
            [code],
        );
        return String(r.rows[0]?.country_name || code);
    } catch {
        return code;
    }
}

// Try a single country code: build the embedding text with that country and
// search for an exact match in the DB. Returns the row or null.
async function tryCountry(
    client: any,
    input: SupplierEfInput,
    countryCode: string,
    countryName: string,
): Promise<any | null> {
    const embedding = formatEmbedding(
        input.category,
        input.sub_category_1,
        input.sub_category_2,
        countryCode,
        countryName,
        input.year,
        input.unit,
    );
    const r = await client.query(
        `SELECT ef_id, kgco2e_per_unit, unit, country_code, country_name, embedding_text
         FROM emission_factors
         WHERE embedding_text = $1
         LIMIT 1`,
        [embedding],
    );
    return r.rows[0] ? { ...r.rows[0], _embedding: embedding } : null;
}

export async function matchEmissionFactor(input: SupplierEfInput): Promise<MatchResult> {
    return withClient(async (client: any) => {
        const tried: string[] = [];
        const supplierCountryName = await resolveCountryName(
            client,
            input.country_code,
            input.country_name,
        );
        const supplierEmbedding = formatEmbedding(
            input.category,
            input.sub_category_1,
            input.sub_category_2,
            input.country_code,
            supplierCountryName,
            input.year,
            input.unit,
        );

        const info = getCountryInfo(input.country_code);

        // ---- Step 1: Supplier Region ----------------------------------------
        if (info?.region) {
            tried.push(`region:${info.region}`);
            const regionName = await resolveCountryName(client, info.region);
            const hit = await tryCountry(client, input, info.region, regionName);
            if (hit) {
                return {
                    matched: true,
                    ef_id: hit.ef_id,
                    kgco2e_per_unit: hit.kgco2e_per_unit,
                    unit: hit.unit,
                    country_code: hit.country_code,
                    country_name: hit.country_name,
                    matched_step: `Supplier Region (${info.region})`,
                    matched_embedding: hit.embedding_text,
                    supplier_embedding: supplierEmbedding,
                    tried_steps: tried,
                };
            }
        }

        // ---- Step 2: Supplier Country ---------------------------------------
        tried.push(`country:${input.country_code}`);
        {
            const hit = await tryCountry(client, input, input.country_code, supplierCountryName);
            if (hit) {
                return {
                    matched: true,
                    ef_id: hit.ef_id,
                    kgco2e_per_unit: hit.kgco2e_per_unit,
                    unit: hit.unit,
                    country_code: hit.country_code,
                    country_name: hit.country_name,
                    matched_step: `Supplier Country (${input.country_code})`,
                    matched_embedding: hit.embedding_text,
                    supplier_embedding: supplierEmbedding,
                    tried_steps: tried,
                };
            }
        }

        // ---- Step 3: Nearby Countries ---------------------------------------
        if (info?.nearby?.length) {
            for (const nb of info.nearby) {
                tried.push(`nearby:${nb}`);
                const nbName = await resolveCountryName(client, nb);
                const hit = await tryCountry(client, input, nb, nbName);
                if (hit) {
                    return {
                        matched: true,
                        ef_id: hit.ef_id,
                        kgco2e_per_unit: hit.kgco2e_per_unit,
                        unit: hit.unit,
                        country_code: hit.country_code,
                        country_name: hit.country_name,
                        matched_step: `Nearby Country (${nb})`,
                        matched_embedding: hit.embedding_text,
                        supplier_embedding: supplierEmbedding,
                        tried_steps: tried,
                    };
                }
            }
        }

        // ---- Step 4: Continent ----------------------------------------------
        if (info?.continent && info.continent !== "Global") {
            const continentCountries = countriesOnContinent(info.continent)
                .filter((c) => c !== input.country_code && !info.nearby?.includes(c));
            for (const cc of continentCountries) {
                tried.push(`continent:${cc}`);
                const ccName = await resolveCountryName(client, cc);
                const hit = await tryCountry(client, input, cc, ccName);
                if (hit) {
                    return {
                        matched: true,
                        ef_id: hit.ef_id,
                        kgco2e_per_unit: hit.kgco2e_per_unit,
                        unit: hit.unit,
                        country_code: hit.country_code,
                        country_name: hit.country_name,
                        matched_step: `Continent (${info.continent}, ${cc})`,
                        matched_embedding: hit.embedding_text,
                        supplier_embedding: supplierEmbedding,
                        tried_steps: tried,
                    };
                }
            }
        }

        // ---- Step 5: Global -------------------------------------------------
        tried.push("global:GLO");
        {
            const hit = await tryCountry(client, input, "GLO", "Global");
            if (hit) {
                return {
                    matched: true,
                    ef_id: hit.ef_id,
                    kgco2e_per_unit: hit.kgco2e_per_unit,
                    unit: hit.unit,
                    country_code: hit.country_code,
                    country_name: hit.country_name,
                    matched_step: "Global (GLO)",
                    matched_embedding: hit.embedding_text,
                    supplier_embedding: supplierEmbedding,
                    tried_steps: tried,
                };
            }
        }

        // ---- Step 6: Europe (final fallback) --------------------------------
        tried.push("europe:RER");
        {
            const hit = await tryCountry(client, input, "RER", "Region Europe");
            if (hit) {
                return {
                    matched: true,
                    ef_id: hit.ef_id,
                    kgco2e_per_unit: hit.kgco2e_per_unit,
                    unit: hit.unit,
                    country_code: hit.country_code,
                    country_name: hit.country_name,
                    matched_step: "Europe (RER)",
                    matched_embedding: hit.embedding_text,
                    supplier_embedding: supplierEmbedding,
                    tried_steps: tried,
                };
            }
        }

        // No match anywhere in the chain.
        return {
            matched: false,
            supplier_embedding: supplierEmbedding,
            tried_steps: tried,
        };
    });
}
