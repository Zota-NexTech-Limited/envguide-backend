// EF Matching Engine — Layer 1 (filter) + Layer 3 (weighted scoring)
//
// Layer 2 (semantic embedding) is intentionally NOT implemented in v1.
// The supplier UI uses dropdowns sourced from emission_factors itself,
// so exact-match scoring covers ~80% of cases per the team's spec.
// Embedding can be bolted on later as a 20% blend (see friend's writeup).
//
// Per-activity-type weights live in `ef_scoring_config` (seeded for
// material; other activity types added as team confirms).
//
// Output: best EF + score + confidence band + top-N alternatives + audit id.

import { ulid } from "ulid";
import { withClient } from "../util/database.js";

// ============================================================
// Types
// ============================================================

export type ActivityType =
    | "material"
    | "packaging"
    | "transport"
    | "waste"
    | "energy"
    | "fuels"
    | "process_gas";

export type ConfidenceBand = "auto" | "suggest" | "manual";

export interface EfMatchInput {
    activityType: ActivityType;
    material?: string | null;
    process?: string | null;
    country?: string | null;         // ISO-2 code (e.g. "IN", "CN", "DE")
    region?: string | null;          // e.g. "Asia", "Europe"
    unit?: string | null;            // e.g. "kg", "kWh", "tkm"
    unitKind?: string | null;        // e.g. "mass", "energy", "freight"
    year?: number | null;
    recycledContent?: number | null; // %, 0-100
    // Optional free-text — kept for future Layer 2 (semantic) hook.
    description?: string | null;
    // Source attribution for the audit row.
    sourceQuestion: string;          // e.g. "q8_bom"
    sourceRowId?: string | null;     // e.g. id of the supplier's BOM row
    responseId: string;              // supplier_questionnaire_response.id
}

export interface CandidateScore {
    efId: string;
    score: number;
    breakdown: Record<string, number>;
    row: any;
}

export interface EfMatchResult {
    auditId: string;
    confidence: ConfidenceBand;
    score: number;
    winningEfId: string | null;
    winningRow: any | null;
    alternatives: Array<{
        efId: string;
        score: number;
        breakdown: Record<string, number>;
    }>;
}

// ============================================================
// Constants
// ============================================================

// Confidence bands. Per team spec.
const AUTO_THRESHOLD = 90;
const SUGGEST_THRESHOLD = 75;

// Candidate cap after Layer 1 — keeps scoring fast even on bad inputs.
// Geography fallback widens the search if we end up with too few.
const MAX_CANDIDATES = 200;
const MIN_CANDIDATES_BEFORE_FALLBACK = 3;

// Top-N alternatives to retain in the audit trail.
const ALTERNATIVES_KEEP = 5;

// ============================================================
// Public entry point
// ============================================================

export async function findBestEf(input: EfMatchInput): Promise<EfMatchResult> {
    return withClient(async (client: any) => {
        // 1. Load weights/rules for this activity type.
        const cfg = await loadScoringConfig(client, input.activityType);
        if (cfg.length === 0) {
            // No weights configured yet — return a "manual review" outcome
            // rather than guessing. Audit row still written.
            const auditId = await writeAudit(client, input, null, 0, "manual", []);
            return {
                auditId,
                confidence: "manual",
                score: 0,
                winningEfId: null,
                winningRow: null,
                alternatives: [],
            };
        }

        // 2. Layer 1 — filter candidates with geography fallback.
        const candidates = await layer1Filter(client, input);

        if (candidates.length === 0) {
            const auditId = await writeAudit(client, input, null, 0, "manual", []);
            return {
                auditId,
                confidence: "manual",
                score: 0,
                winningEfId: null,
                winningRow: null,
                alternatives: [],
            };
        }

        // 3. Layer 3 — score every surviving candidate.
        const scored = candidates
            .map((row) => scoreRow(row, input, cfg))
            .sort((a, b) => b.score - a.score);

        const winner = scored[0];
        const confidence = bandOf(winner.score);

        // 4. Audit trail (top-N alternatives).
        const alternatives = scored.slice(0, ALTERNATIVES_KEEP).map((c) => ({
            efId: c.efId,
            score: c.score,
            breakdown: c.breakdown,
        }));

        const auditId = await writeAudit(
            client,
            input,
            winner.efId,
            winner.score,
            confidence,
            alternatives
        );

        return {
            auditId,
            confidence,
            score: winner.score,
            winningEfId: winner.efId,
            winningRow: winner.row,
            alternatives,
        };
    });
}

