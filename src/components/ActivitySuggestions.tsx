import { useState, useEffect } from "react"
import axios from "axios"
import { RefreshCw, Clock, Lightbulb, Medal } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { WeatherData } from "@/types/weather"
import { profileToPromptString, type UserProfile } from "@/types/profile"

interface ActivitySuggestionsProps {
  weather: WeatherData
  unit: "metric" | "imperial"
  apiUrl: string
  profile: UserProfile
}

interface Activity {
  rank: number
  name: string
  icon: string
  score: number
  reasoning: string
  bestWindow: string
  tips: string
}

// Circular score ring
function ScoreRing({ score }: { score: number }) {
  const r = 16
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ
  const color = score >= 75 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171"

  return (
    <svg width="44" height="44" className="shrink-0 -rotate-90">
      <circle cx="22" cy="22" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="3.5" />
      <circle
        cx="22" cy="22" r={r} fill="none"
        stroke={color} strokeWidth="3.5"
        strokeDasharray={`${fill} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.8s ease" }}
      />
      <text
        x="22" y="22"
        textAnchor="middle" dominantBaseline="central"
        className="rotate-90"
        style={{ transform: "rotate(90deg)", transformOrigin: "22px 22px", fontSize: "10px", fontWeight: 600, fill: color }}
      >
        {score}
      </text>
    </svg>
  )
}

const rankColors = ["text-yellow-400", "text-slate-300", "text-amber-600"]
const rankIcons = ["🥇", "🥈", "🥉"]

export function ActivitySuggestions({ weather, unit, apiUrl, profile }: ActivitySuggestionsProps) {
  const [activities, setActivities] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetch = async () => {
    setLoading(true)
    setError(null)
    try {
      const preferences = profileToPromptString(profile) || undefined
      const res = await axios.post(`${apiUrl}/activities`, { weather, unit, preferences })
      setActivities(res.data.activities)
    } catch {
      setError("Could not generate activity suggestions. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetch() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const isPersonalised = profile.activities.length > 0

  return (
    <Card className="border shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground/80">
              <Medal className="h-4 w-4 text-primary" />
              Activity Suggestions
            </CardTitle>
            {isPersonalised && (
              <p className="text-[11px] text-muted-foreground">
                Personalised · {profile.activities.slice(0, 3).join(", ")}
              </p>
            )}
          </div>
          {!loading && (
            <button
              onClick={fetch}
              className="h-7 w-7 rounded-full flex items-center justify-center border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
              aria-label="Refresh suggestions"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Skeletons */}
        {loading && (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-3 p-3 rounded-xl border border-white/10 bg-white/5">
                <Skeleton className="h-11 w-11 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-4/5" />
                  <div className="flex gap-3">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Activity cards */}
        {!loading && activities.map((a, i) => (
          <div
            key={a.rank}
            className={`flex gap-3 p-3.5 rounded-xl border transition-all ${
              i === 0
                ? "border-emerald-500/25 bg-emerald-500/8"
                : "border-white/10 bg-white/5 hover:bg-white/8"
            }`}
          >
            {/* Score ring */}
            <ScoreRing score={a.score} />

            {/* Content */}
            <div className="flex-1 min-w-0 space-y-1.5">
              {/* Name + rank */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg leading-none">{a.icon}</span>
                <span className="text-sm font-semibold">{a.name}</span>
                {i < 3 && (
                  <span className={`text-xs ${rankColors[i]}`}>{rankIcons[i]}</span>
                )}
              </div>

              {/* Reasoning */}
              <p className="text-xs text-foreground/75 leading-relaxed">{a.reasoning}</p>

              {/* Time window + tip */}
              <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="h-3 w-3 text-primary" />
                  {a.bestWindow}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Lightbulb className="h-3 w-3 text-amber-400" />
                  {a.tips}
                </span>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
