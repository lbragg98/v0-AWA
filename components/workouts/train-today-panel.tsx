'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { ChevronDown } from 'lucide-react'
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
}

export function TrainTodayPanel({ defaultEquipment, onGenerate, isLoading }: TrainTodayPanelProps) {
  const [targetMuscles, setTargetMuscles] = useState<string[]>(['chest'])
  const [timeAvailable, setTimeAvailable] = useState(60)
  const [energyLevel, setEnergyLevel] = useState<1 | 2 | 3 | 4 | 5>(3)
  const [desiredSplit, setDesiredSplit] = useState<'full_body' | 'upper_lower' | 'push_pull_legs' | 'upper' | 'lower'>('full_body')
  const [equipment, setEquipment] = useState<string[]>(defaultEquipment)

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
