"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Store, Search, Plus, Edit, Trash2, Phone, Mail, MapPin } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Supplier {
  id: string
  name: string
  cnpj: string
  email: string
  phone: string
  address?: string
  contact: string
  active: boolean
  categories: string[]
  createdAt: string
}

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const response = await fetch('/api/suppliers')
      if (response.ok) {
        const data = await response.json()
        setSuppliers(data)
      } else {
        console.error('Erro ao carregar fornecedores')
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const searchLower = searchTerm.toLowerCase()
    return supplier.name.toLowerCase().includes(searchLower) ||
           supplier.cnpj.includes(searchTerm) ||
           supplier.contact.toLowerCase().includes(searchLower) ||
           supplier.categories.some(cat => cat.toLowerCase().includes(searchLower))
  })

  const getCategoryColor = (category: string) => {
    const colors = {
      'Hardware': 'bg-blue-100 text-blue-800',
      'Software': 'bg-green-100 text-green-800',
      'Rede': 'bg-purple-100 text-purple-800',
      'Impressora': 'bg-orange-100 text-orange-800',
      'Móveis': 'bg-brown-100 text-brown-800',
      'default': 'bg-gray-100 text-gray-800'
    }
    return colors[category as keyof typeof colors] || colors.default
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando fornecedores...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Store className="h-8 w-8" />
            Gestão de Fornecedores
          </h1>
          <p className="text-muted-foreground">
            Gerencie fornecedores cadastrados no sistema
          </p>
        </div>
        <Button className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Fornecedor
        </Button>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Buscar Fornecedores</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Nome, CNPJ, contato ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Total de Fornecedores</span>
            </div>
            <div className="text-2xl font-bold mt-2">{suppliers.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium">Fornecedores Ativos</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {suppliers.filter(s => s.active).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Categorias</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {[...new Set(suppliers.flatMap(s => s.categories))].length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Store className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">Novos este Mês</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {suppliers.filter(s => {
                const created = new Date(s.createdAt)
                const now = new Date()
                return created.getMonth() === now.getMonth() && 
                       created.getFullYear() === now.getFullYear()
              }).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Fornecedores */}
      <Card>
        <CardHeader>
          <CardTitle>Fornecedores ({filteredSuppliers.length})</CardTitle>
          <CardDescription>
            Lista de todos os fornecedores cadastrados no sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredSuppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="flex items-start justify-between p-4 border rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg">{supplier.name}</h3>
                        {!supplier.active && (
                          <Badge variant="secondary">Inativo</Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">CNPJ:</span>
                            <span>{supplier.cnpj}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            <span>{supplier.email}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            <span>{supplier.phone}</span>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Contato:</span>
                            <span>{supplier.contact}</span>
                          </div>
                          {supplier.address && (
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              <span>{supplier.address}</span>
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Cadastrado:</span>
                            <span className="ml-2">{formatDate(supplier.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3">
                        <span className="text-sm font-medium">Categorias:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {supplier.categories.map((category, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className={getCategoryColor(category)}
                            >
                              {category}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            
            {filteredSuppliers.length === 0 && (
              <div className="text-center py-8">
                <Store className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold">Nenhum fornecedor encontrado</h3>
                <p className="text-muted-foreground">
                  Tente ajustar os filtros ou adicionar um novo fornecedor.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
