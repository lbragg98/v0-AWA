'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { SetLogger } from './set-logger'
import { AlertCircle, Clock, Zap, Activity, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import type { WorkoutDay, WorkoutExercise, ExerciseLibrary, CompletedWorkout } from '@/types/database'

interface CompletedSet {
  setNumber: number
  reps: number
  weight: number | null
  weightUnit: 'kg' | 'lbs'
  rpe: number
  restSeconds: number
}

interface WorkoutLoggerProps {
  workoutDay: WorkoutDay & {
    workout_exercises?: (WorkoutExercise & { exercise?: ExerciseLibrary })[]
  }
  planId: string
}

export function WorkoutLogger({ workoutDay, planId }: WorkoutLoggerProps) {
  const router = useRouter()
  const [currentExerciseIdx, setCurrentExerciseIdx] = useState(0)
  const [startTime] = useState(new Date())
  const [completedSets, setCompletedSets] = useState<Record<number, CompletedSet[]>>({})
  const [workoutDetails, setWorkoutDetails] = useState({
    effortRating: 7,
    energyRating: 7,
    sorenessRating: 0,
    notes: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  const exercises = workoutDay.workout_exercises || []
  const allExercisesComplete = exercises.every((_, idx) => completedSets[idx])
  const currentExercise = exercises[currentExerciseIdx]

  const handleSetComplete = (sets: CompletedSet[]) => {
    setCompletedSets({
      ...completedSets,
      [currentExerciseIdx]: sets,
    })

    // Move to next exercise or show summary
    if (currentExerciseIdx < exercises.length - 1) {
      setCurrentExerciseIdx(currentExerciseIdx + 1)
    } else {
      setShowSummary(true)
    }
  }

  const calculateDuration = () => {
    const endTime = new Date()
    return Math.round((endTime.getTime() - startTime.getTime()) / 60000)
  }

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true)

      const durationMinutes = calculateDuration()
      const totalSets = Object.values(completedSets).flat().length
      const totalReps = Object.values(completedSets)
        .flat()
        .reduce((sum, set) => sum + set.reps, 0)
      const totalVolume = Object.values(completedSets)
        .flat()
        .reduce((sum, set) => sum + (set.weight ? set.weight * set.reps : 0), 0)

      const response = await fetch('/api/workouts/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutDayId: workoutDay.id,
          planId,
          workoutName: workoutDay.name,
          completedAt: new Date().toISOString(),
          durationMinutes,
          effortLevel: workoutDetails.effortRating,
          energyLevel: workoutDetails.energyRating,
          notes: workoutDetails.notes,
          totalSets,
          totalReps,
          totalVolume,
          completedSets: Object.entries(completedSets).map(([exerciseIdx, sets]) => ({
            exerciseId: exercises[parseInt(exerciseIdx)].exercise_id,
            sets: sets.map((set) => ({
              setNumber: set.setNumber,
              reps: set.reps,
              weight: set.weight,
              weightUnit: set.weightUnit,
              rpe: set.rpe,
              restSeconds: set.restSeconds,
            })),
          })),
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save workout')
      }

      toast.success('Workout saved successfully!')
      router.push('/app/dashboard')
    } catch (error) {
      console.error('Error saving workout:', error)
      toast.error('Failed to save workout. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentExercise && !showSummary) {
    return null
  }

  // Show summary before submission
  if (showSummary) {
    const totalSets = Object.values(completedSets).flat().length
    const totalReps = Object.values(completedSets)
      .flat()
      .reduce((sum, set) => sum + set.reps, 0)
    const durationMinutes = calculateDuration()

    return (
      <div className="space-y-6">
        <Card className="border-green-500/50 bg-green-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
              Workout Complete!
            </CardTitle>
            <CardDescription>Review your workout details before saving</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-xs text-muted-foreground">Duration</div>
                <div className="text-2xl font-bold mt-1">{durationMinutes}m</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-xs text-muted-foreground">Total Sets</div>
                <div className="text-2xl font-bold mt-1">{totalSets}</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-xs text-muted-foreground">Total Reps</div>
                <div className="text-2xl font-bold mt-1">{totalReps}</div>
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <div className="text-xs text-muted-foreground">Exercises</div>
                <div className="text-2xl font-bold mt-1">{exercises.length}</div>
              </div>
            </div>

            {/* Ratings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Effort Rating
                </label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                    <button
                      key={rating}
                      onClick={() =>
                        setWorkoutDetails({ ...workoutDetails, effortRating: rating })
                      }
                      className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                        workoutDetails.effortRating === rating
                          ? 'bg-foreground text-background'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {rating}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium flex items-center gap-1">
                  <Activity className="h-4 w-4" />
                  Energy Level
                </label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() =>
                        setWorkoutDetails({ ...workoutDetails, energyRating: level })
                      }
                      className={`flex-1 py-1 rounded text-xs font-medium transition-colors ${
                        workoutDetails.energyRating === level
                          ? 'bg-foreground text-background'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Soreness</label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  value={workoutDetails.sorenessRating}
                  onChange={(e) =>
                    setWorkoutDetails({
                      ...workoutDetails,
                      sorenessRating: parseInt(e.target.value) || 0,
                    })
                  }
                  className="mt-1"
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium">Notes</label>
              <Textarea
                placeholder="How did the workout feel? Any observations?"
                value={workoutDetails.notes}
                onChange={(e) =>
                  setWorkoutDetails({ ...workoutDetails, notes: e.target.value })
                }
                className="mt-1"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowSummary(false)}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Saving...' : 'Save Workout'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Exercise {currentExerciseIdx + 1} of {exercises.length}
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {calculateDuration()}m
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
          <div
            className="h-full bg-foreground transition-all"
            style={{
              width: `${((Object.keys(completedSets).length) / exercises.length) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Current Exercise */}
      <SetLogger
        key={currentExerciseIdx}
        exercise={currentExercise}
        onComplete={handleSetComplete}
        isLoading={isSubmitting}
      />

      {/* Exercise List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {exercises.map((ex, idx) => {
              const isComplete = !!completedSets[idx]
              const isCurrent = idx === currentExerciseIdx

              return (
                <button
                  key={idx}
                  onClick={() => {
                    if (isComplete || isCurrent) {
                      setCurrentExerciseIdx(idx)
                      setShowSummary(false)
                    }
                  }}
                  disabled={!isComplete && !isCurrent}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    isCurrent
                      ? 'border-foreground bg-muted'
                      : isComplete
                        ? 'border-green-500/50 bg-green-500/5 cursor-pointer hover:bg-green-500/10'
                        : 'border-muted opacity-50 cursor-not-allowed'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {ex.exercise?.name || 'Exercise'}
                    </span>
                    {isComplete && (
                      <span className="text-xs text-green-600 font-medium">✓ Complete</span>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
