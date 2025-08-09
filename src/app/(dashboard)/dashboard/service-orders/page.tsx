"use client"

import { useState, useEffect, useCallback, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge"
import { ServiceOrderFilters } from "@/components/forms/service-order-filters"
import { Pagination } from "@/components/ui/pagination"
import { Plus, Loader2, AlertCircle, RefreshCw, User } from "lucide-react"
import { categoryLabels } from "@/types"
import { UserRole } from "@prisma/client"
import Link from "next/link"

interface UserData {
  id: string
  name: string
  role: UserRole
  department?: {
    name: string
  }
}

interface UserPermissions {
  canViewAllOrders: boolean
  canCreateOrders: boolean
  canEditOrders: boolean
}

interface ServiceOrder {
  id: string
  number: string
  title: string
  description: string
  status: string
  priority: string
  category: string
  location: string
  building?: string
  room?: string
  createdAt: string
  updatedAt: string
  createdBy: {
    id: string
    name: string
    email: string
    department?: {
      name: string
      location: string
      building: string
    }
  }
  assignedTo?: {
    id: string
    name: string
    email: string
    department?: string
  }
}

interface FilterOptions {
  search: string
  status: string
  priority: string
  category: string
  assignedTo: string
  createdBy: string
  dateFrom: string
  dateTo: string
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  pages: number
}

function ServiceOrdersPage() {
  const searchParams = useSearchParams()
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<UserData | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [currentTestUser, setCurrentTestUser] = useState<string>('funcionario')
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })
  
  // Inicializar filtros com parâmetros da URL
  const [filters, setFilters] = useState<FilterOptions>({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || '',
    priority: searchParams.get('priority') || '',
    category: searchParams.get('category') || '',
    assignedTo: searchParams.get('assignedTo') || '',
    createdBy: searchParams.get('createdBy') || '',
    dateFrom: searchParams.get('dateFrom') || '',
    dateTo: searchParams.get('dateTo') || '',
  })

  // Função para buscar dados do usuário
  const fetchUserData = async (testUserType?: string) => {
    try {
      const url = testUserType 
        ? `/api/auth/me?testUser=${testUserType}`
        : '/api/auth/me'
      
      const response = await fetch(url)
      const data = await response.json()
      
      if (response.ok) {
        setUser(data.user)
        setPermissions(data.permissions)
        setCurrentTestUser(testUserType || 'funcionario')
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error)
    }
  }

  const fetchServiceOrders = useCallback(async () => {
    if (!user || !permissions) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      // Construir query string
      const params = new URLSearchParams()
      params.append('page', pagination.page.toString())
      params.append('limit', pagination.limit.toString())
      
      // Adicionar testUser para manter contexto
      params.append('testUser', currentTestUser)
      
      // Adicionar filtros não vazios
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value.trim() !== '') {
          params.append(key, value.trim())
        }
      })
      
      const response = await fetch(`/api/service-orders?${params.toString()}`)
      if (!response.ok) {
        throw new Error('Erro ao carregar as ordens de serviço')
      }
      
      const result = await response.json()
      setServiceOrders(result.data || [])
      setPagination(result.pagination || { page: 1, limit: 10, total: 0, pages: 0 })
    } catch (error) {
      console.error('Erro ao buscar OS:', error)
      setError('Não foi possível carregar as ordens de serviço')
      setServiceOrders([])
    } finally {
      setIsLoading(false)
    }
  }, [pagination.page, pagination.limit, filters, user, permissions, currentTestUser])

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 })) // Reset para primeira página
  }

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }))
  }

  const handleItemsPerPageChange = (limit: number) => {
    setPagination(prev => ({ ...prev, limit, page: 1 }))
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit", 
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  useEffect(() => {
    fetchServiceOrders()
  }, [fetchServiceOrders])

  // Atualizar filtros quando os parâmetros da URL mudarem
  useEffect(() => {
    setFilters({
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      priority: searchParams.get('priority') || '',
      category: searchParams.get('category') || '',
      assignedTo: searchParams.get('assignedTo') || '',
      createdBy: searchParams.get('createdBy') || '',
      dateFrom: searchParams.get('dateFrom') || '',
      dateTo: searchParams.get('dateTo') || '',
    })
  }, [searchParams])

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
              disabled={isLoading}
            >
              {isLoading && currentTestUser === key && (
                <RefreshCw className="mr-2 h-3 w-3 animate-spin" />
              )}
              {label}
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (!user || !permissions) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
          <div>
            <h3 className="text-lg font-semibold">Erro ao carregar</h3>
            <p className="text-muted-foreground">{error}</p>
          </div>
          <Button onClick={fetchServiceOrders} variant="outline">
            Tentar novamente
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Switcher de usuário para teste */}
      <TestUserSwitcher />

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold">
              {permissions.canViewAllOrders ? 'Ordens de Serviço' : 'Minhas Ordens de Serviço'}
            </h1>
            <Badge variant="secondary">
              {getRoleLabel(user.role)}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            {permissions.canViewAllOrders 
              ? 'Gerencie e acompanhe todas as solicitações de serviço'
              : 'Acompanhe suas solicitações de serviço'
            }
          </p>
          {user.department && (
            <p className="text-sm text-muted-foreground mt-1">
              {user.department.name}
            </p>
          )}
        </div>
        {permissions.canCreateOrders && (
          <Button asChild>
            <Link href="/dashboard/service-orders/create">
              <Plus className="mr-2 h-4 w-4" />
              Nova OS
            </Link>
          </Button>
        )}
      </div>

      {/* Sistema de Filtros */}
      <ServiceOrderFilters onFilterChange={handleFilterChange} isLoading={isLoading} />

      {/* Conteúdo Principal */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span>Carregando ordens de serviço...</span>
            </div>
          </div>
        ) : serviceOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma ordem de serviço encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                {pagination.total === 0 
                  ? "Não há ordens de serviço cadastradas ainda."
                  : "Nenhuma ordem de serviço corresponde aos filtros aplicados."
                }
              </p>
              {pagination.total === 0 ? (
                <Button asChild>
                  <Link href="/dashboard/service-orders/create">
                    <Plus className="mr-2 h-4 w-4" />
                    Criar primeira OS
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" onClick={() => handleFilterChange({
                  search: '',
                  status: '',
                  priority: '',
                  category: '',
                  assignedTo: '',
                  createdBy: '',
                  dateFrom: '',
                  dateTo: '',
                })}>
                  Limpar filtros
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Lista de Ordens de Serviço */}
            <div className="space-y-4">
              {serviceOrders.map((os) => (
                <Card key={os.id} className="hover:shadow-md transition-shadow cursor-pointer" asChild>
                  <Link href={`/dashboard/service-orders/${os.id}`}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg">{os.title}</CardTitle>
                          <CardDescription>
                            {os.number} • {os.location}
                            {os.building && ` - ${os.building}`}
                            {os.room && ` - ${os.room}`}
                            • {formatDate(os.createdAt)}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <PriorityBadge priority={os.priority as any} />
                          <StatusBadge status={os.status as any} />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {os.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Solicitado por: <strong>{os.createdBy.name}</strong>
                            {os.createdBy.department && ` (${os.createdBy.department.name})`}
                          </span>
                          <div className="flex items-center gap-2">
                            {os.assignedTo && (
                              <span className="text-muted-foreground">
                                Atribuído para: <strong>{os.assignedTo.name}</strong>
                              </span>
                            )}
                            <Badge variant="outline">
                              {categoryLabels[os.category as keyof typeof categoryLabels]}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Link>
                </Card>
              ))}
            </div>

            {/* Paginação */}
            <Pagination
              currentPage={pagination.page}
              totalPages={pagination.pages}
              totalItems={pagination.total}
              itemsPerPage={pagination.limit}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
    </div>
  )
}

function ServiceOrdersPageWithSuspense() {
  return (
    <Suspense fallback={<div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <ServiceOrdersPage />
    </Suspense>
  )
}

export default ServiceOrdersPageWithSuspense
