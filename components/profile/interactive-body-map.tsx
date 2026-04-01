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
  const [drawerOpen, setDrawerOpen] = useState(false)

  const getMuscleColor = (slug: string) => {
    const muscle = muscleProgress.find(m => m.muscleName === slug)
    if (!muscle) return TIER_CONFIG.unawakened.fillColor
    return TIER_CONFIG[muscle.tier].fillColor
  }

  const getMuscleGlow = (slug: string) => {
    const muscle = muscleProgress.find(m => m.muscleName === slug)
    if (!muscle) return 'none'
    const config = TIER_CONFIG[muscle.tier]
    if (config.glowColor === 'transparent') return 'none'
    return `0 0 15px ${config.glowColor}`
  }

  const handleMuscleClick = (slug: string) => {
    const muscle = muscleProgress.find(m => m.muscleName === slug)
    if (muscle) {
      setSelectedMuscle(muscle)
      setDrawerOpen(true)
    }
  }

  const frontMuscles = ['chest', 'shoulders', 'biceps', 'forearms', 'core', 'quadriceps']
  const backMuscles = ['back', 'triceps', 'shoulders', 'glutes', 'hamstrings', 'calves']

  const visibleMuscles = view === 'front' ? frontMuscles : backMuscles

  return (
    <>
      <Card className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Muscle Progression</CardTitle>
            <Tabs value={view} onValueChange={(v) => setView(v as 'front' | 'back')}>
              <TabsList className="h-8">
                <TabsTrigger value="front" className="text-xs px-3">Front</TabsTrigger>
                <TabsTrigger value="back" className="text-xs px-3">Back</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          {/* Body Map SVG */}
          <div className="relative flex justify-center py-4">
            <svg
              viewBox="0 0 200 400"
              className="w-full max-w-[280px] h-auto"
              style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
            >
              {/* Body outline */}
              <ellipse cx="100" cy="30" rx="25" ry="28" fill="hsl(var(--muted))" stroke="hsl(var(--border))" strokeWidth="1" />
              
              {/* Neck */}
              <rect x="90" y="55" width="20" height="15" fill="hsl(var(--muted))" />
              
              {view === 'front' ? (
                <>
                  {/* Front View */}
                  {/* Shoulders */}
                  <ellipse 
                    cx="55" cy="85" rx="20" ry="12"
                    fill={getMuscleColor('shoulders')}
                    style={{ filter: getMuscleGlow('shoulders'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('shoulders')}
                    className="transition-all hover:brightness-125"
                  />
                  <ellipse 
                    cx="145" cy="85" rx="20" ry="12"
                    fill={getMuscleColor('shoulders')}
                    style={{ filter: getMuscleGlow('shoulders'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('shoulders')}
                    className="transition-all hover:brightness-125"
                  />
                  
                  {/* Chest */}
                  <path
                    d="M 60 75 Q 100 70 140 75 L 140 120 Q 100 130 60 120 Z"
                    fill={getMuscleColor('chest')}
                    style={{ filter: getMuscleGlow('chest'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('chest')}
                    className="transition-all hover:brightness-125"
                  />
                  
                  {/* Core */}
                  <rect
                    x="70" y="125" width="60" height="70" rx="5"
                    fill={getMuscleColor('core')}
                    style={{ filter: getMuscleGlow('core'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('core')}
                    className="transition-all hover:brightness-125"
                  />
                  
                  {/* Biceps */}
                  <ellipse 
                    cx="40" cy="120" rx="12" ry="30"
                    fill={getMuscleColor('biceps')}
                    style={{ filter: getMuscleGlow('biceps'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('biceps')}
                    className="transition-all hover:brightness-125"
                  />
                  <ellipse 
                    cx="160" cy="120" rx="12" ry="30"
                    fill={getMuscleColor('biceps')}
                    style={{ filter: getMuscleGlow('biceps'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('biceps')}
                    className="transition-all hover:brightness-125"
                  />
                  
                  {/* Forearms */}
                  <ellipse 
                    cx="35" cy="175" rx="10" ry="25"
                    fill={getMuscleColor('forearms')}
                    style={{ filter: getMuscleGlow('forearms'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('forearms')}
                    className="transition-all hover:brightness-125"
                  />
                  <ellipse 
                    cx="165" cy="175" rx="10" ry="25"
                    fill={getMuscleColor('forearms')}
                    style={{ filter: getMuscleGlow('forearms'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('forearms')}
                    className="transition-all hover:brightness-125"
                  />
                  
                  {/* Quadriceps */}
                  <ellipse 
                    cx="80" cy="260" rx="18" ry="55"
                    fill={getMuscleColor('quadriceps')}
                    style={{ filter: getMuscleGlow('quadriceps'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('quadriceps')}
                    className="transition-all hover:brightness-125"
                  />
                  <ellipse 
                    cx="120" cy="260" rx="18" ry="55"
                    fill={getMuscleColor('quadriceps')}
                    style={{ filter: getMuscleGlow('quadriceps'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('quadriceps')}
                    className="transition-all hover:brightness-125"
                  />
                  
                  {/* Lower legs (placeholder) */}
                  <ellipse cx="80" cy="355" rx="12" ry="35" fill="hsl(var(--muted))" />
                  <ellipse cx="120" cy="355" rx="12" ry="35" fill="hsl(var(--muted))" />
                </>
              ) : (
                <>
                  {/* Back View */}
                  {/* Shoulders */}
                  <ellipse 
                    cx="55" cy="85" rx="20" ry="12"
                    fill={getMuscleColor('shoulders')}
                    style={{ filter: getMuscleGlow('shoulders'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('shoulders')}
                    className="transition-all hover:brightness-125"
                  />
                  <ellipse 
                    cx="145" cy="85" rx="20" ry="12"
                    fill={getMuscleColor('shoulders')}
                    style={{ filter: getMuscleGlow('shoulders'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('shoulders')}
                    className="transition-all hover:brightness-125"
                  />
                  
                  {/* Back */}
                  <path
                    d="M 60 75 Q 100 70 140 75 L 135 180 Q 100 185 65 180 Z"
                    fill={getMuscleColor('back')}
                    style={{ filter: getMuscleGlow('back'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('back')}
                    className="transition-all hover:brightness-125"
                  />
                  
                  {/* Triceps */}
                  <ellipse 
                    cx="40" cy="120" rx="12" ry="30"
                    fill={getMuscleColor('triceps')}
                    style={{ filter: getMuscleGlow('triceps'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('triceps')}
                    className="transition-all hover:brightness-125"
                  />
                  <ellipse 
                    cx="160" cy="120" rx="12" ry="30"
                    fill={getMuscleColor('triceps')}
                    style={{ filter: getMuscleGlow('triceps'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('triceps')}
                    className="transition-all hover:brightness-125"
                  />
                  
                  {/* Lower arms placeholder */}
                  <ellipse cx="35" cy="175" rx="10" ry="25" fill="hsl(var(--muted))" />
                  <ellipse cx="165" cy="175" rx="10" ry="25" fill="hsl(var(--muted))" />
                  
                  {/* Glutes */}
                  <ellipse 
                    cx="85" cy="205" rx="22" ry="18"
                    fill={getMuscleColor('glutes')}
                    style={{ filter: getMuscleGlow('glutes'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('glutes')}
                    className="transition-all hover:brightness-125"
                  />
                  <ellipse 
                    cx="115" cy="205" rx="22" ry="18"
                    fill={getMuscleColor('glutes')}
                    style={{ filter: getMuscleGlow('glutes'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('glutes')}
                    className="transition-all hover:brightness-125"
                  />
                  
                  {/* Hamstrings */}
                  <ellipse 
                    cx="80" cy="275" rx="16" ry="45"
                    fill={getMuscleColor('hamstrings')}
                    style={{ filter: getMuscleGlow('hamstrings'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('hamstrings')}
                    className="transition-all hover:brightness-125"
                  />
                  <ellipse 
                    cx="120" cy="275" rx="16" ry="45"
                    fill={getMuscleColor('hamstrings')}
                    style={{ filter: getMuscleGlow('hamstrings'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('hamstrings')}
                    className="transition-all hover:brightness-125"
                  />
                  
                  {/* Calves */}
                  <ellipse 
                    cx="80" cy="355" rx="12" ry="35"
                    fill={getMuscleColor('calves')}
                    style={{ filter: getMuscleGlow('calves'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('calves')}
                    className="transition-all hover:brightness-125"
                  />
                  <ellipse 
                    cx="120" cy="355" rx="12" ry="35"
                    fill={getMuscleColor('calves')}
                    style={{ filter: getMuscleGlow('calves'), cursor: 'pointer' }}
                    onClick={() => handleMuscleClick('calves')}
                    className="transition-all hover:brightness-125"
                  />
                </>
              )}
            </svg>
            
            {/* Flip button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute bottom-2 right-2"
              onClick={() => setView(view === 'front' ? 'back' : 'front')}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Legend */}
          <div className="mt-4 pt-4 border-t">
            <TierLegend />
          </div>
          
          {/* Quick stats */}
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-semibold">
                {muscleProgress.filter(m => m.tier !== 'unawakened').length}
              </p>
              <p className="text-xs text-muted-foreground">Awakened</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-semibold">
                {muscleProgress.reduce((sum, m) => sum + m.xp, 0).toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground">Total XP</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/50">
              <p className="text-lg font-semibold">
                {muscleProgress.filter(m => ['beast', 'elite', 'god_tier'].includes(m.tier)).length}
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
      />
    </>
  )
}
