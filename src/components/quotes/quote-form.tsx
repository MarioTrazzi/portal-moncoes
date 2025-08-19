"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Save, ArrowLeft } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface QuoteItem {
  description: string
  quantity: number
  unitPrice: number
  totalPrice: number
}

interface Supplier {
  id: string
  name: string
  cnpj: string
  contact: string
}

interface QuoteFormProps {
  serviceOrderId: string
  serviceOrderNumber: string
  serviceOrderTitle: string
}

export function QuoteForm({ serviceOrderId, serviceOrderNumber, serviceOrderTitle }: QuoteFormProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [selectedSupplierId, setSelectedSupplierId] = useState("")
  const [items, setItems] = useState<QuoteItem[]>([
    { description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }
  ])
  const [deliveryTime, setDeliveryTime] = useState("")
  const [validity, setValidity] = useState("")
  const [observations, setObservations] = useState("")
  const [loading, setLoading] = useState(false)
  const [loadingSuppliers, setLoadingSuppliers] = useState(true)

  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    fetchSuppliers()
  }, [])

  const fetchSuppliers = async () => {
    try {
      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return undefined
      }
      
      const token = getCookie('auth-token')
      if (!token) {
        throw new Error("Token de autenticação não encontrado")
      }

      const response = await fetch('/api/suppliers', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Erro ao carregar fornecedores')
      }

      const data = await response.json()
      if (data.success) {
        setSuppliers(data.data)
      }
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error)
      toast({
        title: "Erro",
        description: "Erro ao carregar fornecedores",
        variant: "destructive"
      })
    } finally {
      setLoadingSuppliers(false)
    }
  }

  const addItem = () => {
    setItems([...items, { description: "", quantity: 1, unitPrice: 0, totalPrice: 0 }])
  }

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index))
    }
  }

  const updateItem = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // Recalcular total do item
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalPrice = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setItems(newItems)
  }

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.totalPrice, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedSupplierId) {
      toast({
        title: "Erro",
        description: "Selecione um fornecedor",
        variant: "destructive"
      })
      return
    }

    if (items.some(item => !item.description || item.quantity <= 0 || item.unitPrice <= 0)) {
      toast({
        title: "Erro",
        description: "Preencha todos os itens corretamente",
        variant: "destructive"
      })
      return
    }

    try {
      setLoading(true)

      const getCookie = (name: string) => {
        const value = `; ${document.cookie}`
        const parts = value.split(`; ${name}=`)
        if (parts.length === 2) return parts.pop()?.split(';').shift()
        return undefined
      }
      
      const token = getCookie('auth-token')
      if (!token) {
        throw new Error("Token de autenticação não encontrado")
      }

      const quoteData = {
        serviceOrderId,
        supplierId: selectedSupplierId,
        items,
        totalValue: calculateTotal(),
        deliveryTime: deliveryTime ? parseInt(deliveryTime) : null,
        validity: validity ? new Date(validity).toISOString() : null,
        observations
      }

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(quoteData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao salvar orçamento')
      }

      toast({
        title: "Sucesso",
        description: "Orçamento cadastrado com sucesso"
      })

      // Voltar para a OS
      router.push(`/dashboard/service-orders/${serviceOrderId}`)

    } catch (error) {
      console.error('Erro ao salvar orçamento:', error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao salvar orçamento",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingSuppliers) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-muted-foreground">Carregando fornecedores...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/service-orders/${serviceOrderId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cadastrar Orçamento</h1>
          <p className="text-muted-foreground">OS #{serviceOrderNumber} - {serviceOrderTitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Fornecedor */}
        <Card>
          <CardHeader>
            <CardTitle>Fornecedor</CardTitle>
            <CardDescription>Selecione o fornecedor responsável por este orçamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="supplier">Fornecedor *</Label>
                <Select onValueChange={setSelectedSupplierId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um fornecedor" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.name} - {supplier.cnpj}
                        <div className="text-xs text-muted-foreground">
                          Contato: {supplier.contact}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Itens do Orçamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Itens do Orçamento
              <Button type="button" onClick={addItem} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </CardTitle>
            <CardDescription>Adicione os itens e valores do orçamento</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-4 items-end">
                  <div className="col-span-5">
                    <Label htmlFor={`description-${index}`}>Descrição</Label>
                    <Input
                      id={`description-${index}`}
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Descrição do item"
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor={`quantity-${index}`}>Quantidade</Label>
                    <Input
                      id={`quantity-${index}`}
                      type="number"
                      min="1"
                      step="1"
                      value={item.quantity}
                      onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label htmlFor={`unitPrice-${index}`}>Valor Unit.</Label>
                    <Input
                      id={`unitPrice-${index}`}
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                      required
                    />
                  </div>
                  
                  <div className="col-span-2">
                    <Label>Total</Label>
                    <div className="p-2 bg-muted rounded text-sm font-medium">
                      R$ {item.totalPrice.toFixed(2)}
                    </div>
                  </div>
                  
                  <div className="col-span-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => removeItem(index)}
                      disabled={items.length === 1}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              
              <div className="border-t pt-4">
                <div className="flex justify-end">
                  <div className="text-lg font-bold">
                    Valor Total: R$ {calculateTotal().toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Informações Adicionais */}
        <Card>
          <CardHeader>
            <CardTitle>Informações Adicionais</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="deliveryTime">Prazo de Entrega (dias)</Label>
                <Input
                  id="deliveryTime"
                  type="number"
                  min="1"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  placeholder="Ex: 30"
                />
              </div>
              
              <div>
                <Label htmlFor="validity">Validade do Orçamento</Label>
                <Input
                  id="validity"
                  type="date"
                  value={validity}
                  onChange={(e) => setValidity(e.target.value)}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <Label htmlFor="observations">Observações</Label>
              <Textarea
                id="observations"
                value={observations}
                onChange={(e) => setObservations(e.target.value)}
                placeholder="Informações adicionais sobre o orçamento..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botões */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? (
              <>Salvando...</>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Salvar Orçamento
              </>
            )}
          </Button>
          
          <Button type="button" variant="outline" asChild>
            <Link href={`/dashboard/service-orders/${serviceOrderId}`}>
              Cancelar
            </Link>
          </Button>
        </div>
      </form>
    </div>
  )
}
