"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Settings, Save, Bell, Mail, Shield, Database, Palette, Globe } from "lucide-react"

interface SystemConfig {
  [key: string]: string
}

export default function SettingsPage() {
  const [config, setConfig] = useState<SystemConfig>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchConfig()
  }, [])

  const fetchConfig = async () => {
    try {
      // Por enquanto, usar configurações padrão
      setConfig({
        'system.name': 'Portal Monções - Sistema de OS',
        'system.description': 'Sistema de gestão de ordens de serviço para prefeitura',
        'system.email': 'sistema@prefeitura.gov.br',
        'system.phone': '(67) 3123-4567',
        'system.address': 'Prefeitura Municipal - Centro',
        'notifications.email.enabled': 'true',
        'notifications.push.enabled': 'true',
        'security.session.timeout': '480',
        'security.password.min_length': '6',
        'backup.frequency': 'daily',
        'theme.primary_color': '#2c5530',
        'theme.logo_url': '/logo-prefeitura.png'
      })
    } catch (error) {
      console.error('Erro ao carregar configurações:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateConfig = (key: string, value: string) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Aqui faria a requisição para salvar as configurações
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simular delay
      console.log('Configurações salvas:', config)
      alert('Configurações salvas com sucesso!')
    } catch (error) {
      console.error('Erro ao salvar configurações:', error)
      alert('Erro ao salvar configurações')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Configurações do Sistema
          </h1>
          <p className="text-muted-foreground">
            Configure parâmetros gerais e funcionalidades do sistema
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="flex items-center gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Salvando...' : 'Salvar Alterações'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informações Gerais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Informações Gerais
            </CardTitle>
            <CardDescription>
              Configurações básicas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="system-name">Nome do Sistema</Label>
              <Input
                id="system-name"
                value={config['system.name'] || ''}
                onChange={(e) => updateConfig('system.name', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="system-description">Descrição</Label>
              <Textarea
                id="system-description"
                value={config['system.description'] || ''}
                onChange={(e) => updateConfig('system.description', e.target.value)}
                rows={3}
              />
            </div>
            <div>
              <Label htmlFor="system-email">Email do Sistema</Label>
              <Input
                id="system-email"
                type="email"
                value={config['system.email'] || ''}
                onChange={(e) => updateConfig('system.email', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="system-phone">Telefone</Label>
              <Input
                id="system-phone"
                value={config['system.phone'] || ''}
                onChange={(e) => updateConfig('system.phone', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="system-address">Endereço</Label>
              <Input
                id="system-address"
                value={config['system.address'] || ''}
                onChange={(e) => updateConfig('system.address', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notificações */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificações
            </CardTitle>
            <CardDescription>
              Configure como as notificações são enviadas
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações por Email</Label>
                <p className="text-sm text-muted-foreground">
                  Enviar emails para usuários sobre atualizações
                </p>
              </div>
              <Switch
                checked={config['notifications.email.enabled'] === 'true'}
                onCheckedChange={(checked: boolean) => 
                  updateConfig('notifications.email.enabled', checked.toString())
                }
              />
            </div>
            
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Notificações Push</Label>
                <p className="text-sm text-muted-foreground">
                  Notificações em tempo real no navegador
                </p>
              </div>
              <Switch
                checked={config['notifications.push.enabled'] === 'true'}
                onCheckedChange={(checked: boolean) => 
                  updateConfig('notifications.push.enabled', checked.toString())
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Segurança */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Segurança
            </CardTitle>
            <CardDescription>
              Configurações de segurança e autenticação
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="session-timeout">Timeout da Sessão (minutos)</Label>
              <Input
                id="session-timeout"
                type="number"
                value={config['security.session.timeout'] || ''}
                onChange={(e) => updateConfig('security.session.timeout', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="password-length">Comprimento Mínimo da Senha</Label>
              <Input
                id="password-length"
                type="number"
                min="4"
                max="20"
                value={config['security.password.min_length'] || ''}
                onChange={(e) => updateConfig('security.password.min_length', e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Backup e Manutenção */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Backup e Manutenção
            </CardTitle>
            <CardDescription>
              Configurações de backup e manutenção do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="backup-frequency">Frequência de Backup</Label>
              <Select
                value={config['backup.frequency'] || 'daily'}
                onValueChange={(value) => updateConfig('backup.frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hourly">A cada hora</SelectItem>
                  <SelectItem value="daily">Diariamente</SelectItem>
                  <SelectItem value="weekly">Semanalmente</SelectItem>
                  <SelectItem value="monthly">Mensalmente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <Button variant="outline" className="w-full">
                <Database className="h-4 w-4 mr-2" />
                Fazer Backup Agora
              </Button>
              <Button variant="outline" className="w-full">
                Limpar Logs Antigos
              </Button>
              <Button variant="outline" className="w-full">
                Verificar Integridade do BD
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Aparência */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Aparência
            </CardTitle>
            <CardDescription>
              Customize a aparência do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="primary-color">Cor Primária</Label>
              <div className="flex gap-2">
                <Input
                  id="primary-color"
                  type="color"
                  value={config['theme.primary_color'] || '#2c5530'}
                  onChange={(e) => updateConfig('theme.primary_color', e.target.value)}
                  className="w-16 h-10"
                />
                <Input
                  value={config['theme.primary_color'] || '#2c5530'}
                  onChange={(e) => updateConfig('theme.primary_color', e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="logo-url">URL do Logo</Label>
              <Input
                id="logo-url"
                value={config['theme.logo_url'] || ''}
                onChange={(e) => updateConfig('theme.logo_url', e.target.value)}
                placeholder="/logo-prefeitura.png"
              />
            </div>
          </CardContent>
        </Card>

        {/* Informações do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle>Informações do Sistema</CardTitle>
            <CardDescription>
              Detalhes sobre a versão e status do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Versão:</span>
              <span>1.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Última Atualização:</span>
              <span>11/08/2025</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Banco de Dados:</span>
              <span className="text-green-600">✓ Conectado</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Status:</span>
              <span className="text-green-600">✓ Operacional</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Usuários Ativos:</span>
              <span>7</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">OS Ativas:</span>
              <span>3</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
