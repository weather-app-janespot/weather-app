import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Utility for merging Tailwind CSS class names safely.
// clsx handles conditional/array class inputs, twMerge resolves
// conflicting Tailwind classes (e.g. "p-2 p-4" → "p-4").
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
