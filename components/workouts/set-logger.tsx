'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { RestTimer } from './rest-timer'
import { ChevronDown, Check } from 'lucide-react'
import type { WorkoutExercise, ExerciseLibrary } from '@/types/database'

interface CompletedSet {
  setNumber: number
  reps: number
  weight: number | null
  weightUnit: 'kg' | 'lbs'
  rpe: number
  restSeconds: number
}

interface SetLoggerProps {
  exercise: WorkoutExercise & { exercise?: ExerciseLibrary }
  onComplete: (sets: CompletedSet[]) => void
  isLoading?: boolean
}

export function SetLogger({ exercise, onComplete, isLoading = false }: SetLoggerProps) {
  const [sets, setSets] = useState<CompletedSet[]>(
    Array.from({ length: exercise.sets }, (_, i) => ({
      setNumber: i + 1,
      reps: exercise.reps_max,
      weight: null,
      weightUnit: 'lbs' as const,
      rpe: 7,
      restSeconds: exercise.rest_seconds,
    }))
  )
  const [expandedSet, setExpandedSet] = useState<number | null>(0)
  const [showRestTimer, setShowRestTimer] = useState(false)
  const [completedSetIndex, setCompletedSetIndex] = useState<number | null>(null)

  const handleSetChange = (setIndex: number, field: keyof CompletedSet, value: any) => {
    const newSets = [...sets]
    newSets[setIndex] = { ...newSets[setIndex], [field]: value }
    setSets(newSets)
  }

  const handleSetLogged = (setIndex: number) => {
    // Show rest timer after set is completed (has reps logged)
    if (sets[setIndex].reps > 0) {
      setCompletedSetIndex(setIndex)
      setShowRestTimer(true)
    }
  }

  const exerciseName = exercise.exercise?.name || 'Exercise'
  const allComplete = sets.every(s => s.reps > 0)

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{exerciseName}</CardTitle>
            <CardDescription className="mt-1">
              {exercise.sets} sets × {exercise.reps_min}-{exercise.reps_max} reps
            </CardDescription>
          </div>
          {allComplete && <Badge className="bg-green-500">Complete</Badge>}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Rest Timer Modal */}
        {showRestTimer && completedSetIndex !== null && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
              <RestTimer
                initialSeconds={sets[completedSetIndex]?.restSeconds || exercise.rest_seconds || 90}
                onComplete={() => setShowRestTimer(false)}
                autoStart={true}
              />
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => setShowRestTimer(false)}
              >
                Start Next Set
              </Button>
            </div>
          </div>
        )}

        {/* Sets */}
        <div className="space-y-2">
          {sets.map((set, idx) => (
            <div key={idx} className="border rounded-lg overflow-hidden">
              <button
                onClick={() => setExpandedSet(expandedSet === idx ? null : idx)}
                className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Set {set.setNumber}</Badge>
                  <span className="text-sm text-foreground">
                    {set.weight ? `${set.weight} ${set.weightUnit}` : 'No weight'} × {set.reps} reps
                  </span>
                  <span className="text-xs text-muted-foreground">RPE {set.rpe}</span>
                </div>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    expandedSet === idx ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {expandedSet === idx && (
                <div className="p-4 bg-background space-y-4 border-t">
                  {/* Reps */}
                  <div>
                    <label className="text-sm font-medium">Reps</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={set.reps}
                      onChange={(e) =>
                        handleSetChange(idx, 'reps', parseInt(e.target.value) || 0)
                      }
                      className="mt-1"
                    />
                  </div>

                  {/* Weight */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium">Weight</label>
                      <Input
                        type="number"
                        min="0"
                        step="0.5"
                        value={set.weight || ''}
                        onChange={(e) =>
                          handleSetChange(
                            idx,
                            'weight',
                            e.target.value ? parseFloat(e.target.value) : null
                          )
                        }
                        placeholder="0"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Unit</label>
                      <select
                        value={set.weightUnit}
                        onChange={(e) =>
                          handleSetChange(idx, 'weightUnit', e.target.value as 'kg' | 'lbs')
                        }
                        className="w-full mt-1 px-3 py-2 border rounded-md bg-background text-foreground text-sm"
                      >
                        <option value="lbs">lbs</option>
                        <option value="kg">kg</option>
                      </select>
                    </div>
                  </div>

                  {/* RPE */}
                  <div>
                    <label className="text-sm font-medium">RPE (1-10)</label>
                    <div className="flex gap-2 mt-2">
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
                        <button
                          key={rpe}
                          onClick={() => handleSetChange(idx, 'rpe', rpe)}
                          className={`flex-1 py-2 rounded text-sm font-medium transition-colors ${
                            set.rpe === rpe
                              ? 'bg-foreground text-background'
                              : 'bg-muted text-foreground hover:bg-muted/80'
                          }`}
                        >
                          {rpe}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Rest */}
                  <div>
                    <label className="text-sm font-medium">Rest (seconds)</label>
                    <Input
                      type="number"
                      min="0"
                      step="15"
                      value={set.restSeconds}
                      onChange={(e) =>
                        handleSetChange(idx, 'restSeconds', parseInt(e.target.value) || 0)
                      }
                      className="mt-1"
                    />
                  </div>

                  {/* Log Set Button */}
                  <Button
                    onClick={() => handleSetLogged(idx)}
                    disabled={set.reps === 0}
                    variant="outline"
                    className="w-full"
                  >
                    Log Set {set.setNumber}
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Complete Button */}
        <Button
          onClick={() => onComplete(sets)}
          disabled={!allComplete || isLoading}
          className="w-full"
        >
          <Check className="mr-2 h-4 w-4" />
          Complete Exercise
        </Button>
      </CardContent>
    </Card>
  )
}
