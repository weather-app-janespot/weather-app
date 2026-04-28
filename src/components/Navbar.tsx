import React, { useState, useEffect, useRef } from "react"
import { Search, MapPin, CloudSun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import axios from "axios"

interface NavbarProps {
  onSearch: (city: string) => void
  loading: boolean
  unit: "metric" | "imperial"
  onToggleUnit: () => void
}

interface CitySuggestion {
  id: number
  name: string
  state: string
  country: string
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000"

// Minimum characters before autocomplete fires
const MIN_QUERY_LENGTH = 2

// Debounce delay in ms — avoids hammering the server on every keystroke
const DEBOUNCE_MS = 250

export function Navbar({ onSearch, loading, unit, onToggleUnit }: NavbarProps) {
  const [city, setCity] = useState("")
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  // Tracks which suggestion is highlighted via keyboard navigation (-1 = none)
  const [activeIndex, setActiveIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Fetch suggestions from the server whenever the input changes.
  // Debounced so we only fire after the user pauses typing.
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current)

    if (city.trim().length < MIN_QUERY_LENGTH) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }

    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await axios.get(`${API_URL}/cities`, {
          params: { q: city.trim(), limit: 8 },
        })
        setSuggestions(res.data)
        setShowDropdown(res.data.length > 0)
        setActiveIndex(-1)
      } catch {
        // Silently ignore autocomplete errors — the user can still search manually
        setSuggestions([])
        setShowDropdown(false)
      }
    }, DEBOUNCE_MS)

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current)
    }
  }, [city])

  // Close the dropdown when clicking outside the search area
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setShowDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const handleSearch = (value?: string) => {
    const query = (value ?? city).trim()
    if (query) {
      onSearch(query)
      setCity("")
      setSuggestions([])
      setShowDropdown(false)
      setActiveIndex(-1)
    }
  }

  const handleSelect = (suggestion: CitySuggestion) => {
    // Build a "City, Country" string for the weather query
    const query = suggestion.state
      ? `${suggestion.name}, ${suggestion.state}, ${suggestion.country}`
      : `${suggestion.name}, ${suggestion.country}`
    handleSearch(query)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showDropdown) {
      if (e.key === "Enter") handleSearch()
      return
    }

    switch (e.key) {
      case "ArrowDown":
        // Move highlight down, wrapping at the bottom
        e.preventDefault()
        setActiveIndex((i) => (i < suggestions.length - 1 ? i + 1 : 0))
        break
      case "ArrowUp":
        // Move highlight up, wrapping at the top
        e.preventDefault()
        setActiveIndex((i) => (i > 0 ? i - 1 : suggestions.length - 1))
        break
      case "Enter":
        e.preventDefault()
        if (activeIndex >= 0) {
          handleSelect(suggestions[activeIndex])
        } else {
          handleSearch()
        }
        break
      case "Escape":
        setShowDropdown(false)
        setActiveIndex(-1)
        break
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto flex h-14 items-center justify-between px-4 sm:px-6 lg:px-8">

        {/* Brand logo and name */}
        <div className="flex items-center gap-2.5 mr-4">
          <div className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10">
            <CloudSun className="h-4.5 w-4.5 text-primary" />
          </div>
          <span className="font-semibold text-base tracking-tight hidden sm:inline">WeatherNow</span>
        </div>

        {/* Search input with autocomplete dropdown */}
        <div className="flex-1 max-w-md mx-auto flex items-center gap-2">
          <div className="relative flex-1">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10" />
            <Input
              ref={inputRef}
              placeholder="Search city..."
              className="pl-9 pr-3 h-9 bg-secondary/50 border-0 focus-visible:ring-1"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              onKeyDown={handleKeyDown}
              onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
              aria-label="Search for a city"
              aria-autocomplete="list"
              aria-expanded={showDropdown}
              autoComplete="off"
            />

            {/* Autocomplete dropdown */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-lg shadow-lg overflow-hidden z-50"
                role="listbox"
              >
                {suggestions.map((s, i) => (
                  <button
                    key={s.id}
                    role="option"
                    aria-selected={i === activeIndex}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors ${
                      i === activeIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50 text-foreground"
                    }`}
                    // mousedown fires before the input's blur, keeping the dropdown open
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => handleSelect(s)}
                  >
                    <span className="flex items-center gap-2">
                      <MapPin className="h-3 w-3 text-muted-foreground shrink-0" />
                      <span>{s.name}{s.state ? `, ${s.state}` : ""}</span>
                    </span>
                    {/* Country badge */}
                    <span className="text-[10px] text-muted-foreground bg-secondary px-1.5 py-0.5 rounded shrink-0">
                      {s.country}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search button — shows spinner while weather fetch is in-flight */}
          <Button size="icon" onClick={() => handleSearch()} disabled={loading || !city.trim()} aria-label="Search">
            {loading ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* °C / °F unit toggle */}
        <div className="flex items-center gap-2 ml-4">
          <Separator orientation="vertical" className="h-5 hidden sm:block" />
          <div className="flex items-center bg-secondary rounded-lg p-0.5">
            <button
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
