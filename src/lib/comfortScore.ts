import type { WeatherData } from "@/types/weather"

export interface ScoreFactor {
  label: string
  value: number      // 0–100 contribution
  detail: string     // human-readable explanation
  icon: string
}

export interface ComfortResult {
  comfort: number          // 0–100
  outdoor: number          // 0–100
  factors: ScoreFactor[]
  comfortLabel: string     // e.g. "Very Comfortable"
  outdoorLabel: string     // e.g. "Great for outdoors"
}

function tempC(temp: number, unit: "metric" | "imperial"): number {
  return unit === "imperial" ? (temp - 32) * 5 / 9 : temp
}

function precipChance(conditionId: number): number {
  if (conditionId >= 200 && conditionId < 300) return 95
  if (conditionId >= 300 && conditionId < 400) return 70
  if (conditionId >= 500 && conditionId < 504) return 85
  if (conditionId === 511) return 90
  if (conditionId >= 520 && conditionId < 532) return 80
  if (conditionId >= 600 && conditionId < 700) return 75
  if (conditionId >= 700 && conditionId < 800) return 20
  if (conditionId === 800) return 0
  if (conditionId === 801) return 5
  if (conditionId === 802) return 10
  if (conditionId === 803) return 20
  if (conditionId === 804) return 30
  return 0
}

function comfortLabel(score: number): string {
  if (score >= 85) return "Very Comfortable"
  if (score >= 70) return "Comfortable"
  if (score >= 55) return "Fairly Comfortable"
  if (score >= 40) return "Somewhat Uncomfortable"
  if (score >= 25) return "Uncomfortable"
  return "Very Uncomfortable"
}

function outdoorLabel(score: number): string {
  if (score >= 85) return "Perfect for outdoors"
  if (score >= 70) return "Great for outdoors"
  if (score >= 55) return "Good for outdoors"
  if (score >= 40) return "Fair for outdoors"
  if (score >= 25) return "Poor for outdoors"
  return "Stay indoors"
}

