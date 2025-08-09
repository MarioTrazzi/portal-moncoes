"use client"

import React, { useState, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  FileText, 
  Image, 
  Download, 
  Trash2, 
  Plus,
  Loader2,
  Eye
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { AttachmentType } from '@prisma/client'

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

interface AttachmentManagerProps {
  serviceOrderId: string
  attachments: Attachment[]
  onAttachmentsChange: () => void
  canUpload?: boolean
}

export function AttachmentManager({ 
  serviceOrderId, 
  attachments, 
  onAttachmentsChange,
  canUpload = true 
}: AttachmentManagerProps) {
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
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

  const getFileIcon = (type: AttachmentType) => {
    switch (type) {
      case 'IMAGE':
        return <Image className="h-4 w-4" />
      case 'DOCUMENT':
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: AttachmentType) => {
    switch (type) {
      case 'IMAGE':
        return 'bg-blue-100 text-blue-800'
      case 'DOCUMENT':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (files.length === 0) return

    // Validar arquivos
    const maxSize = 10 * 1024 * 1024 // 10MB
    const invalidFiles = files.filter(file => file.size > maxSize)
    
    if (invalidFiles.length > 0) {
      toast({
        title: "Arquivo muito grande",
        description: `Arquivos devem ter no máximo 10MB`,
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('serviceOrderId', serviceOrderId)
      
      files.forEach((file) => {
        if (file.type.startsWith('image/')) {
          formData.append('images', file)
        } else {
          formData.append('documents', file)
        }
      })

      const response = await fetch(`/api/service-orders/${serviceOrderId}/attachments`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao fazer upload')
      }

      toast({
        title: "Sucesso!",
        description: `${files.length} arquivo(s) enviado(s) com sucesso`,
        variant: "success",
      })

      // Limpar input e recarregar anexos
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      setShowUpload(false)
      onAttachmentsChange()

    } catch (error) {
      console.error('Erro no upload:', error)
      toast({
        title: "Erro!",
        description: error instanceof Error ? error.message : "Erro ao fazer upload",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDownload = (attachment: Attachment) => {
    // Abrir arquivo em nova aba
    window.open(`/api/uploads/${attachment.path.replace('/uploads/', '')}`, '_blank')
  }

  const handleDelete = async (attachmentId: string) => {
    if (!confirm('Tem certeza que deseja remover este anexo?')) return

    try {
      const response = await fetch(`/api/service-orders/${serviceOrderId}/attachments/${attachmentId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Erro ao remover anexo')
      }

      toast({
        title: "Sucesso!",
        description: "Anexo removido com sucesso",
        variant: "success",
      })

      onAttachmentsChange()
    } catch (error) {
      console.error('Erro ao remover anexo:', error)
      toast({
        title: "Erro!",
        description: "Erro ao remover anexo",
        variant: "destructive",
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Anexos
            </CardTitle>
            <CardDescription>
              Imagens e documentos relacionados à OS
            </CardDescription>
          </div>
          {canUpload && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowUpload(!showUpload)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Upload Area */}
        {showUpload && canUpload && (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <div className="space-y-4">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <Upload className="h-full w-full" />
              </div>
              <div>
                <Button 
                  onClick={handleFileSelect}
                  disabled={uploading}
                  className="mb-2"
                >
                  {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Selecionar Arquivos
                </Button>
                <p className="text-sm text-gray-500">
                  Suporte para imagens (JPG, PNG, GIF) e documentos (PDF, DOC, XLS, TXT)
                  <br />
                  Máximo 10MB por arquivo
                </p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>
        )}

        {/* Lista de Anexos */}
        <div className="space-y-2">
          {attachments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>Nenhum anexo encontrado</p>
            </div>
          ) : (
            attachments.map((attachment) => (
              <div 
                key={attachment.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className="flex-shrink-0">
                    {getFileIcon(attachment.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {attachment.originalName}
                    </p>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge 
                        variant="secondary"
                        className={`text-xs ${getTypeColor(attachment.type)}`}
                      >
                        {attachment.type}
                      </Badge>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(attachment.size)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatDate(attachment.uploadedAt)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(attachment)}
                    title="Visualizar/Download"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  {canUpload && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(attachment.id)}
                      title="Remover"
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
