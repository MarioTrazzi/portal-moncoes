"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ProblemCategory, Priority } from "@prisma/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { FileUpload } from "@/components/ui/file-upload"
import { createServiceOrderSchema, type CreateServiceOrderForm } from "@/lib/validations"
import { categoryLabels, priorityLabels } from "@/types"
import { Loader2, User, MapPin } from "lucide-react"

interface UserInfo {
  name: string
  department: string
  location: string
  room?: string
}

interface CreateServiceOrderFormProps {
  onSubmit: (data: CreateServiceOrderForm) => Promise<void>
  isLoading?: boolean
  userInfo?: UserInfo
}

export function CreateServiceOrderForm({ 
  onSubmit, 
  isLoading = false,
  userInfo
}: CreateServiceOrderFormProps) {
  const [images, setImages] = React.useState<File[]>([])
  const [documents, setDocuments] = React.useState<File[]>([])
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
    reset
  } = useForm<CreateServiceOrderForm>({
    resolver: zodResolver(createServiceOrderSchema),
    defaultValues: {
      priority: Priority.NORMAL
    }
  })

  const selectedCategory = watch("category")
  const selectedPriority = watch("priority")

  const handleFormSubmit = async (data: CreateServiceOrderForm) => {
    try {
      // Adicionar arquivos aos dados
      const formDataWithFiles = {
        ...data,
        images,
        documents
      }
      
      await onSubmit(formDataWithFiles)
      
      // Limpar o formulário após sucesso
      reset()
      setImages([])
      setDocuments([])
    } catch (error) {
      console.error("Erro ao criar OS:", error)
    }
  }

  const handleFilesChange = (newImages: File[], newDocuments: File[]) => {
    setImages(newImages)
    setDocuments(newDocuments)
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Informações do Solicitante */}
      {userInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações do Solicitante
            </CardTitle>
            <CardDescription>
              Os dados de localização serão preenchidos automaticamente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Solicitante</Label>
                <p className="text-sm text-muted-foreground mt-1">{userInfo.name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Departamento</Label>
                <p className="text-sm text-muted-foreground mt-1">{userInfo.department}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Localização</Label>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {userInfo.location}
                </p>
              </div>
              {userInfo.room && (
                <div>
                  <Label className="text-sm font-medium">Sala</Label>
                  <p className="text-sm text-muted-foreground mt-1">{userInfo.room}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Formulário Principal */}
      <Card>
        <CardHeader>
          <CardTitle>Nova Ordem de Serviço</CardTitle>
          <CardDescription>
            Preencha as informações abaixo para criar uma nova OS
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                placeholder="Ex: Problema na impressora do RH"
                {...register("title")}
                disabled={isLoading || isSubmitting}
              />
              {errors.title && (
                <p className="text-sm text-destructive">{errors.title.message}</p>
              )}
            </div>

            {/* Descrição */}
            <div className="space-y-2">
              <Label htmlFor="description">Descrição *</Label>
              <Textarea
                id="description"
                placeholder="Descreva detalhadamente o problema encontrado..."
                rows={4}
                {...register("description")}
                disabled={isLoading || isSubmitting}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Categoria e Prioridade */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Categoria *</Label>
                <Select
                  value={selectedCategory}
                  onValueChange={(value) => setValue("category", value as ProblemCategory)}
                  disabled={isLoading || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(categoryLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-destructive">{errors.category.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="priority">Prioridade *</Label>
                <Select
                  value={selectedPriority}
                  onValueChange={(value) => setValue("priority", value as Priority)}
                  disabled={isLoading || isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(priorityLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.priority && (
                  <p className="text-sm text-destructive">{errors.priority.message}</p>
                )}
              </div>
            </div>

            {/* Localização Específica */}
            <div className="space-y-2">
              <Label htmlFor="specificLocation">Localização Específica (opcional)</Label>
              <Input
                id="specificLocation"
                placeholder="Ex: Próximo à janela, mesa do coordenador..."
                {...register("specificLocation")}
                disabled={isLoading || isSubmitting}
              />
              <p className="text-xs text-muted-foreground">
                Adicione detalhes específicos sobre onde está o problema
              </p>
              {errors.specificLocation && (
                <p className="text-sm text-destructive">{errors.specificLocation.message}</p>
              )}
            </div>

            {/* Upload de Arquivos */}
            <div className="space-y-2">
              <Label>Fotos e Documentos (opcional)</Label>
              <FileUpload 
                onFilesChange={handleFilesChange}
                maxImages={5}
                maxDocuments={3}
                maxFileSize={10}
              />
              <p className="text-xs text-muted-foreground">
                Adicione fotos do problema ou documentos relacionados
              </p>
            </div>

            {/* Botões */}
            <div className="flex gap-4 pt-4">
              <Button
                type="submit"
                disabled={isLoading || isSubmitting}
                className="flex-1"
              >
                {(isLoading || isSubmitting) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Criar Ordem de Serviço
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  reset()
                  setImages([])
                  setDocuments([])
                }}
                disabled={isLoading || isSubmitting}
              >
                Limpar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
