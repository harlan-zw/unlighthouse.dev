export type ToolColor = 'emerald' | 'sky' | 'violet' | 'amber' | 'cyan' | 'teal' | 'blue' | 'indigo' | 'orange' | 'green'

export interface ToolInsight {
  type: 'positive' | 'info' | 'warning'
  icon: string
  title: string
  description: string
}

const accentClasses: Record<ToolColor, string> = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  sky: 'text-sky-600 dark:text-sky-400',
  violet: 'text-violet-600 dark:text-violet-400',
  amber: 'text-amber-600 dark:text-amber-400',
  cyan: 'text-cyan-600 dark:text-cyan-400',
  teal: 'text-teal-600 dark:text-teal-400',
  blue: 'text-blue-600 dark:text-blue-400',
  indigo: 'text-indigo-600 dark:text-indigo-400',
  orange: 'text-orange-600 dark:text-orange-400',
  green: 'text-green-600 dark:text-green-400',
}

const glowClasses: Record<ToolColor, string> = {
  emerald: 'from-emerald-500/10 via-emerald-500/5 to-transparent',
  sky: 'from-sky-500/10 via-cyan-500/5 to-transparent',
  violet: 'from-violet-500/10 via-violet-500/5 to-transparent',
  amber: 'from-amber-500/10 via-amber-500/5 to-transparent',
  cyan: 'from-cyan-500/10 via-cyan-500/5 to-transparent',
  teal: 'from-teal-500/10 via-teal-500/5 to-transparent',
  blue: 'from-blue-500/10 via-blue-500/5 to-transparent',
  indigo: 'from-indigo-500/10 via-indigo-500/5 to-transparent',
  orange: 'from-orange-500/10 via-orange-500/5 to-transparent',
  green: 'from-green-500/10 via-green-500/5 to-transparent',
}

const iconClasses: Record<ToolColor, string> = {
  emerald: 'text-emerald-500',
  sky: 'text-sky-500',
  violet: 'text-violet-500',
  amber: 'text-amber-500',
  cyan: 'text-cyan-500',
  teal: 'text-teal-500',
  blue: 'text-blue-500',
  indigo: 'text-indigo-500',
  orange: 'text-orange-500',
  green: 'text-green-500',
}

const loadingPillClasses: Record<ToolColor, { bg: string, border: string, icon: string, text: string, progressBar: string }> = {
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', icon: 'text-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', progressBar: 'bg-emerald-500' },
  sky: { bg: 'bg-sky-50 dark:bg-sky-900/20', border: 'border-sky-200 dark:border-sky-800', icon: 'text-sky-500', text: 'text-sky-700 dark:text-sky-300', progressBar: 'bg-sky-500' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', border: 'border-violet-200 dark:border-violet-800', icon: 'text-violet-500', text: 'text-violet-700 dark:text-violet-300', progressBar: 'bg-violet-500' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: 'text-amber-500', text: 'text-amber-700 dark:text-amber-300', progressBar: 'bg-amber-500' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', border: 'border-cyan-200 dark:border-cyan-800', icon: 'text-cyan-500', text: 'text-cyan-700 dark:text-cyan-300', progressBar: 'bg-cyan-500' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', border: 'border-teal-200 dark:border-teal-800', icon: 'text-teal-500', text: 'text-teal-700 dark:text-teal-300', progressBar: 'bg-teal-500' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', icon: 'text-blue-500', text: 'text-blue-700 dark:text-blue-300', progressBar: 'bg-blue-500' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', border: 'border-indigo-200 dark:border-indigo-800', icon: 'text-indigo-500', text: 'text-indigo-700 dark:text-indigo-300', progressBar: 'bg-indigo-500' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', icon: 'text-orange-500', text: 'text-orange-700 dark:text-orange-300', progressBar: 'bg-orange-500' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: 'text-green-500', text: 'text-green-700 dark:text-green-300', progressBar: 'bg-green-500' },
}

const buttonClasses: Record<ToolColor, string> = {
  emerald: 'bg-emerald-600 hover:bg-emerald-500 text-white',
  sky: 'bg-sky-600 hover:bg-sky-500 text-white',
  violet: 'bg-violet-600 hover:bg-violet-500 text-white',
  amber: 'bg-amber-600 hover:bg-amber-500 text-white',
  cyan: 'bg-cyan-600 hover:bg-cyan-500 text-white',
  teal: 'bg-teal-600 hover:bg-teal-500 text-white',
  blue: 'bg-blue-600 hover:bg-blue-500 text-white',
  indigo: 'bg-indigo-600 hover:bg-indigo-500 text-white',
  orange: 'bg-orange-600 hover:bg-orange-500 text-white',
  green: 'bg-green-600 hover:bg-green-500 text-white',
}

export function toolAccentClass(color: ToolColor): string {
  return accentClasses[color]
}

export function toolGlowClass(color: ToolColor): string {
  return glowClasses[color]
}

export function toolIconClass(color: ToolColor): string {
  return iconClasses[color]
}

export function toolLoadingPillClasses(color: ToolColor) {
  return loadingPillClasses[color]
}

export function toolButtonClass(color: ToolColor): string {
  return buttonClasses[color]
}
