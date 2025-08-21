"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  ArrowRight,
  User,
  Wrench
} from 'lucide-react'
import Link from 'next/link'

interface ActionItem {
  id: string
  type: 'urgent' | 'overdue' | 'approval' | 'assignment' | 'follow_up'
  title: string
  description: string
  count?: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  action: {
    label: string
    href: string
  }
}

interface NextActionsProps {
  className?: string
}

export function NextActions({ className }: NextActionsProps) {
  const [actions, setActions] = useState<ActionItem[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchNextActions()
  }, [])

  const fetchNextActions = async () => {
    try {
      setIsLoading(true)
      
      // Buscar ações reais da API
      const response = await fetch('/api/dashboard/next-actions', {
        headers: {
          'x-user-email': 'gestor@prefeitura.gov.br' // Temporário para teste
        }
      })
      
      if (!response.ok) {
        throw new Error('Erro ao buscar ações')
      }
      
      const data = await response.json()
      setActions(data.actions || [])
    } catch (error) {
      console.error('Erro ao buscar próximas ações:', error)
      
      // Fallback para dados simulados se a API falhar
      const mockActions: ActionItem[] = [
        {
          id: '1',
          type: 'urgent',
          title: 'OS Urgentes',
          description: 'Ordens de serviço marcadas como urgentes que precisam de atenção imediata',
          count: 2,
          priority: 'urgent',
          action: {
            label: 'Ver OS Urgentes',
            href: '/dashboard/service-orders?priority=URGENTE'
          }
        },
        {
          id: '2',
          type: 'overdue',
          title: 'OS Atrasadas',
          description: 'Ordens que passaram do prazo estimado de conclusão',
          count: 1,
          priority: 'high',
          action: {
            label: 'Verificar Atrasos',
            href: '/dashboard/service-orders?status=overdue'
          }
        },
        {
          id: '3',
          type: 'approval',
          title: 'Orçamentos para Aprovação',
          description: 'OS com orçamentos recebidos esperando aprovação da gestão',
          count: 1,
          priority: 'medium',
          action: {
            label: 'Revisar Orçamentos',
            href: '/dashboard/service-orders?status=ORCAMENTOS_RECEBIDOS'
          }
        },
        {
          id: '4',
          type: 'assignment',
          title: 'OS sem Técnico',
          description: 'OS abertas que ainda não foram atribuídas a um técnico',
          count: 4,
          priority: 'medium',
          action: {
            label: 'Atribuir Técnicos',
            href: '/dashboard/service-orders?status=ABERTA'
          }
        }
      ]
      
      setActions(mockActions)
    } finally {
      setIsLoading(false)
    }
  }

  const getIcon = (type: ActionItem['type']) => {
    switch (type) {
      case 'urgent':
        return <AlertTriangle className="h-4 w-4" />
      case 'overdue':
        return <Clock className="h-4 w-4" />
      case 'approval':
        return <CheckCircle2 className="h-4 w-4" />
      case 'assignment':
        return <User className="h-4 w-4" />
      case 'follow_up':
        return <Calendar className="h-4 w-4" />
      default:
        return <Wrench className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default:
        return 'bg-muted text-muted-foreground'
    }
  }

  const getPriorityLabel = (priority: ActionItem['priority']) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return 'Normal'
    }
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Próximas Ações</CardTitle>
          <CardDescription>
            Tarefas que requerem sua atenção
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Próximas Ações</CardTitle>
        <CardDescription>
          {actions.length > 0 
            ? `${actions.length} itens requerem sua atenção` 
            : 'Nenhuma ação pendente'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {actions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
            <p>Todas as tarefas estão em dia!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {actions.map((action) => (
              <div key={action.id} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-accent transition-colors">
                <div className={`p-2 rounded-md ${getPriorityColor(action.priority)}`}>
                  {getIcon(action.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-medium">{action.title}</h4>
                    <div className="flex items-center space-x-2">
                      {action.count && (
                        <Badge variant="secondary" className="text-xs">
                          {action.count}
                        </Badge>
                      )}
                      <Badge variant="outline" className={getPriorityColor(action.priority)}>
                        {getPriorityLabel(action.priority)}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-xs text-muted-foreground mb-2">
                    {action.description}
                  </p>
                  
                  <Button 
                    asChild 
                    variant="ghost" 
                    size="sm"
                    className="p-0 h-auto text-primary hover:text-primary/80"
                  >
                    <Link href={action.action.href} className="flex items-center">
                      {action.action.label}
                      <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
