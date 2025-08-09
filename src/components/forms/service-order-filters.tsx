"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Search, Filter, X, Calendar } from 'lucide-react'
import { categoryLabels } from '@/types'

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

interface ServiceOrderFiltersProps {
  onFilterChange: (filters: FilterOptions) => void
  isLoading?: boolean
}

const statusOptions = [
  { value: 'PENDENTE', label: 'Pendente' },
  { value: 'EM_ANDAMENTO', label: 'Em Andamento' },
  { value: 'AGUARDANDO_APROVACAO', label: 'Aguardando Aprovação' },
  { value: 'AGUARDANDO_ORCAMENTO', label: 'Aguardando Orçamento' },
  { value: 'APROVADO', label: 'Aprovado' },
  { value: 'EM_EXECUCAO', label: 'Em Execução' },
  { value: 'CONCLUIDO', label: 'Concluído' },
  { value: 'CANCELADO', label: 'Cancelado' },
]

const priorityOptions = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'URGENTE', label: 'Urgente' },
]

export function ServiceOrderFilters({ onFilterChange, isLoading }: ServiceOrderFiltersProps) {
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

  const [isExpanded, setIsExpanded] = useState(false)

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    // Converter "all" para string vazia para manter compatibilidade
    const processedValue = value === 'all' ? '' : value
    const newFilters = { ...filters, [key]: processedValue }
    setFilters(newFilters)
    onFilterChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters: FilterOptions = {
      search: '',
      status: '',
      priority: '',
      category: '',
      assignedTo: '',
      createdBy: '',
      dateFrom: '',
      dateTo: '',
    }
    setFilters(emptyFilters)
    onFilterChange(emptyFilters)
  }

  const hasActiveFilters = Object.values(filters).some(value => value !== '')

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros de Busca
          </CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Limpar
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4 mr-1" />
              {isExpanded ? 'Menos filtros' : 'Mais filtros'}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtro de pesquisa principal */}
        <div className="space-y-2">
          <Label htmlFor="search">Buscar por número, título ou descrição</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="search"
              placeholder="Digite para buscar..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
        </div>

        {/* Filtros rápidos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange('status', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todos os status" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border shadow-lg">
                <SelectItem value="all" className="focus:bg-accent focus:text-accent-foreground hover:bg-accent/80">Todos os status</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="focus:bg-accent focus:text-accent-foreground hover:bg-accent/80">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority">Prioridade</Label>
            <Select
              value={filters.priority}
              onValueChange={(value) => handleFilterChange('priority', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as prioridades" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border shadow-lg">
                <SelectItem value="all" className="focus:bg-accent focus:text-accent-foreground hover:bg-accent/80">Todas as prioridades</SelectItem>
                {priorityOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="focus:bg-accent focus:text-accent-foreground hover:bg-accent/80">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => handleFilterChange('category', value)}
              disabled={isLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as categorias" />
              </SelectTrigger>
              <SelectContent className="bg-popover text-popover-foreground border shadow-lg">
                <SelectItem value="all" className="focus:bg-accent focus:text-accent-foreground hover:bg-accent/80">Todas as categorias</SelectItem>
                {Object.entries(categoryLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="focus:bg-accent focus:text-accent-foreground hover:bg-accent/80">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Filtros avançados (expandidos) */}
        {isExpanded && (
          <div className="border-t pt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dateFrom" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data inicial
                </Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateTo" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data final
                </Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="createdBy">Solicitado por</Label>
                <Input
                  id="createdBy"
                  placeholder="Nome do solicitante..."
                  value={filters.createdBy}
                  onChange={(e) => handleFilterChange('createdBy', e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Atribuído para</Label>
                <Input
                  id="assignedTo"
                  placeholder="Nome do responsável..."
                  value={filters.assignedTo}
                  onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>
        )}

        {/* Indicador de filtros ativos */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <span className="text-sm text-muted-foreground">Filtros ativos:</span>
            {filters.search && (
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                <span>Busca: &quot;{filters.search}&quot;</span>
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="hover:bg-primary/20 rounded-sm p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.status && (
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                <span>Status: {statusOptions.find(s => s.value === filters.status)?.label}</span>
                <button
                  onClick={() => handleFilterChange('status', 'all')}
                  className="hover:bg-primary/20 rounded-sm p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.priority && (
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                <span>Prioridade: {priorityOptions.find(p => p.value === filters.priority)?.label}</span>
                <button
                  onClick={() => handleFilterChange('priority', 'all')}
                  className="hover:bg-primary/20 rounded-sm p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
            {filters.category && (
              <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded-md text-xs">
                <span>Categoria: {categoryLabels[filters.category as keyof typeof categoryLabels]}</span>
                <button
                  onClick={() => handleFilterChange('category', 'all')}
                  className="hover:bg-primary/20 rounded-sm p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
