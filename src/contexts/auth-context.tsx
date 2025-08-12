"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserRole } from '@prisma/client'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department?: {
    id: string
    name: string
    location: string
    building: string
  }
}

interface UserPermissions {
  canViewAllOrders: boolean
  canCreateOrders: boolean
  canEditOrders: boolean
  canDeleteOrders: boolean
  canManageUsers: boolean
  canManageDepartments: boolean
  canApproveQuotes: boolean
  canViewReports: boolean
  canManageSuppliers: boolean
}

interface AuthContextType {
  user: User | null
  permissions: UserPermissions | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [permissions, setPermissions] = useState<UserPermissions | null>(null)
  const [loading, setLoading] = useState(true)

  // Verificar se há usuário logado ao carregar a página
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = getCookie('auth_token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setPermissions(data.permissions)
      } else {
        // Token inválido, remover
        deleteCookie('auth_token')
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error)
      deleteCookie('auth_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      if (response.ok) {
        const data = await response.json()
        setCookie('auth_token', data.token)
        setUser(data.user)
        setPermissions(data.permissions)
        return true
      } else {
        return false
      }
    } catch (error) {
      console.error('Erro no login:', error)
      return false
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    deleteCookie('auth_token')
    setUser(null)
    setPermissions(null)
  }

  // Helper functions para cookies
  const setCookie = (name: string, value: string) => {
    document.cookie = `${name}=${value}; path=/; max-age=${60 * 60 * 24}` // 24 horas
  }

  const getCookie = (name: string) => {
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) return parts.pop()?.split(';').shift()
    return undefined
  }

  const deleteCookie = (name: string) => {
    document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`
  }

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
