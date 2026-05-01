import type { WeatherData } from "@/types/weather"

export type AlertPriority = "warning" | "suggestion" | "info"

export interface WeatherAlert {
  id: string
  priority: AlertPriority
  icon: string
  title: string
  message: string
  category: "wind" | "uv" | "rain" | "temp" | "visibility" | "humidity" | "storm"
}

// Derive approximate UV index from condition + time of day + cloud cover.
// OWM free tier doesn't include UV — we estimate it.
function estimateUV(weather: WeatherData): number {
  const now = Date.now() / 1000
  const { sunrise, sunset } = weather.sys
  if (now < sunrise || now > sunset) return 0

  const dayLen = sunset - sunrise
  const elapsed = now - sunrise
  // Peak UV at solar noon (50% of daylight elapsed)
  const solarNoonFactor = 1 - Math.abs((elapsed / dayLen) - 0.5) * 2
  const conditionId = weather.weather[0].id
  const cloudFactor = 1 - (weather.clouds.all / 100) * 0.75

  // Base UV by condition group
  let baseUV = 0
  if (conditionId === 800) baseUV = 10          // clear
  else if (conditionId > 800) baseUV = 6        // cloudy
  else if (conditionId >= 700) baseUV = 3       // atmosphere
  else if (conditionId >= 500) baseUV = 2       // rain
  else if (conditionId >= 200) baseUV = 1       // storm

  return Math.round(baseUV * solarNoonFactor * cloudFactor * 10) / 10
}

function windDescription(speed: number, unit: "metric" | "imperial"): string {
  const ms = unit === "imperial" ? speed * 0.44704 : speed
  if (ms < 3) return "calm"
  if (ms < 8) return "light"
  if (ms < 14) return "moderate"
  if (ms < 20) return "strong"
  return "very strong"
}

function tempC(temp: number, unit: "metric" | "imperial"): number {
  return unit === "imperial" ? (temp - 32) * 5 / 9 : temp
}

