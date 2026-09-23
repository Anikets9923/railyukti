import { KpiCard } from '../common/KpiCard'

export function AnalyticsMetricGrid({ metrics }) { return <div className="kpi-grid analytics-metrics">{metrics.map((metric) => <KpiCard key={metric.label} label={metric.label} value={metric.value ?? 'Not provided'} detail={metric.detail} tone={metric.tone} icon={metric.icon} />)}</div> }
