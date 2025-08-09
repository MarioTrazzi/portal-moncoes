"use client"

import React, { useState, useEffect } from 'react'
import { DepartmentList } from '@/components/admin/department-list'
import { useToast } from '@/hooks/use-toast'
import { Loader2 } from 'lucide-react'

interface Department {
  id: string
  name: string
  description?: string
  location: string
  building?: string
  floor?: string
  responsible?: string
  phone?: string
  email?: string
  active: boolean
  _count: {
    users: number
  }
}

export default function DepartmentsAdminPage() {
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadDepartments()
  }, [])

  const loadDepartments = async () => {
    try {
      const response = await fetch('/api/departments')
      if (response.ok) {
        const data = await response.json()
        setDepartments(data.data)
      } else {
        throw new Error('Erro ao carregar departamentos')
      }
    } catch (error) {
      console.error('Erro ao carregar departamentos:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao carregar departamentos',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (department: Department) => {
    // TODO: Implementar edição
    console.log('Editar departamento:', department)
    toast({
      title: 'Em desenvolvimento',
      description: 'Funcionalidade de edição será implementada em breve',
    })
  }

  const handleToggleStatus = async (id: string, active: boolean) => {
    try {
      const response = await fetch(`/api/departments/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ active }),
      })

      if (response.ok) {
        await loadDepartments()
        toast({
          title: 'Sucesso',
          description: `Departamento ${active ? 'ativado' : 'desativado'} com sucesso`,
        })
      } else {
        throw new Error('Erro ao atualizar status')
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
      toast({
        title: 'Erro',
        description: 'Erro ao atualizar status do departamento',
        variant: 'destructive',
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <DepartmentList
      departments={departments}
      onEdit={handleEdit}
      onToggleStatus={handleToggleStatus}
    />
  )
}
