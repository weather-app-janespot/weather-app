import { useState, useEffect, useRef } from "react"
import { User, Mail, Lock, Save, LogOut, ArrowLeft, Loader2, Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { login, register, logout, updateProfile, googleSignIn, type AuthUser } from "@/lib/auth"
import type { UserProfile } from "@/types/profile"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void
          renderButton: (el: HTMLElement, config: object) => void
        }
      }
    }
  }
}

interface ProfilePageProps {
  apiUrl: string
  user: AuthUser | null
  onAuthChange: (user: AuthUser | null) => void
  onBack: () => void
}

type AuthTab = "login" | "register"

const ACTIVITY_OPTIONS = [
  { label: "🏃 Running",        value: "Running" },
  { label: "🚶 Walking",        value: "Walking" },
  { label: "🚴 Cycling",        value: "Cycling" },
  { label: "🏊 Swimming",       value: "Swimming" },
  { label: "⛳ Golf",           value: "Golf" },
  { label: "🧘 Outdoor Yoga",   value: "Outdoor Yoga" },
  { label: "🍽️ Outdoor Dining", value: "Outdoor Dining" },
  { label: "🧺 Picnics",        value: "Picnic" },
  { label: "🏕️ Hiking",         value: "Hiking" },
  { label: "🚌 Commuting",      value: "Commuting" },
]

const SENSITIVITY_OPTIONS: { value: "low" | "normal" | "high"; label: string; desc: string }[] = [
  { value: "low",    label: "Tolerant",  desc: "Handles it well" },
  { value: "normal", label: "Normal",    desc: "Average sensitivity" },
  { value: "high",   label: "Sensitive", desc: "Prefers to avoid" },
]

