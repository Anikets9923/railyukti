import { Activity, AlertTriangle, Blocks, CalendarDays, ClipboardCheck, FileCheck2, Gauge, LayoutDashboard, Map, Settings2, TrainFront, Users, Wrench } from 'lucide-react'
import { ROLES } from '../auth/roles'
import { hasPermission, PERMISSIONS } from '../auth/permissions'
import { FieldHomePage } from '../pages/field/FieldHomePage'
import { FieldTasksPage } from '../pages/field/FieldTasksPage'
import { FieldAssetsPage } from '../pages/field/FieldAssetsPage'
import { FieldDefectsPage } from '../pages/field/FieldDefectsPage'
import { FieldHistoryPage } from '../pages/field/FieldHistoryPage'
import { DepartmentHomePage } from '../pages/department/DepartmentHomePage'
import { DepartmentMaintenancePage } from '../pages/department/DepartmentMaintenancePage'
import { DepartmentAssetsPage } from '../pages/department/DepartmentAssetsPage'
import { DepartmentBlocksPage } from '../pages/department/DepartmentBlocksPage'
import { DepartmentAIPage } from '../pages/department/DepartmentAIPage'
import { DepartmentPlanPage } from '../pages/department/DepartmentPlanPage'
import { BlockPlannerPage } from '../pages/planning/BlockPlannerPage'
import { DepartmentOfficerHomePage } from '../pages/department/DepartmentOfficerHomePage'
import { DepartmentOfficerRequestsPage } from '../pages/department/DepartmentOfficerRequestsPage'
import { DepartmentOfficerApprovalsPage } from '../pages/department/DepartmentOfficerApprovalsPage'
import { DepartmentOfficerPerformancePage } from '../pages/department/DepartmentOfficerPerformancePage'
import { OperationsHomePage } from '../pages/operations/OperationsHomePage'
import { OperationsTimetablePage } from '../pages/operations/OperationsTimetablePage'
import { OperationsCorridorPage } from '../pages/operations/OperationsCorridorPage'
import { OperationsBlocksPage } from '../pages/operations/OperationsBlocksPage'
import { OperationsConflictsPage } from '../pages/operations/OperationsConflictsPage'
import { OfficerHomePage } from '../pages/officer/OfficerHomePage'
import { OfficerPlanPage } from '../pages/officer/OfficerPlanPage'
import { MonthlyOfficerPlanPage } from '../pages/officer/MonthlyOfficerPlanPage'
import { OfficerApprovalPage } from '../pages/officer/OfficerApprovalPage'
import { OfficerPerformancePage } from '../pages/officer/OfficerPerformancePage'
import { OfficerAnalyticsPage } from '../pages/officer/OfficerAnalyticsPage'
import { AdminHomePage } from '../pages/admin/AdminHomePage'
import { AdminUsersPage, AdminRolesPage, AdminDepartmentsPage, AdminSectionsPage, AdminAssetsPage, AdminConfigurationPage, AdminAuditLogsPage } from '../pages/admin/AdminManagementPages'

const route = (path, label, title, roles, permission, icon, component) => ({ path, label, title, roles, permissions: permission ? [permission] : [], icon, component, showInNavigation: true })

