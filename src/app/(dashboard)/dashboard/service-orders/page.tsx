"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge"
import { ServiceOrderFilters } from "@/components/forms/service-order-filters"
import { Plus, Loader2, AlertCircle } from "lucide-react"
import { categoryLabels } from "@/types"
import { useHydration } from "@/hooks/use-hydration"
import Link from "next/link"

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
    department?: {
      name: string
      location: string
      building: string
    }
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

export default function ServiceOrdersPage() {
  const [serviceOrders, setServiceOrders] = useState<ServiceOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ServiceOrder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const hydrated = useHydration()
  const searchParams = useSearchParams()
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    status: '',
    priority: '',
    category: '',
    assignedTo: '',
    createdBy: '',
    dateFrom: '',
    dateTo: '',
  })

  // Aplicar filtros dos parâmetros da URL quando a página carregar
  useEffect(() => {
    if (hydrated && searchParams) {
      const urlFilters: FilterOptions = {
        search: searchParams.get('search') || '',
        status: searchParams.get('status') || '',
        priority: searchParams.get('priority') || '',
        category: searchParams.get('category') || '',
        assignedTo: searchParams.get('assignedTo') || '',
        createdBy: searchParams.get('createdBy') || '',
        dateFrom: searchParams.get('dateFrom') || '',
        dateTo: searchParams.get('dateTo') || '',
      }
      setFilters(urlFilters)
    }
  }, [hydrated, searchParams])

  const fetchServiceOrders = async () => {
    try {
      setIsLoading(true)
      setError(null)
      
      const response = await fetch('/api/service-orders')
      if (!response.ok) {
        throw new Error('Erro ao carregar as ordens de serviço')
      }
      
      const data = await response.json()
      setServiceOrders(data.serviceOrders || [])
    } catch (error) {
      console.error('Erro ao buscar OS:', error)
      setError('Não foi possível carregar as ordens de serviço')
      setServiceOrders([])
    } finally {
      setIsLoading(false)
    }
  }

  // Aplicar filtros aos dados
  const applyFilters = (orders: ServiceOrder[], filterOptions: FilterOptions) => {
    return orders.filter(order => {
      // Filtro de pesquisa
      if (filterOptions.search) {
        const searchTerm = filterOptions.search.toLowerCase()
        const matchesSearch = 
          order.number.toLowerCase().includes(searchTerm) ||
          order.title.toLowerCase().includes(searchTerm) ||
          order.description.toLowerCase().includes(searchTerm) ||
          order.location.toLowerCase().includes(searchTerm)
        if (!matchesSearch) return false
      }

      // Filtro de status - suporte para múltiplos status separados por vírgula
      if (filterOptions.status) {
        const statusList = filterOptions.status.split(',').map(s => s.trim())
        if (!statusList.includes(order.status)) {
          return false
        }
      }

      // Filtro de prioridade - suporte para múltiplas prioridades separadas por vírgula
      if (filterOptions.priority) {
        const priorityList = filterOptions.priority.split(',').map(p => p.trim())
        if (!priorityList.includes(order.priority)) {
          return false
        }
      }

      // Filtro de categoria
      if (filterOptions.category && order.category !== filterOptions.category) {
        return false
      }

      // Filtro de solicitante
      if (filterOptions.createdBy) {
        const createdByTerm = filterOptions.createdBy.toLowerCase()
        if (!order.createdBy.name.toLowerCase().includes(createdByTerm)) {
          return false
        }
      }

      // Filtro de responsável
      if (filterOptions.assignedTo && order.assignedTo) {
        const assignedToTerm = filterOptions.assignedTo.toLowerCase()
        if (!order.assignedTo.name.toLowerCase().includes(assignedToTerm)) {
          return false
        }
      }

      // Filtro de data inicial
      if (filterOptions.dateFrom) {
        const orderDate = new Date(order.createdAt)
        const fromDate = new Date(filterOptions.dateFrom)
        if (orderDate < fromDate) return false
      }

      // Filtro de data final
      if (filterOptions.dateTo) {
        const orderDate = new Date(order.createdAt)
        const toDate = new Date(filterOptions.dateTo)
        toDate.setHours(23, 59, 59, 999) // Incluir o dia todo
        if (orderDate > toDate) return false
      }

      return true
    })
  }

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters)
    const filtered = applyFilters(serviceOrders, newFilters)
    setFilteredOrders(filtered)
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
    if (hydrated) {
      fetchServiceOrders()
    }
  }, [hydrated])

  useEffect(() => {
    const filtered = applyFilters(serviceOrders, filters)
    setFilteredOrders(filtered)
  }, [serviceOrders, filters])

  // Renderização de loading durante hidratação
  if (!hydrated || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando ordens de serviço...</span>
        </div>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ordens de Serviço</h1>
          <p className="text-muted-foreground">
            Gerencie e acompanhe todas as solicitações de serviço
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/service-orders/create">
            <Plus className="mr-2 h-4 w-4" />
            Nova OS
          </Link>
        </Button>
      </div>

      {/* Sistema de Filtros */}
      <ServiceOrderFilters onFilterChange={handleFilterChange} isLoading={isLoading} />

      {/* Resultados */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {filteredOrders.length === serviceOrders.length ? (
              <span>Mostrando {filteredOrders.length} ordem{filteredOrders.length !== 1 ? 's' : ''} de serviço</span>
            ) : (
              <span>
                Mostrando {filteredOrders.length} de {serviceOrders.length} ordem{serviceOrders.length !== 1 ? 's' : ''} de serviço
              </span>
            )}
          </div>
        </div>

        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma ordem de serviço encontrada</h3>
              <p className="text-muted-foreground text-center mb-4">
                {serviceOrders.length === 0 
                  ? "Não há ordens de serviço cadastradas ainda."
                  : "Nenhuma ordem de serviço corresponde aos filtros aplicados."
                }
              </p>
              {serviceOrders.length === 0 ? (
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
          <div className="space-y-4">
            {filteredOrders.map((os) => (
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
        )}
      </div>
    </div>
  )
}