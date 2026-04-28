import { CloudSun, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface EmptyStateProps {
  onSearch: (city: string) => void
}

// Pre-defined cities shown as quick-access buttons on the empty state screen
const popularCities = ["London", "New York", "Tokyo", "Paris", "Sydney", "Dubai"]

// Shown when no search has been made yet (no weather data, no error, not loading).
// Provides a welcome message and popular city shortcuts to help users get started.
export function EmptyState({ onSearch }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 sm:py-24 space-y-8">
      {/* Welcome copy */}
      <div className="space-y-4 text-center">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-2">
          <CloudSun className="h-8 w-8 text-primary" />
        </div>
        <h2 className="text-2xl font-semibold tracking-tight">Welcome to WeatherNow</h2>
        <p className="text-muted-foreground max-w-sm mx-auto text-sm">
          Search for any city to get real-time weather conditions, temperature, wind speed, humidity, and more.
        </p>
      </div>

      {/* Popular cities card — each button triggers a search directly */}
      <Card className="w-full max-w-lg">
        <CardContent className="p-5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <MapPin className="h-3 w-3" />
            Popular Cities
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2">
            {popularCities.map((city) => (
              <Button
                key={city}
                variant="outline"
                size="sm"
                className="justify-start text-xs"
                onClick={() => onSearch(city)}
              >
                {city}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
