import React, { useState } from "react"
import { Search, MapPin, CloudSun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

interface NavbarProps {
  onSearch: (city: string) => void
  loading: boolean
  unit: "metric" | "imperial"
  onToggleUnit: () => void
}

export function Navbar({ onSearch, loading, unit, onToggleUnit }: NavbarProps) {
  // Local input state — cleared after each successful search submission
  const [city, setCity] = useState("")

  // Triggers a search and resets the input field
  const handleSearch = () => {
    if (city.trim()) {
      onSearch(city.trim())
      setCity("")
    }
  }

  return (
    // sticky + backdrop-blur keeps the navbar visible and readable while scrolling
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand logo and name */}
        <div className="flex items-center gap-2.5 mr-4">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
            <CloudSun className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="font-semibold text-base tracking-tight hidden sm:inline">WeatherNow</span>
        </div>

        {/* City search input + submit button */}
        <div className="flex-1 max-w-md mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search city..."
              className="pl-9 pr-3 h-9 bg-secondary/50 border-0 focus-visible:ring-1"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              // Allow submitting with the Enter key
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              aria-label="Search for a city"
            />
          </div>
          {/* Shows a spinner while a request is in-flight */}
          <Button size="icon" onClick={handleSearch} disabled={loading || !city.trim()} aria-label="Search">
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* °C / °F unit toggle — active unit gets a highlighted pill style */}
        <div className="flex items-center gap-2 ml-4">
          <Separator orientation="vertical" className="h-5 hidden sm:block" />
          <div className="flex items-center bg-secondary rounded-lg p-0.5">
            <button
              // Only fires toggle when switching away from the current unit
              onClick={unit === "imperial" ? onToggleUnit : undefined}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                unit === "metric" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              °C
            </button>
            <button
              onClick={unit === "metric" ? onToggleUnit : undefined}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                unit === "imperial" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              °F
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
