'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import type { MuscleProgress } from '@/types/database'

interface StrengthTrendsProps {
  muscleProgress: MuscleProgress[]
}

export function StrengthTrends({ muscleProgress }: StrengthTrendsProps) {
  if (!muscleProgress || muscleProgress.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Strength Distribution</CardTitle>
          <CardDescription>Your strength scores across muscle groups</CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground py-8">
          No strength data yet. Complete workouts to track your progress.
        </CardContent>
      </Card>
    )
  }

  // Prepare chart data
  const chartData = muscleProgress
    .slice(0, 10)
    .sort((a, b) => b.strength_score - a.strength_score)
    .map((mp) => ({
      name: mp.muscle_group?.display_name || 'Unknown',
      strength: Math.round(mp.strength_score * 10) / 10,
      consistency: Math.round(mp.consistency_score * 10) / 10,
    }))

  // Calculate total strength
  const totalStrength = muscleProgress.reduce((sum, mp) => sum + mp.strength_score, 0)
  const averageStrength = muscleProgress.length > 0 ? totalStrength / muscleProgress.length : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strength Distribution</CardTitle>
        <CardDescription>Your top 10 muscle groups by strength score</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Total Strength</p>
            <p className="text-2xl font-bold text-foreground">{Math.round(totalStrength * 10) / 10}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Average Strength</p>
            <p className="text-2xl font-bold text-foreground">{Math.round(averageStrength * 10) / 10}</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted-foreground))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '0.5rem',
              }}
            />
            <Legend />
            <Bar
              dataKey="strength"
              fill="hsl(var(--primary))"
              name="Strength"
              radius={[8, 8, 0, 0]}
            />
            <Bar
              dataKey="consistency"
              fill="hsl(var(--muted-foreground))"
              name="Consistency"
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}
