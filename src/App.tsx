import React, { useState, useCallback } from "react"
import axios from "axios"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { HeroWeather } from "@/components/HeroWeather"
import { WeatherDetails } from "@/components/WeatherDetails"
import { RecentSearches } from "@/components/RecentSearches"
import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
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
  // Temperature unit — passed down to all components that display temperatures
  const [unit, setUnit] = useState<"metric" | "imperial">("metric")
  const [recentSearches, setRecentSearches] = useState<string[]>([])

  // Prepends a city to the recent searches list, deduplicating case-insensitively
  // and capping the list at MAX_RECENT entries.
  const addRecent = (city: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== city.toLowerCase())
      return [city, ...filtered].slice(0, MAX_RECENT)
    })
  }

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

  return (
    <div className="min-h-screen flex flex-col bg-background">
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
    </div>
  )
}
