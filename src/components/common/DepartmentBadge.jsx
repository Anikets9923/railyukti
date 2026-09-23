const departmentTone = { ENGINEERING: 'engineering', TRD: 'trd', 'S&T': 'st', OPERATING: 'operating', DIVISIONAL: 'divisional', ADMIN: 'admin' }
export function DepartmentBadge({ department }) { return <span className={`department-badge department-${departmentTone[department] ?? 'neutral'}`}>{department}</span> }
