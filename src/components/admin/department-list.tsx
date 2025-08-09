"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Building, MapPin, Phone, Mail, Users, Plus } from 'lucide-react'

interface Department {
  id: string
  name: string
  description?: string
  location: string
  building?: string
  floor?: string
  responsible?: string
  phone?: string
  email?: string
  active: boolean
  _count: {
    users: number
  }
}

interface DepartmentListProps {
  departments: Department[]
  onEdit?: (department: Department) => void
  onToggleStatus?: (id: string, active: boolean) => void
}

export function DepartmentList({ departments, onEdit, onToggleStatus }: DepartmentListProps) {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Departamentos</h2>
          <p className="text-muted-foreground">
            Gerencie os departamentos e setores da prefeitura
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Novo Departamento
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {departments.map((department) => (
          <Card key={department.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{department.name}</CardTitle>
                  {department.description && (
                    <CardDescription className="text-sm">
                      {department.description}
                    </CardDescription>
                  )}
                </div>
                <Badge variant={department.active ? "default" : "secondary"}>
                  {department.active ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Localização */}
              <div className="space-y-2">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Building className="mr-2 h-4 w-4" />
                  <span>
                    {department.location}
                    {department.building && ` - ${department.building}`}
                    {department.floor && `, ${department.floor}`}
                  </span>
                </div>
                
                {/* Responsável */}
                {department.responsible && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="mr-2 h-4 w-4" />
                    <span>{department.responsible}</span>
                  </div>
                )}
                
                {/* Contato */}
                <div className="space-y-1">
                  {department.phone && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Phone className="mr-2 h-4 w-4" />
                      <span>{department.phone}</span>
                    </div>
                  )}
                  
                  {department.email && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Mail className="mr-2 h-4 w-4" />
                      <span>{department.email}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Estatísticas */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Funcionários:</span>
                  <Badge variant="outline">{department._count.users}</Badge>
                </div>
              </div>

              {/* Ações */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => onEdit?.(department)}
                >
                  Editar
                </Button>
                <Button
                  variant={department.active ? "destructive" : "default"}
                  size="sm"
                  className="flex-1"
                  onClick={() => onToggleStatus?.(department.id, !department.active)}
                >
                  {department.active ? "Desativar" : "Ativar"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {departments.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Building className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum departamento encontrado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Comece criando o primeiro departamento da prefeitura
            </p>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Departamento
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
