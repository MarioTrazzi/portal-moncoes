"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Clock, User, MapPin, FileText, Save, Loader2 } from "lucide-react"
import { ServiceOrderStatus, AttachmentType, UserRole } from "@prisma/client"
import { statusLabels, categoryLabels } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { AttachmentManager } from "@/components/service-orders/attachment-manager"
import { useAuth } from "@/contexts/auth-context"
import { useHydration } from "@/hooks/use-hydration"
import Link from "next/link"

interface Attachment {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  path: string
  type: AttachmentType
  description?: string
  uploadedAt: string
}

interface CurrentUser {
  id: string
  name: string
  email: string
  role: UserRole
}

interface ServiceOrderDetails {
  id: string
  number: string
  title: string
  description: string
  status: ServiceOrderStatus
  priority: string
  category: string
  location: string
  building?: string
  room?: string
  diagnosis?: string
  solution?: string
  observations?: string
  materialDescription?: string
  materialJustification?: string
  estimatedHours?: number
  actualHours?: number
  createdAt: string
  updatedAt: string
  assignedAt?: string
  startedAt?: string
  completedAt?: string
  createdBy: {
    id: string
    name: string
    email: string
    department?: {
      name: string
      location: string
      building?: string
    }
    position?: string
  }
  assignedTo?: {
    id: string
    name: string
    email: string
  }
  attachments: Attachment[]
  auditLogs: Array<{
    id: string
    action: string
    details: Record<string, unknown>
    createdAt: string
    user: {
      name: string
    }
  }>
}

