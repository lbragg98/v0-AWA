'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Calendar, Dumbbell, Clock } from 'lucide-react'
import Link from 'next/link'
import type { WorkoutPlan } from '@/types/database'

interface PlanCardProps {
  plan: WorkoutPlan
  daysCount?: number
}

export function PlanCard({ plan, daysCount = 0 }: PlanCardProps) {
  const experienceBadgeColor = {
    beginner: 'bg-blue-500/10 text-blue-700',
    intermediate: 'bg-amber-500/10 text-amber-700',
    advanced: 'bg-red-500/10 text-red-700',
  }

  const goalBadgeColor: Record<string, string> = {
    fat_loss: 'bg-orange-500/10 text-orange-700',
    muscle_gain: 'bg-green-500/10 text-green-700',
    strength: 'bg-purple-500/10 text-purple-700',
    endurance: 'bg-cyan-500/10 text-cyan-700',
    general_fitness: 'bg-slate-500/10 text-slate-700',
  }

  return (
    <Card className="group hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-lg group-hover:text-foreground/80 transition-colors">
              {plan.name}
            </CardTitle>
            {plan.description && (
              <CardDescription className="line-clamp-2">{plan.description}</CardDescription>
            )}
          </div>
          {plan.is_active && (
            <Badge variant="default" className="flex-shrink-0">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {plan.goal && (
            <Badge
              className={`${goalBadgeColor[plan.goal] || 'bg-slate-500/10 text-slate-700'} text-xs`}
              variant="secondary"
            >
              {plan.goal.replace('_', ' ')}
            </Badge>
          )}
          <Badge
            className={`${experienceBadgeColor[plan.experience_level as keyof typeof experienceBadgeColor]} text-xs`}
            variant="secondary"
          >
            {plan.experience_level}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{plan.days_per_week} days/week</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Dumbbell className="h-4 w-4" />
            <span>{daysCount} workouts</span>
          </div>
        </div>

        <div className="pt-2 flex gap-2">
          <Button size="sm" className="flex-1" asChild>
            <Link href={`/app/workouts/plans/${plan.id}/start`}>Start Workout</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/app/workouts/plans/${plan.id}`}>View</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
