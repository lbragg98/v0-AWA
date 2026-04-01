// Tier color mapping for muscle progression visualization
// Colors transition from cool (unawakened) to warm (god_tier)

export type MuscleTier = 
  | 'unawakened' 
  | 'weakling' 
  | 'novice' 
  | 'builder' 
  | 'beast' 
  | 'elite' 
  | 'god_tier'

export interface TierConfig {
  name: string
  label: string
  color: string
  fillColor: string
  glowColor: string
  minXP: number
  maxXP: number
  level: number
}

export const TIER_CONFIG: Record<MuscleTier, TierConfig> = {
  unawakened: {
    name: 'unawakened',
    label: 'Unawakened',
    color: 'hsl(220, 10%, 40%)',
    fillColor: 'hsl(220, 10%, 25%)',
    glowColor: 'transparent',
    minXP: 0,
    maxXP: 99,
    level: 0,
  },
  weakling: {
    name: 'weakling',
    label: 'Weakling',
    color: 'hsl(200, 60%, 50%)',
    fillColor: 'hsl(200, 60%, 35%)',
    glowColor: 'hsla(200, 60%, 50%, 0.3)',
    minXP: 100,
    maxXP: 499,
    level: 1,
  },
  novice: {
    name: 'novice',
    label: 'Novice',
    color: 'hsl(160, 70%, 45%)',
    fillColor: 'hsl(160, 70%, 30%)',
    glowColor: 'hsla(160, 70%, 45%, 0.3)',
    minXP: 500,
    maxXP: 1499,
    level: 2,
  },
  builder: {
    name: 'builder',
    label: 'Builder',
    color: 'hsl(45, 90%, 50%)',
    fillColor: 'hsl(45, 90%, 35%)',
    glowColor: 'hsla(45, 90%, 50%, 0.4)',
    minXP: 1500,
    maxXP: 3999,
    level: 3,
  },
  beast: {
    name: 'beast',
    label: 'Beast',
    color: 'hsl(25, 95%, 55%)',
    fillColor: 'hsl(25, 95%, 40%)',
    glowColor: 'hsla(25, 95%, 55%, 0.5)',
    minXP: 4000,
    maxXP: 7999,
    level: 4,
  },
  elite: {
    name: 'elite',
    label: 'Elite',
    color: 'hsl(340, 85%, 55%)',
    fillColor: 'hsl(340, 85%, 40%)',
    glowColor: 'hsla(340, 85%, 55%, 0.5)',
    minXP: 8000,
    maxXP: 14999,
    level: 5,
  },
  god_tier: {
    name: 'god_tier',
    label: 'God Tier',
    color: 'hsl(280, 100%, 65%)',
    fillColor: 'hsl(280, 100%, 50%)',
    glowColor: 'hsla(280, 100%, 65%, 0.6)',
    minXP: 15000,
    maxXP: Infinity,
    level: 6,
  },
}

export const TIER_ORDER: MuscleTier[] = [
  'unawakened',
  'weakling',
  'novice',
  'builder',
  'beast',
  'elite',
  'god_tier',
]

export function getTierFromXP(xp: number): MuscleTier {
  for (const tier of [...TIER_ORDER].reverse()) {
    if (xp >= TIER_CONFIG[tier].minXP) {
      return tier
    }
  }
  return 'unawakened'
}

export function getXPProgressInTier(xp: number, tier: MuscleTier): number {
  const config = TIER_CONFIG[tier]
  const tierXP = xp - config.minXP
  const tierRange = config.maxXP === Infinity ? 10000 : config.maxXP - config.minXP
  return Math.min(100, (tierXP / tierRange) * 100)
}

export function getNextTier(tier: MuscleTier): MuscleTier | null {
  const index = TIER_ORDER.indexOf(tier)
  if (index < TIER_ORDER.length - 1) {
    return TIER_ORDER[index + 1]
  }
  return null
}
