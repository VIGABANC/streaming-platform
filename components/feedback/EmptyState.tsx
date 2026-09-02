import { Sparkles, WifiOff, AlertCircle, SearchX } from 'lucide-react'

interface EmptyStateProps {
  title?: string
  text?: string
  description?: string
  action?: React.ReactNode
  variant?: 'default' | 'search' | 'offline' | 'error'
}

const icons = {
  default: Sparkles,
  search: SearchX,
  offline: WifiOff,
  error: AlertCircle,
}

const iconColors = {
  default: 'text-primary',
  search: 'text-muted-foreground',
  offline: 'text-muted-foreground',
  error: 'text-primary',
}

export function EmptyState({
  title = 'Nothing here yet',
  text,
  description,
  action,
  variant = 'default',
}: EmptyStateProps) {
  const Icon = icons[variant]
  const iconColor = iconColors[variant]
  const message = description ?? text ?? 'Add titles to build your personal shelf.'

  return (
    <div
      role="status"
      className="grid min-h-64 place-items-center rounded-2xl border border-dashed border-white/10 bg-white/[.02] p-8 text-center"
    >
      <div>
        <Icon className={`mx-auto mb-4 ${iconColor}`} size={30} aria-hidden="true" />
        <h2 className="text-xl font-bold text-white font-display">{title}</h2>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">{message}</p>
        {action && <div className="mt-6">{action}</div>}
      </div>
    </div>
  )
}
