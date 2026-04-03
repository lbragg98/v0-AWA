import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart3 } from 'lucide-react'

interface WeeklySummaryProps {
  workoutsThisWeek: number
  expectedWorkouts: number
}

export function WeeklySummary({ workoutsThisWeek, expectedWorkouts }: WeeklySummaryProps) {
  const completionPercentage = expectedWorkouts > 0
    ? Math.round((workoutsThisWeek / expectedWorkouts) * 100)
    : 0

  return (
    <Card className="p-6">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
        <BarChart3 className="h-5 w-5 text-primary" />
        This Week
      </h3>

      <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Completion</span>
          <span className="text-lg font-semibold text-foreground">
            {workoutsThisWeek}/{expectedWorkouts}
          </span>
        </div>
        <Progress value={Math.min(completionPercentage, 100)} />
        <p className="mt-2 text-xs text-muted-foreground">
          {completionPercentage}% of weekly goal
        </p>
      </div>
    </Card>
  )
}
