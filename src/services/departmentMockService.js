// Temporary department fixtures. Replace with backend responses when contracts are available.
const departmentData = {
  ENGINEERING: {
    tasks: [
      { id: 'ENG-2410', asset: 'Bridge 112A', assetCode: 'BR-112A', section: 'GZB-MTC / KM 38', department: 'ENGINEERING', priority: 'Critical', severity: 'High', criticality: 'Critical', dueDate: '2026-09-07', status: 'Assigned' },
      { id: 'ENG-2404', asset: 'Culvert 48C', assetCode: 'CV-48C', section: 'NDLS-GZB / KM 22', department: 'ENGINEERING', priority: 'Medium', severity: 'Medium', criticality: 'High', dueDate: '2026-09-08', status: 'Scheduled' },
      { id: 'ENG-2398', asset: 'Track geometry point 7', assetCode: 'TGP-007', section: 'ALD-CNB / KM 741', department: 'ENGINEERING', priority: 'High', severity: 'High', criticality: 'High', dueDate: '2026-09-05', status: 'Overdue' },
    ],
    assets: [{ id: 'BR-112A', type: 'Bridge', section: 'GZB-MTC / KM 38', department: 'ENGINEERING', criticality: 'Critical', status: 'Inspection due', lastMaintenance: '2026-08-14' }, { id: 'CV-48C', type: 'Culvert', section: 'NDLS-GZB / KM 22', department: 'ENGINEERING', criticality: 'High', status: 'Operational', lastMaintenance: '2026-08-18' }],
  },
  TRD: {
    tasks: [{ id: 'TRD-2408', asset: 'OHE Mast 14/7', assetCode: 'OHE-M14-07', section: 'ALD-CNB / KM 742', department: 'TRD', priority: 'Critical', severity: 'High', criticality: 'Critical', dueDate: '2026-09-07', status: 'Assigned' }, { id: 'TRD-2393', asset: 'Section insulator 8C', assetCode: 'SI-8C', section: 'CNB-ETW / KM 97', department: 'TRD', priority: 'High', severity: 'Medium', criticality: 'High', dueDate: '2026-09-06', status: 'Overdue' }, { id: 'TRD-2387', asset: 'OHE Mast 11/2', assetCode: 'OHE-M11-02', section: 'ALD-CNB / KM 731', department: 'TRD', priority: 'Medium', severity: 'Low', criticality: 'Medium', dueDate: '2026-09-09', status: 'Scheduled' }],
    assets: [{ id: 'OHE-M14-07', type: 'OHE Mast', section: 'ALD-CNB / KM 742', department: 'TRD', criticality: 'Critical', status: 'At risk', lastMaintenance: '2026-08-21' }, { id: 'SI-8C', type: 'Section insulator', section: 'CNB-ETW / KM 97', department: 'TRD', criticality: 'High', status: 'Maintenance due', lastMaintenance: '2026-07-28' }],
  },
  'S&T': {
    tasks: [{ id: 'ST-2412', asset: 'Relay Room B-12', assetCode: 'RR-B12', section: 'NDLS Yard', department: 'S&T', priority: 'Critical', severity: 'High', criticality: 'Critical', dueDate: '2026-09-07', status: 'Assigned' }, { id: 'ST-2401', asset: 'Axle counter AC-09', assetCode: 'AC-09', section: 'GZB-MTC / KM 41', department: 'S&T', priority: 'High', severity: 'Medium', criticality: 'High', dueDate: '2026-09-08', status: 'Scheduled' }, { id: 'ST-2395', asset: 'Signal lamp S-18', assetCode: 'SIG-S18', section: 'NDLS-GZB / KM 18', department: 'S&T', priority: 'Low', severity: 'Low', criticality: 'Medium', dueDate: '2026-09-10', status: 'Unscheduled' }],
    assets: [{ id: 'RR-B12', type: 'Relay room', section: 'NDLS Yard', department: 'S&T', criticality: 'Critical', status: 'Maintenance due', lastMaintenance: '2026-07-29' }, { id: 'AC-09', type: 'Axle counter', section: 'GZB-MTC / KM 41', department: 'S&T', criticality: 'High', status: 'Operational', lastMaintenance: '2026-08-10' }],
  },
}

const commonBlocks = [{ id: 'BR-108', corridor: 'NDLS-GZB', window: '22:40-00:10', department: 'TRD', requestedFor: 'OHE mast inspection', status: 'Pending review', impact: '2 train paths' }, { id: 'BR-105', corridor: 'ALD-CNB', window: '01:15-03:00', department: 'ENGINEERING', requestedFor: 'Bridge 112A inspection', status: 'Draft', impact: 'No conflict checked' }]
const commonRecommendations = [{ id: 'REC-01', taskId: 'TRD-2408', recommendation: 'Prioritize before next available night block', reason: 'Critical OHE asset with maintenance due today', source: 'Demo recommendation' }, { id: 'REC-02', taskId: 'ENG-2398', recommendation: 'Escalate overdue inspection to planner', reason: 'Task due date has passed', source: 'Demo recommendation' }]
const commonPlan = [{ id: 'PLAN-01', date: '2026-09-08', section: 'ALD-CNB', tasks: 2, status: 'Proposed' }, { id: 'PLAN-02', date: '2026-09-09', section: 'NDLS-GZB', tasks: 1, status: 'Unscheduled' }]

export const departmentMockService = {
  async getTasks(department) { return departmentData[department]?.tasks ?? [] },
  async getAssets(department) { return departmentData[department]?.assets ?? [] },
  async getBlocks(department) { return commonBlocks.filter((block) => block.department === department) },
  async getRecommendations() { return commonRecommendations },
  async getPlan() { return commonPlan },
  async createBlock(payload) { return { id: `BR-DEMO-${Date.now()}`, ...payload, status: 'Draft' } },
}
