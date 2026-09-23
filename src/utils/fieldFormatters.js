export function fieldValue(row, ...keys) { return keys.map((key) => row?.[key]).find((item) => item !== undefined && item !== null && item !== '') ?? '—' }
