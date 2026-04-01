import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import type { PersonalRecord } from '@/types/database'

interface PRProgressProps {
  personalRecords: PersonalRecord[]
}

export function PRProgress({ personalRecords }: PRProgressProps) {
  if (!personalRecords || personalRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Personal Records</CardTitle>
          <CardDescription>Your best lifts over time</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground py-8">
          No personal records yet. Complete workouts to track your PRs.
        </CardContent>
      </Card>
    )
  }

  // Get top PRs by 1RM
  const topPRs = personalRecords
    .filter((pr) => pr.estimated_1rm && pr.estimated_1rm > 0)
    .sort((a, b) => (b.estimated_1rm || 0) - (a.estimated_1rm || 0))
    .slice(0, 10)

  // Group by month for trend chart
  const prsByMonth: { [key: string]: { count: number; date: string; avgWeight: number } } = {}

  personalRecords.forEach((pr) => {
    const date = new Date(pr.achieved_at)
    const monthKey = date.toISOString().substring(0, 7)

    if (!prsByMonth[monthKey]) {
      prsByMonth[monthKey] = { count: 0, date: monthKey, avgWeight: 0 }
    }
    prsByMonth[monthKey].count += 1
    prsByMonth[monthKey].avgWeight += pr.weight || 0
  })

  const chartData = Object.values(prsByMonth)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-12)
    .map((month) => ({
      month: new Date(month.date + '-01').toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      prs: month.count,
      avgWeight: Math.round((month.avgWeight / month.count) * 10) / 10,
    }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Records</CardTitle>
        <CardDescription>Your best {topPRs.length} lifts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Top PRs List */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Top Lifts</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {topPRs.map((pr, idx) => (
              <div key={pr.id} className="flex items-center justify-between rounded-lg bg-accent/50 p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">
                    #{idx + 1} • {Math.round(pr.weight)} {pr.weight_unit} × {pr.reps}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Est. 1RM: {Math.round((pr.estimated_1rm || 0) * 10) / 10} {pr.weight_unit}
                  </p>
                </div>
                <Badge variant="outline">{new Date(pr.achieved_at).toLocaleDateString()}</Badge>
              </div>
            ))}
          </div>
        </div>

        {/* PR Trend Chart */}
        {chartData.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-foreground">PR Trend</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '0.5rem',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="prs"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--primary))' }}
                  name="PRs"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
