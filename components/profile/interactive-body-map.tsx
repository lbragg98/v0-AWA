'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { TierLegend } from './tier-legend'
import { MuscleDetailDrawer } from './muscle-detail-drawer'
import { TIER_CONFIG, type MuscleTier } from '@/lib/muscle-colors'
import { RotateCcw } from 'lucide-react'

interface MuscleProgress {
  id: string
  muscleGroupId: string
  muscleName: string
  displayName: string
  xp: number
  level: number
  tier: MuscleTier
  weeklyVolume: number
  strengthScore: number
  consistencyScore: number
  recoveryScore: number
  lastTrainedAt: string | null
  bodySide: 'front' | 'back' | 'both'
}

interface InteractiveBodyMapProps {
  muscleProgress: MuscleProgress[]
}

export function InteractiveBodyMap({ muscleProgress }: InteractiveBodyMapProps) {
  const [view, setView] = useState<'front' | 'back'>('front')
  const [selectedMuscle, setSelectedMuscle] = useState<MuscleProgress | null>(null)
  const [hoveredMuscle, setHoveredMuscle] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const getMuscle = (slug: string) => muscleProgress.find((m) => m.muscleName === slug)

  const getMuscleColor = (slug: string) => {
    const muscle = getMuscle(slug)
    if (!muscle) return TIER_CONFIG.unawakened.fillColor
    return TIER_CONFIG[muscle.tier].fillColor
  }

  const getMuscleGlow = (slug: string) => {
    const muscle = getMuscle(slug)
    if (!muscle) return 'none'
    const config = TIER_CONFIG[muscle.tier]
    if (config.glowColor === 'transparent') return 'none'
    const isSelected = selectedMuscle?.muscleName === slug
    const isHovered = hoveredMuscle === slug
    const intensity = isSelected ? 28 : isHovered ? 18 : 10
    return `0 0 ${intensity}px ${config.glowColor}`
  }

  const getMuscleOpacity = (slug: string) => {
    const muscle = getMuscle(slug)
    if (!muscle) return 0.28
    const base = 0.42 + Math.min(muscle.level / 120, 0.34)
    if (selectedMuscle?.muscleName === slug) return Math.min(1, base + 0.18)
    if (hoveredMuscle === slug) return Math.min(1, base + 0.1)
    return base
  }

  const handleMuscleClick = (slug: string) => {
    const muscle = getMuscle(slug)
    if (muscle) {
      setSelectedMuscle(muscle)
      setDrawerOpen(true)
    }
  }

  const createMuscleInteractionProps = (slug: string) => ({
    style: {
      filter: getMuscleGlow(slug),
      cursor: 'pointer',
      opacity: getMuscleOpacity(slug),
    },
    onMouseEnter: () => setHoveredMuscle(slug),
    onMouseLeave: () => setHoveredMuscle(null),
    onClick: () => handleMuscleClick(slug),
    className: 'transition-all duration-300 hover:brightness-125',
  })

  return (
    <>
      <Card className="overflow-hidden border-primary/15 bg-[linear-gradient(160deg,rgba(17,28,44,0.95),rgba(12,18,28,0.98))]">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-primary/75">Biomech Map</p>
              <CardTitle className="text-lg">Muscle Progression</CardTitle>
            </div>
            <Tabs value={view} onValueChange={(v) => setView(v as 'front' | 'back')}>
              <TabsList className="h-10 rounded-2xl border border-white/8 bg-white/[0.05] p-1">
                <TabsTrigger value="front" className="px-3 text-xs">Front</TabsTrigger>
                <TabsTrigger value="back" className="px-3 text-xs">Back</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="relative flex justify-center py-4">
            <svg
              viewBox="0 0 200 400"
              className="h-auto w-full max-w-[280px]"
              style={{ filter: 'drop-shadow(0 14px 30px rgba(4, 9, 18, 0.45))' }}
            >
              <ellipse cx="100" cy="30" rx="25" ry="28" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
              <rect x="90" y="55" width="20" height="15" fill="hsl(var(--muted))" />

              {view === 'front' ? (
                <>
                  <ellipse cx="55" cy="85" rx="20" ry="12" fill={getMuscleColor('shoulders')} {...createMuscleInteractionProps('shoulders')} />
                  <ellipse cx="145" cy="85" rx="20" ry="12" fill={getMuscleColor('shoulders')} {...createMuscleInteractionProps('shoulders')} />
                  <path d="M 60 75 Q 100 70 140 75 L 140 120 Q 100 130 60 120 Z" fill={getMuscleColor('chest')} {...createMuscleInteractionProps('chest')} />
                  <rect x="70" y="125" width="60" height="70" rx="5" fill={getMuscleColor('core')} {...createMuscleInteractionProps('core')} />
                  <ellipse cx="40" cy="120" rx="12" ry="30" fill={getMuscleColor('biceps')} {...createMuscleInteractionProps('biceps')} />
                  <ellipse cx="160" cy="120" rx="12" ry="30" fill={getMuscleColor('biceps')} {...createMuscleInteractionProps('biceps')} />
                  <ellipse cx="35" cy="175" rx="10" ry="25" fill={getMuscleColor('forearms')} {...createMuscleInteractionProps('forearms')} />
                  <ellipse cx="165" cy="175" rx="10" ry="25" fill={getMuscleColor('forearms')} {...createMuscleInteractionProps('forearms')} />
                  <ellipse cx="80" cy="260" rx="18" ry="55" fill={getMuscleColor('quadriceps')} {...createMuscleInteractionProps('quadriceps')} />
                  <ellipse cx="120" cy="260" rx="18" ry="55" fill={getMuscleColor('quadriceps')} {...createMuscleInteractionProps('quadriceps')} />
                  <ellipse cx="80" cy="355" rx="12" ry="35" fill="hsl(var(--muted))" />
                  <ellipse cx="120" cy="355" rx="12" ry="35" fill="hsl(var(--muted))" />
                </>
              ) : (
                <>
                  <ellipse cx="55" cy="85" rx="20" ry="12" fill={getMuscleColor('shoulders')} {...createMuscleInteractionProps('shoulders')} />
                  <ellipse cx="145" cy="85" rx="20" ry="12" fill={getMuscleColor('shoulders')} {...createMuscleInteractionProps('shoulders')} />
                  <path d="M 60 75 Q 100 70 140 75 L 135 180 Q 100 185 65 180 Z" fill={getMuscleColor('back')} {...createMuscleInteractionProps('back')} />
                  <ellipse cx="40" cy="120" rx="12" ry="30" fill={getMuscleColor('triceps')} {...createMuscleInteractionProps('triceps')} />
                  <ellipse cx="160" cy="120" rx="12" ry="30" fill={getMuscleColor('triceps')} {...createMuscleInteractionProps('triceps')} />
                  <ellipse cx="35" cy="175" rx="10" ry="25" fill="hsl(var(--muted))" />
                  <ellipse cx="165" cy="175" rx="10" ry="25" fill="hsl(var(--muted))" />
                  <ellipse cx="85" cy="205" rx="22" ry="18" fill={getMuscleColor('glutes')} {...createMuscleInteractionProps('glutes')} />
                  <ellipse cx="115" cy="205" rx="22" ry="18" fill={getMuscleColor('glutes')} {...createMuscleInteractionProps('glutes')} />
                  <ellipse cx="80" cy="275" rx="16" ry="45" fill={getMuscleColor('hamstrings')} {...createMuscleInteractionProps('hamstrings')} />
                  <ellipse cx="120" cy="275" rx="16" ry="45" fill={getMuscleColor('hamstrings')} {...createMuscleInteractionProps('hamstrings')} />
                  <ellipse cx="80" cy="355" rx="12" ry="35" fill={getMuscleColor('calves')} {...createMuscleInteractionProps('calves')} />
                  <ellipse cx="120" cy="355" rx="12" ry="35" fill={getMuscleColor('calves')} {...createMuscleInteractionProps('calves')} />
                </>
              )}
            </svg>

            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2 border border-white/8 bg-white/[0.06]"
              onClick={() => setView(view === 'front' ? 'back' : 'front')}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 border-t pt-4">
            <TierLegend />
          </div>

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
              <p className="text-lg font-semibold">
                {muscleProgress.filter((m) => m.tier !== 'unawakened').length}
              </p>
              <p className="text-xs text-muted-foreground">Awakened</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
              <p className="text-lg font-semibold">
                {muscleProgress.reduce((sum, m) => sum + m.xp, 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </div>
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] p-3">
              <p className="text-lg font-semibold">
                {muscleProgress.filter((m) => ['beast', 'elite', 'god_tier'].includes(m.tier)).length}
              </p>
              <p className="text-xs text-muted-foreground">Elite+</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <MuscleDetailDrawer
        muscle={selectedMuscle}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        allMuscles={muscleProgress}
      />
    </>
  )
}