// ============================================================
// Layer 1 — filter
// ============================================================

interface CandidateRow {
    ef_id: string;
    material: string | null;
    process: string | null;
    country_code: string | null;
    region: string | null;
    unit: string | null;
    unit_kind: string | null;
    recycled_content: string | null;
    reference_year: number | null;
    kgco2e_per_unit: string;
    [k: string]: any;
}

async function layer1Filter(client: any, input: EfMatchInput): Promise<CandidateRow[]> {
    // Hard gates first:
    //  - unit family must match if supplier provided one.
    //  - excluded factor_suitability values (e.g. capital goods) are dropped.
    // Then progressive narrowing on material/process/geography.

    const params: any[] = [];
    const where: string[] = [
        // Exclude rows clearly not safe for "use directly" mapping.
        `factor_suitability IS NULL OR factor_suitability ILIKE '%use directly%'`,
    ];

    // Unit family is a hard gate when supplied — can't pull a kg EF when supplier
    // reported kWh.
    if (input.unitKind) {
        params.push(input.unitKind);
        where.push(`unit_kind ILIKE $${params.length}`);
    }

    if (input.material) {
        params.push(input.material);
        where.push(`material ILIKE $${params.length}`);
    }
    if (input.process) {
        params.push(input.process);
        where.push(`process ILIKE $${params.length}`);
    }

    // Geography fallback chain: try strict (country), then loosen.
    const tryGeo = async (geoClause: string | null): Promise<CandidateRow[]> => {
        const localParams = [...params];
        const localWhere = [...where];
        if (geoClause) localWhere.push(geoClause);
        const sql = `
            SELECT *
              FROM emission_factors
             WHERE ${localWhere.join(" AND ")}
             ORDER BY reference_year DESC NULLS LAST
             LIMIT ${MAX_CANDIDATES};
        `;
        const r = await client.query(sql, localParams);
        return r.rows;
    };

    // Build the fallback ladder.
    const country = input.country?.trim();
    const region = input.region?.trim();
    const ladder: Array<{ label: string; clause: string | null }> = [];

    if (country) ladder.push({ label: "country", clause: `country_code ILIKE '${country.replace(/'/g, "''")}'` });
    if (region)  ladder.push({ label: "region", clause: `region ILIKE '${region.replace(/'/g, "''")}'` });
    ladder.push({ label: "GLO", clause: `country_code ILIKE 'GLO' OR region ILIKE 'Global'` });
    ladder.push({ label: "RoW", clause: `country_code ILIKE 'RoW' OR region ILIKE 'Rest of%'` });
    ladder.push({ label: "none", clause: null }); // last resort: no geo filter

    let merged: CandidateRow[] = [];
    const seen = new Set<string>();
    for (const step of ladder) {
        const rows = await tryGeo(step.clause);
        for (const r of rows) {
            if (!seen.has(r.ef_id)) {
                seen.add(r.ef_id);
                merged.push(r);
            }
        }
        if (merged.length >= MIN_CANDIDATES_BEFORE_FALLBACK) break;
    }

    return merged;
}

// ============================================================
// Layer 3 — score
// ============================================================

interface ScoringRule {
    criterion: string;
    weight: number;
    rules: Record<string, number>;
}

async function loadScoringConfig(client: any, activityType: ActivityType): Promise<ScoringRule[]> {
    const r = await client.query(
        `SELECT criterion, weight, scoring_rules_json
           FROM ef_scoring_config
          WHERE activity_type = $1`,
        [activityType]
    );
    return r.rows.map((row: any) => ({
        criterion: row.criterion,
        weight: Number(row.weight),
        rules: row.scoring_rules_json ?? {},
    }));
}

function scoreRow(row: CandidateRow, input: EfMatchInput, cfg: ScoringRule[]): CandidateScore {
    const breakdown: Record<string, number> = {};

    for (const rule of cfg) {
        breakdown[rule.criterion] = scoreCriterion(rule, row, input);
    }

    const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
    return { efId: row.ef_id, score, breakdown, row };
}

function scoreCriterion(rule: ScoringRule, row: CandidateRow, input: EfMatchInput): number {
    const r = rule.rules;
    switch (rule.criterion) {
        case "material":
            return matchMaterial(row, input, r);
        case "process":
            return matchProcess(row, input, r);
        case "geography":
            return matchGeography(row, input, r);
        case "unit":
            return matchUnit(row, input, r);
        case "year":
            return matchYear(row, input, r);
        case "recycled":
            return matchRecycled(row, input, r);
        default:
            // Unknown criterion in config — count 0, log loud.
            console.warn(`[ef-engine] Unknown scoring criterion: ${rule.criterion}`);
            return 0;
    }
}

