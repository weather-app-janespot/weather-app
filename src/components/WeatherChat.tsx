import { useState, useRef, useEffect } from "react"
import axios from "axios"
import { Sparkles, Send, Loader2, X, MessageCircle, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { WeatherData } from "@/types/weather"
import type { UserProfile } from "@/types/profile"

interface WeatherChatProps {
  weather: WeatherData
  unit: "metric" | "imperial"
  apiUrl: string
  profile: UserProfile
  profileStr: string
}

interface Message {
  id: number
  role: "assistant" | "user"
  text: string
  loading?: boolean
}

let msgId = 0
const nextId = () => ++msgId

export function WeatherChat({ weather, unit, apiUrl, profileStr }: WeatherChatProps) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [initialized, setInitialized] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Focus input when chat opens
  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  // Auto-fetch initial summary the first time the chat is opened
  useEffect(() => {
    if (open && !initialized) {
      setInitialized(true)
      fetchSummary()
    }
  }, [open])

  const addMessage = (msg: Omit<Message, "id">) => {
    const id = nextId()
    setMessages((prev) => [...prev, { ...msg, id }])
    return id
  }

  const updateMessage = (id: number, text: string) => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, text, loading: false } : m))
    )
  }

  const fetchSummary = async () => {
    const placeholderId = addMessage({ role: "assistant", text: "", loading: true })
    try {
      const preferences = profileStr || undefined
      const res = await axios.post(`${apiUrl}/today`, { weather, unit, preferences })
      const { overview, activities, tips } = res.data
      const suitable = activities.filter((a: { suitable: boolean }) => a.suitable).map((a: { icon: string; name: string }) => `${a.icon} ${a.name}`).join(", ")
      const notSuitable = activities.filter((a: { suitable: boolean }) => !a.suitable).map((a: { icon: string; name: string }) => `${a.icon} ${a.name}`).join(", ")
      updateMessage(
        placeholderId,
        `${overview}\n\n**Good for:** ${suitable || "nothing outdoors today"}\n**Avoid:** ${notSuitable || "nothing"}\n\n**Tips:** ${tips[0] ?? ""}\n\nAsk me anything about today's weather!`
      )
    } catch {
      updateMessage(placeholderId, "Sorry, I couldn't load the weather summary. Try asking me something!")
    }
  }

  const sendMessage = async () => {
    const text = input.trim()
    if (!text) return
    setInput("")

    addMessage({ role: "user", text })
    const placeholderId = addMessage({ role: "assistant", text: "", loading: true })

    try {
      const preferences = profileStr || undefined
      const res = await axios.post(`${apiUrl}/ai`, { weather, unit, question: text, preferences })
      updateMessage(placeholderId, res.data.answer)
    } catch {
      updateMessage(placeholderId, "Sorry, I couldn't get an answer. Please try again.")
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") sendMessage()
  }

  // Render message text — bold **text** patterns
  const renderText = (text: string) => {
    return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i}>{part.slice(2, -2)}</strong>
      }
      return <span key={i}>{part}</span>
    })
  }

  return (
    <>
      {/* Floating toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Open weather assistant"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
      >
        {open
          ? <X className="h-5 w-5" />
          : <MessageCircle className="h-6 w-6" />
        }
      </button>

      {/* Chat panel — full screen on mobile, floating panel on sm+ */}
      {open && (
        <div className="fixed z-50 flex flex-col bg-card overflow-hidden animate-fade-in
          inset-0
          sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[400px] sm:max-h-[560px] sm:rounded-2xl sm:border sm:border-violet-500/20 sm:shadow-2xl sm:shadow-black/40"
        >

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600/20 to-violet-500/10 border-b border-violet-500/20">
            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-violet-600/20">
              <Sparkles className="h-4 w-4 text-violet-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">Weather Assistant</p>
              <p className="text-[11px] text-muted-foreground">{weather.name} · Ask me anything</p>
            </div>
            {/* Close button — always visible in header for easy dismissal */}
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 sm:max-h-[380px] min-h-[200px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className={`shrink-0 h-7 w-7 rounded-full flex items-center justify-center text-xs ${
                  msg.role === "assistant"
                    ? "bg-violet-600/20 text-violet-400"
                    : "bg-primary/20 text-primary"
                }`}>
                  {msg.role === "assistant"
                    ? <Bot className="h-3.5 w-3.5" />
                    : <User className="h-3.5 w-3.5" />
                  }
                </div>

                {/* Bubble */}
                <div className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                  msg.role === "assistant"
                    ? "bg-secondary text-foreground rounded-tl-sm"
                    : "bg-violet-600 text-white rounded-tr-sm"
                }`}>
                  {msg.loading
                    ? <span className="flex items-center gap-1.5 text-muted-foreground">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Thinking...
                      </span>
                    : <span className="whitespace-pre-wrap">{renderText(msg.text)}</span>
                  }
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-3 py-3 border-t border-border flex gap-2">
            <Input
              ref={inputRef}
              placeholder='e.g. "Can I go for a run?"'
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="text-sm bg-secondary/50 border-0 focus-visible:ring-1"
            />
            <Button
              size="icon"
              onClick={sendMessage}
              disabled={!input.trim()}
              className="bg-violet-600 hover:bg-violet-500 shrink-0"
              aria-label="Send"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
