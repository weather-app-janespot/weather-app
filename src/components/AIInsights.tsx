import { useState } from "react"
import axios from "axios"
import { Sparkles, Send, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { WeatherData } from "@/types/weather"

interface AIInsightsProps {
  weather: WeatherData
  unit: "metric" | "imperial"
  apiUrl: string
}

interface Insights {
  summary: string
  recommendation: string
  bestTime: string
}

export function AIInsights({ weather, unit, apiUrl }: AIInsightsProps) {
  const [insights, setInsights] = useState<Insights | null>(null)
  const [answer, setAnswer] = useState<string | null>(null)
  const [question, setQuestion] = useState("")
  const [loadingInsights, setLoadingInsights] = useState(false)
  const [loadingAnswer, setLoadingAnswer] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchInsights = async () => {
    setLoadingInsights(true)
    setError(null)
    try {
      const res = await axios.post(`${apiUrl}/ai`, { weather, unit })
      setInsights(res.data)
    } catch {
      setError("Could not load AI insights. Please try again.")
    } finally {
      setLoadingInsights(false)
    }
  }

  const askQuestion = async () => {
    if (!question.trim()) return
    setLoadingAnswer(true)
    setAnswer(null)
    setError(null)
    try {
      const res = await axios.post(`${apiUrl}/ai`, { weather, unit, question: question.trim() })
      setAnswer(res.data.answer)
    } catch {
      setError("Could not get an answer. Please try again.")
    } finally {
      setLoadingAnswer(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") askQuestion()
  }

  return (
    <Card className="border border-violet-500/20 bg-gradient-to-br from-violet-500/10 via-card to-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-violet-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-400" />
            AI Insights
          </CardTitle>
          {!insights && (
            <Button size="sm" variant="secondary" onClick={fetchInsights} disabled={loadingInsights}>
              {loadingInsights
                ? <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Thinking...</>
                : <><Sparkles className="h-3.5 w-3.5 mr-1.5" />Generate</>
              }
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}

        {/* Generated insights */}
        {insights && (
          <div className="space-y-3 text-sm">
            <p className="text-foreground/90">{insights.summary}</p>
            <div className="flex flex-col gap-1.5">
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">Recommendation: </span>
                {insights.recommendation}
              </p>
              <p className="text-muted-foreground">
                <span className="text-foreground font-medium">Best time outside: </span>
                {insights.bestTime}
              </p>
            </div>
          </div>
        )}

        {/* Q&A input — always visible once insights are loaded, or on its own */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder='Ask something, e.g. "Can I go for a run?"'
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm"
            />
            <Button
              size="icon"
              onClick={askQuestion}
              disabled={loadingAnswer || !question.trim()}
              aria-label="Ask"
            >
              {loadingAnswer
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </Button>
          </div>
          {answer && (
            <p className="text-sm text-foreground/90 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
              {answer}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
