import { withClient } from "../util/database.js";
import { matchEmissionFactor, type SupplierEfInput } from "../services/efMatchingService.js";
import { resolveComposition } from "../services/alloyCompositionService.js";

// 11 columns of the BAFU 2025 Version 2 (Reversioned) CSV with EF ID, exact header names.
// ef_id now comes from the CSV (authoritative); source_db is constant.
const CSV_HEADERS = [
    "EF ID",
    "Product",
    "Category",
    "Process",
    "Sub-category 2",
    "Country Code",
    "Country Name",
    "Time Period",
    "Unit",
    "GWP 100 [kg CO2 eq]",
    "Embedded Text Logic",
] as const;

const DB_COLUMNS = [
    "ef_id",
    "product",
    "category",
    "sub_category_1",
    "sub_category_2",
    "country_code",
    "country_name",
    "reference_year",
    "unit",
    "kgco2e_per_unit",
    "source_db",
    "embedding_text",
];

const SOURCE_DB_VALUE = "BAFU:2025";

// Minimal RFC-4180 CSV parser. Handles "quoted, fields" and "" escaped quotes.
function parseCsv(text: string): string[][] {
    const rows: string[][] = [];
    let row: string[] = [];
    let field = "";
    let inQuotes = false;
    let i = 0;

    // Strip BOM if present.
    if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

    while (i < text.length) {
        const c = text[i];
        if (inQuotes) {
            if (c === '"') {
                if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
                inQuotes = false; i++; continue;
            }
            field += c; i++; continue;
        }
        if (c === '"') { inQuotes = true; i++; continue; }
        if (c === ",") { row.push(field); field = ""; i++; continue; }
        if (c === "\r") { i++; continue; }
        if (c === "\n") {
            row.push(field); field = "";
            if (row.length > 1 || row[0] !== "") rows.push(row);
            row = []; i++; continue;
        }
        field += c; i++;
    }
    if (field !== "" || row.length > 0) {
        row.push(field);
        if (row.length > 1 || row[0] !== "") rows.push(row);
    }
    return rows;
}

async function isSuperAdmin(userId: string): Promise<boolean> {
    return withClient(async (client: any) => {
        const r = await client.query(
            `SELECT user_role FROM users_table WHERE user_id = $1`,
            [userId]
        );
        const role = String(r.rows[0]?.user_role || "").toLowerCase();
        return role === "superadmin" || role === "super admin";
    });
}

interface ValidationError { row: number; field: string; message: string; }

// Tolerate Excel/locale number formatting: Indian lakh grouping ("9,95,197.22"),
// US thousands ("995,197.22"), trailing/leading whitespace, etc. Returns NaN
// when the cleaned string is empty or contains non-numeric junk.
function parseLocaleNumber(raw: string | undefined): number {
    if (raw == null) return NaN;
    const cleaned = raw.replace(/[,\s]/g, "");
    if (cleaned === "") return NaN;
    return Number(cleaned);
}

function validateRow(
    cells: string[],
    rowIndex: number
): { errors: ValidationError[]; values: any[] | null } {
    const errors: ValidationError[] = [];

    if (cells.length !== CSV_HEADERS.length) {
        errors.push({
            row: rowIndex,
            field: "(row)",
            message: `expected ${CSV_HEADERS.length} columns, got ${cells.length}`,
        });
        return { errors, values: null };
    }

    // ef_id from CSV (authoritative); fall back to deterministic row-based id if blank.
    const efId = cells[0]?.trim() || `EF_${String(rowIndex - 1).padStart(5, "0")}`;

    const product = cells[1]?.trim();
    if (!product) errors.push({ row: rowIndex, field: "Product", message: "required" });

    const kgco2eRaw = cells[9]?.trim();
    const kgco2e = parseLocaleNumber(kgco2eRaw);
    if (!Number.isFinite(kgco2e)) {
        errors.push({ row: rowIndex, field: "GWP 100 [kg CO2 eq]", message: `not a number: "${kgco2eRaw}"` });
    }

    const yearRaw = cells[7]?.trim();
    const year = parseLocaleNumber(yearRaw);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        errors.push({ row: rowIndex, field: "Time Period", message: `not a valid year: "${yearRaw}"` });
    }

    if (errors.length > 0) return { errors, values: null };

    return {
        errors: [],
        values: [
            efId,
            product,
            cells[2]?.trim() || null,
            cells[3]?.trim() || null,
            cells[4]?.trim() || null,
            cells[5]?.trim() || null,
            cells[6]?.trim() || null,
            year,
            cells[8]?.trim() || null,
            kgco2e,
            SOURCE_DB_VALUE,
            cells[10]?.trim() || null,
        ],
    };
}

