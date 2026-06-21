// Material EF resolver — implements the manager's method:
//
//   BOM material description  →  identify the material  →  match a single BAFU
//   `emission_factors.product` row  →  geography fallback  →  ONE emission factor.
//
//   PCF_material = component_weight_kg × EF        (NO element splitting)
//
// Worked example (manager's ChatGPT method):
//   "Cast Aluminium Alloy (AlSi9Cu3 / ADC12)"
//     → product "Aluminium, production mix, cast alloy, at plant"  (EF_00089)
//     → 4.26749 kgCO2e/kg
//
// The match from a free-text description to the right product is done by an LLM
// (exactly how the manager did it in ChatGPT) — but the LLM only ever PICKS from
// real candidate rows we pulled from the DB, so it can never invent an EF value.
// A deterministic heuristic is used as a fallback when no AI key is configured
// or the AI call fails, so calculation never breaks.

import axios from "axios";
import { getCountryInfo } from "../util/countryLookup.js";

// Categories that represent purchased raw materials (cradle-to-gate material
// production). Mirrors the manager's "Raw Material Extraction & Material
// Production" mapping. The resolver only searches within these.
export const RAW_MATERIAL_CATEGORIES = [
    "agricultural", "biomass", "cardboard", "ceramics", "chemicals", "glass",
    "insulation materials", "metals", "minerals", "oil", "paper+ board",
    "plastics", "textiles", "wood",
];

// Category groups for the non-material PCF sections, so each resolves its EF
// from the same BAFU table with the same description→product logic.
export const ENERGY_CATEGORIES = ["electricity", "electricity by fuel", "heat", "heating", "energy supply, kbob recommendation"];
export const TRANSPORT_CATEGORIES = ["transport systems", "pipeline"];
export const WASTE_CATEGORIES = [
    "waste", "waste management", "incineration", "recycling", "landfill",
    "construction waste", "electronics waste", "wastewater treatment",
    "transport waste", "underground deposit", "landfarming", "nuclear waste",
];

// Minimal country-name → ISO map for the few names that appear as supplier
// production locations. Anything already in ISO form (CH, DE, IN, GLO, RER)
// passes through. Returns null when unknown (resolver then keeps the AI/
// heuristic-chosen geography).
const COUNTRY_NAMES: Record<string, string> = {
    switzerland: "CH", germany: "DE", france: "FR", italy: "IT", austria: "AT",
    netherlands: "NL", belgium: "BE", spain: "ES", portugal: "PT",
    "united kingdom": "GB", uk: "GB", ireland: "IE", poland: "PL", sweden: "SE",
    norway: "NO", denmark: "DK", finland: "FI", india: "IN", china: "CN",
    "united states": "US", usa: "US", japan: "JP", global: "GLO", europe: "RER",
};
export function normalizeCountryInput(input: string | null | undefined): string | null {
    const raw = (input || "").trim();
    if (!raw) return null;
    if (/^[A-Z]{2,5}$/.test(raw)) return raw;                      // already an ISO/region code
    return COUNTRY_NAMES[raw.split(",")[0].trim().toLowerCase()] || null;
}

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

export interface MaterialEfResolution {
    matched: boolean;
    ef_id?: string;
    ef_value?: number;
    product?: string;
    country_code?: string;
    unit?: string;
    matched_step?: string;       // how it resolved (ai | heuristic | geo-fallback)
    candidate_count?: number;
    description: string;
}

interface EfCandidate {
    ef_id: string;
    product: string;
    category: string | null;
    sub_category_1: string | null;
    country_code: string | null;
    kgco2e_per_unit: number | string | null;
    unit: string | null;
}

// Pull the significant word tokens from a free-text material description.
// "Cast Aluminium Alloy (AlSi9Cu3 / ADC12)" → ["cast","aluminium","alloy",...]
function tokenize(description: string): string[] {
    return (description || "")
        .toLowerCase()
        .replace(/[^a-z0-9 ]+/g, " ")
        .split(/\s+/)
        .filter((t) => t.length >= 3);
}

