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
import { ArrowLeft, Save, Loader2, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import type { ExerciseLibrary } from '@/types/database'

interface PlanBuilderProps {
  exercises: ExerciseLibrary[]
  initialPlan?: any
  isEditing?: boolean
}

export function PlanBuilder({ exercises, initialPlan, isEditing = false }: PlanBuilderProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(0)
  
  // Plan basic info
  const [planForm, setPlanForm] = useState({
    name: initialPlan?.name || '',
    goal: initialPlan?.goal || 'muscle_gain',
  })

  // Workout day info
  const [workoutDay, setWorkoutDay] = useState({
    label: 'Day 1',
    focus: 'Upper Body',
    estimated_minutes: 60,
    smart_goal_text: 'Complete all sets with good form',
  })

  // Validation
  const isStep0Valid = planForm.name.trim() !== ''
  const isStep1Valid = workoutDay.label.trim() !== '' && workoutDay.focus.trim() !== ''

  // Step 1: Basic Info
  const handleBasicInfoNext = () => {
    setError(null)
    if (!isStep0Valid) {
      setError('Please enter a plan name')
      return
    }
    setCurrentStep(1)
  }

  // Save plan
  const handleSavePlan = async () => {
    setError(null)
    setIsLoading(true)
    try {
      if (!isStep1Valid) {
        throw new Error('Please complete all required fields')
      }

      const response = await fetch('/api/workouts/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: {
            name: planForm.name.trim(),
            goal: planForm.goal,
            trainingFrequency: 1,
            experienceLevel: 'beginner',
          },
          workoutDays: [
            {
              dayNumber: 1,
              name: workoutDay.label.trim(),
              targetMuscles: workoutDay.focus.trim() ? [workoutDay.focus.trim()] : [],
              exercises: [],
              estimated_minutes: workoutDay.estimated_minutes,
              smart_goal_text: workoutDay.smart_goal_text.trim(),
            },
          ],
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create plan')
      }

      const { id } = await response.json()
      router.push(`/app/workouts/plans/${id}`)
      router.refresh()
    } catch (err) {
      console.error('[v0] Error saving plan:', err)
      setError(err instanceof Error ? err.message : 'Failed to create plan')
    } finally {
      setIsLoading(false)
    }
  }

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
        <h1 className="text-2xl font-bold">Create Workout Plan</h1>
        <div className="w-20" />
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Step Tabs */}
      <Tabs value={currentStep.toString()} onValueChange={(v) => setCurrentStep(parseInt(v))}>
        <TabsList className="w-full">
          <TabsTrigger value="0" className="flex-1">
            Plan Details
          </TabsTrigger>
          <TabsTrigger value="1" className="flex-1">
            First Workout
          </TabsTrigger>
        </TabsList>

        {/* Step 0: Plan Details */}
        <TabsContent value="0" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan Details</CardTitle>
              <CardDescription>
                Create your basic workout plan with a name and goal
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Shred 2024"
                  value={planForm.name}
                  onChange={(e) => setPlanForm({ ...planForm, name: e.target.value })}
                />
                {!isStep0Valid && planForm.name === '' && (
                  <p className="text-xs text-destructive">Plan name is required</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal">Primary Goal *</Label>
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

              <Button className="w-full mt-6" onClick={handleBasicInfoNext} disabled={!isStep0Valid}>
                Continue to First Workout
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Step 1: Workout Day */}
        <TabsContent value="1" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>First Workout Day</CardTitle>
              <CardDescription>
                Set up your first workout day. You can add more exercises later.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="label">Workout Label *</Label>
                <Input
                  id="label"
                  placeholder="e.g., Day 1, Chest Day, Monday"
                  value={workoutDay.label}
                  onChange={(e) => setWorkoutDay({ ...workoutDay, label: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="focus">Muscle Focus *</Label>
                <Input
                  id="focus"
                  placeholder="e.g., Upper Body, Chest & Back, Legs"
                  value={workoutDay.focus}
                  onChange={(e) => setWorkoutDay({ ...workoutDay, focus: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Estimated Duration (minutes)</Label>
                <Input
                  id="duration"
                  type="number"
                  min="10"
                  max="300"
                  value={workoutDay.estimated_minutes}
                  onChange={(e) => setWorkoutDay({ ...workoutDay, estimated_minutes: parseInt(e.target.value) || 60 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="goal-text">Workout Goal</Label>
                <Textarea
                  id="goal-text"
                  placeholder="e.g., Complete all sets with good form"
                  value={workoutDay.smart_goal_text}
                  onChange={(e) => setWorkoutDay({ ...workoutDay, smart_goal_text: e.target.value })}
                  className="resize-none"
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex gap-2 justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(0)}
              disabled={isLoading}
            >
              Back
            </Button>
            <Button
              onClick={handleSavePlan}
              disabled={isLoading || !isStep1Valid}
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Create Plan
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
