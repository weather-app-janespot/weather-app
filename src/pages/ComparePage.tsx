import { useState, useRef, useEffect } from "react"
import axios from "axios"
import {
  ArrowLeft, Plus, X, GitCompare, Loader2, Thermometer,
  Droplets, Wind, Clock, Sparkles, Trophy
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import type { WeatherData } from "@/types/weather"

interface ComparePageProps {
  apiUrl: string
  unit: "metric" | "imperial"
  onBack: () => void
  initialCity?: string
}

interface CityResult {
  weather: WeatherData
  score: number
  precip: number
  bestTime: string
}

interface CompareResult {
  cities: CityResult[]
  summary: string | null
}

const getIconUrl = (icon: string) => `https://openweathermap.org/img/wn/${icon}@2x.png`

// Score bar with label
function ScoreBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.round((value / max) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{value}{max === 100 ? "" : ""}</span>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// City search input with autocomplete
function CityInput({
  value, onChange, onRemove, placeholder, apiUrl, disabled
}: {
  value: string
  onChange: (v: string) => void
  onRemove?: () => void
  placeholder: string
  apiUrl: string
  disabled?: boolean
}) {
  const [suggestions, setSuggestions] = useState<{ id: number; name: string; country: string; state: string }[]>([])
  const [show, setShow] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setShow(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleChange = (v: string) => {
    onChange(v)
    if (timer.current) clearTimeout(timer.current)
    if (v.trim().length < 2) { setSuggestions([]); setShow(false); return }
    timer.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${apiUrl}/cities`, { params: { q: v.trim(), limit: 6 } })
        setSuggestions(res.data)
        setShow(res.data.length > 0)
      } catch { setSuggestions([]); setShow(false) }
    }, 250)
  }

  return (
    <div ref={ref} className="relative flex-1">
      <div className="flex gap-2">
        <Input
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShow(true)}
          disabled={disabled}
          className="text-sm"
        />
        {onRemove && (
          <button onClick={onRemove} className="shrink-0 h-9 w-9 flex items-center justify-center rounded-md border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      {show && (
        <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg overflow-hidden z-50">
          {suggestions.map((s) => (
            <button
              key={s.id}
              className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-accent/50 text-left transition-colors"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => { onChange(`${s.name}, ${s.country}`); setShow(false) }}
            >
              <span>{s.name}{s.state ? `, ${s.state}` : ""}</span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{s.country}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export function ComparePage({ apiUrl, unit, onBack, initialCity }: ComparePageProps) {
  const [cityInputs, setCityInputs] = useState<string[]>([initialCity ?? "", ""])
  const [result, setResult] = useState<CompareResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tempUnit = unit === "metric" ? "°C" : "°F"
  const speedUnit = unit === "metric" ? "m/s" : "mph"

  const addCity = () => { if (cityInputs.length < 4) setCityInputs((p) => [...p, ""]) }
  const removeCity = (i: number) => setCityInputs((p) => p.filter((_, idx) => idx !== i))
  const updateCity = (i: number, v: string) => setCityInputs((p) => p.map((c, idx) => idx === i ? v : c))

  const compare = async () => {
    const filled = cityInputs.map((c) => c.trim()).filter(Boolean)
    if (filled.length < 2) { setError("Enter at least 2 cities to compare"); return }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await axios.post(`${apiUrl}/compare`, { cities: filled, unit })
      setResult(res.data)
    } catch (err: any) {
      setError(err.response?.data?.error || "Comparison failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Best city = highest comfort score
  const bestIdx = result
    ? result.cities.reduce((best, c, i) => c.score > result.cities[best].score ? i : best, 0)
    : -1

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto flex items-center gap-3 px-4 py-3">
          <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Separator orientation="vertical" className="h-4" />
          <div className="flex items-center gap-2">
            <GitCompare className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Compare Cities</span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* City inputs */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Select cities to compare (2–4)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {cityInputs.map((city, i) => (
              <CityInput
                key={i}
                value={city}
                onChange={(v) => updateCity(i, v)}
                onRemove={cityInputs.length > 2 ? () => removeCity(i) : undefined}
                placeholder={`City ${i + 1}...`}
                apiUrl={apiUrl}
              />
            ))}
            <div className="flex gap-2 pt-1">
              {cityInputs.length < 4 && (
                <Button variant="ghost" size="sm" onClick={addCity} className="text-xs">
                  <Plus className="h-3.5 w-3.5 mr-1.5" />
                  Add city
                </Button>
              )}
              <Button onClick={compare} disabled={loading} className="ml-auto">
                {loading
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Comparing...</>
                  : <><GitCompare className="h-4 w-4 mr-2" />Compare</>
                }
              </Button>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
          </CardContent>
        </Card>

        {/* Loading skeletons */}
        {loading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cityInputs.filter(Boolean).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="space-y-1.5 flex-1">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Results */}
        {result && (
          <>
            {/* AI Summary */}
            {result.summary && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="p-4 flex gap-3">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/90 leading-relaxed">{result.summary}</p>
                </CardContent>
              </Card>
            )}

            {/* City cards grid */}
            <div className={`grid gap-4 ${result.cities.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-" + result.cities.length}`}>
              {result.cities.map((city, i) => {
                const w = city.weather
                const isBest = i === bestIdx
                return (
                  <Card key={i} className={`relative ${isBest ? "border-primary/40 shadow-lg shadow-primary/10" : ""}`}>
                    {isBest && (
                      <div className="absolute -top-3 left-4 flex items-center gap-1 bg-primary text-primary-foreground text-[10px] font-semibold px-2.5 py-1 rounded-full shadow">
                        <Trophy className="h-3 w-3" />
                        Best today
                      </div>
                    )}
                    <CardContent className="p-5 space-y-4 pt-6">
                      {/* City header */}
                      <div className="flex items-center gap-3">
                        <img src={getIconUrl(w.weather[0].icon)} alt={w.weather[0].description} className="h-12 w-12" />
                        <div>
                          <p className="font-semibold text-base leading-tight">{w.name}</p>
                          <p className="text-xs text-muted-foreground">{w.sys.country} · {w.weather[0].description}</p>
                        </div>
                      </div>

                      {/* Key stats */}
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Thermometer className="h-3.5 w-3.5 text-orange-400" />
                          <span className="font-medium text-foreground">{Math.round(w.main.temp)}{tempUnit}</span>
                          <span className="text-xs">/ feels {Math.round(w.main.feels_like)}{tempUnit}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Droplets className="h-3.5 w-3.5 text-blue-400" />
                          <span>{w.main.humidity}% humidity</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Wind className="h-3.5 w-3.5 text-cyan-400" />
                          <span>{w.wind.speed} {speedUnit}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5 text-emerald-400" />
                          <span className="text-xs">{city.bestTime}</span>
                        </div>
                      </div>

                      <Separator />

                      {/* Score bars */}
                      <div className="space-y-2.5">
                        <ScoreBar label="Comfort score" value={city.score} color="bg-primary" />
                        <ScoreBar label="Precip. chance" value={city.precip} color="bg-blue-400" />
                        <ScoreBar
                          label="Visibility"
                          value={Math.round((w.visibility / 10000) * 100)}
                          color="bg-emerald-400"
                        />
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>

            {/* Comparison table */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Side-by-side</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-2 pr-4 text-xs text-muted-foreground font-medium w-32">Metric</th>
                      {result.cities.map((c, i) => (
                        <th key={i} className="text-left py-2 px-2 text-xs font-semibold">
                          {c.weather.name}
                          {i === bestIdx && <span className="ml-1 text-primary">★</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {[
                      { label: "Temperature", fn: (c: CityResult) => `${Math.round(c.weather.main.temp)}${tempUnit}` },
                      { label: "Feels like", fn: (c: CityResult) => `${Math.round(c.weather.main.feels_like)}${tempUnit}` },
                      { label: "Humidity", fn: (c: CityResult) => `${c.weather.main.humidity}%` },
                      { label: "Wind", fn: (c: CityResult) => `${c.weather.wind.speed} ${speedUnit}` },
                      { label: "Precip. chance", fn: (c: CityResult) => `${c.precip}%` },
                      { label: "Comfort score", fn: (c: CityResult) => `${c.score}/100` },
                      { label: "Best time", fn: (c: CityResult) => c.bestTime },
                    ].map((row) => (
                      <tr key={row.label}>
                        <td className="py-2 pr-4 text-xs text-muted-foreground">{row.label}</td>
                        {result.cities.map((c, i) => (
                          <td key={i} className={`py-2 px-2 text-xs ${i === bestIdx ? "text-primary font-medium" : ""}`}>
                            {row.fn(c)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
