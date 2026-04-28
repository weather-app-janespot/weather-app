import React from "react"
import { Clock, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface RecentSearchesProps {
  searches: string[]
  onSelect: (city: string) => void
  onClear: () => void
}

// Renders a horizontal row of recent search chips.
// Returns null when the list is empty so it takes up no space.
export function RecentSearches({ searches, onSelect, onClear }: RecentSearchesProps) {
  if (searches.length === 0) return null

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Section label */}
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Clock className="h-3.5 w-3.5" />
        <span className="text-xs font-medium">Recent</span>
      </div>

      {/* One chip per recent city — clicking re-fetches that city */}
      {searches.map((city) => (
        <Button key={city} variant="secondary" size="sm" className="h-7 text-xs" onClick={() => onSelect(city)}>
          {city}
        </Button>
      ))}

      {/* Clear button — removes all recent searches from state */}
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClear} aria-label="Clear recent searches">
        <X className="h-3 w-3" />
      </Button>
    </div>
  )
}