// Fetch candidate EF rows whose `product` text contains any token from the
// description, restricted to the given categories. Capped so the LLM prompt
// stays small. Ordered by product-name length ASC so the generic/canonical
// rows (e.g. "Transport, lorry", "Electricity, production mix") are kept and
// over-specific or extreme-EF rows don't crowd out the common ones.
async function fetchCandidates(
    client: any,
    description: string,
    categories: string[],
    units: string[] | null,
): Promise<EfCandidate[]> {
    const tokens = tokenize(description);
    if (!tokens.length) return [];

    const likeClauses: string[] = [];
    const params: any[] = [];
    tokens.forEach((tok) => {
        params.push(`%${tok}%`);
        likeClauses.push(`LOWER(product) LIKE $${params.length}`);
    });
    // Relevance = how many description words the product contains. Ordering by
    // this keeps the most on-topic rows (so long-but-accurate disposal/freight
    // names aren't crowded out), with shorter (more generic) names as tie-break.
    const relevanceExpr = likeClauses
        .map((c) => `(CASE WHEN ${c} THEN 1 ELSE 0 END)`)
        .join(" + ");

    // Category filter as an IN list.
    const catStart = params.length;
    categories.forEach((c) => params.push(c));
    const catPlaceholders = categories
        .map((_, i) => `$${catStart + i + 1}`)
        .join(", ");

    // Optional unit filter — critical so electricity resolves only kWh rows and
    // transport only tonne-km rows, excluding huge-EF infrastructure/construction
    // rows (per km / per m) that would otherwise dominate an EF-sorted list.
    let unitClause = "";
    if (units && units.length) {
        const us = units.map((u) => { params.push(u.toLowerCase()); return `$${params.length}`; });
        unitClause = `AND LOWER(unit) IN (${us.join(", ")})`;
    }

    const sql = `
        SELECT ef_id, product, category, sub_category_1, country_code, kgco2e_per_unit, unit
        FROM emission_factors
        WHERE (${likeClauses.join(" OR ")})
          AND category IN (${catPlaceholders})
          ${unitClause}
        ORDER BY (${relevanceExpr}) DESC, LENGTH(product) ASC
        LIMIT 60;
    `;
    const r = await client.query(sql, params);
    return r.rows as EfCandidate[];
}

// Ask the configured LLM (Gemini → Groq) to choose the single best ef_id for the
// description from the candidate list. Returns the chosen ef_id or null. The
// model is constrained to pick an ef_id that exists in the list.
async function aiPickEfId(description: string, candidates: EfCandidate[]): Promise<string | null> {
    if (!candidates.length) return null;

    const list = candidates
        .map((c) => `${c.ef_id} | ${c.product} | ${c.category}/${c.sub_category_1 ?? ""} | ${c.country_code ?? ""} | ${c.kgco2e_per_unit}`)
        .join("\n");

    const system =
        "You are a materials & LCA emission-factor ontologist. Given a raw-material " +
        "description from a bill of materials and a list of candidate BAFU emission-factor " +
        "rows, choose the SINGLE row whose product best represents the bulk material's " +
        "cradle-to-gate production. Prefer the base material's 'production mix' / alloy / " +
        "'at plant' production row. Avoid coatings, scrap, equipment (e.g. 'cathode'), " +
        "welding, machining, or surface-treatment rows unless the description is explicitly " +
        "about those. Reply with ONLY a compact JSON object: {\"ef_id\":\"EF_xxxxx\"}. " +
        "The ef_id MUST be one of the candidates.";

    const user =
        `Material description: "${description}"\n\n` +
        `Candidate rows (ef_id | product | category/process | country | kgCO2e_per_unit):\n${list}\n\n` +
        `Return the best ef_id as JSON only.`;

    const text = await callAi(system, user);
    if (!text) return null;
    const m = text.match(/EF_\d{3,}/i);
    if (!m) return null;
    const picked = m[0].toUpperCase();
    return candidates.some((c) => c.ef_id.toUpperCase() === picked) ? picked : null;
}

