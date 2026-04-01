'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { TIER_CONFIG, getXPProgressInTier, getNextTier, type MuscleTier } from '@/lib/muscle-colors'
import { Flame, Zap, Target, Heart, Calendar } from 'lucide-react'

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
}

interface MuscleDetailDrawerProps {
  muscle: MuscleProgress | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MuscleDetailDrawer({ muscle, open, onOpenChange }: MuscleDetailDrawerProps) {
  if (!muscle) return null

  const tierConfig = TIER_CONFIG[muscle.tier]
  const progress = getXPProgressInTier(muscle.xp, muscle.tier)
  const nextTier = getNextTier(muscle.tier)
  const nextTierConfig = nextTier ? TIER_CONFIG[nextTier] : null

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never'
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return 'Today'
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    return date.toLocaleDateString()
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ 
                backgroundColor: tierConfig.fillColor,
                boxShadow: `0 0 20px ${tierConfig.glowColor}`
              }}
            >
              <Flame className="w-6 h-6" style={{ color: tierConfig.color }} />
            </div>
            <div>
              <SheetTitle className="text-xl">{muscle.displayName}</SheetTitle>
              <Badge 
                variant="outline" 
                className="mt-1"
                style={{ 
                  borderColor: tierConfig.color,
                  color: tierConfig.color 
                }}
              >
                {tierConfig.label}
              </Badge>
            </div>
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* XP Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Level {muscle.level} Progress</span>
              <span className="font-medium">{muscle.xp.toLocaleString()} XP</span>
            </div>
            <Progress 
              value={progress} 
              className="h-3"
              style={{ 
                ['--progress-background' as string]: tierConfig.fillColor,
                ['--progress-foreground' as string]: tierConfig.color 
              }}
            />
            {nextTierConfig && (
              <p className="text-xs text-muted-foreground">
                {(nextTierConfig.minXP - muscle.xp).toLocaleString()} XP to {nextTierConfig.label}
              </p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={<Zap className="w-4 h-4 text-yellow-500" />}
              label="Strength"
              value={`${muscle.strengthScore.toFixed(1)}`}
              max={100}
              current={muscle.strengthScore}
            />
            <StatCard
              icon={<Target className="w-4 h-4 text-blue-500" />}
              label="Consistency"
              value={`${muscle.consistencyScore.toFixed(1)}`}
              max={100}
              current={muscle.consistencyScore}
            />
            <StatCard
              icon={<Heart className="w-4 h-4 text-red-500" />}
              label="Recovery"
              value={`${muscle.recoveryScore.toFixed(1)}`}
              max={100}
              current={muscle.recoveryScore}
            />
            <StatCard
              icon={<Flame className="w-4 h-4 text-orange-500" />}
              label="Weekly Volume"
              value={muscle.weeklyVolume.toLocaleString()}
              subtitle="sets"
            />
          </div>

          {/* Last Trained */}
          <div className="flex items-center gap-3 p-4 rounded-lg bg-muted/50">
            <Calendar className="w-5 h-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Last Trained</p>
              <p className="text-sm text-muted-foreground">{formatDate(muscle.lastTrainedAt)}</p>
            </div>
          </div>

          {/* Tier Progression */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Tier Progression</h4>
            <div className="flex gap-1">
              {Object.entries(TIER_CONFIG).map(([key, config]) => {
                const isActive = key === muscle.tier
                const isPast = TIER_CONFIG[muscle.tier].level > config.level
                return (
                  <div
                    key={key}
                    className="flex-1 h-2 rounded-full transition-all"
                    style={{
                      backgroundColor: isPast || isActive ? config.color : 'hsl(var(--muted))',
                      opacity: isPast ? 0.5 : 1,
                    }}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function StatCard({ 
  icon, 
  label, 
  value, 
  max, 
  current,
  subtitle 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  max?: number
  current?: number
  subtitle?: string
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 space-y-2">
      <div className="flex items-center gap-2">
        {icon}
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-lg font-semibold">{value}</span>
        {subtitle && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </div>
      {max !== undefined && current !== undefined && (
        <Progress value={(current / max) * 100} className="h-1" />
      )}
    </div>
  )
}