export async function importEmissionFactorsCsv(req: any, res: any) {
    try {
        if (!req.user_id) {
            return res.status(401).send({ success: false, message: "not authenticated" });
        }
        if (!(await isSuperAdmin(req.user_id))) {
            return res.status(403).send({ success: false, message: "super admin only" });
        }
        if (!req.file?.buffer) {
            return res.status(400).send({ success: false, message: "no file uploaded (field name must be 'file')" });
        }

        const text = req.file.buffer.toString("utf8");
        const rows = parseCsv(text);
        if (rows.length === 0) {
            return res.status(400).send({ success: false, message: "CSV is empty" });
        }

        const header = rows[0].map((h) => h.trim());
        const mismatches: string[] = [];
        for (let i = 0; i < CSV_HEADERS.length; i++) {
            if (header[i] !== CSV_HEADERS[i]) {
                mismatches.push(`col ${i + 1}: expected "${CSV_HEADERS[i]}", got "${header[i] ?? "(missing)"}"`);
            }
        }
        if (mismatches.length > 0 || header.length !== CSV_HEADERS.length) {
            return res.status(400).send({
                success: false,
                message: "CSV header does not match expected schema",
                expected: CSV_HEADERS,
                received: header,
                mismatches,
            });
        }

        const dataRows = rows.slice(1);
        const allErrors: ValidationError[] = [];
        const allValues: any[][] = [];
        const seenIds = new Set<string>();
        for (let i = 0; i < dataRows.length; i++) {
            const rowNum = i + 2; // CSV row number (1-based, header is row 1)
            const result = validateRow(dataRows[i], rowNum);
            if (result.errors.length > 0) {
                allErrors.push(...result.errors);
            } else if (result.values) {
                const efId = result.values[0] as string;
                if (seenIds.has(efId)) {
                    allErrors.push({ row: rowNum, field: "EF_ID", message: `duplicate ID "${efId}"` });
                } else {
                    seenIds.add(efId);
                    allValues.push(result.values);
                }
            }
            if (allErrors.length >= 200) {
                return res.status(400).send({
                    success: false,
                    message: `Too many errors (${allErrors.length}+). Fix the CSV and try again.`,
                    errorCount: allErrors.length,
                    sampleErrors: allErrors.slice(0, 200),
                });
            }
        }
        if (allErrors.length > 0) {
            return res.status(400).send({
                success: false,
                message: `Found ${allErrors.length} validation error(s). No changes were saved.`,
                errorCount: allErrors.length,
                errors: allErrors,
            });
        }
        if (allValues.length === 0) {
            return res.status(400).send({ success: false, message: "CSV contained no data rows" });
        }

        // Atomic replace: wipe + bulk insert in one transaction.
        const insertedCount = await withClient(async (client: any) => {
            await client.query("BEGIN");
            try {
                await client.query("TRUNCATE TABLE emission_factors");

                const BATCH_SIZE = 500;
                for (let start = 0; start < allValues.length; start += BATCH_SIZE) {
                    const batch = allValues.slice(start, start + BATCH_SIZE);
                    const placeholders: string[] = [];
                    const params: any[] = [];
                    let p = 1;
                    for (const row of batch) {
                        const rowPh = DB_COLUMNS.map(() => `$${p++}`).join(",");
                        placeholders.push(`(${rowPh})`);
                        params.push(...row);
                    }
                    const sql = `
                        INSERT INTO emission_factors (${DB_COLUMNS.join(",")})
                        VALUES ${placeholders.join(",")}
                    `;
                    await client.query(sql, params);
                }
                await client.query("COMMIT");
                return allValues.length;
            } catch (err) {
                await client.query("ROLLBACK");
                throw err;
            }
        });

        return res.status(200).send({
            success: true,
            message: `Imported ${insertedCount} emission factors`,
            insertedCount,
        });
    } catch (err: any) {
        console.error("importEmissionFactorsCsv error:", err);
        return res.status(500).send({ success: false, message: err.message });
    }
}

