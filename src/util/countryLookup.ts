// Country metadata for the EF fallback chain. Boss's chain order:
//   Supplier Region > Supplier Country > Nearby Country > Continent > Global > Europe
//
// For each ISO country code we record: which continent, which BAFU region code
// (RER for Europe, RAS for Rest of Asia, etc.), and a short list of geographic
// neighbours. Special pseudo-codes (RER, GLO, RoW, RAS, RLA, RNA, RAF, RME,
// APAC, ENTSO-E, CENTREL, OCE) used by BAFU are listed at the end and resolve
// directly to themselves.

export type Continent =
    | "Europe"
    | "Asia"
    | "Africa"
    | "North America"
    | "South America"
    | "Oceania"
    | "Antarctica"
    | "Global";

export interface CountryInfo {
    continent: Continent;
    region: string;        // BAFU regional pseudo-code that contains this country
    nearby: string[];      // border / near-border ISO country codes
}

// Codes used in BAFU but not real countries — they map to themselves.
export const PSEUDO_CODES = new Set([
    "RER", "GLO", "RoW", "RAS", "RLA", "RNA", "RAF", "RME",
    "APAC", "ENTSO-E", "CENTREL", "NORDEL", "UCTE", "OCE",
]);

const LOOKUP: Record<string, CountryInfo> = {
    // ---- Europe ----
    CH: { continent: "Europe", region: "RER", nearby: ["DE", "FR", "IT", "AT", "LI"] },
    DE: { continent: "Europe", region: "RER", nearby: ["AT", "BE", "CH", "CZ", "DK", "FR", "LU", "NL", "PL"] },
    FR: { continent: "Europe", region: "RER", nearby: ["BE", "CH", "DE", "ES", "IT", "LU", "MC", "AD"] },
    IT: { continent: "Europe", region: "RER", nearby: ["AT", "CH", "FR", "SI", "SM", "VA"] },
    AT: { continent: "Europe", region: "RER", nearby: ["CH", "CZ", "DE", "HU", "IT", "LI", "SI", "SK"] },
    BE: { continent: "Europe", region: "RER", nearby: ["DE", "FR", "LU", "NL"] },
    NL: { continent: "Europe", region: "RER", nearby: ["BE", "DE"] },
    LU: { continent: "Europe", region: "RER", nearby: ["BE", "DE", "FR"] },
    ES: { continent: "Europe", region: "RER", nearby: ["AD", "FR", "PT"] },
    PT: { continent: "Europe", region: "RER", nearby: ["ES"] },
    GB: { continent: "Europe", region: "RER", nearby: ["IE", "FR"] },
    IE: { continent: "Europe", region: "RER", nearby: ["GB"] },
    DK: { continent: "Europe", region: "RER", nearby: ["DE", "SE", "NO"] },
    SE: { continent: "Europe", region: "RER", nearby: ["DK", "FI", "NO"] },
    NO: { continent: "Europe", region: "RER", nearby: ["DK", "FI", "SE"] },
    FI: { continent: "Europe", region: "RER", nearby: ["NO", "RU", "SE"] },
    IS: { continent: "Europe", region: "RER", nearby: [] },
    PL: { continent: "Europe", region: "RER", nearby: ["BY", "CZ", "DE", "LT", "RU", "SK", "UA"] },
    CZ: { continent: "Europe", region: "RER", nearby: ["AT", "DE", "PL", "SK"] },
    SK: { continent: "Europe", region: "RER", nearby: ["AT", "CZ", "HU", "PL", "UA"] },
    HU: { continent: "Europe", region: "RER", nearby: ["AT", "HR", "RO", "RS", "SI", "SK", "UA"] },
    SI: { continent: "Europe", region: "RER", nearby: ["AT", "HR", "HU", "IT"] },
    HR: { continent: "Europe", region: "RER", nearby: ["BA", "HU", "RS", "SI"] },
    RO: { continent: "Europe", region: "RER", nearby: ["BG", "HU", "MD", "RS", "UA"] },
    BG: { continent: "Europe", region: "RER", nearby: ["GR", "MK", "RO", "RS", "TR"] },
    GR: { continent: "Europe", region: "RER", nearby: ["AL", "BG", "MK", "TR"] },
    UA: { continent: "Europe", region: "RER", nearby: ["BY", "HU", "MD", "PL", "RO", "RU", "SK"] },
    RU: { continent: "Europe", region: "RER", nearby: ["BY", "CN", "EE", "FI", "GE", "KZ", "LT", "LV", "MN", "NO", "PL", "UA"] },
    BY: { continent: "Europe", region: "RER", nearby: ["LT", "LV", "PL", "RU", "UA"] },
    LT: { continent: "Europe", region: "RER", nearby: ["BY", "LV", "PL", "RU"] },
    LV: { continent: "Europe", region: "RER", nearby: ["BY", "EE", "LT", "RU"] },
    EE: { continent: "Europe", region: "RER", nearby: ["LV", "RU"] },
    BA: { continent: "Europe", region: "RER", nearby: ["HR", "ME", "RS"] },
    RS: { continent: "Europe", region: "RER", nearby: ["BA", "BG", "HR", "HU", "ME", "MK", "RO"] },
    MK: { continent: "Europe", region: "RER", nearby: ["AL", "BG", "GR", "RS", "XK"] },
    AL: { continent: "Europe", region: "RER", nearby: ["GR", "ME", "MK", "XK"] },
    MD: { continent: "Europe", region: "RER", nearby: ["RO", "UA"] },
    CY: { continent: "Europe", region: "RER", nearby: ["GR", "TR"] },
    MT: { continent: "Europe", region: "RER", nearby: ["IT"] },
    TR: { continent: "Asia",   region: "RME", nearby: ["BG", "GE", "GR", "IR", "IQ", "SY", "AM"] },

    // ---- Asia ----
    IN: { continent: "Asia", region: "RAS", nearby: ["BD", "BT", "CN", "MM", "NP", "PK", "LK"] },
    CN: { continent: "Asia", region: "RAS", nearby: ["AF", "BT", "IN", "KZ", "KG", "LA", "MN", "MM", "NP", "KP", "PK", "RU", "TJ", "VN"] },
    JP: { continent: "Asia", region: "RAS", nearby: ["KR", "TW"] },
    KR: { continent: "Asia", region: "RAS", nearby: ["JP", "KP"] },
    TW: { continent: "Asia", region: "RAS", nearby: ["CN", "JP", "PH"] },
    TH: { continent: "Asia", region: "RAS", nearby: ["KH", "LA", "MM", "MY"] },
    VN: { continent: "Asia", region: "RAS", nearby: ["CN", "KH", "LA"] },
    MY: { continent: "Asia", region: "RAS", nearby: ["BN", "ID", "SG", "TH"] },
    SG: { continent: "Asia", region: "RAS", nearby: ["MY", "ID"] },
    ID: { continent: "Asia", region: "RAS", nearby: ["AU", "MY", "PG", "TL"] },
    PH: { continent: "Asia", region: "RAS", nearby: ["MY", "TW", "VN"] },
    PK: { continent: "Asia", region: "RAS", nearby: ["AF", "CN", "IN", "IR"] },
    BD: { continent: "Asia", region: "RAS", nearby: ["IN", "MM"] },
    KZ: { continent: "Asia", region: "RAS", nearby: ["CN", "KG", "RU", "TM", "UZ"] },
    UZ: { continent: "Asia", region: "RAS", nearby: ["AF", "KG", "KZ", "TJ", "TM"] },
    TM: { continent: "Asia", region: "RAS", nearby: ["AF", "IR", "KZ", "UZ"] },
    IR: { continent: "Asia", region: "RME", nearby: ["AF", "AM", "AZ", "IQ", "PK", "TR", "TM"] },
    IQ: { continent: "Asia", region: "RME", nearby: ["IR", "JO", "KW", "SA", "SY", "TR"] },
    SA: { continent: "Asia", region: "RME", nearby: ["BH", "IQ", "JO", "KW", "OM", "QA", "AE", "YE"] },
    AE: { continent: "Asia", region: "RME", nearby: ["OM", "SA"] },
    QA: { continent: "Asia", region: "RME", nearby: ["BH", "SA"] },
    KW: { continent: "Asia", region: "RME", nearby: ["IQ", "SA"] },
    OM: { continent: "Asia", region: "RME", nearby: ["SA", "AE", "YE"] },
    IL: { continent: "Asia", region: "RME", nearby: ["EG", "JO", "LB", "SY"] },
    EG: { continent: "Africa", region: "RAF", nearby: ["IL", "LY", "SD"] },

    // ---- Africa ----
    ZA: { continent: "Africa", region: "RAF", nearby: ["BW", "LS", "MZ", "NA", "SZ", "ZW"] },
    NG: { continent: "Africa", region: "RAF", nearby: ["BJ", "CM", "NE", "TD"] },
    DZ: { continent: "Africa", region: "RAF", nearby: ["LY", "MA", "MR", "ML", "NE", "TN"] },
    MA: { continent: "Africa", region: "RAF", nearby: ["DZ"] },
    TN: { continent: "Africa", region: "RAF", nearby: ["DZ", "LY"] },
    LY: { continent: "Africa", region: "RAF", nearby: ["DZ", "EG", "NE", "SD", "TN"] },
    AO: { continent: "Africa", region: "RAF", nearby: ["CD", "NA", "ZM"] },
    TZ: { continent: "Africa", region: "RAF", nearby: ["BI", "CD", "KE", "MW", "MZ", "RW", "UG", "ZM"] },
    ET: { continent: "Africa", region: "RAF", nearby: ["DJ", "ER", "KE", "SO", "SS", "SD"] },
    CM: { continent: "Africa", region: "RAF", nearby: ["CF", "TD", "CG", "GQ", "GA", "NG"] },
    GQ: { continent: "Africa", region: "RAF", nearby: ["CM", "GA"] },

    // ---- Americas ----
    US: { continent: "North America", region: "RNA", nearby: ["CA", "MX"] },
    CA: { continent: "North America", region: "RNA", nearby: ["US"] },
    MX: { continent: "North America", region: "RNA", nearby: ["BZ", "GT", "US"] },
    BR: { continent: "South America", region: "RLA", nearby: ["AR", "BO", "CO", "GF", "GY", "PY", "PE", "SR", "UY", "VE"] },
    AR: { continent: "South America", region: "RLA", nearby: ["BO", "BR", "CL", "PY", "UY"] },
    CL: { continent: "South America", region: "RLA", nearby: ["AR", "BO", "PE"] },
    CO: { continent: "South America", region: "RLA", nearby: ["BR", "EC", "PA", "PE", "VE"] },
    PE: { continent: "South America", region: "RLA", nearby: ["BO", "BR", "CL", "CO", "EC"] },
    VE: { continent: "South America", region: "RLA", nearby: ["BR", "CO", "GY"] },
    EC: { continent: "South America", region: "RLA", nearby: ["CO", "PE"] },
    BO: { continent: "South America", region: "RLA", nearby: ["AR", "BR", "CL", "PE", "PY"] },
    PY: { continent: "South America", region: "RLA", nearby: ["AR", "BO", "BR"] },
    TT: { continent: "South America", region: "RLA", nearby: ["VE"] },

    // ---- Oceania ----
    AU: { continent: "Oceania", region: "OCE", nearby: ["ID", "NZ", "PG"] },
    NZ: { continent: "Oceania", region: "OCE", nearby: ["AU"] },
    PG: { continent: "Oceania", region: "OCE", nearby: ["AU", "ID"] },
};

export function getCountryInfo(code: string): CountryInfo | null {
    if (!code) return null;
    const upper = code.trim().toUpperCase();
    return LOOKUP[upper] || null;
}

export function isPseudoCode(code: string): boolean {
    if (!code) return false;
    return PSEUDO_CODES.has(code.trim());
}

// All countries on a continent, for the "Continent" fallback step.
export function countriesOnContinent(continent: Continent): string[] {
    return Object.entries(LOOKUP)
        .filter(([, info]) => info.continent === continent)
        .map(([code]) => code);
}