export default function ServiceOrderDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const hydrated = useHydration()
  const [serviceOrder, setServiceOrder] = useState<ServiceOrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [materialDescription, setMaterialDescription] = useState("")
  const [materialJustification, setMaterialJustification] = useState("")
  const [diagnosis, setDiagnosis] = useState("")
  const [solution, setSolution] = useState("")
  const [observations, setObservations] = useState("")
  
  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  // Função para verificar permissões baseadas no fluxo do processo
  const getAvailableActions = (status: ServiceOrderStatus, userRole: UserRole) => {
    const actions = []

    switch (status) {
      case ServiceOrderStatus.ABERTA:
        // Apenas técnico pode colocar em análise
        if (userRole === UserRole.TECNICO) {
          actions.push({
            action: 'start_analysis',
            label: 'Iniciar Análise',
            nextStatus: ServiceOrderStatus.EM_ANALISE,
            description: 'Inicia o processo de análise técnica da OS'
          })
        }
        break

      case ServiceOrderStatus.EM_ANALISE:
        if (userRole === UserRole.TECNICO) {
          // Técnico pode identificar necessidade de material
          actions.push({
            action: 'require_material',
            label: 'Necessita Material',
            nextStatus: ServiceOrderStatus.AGUARDANDO_MATERIAL,
            description: 'Identifica que a OS requer materiais para execução',
            requiresMaterialDescription: true
          })
          
          // Ou pode prosseguir sem material
          actions.push({
            action: 'start_execution',
            label: 'Iniciar Execução',
            nextStatus: ServiceOrderStatus.EM_EXECUCAO,
            description: 'Inicia a execução da OS sem necessidade de materiais'
          })
        }
        break

      case ServiceOrderStatus.AGUARDANDO_MATERIAL:
        if (userRole === UserRole.GESTOR || userRole === UserRole.ADMIN) {
          // Gestor pode solicitar orçamento
          actions.push({
            action: 'request_quote',
            label: 'Solicitar Orçamento',
            nextStatus: ServiceOrderStatus.AGUARDANDO_ORCAMENTO,
            description: 'Envia solicitação de orçamento para fornecedores'
          })
        }
        break

      case ServiceOrderStatus.AGUARDANDO_ORCAMENTO:
        if (userRole === UserRole.APROVADOR || userRole === UserRole.ADMIN) {
          // Aprovador pode enviar para aprovação
          actions.push({
            action: 'send_approval',
            label: 'Enviar para Aprovação',
            nextStatus: ServiceOrderStatus.AGUARDANDO_APROVACAO,
            description: 'Envia orçamento para aprovação superior'
          })
        }
        break

      case ServiceOrderStatus.AGUARDANDO_APROVACAO:
        if (userRole === UserRole.GESTOR || userRole === UserRole.ADMIN) {
          // Gestor pode aprovar material
          actions.push({
            action: 'approve_material',
            label: 'Aprovar Material',
            nextStatus: ServiceOrderStatus.MATERIAL_APROVADO,
            description: 'Aprova a compra do material necessário',
            requiresSignature: true
          })
        }
        break

      case ServiceOrderStatus.MATERIAL_APROVADO:
        if (userRole === UserRole.TECNICO) {
          // Técnico pode iniciar execução com material aprovado
          actions.push({
            action: 'start_execution_approved',
            label: 'Iniciar Execução',
            nextStatus: ServiceOrderStatus.EM_EXECUCAO,
            description: 'Inicia execução com material aprovado'
          })
        }
        break

      case ServiceOrderStatus.EM_EXECUCAO:
        if (userRole === UserRole.TECNICO) {
          // Técnico pode finalizar
          actions.push({
            action: 'complete',
            label: 'Finalizar OS',
            nextStatus: ServiceOrderStatus.FINALIZADA,
            description: 'Finaliza a execução da OS'
          })
        }
        break

      case ServiceOrderStatus.FINALIZADA:
      case ServiceOrderStatus.CANCELADA:
        // Nenhuma ação disponível para status finais
        break
    }

    return actions
  }

  useEffect(() => {
    if (hydrated) {
      fetchServiceOrder()
    }
  }, [resolvedParams.id, hydrated])

  useEffect(() => {
    if (serviceOrder) {
      setDiagnosis(serviceOrder.diagnosis || "")
      setSolution(serviceOrder.solution || "")
      setObservations(serviceOrder.observations || "")
      setMaterialDescription(serviceOrder.materialDescription || "")
      setMaterialJustification(serviceOrder.materialJustification || "")
    }
  }, [serviceOrder])

  const fetchServiceOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/service-orders/${resolvedParams.id}`)
      
      if (!response.ok) {
        throw new Error("Ordem de serviço não encontrada")
      }

      const data = await response.json()
      
      if (data.success) {
        setServiceOrder(data.data)
      } else {
        setError(data.error || "Erro ao carregar ordem de serviço")
      }
    } catch (error) {
      console.error("Erro ao buscar OS:", error)
      setError(error instanceof Error ? error.message : "Erro ao carregar OS")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!serviceOrder || !currentUser) return

    try {
      setSaving(true)
      
      const updateData = {
        diagnosis: diagnosis.trim() || undefined,
        solution: solution.trim() || undefined, 
        observations: observations.trim() || undefined,
        materialDescription: materialDescription.trim() || undefined,
        materialJustification: materialJustification.trim() || undefined,
      }

      const url = `/api/service-orders/${resolvedParams.id}`

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao atualizar OS")
      }

      toast({
        title: "Sucesso",
        description: "Informações atualizadas com sucesso"
      })

      // Refresh data
      await fetchServiceOrder()
      
    } catch (error) {
      console.error("Erro ao atualizar:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao atualizar OS",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleWorkflowAction = async (action: any) => {
    if (!serviceOrder || !currentUser) return

    try {
      setSaving(true)
      
      // Validate required fields based on action
      if (action.requiresMaterialDescription && !materialDescription.trim()) {
        toast({
          title: "Erro",
          description: "Descrição do material é obrigatória para esta ação",
          variant: "destructive"
        })
        return
      }

      const updateData = {
        status: action.nextStatus,
        diagnosis: diagnosis.trim() || undefined,
        solution: solution.trim() || undefined, 
        observations: observations.trim() || undefined,
        materialDescription: materialDescription.trim() || undefined,
        materialJustification: materialJustification.trim() || undefined,
      }

      const url = `/api/service-orders/${resolvedParams.id}`

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao executar ação")
      }

      toast({
        title: "Sucesso",
        description: `${action.label} realizada com sucesso`
      })

      // Refresh data
      await fetchServiceOrder()
      
    } catch (error) {
      console.error("Erro ao executar ação:", error)
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro ao executar ação",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  if (!hydrated || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando detalhes da OS...</span>
        </div>
      </div>
    )
  }

  if (error || !serviceOrder) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href="/dashboard/service-orders">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-destructive">Erro</h1>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard/service-orders">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">OS #{serviceOrder.number}</h1>
          <p className="text-muted-foreground">{serviceOrder.title}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Detalhes da OS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Descrição</Label>
              <p className="text-sm text-muted-foreground mt-1">{serviceOrder.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Categoria</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {categoryLabels[serviceOrder.category as keyof typeof categoryLabels] || serviceOrder.category}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Prioridade</Label>
                <div className="mt-1">
                  <PriorityBadge priority={serviceOrder.priority as any} />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Status</Label>
              <div className="mt-1">
                <StatusBadge status={serviceOrder.status} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localização e Responsáveis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localização & Responsáveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Local</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {serviceOrder.location}
                {serviceOrder.building && ` - ${serviceOrder.building}`}
                {serviceOrder.room && ` - Sala ${serviceOrder.room}`}
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Solicitante</Label>
              <div className="mt-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="text-sm">{serviceOrder.createdBy.name}</span>
                </div>
                <p className="text-xs text-muted-foreground ml-6">{serviceOrder.createdBy.email}</p>
                {serviceOrder.createdBy.department && (
                  <p className="text-xs text-muted-foreground ml-6">
                    {serviceOrder.createdBy.department.name}
                  </p>
                )}
              </div>
            </div>

            {serviceOrder.assignedTo && (
              <div>
                <Label className="text-sm font-medium">Técnico Responsável</Label>
                <div className="mt-1">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="text-sm">{serviceOrder.assignedTo.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground ml-6">{serviceOrder.assignedTo.email}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diagnóstico e Solução */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Diagnóstico e Execução</CardTitle>
            <CardDescription>
              Informações técnicas sobre a execução da OS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="diagnosis">Diagnóstico</Label>
                <Textarea
                  id="diagnosis"
                  placeholder="Diagnóstico do problema..."
                  value={diagnosis}
                  onChange={(e) => setDiagnosis(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="solution">Solução Aplicada</Label>
                <Textarea
                  id="solution"
                  placeholder="Descreva a solução aplicada..."
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Observações adicionais..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  rows={2}
                />
              </div>

              {/* Material Description Fields - shown for specific status */}
              {(serviceOrder.status === ServiceOrderStatus.AGUARDANDO_MATERIAL || 
                serviceOrder.status === ServiceOrderStatus.AGUARDANDO_ORCAMENTO) && (
                <>
                  <div>
                    <Label htmlFor="materialDescription">Descrição do Material</Label>
                    <Textarea
                      id="materialDescription"
                      placeholder="Descreva o material necessário..."
                      value={materialDescription}
                      onChange={(e) => setMaterialDescription(e.target.value)}
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="materialJustification">Justificativa</Label>
                    <Textarea
                      id="materialJustification"
                      placeholder="Justifique a necessidade do material..."
                      value={materialJustification}
                      onChange={(e) => setMaterialJustification(e.target.value)}
                      rows={2}
                    />
                  </div>
                </>
              )}
              
              {/* Botão de salvar alterações nos campos */}
              <div className="flex gap-2 pt-4">
                <Button 
                  onClick={handleUpdate} 
                  disabled={saving}
                  variant="outline"
                  className="flex-1"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Salvar Informações
                    </>
                  )}
                </Button>
              </div>

              {/* Workflow Actions */}
              {currentUser && (
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium mb-3">Ações Disponíveis</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getAvailableActions(serviceOrder.status, currentUser.role).map((action, index) => (
                      <Button
                        key={index}
                        onClick={() => handleWorkflowAction(action)}
                        disabled={saving}
                        className="justify-start"
                      >
                        {action.label}
                      </Button>
                    ))}
                  </div>
                  {getAvailableActions(serviceOrder.status, currentUser.role).length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Nenhuma ação disponível para seu perfil neste momento.
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Datas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Timeline
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Criada em:</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(serviceOrder.createdAt)}
                </span>
              </div>
              
              {serviceOrder.assignedAt && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Atribuída em:</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(serviceOrder.assignedAt)}
                  </span>
                </div>
              )}
              
              {serviceOrder.startedAt && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Iniciada em:</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(serviceOrder.startedAt)}
                  </span>
                </div>
              )}
              
              {serviceOrder.completedAt && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Finalizada em:</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDate(serviceOrder.completedAt)}
                  </span>
                </div>
              )}
              
              <div className="flex justify-between">
                <span className="text-sm font-medium">Atualizada em:</span>
                <span className="text-sm text-muted-foreground">
                  {formatDate(serviceOrder.updatedAt)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Histórico de Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Histórico</CardTitle>
            <CardDescription>
              Registro de todas as ações realizadas na OS
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {serviceOrder.auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma ação registrada
                </p>
              ) : (
                serviceOrder.auditLogs.map((log) => (
                  <div key={log.id} className="flex justify-between items-start text-sm">
                    <div>
                      <p className="font-medium">{log.action.replace("_", " ")}</p>
                      <p className="text-muted-foreground">Por: {log.user.name}</p>
                      {log.details && typeof log.details === 'object' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {JSON.stringify(log.details)}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(log.createdAt)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gerenciador de Anexos - Span completo */}
      <div className="mt-6">
        <AttachmentManager
          serviceOrderId={serviceOrder.id}
          attachments={serviceOrder.attachments}
          onAttachmentsChange={fetchServiceOrder}
          canUpload={true}
        />
      </div>
    </div>
  )
}
