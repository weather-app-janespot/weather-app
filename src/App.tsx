import { useState, useCallback, useEffect, useRef } from "react"
import axios from "axios"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { HeroWeather } from "@/components/HeroWeather"
import { WeatherDetails } from "@/components/WeatherDetails"
import { RecentSearches } from "@/components/RecentSearches"
import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { WeatherChat } from "@/components/WeatherChat"
import { getWeatherTheme, applyWeatherTheme, type WeatherTheme } from "@/lib/weatherTheme"
import type { WeatherData } from "@/types/weather"

// Backend API URL — falls back to local dev server if env var is not set.
// Set VITE_API_URL in .env to point to the deployed weather-server.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

// Maximum number of recent searches to keep in state
const MAX_RECENT = 6

export default function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unit, setUnit] = useState<"metric" | "imperial">("metric")
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [theme, setTheme] = useState<WeatherTheme | null>(null)
  const lastCityRef = useRef<string | null>(null)

  // Prepends a city to the recent searches list, deduplicating case-insensitively
  // and capping the list at MAX_RECENT entries.
  const addRecent = useCallback((city: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== city.toLowerCase())
      return [city, ...filtered].slice(0, MAX_RECENT)
    })
  }, [])

  // Fetches current weather for the given city from the backend proxy.
  // useCallback memoises the function so it only re-creates when `unit` changes,
  // preventing unnecessary re-renders of child components that receive it as a prop.
  const fetchWeather = useCallback(async (city: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await axios.get(`${API_URL}/weather`, {
        params: { city, units: unit },
      })
      
      setWeather(response.data)
      addRecent(city)
      lastCityRef.current = city

      const t = getWeatherTheme(
        response.data.weather[0].id,
        response.data.sys.sunrise,
        response.data.sys.sunset
      )
      applyWeatherTheme(t)
      setTheme(t)
    } catch (err: any) {
      // Use the error message from the server if available, otherwise show a generic fallback
      const message = err.response?.data?.error || "Could not fetch weather data. Please try again."
      
      setError(message)
      setWeather(null)
    } finally {
      setLoading(false)
    }
  }, [unit])

  // Toggles between Celsius (metric) and Fahrenheit (imperial)
  const toggleUnit = () => setUnit((p) => (p === "metric" ? "imperial" : "metric"))

  // Re-fetch weather with the new unit whenever it changes, if a city has been searched
  useEffect(() => {
    if (lastCityRef.current) {
      fetchWeather(lastCityRef.current)
    }
  }, [unit]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div
      className="min-h-screen flex flex-col transition-all duration-1000"
      style={{ background: theme?.gradient ?? "linear-gradient(to bottom, #0a1628, #0f2040, #162850)" }}
    >
      <Navbar onSearch={fetchWeather} loading={loading} unit={unit} onToggleUnit={toggleUnit} />

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Inline error banner */}
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Recent search chips — hidden when list is empty */}
        <RecentSearches searches={recentSearches} onSelect={fetchWeather} onClear={() => setRecentSearches([])} />

        {/* Loading state — show skeleton cards while fetching */}
        {loading && <LoadingSkeleton />}

        {/* Weather data — rendered once loading is complete and data is available */}
        {!loading && weather && (
          <div className="space-y-6 animate-fade-in">
            <HeroWeather weather={weather} unit={unit} />
            <WeatherDetails weather={weather} unit={unit} />
          </div>
        )}

        {/* Empty state — shown on first load before any search */}
        {!loading && !weather && !error && <EmptyState onSearch={fetchWeather} />}
      </main>

      <Footer />

      {/* Floating weather chat — only shown when weather data is available */}
      {weather && <WeatherChat weather={weather} unit={unit} apiUrl={API_URL} />}
    </div>
  )
}