export const ROUTES = [
  route('/field/dashboard', 'Dashboard', 'Field dashboard', [ROLES.FIELD_SUPERVISOR], null, LayoutDashboard, FieldHomePage),
  route('/field/tasks', 'Assigned tasks', 'Assigned maintenance tasks', [ROLES.FIELD_SUPERVISOR], PERMISSIONS.VIEW_TASKS, ClipboardCheck, FieldTasksPage),
  route('/field/assets', 'Assets', 'Field assets', [ROLES.FIELD_SUPERVISOR], PERMISSIONS.VIEW_ASSETS, Wrench, FieldAssetsPage),
  route('/field/defects', 'Report defects', 'Defect reporting', [ROLES.FIELD_SUPERVISOR], PERMISSIONS.REPORT_DEFECT, AlertTriangle, FieldDefectsPage),
  route('/field/history', 'Maintenance history', 'Maintenance history', [ROLES.FIELD_SUPERVISOR], PERMISSIONS.VIEW_MAINTENANCE_HISTORY, Activity, FieldHistoryPage),

  route('/department/dashboard', 'Dashboard', 'Department dashboard', [ROLES.DEPARTMENT_PLANNER], null, LayoutDashboard, DepartmentHomePage),
  route('/department/maintenance', 'Maintenance', 'Department maintenance', [ROLES.DEPARTMENT_PLANNER], PERMISSIONS.VIEW_TASKS, ClipboardCheck, DepartmentMaintenancePage),
  route('/department/assets', 'Assets', 'Department assets', [ROLES.DEPARTMENT_PLANNER], PERMISSIONS.VIEW_ASSETS, Wrench, DepartmentAssetsPage),
  route('/department/block-requests', 'Block requests', 'Department block requests', [ROLES.DEPARTMENT_PLANNER], PERMISSIONS.CREATE_BLOCK_REQUEST, Blocks, DepartmentBlocksPage),
  route('/department/ai-recommendations', 'AI recommendations', 'AI recommendations', [ROLES.DEPARTMENT_PLANNER], PERMISSIONS.VIEW_AI_RECOMMENDATIONS, Gauge, DepartmentAIPage),
  route('/department/plan', 'Department plan', 'Department maintenance plan', [ROLES.DEPARTMENT_PLANNER], PERMISSIONS.VIEW_OPTIMIZED_PLAN, CalendarDays, DepartmentPlanPage),
  route('/planning/block-planner', 'AI block planner', 'AI block planner', [ROLES.DEPARTMENT_PLANNER, ROLES.DIVISIONAL_OFFICER], PERMISSIONS.GENERATE_OPTIMIZED_PLAN, Blocks, BlockPlannerPage),

  route('/department-officer/dashboard', 'Dashboard', 'Department officer dashboard', [ROLES.DEPARTMENT_OFFICER], null, LayoutDashboard, DepartmentOfficerHomePage),
  route('/department-officer/requests', 'Requests', 'Department requests', [ROLES.DEPARTMENT_OFFICER], PERMISSIONS.VIEW_REQUESTS, Blocks, DepartmentOfficerRequestsPage),
  route('/department-officer/approvals', 'Approvals', 'Department approvals', [ROLES.DEPARTMENT_OFFICER], PERMISSIONS.APPROVE_BLOCK_REQUEST, FileCheck2, DepartmentOfficerApprovalsPage),
  route('/department-officer/performance', 'Performance', 'Department performance', [ROLES.DEPARTMENT_OFFICER], PERMISSIONS.VIEW_DEPARTMENT_PERFORMANCE, Activity, DepartmentOfficerPerformancePage),

  route('/operations/dashboard', 'Dashboard', 'Operations dashboard', [ROLES.OPERATIONS_PLANNER], null, LayoutDashboard, OperationsHomePage),
  route('/operations/timetable', 'Timetable', 'Train timetable', [ROLES.OPERATIONS_PLANNER], PERMISSIONS.VIEW_TIMETABLE, TrainFront, OperationsTimetablePage),
  route('/operations/corridor', 'Corridor', 'Corridor availability', [ROLES.OPERATIONS_PLANNER], PERMISSIONS.VIEW_BLOCK_WINDOWS, Map, OperationsCorridorPage),
  route('/operations/blocks', 'Block windows', 'Available block windows', [ROLES.OPERATIONS_PLANNER], PERMISSIONS.VIEW_BLOCK_WINDOWS, Blocks, OperationsBlocksPage),
  route('/operations/conflicts', 'Conflicts', 'Operational conflicts', [ROLES.OPERATIONS_PLANNER], PERMISSIONS.REVIEW_CONFLICTS, AlertTriangle, OperationsConflictsPage),

  route('/officer/dashboard', 'Dashboard', 'Divisional dashboard', [ROLES.DIVISIONAL_OFFICER], null, LayoutDashboard, OfficerHomePage),
  route('/officer/weekly-plan', 'Weekly plan', 'Weekly optimized plan', [ROLES.DIVISIONAL_OFFICER], PERMISSIONS.VIEW_OPTIMIZED_PLAN, CalendarDays, OfficerPlanPage),
  route('/officer/monthly-plan', 'Monthly plan', 'Monthly optimized plan', [ROLES.DIVISIONAL_OFFICER], PERMISSIONS.VIEW_OPTIMIZED_PLAN, CalendarDays, MonthlyOfficerPlanPage),
  route('/officer/approvals', 'Approvals', 'Final plan approvals', [ROLES.DIVISIONAL_OFFICER], PERMISSIONS.APPROVE_PLAN, FileCheck2, OfficerApprovalPage),
  route('/officer/analytics', 'Analytics', 'Division analytics', [ROLES.DIVISIONAL_OFFICER], PERMISSIONS.VIEW_ANALYTICS, Activity, OfficerAnalyticsPage),
  route('/officer/department-performance', 'Department performance', 'Department performance', [ROLES.DIVISIONAL_OFFICER], PERMISSIONS.VIEW_DEPARTMENT_PERFORMANCE, Activity, OfficerPerformancePage),

  route('/admin/dashboard', 'Dashboard', 'Admin dashboard', [ROLES.ADMIN], null, LayoutDashboard, AdminHomePage),
  route('/admin/users', 'Users', 'User management', [ROLES.ADMIN], PERMISSIONS.MANAGE_USERS, Users, AdminUsersPage),
  route('/admin/roles', 'Roles', 'Role and permission management', [ROLES.ADMIN], PERMISSIONS.MANAGE_ROLES, Users, AdminRolesPage),
  route('/admin/departments', 'Departments', 'Department management', [ROLES.ADMIN], PERMISSIONS.VIEW_DEPARTMENTS, Settings2, AdminDepartmentsPage),
  route('/admin/sections', 'Sections', 'Section management', [ROLES.ADMIN], PERMISSIONS.VIEW_SECTIONS, Map, AdminSectionsPage),
  route('/admin/assets', 'Assets', 'Asset configuration', [ROLES.ADMIN], PERMISSIONS.VIEW_ASSETS, Wrench, AdminAssetsPage),
  route('/admin/configuration', 'Configuration', 'System configuration', [ROLES.ADMIN], PERMISSIONS.MANAGE_CONFIGURATION, Settings2, AdminConfigurationPage),
  route('/admin/audit-logs', 'Audit logs', 'Audit logs', [ROLES.ADMIN], PERMISSIONS.VIEW_AUDIT_LOGS, Activity, AdminAuditLogsPage),
]

export function getRoute(path) { return ROUTES.find((item) => item.path === path) }
export function getDashboardPath(role) { return ROUTES.find((item) => item.roles.includes(role) && item.label === 'Dashboard')?.path ?? '/login' }
export function getNavigation(role) { return ROUTES.filter((item) => item.showInNavigation && item.roles.includes(role)) }
export function canAccessRoute(routeConfig, session) { return Boolean(session && routeConfig?.roles.includes(session.role) && routeConfig.permissions.every((permission) => hasPermission(session.role, permission))) }
