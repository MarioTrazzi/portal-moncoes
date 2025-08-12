"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge, PriorityBadge } from "@/components/ui/status-badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { ArrowLeft, Clock, User, MapPin, FileText, Save, Loader2 } from "lucide-react"
import { ServiceOrderStatus, AttachmentType, UserRole } from "@prisma/client"
import { statusLabels, categoryLabels } from "@/types"
import { useToast } from "@/hooks/use-toast"
import { AttachmentManager } from "@/components/service-orders/attachment-manager"
import { useAuth } from "@/contexts/auth-context"
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
  const [serviceOrder, setServiceOrder] = useState<ServiceOrderDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newStatus, setNewStatus] = useState<ServiceOrderStatus | "">("")
  const [diagnosis, setDiagnosis] = useState("")
  const [solution, setSolution] = useState("")
  const [observations, setObservations] = useState("")
  
  const router = useRouter()
  const { toast } = useToast()
  const { user: currentUser } = useAuth()

  // Função para verificar permissões de edição
  const canEditStatus = (): boolean => {
    if (!currentUser || !serviceOrder) return false
    
    // Técnicos podem alterar qualquer status
    if (currentUser.role === UserRole.TECNICO) return true
    
    // Criador da OS pode editar apenas se estiver ABERTA
    if (currentUser.id === serviceOrder.createdBy.id) {
      return serviceOrder.status === ServiceOrderStatus.ABERTA
    }
    
    return false
  }

  // Função para verificar se pode finalizar OS
  const canComplete = (): boolean => {
    if (!currentUser || !serviceOrder) return false
    
    // Técnicos podem finalizar qualquer OS
    if (currentUser.role === UserRole.TECNICO) return true
    
    // Criador pode finalizar apenas se estiver ABERTA
    if (currentUser.id === serviceOrder.createdBy.id) {
      return serviceOrder.status === ServiceOrderStatus.ABERTA
    }
    
    return false
  }

  useEffect(() => {
    fetchServiceOrder()
  }, [resolvedParams.id])

  useEffect(() => {
    if (serviceOrder) {
      setNewStatus(serviceOrder.status)
      setDiagnosis(serviceOrder.diagnosis || "")
      setSolution(serviceOrder.solution || "")
      setObservations(serviceOrder.observations || "")
    }
  }, [serviceOrder])

  const fetchServiceOrder = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/service-orders/${resolvedParams.id}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("OS não encontrada")
        }
        throw new Error("Erro ao carregar OS")
      }
      
      const data = await response.json()
      setServiceOrder(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!serviceOrder) return

    try {
      setSaving(true)
      
      const updateData = {
        status: newStatus,
        diagnosis: diagnosis.trim() || undefined,
        solution: solution.trim() || undefined, 
        observations: observations.trim() || undefined,
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
        title: "Sucesso!",
        description: "OS atualizada com sucesso!",
        variant: "success",
      })

      // Recarregar dados
      await fetchServiceOrder()
    } catch (error) {
      console.error("Erro:", error)
      toast({
        title: "Erro!",
        description: error instanceof Error ? error.message : "Erro ao atualizar OS",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
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

  if (loading) {
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
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold tracking-tight">{serviceOrder.number}</h1>
            <StatusBadge status={serviceOrder.status} />
            <PriorityBadge priority={serviceOrder.priority as any} />
          </div>
          <p className="text-muted-foreground">{serviceOrder.title}</p>
        </div>
        <Button onClick={handleUpdate} disabled={saving}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-2 h-4 w-4" />
          Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informações da OS
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Descrição</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {serviceOrder.description}
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Categoria</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {categoryLabels[serviceOrder.category as keyof typeof categoryLabels]}
                </p>
              </div>
              <div>
                <Label className="text-sm font-medium">Prioridade</Label>
                <p className="text-sm text-muted-foreground mt-1">
                  {serviceOrder.priority}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-sm font-medium">Status</Label>
              {canEditStatus() ? (
                <Select value={newStatus} onValueChange={(value) => setNewStatus(value as ServiceOrderStatus)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover text-popover-foreground border shadow-lg">
                    {Object.entries(statusLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value} className="focus:bg-accent focus:text-accent-foreground hover:bg-accent/80">
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="mt-1">
                  <StatusBadge status={serviceOrder.status} />
                  {!canEditStatus() && currentUser?.id === serviceOrder.createdBy.id && serviceOrder.status !== ServiceOrderStatus.ABERTA && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Você só pode alterar o status enquanto a OS estiver aberta
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Localização e Responsáveis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localização e Responsáveis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm font-medium">Local</Label>
              <p className="text-sm text-muted-foreground mt-1">
                {serviceOrder.createdBy.department ? (
                  <>
                    {serviceOrder.createdBy.department.name}
                    <br />
                    {serviceOrder.createdBy.department.location}
                    {serviceOrder.createdBy.department.building && ` - ${serviceOrder.createdBy.department.building}`}
                  </>
                ) : (
                  "Localização não informada"
                )}
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium">Solicitado por</Label>
              <div className="mt-1">
                <p className="text-sm font-medium">{serviceOrder.createdBy.name}</p>
                <p className="text-xs text-muted-foreground">
                  {serviceOrder.createdBy.email}
                  {serviceOrder.createdBy.department && ` • ${serviceOrder.createdBy.department.name}`}
                  {serviceOrder.createdBy.position && ` • ${serviceOrder.createdBy.position}`}
                </p>
              </div>
            </div>

            {serviceOrder.assignedTo && (
              <div>
                <Label className="text-sm font-medium">Atribuído para</Label>
                <div className="mt-1">
                  <p className="text-sm font-medium">{serviceOrder.assignedTo.name}</p>
                  <p className="text-xs text-muted-foreground">{serviceOrder.assignedTo.email}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Diagnóstico e Solução */}
        <Card>
          <CardHeader>
            <CardTitle>Diagnóstico</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnóstico do Técnico</Label>
              <Textarea
                id="diagnosis"
                placeholder="Descreva o diagnóstico do problema..."
                value={diagnosis}
                onChange={(e) => setDiagnosis(e.target.value)}
                disabled={currentUser?.role !== UserRole.TECNICO}
                rows={3}
              />
              {currentUser?.role !== UserRole.TECNICO && (
                <p className="text-xs text-muted-foreground">
                  Apenas técnicos podem adicionar diagnóstico
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Solução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="solution">Solução Aplicada</Label>
                <Textarea
                  id="solution"
                  placeholder="Descreva a solução aplicada..."
                  value={solution}
                  onChange={(e) => setSolution(e.target.value)}
                  disabled={currentUser?.role !== UserRole.TECNICO}
                  rows={3}
                />
                {currentUser?.role !== UserRole.TECNICO && (
                  <p className="text-xs text-muted-foreground">
                    Apenas técnicos podem adicionar solução
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea
                  id="observations"
                  placeholder="Observações adicionais..."
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  disabled={!canEditStatus() && !canComplete()}
                  rows={2}
                />
                {!canEditStatus() && !canComplete() && (
                  <p className="text-xs text-muted-foreground">
                    Você não tem permissão para editar observações
                  </p>
                )}
              </div>
              
              {/* Botão de salvar com permissões */}
              {(canEditStatus() || canComplete()) && (
                <div className="flex gap-2 pt-4">
                  <Button 
                    onClick={handleUpdate} 
                    disabled={saving}
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
                        Salvar Alterações
                      </>
                    )}
                  </Button>
                  
                  {canComplete() && serviceOrder.status !== ServiceOrderStatus.FINALIZADA && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setNewStatus(ServiceOrderStatus.FINALIZADA)
                        // Trigger update after status change
                        setTimeout(handleUpdate, 100)
                      }}
                      disabled={saving}
                    >
                      Finalizar OS
                    </Button>
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
