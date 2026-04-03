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
          Hit a new personal record to see it here.
        </p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4 flex items-center gap-2 font-semibold text-foreground">
        <TrendingUp className="h-5 w-5 text-primary" />
        Recent PRs
      </h3>

      <div className="space-y-3">
        {personalRecords.slice(0, 5).map((pr) => (
          <div key={pr.id} className="flex items-start justify-between rounded-2xl border border-white/8 bg-white/[0.04] p-3">
            <div className="min-w-0">
              <p className="truncate font-medium text-foreground">
                {pr.exercise_name || 'Exercise'}
              </p>
              <p className="text-xs text-muted-foreground">
                {pr.weight} {pr.weight_unit} x {pr.reps}
              </p>
            </div>
            {pr.estimated_1rm && (
              <Badge variant="secondary" className="ml-2 flex-shrink-0 border-primary/15 bg-primary/10 text-primary">
                1RM: {pr.estimated_1rm.toFixed(0)} {pr.weight_unit}
              </Badge>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}
