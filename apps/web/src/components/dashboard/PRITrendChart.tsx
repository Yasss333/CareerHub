import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

export interface PRITrendPoint {
  date: string
  score: number
}

interface PRITrendChartProps {
  data: PRITrendPoint[]
}

export default function PRITrendChart({ data }: PRITrendChartProps) {
  return (
    <div className="relative h-64 w-full" aria-label="Placement Readiness Index across days">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 8, left: -16, bottom: 0 }}>
          <defs>
            <linearGradient id="pri-trend-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="4 4" vertical={false} />
          <XAxis dataKey="date" minTickGap={28} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
          <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickLine={false} axisLine={false} tick={{ fill: 'var(--muted-foreground)', fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)} / 100`, 'PRI']}
            contentStyle={{
              borderRadius: '0.75rem',
              borderColor: 'var(--border)',
              backgroundColor: 'var(--popover)',
              color: 'var(--popover-foreground)',
            }}
          />
          <Area type="monotone" dataKey="score" name="PRI" stroke="var(--chart-1)" strokeWidth={3} fill="url(#pri-trend-fill)" activeDot={{ r: 5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
