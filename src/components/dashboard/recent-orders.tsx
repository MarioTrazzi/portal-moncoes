"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarInitials } from '@/components/ui/avatar'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, User, MapPin } from 'lucide-react'
import Link from 'next/link'

interface ServiceOrder {
  id: string
  number: string
  title: string
  status: string
  priority: string
  createdAt: string
  createdBy: {
    name: string
    department?: {
      name: string
      location: string
      building: string
    }
  }
}

interface RecentOrdersProps {
  className?: string
  limit?: number
  showAllOrders?: boolean
  userId?: string
}

export function RecentOrders({ 
  className, 
  limit = 5, 
  showAllOrders = true,
  userId 
}: RecentOrdersProps) {
  const [orders, setOrders] = useState<ServiceOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchRecentOrders()
  }, [showAllOrders, userId, limit])

  const fetchRecentOrders = async () => {
    try {
      setIsLoading(true)
      
      // Construir URL baseada nas permissões
      let url = `/api/service-orders?limit=${limit}&sort=createdAt&order=desc`
      
      // Se não pode ver todas as OS ou tem userId específico, adicionar parâmetro
      if (!showAllOrders && userId) {
        url += `&userId=${userId}`
      }
      
      const response = await fetch(url)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.data || [])
      }
    } catch (error) {
      console.error('Erro ao buscar ordens recentes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDENTE: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
      EM_ANALISE: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      AGUARDANDO_DESLOCAMENTO: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
      EM_EXECUCAO: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
      AGUARDANDO_MATERIAL: 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300',
      AGUARDANDO_ORCAMENTO: 'bg-pink-500/20 text-pink-700 dark:text-pink-300',
      AGUARDANDO_APROVACAO: 'bg-indigo-500/20 text-indigo-700 dark:text-indigo-300',
      MATERIAL_APROVADO: 'bg-teal-500/20 text-teal-700 dark:text-teal-300',
      FINALIZADA: 'bg-green-500/20 text-green-700 dark:text-green-300',
      CANCELADA: 'bg-red-500/20 text-red-700 dark:text-red-300',
    }
    return colors[status] || 'bg-muted text-muted-foreground'
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      BAIXA: 'bg-green-500/20 text-green-700 dark:text-green-300',
      NORMAL: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
      ALTA: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
      URGENTE: 'bg-red-500/20 text-red-700 dark:text-red-300',
    }
    return colors[priority] || 'bg-muted text-muted-foreground'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      ABERTA: 'Aberta',
      EM_ANALISE: 'Em Análise',
      AGUARDANDO_DESLOCAMENTO: 'Aguard. Deslocamento',
      EM_EXECUCAO: 'Em Execução',
      AGUARDANDO_MATERIAL: 'Aguard. Material',
      AGUARDANDO_ORCAMENTO: 'Aguard. Orçamento',
      AGUARDANDO_APROVACAO: 'Aguard. Aprovação',
      MATERIAL_APROVADO: 'Material Aprovado',
      FINALIZADA: 'Finalizada',
      CANCELADA: 'Cancelada',
    }
    return labels[status] || status
  }

  const getPriorityLabel = (priority: string) => {
    const labels: Record<string, string> = {
      BAIXA: 'Baixa',
      NORMAL: 'Normal',
      ALTA: 'Alta',
      URGENTE: 'Urgente',
    }
    return labels[priority] || priority
  }

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Ordens Recentes</CardTitle>
          <CardDescription>Últimas ordens de serviço criadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4 animate-pulse">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
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
        <CardTitle>Ordens Recentes</CardTitle>
        <CardDescription>Últimas {limit} ordens de serviço criadas</CardDescription>
      </CardHeader>
      <CardContent>
        {orders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhuma ordem de serviço encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Link
                key={order.id}
                href={`/dashboard/service-orders/${order.id}`}
                className="block hover:bg-accent rounded-lg p-3 -mx-3 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      <AvatarInitials name={order.createdBy.name} />
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium truncate">
                        {order.number} - {order.title}
                      </p>
                      <div className="flex items-center space-x-1">
                        <Badge variant="secondary" className={getPriorityColor(order.priority)}>
                          {getPriorityLabel(order.priority)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-1">
                          <User className="h-3 w-3" />
                          <span>{order.createdBy.name}</span>
                          {order.createdBy.department && (
                            <span>• {order.createdBy.department.name}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getStatusColor(order.status)}>
                          {getStatusLabel(order.status)}
                        </Badge>
                        <span>
                          {formatDistanceToNow(new Date(order.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
        
        {orders.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <Link
              href="/dashboard/service-orders"
              className="text-sm text-primary hover:underline font-medium"
            >
              Ver todas as ordens →
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
