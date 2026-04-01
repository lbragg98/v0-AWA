'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function TodaysWorkoutCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Today&apos;s Workout
        </CardTitle>
        <CardDescription>Scheduled workout for today</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="rounded-full bg-muted p-3">
            <Calendar className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-sm font-medium">No workout scheduled</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a workout plan to get started
          </p>
          <Button variant="outline" size="sm" className="mt-4" disabled>
            <Plus className="mr-2 h-4 w-4" />
            Schedule Workout
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
