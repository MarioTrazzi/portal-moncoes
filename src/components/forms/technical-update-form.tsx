"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Plus, Trash2, Package, AlertCircle } from "lucide-react"
import { ServiceOrderStatus } from "@prisma/client"

interface MaterialItem {
  description: string
  quantity: number
  estimatedPrice: number
}

interface Supplier {
  id: string
  name: string
  contact: string
  categories: string[]
}

interface TechnicalUpdateFormProps {
  serviceOrder: any
  suppliers: Supplier[]
  onSubmit: (data: any) => Promise<void>
  isLoading?: boolean
}

export function TechnicalUpdateForm({ 
  serviceOrder, 
  suppliers,
  onSubmit, 
  isLoading = false 
}: TechnicalUpdateFormProps) {
  const [diagnosis, setDiagnosis] = useState(serviceOrder.diagnosis || "")
  const [solution, setSolution] = useState(serviceOrder.solution || "")
  const [observations, setObservations] = useState(serviceOrder.observations || "")
  const [requiresMaterial, setRequiresMaterial] = useState(serviceOrder.requiresMaterial || false)
  const [materialDescription, setMaterialDescription] = useState(serviceOrder.materialDescription || "")
  const [materialJustification, setMaterialJustification] = useState(serviceOrder.materialJustification || "")
  const [estimatedHours, setEstimatedHours] = useState(serviceOrder.estimatedHours || "")
  const [status, setStatus] = useState(serviceOrder.status)
  
  // Para solicitação de orçamentos
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [materialItems, setMaterialItems] = useState<MaterialItem[]>([
    { description: "", quantity: 1, estimatedPrice: 0 }
  ])
  
  const [step, setStep] = useState<'update' | 'request-quotes'>('update')

  const addMaterialItem = () => {
    setMaterialItems([...materialItems, { description: "", quantity: 1, estimatedPrice: 0 }])
  }

  const removeMaterialItem = (index: number) => {
    if (materialItems.length > 1) {
      setMaterialItems(materialItems.filter((_, i) => i !== index))
    }
  }

  const updateMaterialItem = (index: number, field: keyof MaterialItem, value: string | number) => {
    const updated = [...materialItems]
    updated[index] = { ...updated[index], [field]: value }
    setMaterialItems(updated)
  }

  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers(prev => 
      prev.includes(supplierId) 
        ? prev.filter(id => id !== supplierId)
        : [...prev, supplierId]
    )
  }

  const handleTechnicalUpdate = async () => {
    const updateData = {
      diagnosis,
      solution,
      observations,
      requiresMaterial,
      materialDescription,
      materialJustification,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : null,
      status: requiresMaterial ? ServiceOrderStatus.SOLICITAR_ORCAMENTO : ServiceOrderStatus.EM_EXECUCAO
    }

    await onSubmit(updateData)

    if (requiresMaterial) {
      setStep('request-quotes')
    }
  }

  const handleRequestQuotes = async () => {
    if (selectedSuppliers.length < 2) {
      alert("Selecione pelo menos 2 fornecedores")
      return
    }

    const validItems = materialItems.filter(item => item.description.trim())
    if (validItems.length === 0) {
      alert("Adicione pelo menos um item")
      return
    }

    const quotesData = {
      selectedSuppliers,
      materialDescription,
      items: validItems
    }

    try {
      const response = await fetch(`/api/service-orders/${serviceOrder.id}/request-quotes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(quotesData)
      })

      if (response.ok) {
        alert("Orçamentos solicitados com sucesso!")
        window.location.reload()
      } else {
        const error = await response.json()
        alert(error.error || "Erro ao solicitar orçamentos")
      }
    } catch (error) {
      console.error("Erro:", error)
      alert("Erro ao solicitar orçamentos")
    }
  }

  if (step === 'request-quotes') {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Solicitar Orçamentos
          </CardTitle>
          <CardDescription>
            Selecione fornecedores e detalhe os itens necessários
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Itens do Material */}
          <div>
            <Label className="text-base font-semibold">Itens Necessários</Label>
            <div className="space-y-3 mt-2">
              {materialItems.map((item, index) => (
                <div key={index} className="flex gap-2 items-end">
                  <div className="flex-1">
                    <Label htmlFor={`desc-${index}`}>Descrição</Label>
                    <Input
                      id={`desc-${index}`}
                      value={item.description}
                      onChange={(e) => updateMaterialItem(index, 'description', e.target.value)}
                      placeholder="Ex: Cabo de rede CAT6 20m"
                    />
                  </div>
                  <div className="w-24">
                    <Label htmlFor={`qty-${index}`}>Qtd</Label>
                    <Input
                      id={`qty-${index}`}
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => updateMaterialItem(index, 'quantity', parseInt(e.target.value) || 1)}
                    />
                  </div>
                  <div className="w-32">
                    <Label htmlFor={`price-${index}`}>Preço Est.</Label>
                    <Input
                      id={`price-${index}`}
                      type="number"
                      step="0.01"
                      value={item.estimatedPrice}
                      onChange={(e) => updateMaterialItem(index, 'estimatedPrice', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeMaterialItem(index)}
                    disabled={materialItems.length === 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={addMaterialItem}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Item
              </Button>
            </div>
          </div>

          {/* Seleção de Fornecedores */}
          <div>
            <Label className="text-base font-semibold">Fornecedores</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Selecione pelo menos 2 fornecedores para solicitar orçamentos
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                    selectedSuppliers.includes(supplier.id)
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => toggleSupplier(supplier.id)}
                >
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      checked={selectedSuppliers.includes(supplier.id)}
                      onChange={() => toggleSupplier(supplier.id)}
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{supplier.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Contato: {supplier.contact}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {supplier.categories.slice(0, 3).map((category, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedSuppliers.length < 2 && (
              <div className="flex items-center gap-2 text-amber-600 mt-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">Selecione pelo menos 2 fornecedores</span>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => setStep('update')}
              variant="outline"
              className="flex-1"
            >
              Voltar
            </Button>
            <Button
              onClick={handleRequestQuotes}
              className="flex-1"
              disabled={selectedSuppliers.length < 2 || isLoading}
            >
              Solicitar Orçamentos
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Atualização Técnica</CardTitle>
        <CardDescription>
          Preencha o diagnóstico e indique se são necessários materiais
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Diagnóstico */}
        <div>
          <Label htmlFor="diagnosis">Diagnóstico *</Label>
          <Textarea
            id="diagnosis"
            value={diagnosis}
            onChange={(e) => setDiagnosis(e.target.value)}
            placeholder="Descreva o diagnóstico do problema..."
            rows={3}
            required
          />
        </div>

        {/* Solução */}
        <div>
          <Label htmlFor="solution">Solução</Label>
          <Textarea
            id="solution"
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="Descreva a solução aplicada ou proposta..."
            rows={3}
          />
        </div>

        {/* Horas Estimadas */}
        <div>
          <Label htmlFor="estimated-hours">Horas Estimadas</Label>
          <Input
            id="estimated-hours"
            type="number"
            step="0.5"
            value={estimatedHours}
            onChange={(e) => setEstimatedHours(e.target.value)}
            placeholder="Ex: 2.5"
            className="w-32"
          />
        </div>

        {/* Checkbox Materiais */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="requires-material"
            checked={requiresMaterial}
            onCheckedChange={setRequiresMaterial}
          />
          <Label htmlFor="requires-material">
            Esta OS requer materiais/equipamentos
          </Label>
        </div>

        {/* Campos de Material (condicionais) */}
        {requiresMaterial && (
          <>
            <div>
              <Label htmlFor="material-description">Descrição dos Materiais *</Label>
              <Textarea
                id="material-description"
                value={materialDescription}
                onChange={(e) => setMaterialDescription(e.target.value)}
                placeholder="Descreva detalhadamente os materiais necessários..."
                rows={3}
                required={requiresMaterial}
              />
            </div>

            <div>
              <Label htmlFor="material-justification">Justificativa *</Label>
              <Textarea
                id="material-justification"
                value={materialJustification}
                onChange={(e) => setMaterialJustification(e.target.value)}
                placeholder="Justifique a necessidade dos materiais..."
                rows={2}
                required={requiresMaterial}
              />
            </div>
          </>
        )}

        {/* Observações */}
        <div>
          <Label htmlFor="observations">Observações</Label>
          <Textarea
            id="observations"
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Observações adicionais..."
            rows={2}
          />
        </div>

        <Button
          onClick={handleTechnicalUpdate}
          className="w-full"
          disabled={isLoading || !diagnosis.trim()}
        >
          {requiresMaterial ? 'Solicitar Material' : 'Atualizar OS'}
        </Button>
      </CardContent>
    </Card>
  )
}