// Minimal provider-agnostic completion (Gemini → Groq), mirroring the priority
// in aiChatController. Returns null when no key is set or the call fails — the
// caller then uses the deterministic heuristic.
async function callAi(system: string, user: string): Promise<string | null> {
    try {
        if (process.env.GEMINI_API_KEY?.trim()) {
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
            const { data } = await axios.post<any>(
                url,
                {
                    system_instruction: { parts: [{ text: system }] },
                    contents: [{ role: "user", parts: [{ text: user }] }],
                    generationConfig: { maxOutputTokens: 256, temperature: 0 },
                },
                { headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY as string }, timeout: 30000 },
            );
            const parts = data?.candidates?.[0]?.content?.parts ?? [];
            return parts.map((p: any) => p?.text ?? "").join("").trim();
        }
        if (process.env.GROQ_API_KEY?.trim()) {
            const { data } = await axios.post<any>(
                "https://api.groq.com/openai/v1/chat/completions",
                { model: GROQ_MODEL, max_tokens: 256, temperature: 0, messages: [{ role: "system", content: system }, { role: "user", content: user }] },
                { headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, timeout: 30000 },
            );
            return (data?.choices?.[0]?.message?.content ?? "").trim();
        }
    } catch (err: any) {
        console.warn("materialEfResolver AI call failed:", err?.response?.data || err?.message || err);
    }
    return null;
}

// Deterministic fallback pick when AI is unavailable. Scores candidates by
// preferring production rows and penalising coatings/scrap/equipment, then
// prefers a non-zero EF.
function heuristicPick(description: string, candidates: EfCandidate[]): EfCandidate | null {
    if (!candidates.length) return null;
    const PREFER = ["production mix", "at plant", "alloy", "primary"];
    const AVOID = ["coating", "scrap", "cathode", "anode", "welding", "anodising", "gallium", "extrusion", "rolling", "treatment", "obsolete",
        // Over-specific raw-metal grades that pull element matches away from the
        // plain metallurgical grade the manager uses. Photovoltaic/solar silicon
        // is ultra-high-purity (huge EF); nickel-chromium is a specialty steel
        // alloy — neither is the right default for a plain element composition.
        "photovoltaic", "photovoltaics", "solar", "nickel-chromium", "nickel", "chromium",
        // Air freight is never a sensible default transport mode — deprioritise it.
        "aircraft", "air freight", "helicopter", "plane"];
    // Distinctive description words (e.g. "cast", "wrought", "primary",
    // "secondary") that should pull the match toward the matching product
    // variant. Shared with the product text below.
    const descTokens = new Set(tokenize(description));

    const scored = candidates.map((c) => {
        const p = (c.product || "").toLowerCase();
        let score = 0;
        for (const w of PREFER) if (p.includes(w)) score += 2;
        for (const w of AVOID) if (p.includes(w)) score -= 3;
        // Strong boost for sharing distinctive words with the description so
        // "Cast Aluminium Alloy" prefers the *cast* alloy row over the wrought one.
        for (const tok of descTokens) if (tok.length >= 4 && p.includes(tok)) score += 4;
        const ef = Number(c.kgco2e_per_unit) || 0;
        if (ef > 0) score += 1; else score -= 2;
        return { c, score, ef, len: (c.product || "").length };
    });
    // Highest text-relevance score wins; tie-break toward the SHORTER (more
    // canonical/generic) product name rather than the biggest EF — picking the
    // biggest EF was pulling in over-specific or infrastructure rows.
    scored.sort((a, b) => b.score - a.score || a.len - b.len);
    return scored[0].c;
}

// After a product is chosen, prefer the variant whose country best fits the
// supplier geography: exact country → supplier region → GLO → the originally
// chosen row. Keeps the manager's geography-fallback intent.
async function geoRefine(
    client: any,
    chosen: EfCandidate,
    countryCode: string | null,
): Promise<EfCandidate> {
    if (!chosen.product) return chosen;
    const r = await client.query(
        `SELECT ef_id, product, category, sub_category_1, country_code, kgco2e_per_unit, unit
         FROM emission_factors WHERE product = $1`,
        [chosen.product],
    );
    const rows = r.rows as EfCandidate[];
    if (rows.length <= 1) return chosen;

    const region = countryCode ? getCountryInfo(countryCode)?.region ?? null : null;
    const pickBy = (code: string) => rows.find((x) => (x.country_code || "").toUpperCase() === code.toUpperCase());

    return (
        (countryCode && pickBy(countryCode)) ||
        (region && pickBy(region)) ||
        pickBy("GLO") ||
        pickBy("RER") ||
        chosen
    );
}

