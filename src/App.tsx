import { useState, useCallback, useEffect, useRef } from "react"
import axios from "axios"
import { User, LogIn } from "lucide-react"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { HeroWeather } from "@/components/HeroWeather"
import { WeatherDetails } from "@/components/WeatherDetails"
import { RecentSearches } from "@/components/RecentSearches"
import { EmptyState } from "@/components/EmptyState"
import { LoadingSkeleton } from "@/components/LoadingSkeleton"
import { WeatherChat } from "@/components/WeatherChat"
import { TodayPlan } from "@/components/TodayPlan"
import { WeatherTimeline } from "@/components/WeatherTimeline"
import { WeatherAlerts } from "@/components/WeatherAlerts"
import { ProfilePage } from "@/pages/ProfilePage"
import { getWeatherTheme, applyWeatherTheme, type WeatherTheme } from "@/lib/weatherTheme"
import { fetchCurrentUser, type AuthUser } from "@/lib/auth"
import { loadProfile, profileToPromptString, type UserProfile } from "@/types/profile"
import type { WeatherData } from "@/types/weather"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"
const MAX_RECENT = 6

// Merge auth user profile with localStorage fallback
function resolveProfile(user: AuthUser | null): UserProfile {
  if (user?.profile) return user.profile
  return loadProfile()
}

export default function App() {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [unit, setUnit] = useState<"metric" | "imperial">("metric")
  const [recentSearches, setRecentSearches] = useState<string[]>([])
  const [theme, setTheme] = useState<WeatherTheme | null>(null)
  const [user, setUser] = useState<AuthUser | null>(null)
  const [showProfile, setShowProfile] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)
  const lastCityRef = useRef<string | null>(null)

  const profile = resolveProfile(user)

  // Restore session on mount
  useEffect(() => {
    fetchCurrentUser(API_URL).then((u) => {
      setUser(u)
      setAuthLoading(false)
    })
  }, [])

  const addRecent = useCallback((city: string) => {
    setRecentSearches((prev) => {
      const filtered = prev.filter((c) => c.toLowerCase() !== city.toLowerCase())
      return [city, ...filtered].slice(0, MAX_RECENT)
    })
  }, [])

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
      const message = err.response?.data?.error || "Could not fetch weather data. Please try again."
      setError(message)
      setWeather(null)
    } finally {
      setLoading(false)
    }
  }, [unit])

  const toggleUnit = () => setUnit((p) => (p === "metric" ? "imperial" : "metric"))

  useEffect(() => {
    if (lastCityRef.current) fetchWeather(lastCityRef.current)
  }, [unit]) // eslint-disable-line react-hooks/exhaustive-deps

  const profileStr = profileToPromptString(profile)
  const hasProfile = profile.activities.length > 0 ||
    profile.heatSensitivity !== "normal" ||
    profile.coldSensitivity !== "normal"

  // Profile page view
  if (showProfile) {
    return (
      <div
        className="min-h-screen flex flex-col transition-all duration-1000"
        style={{ background: theme?.gradient ?? "linear-gradient(to bottom, #0a1628, #0f2040, #162850)" }}
      >
        <ProfilePage
          apiUrl={API_URL}
          user={user}
          onAuthChange={(u) => { setUser(u); setShowProfile(false) }}
          onBack={() => setShowProfile(false)}
        />
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex flex-col transition-all duration-1000"
      style={{ background: theme?.gradient ?? "linear-gradient(to bottom, #0a1628, #0f2040, #162850)" }}
    >
      <Navbar onSearch={fetchWeather} loading={loading} unit={unit} onToggleUnit={toggleUnit}>
        {!authLoading && (
          <button
            onClick={() => setShowProfile(true)}
            aria-label={user ? "My profile" : "Sign in"}
            className={`flex items-center gap-1.5 px-3 h-8 rounded-full border text-xs font-medium transition-colors ${
              user
                ? hasProfile
                  ? "border-primary/50 bg-primary/10 text-primary"
                  : "border-white/15 bg-white/5 text-foreground hover:border-white/25"
                : "border-white/15 bg-white/5 text-muted-foreground hover:text-foreground hover:border-white/25"
            }`}
          >
            {user ? (
              <>
                <User className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">{user.name || user.email.split("@")[0]}</span>
              </>
            ) : (
              <>
                <LogIn className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign in</span>
              </>
            )}
          </button>
        )}
      </Navbar>

      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        <RecentSearches searches={recentSearches} onSelect={fetchWeather} onClear={() => setRecentSearches([])} />

        {loading && <LoadingSkeleton />}

        {!loading && weather && (
          <div className="space-y-6 animate-fade-in">
            <HeroWeather weather={weather} unit={unit} />
            <WeatherAlerts weather={weather} unit={unit} />
            <WeatherDetails weather={weather} unit={unit} />
            <WeatherTimeline weather={weather} unit={unit} apiUrl={API_URL} />
            <TodayPlan weather={weather} unit={unit} apiUrl={API_URL} profile={profile} />
          </div>
        )}

        {!loading && !weather && !error && <EmptyState onSearch={fetchWeather} />}
      </main>

      <Footer />

      {weather && (
        <WeatherChat
          weather={weather}
          unit={unit}
          apiUrl={API_URL}
          profile={profile}
          profileStr={profileStr}
        />
      )}
    </div>
  )
}
