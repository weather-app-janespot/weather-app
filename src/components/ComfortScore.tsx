import { useState } from "react"
import axios from "axios"
import { Sparkles, Loader2, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tooltip } from "@/components/ui/tooltip"
import { computeScores } from "@/lib/comfortScore"
import type { WeatherData } from "@/types/weather"

interface ComfortScoreProps {
  weather: WeatherData
  unit: "metric" | "imperial"
  apiUrl: string
}

// Animated SVG arc ring
function ScoreArc({
  score, size = 120, stroke = 10, label, sublabel, color,
}: {
  score: number
  size?: number
  stroke?: number
  label: string
  sublabel: string
  color: string
}) {
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  const fill = (score / 100) * circ * 0.75   // 270° arc
  const offset = circ * 0.125                 // start at 135° (bottom-left)

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(135deg)" }}>
          {/* Track */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke}
            strokeDasharray={`${circ * 0.75} ${circ * 0.25}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
          />
          {/* Fill */}
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${fill} ${circ}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 1s ease" }}
          />
        </svg>
        {/* Centre text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold leading-none" style={{ color }}>{score}</span>
          <span className="text-[10px] text-muted-foreground mt-0.5">/ 100</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-center">{label}</p>
      <p className="text-[11px] text-muted-foreground text-center leading-tight">{sublabel}</p>
    </div>
  )
}

function scoreColor(score: number): string {
  if (score >= 75) return "#34d399"
  if (score >= 55) return "#fbbf24"
  if (score >= 35) return "#fb923c"
  return "#f87171"
}

export function ComfortScore({ weather, unit, apiUrl }: ComfortScoreProps) {
  const result = computeScores(weather, unit)
  const [aiExplanation, setAiExplanation] = useState<string | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const fetchExplanation = async () => {
    if (aiExplanation) { setAiExplanation(null); return }
    setAiLoading(true)
    try {
      const question = `My comfort score is ${result.comfort}/100 (${result.comfortLabel}) and outdoor suitability is ${result.outdoor}/100 (${result.outdoorLabel}). Explain these scores in 2-3 plain sentences based on the current weather conditions.`
      const res = await axios.post(`${apiUrl}/ai`, { weather, unit, question })
      setAiExplanation(res.data.answer)
    } catch {
      setAiExplanation("Could not load explanation. Please try again.")
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <Card className="border shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground/80">
            <span className="text-base">🌡️</span>
            Comfort & Outdoor Score
          </CardTitle>
          <button
            onClick={fetchExplanation}
            disabled={aiLoading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
            aria-label="Explain scores with AI"
          >
            {aiLoading
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Sparkles className="h-3.5 w-3.5" />
            }
            <span className="hidden sm:inline">{aiExplanation ? "Hide" : "Explain"}</span>
          </button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Score rings */}
        <div className="flex justify-around">
          <ScoreArc
            score={result.comfort}
            label="Comfort"
            sublabel={result.comfortLabel}
            color={scoreColor(result.comfort)}
          />
          <ScoreArc
            score={result.outdoor}
            label="Outdoor"
            sublabel={result.outdoorLabel}
            color={scoreColor(result.outdoor)}
          />
        </div>

        {/* AI explanation */}
        {aiExplanation && (
          <div className="flex gap-2.5 rounded-lg border border-violet-500/20 bg-violet-500/10 px-3 py-2.5">
            <Sparkles className="h-3.5 w-3.5 text-violet-400 shrink-0 mt-0.5" />
            <p className="text-xs text-foreground/85 leading-relaxed">{aiExplanation}</p>
          </div>
        )}

        {/* Factor breakdown */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5" />
            Score breakdown
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {result.factors.map((f) => (
              <Tooltip key={f.label} content={f.detail}>
                <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 space-y-1.5 cursor-default hover:bg-white/8 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <span>{f.icon}</span>
                      {f.label}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: scoreColor(f.value) }}
                    >
                      {f.value}
                    </span>
                  </div>
                  {/* Mini bar */}
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${f.value}%`,
                        backgroundColor: scoreColor(f.value),
                      }}
                    />
                  </div>
                </div>
              </Tooltip>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
