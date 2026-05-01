import axios from "axios"
import type { WeatherData } from "@/types/weather"

const LOCAL_KEY = "weathernow_memory"
const LOCAL_MAX = 50

interface LocalEntry {
  city: string
  condition: string
  tempC: number
  timeOfDay: string
  isWeekend: boolean
  searchedAt: number
}

function getTimeOfDay(): string {
  const h = new Date().getHours()
  if (h >= 5  && h < 12) return "morning"
  if (h >= 12 && h < 17) return "afternoon"
  if (h >= 17 && h < 21) return "evening"
  return "night"
}

function toC(temp: number, unit: "metric" | "imperial"): number {
  return unit === "imperial" ? (temp - 32) * 5 / 9 : temp
}

// ── Guest (localStorage) ─────────────────────────────────────────

function loadLocal(): LocalEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) || "[]")
  } catch { return [] }
}

function saveLocal(entries: LocalEntry[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries.slice(0, LOCAL_MAX)))
}

function recordLocal(weather: WeatherData, unit: "metric" | "imperial") {
  const entries = loadLocal()
  const day = new Date().getDay()
  entries.unshift({
    city: weather.name,
    condition: weather.weather[0].description,
    tempC: Math.round(toC(weather.main.temp, unit) * 10) / 10,
    timeOfDay: getTimeOfDay(),
    isWeekend: day === 0 || day === 6,
    searchedAt: Date.now(),
  })
  saveLocal(entries)
}

function localSummary(): string | null {
  const entries = loadLocal()
  if (entries.length < 3) return null

  const cities = [...new Set(entries.map(e => e.city))]
  const temps = entries.map(e => e.tempC)
  const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length)
  const timeFreq = entries.reduce((acc, e) => {
    acc[e.timeOfDay] = (acc[e.timeOfDay] || 0) + 1; return acc
  }, {} as Record<string, number>)
  const preferredTime = Object.entries(timeFreq).sort((a, b) => b[1] - a[1])[0]?.[0]

  return [
    `User has searched weather ${entries.length} times locally.`,
    cities.length > 1 ? `Checked cities: ${cities.slice(0, 4).join(", ")}.` : `Usually checks ${cities[0]}.`,
    `Average temperature when searching: ${avgTemp}°C.`,
    preferredTime ? `Most active at: ${preferredTime}.` : "",
  ].filter(Boolean).join(" ")
}

export function clearLocalMemory() {
  localStorage.removeItem(LOCAL_KEY)
}

export function getLocalEntries(): LocalEntry[] {
  return loadLocal()
}

// ── Public API ───────────────────────────────────────────────────

/**
 * Record a weather search. Uses server for signed-in users, localStorage for guests.
 * Fire-and-forget — never throws.
 */
export async function recordSearch(
  apiUrl: string,
  weather: WeatherData,
  unit: "metric" | "imperial",
  isSignedIn: boolean
) {
  try {
    if (isSignedIn) {
      await axios.post(`${apiUrl}/memory`, { weather, unit })
    } else {
      recordLocal(weather, unit)
    }
  } catch {
    // Memory recording is non-critical — silently ignore failures
  }
}

/**
 * Fetch the memory summary string to inject into AI prompts.
 * Returns null if no meaningful history exists.
 */
export async function getMemorySummary(
  apiUrl: string,
  isSignedIn: boolean
): Promise<string | null> {
  try {
    if (isSignedIn) {
      const res = await axios.get(`${apiUrl}/memory`)
      return res.data.summary ?? null
    }
    return localSummary()
  } catch {
    return null
  }
}

/**
 * Clear all memory (server + local).
 */
export async function clearMemory(apiUrl: string, isSignedIn: boolean) {
  clearLocalMemory()
  if (isSignedIn) {
    try { await axios.delete(`${apiUrl}/memory`) } catch { /* ignore */ }
  }
}
