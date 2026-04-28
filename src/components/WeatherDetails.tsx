import React from "react"
import {
  Wind, Droplets, Gauge, Eye, Thermometer, Cloud,
  Sunrise, Sunset, Navigation, ArrowUpDown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip } from "@/components/ui/tooltip"
import type { WeatherData } from "@/types/weather"

interface WeatherDetailsProps {
  weather: WeatherData
  unit: "metric" | "imperial"
}

// Converts a Unix timestamp (seconds) to a human-readable HH:MM string
const formatTime = (ts: number) =>
  new Date(ts * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })

// Converts meteorological wind degrees to a compass direction abbreviation.
// Divides the 360° circle into 8 equal 45° segments.
const windDir = (deg: number) => {
  const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
  return dirs[Math.round(deg / 45) % 8]
}

// Returns a plain-English humidity comfort level
const humidityLevel = (h: number) => (h > 70 ? "High" : h < 30 ? "Low" : "Comfortable")

export function WeatherDetails({ weather, unit }: WeatherDetailsProps) {
  const tempUnit = unit === "metric" ? "C" : "F"
  const speedUnit = unit === "metric" ? "m/s" : "mph"

  // --- Daylight / sun progress bar calculations ---
  const sunriseMs = weather.sys.sunrise * 1000  // convert to milliseconds
  const sunsetMs = weather.sys.sunset * 1000
  const nowMs = Date.now()
  const dayLen = sunsetMs - sunriseMs            // total daylight duration in ms
  // Clamp progress between 0% and 100% so the indicator doesn't overflow
  const sunPct = dayLen > 0 ? Math.min(100, Math.max(0, ((nowMs - sunriseMs) / dayLen) * 100)) : 0
  const dayHours = Math.floor(dayLen / 3600000)
  const dayMins = Math.floor((dayLen % 3600000) / 60000)

  return (
    <div className="space-y-6">

      {/* Daylight card — shows sunrise, sunset, total daylight, and sun position */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Sunrise className="h-4 w-4 text-orange-400" />
            Daylight
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Sunrise / daylight duration / sunset row */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-center">
              <Sunrise className="h-5 w-5 text-orange-300 mx-auto mb-1" />
              <p className="font-medium">{formatTime(weather.sys.sunrise)}</p>
              <p className="text-xs text-muted-foreground">Sunrise</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">{dayHours}h {dayMins}m of daylight</p>
            </div>
            <div className="text-center">
              <Sunset className="h-5 w-5 text-orange-500 mx-auto mb-1" />
              <p className="font-medium">{formatTime(weather.sys.sunset)}</p>
              <p className="text-xs text-muted-foreground">Sunset</p>
            </div>
          </div>

          {/* Progress bar — orange fill represents elapsed daylight,
              the yellow dot marks the current sun position */}
          <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-orange-400 via-yellow-300 to-orange-500 rounded-full transition-all duration-700"
              style={{ width: `${sunPct}%` }}
            />
            {/* Sun indicator dot — offset by half its width (7px) to centre it on the progress edge */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-yellow-300 rounded-full shadow-lg shadow-yellow-400/40 border-2 border-yellow-200 transition-all duration-700"
              style={{ left: `calc(${sunPct}% - 7px)` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Stats grid — responsive 2/3/4 column layout */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard
          icon={<Wind className="h-4 w-4 text-cyan-400" />}
          label="Wind Speed"
          value={`${weather.wind.speed}`}
          suffix={speedUnit}
          detail={weather.wind.deg !== undefined ? windDir(weather.wind.deg) : undefined}
        />
        {/* Wind gust card — only rendered when gust data is present in the response */}
        {weather.wind.gust && (
          <StatCard
            icon={<ArrowUpDown className="h-4 w-4 text-cyan-300" />}
            label="Wind Gust"
            value={`${weather.wind.gust}`}
            suffix={speedUnit}
          />
        )}
        <StatCard
          icon={<Droplets className="h-4 w-4 text-blue-400" />}
          label="Humidity"
          value={`${weather.main.humidity}`}
          suffix="%"
          detail={humidityLevel(weather.main.humidity)}
        />
        <StatCard
          icon={<Gauge className="h-4 w-4 text-violet-400" />}
          label="Pressure"
          value={`${weather.main.pressure}`}
          suffix="hPa"
        />
        {/* Visibility converted from metres to kilometres */}
        <StatCard
          icon={<Eye className="h-4 w-4 text-emerald-400" />}
          label="Visibility"
          value={`${(weather.visibility / 1000).toFixed(1)}`}
          suffix="km"
        />
        <StatCard
          icon={<Thermometer className="h-4 w-4 text-orange-400" />}
          label="Feels Like"
          value={`${Math.round(weather.main.feels_like)}°`}
          suffix={tempUnit}
        />
        <StatCard
          icon={<Cloud className="h-4 w-4 text-slate-400" />}
          label="Cloud Cover"
          value={`${weather.clouds.all}`}
          suffix="%"
        />
        <StatCard
          icon={<Navigation className="h-4 w-4 text-teal-400" />}
          label="Wind Direction"
          value={weather.wind.deg !== undefined ? windDir(weather.wind.deg) : "N/A"}
          detail={weather.wind.deg !== undefined ? `${weather.wind.deg}°` : undefined}
        />
      </div>
    </div>
  )
}

// Reusable stat card used in the detail grid.
// Wraps content in a Tooltip that shows the full label on hover.
function StatCard({
  icon, label, value, suffix, detail,
}: {
  icon: React.ReactNode
  label: string
  value: string
  suffix?: string   // unit label shown in a muted style after the value
  detail?: string   // optional secondary line (e.g. compass direction, humidity level)
}) {
  return (
    <Tooltip content={label}>
      <Card className="hover:bg-accent/50 transition-colors cursor-default">
        <CardContent className="p-4 space-y-2">
          {/* Icon + label row */}
          <div className="flex items-center gap-2 text-muted-foreground">
            {icon}
            <span className="text-[11px] uppercase tracking-wider font-medium">{label}</span>
          </div>
          {/* Primary value with optional unit suffix */}
          <p className="text-xl font-semibold">
            {value}
            {suffix && <span className="text-sm font-normal text-muted-foreground ml-1">{suffix}</span>}
          </p>
          {/* Optional detail line */}
          {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
        </CardContent>
      </Card>
    </Tooltip>
  )
}
