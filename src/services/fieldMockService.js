// Temporary demo data. Replace each function with backend contracts when field endpoints are available.
const tasks = [
  { id: 'MT-2408', assetCode: 'OHE-M14-07', asset: 'OHE Mast 14/7', section: 'ALD-CNB / KM 742', priority: 'Critical', severity: 'High', dueDate: '2026-09-07', status: 'Assigned', type: 'Preventive inspection' },
  { id: 'MT-2397', assetCode: 'RR-B12', asset: 'Relay Room B-12', section: 'NDLS Yard', priority: 'High', severity: 'Medium', dueDate: '2026-09-07', status: 'In progress', type: 'Defect repair' },
  { id: 'MT-2384', assetCode: 'BR-112A', asset: 'Bridge 112A', section: 'GZB-MTC / KM 38', priority: 'Medium', severity: 'Low', dueDate: '2026-09-08', status: 'Assigned', type: 'Inspection' },
  { id: 'MT-2379', assetCode: 'SI-8C', asset: 'Section insulator 8C', section: 'CNB-ETW / KM 97', priority: 'Critical', severity: 'High', dueDate: '2026-09-05', status: 'Overdue', type: 'Corrective maintenance' },
  { id: 'MT-2368', assetCode: 'OHE-M11-02', asset: 'OHE Mast 11/2', section: 'ALD-CNB / KM 731', priority: 'Low', severity: 'Low', dueDate: '2026-09-06', status: 'Completed', type: 'Lubrication' },
]

const assets = [
  { id: 'OHE-M14-07', type: 'OHE Mast', department: 'TRD', section: 'ALD-CNB / KM 742', criticality: 'Critical', status: 'At risk', lastMaintenance: '2026-08-21', nextMaintenance: '2026-09-07' },
  { id: 'RR-B12', type: 'Relay room', department: 'S&T', section: 'NDLS Yard', criticality: 'High', status: 'Maintenance due', lastMaintenance: '2026-07-29', nextMaintenance: '2026-09-07' },
  { id: 'BR-112A', type: 'Bridge', department: 'ENGINEERING', section: 'GZB-MTC / KM 38', criticality: 'Medium', status: 'Operational', lastMaintenance: '2026-08-14', nextMaintenance: '2026-09-08' },
]

const history = [
  { id: 'H-1008', taskId: 'MT-2368', asset: 'OHE Mast 11/2', action: 'Lubrication completed', status: 'Completed', date: '2026-09-06', technician: 'G. Singh' },
  { id: 'H-1002', taskId: 'MT-2351', asset: 'Crossover 17B', action: 'Inspection closed', status: 'Completed', date: '2026-09-05', technician: 'G. Singh' },
  { id: 'H-0995', taskId: 'MT-2338', asset: 'Signal relay R-4', action: 'Defect rectified', status: 'Completed', date: '2026-09-03', technician: 'R. Kumar' },
]

export const fieldMockService = {
  async getTasks() { return tasks },
  async getAssets() { return assets },
  async getHistory() { return history },
  async submitDefect(payload) { return { id: `DF-DEMO-${Date.now()}`, ...payload, status: 'Submitted' } },
}
