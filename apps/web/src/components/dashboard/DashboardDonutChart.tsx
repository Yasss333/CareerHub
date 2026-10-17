import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'

interface DashboardDonutChartProps {
  data: Array<{
    name: string
    value: number
    fill: string
  }>
  centerValue: number
  centerLabel: string
  valueLabel: string
  className: string
  innerRadius?: number
  outerRadius?: number
}

export default function DashboardDonutChart({
  data,
  centerValue,
  centerLabel,
  valueLabel,
  className,
  innerRadius = 62,
  outerRadius = 88,
}: DashboardDonutChartProps) {
  return (
    <div className={`relative ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={innerRadius}
            outerRadius={outerRadius}
            paddingAngle={3}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [Number(value).toLocaleString(), valueLabel]}
            contentStyle={{
              borderRadius: '0.75rem',
              borderColor: 'var(--border)',
              backgroundColor: 'var(--popover)',
              color: 'var(--popover-foreground)',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-semibold tabular-nums">{centerValue}</span>
        <span className="text-xs text-muted-foreground">{centerLabel}</span>
      </div>
    </div>
  )
}
