import { useState } from "react"
import { X, AlertTriangle, Lightbulb, Info, ChevronDown, ChevronUp } from "lucide-react"
import { generateAlerts, type WeatherAlert, type AlertPriority } from "@/lib/alertEngine"
import type { WeatherData } from "@/types/weather"

interface WeatherAlertsProps {
  weather: WeatherData
  unit: "metric" | "imperial"
}

const priorityConfig: Record<AlertPriority, {
  border: string
  bg: string
  iconColor: string
  badge: string
  Icon: React.FC<{ className?: string }>
  label: string
}> = {
  warning: {
    border: "border-red-500/30",
    bg: "bg-red-500/10",
    iconColor: "text-red-400",
    badge: "bg-red-500/20 text-red-300",
    Icon: AlertTriangle,
    label: "Warning",
  },
  suggestion: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    iconColor: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-300",
    Icon: Lightbulb,
    label: "Suggestion",
  },
  info: {
    border: "border-blue-500/30",
    bg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    badge: "bg-blue-500/20 text-blue-300",
    Icon: Info,
    label: "Info",
  },
}

function AlertCard({ alert, onDismiss }: { alert: WeatherAlert; onDismiss: (id: string) => void }) {
  const cfg = priorityConfig[alert.priority]
  const { Icon } = cfg

  return (
    <div className={`flex gap-3 rounded-xl border px-4 py-3 ${cfg.border} ${cfg.bg} animate-fade-in`}>
      {/* Priority icon */}
      <div className="shrink-0 mt-0.5">
        <Icon className={`h-4 w-4 ${cfg.iconColor}`} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium leading-tight">
            {alert.icon} {alert.title}
          </span>
          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${cfg.badge}`}>
            {cfg.label}
          </span>
        </div>
        <p className="text-xs text-foreground/70 leading-relaxed">{alert.message}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={() => onDismiss(alert.id)}
        aria-label="Dismiss alert"
        className="shrink-0 h-5 w-5 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors mt-0.5"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  )
}

export function WeatherAlerts({ weather, unit }: WeatherAlertsProps) {
  const allAlerts = generateAlerts(weather, unit)
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [expanded, setExpanded] = useState(true)

  const dismiss = (id: string) => setDismissed((prev) => new Set([...prev, id]))
  const visible = allAlerts.filter((a) => !dismissed.has(a.id))

  if (visible.length === 0) return null

  const warnings = visible.filter((a) => a.priority === "warning").length

  return (
    <div className="space-y-2">
      {/* Section header */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center justify-between w-full group"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Alerts
          </span>
          {warnings > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-medium bg-red-500/20 text-red-300 px-1.5 py-0.5 rounded-full">
              <AlertTriangle className="h-2.5 w-2.5" />
              {warnings} warning{warnings > 1 ? "s" : ""}
            </span>
          )}
          <span className="text-[10px] text-muted-foreground">
            {visible.length} alert{visible.length > 1 ? "s" : ""}
          </span>
        </div>
        {expanded
          ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
          : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        }
      </button>

      {/* Alert cards */}
      {expanded && (
        <div className="space-y-2">
          {visible.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onDismiss={dismiss} />
          ))}
        </div>
      )}
    </div>
  )
}
