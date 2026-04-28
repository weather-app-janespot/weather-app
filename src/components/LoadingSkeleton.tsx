import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

// Placeholder UI shown while weather data is being fetched.
// Mirrors the layout of HeroWeather + WeatherDetails so the page
// doesn't shift when real content loads in.
export function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-fade-in">

      {/* Hero card skeleton — matches HeroWeather layout */}
      <Card className="border-0 bg-gradient-to-br from-primary/10 via-card to-card">
        <CardContent className="p-6 sm:p-8 space-y-5">
          {/* City name + date line */}
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
          {/* Large temperature block */}
          <Skeleton className="h-20 w-40" />
          {/* Condition + feels like */}
          <div className="space-y-2">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="h-4 w-52" />
          </div>
        </CardContent>
      </Card>

      {/* Daylight card skeleton */}
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-2 w-full rounded-full" />
        </CardContent>
      </Card>

      {/* Stats grid skeleton — 8 placeholder cards matching the detail grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-6 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
