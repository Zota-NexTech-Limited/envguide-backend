import { withClient } from "../util/database.js";

// 22 columns of the BAFU 2025 emission_factors table, in the exact order the CSV
// must arrive in (column index = position in this array). Header names match the
// actual BAFU 2025 export exactly (verified against Desktop/2.csv on 2026-06-04).
const CSV_HEADERS = [
    "EF_ID",
    "Product",
    "Material",
    "Process",
    "Activity_Type",
    "Category",
    "Sub_Category_1",
    "Sub_Category_2",
    "Sub_Category_3",
    "Sub_Category_4",
    "Country_Code",
    "Country_Name",
    "Region",
    "Geo_Fallback_Chain",
    "Unit",
    "Unit_Kind",
    "Recycled_Content",
    "Factor_Suitability",
    "kgCO2e_per_unit",
    "Reference_Year",
    "Source_DB",
    "Embedding_Text",
] as const;

const DB_COLUMNS = [
    "ef_id",
    "product",
    "material",
    "process",
    "activity_type",
    "category",
    "sub_category_1",
    "sub_category_2",
    "sub_category_3",
    "sub_category_4",
    "country_code",
    "country_name",
    "region",
    "geo_fallback_chain",
    "unit",
    "unit_kind",
    "recycled_content",
    "factor_suitability",
    "kgco2e_per_unit",
    "reference_year",
    "source_db",
    "embedding_text",
];

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

    const efId = cells[0]?.trim();
    if (!efId) errors.push({ row: rowIndex, field: "EF_ID", message: "required" });

    const product = cells[1]?.trim();
    if (!product) errors.push({ row: rowIndex, field: "Product", message: "required" });

    const kgco2eRaw = cells[18]?.trim();
    const kgco2e = parseLocaleNumber(kgco2eRaw);
    if (!Number.isFinite(kgco2e)) {
        errors.push({ row: rowIndex, field: "kgCO2e_per_unit", message: `not a number: "${kgco2eRaw}"` });
    }

    const yearRaw = cells[19]?.trim();
    const year = parseLocaleNumber(yearRaw);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) {
        errors.push({ row: rowIndex, field: "Reference_Year", message: `not a valid year: "${yearRaw}"` });
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
            cells[7]?.trim() || null,
            cells[8]?.trim() || null,
            cells[9]?.trim() || null,
            cells[10]?.trim() || null,
            cells[11]?.trim() || null,
            cells[12]?.trim() || null,
            cells[13]?.trim() || null,
            cells[14]?.trim() || null,
            cells[15]?.trim() || null,
            cells[16]?.trim() || null,
            cells[17]?.trim() || null,
            kgco2e,
            year,
            cells[20]?.trim() || null,
            cells[21]?.trim() || null,
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
            const unitKind = String(req.query.unit_kind || "").trim();
            const unit = String(req.query.unit || "").trim();
            const sourceDb = String(req.query.source_db || "").trim();

            const conditions: string[] = [];
            const params: any[] = [];
            let p = 1;

            if (search) {
                // Global search hits every text column so users can filter on any
                // value they see in the table — material name, process, country,
                // sub-category, unit, source, etc. — without picking a field.
                conditions.push(`(
                    ef_id              ILIKE $${p} OR
                    product            ILIKE $${p} OR
                    material           ILIKE $${p} OR
                    process            ILIKE $${p} OR
                    activity_type      ILIKE $${p} OR
                    category           ILIKE $${p} OR
                    sub_category_1     ILIKE $${p} OR
                    sub_category_2     ILIKE $${p} OR
                    sub_category_3     ILIKE $${p} OR
                    sub_category_4     ILIKE $${p} OR
                    country_code       ILIKE $${p} OR
                    country_name       ILIKE $${p} OR
                    region             ILIKE $${p} OR
                    geo_fallback_chain ILIKE $${p} OR
                    unit               ILIKE $${p} OR
                    unit_kind          ILIKE $${p} OR
                    recycled_content   ILIKE $${p} OR
                    factor_suitability ILIKE $${p} OR
                    source_db          ILIKE $${p} OR
                    embedding_text     ILIKE $${p}
                )`);
                params.push(`%${search}%`);
                p++;
            }
            if (countryCode) { conditions.push(`country_code = $${p++}`); params.push(countryCode); }
            if (unitKind)    { conditions.push(`unit_kind = $${p++}`); params.push(unitKind); }
            if (unit)        { conditions.push(`unit = $${p++}`); params.push(unit); }
            if (sourceDb)    { conditions.push(`source_db = $${p++}`); params.push(sourceDb); }

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
                    COUNT(DISTINCT unit_kind)::int                       AS unit_kind_count,
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