export async function listEmissionFactors(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 50));
            const offset = (page - 1) * limit;

            const search = String(req.query.search || "").trim();
            const countryCode = String(req.query.country_code || "").trim();
            const unit = String(req.query.unit || "").trim();

            const conditions: string[] = [];
            const params: any[] = [];
            let p = 1;

            if (search) {
                conditions.push(`(
                    ef_id              ILIKE $${p} OR
                    product            ILIKE $${p} OR
                    category           ILIKE $${p} OR
                    sub_category_1     ILIKE $${p} OR
                    sub_category_2     ILIKE $${p} OR
                    country_code       ILIKE $${p} OR
                    country_name       ILIKE $${p} OR
                    unit               ILIKE $${p} OR
                    source_db          ILIKE $${p} OR
                    embedding_text     ILIKE $${p} OR
                    CAST(kgco2e_per_unit AS TEXT) ILIKE $${p} OR
                    CAST(reference_year AS TEXT)  ILIKE $${p}
                )`);
                params.push(`%${search}%`);
                p++;
            }
            if (countryCode) { conditions.push(`country_code = $${p++}`); params.push(countryCode); }
            if (unit)        { conditions.push(`unit = $${p++}`); params.push(unit); }

            const whereSql = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

            const countResult = await client.query(
                `SELECT COUNT(*)::int AS total FROM emission_factors ${whereSql}`,
                params
            );
            const total: number = countResult.rows[0]?.total ?? 0;

            const dataResult = await client.query(
                `SELECT * FROM emission_factors ${whereSql}
                 ORDER BY ef_id
                 LIMIT $${p} OFFSET $${p + 1}`,
                [...params, limit, offset]
            );

            return res.status(200).send({
                success: true,
                data: dataResult.rows,
                pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
            });
        } catch (err: any) {
            console.error("listEmissionFactors error:", err);
            return res.status(500).send({ success: false, message: err.message });
        }
    });
}

export async function getEmissionFactorById(req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const efId = String(req.params.ef_id || "").trim();
            if (!efId) return res.status(400).send({ success: false, message: "ef_id required" });

            const r = await client.query(
                `SELECT * FROM emission_factors WHERE ef_id = $1`,
                [efId]
            );
            if (r.rows.length === 0) {
                return res.status(404).send({ success: false, message: `not found: ${efId}` });
            }
            return res.status(200).send({ success: true, data: r.rows[0] });
        } catch (err: any) {
            console.error("getEmissionFactorById error:", err);
            return res.status(500).send({ success: false, message: err.message });
        }
    });
}

