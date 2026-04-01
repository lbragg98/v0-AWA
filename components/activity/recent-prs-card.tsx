import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp } from 'lucide-react'
import type { PersonalRecord } from '@/types/database'

interface RecentPRsCardProps {
  personalRecords: PersonalRecord[]
}

export function RecentPRsCard({ personalRecords }: RecentPRsCardProps) {
  if (personalRecords.length === 0) {
    return (
      <Card className="p-6 text-center">
        <TrendingUp className="mx-auto h-10 w-10 text-muted-foreground/40" />
        <h3 className="mt-3 font-semibold text-foreground">No PRs yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Hit a new personal record to see it here
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 font-semibold text-foreground flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Recent PRs
      </h3>

      <div className="space-y-3">
        {personalRecords.slice(0, 5).map((pr) => (
          <div key={pr.id} className="flex items-start justify-between pb-3 border-b last:border-b-0">
            <div className="min-w-0">
              <p className="font-medium text-foreground truncate">
                {pr.exercise_name || 'Exercise'}
              </p>
              <p className="text-xs text-muted-foreground">
                {pr.weight} {pr.weight_unit} × {pr.reps}
              </p>
            </div>
            {pr.estimated_1rm && (
              <Badge variant="secondary" className="ml-2 flex-shrink-0">
                1RM: {pr.estimated_1rm.toFixed(0)} {pr.weight_unit}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