export function generateAlerts(
  weather: WeatherData,
  unit: "metric" | "imperial"
): WeatherAlert[] {
  const alerts: WeatherAlert[] = []
  const { main, wind, visibility, weather: conditions, sys, rain } = weather
  const conditionId = conditions[0].id
  const tempCelsius = tempC(main.temp, unit)
  const feelsLikeC = tempC(main.feels_like, unit)
  const windMs = unit === "imperial" ? wind.speed * 0.44704 : wind.speed
  const gustMs = wind.gust ? (unit === "imperial" ? wind.gust * 0.44704 : wind.gust) : 0
  const uv = estimateUV(weather)
  const now = Date.now() / 1000
  const isDay = now >= sys.sunrise && now <= sys.sunset
  const tempUnit = unit === "metric" ? "°C" : "°F"
  const speedUnit = unit === "metric" ? "m/s" : "mph"

  // ── STORM / THUNDERSTORM ──────────────────────────────────────────
  if (conditionId >= 200 && conditionId < 300) {
    alerts.push({
      id: "storm",
      priority: "warning",
      icon: "⛈️",
      category: "storm",
      title: "Thunderstorm active",
      message: "Stay indoors. Lightning and heavy rain make outdoor activity dangerous right now.",
    })
  }

  // ── WIND ─────────────────────────────────────────────────────────
  if (windMs >= 14) {
    alerts.push({
      id: "wind-high",
      priority: windMs >= 20 ? "warning" : "suggestion",
      icon: "💨",
      category: "wind",
      title: `${windMs >= 20 ? "Dangerous" : "Strong"} winds — ${Math.round(wind.speed)} ${speedUnit}`,
      message: windMs >= 20
        ? "Avoid cycling and outdoor activities. Strong gusts can be hazardous."
        : `Wind makes cycling and running uncomfortable. ${windDescription(wind.speed, unit)} breeze expected.`,
    })
  }

  if (gustMs >= 17) {
    alerts.push({
      id: "gust",
      priority: "warning",
      icon: "🌬️",
      category: "wind",
      title: `Gusts up to ${Math.round(wind.gust!)} ${speedUnit}`,
      message: "Sudden gusts make cycling unsafe and can affect balance while walking.",
    })
  }

  // ── UV ────────────────────────────────────────────────────────────
  if (uv >= 8) {
    alerts.push({
      id: "uv-extreme",
      priority: "warning",
      icon: "☀️",
      category: "uv",
      title: `Very high UV (est. ${uv})`,
      message: "Apply SPF 50+ sunscreen. Avoid direct sun between 11am–2pm. Wear a hat and sunglasses.",
    })
  } else if (uv >= 6) {
    alerts.push({
      id: "uv-high",
      priority: "suggestion",
      icon: "🌤️",
      category: "uv",
      title: `High UV (est. ${uv})`,
      message: "Sunscreen recommended for outdoor activities, especially around solar noon.",
    })
  } else if (uv >= 3 && isDay) {
    alerts.push({
      id: "uv-moderate",
      priority: "info",
      icon: "🌥️",
      category: "uv",
      title: "Moderate UV",
      message: "Light sun protection advisable if spending extended time outdoors.",
    })
  }

  // ── RAIN ─────────────────────────────────────────────────────────
  if (conditionId >= 500 && conditionId < 600) {
    const heavy = conditionId >= 502
    alerts.push({
      id: "rain",
      priority: heavy ? "warning" : "suggestion",
      icon: "🌧️",
      category: "rain",
      title: heavy ? "Heavy rain" : "Rain expected",
      message: heavy
        ? "Heavy rainfall — carry an umbrella and avoid flood-prone areas."
        : `${conditions[0].description} — bring an umbrella if heading out.`,
    })
  }

  if (rain?.["1h"] && rain["1h"] > 10) {
    alerts.push({
      id: "rain-heavy",
      priority: "warning",
      icon: "⛈️",
      category: "rain",
      title: `Heavy rainfall — ${rain["1h"]}mm in last hour`,
      message: "Roads may be slippery. Avoid cycling and allow extra travel time.",
    })
  }

  // ── TEMPERATURE ───────────────────────────────────────────────────
  if (tempCelsius >= 35) {
    alerts.push({
      id: "heat-extreme",
      priority: "warning",
      icon: "🌡️",
      category: "temp",
      title: `Extreme heat — ${Math.round(main.temp)}${tempUnit}`,
      message: "Stay hydrated and avoid strenuous outdoor activity. Risk of heat exhaustion.",
    })
  } else if (tempCelsius >= 30) {
    alerts.push({
      id: "heat-high",
      priority: "suggestion",
      icon: "🔆",
      category: "temp",
      title: `Hot conditions — ${Math.round(main.temp)}${tempUnit}`,
      message: "Drink plenty of water. Plan outdoor activities for early morning or evening.",
    })
  } else if (feelsLikeC <= -10) {
    alerts.push({
      id: "cold-extreme",
      priority: "warning",
      icon: "🥶",
      category: "temp",
      title: `Feels like ${Math.round(main.feels_like)}${tempUnit}`,
      message: "Dangerously cold wind chill. Cover exposed skin and limit time outdoors.",
    })
  } else if (feelsLikeC <= 0) {
    alerts.push({
      id: "cold-freezing",
      priority: "suggestion",
      icon: "❄️",
      category: "temp",
      title: "Freezing conditions",
      message: "Ice possible on roads and paths. Dress in warm layers and watch your step.",
    })
  }

  // ── VISIBILITY ────────────────────────────────────────────────────
  if (visibility < 1000) {
    alerts.push({
      id: "visibility-low",
      priority: "warning",
      icon: "🌫️",
      category: "visibility",
      title: `Very low visibility — ${(visibility / 1000).toFixed(1)}km`,
      message: "Dense fog or mist. Drive slowly, use fog lights, and avoid cycling on busy roads.",
    })
  } else if (visibility < 3000) {
    alerts.push({
      id: "visibility-reduced",
      priority: "suggestion",
      icon: "🌁",
      category: "visibility",
      title: `Reduced visibility — ${(visibility / 1000).toFixed(1)}km`,
      message: "Misty conditions. Take extra care when driving or cycling.",
    })
  }

  // ── HUMIDITY ─────────────────────────────────────────────────────
  if (main.humidity >= 85 && tempCelsius >= 25) {
    alerts.push({
      id: "humidity-high",
      priority: "suggestion",
      icon: "💧",
      category: "humidity",
      title: `High humidity — ${main.humidity}%`,
      message: "Feels muggy and uncomfortable. Stay hydrated and take breaks during exercise.",
    })
  }

  // ── SNOW ─────────────────────────────────────────────────────────
  if (conditionId >= 600 && conditionId < 700) {
    alerts.push({
      id: "snow",
      priority: conditionId >= 602 ? "warning" : "suggestion",
      icon: "❄️",
      category: "temp",
      title: conditionId >= 602 ? "Heavy snow" : "Snow falling",
      message: conditionId >= 602
        ? "Heavy snowfall — avoid driving if possible. Roads will be hazardous."
        : "Light snow — paths may be slippery. Wear appropriate footwear.",
    })
  }

  // Sort: warning → suggestion → info
  const order: Record<AlertPriority, number> = { warning: 0, suggestion: 1, info: 2 }
  return alerts.sort((a, b) => order[a.priority] - order[b.priority])
}
