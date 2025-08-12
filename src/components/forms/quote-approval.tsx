"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  DollarSign, 
  Truck,
  Calendar,
  Building,
  User,
  Package
} from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

interface Quote {
  id: string
  supplier: {
    id: string
    name: string
    contact: string
    email: string
    phone: string
  }
  items: any[]
  totalValue: number
  deliveryTime: number
  validity: string
  observations: string
  status: string
  createdAt: string
}

interface QuoteApprovalProps {
  serviceOrder: any
  quotes: Quote[]
  onApprove: (quoteId: string, observations?: string) => Promise<void>
  onReject: (quoteId: string, reason: string) => Promise<void>
  isLoading?: boolean
}

export function QuoteApproval({ 
  serviceOrder, 
  quotes, 
  onApprove, 
  onReject, 
  isLoading = false 
}: QuoteApprovalProps) {
  const [selectedQuote, setSelectedQuote] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState("")
  const [approvalObservations, setApprovalObservations] = useState("")
  const [showRejectionForm, setShowRejectionForm] = useState<string | null>(null)

  const handleApprove = async (quoteId: string) => {
    await onApprove(quoteId, approvalObservations)
    setSelectedQuote(null)
    setApprovalObservations("")
  }

  const handleReject = async (quoteId: string) => {
    if (!rejectionReason.trim()) {
      alert("Informe o motivo da rejeição")
      return
    }
    
    await onReject(quoteId, rejectionReason)
    setShowRejectionForm(null)
    setRejectionReason("")
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APROVADO': return 'bg-green-100 text-green-800'
      case 'REJEITADO': return 'bg-red-100 text-red-800'
      case 'EM_ANALISE': return 'bg-blue-100 text-blue-800'
      case 'RECEBIDO': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APROVADO': return <CheckCircle className="h-4 w-4" />
      case 'REJEITADO': return <XCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  // Encontrar menor preço
  const minPrice = Math.min(...quotes.map(q => q.totalValue))

  return (
    <div className="space-y-6">
      {/* Header da OS */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Aprovação de Orçamentos - OS {serviceOrder.number}
          </CardTitle>
          <CardDescription>{serviceOrder.title}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Solicitante</p>
                <p className="text-sm text-muted-foreground">{serviceOrder.createdBy.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Departamento</p>
                <p className="text-sm text-muted-foreground">
                  {serviceOrder.createdBy.department.name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Data</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(serviceOrder.createdAt)}
                </p>
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Materiais Solicitados:</h4>
            <p className="text-sm text-muted-foreground">
              {serviceOrder.materialDescription}
            </p>
            {serviceOrder.materialJustification && (
              <>
                <h4 className="font-medium mb-2 mt-3">Justificativa:</h4>
                <p className="text-sm text-muted-foreground">
                  {serviceOrder.materialJustification}
                </p>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Orçamentos */}
      <div className="grid gap-6">
        {quotes.map((quote) => (
          <Card key={quote.id} className={`${
            quote.totalValue === minPrice && quotes.length > 1 
              ? 'border-green-500 shadow-md' 
              : ''
          }`}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  {quote.supplier.name}
                  {quote.totalValue === minPrice && quotes.length > 1 && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      Menor Preço
                    </Badge>
                  )}
                </CardTitle>
                <Badge className={getStatusColor(quote.status)}>
                  {getStatusIcon(quote.status)}
                  {quote.status}
                </Badge>
              </div>
              <CardDescription>
                Contato: {quote.supplier.contact} • {quote.supplier.email}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Itens do Orçamento */}
              <div>
                <h4 className="font-medium mb-2">Itens:</h4>
                <div className="space-y-2">
                  {quote.items.map((item: any, index: number) => (
                    <div key={index} className="flex justify-between items-center p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium">{item.description}</span>
                        <span className="text-muted-foreground ml-2">
                          Qty: {item.quantity}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          {formatCurrency(item.totalPrice || (item.unitPrice * item.quantity))}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Unit: {formatCurrency(item.unitPrice)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalhes do Orçamento */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Total</p>
                    <p className="font-bold text-lg">
                      {formatCurrency(quote.totalValue)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Prazo Entrega</p>
                    <p className="font-medium">
                      {quote.deliveryTime} dias
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Validade</p>
                    <p className="font-medium">
                      {formatDate(quote.validity)}
                    </p>
                  </div>
                </div>
              </div>

              {quote.observations && (
                <div>
                  <h4 className="font-medium mb-1">Observações:</h4>
                  <p className="text-sm text-muted-foreground">{quote.observations}</p>
                </div>
              )}

              {/* Ações */}
              {quote.status === 'RECEBIDO' && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    onClick={() => setSelectedQuote(quote.id)}
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Aprovar
                  </Button>
                  <Button
                    onClick={() => setShowRejectionForm(quote.id)}
                    variant="destructive"
                    className="flex-1"
                    disabled={isLoading}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </Button>
                </div>
              )}

              {/* Formulário de Aprovação */}
              {selectedQuote === quote.id && (
                <div className="space-y-3 p-4 bg-green-50 rounded border border-green-200">
                  <Label htmlFor="approval-obs">Observações da Aprovação (opcional)</Label>
                  <Textarea
                    id="approval-obs"
                    value={approvalObservations}
                    onChange={(e) => setApprovalObservations(e.target.value)}
                    placeholder="Observações sobre a aprovação..."
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleApprove(quote.id)}
                      className="flex-1"
                      disabled={isLoading}
                    >
                      Confirmar Aprovação
                    </Button>
                    <Button
                      onClick={() => setSelectedQuote(null)}
                      variant="outline"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              {/* Formulário de Rejeição */}
              {showRejectionForm === quote.id && (
                <div className="space-y-3 p-4 bg-red-50 rounded border border-red-200">
                  <Label htmlFor="rejection-reason">Motivo da Rejeição *</Label>
                  <Textarea
                    id="rejection-reason"
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Informe o motivo da rejeição..."
                    rows={2}
                    required
                  />
                  <div className="flex gap-2">
                    <Button
                      onClick={() => handleReject(quote.id)}
                      variant="destructive"
                      className="flex-1"
                      disabled={isLoading || !rejectionReason.trim()}
                    >
                      Confirmar Rejeição
                    </Button>
                    <Button
                      onClick={() => setShowRejectionForm(null)}
                      variant="outline"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {quotes.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-medium mb-2">Aguardando Orçamentos</h3>
            <p className="text-muted-foreground">
              Os orçamentos ainda não foram recebidos dos fornecedores.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