// Generic entry point. Resolve a single EF from a free-text description within
// the given BAFU categories, with geography fallback. Used by every PCF section
// (materials, electricity, transport, waste) so they all follow the manager's
// description→product→fallback method.
export async function resolveEfFromText(
    client: any,
    description: string,
    categories: string[],
    countryInput: string | null,
    units: string[] | null = null,
): Promise<MaterialEfResolution> {
    const desc = (description || "").trim();
    if (!desc) return { matched: false, description: desc };

    const countryCode = normalizeCountryInput(countryInput);

    // Prefer unit-filtered candidates (excludes off-unit infrastructure rows).
    // If that yields nothing, retry without the unit filter so we never regress
    // to "no match" just because a unit label differs.
    let candidates = await fetchCandidates(client, desc, categories, units);
    if (!candidates.length && units) {
        candidates = await fetchCandidates(client, desc, categories, null);
    }
    if (!candidates.length) {
        return { matched: false, description: desc, candidate_count: 0 };
    }

    // 1. AI picks the best product row; fall back to heuristic.
    let chosen: EfCandidate | null = null;
    let step = "";
    const aiId = await aiPickEfId(desc, candidates);
    if (aiId) {
        chosen = candidates.find((c) => c.ef_id === aiId) || null;
        step = "ai";
    }
    if (!chosen) {
        chosen = heuristicPick(desc, candidates);
        step = "heuristic";
    }
    if (!chosen) return { matched: false, description: desc, candidate_count: candidates.length };

    // 2. Geography fallback to the best country variant of that product.
    const refined = await geoRefine(client, chosen, countryCode);
    if (refined.ef_id !== chosen.ef_id) step += "+geo";

    const ef = Number(refined.kgco2e_per_unit);
    return {
        matched: true,
        ef_id: refined.ef_id,
        ef_value: Number.isFinite(ef) ? ef : 0,
        product: refined.product,
        country_code: refined.country_code ?? undefined,
        unit: refined.unit ?? undefined,
        matched_step: step,
        candidate_count: candidates.length,
        description: desc,
    };
}

// Material wrapper — resolves a raw-material EF from the BOM description within
// the raw-material categories. Thin convenience over resolveEfFromText.
export async function resolveMaterialEfFromDescription(
    client: any,
    description: string,
    countryInput: string | null,
): Promise<MaterialEfResolution> {
    return resolveEfFromText(client, description, RAW_MATERIAL_CATEGORIES, countryInput);
}

// Packaging categories (cardboard/paper/plastic/etc.) used by the highest-EF picker.
export const PACKAGING_CATEGORIES = ["paper+ board", "cardboard", "plastics", "glass", "metals", "wood"];

// Manager's "fetch HIGHEST EF" rule (Excel note: "EF matches with multiple rows
// then fetch highest EF values to calculation"). Pulls all candidate rows that
// match the description tokens within the given categories, then returns the row
// with the MAXIMUM emission factor — instead of a single saved ef_code. Used for
// packaging, where the manager deliberately takes the highest corrugated-board EF.
export async function resolveHighestEfFromText(
    client: any,
    description: string,
    categories: string[],
    units: string[] | null,
): Promise<MaterialEfResolution> {
    const candidates = await fetchCandidates(client, description, categories, units);
    if (!candidates.length) return { matched: false, description, candidate_count: 0 };

    let best = candidates[0];
    let bestEf = Number(best.kgco2e_per_unit) || 0;
    for (const c of candidates) {
        const ef = Number(c.kgco2e_per_unit) || 0;
        if (ef > bestEf) { best = c; bestEf = ef; }
    }

    return {
        matched: bestEf > 0,
        ef_id: best.ef_id,
        ef_value: bestEf,
        product: best.product,
        country_code: best.country_code ?? undefined,
        unit: best.unit || (units && units[0]) || "kg",
        matched_step: "highest-ef",
        candidate_count: candidates.length,
        description,
    };
}
