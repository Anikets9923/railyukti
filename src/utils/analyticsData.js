export function firstDefined(source, keys) { for (const key of keys) { if (source?.[key] !== undefined && source?.[key] !== null && source?.[key] !== '') return source[key] } return undefined }
export function arrayFrom(source, keys) { for (const key of keys) { if (Array.isArray(source?.[key])) return source[key] } return [] }
export function chartItems(items) { return items.map((item) => ({ label: item.label ?? item.name ?? item.period ?? item.department ?? item.date ?? '—', value: item.value ?? item.count ?? item.total ?? item.tasks ?? item.utilization })) }
