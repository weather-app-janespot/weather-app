import { useState } from "react"
import axios from "axios"
import { Loader2, RefreshCw, CalendarDays, CheckCircle2, XCircle, Clock, Lightbulb } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import type { WeatherData } from "@/types/weather"
import { profileToPromptString, type UserProfile } from "@/types/profile"

interface TodayPlanProps {
  weather: WeatherData
  unit: "metric" | "imperial"
  apiUrl: string
  profile: UserProfile
}

interface TimeWindow {
  time: string
  label: string
  quality: "good" | "fair" | "poor"
}

interface Activity {
  name: string
  suitable: boolean
  reason: string
  icon: string
}

interface Plan {
  overview: string
  timeWindows: TimeWindow[]
  activities: Activity[]
  tips: string[]
}

const qualityStyles: Record<string, string> = {
  good: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300",
  fair: "bg-amber-500/15 border-amber-500/30 text-amber-300",
  poor: "bg-red-500/15 border-red-500/30 text-red-300",
}

const qualityDot: Record<string, string> = {
  good: "bg-emerald-400",
  fair: "bg-amber-400",
  poor: "bg-red-400",
}

export function TodayPlan({ weather, unit, apiUrl, profile }: TodayPlanProps) {
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPlan = async () => {
    setLoading(true)
    setError(null)
    try {
      const preferences = profileToPromptString(profile) || undefined
      const res = await axios.post(`${apiUrl}/today`, { weather, unit, preferences })
      setPlan(res.data)
    } catch {
      setError("Could not generate today's plan. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground/80">
            <CalendarDays className="h-4 w-4 text-primary" />
            What should I do today?
          </CardTitle>
          <div className="flex items-center gap-2">
            {plan && (
              <Button size="sm" variant="ghost" onClick={fetchPlan} disabled={loading} className="h-7 px-2 text-xs">
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            )}
            {!plan && (
              <Button size="sm" onClick={fetchPlan} disabled={loading} className="h-8">
                {loading
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Planning...</>
                  : <><CalendarDays className="h-3.5 w-3.5 mr-1.5" />Plan my day</>
                }
              </Button>
            )}
          </div>
        </div>
        {/* Show active profile summary if set */}
        {(profile.activities.length > 0 || profile.heatSensitivity !== "normal" || profile.coldSensitivity !== "normal") && (
          <p className="text-[11px] text-muted-foreground mt-1">
            Personalised for: {[
              profile.activities.slice(0, 3).join(", "),
              profile.heatSensitivity !== "normal" ? `${profile.heatSensitivity} heat sensitivity` : "",
              profile.coldSensitivity !== "normal" ? `${profile.coldSensitivity} cold sensitivity` : "",
            ].filter(Boolean).join(" · ")}
          </p>
        )}
      </CardHeader>

      <CardContent className="space-y-5">
        {error && <p className="text-sm text-red-400">{error}</p>}

        {loading && !plan && (
          <div className="flex items-center justify-center py-8 gap-3 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm">Analysing your day...</span>
          </div>
        )}

        {plan && (
          <>
            {/* Overview */}
            <p className="text-sm text-foreground/90 leading-relaxed">{plan.overview}</p>

            {/* Time windows */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5" />
                Best times to go out
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {plan.timeWindows.map((w) => (
                  <div
                    key={w.time}
                    className={`rounded-lg border px-3 py-2.5 text-xs space-y-1 ${qualityStyles[w.quality] ?? qualityStyles.fair}`}
                  >
                    <div className="flex items-center gap-1.5 font-medium">
                      <span className={`h-2 w-2 rounded-full shrink-0 ${qualityDot[w.quality] ?? qualityDot.fair}`} />
                      {w.time}
                    </div>
                    <p className="text-[11px] opacity-80">{w.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Activity suitability */}
            <div className="space-y-2">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Activity suitability
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {plan.activities.map((a) => (
                  <div
                    key={a.name}
                    className={`rounded-lg border px-3 py-2.5 space-y-1.5 transition-colors ${
                      a.suitable
                        ? "border-emerald-500/25 bg-emerald-500/10"
                        : "border-red-500/20 bg-red-500/8 opacity-75"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base">{a.icon}</span>
                      {a.suitable
                        ? <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                        : <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                      }
                    </div>
                    <p className="text-xs font-medium">{a.name}</p>
                    <p className="text-[11px] text-muted-foreground leading-snug">{a.reason}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Tips */}
            {plan.tips.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Lightbulb className="h-3.5 w-3.5" />
                  Tips for today
                </p>
                <ul className="space-y-1.5">
                  {plan.tips.map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-foreground/80">
                      <span className="mt-0.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
