"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2, RefreshCw, TrendingUp, AlertTriangle, CheckCircle, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface DashboardStats {
  total: number
  byStatus: {
    ABERTA: number
    EM_ANALISE: number
    AGUARDANDO_DESLOCAMENTO: number
    EM_EXECUCAO: number
    AGUARDANDO_MATERIAL: number
    AGUARDANDO_ORCAMENTO: number
    AGUARDANDO_APROVACAO: number
    MATERIAL_APROVADO: number
    FINALIZADA: number
    CANCELADA: number
  }
  byPriority: {
    BAIXA: number
    NORMAL: number
    ALTA: number
    URGENTE: number
  }
  byCategory: {
    [key: string]: number
  }
  recentActivity: {
    createdToday: number
    updatedToday: number
    completedThisWeek: number
    averageResolutionTime: number
  }
}

interface RealtimeStatsProps {
  refreshInterval?: number // em segundos, padrão 30s
  className?: string
}

export function RealtimeStats({ refreshInterval = 30, className }: RealtimeStatsProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/dashboard/stats')
      if (!response.ok) {
        throw new Error('Erro ao carregar estatísticas')
      }
      
      const data = await response.json()
      setStats(data)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error)
      setError('Não foi possível carregar as estatísticas')
    } finally {
      setIsLoading(false)
    }
  }

  const refreshStats = () => {
    fetchStats()
  }

  useEffect(() => {
    fetchStats()
  }, [])

  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(fetchStats, refreshInterval * 1000)
    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    const colors = {
      PENDENTE: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
      EM_ANDAMENTO: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      AGUARDANDO_APROVACAO: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
      AGUARDANDO_ORCAMENTO: 'bg-purple-500/20 text-purple-700 dark:text-purple-300',
      APROVADO: 'bg-green-500/20 text-green-700 dark:text-green-300',
      EM_EXECUCAO: 'bg-blue-500/20 text-blue-700 dark:text-blue-300',
      CONCLUIDO: 'bg-green-500/20 text-green-700 dark:text-green-300',
      CANCELADO: 'bg-red-500/20 text-red-700 dark:text-red-300',
    }
    return colors[status as keyof typeof colors] || 'bg-muted text-muted-foreground'
  }

  const getPriorityColor = (priority: string) => {
    const priorityColors: Record<string, string> = {
      BAIXA: 'bg-green-500/20 text-green-700 dark:text-green-300',
      NORMAL: 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-300',
      ALTA: 'bg-orange-500/20 text-orange-700 dark:text-orange-300',
      URGENTE: 'bg-red-500/20 text-red-700 dark:text-red-300',
    }
    return priorityColors[priority as keyof typeof priorityColors] || 'bg-muted text-muted-foreground'
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-8 w-8 text-destructive mb-2" />
          <p className="text-sm text-red-600 dark:text-red-400 mb-4">{error}</p>
          <Button variant="outline" size="sm" onClick={refreshStats}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {/* Cards de Resumo */}
      <Card className="hover:shadow-md transition-shadow" asChild>
        <Link href="/dashboard/service-orders">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de OS</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.total || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.recentActivity?.createdToday || 0} criadas hoje
            </p>
          </CardContent>
        </Link>
      </Card>

      <Card className="hover:shadow-md transition-shadow" asChild>
        <Link href="/dashboard/service-orders?status=EM_ANALISE,AGUARDANDO_DESLOCAMENTO,EM_EXECUCAO,AGUARDANDO_MATERIAL,AGUARDANDO_ORCAMENTO,AGUARDANDO_APROVACAO,MATERIAL_APROVADO">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Andamento</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                (stats?.byStatus?.EM_ANALISE || 0) + 
                (stats?.byStatus?.AGUARDANDO_DESLOCAMENTO || 0) + 
                (stats?.byStatus?.EM_EXECUCAO || 0) + 
                (stats?.byStatus?.AGUARDANDO_MATERIAL || 0) + 
                (stats?.byStatus?.AGUARDANDO_ORCAMENTO || 0) + 
                (stats?.byStatus?.AGUARDANDO_APROVACAO || 0) + 
                (stats?.byStatus?.MATERIAL_APROVADO || 0)
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.recentActivity?.updatedToday || 0} atualizadas hoje
            </p>
          </CardContent>
        </Link>
      </Card>

      <Card className="hover:shadow-md transition-shadow" asChild>
        <Link href="/dashboard/service-orders?status=FINALIZADA">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Concluídas</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.byStatus?.FINALIZADA || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.recentActivity?.completedThisWeek || 0} esta semana
            </p>
          </CardContent>
        </Link>
      </Card>

      <Card className="hover:shadow-md transition-shadow" asChild>
        <Link href="/dashboard/service-orders?priority=URGENTE">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Urgentes</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.byPriority?.URGENTE || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Requer atenção imediata
            </p>
          </CardContent>
        </Link>
      </Card>

      {/* Card de Status Detalhado */}
      <Card className="md:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Status das OS</CardTitle>
            <CardDescription>Distribuição por status atual</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? 'text-green-600' : 'text-muted-foreground'}
            >
              <RefreshCw className={`h-4 w-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="ghost" size="sm" onClick={refreshStats} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats?.byStatus || {}).map(([status, count]) => (
                <Link 
                  key={status} 
                  href={`/dashboard/service-orders?status=${status}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium">
                    {status.replace(/_/g, ' ')}
                  </span>
                  <Badge className={getStatusColor(status)}>
                    {count}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Card de Prioridades */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-sm font-medium">Prioridades</CardTitle>
          <CardDescription>Distribuição por nível de prioridade</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(stats?.byPriority || {}).map(([priority, count]) => (
                <Link 
                  key={priority} 
                  href={`/dashboard/service-orders?priority=${priority}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                >
                  <span className="text-sm font-medium">
                    {priority}
                  </span>
                  <Badge className={getPriorityColor(priority)}>
                    {count}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Informações de Atualização */}
      {lastUpdated && (
        <Card className="md:col-span-full">
          <CardContent className="py-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Última atualização: {formatTime(lastUpdated)}
              </span>
              <div className="flex items-center gap-2">
                <span>
                  Atualização automática: {autoRefresh ? 'Ativada' : 'Desativada'}
                </span>
                {autoRefresh && (
                  <span>
                    (a cada {refreshInterval}s)
                  </span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
