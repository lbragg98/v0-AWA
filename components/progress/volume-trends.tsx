import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import type { CompletedWorkout } from '@/types/database'

interface VolumeTrendsProps {
  workouts: CompletedWorkout[]
}

export function VolumeTrends({ workouts }: VolumeTrendsProps) {
  if (!workouts || workouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Volume Trends</CardTitle>
          <CardDescription>Total weight × reps over time</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground py-8">
          No workout data yet. Start logging workouts to see volume trends.
        </CardContent>
      </Card>
    )
  }

  // Group workouts by week and calculate volume
  const volumeByWeek: { [key: string]: { volume: number; count: number; date: string } } = {}

  workouts.forEach((workout) => {
    const date = new Date(workout.started_at)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay())
    const weekKey = weekStart.toISOString().split('T')[0]

    if (!volumeByWeek[weekKey]) {
      volumeByWeek[weekKey] = { volume: 0, count: 0, date: weekKey }
    }
    volumeByWeek[weekKey].volume += workout.total_volume || 0
    volumeByWeek[weekKey].count += 1
  })

  // Convert to array and sort by date
  const chartData = Object.values(volumeByWeek)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-12) // Last 12 weeks
    .map((week) => ({
      week: new Date(week.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      volume: Math.round(week.volume),
      workouts: week.count,
    }))

  const totalVolume = workouts.reduce((sum, w) => sum + (w.total_volume || 0), 0)
  const averageVolume = chartData.length > 0 ? Math.round(chartData.reduce((sum, w) => sum + w.volume, 0) / chartData.length) : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Volume Trends</CardTitle>
        <CardDescription>Weekly total volume and workout counts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Volume</p>
            <p className="text-2xl font-bold text-foreground">{totalVolume.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Weekly Average</p>
            <p className="text-2xl font-bold text-foreground">{averageVolume.toLocaleString()}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" />
            <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            <Bar dataKey="volume" fill="hsl(var(--primary))" name="Total Volume" />
            <Bar dataKey="workouts" fill="hsl(var(--muted-foreground))" name="Workouts" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
