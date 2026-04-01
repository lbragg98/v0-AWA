'use client'

import { useState } from 'react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ChevronDown, AlertCircle } from 'lucide-react'
import type { RecommendationPreferences } from '@/lib/workout-recommendation'

const MUSCLE_GROUPS = ['chest', 'back', 'shoulders', 'arms', 'legs', 'core']
const SPLITS = [
  { value: 'full_body', label: 'Full Body' },
  { value: 'upper_lower', label: 'Upper/Lower' },
  { value: 'push_pull_legs', label: 'Push/Pull/Legs' },
  { value: 'upper', label: 'Upper Body' },
  { value: 'lower', label: 'Lower Body' },
]
const EQUIPMENT = ['bodyweight', 'dumbbells', 'barbell', 'machine', 'cable']
const ENERGY_LABELS = ['Low', 'Moderate', 'Medium', 'High', 'Maximum']

interface TrainTodayPanelProps {
  defaultEquipment: string[]
  onGenerate: (prefs: RecommendationPreferences) => void
  isLoading: boolean
  readinessState?: string
}

export function TrainTodayPanel({ defaultEquipment, onGenerate, isLoading, readinessState }: TrainTodayPanelProps) {
  const [targetMuscles, setTargetMuscles] = useState<string[]>(['chest'])
  const [timeAvailable, setTimeAvailable] = useState(60)
  const [energyLevel, setEnergyLevel] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [desiredSplit, setDesiredSplit] = useState<'full_body' | 'upper_lower' | 'push_pull_legs' | 'upper' | 'lower'>('full_body')
  const [equipment, setEquipment] = useState<string[]>(defaultEquipment)

  // Adjust defaults based on readiness state
  React.useEffect(() => {
    if (readinessState === 'recovery_focus') {
      setTimeAvailable(30) // Shorter sessions
      setEnergyLevel(2) // Lower intensity
    } else if (readinessState === 'take_it_lighter') {
      setTimeAvailable(45)
      setEnergyLevel(3)
    } else if (readinessState === 'ready_to_push') {
      setTimeAvailable(90) // Longer sessions
      setEnergyLevel(5) // Maximum intensity
    }
  }, [readinessState])

  const handleMuscleToggle = (muscle: string) => {
    setTargetMuscles((prev) =>
      prev.includes(muscle) ? prev.filter((m) => m !== muscle) : [...prev, muscle]
    )
  }

  const handleEquipmentToggle = (equip: string) => {
    setEquipment((prev) =>
      prev.includes(equip) ? prev.filter((e) => e !== equip) : [...prev, equip]
    )
  }

  const handleGenerate = () => {
    onGenerate({
      targetMuscles,
      timeAvailable,
      energyLevel,
      desiredSplit,
      availableEquipment: equipment,
    })
  }

  return (
    <div className="space-y-6">
      {readinessState && readinessState !== 'solid_to_train' && (
        <Card className="border-amber-500/30 bg-amber-500/5 p-3 flex gap-2">
          <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800 dark:text-amber-200">
            <p className="font-semibold">Readiness Suggestions Applied</p>
            <p className="mt-1 opacity-90">
              {readinessState === 'recovery_focus' 
                ? 'Light session recommended - lower intensity and shorter duration'
                : readinessState === 'take_it_lighter'
                ? 'Moderate session suggested - take it easier today'
                : 'You\'re primed for intensity - longer session with higher effort'}
            </p>
          </div>
        </Card>
      )}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Select Target Muscles</h3>
        <div className="flex flex-wrap gap-2">
          {MUSCLE_GROUPS.map((muscle) => (
            <Badge
              key={muscle}
              variant={targetMuscles.includes(muscle) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleMuscleToggle(muscle)}
            >
              {muscle.charAt(0).toUpperCase() + muscle.slice(1)}
            </Badge>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Workout Split</h3>
        <div className="grid grid-cols-2 gap-2">
          {SPLITS.map((split) => (
            <Button
              key={split.value}
              variant={desiredSplit === split.value ? 'default' : 'outline'}
              className="justify-start"
              onClick={() => setDesiredSplit(split.value as any)}
            >
              {split.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4">Available Equipment</h3>
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT.map((equip) => (
            <Badge
              key={equip}
              variant={equipment.includes(equip) ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => handleEquipmentToggle(equip)}
            >
              {equip.charAt(0).toUpperCase() + equip.slice(1)}
            </Badge>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card p-6 space-y-4">
        <div>
          <Label className="text-base font-semibold">Time Available</Label>
          <div className="mt-3 space-y-2">
            <Slider
              value={[timeAvailable]}
              onValueChange={(value) => setTimeAvailable(value[0])}
              min={20}
              max={120}
              step={5}
            />
            <p className="text-sm text-muted-foreground text-right">{timeAvailable} minutes</p>
          </div>
        </div>

        <div>
          <Label className="text-base font-semibold">Energy Level</Label>
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((level) => (
              <Button
                key={level}
                variant={energyLevel === level ? 'default' : 'outline'}
                size="sm"
                className="flex-1"
                onClick={() => setEnergyLevel(level as any)}
              >
                {ENERGY_LABELS[level - 1]}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <Button
        size="lg"
        onClick={handleGenerate}
        disabled={isLoading || targetMuscles.length === 0 || equipment.length === 0}
        className="w-full"
      >
        {isLoading ? 'Generating...' : 'Generate Workout'}
      </Button>
    </div>
  )
}
