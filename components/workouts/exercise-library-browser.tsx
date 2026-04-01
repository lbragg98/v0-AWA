'use client'

import { useState, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ExerciseCard } from './exercise-card'
import { Search, Filter, X } from 'lucide-react'
import type { ExerciseLibrary } from '@/types/database'
import type { ExerciseFilter } from '@/types/workouts'

interface ExerciseLibraryBrowserProps {
  exercises: ExerciseLibrary[]
  selectedExercises?: string[]
  onSelect?: (exercise: ExerciseLibrary) => void
  selectable?: boolean
}

export function ExerciseLibraryBrowser({
  exercises,
  selectedExercises = [],
  onSelect,
  selectable = false,
}: ExerciseLibraryBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<ExerciseFilter>({})
  const [showFilters, setShowFilters] = useState(false)

  // Get unique values for filter options
  const equipmentOptions = useMemo(() => {
    const items = new Set<string>()
    exercises.forEach((ex) => {
      if (ex.equipment) items.add(ex.equipment)
    })
    return Array.from(items).sort()
  }, [exercises])

  const muscleOptions = useMemo(() => {
    const items = new Set<string>()
    exercises.forEach((ex) => {
      if (ex.primary_muscle) items.add(ex.primary_muscle)
    })
    return Array.from(items).sort()
  }, [exercises])

  // Filter and search exercises
  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      // Search by name
      if (
        searchQuery &&
        !exercise.name.toLowerCase().includes(searchQuery.toLowerCase())
      ) {
        return false
      }

      // Filter by equipment
      if (filters.equipment && exercise.equipment !== filters.equipment) {
        return false
      }

      // Filter by difficulty
      if (filters.difficulty && exercise.difficulty !== filters.difficulty) {
        return false
      }

      // Filter by primary muscle
      if (filters.primaryMuscle && exercise.primary_muscle !== filters.primaryMuscle) {
        return false
      }

      return true
    })
  }, [exercises, searchQuery, filters])

  const clearFilters = () => {
    setSearchQuery('')
    setFilters({})
    setShowFilters(false)
  }

  const hasActiveFilters = Object.keys(filters).length > 0 || searchQuery !== ''

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search exercises..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-foreground text-xs text-background">
                {Object.keys(filters).length + (searchQuery ? 1 : 0)}
              </span>
            )}
          </div>
        </Button>

        {showFilters && (
          <Card className="p-4 space-y-4">
            {/* Equipment Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Equipment</label>
              <div className="flex flex-wrap gap-2">
                {equipmentOptions.map((eq) => (
                  <Button
                    key={eq}
                    variant={filters.equipment === eq ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        equipment: prev.equipment === eq ? undefined : eq,
                      }))
                    }
                  >
                    {eq}
                  </Button>
                ))}
              </div>
            </div>

            {/* Difficulty Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <div className="flex flex-wrap gap-2">
                {['beginner', 'intermediate', 'advanced'].map((diff) => (
                  <Button
                    key={diff}
                    variant={
                      filters.difficulty === diff ? 'default' : 'outline'
                    }
                    size="sm"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        difficulty:
                          prev.difficulty === diff ? undefined : (diff as any),
                      }))
                    }
                  >
                    {diff}
                  </Button>
                ))}
              </div>
            </div>

            {/* Muscle Filter */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Primary Muscle</label>
              <div className="flex flex-wrap gap-2">
                {muscleOptions.map((muscle) => (
                  <Button
                    key={muscle}
                    variant={filters.primaryMuscle === muscle ? 'default' : 'outline'}
                    size="sm"
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        primaryMuscle: prev.primaryMuscle === muscle ? undefined : muscle,
                      }))
                    }
                  >
                    {muscle}
                  </Button>
                ))}
              </div>
            </div>

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={clearFilters}
              >
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </Card>
        )}
      </div>

      {/* Results */}
      {filteredExercises.length > 0 ? (
        <div>
          <p className="text-sm text-muted-foreground mb-4">
            {filteredExercises.length} exercise{filteredExercises.length !== 1 ? 's' : ''} found
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredExercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                isSelected={selectedExercises?.includes(exercise.id)}
                onSelect={selectable ? onSelect : undefined}
              />
            ))}
          </div>
        </div>
      ) : (
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">No exercises found</p>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="mt-2"
            >
              Clear filters
            </Button>
          )}
        </Card>
      )}
    </div>
  )
}
