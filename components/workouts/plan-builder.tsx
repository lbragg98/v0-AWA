'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ArrowLeft, Save, Loader2, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { SPLIT_TEMPLATES, AVAILABLE_BODY_PARTS } from '@/types/workouts'
import type { BodyPart } from '@/types/workouts'
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

  // Step 1: Basic info
  const [planName, setPlanName] = useState(initialPlan?.name || '')
  const [planGoal, setPlanGoal] = useState(initialPlan?.goal || 'muscle_gain')

  // Step 2: Days per week selection
  const [daysPerWeek, setDaysPerWeek] = useState(3)

  // Step 3: Split selection
  const [selectedSplit, setSelectedSplit] = useState<string>('full_body')

  // Step 4: Custom day customization
  const [customDays, setCustomDays] = useState(
    SPLIT_TEMPLATES[selectedSplit as keyof typeof SPLIT_TEMPLATES]?.days || []
  )

  // Validation
  const isStep1Valid = planName.trim() !== ''
  const isStep2Valid = daysPerWeek >= 1 && daysPerWeek <= 7
  const isStep3Valid = selectedSplit !== ''
  const isStep4Valid = customDays.length > 0

  const handleNext = () => {
    setError(null)
    if (currentStep === 0 && !isStep1Valid) {
      setError('Please enter a plan name')
      return
    }
    if (currentStep === 1 && !isStep2Valid) {
      setError('Please select a valid number of days')
      return
    }
    setCurrentStep(currentStep + 1)
  }

  const handlePrev = () => {
    setCurrentStep(Math.max(0, currentStep - 1))
  }

  const handleSplitSelect = (splitId: string) => {
    setSelectedSplit(splitId)
    const template = SPLIT_TEMPLATES[splitId as keyof typeof SPLIT_TEMPLATES]
    if (template) {
      setCustomDays(template.days.slice(0, daysPerWeek))
      setDaysPerWeek(template.daysPerWeek)
    }
  }

  const updateCustomDay = (
    dayIndex: number,
    field: 'label' | 'bodyParts' | 'estimatedMinutes',
    value: any
  ) => {
    const updated = [...customDays]
    if (field === 'bodyParts') {
      updated[dayIndex].bodyParts = value
    } else {
      ;(updated[dayIndex] as any)[field] = value
    }
    setCustomDays(updated)
  }

  const toggleBodyPart = (dayIndex: number, bodyPart: BodyPart) => {
    const day = customDays[dayIndex]
    if (day.bodyParts.includes(bodyPart)) {
      updateCustomDay(dayIndex, 'bodyParts', day.bodyParts.filter((b) => b !== bodyPart))
    } else {
      updateCustomDay(dayIndex, 'bodyParts', [...day.bodyParts, bodyPart])
    }
  }

  const handleSavePlan = async () => {
    setError(null)
    setIsLoading(true)
    try {
      if (!isStep1Valid || !isStep4Valid) {
        throw new Error('Please complete all steps')
      }

      const response = await fetch('/api/workouts/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: {
            name: planName.trim(),
            goal: planGoal,
            trainingFrequency: customDays.length,
            experienceLevel: 'beginner',
            splitType: selectedSplit,
          },
          workoutDays: customDays.map((day, idx) => ({
            dayNumber: idx + 1,
            name: day.label,
            targetMuscles: day.bodyParts,
            exercises: [],
            estimated_minutes: day.estimatedMinutes,
          })),
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
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" asChild size="sm">
            <Link href="/app/workouts">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Create Workout Plan</h1>
            <p className="text-muted-foreground mt-1">Step {currentStep + 1} of 4</p>
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Steps indicator */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">Setup Steps</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { step: 0, label: 'Plan Name', desc: 'Name your plan' },
                { step: 1, label: 'Training Days', desc: 'How many days/week?' },
                { step: 2, label: 'Select Split', desc: 'Choose a template' },
                { step: 3, label: 'Customize Days', desc: 'Adjust each day' },
              ].map((item) => (
                <div
                  key={item.step}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    currentStep === item.step
                      ? 'bg-primary/10 border border-primary'
                      : currentStep > item.step
                      ? 'bg-green-100/50 dark:bg-green-900/20'
                      : 'bg-muted/30'
                  }`}
                >
                  <div
                    className={`rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold ${
                      currentStep >= item.step ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}
                  >
                    {item.step + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="lg:col-span-2">
          {/* Step 1: Plan Name */}
          {currentStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Plan Name & Goal</CardTitle>
                <CardDescription>Give your plan a name and choose your primary goal</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="plan-name">Plan Name</Label>
                  <Input
                    id="plan-name"
                    placeholder="e.g., Summer Strength, Beginner Full Body"
                    value={planName}
                    onChange={(e) => setPlanName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plan-goal">Primary Goal</Label>
                  <Select value={planGoal} onValueChange={setPlanGoal}>
                    <SelectTrigger id="plan-goal">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="muscle_gain">Muscle Gain (Hypertrophy)</SelectItem>
                      <SelectItem value="strength">Strength & Power</SelectItem>
                      <SelectItem value="fat_loss">Fat Loss</SelectItem>
                      <SelectItem value="endurance">Endurance</SelectItem>
                      <SelectItem value="general_fitness">General Fitness</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Days per Week */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Training Days Per Week</CardTitle>
                <CardDescription>How many days per week do you want to train?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-4 gap-2">
                  {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                    <Button
                      key={num}
                      variant={daysPerWeek === num ? 'default' : 'outline'}
                      onClick={() => setDaysPerWeek(num)}
                      className="h-12 text-lg font-semibold"
                    >
                      {num}x
                    </Button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {daysPerWeek} days per week allows for adequate recovery between sessions
                </p>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Select Split Template */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Choose a Split Template</CardTitle>
                <CardDescription>
                  Select a proven split pattern for {daysPerWeek} days/week training
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.values(SPLIT_TEMPLATES)
                  .filter((template) => template.daysPerWeek === daysPerWeek)
                  .map((template) => (
                    <Button
                      key={template.id}
                      variant={selectedSplit === template.id ? 'default' : 'outline'}
                      onClick={() => handleSplitSelect(template.id)}
                      className="w-full justify-start h-auto p-4 text-left"
                    >
                      <div className="flex flex-col items-start gap-3 w-full">
                        <div className="flex items-center justify-between w-full">
                          <p className="font-semibold text-base">{template.name}</p>
                          <Badge variant={selectedSplit === template.id ? 'default' : 'secondary'}>
                            {template.days.length} days
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{template.description}</p>
                        <div className="flex gap-2 flex-wrap">
                          {template.days.slice(0, 3).map((day, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {day.label.split(' ')[0]}
                            </Badge>
                          ))}
                          {template.days.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{template.days.length - 3}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Button>
                  ))}
              </CardContent>
            </Card>
          )}

          {/* Step 4: Customize Days */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Customize Your Training Days</CardTitle>
                <CardDescription>
                  Select which body parts to focus on each day. You can have multiple days focus on the same muscle groups.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {customDays.map((day, dayIdx) => (
                  <div key={dayIdx} className="border rounded-lg p-4 space-y-4 bg-muted/30">
                    {/* Day Header */}
                    <div className="flex items-end gap-3">
                      <div className="flex-1">
                        <Label className="text-xs text-muted-foreground mb-1 block">Day {dayIdx + 1}</Label>
                        <Input
                          placeholder="e.g., Upper Power, Leg Day"
                          value={day.label}
                          onChange={(e) => updateCustomDay(dayIdx, 'label', e.target.value)}
                          className="font-semibold"
                        />
                      </div>
                      <div className="flex-shrink-0 w-24">
                        <Label className="text-xs text-muted-foreground mb-1 block">Duration</Label>
                        <div className="flex items-center">
                          <Input
                            type="number"
                            min="30"
                            max="180"
                            value={day.estimatedMinutes}
                            onChange={(e) => updateCustomDay(dayIdx, 'estimatedMinutes', parseInt(e.target.value))}
                            className="text-center"
                          />
                          <span className="text-xs text-muted-foreground ml-1">min</span>
                        </div>
                      </div>
                    </div>

                    {/* Body Parts Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-medium">Focus Muscles</Label>
                      <p className="text-xs text-muted-foreground">
                        {day.bodyParts.length === 0
                          ? 'Select at least one muscle group'
                          : `${day.bodyParts.length} muscle group${day.bodyParts.length !== 1 ? 's' : ''} selected`}
                      </p>
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {(AVAILABLE_BODY_PARTS as unknown as BodyPart[]).map((bodyPart) => (
                          <Button
                            key={bodyPart}
                            variant={day.bodyParts.includes(bodyPart) ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => toggleBodyPart(dayIdx, bodyPart)}
                            className={`text-xs capitalize h-9 font-medium transition-colors ${
                              day.bodyParts.includes(bodyPart)
                                ? ''
                                : 'hover:bg-muted hover:border-foreground/30'
                            }`}
                          >
                            {bodyPart === 'abs' || bodyPart === 'lats' ? bodyPart.toUpperCase() : bodyPart}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-6">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrev}>
                <ChevronLeft className="mr-2 h-4 w-4" />
                Previous
              </Button>
            )}

            {currentStep < 3 && (
              <Button onClick={handleNext}>
                Next
                <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {currentStep === 3 && (
              <Button onClick={handleSavePlan} disabled={isLoading || !isStep4Valid}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Plan...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Create Plan
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
