import { useState, useRef } from "react"
import { createPortal } from "react-dom"
import axios from "axios"
import html2canvas from "html2canvas"
import { Share2, Download, Copy, Loader2, X, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { computeScores } from "@/lib/comfortScore"
import { getWeatherTheme } from "@/lib/weatherTheme"
import type { WeatherData } from "@/types/weather"

interface ShareCardProps {
  weather: WeatherData
  unit: "metric" | "imperial"
  apiUrl: string
}

const getIconUrl = (icon: string) => `https://openweathermap.org/img/wn/${icon}@2x.png`

function scoreColor(score: number): string {
  if (score >= 75) return "#34d399"
  if (score >= 55) return "#fbbf24"
  if (score >= 35) return "#fb923c"
  return "#f87171"
}

// Mini score pill for the card
function ScorePill({ label, score }: { label: string; score: number }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
      background: "rgba(255,255,255,0.08)", borderRadius: 12,
      padding: "8px 16px", gap: 2,
    }}>
      <span style={{ fontSize: 22, fontWeight: 700, color: scoreColor(score), lineHeight: 1 }}>{score}</span>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase", letterSpacing: 1 }}>{label}</span>
    </div>
  )
}

export function ShareCard({ weather, unit, apiUrl }: ShareCardProps) {
  const [open, setOpen] = useState(false)
  const [insight, setInsight] = useState<string | null>(null)
  const [insightLoading, setInsightLoading] = useState(false)
  const [capturing, setCapturing] = useState(false)
  const [copied, setCopied] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const scores = computeScores(weather, unit)
  const theme = getWeatherTheme(weather.weather[0].id, weather.sys.sunrise, weather.sys.sunset)
  const tempUnit = unit === "metric" ? "°C" : "°F"
  const now = new Date()
  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })

  const fetchInsight = async () => {
    setInsightLoading(true)
    try {
      const res = await axios.post(`${apiUrl}/ai`, {
        weather, unit,
        question: "Give a single punchy sentence (max 15 words) describing today's weather vibe.",
      })
      setInsight(res.data.answer?.split(".")[0] ?? null)
    } catch {
      setInsight(null)
    } finally {
      setInsightLoading(false)
    }
  }

  const capture = async (): Promise<HTMLCanvasElement | null> => {
    if (!cardRef.current) return null
    setCapturing(true)
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      })
      return canvas
    } finally {
      setCapturing(false)
    }
  }

  const handleDownload = async () => {
    const canvas = await capture()
    if (!canvas) return
    const link = document.createElement("a")
    link.download = `weather-${weather.name.toLowerCase().replace(/\s+/g, "-")}.png`
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  const handleCopy = async () => {
    const canvas = await capture()
    if (!canvas) return
    canvas.toBlob(async (blob) => {
      if (!blob) return
      try {
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })])
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch {
        // Fallback: download instead
        handleDownload()
      }
    })
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); if (!insight) fetchInsight() }}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        aria-label="Share weather card"
      >
        <Share2 className="h-3.5 w-3.5" />
        <span>Share</span>
      </button>

      {/* Modal — rendered in a portal to escape overflow:hidden on parent cards */}
      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="w-full max-w-sm space-y-4 animate-fade-in">
            {/* Card to capture */}
            <div
              ref={cardRef}
              style={{
                background: theme.gradient,
                borderRadius: 20,
                padding: 28,
                fontFamily: "'Inter', -apple-system, sans-serif",
                color: "#fff",
                position: "relative",
                overflow: "hidden",
                minHeight: 220,
              }}
            >
              {/* Subtle overlay */}
              <div style={{
                position: "absolute", inset: 0,
                background: "rgba(0,0,0,0.15)",
                borderRadius: 20,
              }} />

              <div style={{ position: "relative", zIndex: 1 }}>
                {/* Header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{weather.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 2 }}>
                      {weather.sys.country} · {dateStr}
                    </div>
                  </div>
                  <img
                    src={getIconUrl(weather.weather[0].icon)}
                    alt={weather.weather[0].description}
                    style={{ width: 56, height: 56 }}
                    crossOrigin="anonymous"
                  />
                </div>

                {/* Temperature */}
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 56, fontWeight: 200, lineHeight: 1 }}>
                    {Math.round(weather.main.temp)}°
                  </span>
                  <span style={{ fontSize: 20, color: "rgba(255,255,255,0.6)", marginBottom: 8 }}>{tempUnit}</span>
                </div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.75)", textTransform: "capitalize", marginBottom: 20 }}>
                  {weather.weather[0].description} · feels like {Math.round(weather.main.feels_like)}{tempUnit}
                </div>

                {/* Scores */}
                <div style={{ display: "flex", gap: 10, marginBottom: insight ? 16 : 0 }}>
                  <ScorePill label="Comfort" score={scores.comfort} />
                  <ScorePill label="Outdoor" score={scores.outdoor} />
                </div>

                {/* AI insight */}
                {insight && (
                  <div style={{
                    marginTop: 16,
                    background: "rgba(255,255,255,0.1)",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.85)",
                    lineHeight: 1.5,
                    display: "flex",
                    gap: 6,
                    alignItems: "flex-start",
                  }}>
                    <span style={{ fontSize: 12 }}>✨</span>
                    <span>{insight}</span>
                  </div>
                )}

                {/* Branding */}
                <div style={{
                  marginTop: 16,
                  fontSize: 10,
                  color: "rgba(255,255,255,0.35)",
                  textAlign: "right",
                }}>
                  WeatherNow
                </div>
              </div>
            </div>

            {/* AI insight loading state */}
            {insightLoading && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Loader2 className="h-3 w-3 animate-spin" />
                Generating AI insight...
              </p>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={handleDownload}
                disabled={capturing}
                className="flex-1"
              >
                {capturing
                  ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  : <Download className="h-4 w-4 mr-2" />
                }
                Download
              </Button>
              <Button
                variant="secondary"
                onClick={handleCopy}
                disabled={capturing}
                className="flex-1"
              >
                {copied
                  ? <><Check className="h-4 w-4 mr-2 text-emerald-400" />Copied!</>
                  : <><Copy className="h-4 w-4 mr-2" />Copy image</>
                }
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(false)}
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      , document.body)}
    </>
  )
}
