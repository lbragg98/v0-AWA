'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import type { PersonalRecord } from '@/types/database'

interface PersonalRecordsCardProps {
  personalRecords: PersonalRecord[]
}

export function PersonalRecordsCard({ personalRecords }: PersonalRecordsCardProps) {
  if (personalRecords.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Personal Records
          </CardTitle>
          <CardDescription>Your best lifts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="rounded-full bg-muted p-3">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="mt-4 text-sm font-medium">No PRs yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Set a personal record by logging a workout
            </p>
            <Button variant="outline" size="sm" className="mt-4" disabled>
              <Plus className="mr-2 h-4 w-4" />
              Log Workout
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
          <TrendingUp className="h-5 w-5" />
          Personal Records
        </CardTitle>
        <CardDescription>Your top {Math.min(personalRecords.length, 5)} lifts</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {personalRecords.slice(0, 5).map((pr) => (
          <div 
            key={pr.id} 
            className="flex items-center justify-between rounded-lg border border-border p-3"
          >
            <div className="flex-1">
              <p className="text-sm font-medium truncate">
                {pr.exercise_name || 'Exercise'}
              </p>
              <p className="text-xs text-muted-foreground">
                {pr.reps} {pr.reps === 1 ? 'rep' : 'reps'}
              </p>
            </div>
            <div className="text-right">
              <Badge variant="secondary" className="mb-1">
                {pr.weight} {pr.weight_unit}
              </Badge>
              <p className="text-xs text-muted-foreground">
                {formatRelativeDate(pr.achieved_at)}
              </p>
            </div>
          </div>
        ))}
        {personalRecords.length > 5 && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            +{personalRecords.length - 5} more PRs
          </p>
        )}
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
  if (diffInDays < 7) return `${diffInDays}d ago`
  
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
