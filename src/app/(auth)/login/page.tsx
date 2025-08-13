"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertCircle, Eye, EyeOff, LogIn } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const success = await login(email, password)
      if (success) {
        router.push('/dashboard')
      } else {
        setError('Credenciais inválidas. Verifique seu email e senha.')
      }
    } catch (error) {
      setError('Erro ao fazer login. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Usuários de exemplo para facilitar o teste
  const exampleUsers = [
    { email: 'funcionario@prefeitura.gov.br', role: 'Funcionário', dept: 'RH', password: 'funcionario123' },
    { email: 'tecnico@prefeitura.gov.br', role: 'Técnico', dept: 'TI', password: 'tecnico123' },
    { email: 'aprovador@prefeitura.gov.br', role: 'Aprovador', dept: 'TI', password: 'aprovador123' },
    { email: 'gestor@prefeitura.gov.br', role: 'Gestor', dept: 'Finanças', password: 'gestor123' },
    { email: 'admin@prefeitura.gov.br', role: 'Admin', dept: 'TI', password: 'admin123' }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 items-center">
        {/* Info Panel */}
        <div className="space-y-6">
          <div className="text-center md:text-left">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Portal Monções
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Sistema de Gestão de Ordens de Serviço
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Prefeitura Municipal de Águas de Santa Bárbara
            </p>
          </div>

          {/* Usuários de exemplo */}
          <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20">
            <CardHeader>
              <CardTitle className="text-sm">Usuários para Teste</CardTitle>
              <CardDescription className="text-xs">
                Clique em "Usar" para preencher automaticamente
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {exampleUsers.map((user, index) => (
                <div 
                  key={index}
                  className="flex justify-between items-center p-2 bg-white dark:bg-gray-800 rounded text-xs cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => {
                    setEmail(user.email)
                    setPassword(user.password)
                  }}
                >
                  <div>
                    <div className="font-medium">{user.email}</div>
                    <div className="text-gray-500">{user.role} • {user.dept}</div>
                    <div className="text-gray-400 text-xs">Senha: {user.password}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-xs">
                    Usar
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Login Form */}
        <Card className="w-full max-w-md mx-auto">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl font-bold">Login</CardTitle>
            <CardDescription>
              Entre com suas credenciais da prefeitura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu.email@prefeitura.gov.br"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Digite sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Entrando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <LogIn className="mr-2 h-4 w-4" />
                    Entrar
                  </div>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
