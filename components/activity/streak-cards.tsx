import { Card } from '@/components/ui/card'
import { Flame } from 'lucide-react'
import type { UserStreak } from '@/types/database'

interface StreakCardsProps {
  streak: UserStreak | null
}

export function StreakCards({ streak }: StreakCardsProps) {
  const current = streak?.current_streak || 0
  const longest = streak?.longest_streak || 0

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="surface-glow-active border-primary/25 bg-[linear-gradient(140deg,rgba(18,33,54,0.98),rgba(13,18,27,0.98))] p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-primary/18 bg-primary/12 p-3">
            <Flame className="h-7 w-7 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Current Streak</p>
            <p className="text-2xl font-bold text-foreground">{current} days</p>
          </div>
        </div>
      </Card>

      <Card className="border-white/8 bg-[linear-gradient(140deg,rgba(17,24,39,0.98),rgba(11,15,20,0.98))] p-5">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl border border-white/8 bg-white/[0.06] p-3">
            <Flame className="h-7 w-7 text-primary/85" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Longest Streak</p>
            <p className="text-2xl font-bold text-foreground">{longest} days</p>
          </div>
        </div>
      </Card>
    </div>
  )
}
