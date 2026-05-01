import { useState } from "react"
import { X, User, Save, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { type UserProfile, DEFAULT_PROFILE, saveProfile } from "@/types/profile"

interface ProfileModalProps {
  profile: UserProfile
  onSave: (profile: UserProfile) => void
  onClose: () => void
}

const ACTIVITY_OPTIONS = [
  { label: "🏃 Running",        value: "Running" },
  { label: "🚶 Walking",        value: "Walking" },
  { label: "🚴 Cycling",        value: "Cycling" },
  { label: "🏊 Swimming",       value: "Swimming" },
  { label: "⛳ Golf",           value: "Golf" },
  { label: "🧘 Yoga/Outdoors",  value: "Outdoor Yoga" },
  { label: "🍽️ Outdoor Dining", value: "Outdoor Dining" },
  { label: "🧺 Picnics",        value: "Picnic" },
  { label: "🏕️ Hiking",         value: "Hiking" },
  { label: "🚌 Commuting",      value: "Commuting" },
]

const SENSITIVITY_OPTIONS: { value: "low" | "normal" | "high"; label: string }[] = [
  { value: "low",    label: "Tolerant" },
  { value: "normal", label: "Normal" },
  { value: "high",   label: "Sensitive" },
]

export function ProfileModal({ profile, onSave, onClose }: ProfileModalProps) {
  const [draft, setDraft] = useState<UserProfile>({ ...profile })

  const toggleActivity = (value: string) => {
    setDraft((p) => ({
      ...p,
      activities: p.activities.includes(value)
        ? p.activities.filter((a) => a !== value)
        : [...p.activities, value],
    }))
  }

  const handleSave = () => {
    saveProfile(draft)
    onSave(draft)
    onClose()
  }

  const handleClear = () => {
    saveProfile(DEFAULT_PROFILE)
    onSave(DEFAULT_PROFILE)
    onClose()
  }

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-card shadow-2xl overflow-hidden animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
              <User className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">My Profile</p>
              <p className="text-[11px] text-muted-foreground">Personalise AI recommendations</p>
            </div>
          </div>
          <button onClick={onClose} className="h-7 w-7 rounded-full flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4 space-y-5 max-h-[70vh] overflow-y-auto">

          {/* Activities */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Favourite activities</p>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => toggleActivity(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    draft.activities.includes(opt.value)
                      ? "bg-primary/20 border-primary/50 text-primary"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Heat sensitivity */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Heat sensitivity</p>
            <div className="flex gap-2">
              {SENSITIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDraft((p) => ({ ...p, heatSensitivity: opt.value }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    draft.heatSensitivity === opt.value
                      ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Cold sensitivity */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Cold sensitivity</p>
            <div className="flex gap-2">
              {SENSITIVITY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setDraft((p) => ({ ...p, coldSensitivity: opt.value }))}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                    draft.coldSensitivity === opt.value
                      ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                      : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Other preferences */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Other preferences</p>
            <Input
              placeholder='e.g. "I avoid rain, I prefer mornings"'
              value={draft.otherPreferences}
              onChange={(e) => setDraft((p) => ({ ...p, otherPreferences: e.target.value }))}
              className="text-sm"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-4 border-t border-white/10">
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Clear profile
          </button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-3.5 w-3.5 mr-1.5" />
              Save
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
