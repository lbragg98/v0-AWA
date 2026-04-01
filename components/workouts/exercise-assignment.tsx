'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Spinner } from '@/components/ui/spinner'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ExerciseLibraryBrowser } from './exercise-library-browser'
import { Plus, AlertCircle, Loader2 } from 'lucide-react'
import type { ExerciseLibrary, WorkoutExercise } from '@/types/database'

interface ExerciseAssignmentProps {
  workoutDayId: string
  exercises: ExerciseLibrary[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onExercisesAdded?: (exercises: WorkoutExercise[]) => void
  isLoading?: boolean
}

interface ExerciseForm {
  exerciseId: string
  sets: number
  repsMin: number
  repsMax: number
  restSeconds: number
  notes: string
  section: 'warmup' | 'main' | 'accessory' | 'finisher' | 'cooldown'
}

export function ExerciseAssignment({
  workoutDayId,
  exercises,
  open,
  onOpenChange,
  onExercisesAdded,
  isLoading = false,
}: ExerciseAssignmentProps) {
  const [selectedExercise, setSelectedExercise] = useState<ExerciseLibrary | null>(null)
  const [form, setForm] = useState<ExerciseForm>({
    exerciseId: '',
    sets: 3,
    repsMin: 8,
    repsMax: 12,
    restSeconds: 90,
    notes: '',
    section: 'main',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleExerciseSelect = (exercise: ExerciseLibrary) => {
    setSelectedExercise(exercise)
    setForm((prev) => ({
      ...prev,
      exerciseId: exercise.id,
    }))
    setError(null)
  }

  const handleAddExercise = async () => {
    if (!selectedExercise || !form.exerciseId) {
      setError('Please select an exercise')
      return
    }

    if (form.sets < 1 || form.repsMin < 1 || form.repsMax < form.repsMin) {
      setError('Please enter valid sets and reps')
      return
    }

    setError(null)
    setIsSaving(true)

    try {
      const response = await fetch('/api/workouts/exercises', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          workoutDayId,
          exerciseId: form.exerciseId,
          sets: form.sets,
          repsMin: form.repsMin,
          repsMax: form.repsMax,
          restSeconds: form.restSeconds,
          notes: form.notes || null,
          exerciseType: form.section,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add exercise')
      }

      const { exercises: savedExercises } = await response.json()
      
      setSuccessMessage(`${selectedExercise.name} added successfully!`)
      setSelectedExercise(null)
      setForm({
        exerciseId: '',
        sets: 3,
        repsMin: 8,
        repsMax: 12,
        restSeconds: 90,
        notes: '',
        section: 'main',
      })

      if (onExercisesAdded) {
        onExercisesAdded(savedExercises)
      }

      // Close dialog after short delay
      setTimeout(() => {
        onOpenChange(false)
        setSuccessMessage(null)
      }, 1500)
    } catch (err) {
      console.error('[v0] Error adding exercise:', err)
      setError(err instanceof Error ? err.message : 'Failed to add exercise')
    } finally {
      setIsSaving(false)
    }
  }

  const selectedExerciseObj = exercises.find((e) => e.id === form.exerciseId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Exercise to Workout</DialogTitle>
          <DialogDescription>
            Select an exercise and set the prescribed volume
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {successMessage && (
            <Alert className="bg-green-500/10 border-green-500/20">
              <AlertDescription className="text-green-700 dark:text-green-400">
                {successMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Exercise Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Select Exercise</Label>
              {selectedExerciseObj && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSelectedExercise(null)
                    setForm((prev) => ({ ...prev, exerciseId: '' }))
                  }}
                >
                  Change
                </Button>
              )}
            </div>

            {!selectedExerciseObj ? (
              <div className="max-h-96 overflow-y-auto border rounded-lg p-4">
                <ExerciseLibraryBrowser
                  exercises={exercises}
                  onSelect={handleExerciseSelect}
                  selectable={true}
                />
              </div>
            ) : (
              <Card className="bg-muted/30">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{selectedExerciseObj.name}</h3>
                    {selectedExerciseObj.primary_muscle && (
                      <p className="text-sm text-muted-foreground">
                        Primary: {selectedExerciseObj.primary_muscle}
                      </p>
                    )}
                    {selectedExerciseObj.equipment && (
                      <p className="text-sm text-muted-foreground">
                        Equipment: {selectedExerciseObj.equipment}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Exercise Prescribed Values */}
          {selectedExerciseObj && (
            <div className="space-y-4 border-t pt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sets">Sets</Label>
                  <Input
                    id="sets"
                    type="number"
                    min="1"
                    max="20"
                    value={form.sets}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        sets: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repsMin">Reps Min</Label>
                  <Input
                    id="repsMin"
                    type="number"
                    min="1"
                    max="100"
                    value={form.repsMin}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        repsMin: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="repsMax">Reps Max</Label>
                  <Input
                    id="repsMax"
                    type="number"
                    min="1"
                    max="100"
                    value={form.repsMax}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        repsMax: parseInt(e.target.value) || 1,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rest">Rest (sec)</Label>
                  <Input
                    id="rest"
                    type="number"
                    min="0"
                    max="300"
                    step="15"
                    value={form.restSeconds}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        restSeconds: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="section">Section</Label>
                <select
                  id="section"
                  value={form.section}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      section: e.target.value as any,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-md border border-input bg-background"
                >
                  <option value="warmup">Warmup</option>
                  <option value="main">Main</option>
                  <option value="accessory">Accessory</option>
                  <option value="finisher">Finisher</option>
                  <option value="cooldown">Cooldown</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  placeholder="e.g., Full range of motion, slow eccentric"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>

              <Button
                onClick={handleAddExercise}
                disabled={isSaving || !selectedExerciseObj}
                className="w-full"
                size="lg"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Exercise
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
