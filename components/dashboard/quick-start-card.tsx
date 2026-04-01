'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Play, Calendar, Dumbbell } from 'lucide-react'

export function QuickStartCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Quick Start
        </CardTitle>
        <CardDescription>Jump into a workout</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full justify-start" variant="outline" disabled>
          <Dumbbell className="mr-2 h-4 w-4" />
          Start Empty Workout
          <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
        </Button>
        <Button className="w-full justify-start" variant="outline" disabled>
          <Calendar className="mr-2 h-4 w-4" />
          Follow Today&apos;s Plan
          <span className="ml-auto text-xs text-muted-foreground">Coming soon</span>
        </Button>
      </CardContent>
    </Card>
  )
}
