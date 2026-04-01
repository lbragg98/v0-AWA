import Link from 'next/link'
import { formatDistanceToNow, format } from 'date-fns'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dumbbell, Clock, Zap, ChevronRight } from 'lucide-react'
import type { CompletedWorkout } from '@/types/database'

interface CompletedWorkoutsFeedProps {
  workouts: CompletedWorkout[]
}

export function CompletedWorkoutsFeed({ workouts }: CompletedWorkoutsFeedProps) {
  if (workouts.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Dumbbell className="mx-auto h-12 w-12 text-muted-foreground/40" />
        <h3 className="mt-4 font-semibold text-foreground">No workouts yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Start your fitness journey by completing your first workout!
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {workouts.map((workout) => (
        <Link key={workout.id} href={`/app/activity/${workout.id}`}>
          <Card className="p-4 hover:shadow-md hover:border-foreground/20 transition-all cursor-pointer">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-semibold text-foreground">{workout.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(workout.started_at), { addSuffix: true })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {workout.effort_level && (
                    <Badge variant="secondary">
                      {workout.effort_level}/10 effort
                    </Badge>
                  )}
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{workout.duration_minutes || '—'} min</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Zap className="h-4 w-4" />
                  <span>{workout.total_sets} sets</span>
                </div>
                <div className="text-muted-foreground">
                  {workout.total_reps} reps
                </div>
              </div>

              {/* Volume */}
              {workout.total_volume > 0 && (
                <div className="text-xs text-muted-foreground">
                  {(workout.total_volume / 1000).toFixed(1)}k lbs total volume
                </div>
              )}

              {/* Notes */}
              {workout.notes && (
                <p className="text-sm text-muted-foreground italic">"{workout.notes}"</p>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
