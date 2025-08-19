"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Clock, User, MapPin, FileText, Save, Loader2, Plus, DollarSign } from "lucide-react"
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

interface Quote {
  id: string
  totalValue: number
  deliveryTime?: number
  validity?: string
  observations?: string
  status: string
  createdAt: string
  supplier: {
    id: string
    name: string
    cnpj: string
    contact: string
    phone: string
    email: string
  }
  items: Array<{
    description: string
    quantity: number
    unitPrice: number
    totalPrice: number
  }>
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
  quotes: Quote[]
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
          // Aprovador pode gerar PDF e enviar para assinatura
          actions.push({
            action: 'generate_pdf',
            label: 'Gerar PDF para Assinatura',
            nextStatus: ServiceOrderStatus.AGUARDANDO_ASSINATURA,
            description: 'Gera PDF do orçamento e envia para assinatura do prefeito'
          })
        }
        break

      case ServiceOrderStatus.ORCAMENTOS_RECEBIDOS:
        if (userRole === UserRole.APROVADOR || userRole === UserRole.ADMIN) {
          // Aprovador pode gerar PDF e enviar para assinatura
          actions.push({
            action: 'generate_pdf',
            label: 'Gerar PDF para Assinatura',
            nextStatus: ServiceOrderStatus.AGUARDANDO_ASSINATURA,
            description: 'Gera PDF do orçamento e envia para assinatura do prefeito'
          })
        }
        break

      case ServiceOrderStatus.AGUARDANDO_ASSINATURA:
        if (userRole === UserRole.ADMIN) {
          // Apenas prefeito (admin) pode anexar documento assinado
          actions.push({
            action: 'attach_signed_document',
            label: 'Anexar Documento Assinado',
            nextStatus: ServiceOrderStatus.MATERIAL_APROVADO,
            description: 'Anexa o documento assinado e aprova o material',
            requiresFileUpload: true
          })
        }
        break

      case ServiceOrderStatus.AGUARDANDO_APROVACAO:
        if (userRole === UserRole.GESTOR || userRole === UserRole.ADMIN) {
          // Gestor pode aprovar material (fluxo antigo sem assinatura)
          actions.push({
            action: 'approve_material',
            label: 'Aprovar Material',
            nextStatus: ServiceOrderStatus.MATERIAL_APROVADO,
            description: 'Aprova a compra do material necessário'
          })
        }
        break

      case ServiceOrderStatus.MATERIAL_APROVADO:
        if (userRole === UserRole.TECNICO) {
          // Técnico pode iniciar deslocamento
          actions.push({
            action: 'start_displacement',
            label: 'Aguardar Deslocamento',
            nextStatus: ServiceOrderStatus.AGUARDANDO_DESLOCAMENTO,
            description: 'Aguarda deslocamento para execução da OS'
          })
        }
        break

      case ServiceOrderStatus.AGUARDANDO_DESLOCAMENTO:
        if (userRole === UserRole.TECNICO) {
          // Técnico pode iniciar execução
          actions.push({
            action: 'start_execution_approved',
            label: 'Iniciar Execução',
            nextStatus: ServiceOrderStatus.EM_EXECUCAO,
            description: 'Inicia execução da OS'
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
      
      // Pegar token do cookie
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
      
      const response = await fetch(`/api/service-orders/${resolvedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Sessão expirada. Faça login novamente.")
        }
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
      
      // Pegar token do cookie
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
          "Authorization": `Bearer ${token}`
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

      if (action.requiresMaterialDescription && !materialJustification.trim()) {
        toast({
          title: "Erro",
          description: "Justificativa do material é obrigatória para esta ação",
          variant: "destructive"
        })
        return
      }

      // Pegar token do cookie
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

      // Verificar se é ação especial de geração de PDF
      if (action.action === 'generate_pdf') {
        const response = await fetch(`/api/service-orders/${resolvedParams.id}/generate-pdf`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(error.error || "Erro ao gerar PDF")
        }

        const result = await response.json()
        
        // Atualizar status da OS para AGUARDANDO_ASSINATURA
        const updateResponse = await fetch(`/api/service-orders/${resolvedParams.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({ status: action.nextStatus }),
        })

        if (!updateResponse.ok) {
          const error = await updateResponse.json()
          throw new Error(error.error || "Erro ao atualizar status")
        }

        toast({
          title: "Sucesso",
          description: "PDF gerado com sucesso. OS enviada para assinatura do prefeito."
        })

        await fetchServiceOrder()
        return
      }

      // Verificar se é ação de anexar documento
      if (action.action === 'attach_signed_document') {
        // Aqui seria aberto um dialog para upload do arquivo
        // Por enquanto, vamos simular com um prompt
        const fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.accept = '.pdf'
        fileInput.onchange = async (event) => {
          const file = (event.target as HTMLInputElement).files?.[0]
          if (!file) return

          const formData = new FormData()
          formData.append('document', file)

          const response = await fetch(`/api/service-orders/${resolvedParams.id}/attach-document`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${token}`
            },
            body: formData
          })

          if (!response.ok) {
            const error = await response.json()
            throw new Error(error.error || "Erro ao anexar documento")
          }

          toast({
            title: "Sucesso",
            description: "Documento anexado com sucesso. Material aprovado!"
          })

          await fetchServiceOrder()
        }
        fileInput.click()
        return
      }

      // Verificar se é ação de solicitar orçamento
      if (action.action === 'request_quote') {
        // Simular envio de emails para fornecedores
        const emailInfo = {
          osNumber: serviceOrder.number,
          osTitle: serviceOrder.title,
          materialDescription: materialDescription.trim(),
          materialJustification: materialJustification.trim(),
          requester: serviceOrder.createdBy.name,
          department: serviceOrder.createdBy.department?.name,
          location: serviceOrder.location,
          priority: serviceOrder.priority,
          generatedBy: currentUser.name,
          sentAt: new Date().toLocaleString('pt-BR')
        }

        // Log detalhado do email que seria enviado
        console.log('📧 EMAIL ENVIADO PARA FORNECEDORES:', {
          subject: `Solicitação de Orçamento - OS ${emailInfo.osNumber}`,
          recipients: 'Todos os fornecedores cadastrados no sistema',
          content: {
            greeting: 'Prezados Fornecedores,',
            introduction: `Solicitamos orçamento para os materiais relacionados à Ordem de Serviço ${emailInfo.osNumber}.`,
            osDetails: {
              titulo: emailInfo.osTitle,
              prioridade: emailInfo.priority,
              solicitante: emailInfo.requester,
              departamento: emailInfo.department,
              localizacao: emailInfo.location
            },
            materialInfo: {
              descricao: emailInfo.materialDescription,
              justificativa: emailInfo.materialJustification
            },
            instructions: 'Por favor, enviem o orçamento detalhado com prazo de entrega e validade.',
            footer: `Solicitação gerada por: ${emailInfo.generatedBy} em ${emailInfo.sentAt}`
          }
        })

        toast({
          title: "Emails Enviados!",
          description: `Solicitação de orçamento enviada para fornecedores cadastrados. Confira o console para ver detalhes do email.`,
        })
      }

      // Ação padrão de atualização de status
      const updateData: any = {
        status: action.nextStatus
      }

      // Incluir campos técnicos apenas se o usuário for técnico ou se os campos têm conteúdo
      if (currentUser.role === 'TECNICO') {
        if (diagnosis.trim()) updateData.diagnosis = diagnosis.trim()
        if (solution.trim()) updateData.solution = solution.trim()
        if (observations.trim()) updateData.observations = observations.trim()
      }

      // Incluir campos de material apenas se necessário para a ação
      if (action.requiresMaterialDescription) {
        updateData.materialDescription = materialDescription.trim()
        updateData.materialJustification = materialJustification.trim()
      } else if (materialDescription.trim() || materialJustification.trim()) {
        // Incluir se já têm conteúdo
        if (materialDescription.trim()) updateData.materialDescription = materialDescription.trim()
        if (materialJustification.trim()) updateData.materialJustification = materialJustification.trim()
      }

      const url = `/api/service-orders/${resolvedParams.id}`

      const response = await fetch(url, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
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
              {(serviceOrder.status === ServiceOrderStatus.EM_ANALISE ||
                serviceOrder.status === ServiceOrderStatus.AGUARDANDO_MATERIAL || 
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
                    {serviceOrder.status === ServiceOrderStatus.EM_ANALISE && (
                      <p className="text-xs text-muted-foreground mt-1">
                        * Obrigatório para solicitar material
                      </p>
                    )}
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
                    {serviceOrder.status === ServiceOrderStatus.EM_ANALISE && (
                      <p className="text-xs text-muted-foreground mt-1">
                        * Obrigatório para solicitar material
                      </p>
                    )}
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

      {/* Seção de Orçamentos */}
      {(serviceOrder.status === ServiceOrderStatus.AGUARDANDO_ORCAMENTO || 
        serviceOrder.status === ServiceOrderStatus.ORCAMENTOS_RECEBIDOS ||
        serviceOrder.quotes.length > 0) && (
        <Card className="mt-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Orçamentos
                </CardTitle>
                <CardDescription>
                  Orçamentos recebidos para esta OS
                </CardDescription>
              </div>
              {currentUser && (currentUser.role === 'GESTOR' || currentUser.role === 'ADMIN') && (
                <Button asChild size="sm">
                  <Link href={`/dashboard/service-orders/${serviceOrder.id}/add-quote`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Orçamento
                  </Link>
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {serviceOrder.quotes.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Nenhum orçamento cadastrado</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Os orçamentos podem ser cadastrados manualmente ou recebidos por email
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {serviceOrder.quotes.map((quote) => (
                  <div key={quote.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-medium">{quote.supplier.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          CNPJ: {quote.supplier.cnpj} | Contato: {quote.supplier.contact}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-green-600">
                          R$ {quote.totalValue.toFixed(2)}
                        </div>
                        <Badge variant="outline">{quote.status}</Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mb-3">
                      {quote.deliveryTime && (
                        <div>
                          <span className="text-sm font-medium">Prazo:</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {quote.deliveryTime} dias
                          </span>
                        </div>
                      )}
                      {quote.validity && (
                        <div>
                          <span className="text-sm font-medium">Validade:</span>
                          <span className="text-sm text-muted-foreground ml-2">
                            {formatDate(quote.validity)}
                          </span>
                        </div>
                      )}
                    </div>

                    {quote.items && quote.items.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium mb-2">Itens:</h5>
                        <div className="space-y-1">
                          {quote.items.map((item, index) => (
                            <div key={index} className="text-sm flex justify-between">
                              <span>{item.description} (Qtd: {item.quantity})</span>
                              <span>R$ {item.totalPrice.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {quote.observations && (
                      <div className="mt-3">
                        <span className="text-sm font-medium">Observações:</span>
                        <p className="text-sm text-muted-foreground mt-1">{quote.observations}</p>
                      </div>
                    )}

                    <div className="mt-3 text-xs text-muted-foreground">
                      Cadastrado em {formatDate(quote.createdAt)}
                    </div>
                  </div>
                ))}
                
                {serviceOrder.quotes.length > 1 && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium">Análise de Orçamentos:</div>
                    <div className="text-sm text-muted-foreground mt-1">
                      Menor valor: R$ {Math.min(...serviceOrder.quotes.map(q => q.totalValue)).toFixed(2)}
                      {" | "}
                      Maior valor: R$ {Math.max(...serviceOrder.quotes.map(q => q.totalValue)).toFixed(2)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
