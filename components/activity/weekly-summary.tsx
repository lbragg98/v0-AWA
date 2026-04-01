import { Card } from '@/components/ui/card'
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
      <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
        <BarChart3 className="h-5 w-5" />
        This Week
      </h3>

      <div className="space-y-4">
        {/* Progress bar */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Completion</span>
            <span className="text-lg font-semibold text-foreground">
              {workoutsThisWeek}/{expectedWorkouts}
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.min(completionPercentage, 100)}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {completionPercentage}% of weekly goal
          </p>
        </div>
      </div>
    </Card>
  )
}
