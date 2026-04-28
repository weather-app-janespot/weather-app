// TypeScript interface representing the current weather response
// from the OpenWeatherMap /data/2.5/weather endpoint.
export interface WeatherData {
  // City name returned by the API (e.g. "London")
  name: string

  sys: {
    // Two-letter country code (e.g. "GB")
    country: string
    // Unix timestamp (seconds) for sunrise in the city's timezone
    sunrise: number
    // Unix timestamp (seconds) for sunset in the city's timezone
    sunset: number
  }

  main: {
    // Current temperature in the requested unit
    temp: number
    // Perceived temperature accounting for wind and humidity
    feels_like: number
    // Relative humidity percentage (0–100)
    humidity: number
    // Atmospheric pressure at sea level in hPa
    pressure: number
    // Minimum temperature observed within the city at the moment
    temp_min: number
    // Maximum temperature observed within the city at the moment
    temp_max: number
  }

  // Array of weather condition objects — typically contains one entry
  weather: {
    // OpenWeatherMap condition code
    id: number
    // Short group name (e.g. "Rain", "Clear")
    main: string
    // Human-readable description (e.g. "light rain")
    description: string
    // Icon code used to build the icon URL: https://openweathermap.org/img/wn/{icon}@4x.png
    icon: string
  }[]

  wind: {
    // Wind speed in m/s (metric) or mph (imperial)
    speed: number
    // Wind direction in meteorological degrees (0–360)
    deg: number
    // Wind gust speed — optional, not always present
    gust?: number
  }

  // Visibility in metres (max 10,000)
  visibility: number

  clouds: {
    // Cloudiness percentage (0–100)
    all: number
  }

  coord: {
    // Latitude of the city
    lat: number
    // Longitude of the city
    lon: number
  }

  // Unix timestamp (seconds) of the data calculation time
  dt: number

  // Shift in seconds from UTC for the city's timezone
  timezone: number

  // Precipitation volume — only present when it has rained
  rain?: {
    "1h"?: number  // mm in the last hour
    "3h"?: number  // mm in the last 3 hours
  }
}
