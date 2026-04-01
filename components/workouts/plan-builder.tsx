'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ExerciseLibraryBrowser } from './exercise-library-browser'
import { ExerciseCard } from './exercise-card'
import { ArrowLeft, Save, Plus, X, Trash2 } from 'lucide-react'
import Link from 'next/link'
import type { ExerciseLibrary, WorkoutDay } from '@/types/database'
import type { CreateWorkoutPlanForm, WorkoutExerciseForm } from '@/types/workouts'

interface PlanBuilderProps {
  exercises: ExerciseLibrary[]
  initialPlan?: any
  isEditing?: boolean
}

export function PlanBuilder({ exercises, initialPlan, isEditing = false }: PlanBuilderProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(0)
  
  // Plan basic info
  const [planForm, setPlanForm] = useState<CreateWorkoutPlanForm>({
    name: initialPlan?.name || '',
    goal: initialPlan?.goal || 'muscle_gain',
    trainingFrequency: initialPlan?.days_per_week || 3,
    experienceLevel: initialPlan?.experience_level || 'beginner',
  })

  // Workout days
  const [workoutDays, setWorkoutDays] = useState<Array<{
    id: string
    dayNumber: number
    name: string
    targetMuscles: string[]
    exercises: WorkoutExerciseForm[]
  }>>(() => {
    if (initialPlan?.days) {
      return initialPlan.days.map((day: any, idx: number) => ({
        id: day.id || `day-${idx}`,
        dayNumber: day.day_number,
        name: day.name,
        targetMuscles: day.target_muscles || [],
        exercises: day.exercises || [],
      }))
    }
    // Initialize empty days based on training frequency
    return Array.from({ length: initialPlan?.days_per_week || 3 }, (_, i) => ({
      id: `day-${i}`,
      dayNumber: i + 1,
      name: `Day ${i + 1}`,
      targetMuscles: [],
      exercises: [],
    }))
  })

  const [selectedDayIdx, setSelectedDayIdx] = useState(0)
  const [showExercisePicker, setShowExercisePicker] = useState(false)

  // Step 1: Basic Info
  const handleBasicInfoNext = () => {
    if (!planForm.name) {
      alert('Please enter a plan name')
      return
    }
    setCurrentStep(1)
  }

  // Step 2: Setup Days
  const handleDaysChange = (index: number, field: string, value: any) => {
    const updated = [...workoutDays]
    updated[index] = { ...updated[index], [field]: value }
    setWorkoutDays(updated)
  }

  const handleAddExerciseToDay = (exercise: ExerciseLibrary) => {
    const updated = [...workoutDays]
    updated[selectedDayIdx].exercises.push({
      exerciseId: exercise.id,
      sets: 3,
      repsMin: 8,
      repsMax: 12,
      restSeconds: 90,
      exerciseType: 'main',
    })
    setWorkoutDays(updated)
    setShowExercisePicker(false)
  }

  const handleRemoveExercise = (dayIdx: number, exIdx: number) => {
    const updated = [...workoutDays]
    updated[dayIdx].exercises.splice(exIdx, 1)
    setWorkoutDays(updated)
  }

  const handleUpdateExercise = (dayIdx: number, exIdx: number, field: string, value: any) => {
    const updated = [...workoutDays]
    updated[dayIdx].exercises[exIdx] = {
      ...updated[dayIdx].exercises[exIdx],
      [field]: value,
    }
    setWorkoutDays(updated)
  }

  // Save plan
  const handleSavePlan = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(isEditing ? `/api/workouts/plans/${initialPlan.id}` : '/api/workouts/plans', {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: planForm,
          workoutDays,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to save plan')
      }

      const { id } = await response.json()
      router.push(`/app/workouts`)
      router.refresh()
    } catch (error) {
      console.error('Error saving plan:', error)
      alert('Failed to save plan')
    } finally {
      setIsLoading(false)
    }
  }

  const currentDay = workoutDays[selectedDayIdx]
  const selectedExerciseIds = currentDay?.exercises.map((ex) => ex.exerciseId) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" asChild>
          <Link href="/app/workouts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? 'Edit Plan' : 'New Plan'}</h1>
        <div className="w-20" />
      </div>

      {/* Step Indicator */}
      <Tabs value={currentStep.toString()} onValueChange={(v) => setCurrentStep(parseInt(v))}>
        <TabsList className="w-full">
          <TabsTrigger value="0" className="flex-1">
            Plan Details
          </TabsTrigger>
          <TabsTrigger value="1" className="flex-1">
            Workout Days
          </TabsTrigger>
        </TabsList>

        {/* Step 0: Basic Info */}
        <TabsContent value="0" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
              <CardDescription>
                Set up the basic information for your workout plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Shred 2024"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="goal">Primary Goal</Label>
                  <Select value={planForm.goal} onValueChange={(v: any) => setPlanForm({ ...planForm, goal: v })}>
                    <SelectTrigger id="goal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fat_loss">Fat Loss</SelectItem>
                      <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                      <SelectItem value="strength">Strength</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                      <SelectItem value="general_fitness">General Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="frequency">Training Days Per Week</Label>
                  <Select value={planForm.trainingFrequency.toString()} onValueChange={(v) => {
                    const freq = parseInt(v)
                    setPlanForm({ ...planForm, trainingFrequency: freq })
                    // Add/remove days as needed
                    const currentDays = [...workoutDays].slice(0, freq)
                    const newDays = Array.from({ length: freq }, (_, i) => 
                      currentDays[i] || {
                        id: `day-${i}`,
                        dayNumber: i + 1,
                        name: `Day ${i + 1}`,
                        targetMuscles: [],
                        exercises: [],
                      }
                    )
                    setWorkoutDays(newDays)
                  }}>
                    <SelectTrigger id="frequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 7 }, (_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1} days/week
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="experience">Experience Level</Label>
                <Select value={planForm.experienceLevel} onValueChange={(v: any) => setPlanForm({ ...planForm, experienceLevel: v })}>
                  <SelectTrigger id="experience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button className="w-full mt-6" onClick={handleBasicInfoNext}>
                Continue to Workout Days
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 1: Workout Days */}
        <TabsContent value="1" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Days List */}
            <div className="space-y-2">
              {workoutDays.map((day, idx) => (
                <Button
                  key={day.id}
                  variant={selectedDayIdx === idx ? 'default' : 'outline'}
                  className="w-full justify-start"
                  onClick={() => setSelectedDayIdx(idx)}
                >
                  {day.name}
                  <span className="ml-auto text-xs opacity-60">
                    {day.exercises.length} ex
                  </span>
                </Button>
              ))}
            </div>

            {/* Day Details */}
            {currentDay && (
              <div className="lg:col-span-2 space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>{currentDay.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor={`day-name-${selectedDayIdx}`}>Day Name</Label>
                      <Input
                        id={`day-name-${selectedDayIdx}`}
                        value={currentDay.name}
                        onChange={(e) => handleDaysChange(selectedDayIdx, 'name', e.target.value)}
                      />
                    </div>

                    {/* Exercises */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>Exercises ({currentDay.exercises.length})</Label>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowExercisePicker(!showExercisePicker)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>

                      {showExercisePicker && (
                        <Card className="p-4 border-dashed">
                          <ExerciseLibraryBrowser
                            exercises={exercises}
                            selectedExercises={selectedExerciseIds}
                            onSelect={handleAddExerciseToDay}
                            selectable
                          />
                        </Card>
                      )}

                      {currentDay.exercises.length > 0 ? (
                        <div className="space-y-2">
                          {currentDay.exercises.map((ex, exIdx) => {
                            const exercise = exercises.find((e) => e.id === ex.exerciseId)
                            return (
                              <Card key={exIdx} className="p-3">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="font-medium text-sm">{exercise?.name}</p>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => handleRemoveExercise(selectedDayIdx, exIdx)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-xs">
                                    <div>
                                      <Label>Sets</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={ex.sets}
                                        onChange={(e) =>
                                          handleUpdateExercise(selectedDayIdx, exIdx, 'sets', parseInt(e.target.value))
                                        }
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                    <div>
                                      <Label>Reps</Label>
                                      <Input
                                        type="number"
                                        min="1"
                                        value={`${ex.repsMin}-${ex.repsMax}`}
                                        onChange={(e) => {
                                          const [min, max] = e.target.value.split('-').map(Number)
                                          handleUpdateExercise(selectedDayIdx, exIdx, 'repsMin', min)
                                          handleUpdateExercise(selectedDayIdx, exIdx, 'repsMax', max)
                                        }}
                                        className="h-8 text-xs"
                                      />
                                    </div>
                                  </div>
                                </div>
                              </Card>
                            )
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No exercises added yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Save Button */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(0)}
            >
              Back
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={isLoading || !planForm.name}
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save Plan'}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