// ----- Matchers (kept deliberately simple — easy to extend later) -----

function ieq(a: string | null | undefined, b: string | null | undefined): boolean {
    if (!a || !b) return false;
    return a.trim().toLowerCase() === b.trim().toLowerCase();
}

function matchMaterial(row: CandidateRow, input: EfMatchInput, r: Record<string, number>): number {
    if (ieq(row.material, input.material ?? null)) return r["exact"] ?? 0;
    // "same_family" left for a future material-family lookup. For v1 we
    // treat partial overlap heuristically (one contains the other).
    if (row.material && input.material) {
        const a = row.material.toLowerCase();
        const b = input.material.toLowerCase();
        if (a.includes(b) || b.includes(a)) return r["same_family"] ?? 0;
    }
    return r["different"] ?? 0;
}

function matchProcess(row: CandidateRow, input: EfMatchInput, r: Record<string, number>): number {
    if (!input.process) return r["missing"] ?? 0;
    if (ieq(row.process, input.process)) return r["exact"] ?? 0;
    if (row.process) {
        const a = row.process.toLowerCase();
        const b = input.process.toLowerCase();
        if (a.includes(b) || b.includes(a)) return r["related"] ?? 0;
    }
    return r["different"] ?? 0;
}

function matchGeography(row: CandidateRow, input: EfMatchInput, r: Record<string, number>): number {
    if (input.country && ieq(row.country_code, input.country)) return r["same_country"] ?? 0;
    if (input.region && ieq(row.region, input.region)) return r["same_region"] ?? 0;
    if (ieq(row.country_code, "GLO") || ieq(row.region, "Global")) return r["GLO"] ?? 0;
    if (ieq(row.country_code, "RoW")) return r["RoW"] ?? 0;
    return 0;
}

function matchUnit(row: CandidateRow, input: EfMatchInput, r: Record<string, number>): number {
    if (input.unit && ieq(row.unit, input.unit)) return r["exact_unit"] ?? 0;
    if (input.unitKind && ieq(row.unit_kind, input.unitKind)) {
        return r["same_unit_family_convertible"] ?? 0;
    }
    return r["different_family"] ?? 0;
}

function matchYear(row: CandidateRow, input: EfMatchInput, r: Record<string, number>): number {
    if (!input.year || !row.reference_year) return r["older"] ?? 0;
    const diff = Math.abs(input.year - row.reference_year);
    if (diff === 0) return r["exact_year"] ?? 0;
    if (diff <= 1) return r["within_1y"] ?? 0;
    if (diff <= 3) return r["within_3y"] ?? 0;
    return r["older"] ?? 0;
}

function matchRecycled(row: CandidateRow, input: EfMatchInput, r: Record<string, number>): number {
    if (input.recycledContent == null) return 0;
    const rowPct = parseFloat(row.recycled_content ?? "");
    if (!Number.isFinite(rowPct)) return 0;
    const diff = Math.abs(input.recycledContent - rowPct);
    if (diff <= 5) return r["close"] ?? r["within_5"] ?? 0;
    if (diff <= 20) return r["loose"] ?? r["within_20"] ?? 0;
    return 0;
}

// ============================================================
// Confidence band
// ============================================================

function bandOf(score: number): ConfidenceBand {
    if (score >= AUTO_THRESHOLD) return "auto";
    if (score >= SUGGEST_THRESHOLD) return "suggest";
    return "manual";
}

// ============================================================
// Audit
// ============================================================

async function writeAudit(
    client: any,
    input: EfMatchInput,
    winningEfId: string | null,
    winningScore: number,
    confidence: ConfidenceBand,
    alternatives: Array<{ efId: string; score: number; breakdown: Record<string, number> }>
): Promise<string> {
    const id = ulid();
    await client.query(
        `INSERT INTO ef_match_audit (
            id, response_id, source_question, source_row_id, activity_type,
            input_payload_json, winning_ef_id, winning_score, confidence_band,
            alternatives_json
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
            id,
            input.responseId,
            input.sourceQuestion,
            input.sourceRowId ?? null,
            input.activityType,
            JSON.stringify(input),
            winningEfId,
            winningScore,
            confidence,
            JSON.stringify(alternatives),
        ]
    );
    return id;
}