// Run the boss's fallback chain against the supplier's input and return the
// matched EF row plus the full audit trail (every step that was tried).
export async function postMatchEmissionFactor(req: any, res: any) {
    try {
        const body = req.body || {};
        const input: SupplierEfInput = {
            category: String(body.category || "").trim(),
            sub_category_1: body.sub_category_1 ? String(body.sub_category_1).trim() : null,
            sub_category_2: body.sub_category_2 ? String(body.sub_category_2).trim() : null,
            country_code: String(body.country_code || "").trim(),
            country_name: body.country_name ? String(body.country_name).trim() : null,
            year: Number(body.year),
            unit: String(body.unit || "").trim(),
        };
        if (!input.category) return res.status(400).send({ success: false, message: "category required" });
        if (!input.country_code) return res.status(400).send({ success: false, message: "country_code required" });
        if (!Number.isInteger(input.year) || input.year < 1900 || input.year > 2100) {
            return res.status(400).send({ success: false, message: "year required (4-digit integer)" });
        }
        if (!input.unit) return res.status(400).send({ success: false, message: "unit required" });

        const result = await matchEmissionFactor(input);
        return res.status(200).send({ success: true, data: result });
    } catch (err: any) {
        console.error("postMatchEmissionFactor error:", err);
        return res.status(500).send({ success: false, message: err.message });
    }
}

// All distinct (category, sub_category_1, sub_category_2) triples for the
// 3-layer cascading dropdowns in supplier questionnaire Q6-Q10. Returned shape
// matches what DynamicQuestionnaireForm's renderer expects (layer1/2/3).
export async function getEmissionFactorLayerTriples(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const r = await client.query(
                `SELECT DISTINCT category, sub_category_1, sub_category_2
                 FROM emission_factors
                 WHERE category IS NOT NULL AND category <> ''
                 ORDER BY category, sub_category_1 NULLS FIRST, sub_category_2 NULLS FIRST`
            );
            return res.status(200).send({
                success: true,
                data: r.rows.map((row: any, idx: number) => ({
                    id: String(idx),
                    layer1: row.category,
                    layer2: row.sub_category_1,
                    layer3: row.sub_category_2,
                })),
            });
        } catch (err: any) {
            console.error("getEmissionFactorLayerTriples error:", err);
            return res.status(500).send({ success: false, message: err.message });
        }
    });
}

export async function getEmissionFactorCountries(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const r = await client.query(
                `SELECT DISTINCT country_code, country_name
                 FROM emission_factors
                 WHERE country_code IS NOT NULL AND country_code <> ''
                 ORDER BY country_name NULLS LAST, country_code`
            );
            return res.status(200).send({
                success: true,
                data: r.rows.map((row: any) => ({
                    country_code: row.country_code,
                    country_name: row.country_name,
                })),
            });
        } catch (err: any) {
            console.error("getEmissionFactorCountries error:", err);
            return res.status(500).send({ success: false, message: err.message });
        }
    });
}

export async function getEmissionFactorUnits(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const r = await client.query(
                `SELECT DISTINCT unit
                 FROM emission_factors
                 WHERE unit IS NOT NULL AND unit <> ''
                 ORDER BY unit`
            );
            return res.status(200).send({
                success: true,
                data: r.rows.map((row: any) => row.unit),
            });
        } catch (err: any) {
            console.error("getEmissionFactorUnits error:", err);
            return res.status(500).send({ success: false, message: err.message });
        }
    });
}

export async function getEmissionFactorStats(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const r = await client.query(
                `SELECT
                    COUNT(*)::int                                       AS total,
                    COUNT(DISTINCT source_db)::int                       AS source_db_count,
                    COUNT(DISTINCT country_code)::int                    AS country_count,
                    COUNT(DISTINCT unit)::int                            AS unit_count,
                    MAX(updated_date)                                    AS last_updated
                 FROM emission_factors`
            );
            return res.status(200).send({ success: true, data: r.rows[0] });
        } catch (err: any) {
            console.error("getEmissionFactorStats error:", err);
            return res.status(500).send({ success: false, message: err.message });
        }
    });
}

