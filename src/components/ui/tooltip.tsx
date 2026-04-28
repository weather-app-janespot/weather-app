import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  content: string
  children: React.ReactNode
}

function Tooltip({ content, children }: TooltipProps) {
  return (
    <div className="relative group">
      {children}
      <div className={cn(
        "absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs rounded bg-popover text-popover-foreground border shadow-md",
        "opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50"
      )}>
        {content}
      </div>
    </div>
  )
}

export { Tooltip }
