import { ServiceOrderStatus, Priority } from '@prisma/client'
import { Badge } from '@/components/ui/badge'
import { statusColors, statusLabels, priorityColors, priorityLabels } from '@/types'

interface StatusBadgeProps {
  status: ServiceOrderStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const variant = statusColors[status] as any
  const label = statusLabels[status]

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}

interface PriorityBadgeProps {
  priority: Priority
  className?: string
}

export function PriorityBadge({ priority, className }: PriorityBadgeProps) {
  const variant = priorityColors[priority] as any
  const label = priorityLabels[priority]

  return (
    <Badge variant={variant} className={className}>
      {label}
    </Badge>
  )
}