// Resolve a material/alloy description (e.g. "lower housing AlSi10Mg(Fe) alloy")
// into its constituent materials with weight-% ranges + BAFU layer mapping, used
// to auto-populate the supplier's raw-materials question. Cache-first, then the
// free LLM layer. Always 200 with a (possibly empty) rows array so the
// questionnaire degrades gracefully to manual entry when nothing is resolved.
export async function postMaterialComposition(req: any, res: any) {
    try {
        const description = String(req.body?.description || "").trim();
        if (!description) {
            return res.status(400).send({ success: false, message: "description required" });
        }
        const result = await resolveComposition(description);
        return res.status(200).send({ success: true, data: result });
    } catch (err: any) {
        console.error("postMaterialComposition error:", err);
        return res.status(500).send({ success: false, message: err.message });
    }
}

// Preview the raw-material emissions calculation for a component. Used to verify
// against the manager's PCF logic sheet. Body:
//   { component_weight_kg, materials: [{ material, composition_percent }] }
export async function postRawMaterialsPreview(req: any, res: any) {
    try {
        const body = req.body || {};
        const weight = Number(body.component_weight_kg);
        if (!Number.isFinite(weight) || weight <= 0) {
            return res.status(400).send({ success: false, message: "component_weight_kg required (> 0)" });
        }
        const materials = Array.isArray(body.materials) ? body.materials : [];
        if (materials.length === 0) {
            return res.status(400).send({ success: false, message: "materials[] required" });
        }
        const { calculateRawMaterials } = await import("../services/materialEfService.js");
        const result = await calculateRawMaterials(weight, materials);
        return res.status(200).send({ success: true, data: result });
    } catch (err: any) {
        console.error("postRawMaterialsPreview error:", err);
        return res.status(500).send({ success: false, message: err.message });
    }
}

// Preview the production/electricity emission for a component. Body:
//   { component_weight_kg, factory_weight_kg, factory_energy_kwh, electricity_ef }
// electricity_ef defaults to the BAFU electricity factor used in the sheet (0.9).
export async function postProductionPreview(req: any, res: any) {
    try {
        const b = req.body || {};
        const componentWeight = Number(b.component_weight_kg);
        const factoryWeight = Number(b.factory_weight_kg);
        const factoryEnergy = Number(b.factory_energy_kwh);
        const ef = b.electricity_ef != null ? Number(b.electricity_ef) : 0.9;
        if (!Number.isFinite(componentWeight) || componentWeight <= 0) {
            return res.status(400).send({ success: false, message: "component_weight_kg required (> 0)" });
        }
        if (!Number.isFinite(factoryWeight) || factoryWeight <= 0) {
            return res.status(400).send({ success: false, message: "factory_weight_kg required (> 0)" });
        }
        if (!Number.isFinite(factoryEnergy) || factoryEnergy < 0) {
            return res.status(400).send({ success: false, message: "factory_energy_kwh required" });
        }
        const { calculateProductionEmission } = await import("../services/productionEmissionService.js");
        const result = calculateProductionEmission(componentWeight, factoryWeight, factoryEnergy, ef);
        return res.status(200).send({ success: true, data: result });
    } catch (err: any) {
        console.error("postProductionPreview error:", err);
        return res.status(500).send({ success: false, message: err.message });
    }
}

// Preview packaging emission for one packaging type. Body:
//   { packaging_weight_kg, packaging_type }
// emission = packaging_weight × EF (highest EF for the mapped BAFU product).
export async function postPackagingPreview(req: any, res: any) {
    try {
        const b = req.body || {};
        const weight = Number(b.packaging_weight_kg);
        const type = String(b.packaging_type || "").trim();
        if (!Number.isFinite(weight) || weight < 0) {
            return res.status(400).send({ success: false, message: "packaging_weight_kg required" });
        }
        if (!type) {
            return res.status(400).send({ success: false, message: "packaging_type required" });
        }
        const { matchMaterialEf } = await import("../services/materialEfService.js");
        const ef = await matchMaterialEf(type);
        const emission = ef.matched && ef.ef != null ? Number((weight * ef.ef).toFixed(6)) : 0;
        return res.status(200).send({
            success: true,
            data: {
                packaging_type: type,
                packaging_weight_kg: weight,
                matched: ef.matched,
                ef: ef.ef,
                ef_id: ef.ef_id,
                ef_product: ef.product,
                ef_country: ef.country_code,
                packaging_emission: emission,
            },
        });
    } catch (err: any) {
        console.error("postPackagingPreview error:", err);
        return res.status(500).send({ success: false, message: err.message });
    }
}