export function computeScores(
  weather: WeatherData,
  unit: "metric" | "imperial"
): ComfortResult {
  const { main, wind, visibility, weather: conditions } = weather
  const feelsC = tempC(main.feels_like, unit)
  const windMs = unit === "imperial" ? wind.speed * 0.44704 : wind.speed
  const conditionId = conditions[0].id
  const precip = precipChance(conditionId)

  // ── Factor scores (each 0–100) ──────────────────────────────────

  // Temperature: ideal feels-like 18–24°C
  const tempScore = Math.max(0, 100 - Math.abs(feelsC - 21) * 4)
  const tempDetail = feelsC < 0
    ? `Freezing (${Math.round(main.feels_like)}°) — very cold`
    : feelsC < 10
    ? `Cold (${Math.round(main.feels_like)}°) — dress warmly`
    : feelsC < 18
    ? `Cool (${Math.round(main.feels_like)}°) — light jacket recommended`
    : feelsC <= 26
    ? `Ideal (${Math.round(main.feels_like)}°) — very comfortable`
    : feelsC <= 32
    ? `Warm (${Math.round(main.feels_like)}°) — stay hydrated`
    : `Hot (${Math.round(main.feels_like)}°) — heat stress risk`

  // Humidity: ideal 40–60%
  const humScore = Math.max(0, 100 - Math.abs(main.humidity - 50) * 1.5)
  const humDetail = main.humidity < 30
    ? `${main.humidity}% — very dry, may cause irritation`
    : main.humidity <= 60
    ? `${main.humidity}% — ideal range`
    : main.humidity <= 75
    ? `${main.humidity}% — slightly humid`
    : `${main.humidity}% — muggy and uncomfortable`

  // Wind: ideal < 5 m/s
  const windScore = Math.max(0, 100 - windMs * 5)
  const windDetail = windMs < 3
    ? `${wind.speed} ${unit === "metric" ? "m/s" : "mph"} — calm`
    : windMs < 8
    ? `${wind.speed} ${unit === "metric" ? "m/s" : "mph"} — light breeze`
    : windMs < 14
    ? `${wind.speed} ${unit === "metric" ? "m/s" : "mph"} — moderate wind`
    : `${wind.speed} ${unit === "metric" ? "m/s" : "mph"} — strong wind`

  // Visibility: ideal 10km+
  const visScore = Math.min(100, (visibility / 10000) * 100)
  const visDetail = visibility >= 10000
    ? "Clear — excellent visibility"
    : visibility >= 5000
    ? `${(visibility / 1000).toFixed(1)}km — good visibility`
    : visibility >= 2000
    ? `${(visibility / 1000).toFixed(1)}km — reduced visibility`
    : `${(visibility / 1000).toFixed(1)}km — poor visibility`

  // Precipitation: 0% = 100 score, 100% = 0 score
  const precipScore = Math.max(0, 100 - precip)
  const precipDetail = precip === 0
    ? "No precipitation expected"
    : precip < 30
    ? `${precip}% chance — unlikely`
    : precip < 60
    ? `${precip}% chance — possible`
    : `${precip}% chance — likely`

  // UV (estimated)
  const now = Date.now() / 1000
  const { sunrise, sunset } = weather.sys
  const isDay = now >= sunrise && now <= sunset
  const dayLen = sunset - sunrise
  const elapsed = now - sunrise
  const solarFactor = dayLen > 0 ? 1 - Math.abs((elapsed / dayLen) - 0.5) * 2 : 0
  const cloudFactor = 1 - (weather.clouds.all / 100) * 0.75
  let baseUV = conditionId === 800 ? 10 : conditionId > 800 ? 6 : conditionId >= 700 ? 3 : 2
  const uv = isDay ? Math.round(baseUV * solarFactor * cloudFactor * 10) / 10 : 0
  const uvScore = Math.max(0, 100 - uv * 8)
  const uvDetail = uv === 0
    ? "No UV — nighttime or overcast"
    : uv < 3
    ? `UV ${uv} — low, minimal protection needed`
    : uv < 6
    ? `UV ${uv} — moderate, sunscreen recommended`
    : uv < 8
    ? `UV ${uv} — high, SPF 30+ needed`
    : `UV ${uv} — very high, limit sun exposure`

  // ── Weighted composite scores ────────────────────────────────────

  // Comfort: how pleasant it feels to be alive outside
  const comfort = Math.round(
    tempScore   * 0.35 +
    humScore    * 0.20 +
    windScore   * 0.15 +
    visScore    * 0.10 +
    precipScore * 0.10 +
    uvScore     * 0.10
  )

  // Outdoor suitability: heavier weight on precip, wind, UV
  const outdoor = Math.round(
    tempScore   * 0.25 +
    precipScore * 0.25 +
    windScore   * 0.20 +
    uvScore     * 0.15 +
    visScore    * 0.10 +
    humScore    * 0.05
  )

  const factors: ScoreFactor[] = [
    { label: "Temperature",   value: Math.round(tempScore),    detail: tempDetail,    icon: "🌡️" },
    { label: "Humidity",      value: Math.round(humScore),     detail: humDetail,     icon: "💧" },
    { label: "Wind",          value: Math.round(windScore),    detail: windDetail,    icon: "💨" },
    { label: "Precipitation", value: Math.round(precipScore),  detail: precipDetail,  icon: "🌧️" },
    { label: "UV",            value: Math.round(uvScore),      detail: uvDetail,      icon: "☀️" },
    { label: "Visibility",    value: Math.round(visScore),     detail: visDetail,     icon: "👁️" },
  ]

  return {
    comfort: Math.max(0, Math.min(100, comfort)),
    outdoor: Math.max(0, Math.min(100, outdoor)),
    factors,
    comfortLabel: comfortLabel(comfort),
    outdoorLabel: outdoorLabel(outdoor),
  }
}
