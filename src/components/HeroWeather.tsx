import { MapPin, ArrowUp, ArrowDown, Droplets, Wind } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import type { WeatherData } from "@/types/weather"

interface HeroWeatherProps {
  weather: WeatherData
  unit: "metric" | "imperial"
}

// Builds the OpenWeatherMap icon URL for a given icon code.
// @4x gives a high-resolution 100×100px PNG.
const getIconUrl = (icon: string) => `https://openweathermap.org/img/wn/${icon}@4x.png`

export function HeroWeather({ weather, unit }: HeroWeatherProps) {
  const tempUnit = unit === "metric" ? "C" : "F"

  // Format the current date and time for display in the card header
  const now = new Date()
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

  return (
    // Gradient card — primary tint on the left fades into the base card colour
    <Card className="overflow-hidden border-0 bg-gradient-to-br from-primary/20 via-card to-card">
      <CardContent className="p-0">
        {/* Two-column layout on md+: info on the left, weather icon on the right */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-0">

          {/* Left column: location, temperature, condition, quick stats */}
          <div className="p-6 sm:p-8 space-y-5">

            {/* Location header */}
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <MapPin className="h-4 w-4 text-primary" />
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{weather.name}</h1>
                {/* Country code badge */}
                <Badge variant="secondary" className="text-[10px]">{weather.sys.country}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{dateStr} &middot; {timeStr}</p>
              {/* Coordinates for precision — shown in a subtle style */}
              <p className="text-xs text-muted-foreground/60">
                {Math.abs(weather.coord.lat).toFixed(2)}°{weather.coord.lat >= 0 ? "N" : "S"},{" "}
                {Math.abs(weather.coord.lon).toFixed(2)}°{weather.coord.lon >= 0 ? "E" : "W"}
              </p>
            </div>

            {/* Large temperature display */}
            <div className="flex items-end gap-2">
              <span className="text-7xl sm:text-8xl font-extralight leading-none tracking-tighter">
                {Math.round(weather.main.temp)}°
              </span>
              <span className="text-2xl text-muted-foreground mb-3">{tempUnit}</span>
            </div>

            {/* Condition description, high/low, feels like, wind, humidity */}
            <div className="space-y-3">
              <p className="text-lg capitalize text-foreground/80">{weather.weather[0].description}</p>

              {/* Daily high / low + feels like */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <ArrowUp className="h-3.5 w-3.5 text-red-400" />
                  {Math.round(weather.main.temp_max)}°
                </span>
                <span className="flex items-center gap-1">
                  <ArrowDown className="h-3.5 w-3.5 text-blue-400" />
                  {Math.round(weather.main.temp_min)}°
                </span>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  Feels like {Math.round(weather.main.feels_like)}°{tempUnit}
                </span>
              </div>

              <Separator />

              {/* Quick-glance wind and humidity row */}
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Wind className="h-3.5 w-3.5 text-cyan-400" />
                  {weather.wind.speed} {unit === "metric" ? "m/s" : "mph"}
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground">
                  <Droplets className="h-3.5 w-3.5 text-blue-400" />
                  {weather.main.humidity}%
                </span>
              </div>
            </div>
          </div>

          {/* Right column: large weather icon — hidden on small screens */}
          <div className="hidden md:flex flex-col items-center justify-center px-8 bg-gradient-to-b from-primary/5 to-transparent">
            <img
              src={getIconUrl(weather.weather[0].icon)}
              alt={weather.weather[0].description}
              className="w-44 h-44 drop-shadow-xl"
            />
            {/* Condition group label below the icon (e.g. "Rain", "Clear") */}
            <span className="text-sm font-medium text-muted-foreground capitalize -mt-2">
              {weather.weather[0].main}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
