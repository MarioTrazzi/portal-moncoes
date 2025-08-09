"use client"

import { useState, useEffect } from 'react'
import { RealtimeStats } from '@/components/dashboard/realtime-stats'
import { RecentOrders } from '@/components/dashboard/recent-orders'
import { PerformanceCharts } from '@/components/dashboard/performance-charts'
import { NextActions } from '@/components/dashboard/next-actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, ArrowRight, Users, Wrench, FileText, BarChart3, User, RefreshCw } from 'lucide-react'
import { UserRole } from '@prisma/client'
import { usePermissions } from '@/hooks/use-permissions'
import { useTestUser } from '@/contexts/test-user-context'
import Link from 'next/link'

interface UserData {
  id: string
  name: string
  email: string
  role: UserRole
  department?: {
    name: string
    location: string
  }
}

interface UserPermissions {
  canViewAllOrders: boolean
  canCreateOrders: boolean
  canEditOrders: boolean
  canDeleteOrders: boolean
  canManageUsers: boolean
  canManageDepartments: boolean
  canApproveQuotes: boolean
  canViewReports: boolean
  canManageSuppliers: boolean
}

export default function DashboardPage() {
  const [user, setUser] = useState<UserData | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)
  const { currentTestUser, setCurrentTestUser } = useTestUser()

  // Função para buscar dados do usuário
  const fetchUserData = async (testUserType?: string) => {
    try {
      setLoading(true)
      const userType = testUserType || currentTestUser
      const url = `/api/auth/me?testUser=${userType}`
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
        setPermissions(data.permissions)
        if (testUserType) {
          setCurrentTestUser(testUserType)
        }
      } else {
        console.error('Erro ao buscar dados do usuário:', data.error)
      }
    } catch (error) {
      console.error('Erro na requisição:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserData()
  }, [])

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

  // Componente para trocar usuário de teste
  const TestUserSwitcher = () => (
    <Card className="mb-6 border-dashed border-yellow-300 bg-yellow-50">
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <User className="h-4 w-4" />
          Modo de Teste - Trocar Usuário
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'funcionario', label: 'Funcionário' },
            { key: 'tecnico', label: 'Técnico' },
            { key: 'gestor', label: 'Gestor' },
            { key: 'aprovador', label: 'Aprovador' },
            { key: 'admin', label: 'Admin' }
          ].map(({ key, label }) => (
            <Button
              key={key}
              variant={currentTestUser === key ? "default" : "outline"}
              size="sm"
              onClick={() => fetchUserData(key)}
              disabled={loading}
            >
              {loading && currentTestUser === key && (
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
              )}
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )

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
      {/* Switcher de usuário para teste */}
      <TestUserSwitcher />

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
