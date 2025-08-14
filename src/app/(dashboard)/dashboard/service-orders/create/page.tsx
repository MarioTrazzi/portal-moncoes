"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { CreateServiceOrderForm } from "@/components/forms/create-service-order-form"
import { CreateServiceOrderForm as CreateServiceOrderFormType } from "@/lib/validations"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface User {
  id: string
  name: string
  email: string
  department: {
    name: string
    location: string
    building?: string
  } | null
  room?: string
}

export default function CreateServiceOrderPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [userLoading, setUserLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const router = useRouter()
  const { toast } = useToast()

  // Carregar informações do usuário atual
  useEffect(() => {
    const loadCurrentUser = async () => {
      try {
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
        
        const response = await fetch("/api/auth/me", {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
        
        if (response.ok) {
          const userData = await response.json()
          setCurrentUser(userData.user)
        } else {
          throw new Error("Erro ao carregar usuário")
        }
      } catch (error) {
        console.error("Erro ao carregar usuário:", error)
        toast({
          title: "Erro",
          description: "Erro ao carregar dados do usuário",
          variant: "destructive",
        })
      } finally {
        setUserLoading(false)
      }
    }

    loadCurrentUser()
  }, [toast])

  const handleSubmit = async (data: CreateServiceOrderFormType) => {
    setIsLoading(true)
    
    try {
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
      
      // Preparar FormData para incluir arquivos
      const formData = new FormData()
      
      // Adicionar campos básicos
      formData.append('title', data.title)
      formData.append('description', data.description)
      formData.append('category', data.category)
      formData.append('priority', data.priority)
      
      if (data.specificLocation) {
        formData.append('specificLocation', data.specificLocation)
      }
      
      // Adicionar imagens
      if (data.images && data.images.length > 0) {
        data.images.forEach((file, index) => {
          formData.append(`images`, file)
        })
      }
      
      // Adicionar documentos
      if (data.documents && data.documents.length > 0) {
        data.documents.forEach((file, index) => {
          formData.append(`documents`, file)
        })
      }

      const response = await fetch("/api/service-orders", {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Erro ao criar OS")
      }

      const serviceOrder = await response.json()
      
      // Mostrar mensagem de sucesso
      toast({
        title: "Sucesso!",
        description: `OS ${serviceOrder.number} criada com sucesso!`,
        variant: "success",
      })
      
      // Redirecionar para a lista de OS
      router.push("/dashboard/service-orders")
    } catch (error) {
      console.error("Erro:", error)
      toast({
        title: "Erro!",
        description: error instanceof Error ? error.message : "Erro ao criar OS",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (userLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const userInfo = currentUser && currentUser.department ? {
    name: currentUser.name,
    department: currentUser.department.name,
    location: `${currentUser.department.location}${currentUser.department.building ? ` - ${currentUser.department.building}` : ''}`,
    room: currentUser.room
  } : undefined

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
          <h1 className="text-3xl font-bold tracking-tight">Nova Ordem de Serviço</h1>
          <p className="text-muted-foreground">
            Criar uma nova solicitação de atendimento técnico
          </p>
        </div>
      </div>

      {/* Formulário */}
      <CreateServiceOrderForm 
        onSubmit={handleSubmit} 
        isLoading={isLoading} 
        userInfo={userInfo}
      />
    </div>
  )
}
