'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dumbbell, CheckCircle2 } from 'lucide-react'
import type { ExerciseLibrary } from '@/types/database'

interface ExerciseCardProps {
  exercise: ExerciseLibrary
  isSelected?: boolean
  onSelect?: (exercise: ExerciseLibrary) => void
  onView?: (exercise: ExerciseLibrary) => void
}

export function ExerciseCard({
  exercise,
  isSelected = false,
  onSelect,
  onView,
}: ExerciseCardProps) {
  const difficultyColor = {
    beginner: 'bg-blue-500/10 text-blue-700',
    intermediate: 'bg-amber-500/10 text-amber-700',
    advanced: 'bg-red-500/10 text-red-700',
  }

  return (
    <Card
      className={`relative transition-all ${
        isSelected ? 'ring-2 ring-foreground' : 'hover:shadow-md'
      }`}
    >
      {isSelected && (
        <div className="absolute top-2 right-2 rounded-full bg-foreground p-1">
          <CheckCircle2 className="h-5 w-5 text-background" />
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 flex-1">
            <CardTitle className="text-base line-clamp-2">{exercise.name}</CardTitle>
            {exercise.equipment && (
              <CardDescription className="text-xs">{exercise.equipment}</CardDescription>
            )}
          </div>
          {exercise.is_compound && (
            <Badge variant="secondary" className="flex-shrink-0">
              Compound
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge
            className={difficultyColor[exercise.difficulty as keyof typeof difficultyColor]}
            variant="secondary"
          >
            {exercise.difficulty}
          </Badge>
          {exercise.primary_muscle && (
            <Badge variant="outline" className="text-xs">
              {exercise.primary_muscle}
            </Badge>
          )}
        </div>

        {exercise.instructions && exercise.instructions.length > 0 && (
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">Instructions:</p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {exercise.instructions[0]}
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          {onView && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => onView(exercise)}
            >
              View
            </Button>
          )}
          {onSelect && (
            <Button
              variant={isSelected ? 'default' : 'secondary'}
              size="sm"
              className="flex-1"
              onClick={() => onSelect(exercise)}
            >
              {isSelected ? 'Selected' : 'Select'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
