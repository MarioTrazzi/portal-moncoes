"use client"

import { RealtimeStats } from '@/components/dashboard/realtime-stats'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { PerformanceCharts } from '@/components/dashboard/performance-charts'
import { NextActions } from '@/components/dashboard/next-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowRight, Users, Wrench, FileText, BarChart3, RefreshCw } from 'lucide-react'
import { UserRole } from '@prisma/client'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'

export default function DashboardPage() {
  const { user, permissions, loading } = useAuth()

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      FUNCIONARIO: 'Funcionário',
      TECNICO: 'Técnico',
      APROVADOR: 'Aprovador',
      GESTOR: 'Gestor',
      ADMIN: 'Administrador'
    }
    return labels[role] || role
  }

  const getRoleColor = (role: UserRole) => {
    const colors = {
      FUNCIONARIO: 'bg-blue-100 text-blue-800',
      TECNICO: 'bg-green-100 text-green-800',
      APROVADOR: 'bg-yellow-100 text-yellow-800',
      GESTOR: 'bg-purple-100 text-purple-800',
      ADMIN: 'bg-red-100 text-red-800'
    }
    return colors[role] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!user || !permissions) {
    return (
      <div className="text-center py-8">
        <p>Erro ao carregar dados do usuário</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header com informações do usuário */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <Badge className={getRoleColor(user.role)}>
              {getRoleLabel(user.role)}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-gray-600 dark:text-gray-400">
              Bem-vindo, <strong>{user.name}</strong>
            </p>
            {user.department && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {user.department.name} • {user.department.location}
              </p>
            )}
          </div>
        </div>
        {permissions.canCreateOrders && (
          <Button asChild size="lg">
            <Link href="/dashboard/service-orders/create">
              <Plus className="mr-2 h-5 w-5" />
              Nova OS
            </Link>
          </Button>
        )}
      </div>

      {/* Estatísticas - Apenas para técnicos, gestores e admins */}
      {(permissions.canViewAllOrders || permissions.canViewReports) && (
        <RealtimeStats refreshInterval={30} />
      )}

      {/* Ações Rápidas baseadas em permissões */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Gerenciar OS - sempre visível, mas com dados filtrados */}
        <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
          <Link href="/dashboard/service-orders">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {permissions.canViewAllOrders ? 'Gerenciar OS' : 'Minhas OS'}
              </CardTitle>
              <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {permissions.canViewAllOrders 
                  ? 'Ver todas as ordens de serviço' 
                  : 'Ver suas ordens de serviço'
                }
              </div>
              <div className="flex items-center pt-2 text-sm font-medium text-primary">
                Acessar <ArrowRight className="ml-1 h-4 w-4" />
              </div>
            </CardContent>
          </Link>
        </Card>

        {/* Departamentos - apenas para admins e gestores */}
        {permissions.canManageDepartments && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
            <Link href="/dashboard/admin/departments">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Departamentos</CardTitle>
                <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Gerenciar departamentos e setores
                </div>
                <div className="flex items-center pt-2 text-sm font-medium text-primary">
                  Acessar <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Link>
          </Card>
        )}

        {/* Manutenção - para técnicos, gestores e admins */}
        {(permissions.canEditOrders || permissions.canViewReports) && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
            <Link href="/dashboard/maintenance">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Manutenção</CardTitle>
                <Wrench className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Histórico e planejamento
                </div>
                <div className="flex items-center pt-2 text-sm font-medium text-primary">
                  Acessar <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Link>
          </Card>
        )}

        {/* Relatórios - para gestores e admins */}
        {permissions.canViewReports && (
          <Card className="hover:shadow-md transition-shadow cursor-pointer" asChild>
            <Link href="/dashboard/reports">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Relatórios</CardTitle>
                <BarChart3 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Relatórios e análises
                </div>
                <div className="flex items-center pt-2 text-sm font-medium text-primary">
                  Acessar <ArrowRight className="ml-1 h-4 w-4" />
                </div>
              </CardContent>
            </Link>
          </Card>
        )}
      </div>

      {/* Gráficos de Performance - apenas para gestores e admins */}
      {permissions.canViewReports && <PerformanceCharts />}

      {/* Resumo de Atividades Recentes */}
      <div className="grid gap-6 md:grid-cols-2">
        <RecentOrders 
          limit={5} 
          showAllOrders={permissions.canViewAllOrders}
          userId={permissions.canViewAllOrders ? undefined : user.id}
        />
        {(permissions.canEditOrders || permissions.canViewReports) && <NextActions />}
      </div>
    </div>
  )
}