export function ProfilePage({ apiUrl, user, onAuthChange, onBack }: ProfilePageProps) {
  const [authTab, setAuthTab] = useState<AuthTab>("login")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [authLoading, setAuthLoading] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const googleBtnRef = useRef<HTMLDivElement>(null)

  // Load Google GSI script and render the sign-in button
  useEffect(() => {
    if (user) return
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId) return

    const initGoogle = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          setAuthLoading(true)
          setAuthError(null)
          try {
            const u = await googleSignIn(apiUrl, response.credential)
            onAuthChange(u)
          } catch (err: any) {
            setAuthError(err.response?.data?.error || "Google sign-in failed")
          } finally {
            setAuthLoading(false)
          }
        },
      })
      if (googleBtnRef.current) {
        window.google?.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          width: googleBtnRef.current.offsetWidth || 400,
          text: "continue_with",
          shape: "rectangular",
        })
      }
    }

    if (window.google) {
      initGoogle()
    } else {
      const script = document.createElement("script")
      script.src = "https://accounts.google.com/gsi/client"
      script.async = true
      script.defer = true
      script.onload = initGoogle
      document.head.appendChild(script)
    }
  }, [user, apiUrl])

  // Profile edit state — initialised from user profile
  const [draft, setDraft] = useState<UserProfile & { name: string }>({
    name: user?.name ?? "",
    activities: user?.profile?.activities ?? [],
    heatSensitivity: user?.profile?.heatSensitivity ?? "normal",
    coldSensitivity: user?.profile?.coldSensitivity ?? "normal",
    otherPreferences: user?.profile?.otherPreferences ?? "",
  })
  const [saveLoading, setSaveLoading] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const handleLogin = async () => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const u = await login(apiUrl, email, password)
      onAuthChange(u)
      setDraft({ name: u.name, ...u.profile })
    } catch (err: any) {
      setAuthError(err.response?.data?.error || "Login failed")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleRegister = async () => {
    setAuthLoading(true)
    setAuthError(null)
    try {
      const u = await register(apiUrl, email, password, name)
      onAuthChange(u)
      setDraft({ name: u.name, ...u.profile })
    } catch (err: any) {
      setAuthError(err.response?.data?.error || "Registration failed")
    } finally {
      setAuthLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaveLoading(true)
    setSaveError(null)
    setSaveSuccess(false)
    try {
      const updated = await updateProfile(apiUrl, draft)
      onAuthChange({ ...user!, name: draft.name, profile: updated })
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
    } catch (err: any) {
      setSaveError(err.response?.data?.error || "Failed to save")
    } finally {
      setSaveLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    onAuthChange(null)
  }

  const toggleActivity = (value: string) => {
    setDraft((p) => ({
      ...p,
      activities: p.activities.includes(value)
        ? p.activities.filter((a) => a !== value)
        : [...p.activities, value],
    }))
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Page header */}
      <div className="sticky top-0 z-40 border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <Separator orientation="vertical" className="h-4" />
          <span className="text-sm font-medium">
            {user ? "My Profile" : "Sign in to WeatherNow"}
          </span>
        </div>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* ── NOT SIGNED IN ── */}
        {!user && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-base">
                    {authTab === "login" ? "Welcome back" : "Create account"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Save your preferences across devices
                  </p>
                </div>
              </div>

              {/* Tab switcher */}
              <div className="flex mt-4 bg-secondary/50 rounded-lg p-0.5 w-fit">
                {(["login", "register"] as AuthTab[]).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setAuthTab(tab); setAuthError(null) }}
                    className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
                      authTab === tab
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab === "login" ? "Sign in" : "Register"}
                  </button>
                ))}
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Google sign-in button — rendered by GSI SDK */}
              {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                <>
                  <div ref={googleBtnRef} className="w-full" />
                  <div className="flex items-center gap-3">
                    <Separator className="flex-1" />
                    <span className="text-xs text-muted-foreground">or</span>
                    <Separator className="flex-1" />
                  </div>
                </>
              )}
              {authTab === "register" && (
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Your name (optional)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (authTab === "login" ? handleLogin() : handleRegister())}
                  className="pl-9"
                />
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (authTab === "login" ? handleLogin() : handleRegister())}
                  className="pl-9 pr-9"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>

              {authError && <p className="text-sm text-red-400">{authError}</p>}

              <Button
                className="w-full"
                onClick={authTab === "login" ? handleLogin : handleRegister}
                disabled={authLoading || !email || !password}
              >
                {authLoading
                  ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Please wait...</>
                  : authTab === "login" ? "Sign in" : "Create account"
                }
              </Button>
            </CardContent>
          </Card>
        )}

        {/* ── SIGNED IN ── */}
        {user && (
          <>
            {/* Account info */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    {user.avatar
                      ? <img src={user.avatar} alt={user.name} className="h-6 w-6 rounded-full" />
                      : <User className="h-4 w-4 text-primary" />
                    }
                    Account
                  </CardTitle>
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign out
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Your name"
                    value={draft.name}
                    onChange={(e) => setDraft((p) => ({ ...p, name: e.target.value }))}
                    className="pl-9"
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={user.email} disabled className="pl-9 opacity-60" />
                </div>
              </CardContent>
            </Card>

            {/* Preferences */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Activity Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">

                {/* Activities */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Select your favourite activities</p>
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

                <Separator />

                {/* Heat sensitivity */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Heat sensitivity</p>
                  <div className="grid grid-cols-3 gap-2">
                    {SENSITIVITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDraft((p) => ({ ...p, heatSensitivity: opt.value }))}
                        className={`py-2.5 rounded-lg text-xs font-medium border transition-all text-center ${
                          draft.heatSensitivity === opt.value
                            ? "bg-orange-500/20 border-orange-500/40 text-orange-300"
                            : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                        }`}
                      >
                        <div>{opt.label}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cold sensitivity */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Cold sensitivity</p>
                  <div className="grid grid-cols-3 gap-2">
                    {SENSITIVITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDraft((p) => ({ ...p, coldSensitivity: opt.value }))}
                        className={`py-2.5 rounded-lg text-xs font-medium border transition-all text-center ${
                          draft.coldSensitivity === opt.value
                            ? "bg-blue-500/20 border-blue-500/40 text-blue-300"
                            : "bg-white/5 border-white/10 text-muted-foreground hover:border-white/20"
                        }`}
                      >
                        <div>{opt.label}</div>
                        <div className="text-[10px] opacity-70 mt-0.5">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Other */}
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Other preferences</p>
                  <Input
                    placeholder='e.g. "I avoid rain, I prefer mornings"'
                    value={draft.otherPreferences}
                    onChange={(e) => setDraft((p) => ({ ...p, otherPreferences: e.target.value }))}
                  />
                </div>

                {saveError && <p className="text-sm text-red-400">{saveError}</p>}
                {saveSuccess && <p className="text-sm text-emerald-400">Preferences saved!</p>}

                <Button onClick={handleSaveProfile} disabled={saveLoading} className="w-full">
                  {saveLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</>
                    : <><Save className="h-4 w-4 mr-2" />Save preferences</>
                  }
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  )
}
