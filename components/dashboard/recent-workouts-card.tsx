'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dumbbell, Clock, Weight, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { CompletedWorkout } from '@/types/database'

interface RecentWorkoutsCardProps {
  workouts: CompletedWorkout[]
}

export function RecentWorkoutsCard({ workouts }: RecentWorkoutsCardProps) {
  if (workouts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Dumbbell className="h-5 w-5" />
            Recent Workouts
          </CardTitle>
          <CardDescription>Your latest training sessions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3">
              <Dumbbell className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No workouts yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Complete your first workout to see it here
            </p>
            <Button variant="outline" size="sm" className="mt-4" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Start Workout
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Dumbbell className="h-5 w-5" />
          Recent Workouts
        </CardTitle>
        <CardDescription>Your latest training sessions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {workouts.slice(0, 5).map((workout) => (
          <div 
            key={workout.id} 
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <div className="space-y-1">
              <p className="text-sm font-medium">{workout.name}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {workout.duration_minutes || 0} min
                </span>
                <span className="flex items-center gap-1">
                  <Weight className="h-3 w-3" />
                  {workout.total_volume.toLocaleString()} lbs
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">
                {formatRelativeDate(workout.started_at)}
              </p>
              {workout.effort_level && (
                <p className="text-xs text-muted-foreground">
                  RPE {workout.effort_level}/10
                </p>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

  if (diffInDays === 0) return 'Today'
  if (diffInDays === 1) return 'Yesterday'
  if (diffInDays < 7) return `${diffInDays} days ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
