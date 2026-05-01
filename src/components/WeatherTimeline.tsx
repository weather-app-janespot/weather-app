import { useState, useRef, useEffect } from "react"
import axios from "axios"
import { RefreshCw, BookOpen, ChevronLeft, ChevronRight, Star, Thermometer, Wind } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import type { WeatherData } from "@/types/weather"

interface WeatherTimelineProps {
  weather: WeatherData
  unit: "metric" | "imperial"
  apiUrl: string
}

interface TimelineBlock {
  time: string
  label: string
  story: string
  icon: string
  temp: string
  condition: string
  wind: string
  highlight: boolean
}

export function WeatherTimeline({ weather, unit, apiUrl }: WeatherTimelineProps) {
  const [blocks, setBlocks] = useState<TimelineBlock[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchTimeline = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.post(`${apiUrl}/timeline`, { weather, unit })
      setBlocks(res.data.blocks)
    } catch {
      setError("Could not generate timeline. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  // Auto-generate on mount
  useEffect(() => { fetchTimeline() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return
    scrollRef.current.scrollBy({ left: dir === "left" ? -280 : 280, behavior: "smooth" })
  }

  return (
    <Card className="border shadow-lg">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2 text-foreground/80">
            <BookOpen className="h-4 w-4 text-primary" />
            Weather Story
          </CardTitle>
          <div className="flex items-center gap-2">
            {!loading && blocks.length > 0 && (
              <>
                <button
                  onClick={() => scroll("left")}
                  className="h-7 w-7 rounded-full flex items-center justify-center border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
                  aria-label="Scroll left"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => scroll("right")}
                  className="h-7 w-7 rounded-full flex items-center justify-center border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
                  aria-label="Scroll right"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={fetchTimeline}
                  className="h-7 w-7 rounded-full flex items-center justify-center border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
                  aria-label="Refresh timeline"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && <p className="text-sm text-red-400">{error}</p>}

        {/* Skeleton while loading */}
        {loading && (
          <div className="flex gap-3 overflow-hidden pb-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="shrink-0 w-[260px] sm:w-[280px] rounded-xl border border-white/10 p-4 space-y-3">
                <Skeleton className="h-3 w-20" />
                <div className="flex items-center gap-2.5">
                  <Skeleton className="h-9 w-9 rounded-lg" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <div className="flex gap-3 pt-1 border-t border-white/10">
                  <Skeleton className="h-3 w-12" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && blocks.length > 0 && (
          <>
            <div
              ref={scrollRef}
              className="flex gap-3 overflow-x-auto pb-3 scroll-smooth snap-x snap-mandatory"
              style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            >
              {blocks.map((block, i) => (
                <div
                  key={i}
                  className={`snap-start shrink-0 w-[260px] sm:w-[280px] rounded-xl border p-4 space-y-3 transition-all ${
                    block.highlight
                      ? "border-primary/40 bg-primary/10 shadow-md shadow-primary/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">{block.time}</span>
                    {block.highlight && (
                      <span className="flex items-center gap-1 text-[10px] font-medium text-primary bg-primary/15 px-2 py-0.5 rounded-full">
                        <Star className="h-2.5 w-2.5 fill-primary" />
                        Best time
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl">{block.icon}</span>
                    <div>
                      <p className="text-sm font-semibold leading-tight">{block.label}</p>
                      <p className="text-xs text-muted-foreground">{block.condition}</p>
                    </div>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{block.story}</p>
                  <div className="flex items-center gap-3 pt-1 border-t border-white/10">
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Thermometer className="h-3 w-3 text-orange-400" />
                      {block.temp}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Wind className="h-3 w-3 text-cyan-400" />
                      {block.wind}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center gap-1.5 mt-2">
              {blocks.map((_, i) => (
                <div key={i} className="h-1 w-1 rounded-full bg-white/20" />
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