// Distinct packaging types for the Q8 "Packaging Type" dropdown. Public (the
// supplier questionnaire is unauthenticated). Each type maps to a BAFU product.
export async function getPackagingTypes(_req: any, res: any) {
    return withClient(async (client: any) => {
        try {
            const r = await client.query(
                `SELECT material_key AS id, material_label AS name
                 FROM material_ef_mapping
                 WHERE kind = 'packaging'
                 ORDER BY material_label`
            );
            return res.status(200).send({ success: true, data: r.rows });
        } catch (err: any) {
            console.error("getPackagingTypes error:", err);
            return res.status(500).send({ success: false, message: err.message });
        }
    });
}

// Preview transport emission. Body:
//   { transported_weight, weight_unit, legs: [{ mode, distance_km }] }
export async function postTransportPreview(req: any, res: any) {
    try {
        const b = req.body || {};
        const weight = Number(b.transported_weight);
        const unit = String(b.weight_unit || "kg").trim();
        const legs = Array.isArray(b.legs) ? b.legs : [];
        if (!Number.isFinite(weight) || weight < 0) {
            return res.status(400).send({ success: false, message: "transported_weight required" });
        }
        if (legs.length === 0) {
            return res.status(400).send({ success: false, message: "legs[] required" });
        }
        const { calculateTransport } = await import("../services/transportEmissionService.js");
        const result = await calculateTransport(weight, unit, legs);
        return res.status(200).send({ success: true, data: result });
    } catch (err: any) {
        console.error("postTransportPreview error:", err);
        return res.status(500).send({ success: false, message: err.message });
    }
}

// Preview waste emission. Body:
//   { dominant_material, production_waste_weight_kg, packaging_type, packaging_waste_weight_kg }
export async function postWastePreview(req: any, res: any) {
    try {
        const b = req.body || {};
        const dominantMaterial = String(b.dominant_material || "").trim();
        const packagingType = String(b.packaging_type || "").trim();
        const prodW = Number(b.production_waste_weight_kg);
        const packW = Number(b.packaging_waste_weight_kg);
        if (!Number.isFinite(prodW) || !Number.isFinite(packW)) {
            return res.status(400).send({ success: false, message: "production/packaging waste weights required" });
        }
        const { calculateWaste } = await import("../services/wasteEmissionService.js");
        const result = await calculateWaste(dominantMaterial, prodW, packagingType, packW);
        return res.status(200).send({ success: true, data: result });
    } catch (err: any) {
        console.error("postWastePreview error:", err);
        return res.status(500).send({ success: false, message: err.message });
    }
}

// Run the full PCF calculation (all 5 sections) for a structured payload.
export async function postPcfCalculate(req: any, res: any) {
    try {
        const { calculatePcf } = await import("../services/pcfCalculationService.js");
        const result = await calculatePcf(req.body || {});
        return res.status(200).send({ success: true, data: result });
    } catch (err: any) {
        console.error("postPcfCalculate error:", err);
        return res.status(500).send({ success: false, message: err.message });
    }
}

// Run the full PCF from the raw supplier-questionnaire data object.
export async function postPcfFromQuestionnaire(req: any, res: any) {
    try {
        const { extractPcfInput, calculatePcf } = await import("../services/pcfCalculationService.js");
        const input = extractPcfInput(req.body || {});
        const result = await calculatePcf(input);
        return res.status(200).send({ success: true, data: { input, result } });
    } catch (err: any) {
        console.error("postPcfFromQuestionnaire error:", err);
        return res.status(500).send({ success: false, message: err.message });
    }
}
