// Maps OpenWeatherMap condition + time of day to a full-screen sky gradient.
// OWM condition ID groups: https://openweathermap.org/weather-conditions

export interface WeatherTheme {
  gradient: string   // CSS gradient for the full-page background
  cardBg: string     // semi-transparent card background
  cardBorder: string // card border color
  primary: string    // HSL for --primary (accent color)
  label: string
}

function isNight(sunrise: number, sunset: number): boolean {
  const now = Date.now() / 1000
  return now < sunrise || now > sunset
}

function isSunrise(sunrise: number): boolean {
  const now = Date.now() / 1000
  return now >= sunrise && now <= sunrise + 3600
}

function isSunset(sunset: number): boolean {
  const now = Date.now() / 1000
  return now >= sunset - 3600 && now <= sunset
}

export function getWeatherTheme(
  conditionId: number,
  sunrise: number,
  sunset: number
): WeatherTheme {
  const night = isNight(sunrise, sunset)
  const sunrise_ = isSunrise(sunrise)
  const sunset_ = isSunset(sunset)

  // Thunderstorm (2xx)
  if (conditionId >= 200 && conditionId < 300) {
    return {
      label: "thunderstorm",
      gradient: "linear-gradient(to bottom, #0d0015, #1a0030, #2d1060)",
      cardBg: "rgba(20, 0, 40, 0.55)",
      cardBorder: "rgba(160, 80, 255, 0.2)",
      primary: "270 90% 70%",
    }
  }

  // Drizzle (3xx) or Rain (5xx)
  if (
    (conditionId >= 300 && conditionId < 400) ||
    (conditionId >= 500 && conditionId < 600)
  ) {
    return night
      ? {
          label: "rain-night",
          gradient: "linear-gradient(to bottom, #050e1a, #0a1f35, #0f2d4a)",
          cardBg: "rgba(5, 20, 40, 0.60)",
          cardBorder: "rgba(80, 160, 220, 0.2)",
          primary: "200 75% 58%",
        }
      : {
          label: "rain-day",
          gradient: "linear-gradient(to bottom, #1a2a3a, #243650, #2e4060)",
          cardBg: "rgba(20, 35, 55, 0.60)",
          cardBorder: "rgba(100, 170, 230, 0.2)",
          primary: "205 70% 62%",
        }
  }

  // Snow (6xx)
  if (conditionId >= 600 && conditionId < 700) {
    return {
      label: "snow",
      gradient: "linear-gradient(to bottom, #1a2535, #253045, #303d55)",
      cardBg: "rgba(30, 45, 70, 0.55)",
      cardBorder: "rgba(180, 210, 255, 0.25)",
      primary: "210 65% 82%",
    }
  }

  // Atmosphere — fog, mist, haze, dust (7xx)
  if (conditionId >= 700 && conditionId < 800) {
    return {
      label: "atmosphere",
      gradient: "linear-gradient(to bottom, #1e1a14, #2e2820, #3d352a)",
      cardBg: "rgba(35, 28, 18, 0.60)",
      cardBorder: "rgba(200, 170, 100, 0.2)",
      primary: "38 65% 62%",
    }
  }

  // Clear sky (800)
  if (conditionId === 800) {
    if (sunrise_) return {
      label: "sunrise",
      gradient: "linear-gradient(to bottom, #0d1b3e, #7b3f1e, #e8722a, #f5b942)",
      cardBg: "rgba(20, 15, 10, 0.50)",
      cardBorder: "rgba(245, 185, 66, 0.25)",
      primary: "38 95% 58%",
    }
    if (sunset_) return {
      label: "sunset",
      gradient: "linear-gradient(to bottom, #1a1040, #6b2d6b, #c45c2e, #e8922a)",
      cardBg: "rgba(25, 10, 20, 0.50)",
      cardBorder: "rgba(220, 120, 60, 0.25)",
      primary: "25 90% 60%",
    }
    if (night) return {
      label: "clear-night",
      gradient: "linear-gradient(to bottom, #020510, #050d20, #0a1535, #0f1f4a)",
      cardBg: "rgba(5, 10, 30, 0.60)",
      cardBorder: "rgba(100, 140, 255, 0.2)",
      primary: "225 85% 68%",
    }
    // Clear day
    return {
      label: "clear-day",
      gradient: "linear-gradient(to bottom, #0a4a8a, #1a6ab5, #2e8fd4, #5ab0e8)",
      cardBg: "rgba(5, 30, 65, 0.55)",
      cardBorder: "rgba(100, 200, 255, 0.2)",
      primary: "42 98% 58%",
    }
  }

  // Clouds (80x)
  if (conditionId > 800 && conditionId < 900) {
    return night
      ? {
          label: "cloudy-night",
          gradient: "linear-gradient(to bottom, #0a0f1a, #111825, #182030)",
          cardBg: "rgba(10, 15, 30, 0.60)",
          cardBorder: "rgba(100, 130, 180, 0.2)",
          primary: "215 60% 65%",
        }
      : {
          label: "cloudy-day",
          gradient: "linear-gradient(to bottom, #1e2d40, #2a3d55, #354d68)",
          cardBg: "rgba(20, 35, 55, 0.58)",
          cardBorder: "rgba(120, 170, 220, 0.2)",
          primary: "210 60% 68%",
        }
  }

  // Fallback
  return {
    label: "default",
    gradient: "linear-gradient(to bottom, #0a1628, #0f2040, #162850)",
    cardBg: "rgba(10, 20, 45, 0.60)",
    cardBorder: "rgba(80, 120, 200, 0.2)",
    primary: "217 91% 60%",
  }
}

export function applyWeatherTheme(theme: WeatherTheme) {
  const root = document.documentElement
  // Set the gradient on a CSS variable for use in App
  root.style.setProperty("--sky-gradient", theme.gradient)
  root.style.setProperty("--card-bg", theme.cardBg)
  root.style.setProperty("--card-border", theme.cardBorder)
  root.style.setProperty("--primary", theme.primary)
  // Keep card/secondary/border in sync for components that use them
  root.style.setProperty("--card", "0 0% 0%") // overridden by --card-bg directly
  root.style.setProperty("--secondary", "0 0% 100% / 0.06")
  root.style.setProperty("--muted", "0 0% 100% / 0.06")
  root.style.setProperty("--accent", "0 0% 100% / 0.08")
  root.style.setProperty("--border", "0 0% 100% / 0.1")
  root.style.setProperty("--input", "0 0% 100% / 0.08")
}
