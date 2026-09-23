export const ROLES = Object.freeze({ FIELD_SUPERVISOR: 'FIELD_SUPERVISOR', DEPARTMENT_PLANNER: 'DEPARTMENT_PLANNER', DEPARTMENT_OFFICER: 'DEPARTMENT_OFFICER', OPERATIONS_PLANNER: 'OPERATIONS_PLANNER', DIVISIONAL_OFFICER: 'DIVISIONAL_OFFICER', ADMIN: 'ADMIN' })

export const DEMO_USERS = [
  { id: 'field-supervisor', name: 'Field Supervisor', role: ROLES.FIELD_SUPERVISOR, department: 'TRD', initials: 'FS' },
  { id: 'engineering-planner', name: 'Engineering Planner', role: ROLES.DEPARTMENT_PLANNER, department: 'ENGINEERING', initials: 'EP' },
  { id: 'trd-planner', name: 'TRD Planner', role: ROLES.DEPARTMENT_PLANNER, department: 'TRD', initials: 'TP' },
  { id: 'st-planner', name: 'S&T Planner', role: ROLES.DEPARTMENT_PLANNER, department: 'S&T', initials: 'SP' },
  { id: 'department-officer', name: 'Department Officer', role: ROLES.DEPARTMENT_OFFICER, department: 'ENGINEERING', initials: 'DO' },
  { id: 'operations-planner', name: 'Operations Planner', role: ROLES.OPERATIONS_PLANNER, department: 'OPERATING', initials: 'OP' },
  { id: 'divisional-officer', name: 'Divisional Officer', role: ROLES.DIVISIONAL_OFFICER, department: 'DIVISIONAL', initials: 'DO' },
  { id: 'system-admin', name: 'System Admin', role: ROLES.ADMIN, department: 'ADMIN', initials: 'SA' },
]
