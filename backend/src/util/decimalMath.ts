import Decimal from 'decimal.js';

const DEFAULT_FALLBACK = new Decimal(0);

// Note: we intentionally avoid using Decimal as a TS type here because this repo
// doesn't include decimal.js type declarations.
function coerceDecimal(value: unknown) {
    if (value === null || value === undefined) return DEFAULT_FALLBACK;
    if (value instanceof Decimal) return value;
    if (typeof value === 'number') {
        if (!Number.isFinite(value)) return DEFAULT_FALLBACK;
        return new Decimal(value);
    }
    if (typeof value === 'string') {
        const trimmed = value.trim();
        if (!trimmed) return DEFAULT_FALLBACK;
        try {
            const d = new Decimal(trimmed);
            return d.isFinite() ? d : DEFAULT_FALLBACK;
        } catch {
            return DEFAULT_FALLBACK;
        }
    }
    try {
        const d = new Decimal(String(value));
        return d.isFinite() ? d : DEFAULT_FALLBACK;
    } catch {
        return DEFAULT_FALLBACK;
    }
}

export function D(value: unknown) {
    return coerceDecimal(value);
}

export function roundDp(value: unknown, dp: number): number {
    return coerceDecimal(value).toDecimalPlaces(dp, Decimal.ROUND_HALF_UP).toNumber();
}

export function truncDp(value: unknown, dp: number): number {
    return coerceDecimal(value).toDecimalPlaces(dp, Decimal.ROUND_DOWN).toNumber();
}

export function add(...values: unknown[]) {
    let acc = new Decimal(0);
    for (const v of values) acc = acc.plus(coerceDecimal(v));
    return acc;
}

