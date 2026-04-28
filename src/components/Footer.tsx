import { CloudSun, Github, Heart } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  // Computed at render time so the copyright year is always current
  const year = new Date().getFullYear()

  return (
    <footer className="border-t bg-card/50 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Three-column grid: brand, resources, tech stack */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">

          {/* Brand column */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex items-center justify-center h-7 w-7 rounded-md bg-primary/10">
                <CloudSun className="h-3.5 w-3.5 text-primary" />
              </div>
              <span className="font-semibold text-sm">WeatherNow</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-xs">
              Real-time weather data for any city worldwide. Powered by OpenWeatherMap API.
            </p>
          </div>

          {/* External resource links */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://openweathermap.org/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  OpenWeatherMap API
                </a>
              </li>
              <li>
                <a
                  href="https://github.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5"
                >
                  <Github className="h-3 w-3" /> Source Code
                </a>
              </li>
            </ul>
          </div>

          {/* Tech stack badges */}
          <div className="space-y-3">
            <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Built With</h4>
            <div className="flex flex-wrap gap-1.5">
              {["React", "TypeScript", "Tailwind CSS", "shadcn/ui", "Vite"].map((tech) => (
                <span key={tech} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        {/* Bottom bar: copyright + made-with line */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">&copy; {year} WeatherNow. All rights reserved.</p>
          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
            Made with <Heart className="h-3 w-3 text-red-400 fill-red-400" /> using React
          </p>
        </div>
      </div>
    </footer>
  )
}
