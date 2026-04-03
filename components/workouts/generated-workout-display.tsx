'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, Target, Zap, Lightbulb } from 'lucide-react'
import type { GeneratedWorkout, GeneratedExercise } from '@/lib/workout-recommendation'

interface GeneratedWorkoutDisplayProps {
  workout: GeneratedWorkout | null
}

export function GeneratedWorkoutDisplay({ workout }: GeneratedWorkoutDisplayProps) {
  if (!workout) return null

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card className="border-border bg-gradient-to-r from-primary/10 to-primary/5 p-6">
        <h2 className="text-2xl font-bold text-foreground">{workout.name}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{workout.smartGoal}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{workout.estimatedDuration} min</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{workout.exercises.length + workout.warmup.length + (workout.finisher ? 1 : 0) + workout.cooldown.length} exercises</span>
          </div>
        </div>
      </Card>

      {/* Reasoning Section */}
      {workout.reasoning && (
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              Why This Workout
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Muscles:</span> {workout.reasoning.selectedMuscles}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Recovery:</span> {workout.reasoning.recoveryStatus}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Equipment:</span> {workout.reasoning.equipmentFit}
            </p>
            <p className="text-muted-foreground">
              <span className="font-medium text-foreground">Duration:</span> {workout.reasoning.timefit}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Warmup Section */}
      {workout.warmup.length > 0 && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Zap className="h-4 w-4 text-yellow-500" />
            Warmup
          </h3>
          {workout.warmup.map((exercise, idx) => (
            <ExerciseCard key={idx} exercise={exercise} />
          ))}
        </div>
      )}

      {/* Main Exercises */}
      {workout.exercises.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Main Workout</h3>
          {workout.exercises.map((exercise, idx) => (
            <ExerciseCard key={idx} exercise={exercise} />
          ))}
        </div>
      )}

      {/* Finisher */}
      {workout.finisher && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Zap className="h-4 w-4 text-red-500" />
            Finisher
          </h3>
          <ExerciseCard exercise={workout.finisher} />
        </div>
      )}

      {/* Cooldown */}
      {workout.cooldown.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-foreground">Cooldown</h3>
          {workout.cooldown.map((exercise: GeneratedExercise, idx: number) => (
            <ExerciseCard key={idx} exercise={exercise} />
          ))}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <Button variant="outline" className="flex-1">
          Save as Plan
        </Button>
        <Button className="flex-1">
          Start Workout
        </Button>
      </div>
    </div>
  )
}

function ExerciseCard({ exercise }: { exercise: GeneratedExercise }) {
  const difficultyColor = exercise.difficulty === 'beginner' ? 'bg-green-100 text-green-800' : exercise.difficulty === 'intermediate' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'

  return (
    <Card className="border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{exercise.name}</h4>
          <p className="mt-1 text-sm text-muted-foreground capitalize">
            {exercise.primaryMuscle}
            {exercise.secondaryMuscles.length > 0 && ` • ${exercise.secondaryMuscles.join(', ')}`}
          </p>
          {exercise.tips && exercise.tips.length > 0 && (
            <ul className="mt-2 space-y-1">
              {exercise.tips.map((tip, idx) => (
                <li key={idx} className="text-xs text-muted-foreground">
                  • {tip}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="text-right space-y-2">
          <Badge variant="secondary" className={difficultyColor}>
            {exercise.difficulty}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 bg-background/50 rounded p-3">
        <div>
          <div className="text-xs font-medium text-muted-foreground">Sets</div>
          <div className="text-lg font-bold text-foreground">{exercise.sets}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Reps</div>
          <div className="text-lg font-bold text-foreground">{exercise.reps}</div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Rest</div>
          <div className="text-lg font-bold text-foreground">{exercise.restSeconds}s</div>
        </div>
        <div>
          <div className="text-xs font-medium text-muted-foreground">Type</div>
          <div className="text-xs font-semibold text-foreground capitalize">{exercise.type}</div>
        </div>
      </div>
    </Card>
  )
}
