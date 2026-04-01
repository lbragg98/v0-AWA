'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Clock, Play, Pause, RotateCcw, SkipForward, Plus, Minus } from 'lucide-react'

interface RestTimerProps {
  initialSeconds: number
  onComplete?: () => void
  autoStart?: boolean
}

export function RestTimer({ initialSeconds, onComplete, autoStart = true }: RestTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds)
  const [isActive, setIsActive] = useState(autoStart)
  const [isComplete, setIsComplete] = useState(false)

  // Timer countdown effect
  useEffect(() => {
    if (!isActive || isComplete) return

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsActive(false)
          setIsComplete(true)
          onComplete?.()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isActive, isComplete, onComplete])

  const handleReset = () => {
    setTimeRemaining(initialSeconds)
    setIsActive(false)
    setIsComplete(false)
  }

  const handleSkip = () => {
    setTimeRemaining(0)
    setIsActive(false)
    setIsComplete(true)
    onComplete?.()
  }

  const handleToggle = () => {
    setIsActive(!isActive)
  }

  const handleAddTime = (seconds: number) => {
    setTimeRemaining((prev) => Math.max(0, prev + seconds))
    setIsComplete(false)
    setIsActive(true)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const percentage = (timeRemaining / initialSeconds) * 100

  return (
    <Card className={`border-2 ${isComplete ? 'border-green-500/50 bg-green-500/5' : 'border-blue-500/50 bg-blue-500/5'}`}>
      <CardContent className="p-6 space-y-6">
        {/* Timer Display */}
        <div className="text-center space-y-4">
          <div className="relative w-40 h-40 mx-auto">
            {/* Circular Progress */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth="2"
                opacity="0.2"
              />
              {/* Progress circle */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={isComplete ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'}
                strokeWidth="3"
                strokeDasharray={`${(percentage / 100) * 283} 283`}
                strokeLinecap="round"
                className="transition-all duration-500"
              />
            </svg>
            {/* Time text in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-5xl font-bold font-mono">
                {formatTime(timeRemaining)}
              </div>
              <div className="text-xs text-muted-foreground mt-1">rest time</div>
            </div>
          </div>

          {isComplete && (
            <div className="text-green-600 font-semibold text-lg">Ready for next set!</div>
          )}
        </div>

        {/* Controls */}
        <div className="space-y-3">
          {/* Main Controls */}
          <div className="flex gap-2">
            <Button
              onClick={handleToggle}
              variant={isActive ? 'destructive' : 'default'}
              className="flex-1"
              disabled={isComplete}
            >
              {isActive ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleReset} size="icon">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              onClick={handleSkip}
              className="flex-1"
            >
              <SkipForward className="h-4 w-4 mr-2" />
              Skip
            </Button>
          </div>

          {/* Quick Adjustments */}
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddTime(-15)}
              className="flex items-center justify-center gap-1"
            >
              <Minus className="h-4 w-4" />
              15s
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleAddTime(15)}
              className="flex items-center justify-center gap-1"
            >
              <Plus className="h-4 w-4" />
              15s
            </Button>
          </div>

          {/* Manual Time Input */}
          <div className="flex gap-2">
            <input
              type="number"
              min="0"
              max="600"
              value={timeRemaining}
              onChange={(e) => {
                const newTime = Math.max(0, parseInt(e.target.value) || 0)
                setTimeRemaining(newTime)
                setIsComplete(false)
                if (newTime > 0) setIsActive(true)
              }}
              className="flex-1 px-3 py-2 text-center border rounded-md bg-background text-foreground text-sm font-mono"
              placeholder="seconds"
            />
            <span className="flex items-center text-muted-foreground text-sm">sec</span>
          </div>
        </div>

        {/* Status Info */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
          <Clock className="h-3 w-3" />
          {isActive && !isComplete && 'Timer running...'}
          {!isActive && !isComplete && 'Timer paused'}
          {isComplete && 'Rest period complete'}
        </div>
      </CardContent>
    </Card>
  )
}
