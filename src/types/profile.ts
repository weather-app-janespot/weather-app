export type HeatSensitivity = "low" | "normal" | "high"
export type ColdSensitivity = "low" | "normal" | "high"

export interface UserProfile {
  activities: string[]        // e.g. ["Running", "Cycling", "Walking"]
  heatSensitivity: HeatSensitivity
  coldSensitivity: ColdSensitivity
  otherPreferences: string    // free-text, e.g. "I avoid rain"
}

export const DEFAULT_PROFILE: UserProfile = {
  activities: [],
  heatSensitivity: "normal",
  coldSensitivity: "normal",
  otherPreferences: "",
}

const STORAGE_KEY = "weathernow_profile"

export function loadProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_PROFILE
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_PROFILE
  }
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
}

// Converts a profile to a plain-English string for the AI prompt
export function profileToPromptString(profile: UserProfile): string {
  const parts: string[] = []
  if (profile.activities.length > 0)
    parts.push(`Preferred activities: ${profile.activities.join(", ")}`)
  if (profile.heatSensitivity !== "normal")
    parts.push(`Heat sensitivity: ${profile.heatSensitivity} (${profile.heatSensitivity === "high" ? "dislikes hot weather" : "tolerates heat well"})`)
  if (profile.coldSensitivity !== "normal")
    parts.push(`Cold sensitivity: ${profile.coldSensitivity} (${profile.coldSensitivity === "high" ? "dislikes cold weather" : "tolerates cold well"})`)
  if (profile.otherPreferences.trim())
    parts.push(profile.otherPreferences.trim())
  return parts.join(". ")
}
