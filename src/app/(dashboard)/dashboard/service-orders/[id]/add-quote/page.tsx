"use client"

import { useState, useEffect, use } from "react"
import { QuoteForm } from "@/components/quotes/quote-form"
import { Loader2 } from "lucide-react"
import { useHydration } from "@/hooks/use-hydration"

interface ServiceOrderData {
  id: string
  number: string
  title: string
  status: string
}

export default function AddQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const hydrated = useHydration()
  const [serviceOrder, setServiceOrder] = useState<ServiceOrderData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (hydrated) {
      fetchServiceOrder()
    }
  }, [resolvedParams.id, hydrated])

  const fetchServiceOrder = async () => {
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
      
      const response = await fetch(`/api/service-orders/${resolvedParams.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!response.ok) {
        throw new Error("OS não encontrada")
      }

      const data = await response.json()
      
      if (data.success) {
        setServiceOrder({
          id: data.data.id,
          number: data.data.number,
          title: data.data.title,
          status: data.data.status
        })
      } else {
        setError(data.error || "Erro ao carregar OS")
      }
    } catch (error) {
      console.error("Erro ao buscar OS:", error)
      setError(error instanceof Error ? error.message : "Erro ao carregar OS")
    } finally {
      setLoading(false)
    }
  }

  if (!hydrated || loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Carregando informações da OS...</span>
        </div>
      </div>
    )
  }

  if (error || !serviceOrder) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-destructive">Erro</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <QuoteForm
      serviceOrderId={serviceOrder.id}
      serviceOrderNumber={serviceOrder.number}
      serviceOrderTitle={serviceOrder.title}
    />
  )
}
