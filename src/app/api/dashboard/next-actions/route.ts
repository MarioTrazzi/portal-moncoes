import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface ActionItem {
  id: string
  type: 'urgent' | 'overdue' | 'approval' | 'assignment' | 'follow_up'
  title: string
  description: string
  count?: number
  priority: 'low' | 'medium' | 'high' | 'urgent'
  action: {
    label: string
    href: string
  }
}

export async function GET(req: NextRequest) {
  try {
    // Por enquanto, vamos simular dados de usuário
    // Em implementação real, isso viria do token de autenticação
    const userEmail = req.headers.get('x-user-email') || 'gestor@prefeitura.gov.br'
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: { department: true }
    })

    if (!user) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
    }

    const actions: ActionItem[] = []

    // 1. OS Urgentes (para todos os perfis com acesso)
    const urgentOrders = await prisma.serviceOrder.count({
      where: {
        priority: 'URGENTE',
        status: { in: ['ABERTA', 'EM_ANALISE', 'EM_EXECUCAO', 'AGUARDANDO_MATERIAL'] }
      }
    })

    if (urgentOrders > 0) {
      actions.push({
        id: 'urgent-orders',
        type: 'urgent',
        title: 'OS Urgentes',
        description: 'Ordens de serviço marcadas como urgentes que precisam de atenção imediata',
        count: urgentOrders,
        priority: 'urgent',
        action: {
          label: 'Ver OS Urgentes',
          href: '/dashboard/service-orders?priority=URGENTE'
        }
      })
    }

    // 2. OS Atrasadas (para técnicos, gestores e admins)
    if (['TECNICO', 'GESTOR', 'ADMIN'].includes(user.role)) {
      // Considera atrasada se foi criada há mais de 5 dias e ainda não foi finalizada
      const fiveDaysAgo = new Date()
      fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
      
      const overdueOrders = await prisma.serviceOrder.count({
        where: {
          createdAt: { lt: fiveDaysAgo },
          status: { in: ['ABERTA', 'EM_ANALISE', 'EM_EXECUCAO', 'AGUARDANDO_MATERIAL'] }
        }
      })

      if (overdueOrders > 0) {
        actions.push({
          id: 'overdue-orders',
          type: 'overdue',
          title: 'OS Atrasadas',
          description: 'Ordens que passaram do prazo estimado de conclusão',
          count: overdueOrders,
          priority: 'high',
          action: {
            label: 'Verificar Atrasos',
            href: '/dashboard/service-orders?status=overdue'
          }
        })
      }
    }

    // 3. Orçamentos para aprovação (para gestores e admins)
    if (['GESTOR', 'ADMIN', 'APROVADOR'].includes(user.role)) {
      const pendingApprovals = await prisma.serviceOrder.count({
        where: {
          status: 'ORCAMENTOS_RECEBIDOS'
        }
      })

      if (pendingApprovals > 0) {
        actions.push({
          id: 'pending-approvals',
          type: 'approval',
          title: 'Orçamentos para Aprovação',
          description: 'OS com orçamentos recebidos esperando aprovação da gestão',
          count: pendingApprovals,
          priority: 'medium',
          action: {
            label: 'Revisar Orçamentos',
            href: '/dashboard/service-orders?status=ORCAMENTOS_RECEBIDOS'
          }
        })
      }
    }

    // 4. OS sem técnico (para gestores e admins)
    if (['GESTOR', 'ADMIN'].includes(user.role)) {
      const unassignedOrders = await prisma.serviceOrder.count({
        where: {
          assignedToId: null,
          status: 'ABERTA'
        }
      })

      if (unassignedOrders > 0) {
        actions.push({
          id: 'unassigned-orders',
          type: 'assignment',
          title: 'OS sem Técnico',
          description: 'Ordens abertas que ainda não foram atribuídas a um técnico',
          count: unassignedOrders,
          priority: 'medium',
          action: {
            label: 'Atribuir Técnicos',
            href: '/dashboard/service-orders?status=ABERTA&unassigned=true'
          }
        })
      }
    }

    // 5. OS aguardando material (para técnicos responsáveis)
    if (user.role === 'TECNICO') {
      const waitingMaterial = await prisma.serviceOrder.count({
        where: {
          assignedToId: user.id,
          status: 'AGUARDANDO_MATERIAL'
        }
      })

      if (waitingMaterial > 0) {
        actions.push({
          id: 'waiting-material',
          type: 'follow_up',
          title: 'Aguardando Material',
          description: 'Suas OS que estão aguardando chegada de materiais',
          count: waitingMaterial,
          priority: 'low',
          action: {
            label: 'Verificar Status',
            href: '/dashboard/service-orders?status=AGUARDANDO_MATERIAL'
          }
        })
      }
    }

    // 6. Materiais aprovados para compra (para gestores)
    if (['GESTOR', 'ADMIN', 'APROVADOR'].includes(user.role)) {
      const approvedForPurchase = await prisma.serviceOrder.count({
        where: {
          status: 'MATERIAL_APROVADO'
        }
      })

      if (approvedForPurchase > 0) {
        actions.push({
          id: 'approved-purchase',
          type: 'follow_up',
          title: 'Materiais Aprovados',
          description: 'OS com materiais aprovados pendentes de aquisição',
          count: approvedForPurchase,
          priority: 'medium',
          action: {
            label: 'Acompanhar Compras',
            href: '/dashboard/service-orders?status=MATERIAL_APROVADO'
          }
        })
      }
    }

    return NextResponse.json({ 
      actions,
      userRole: user.role,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Erro ao buscar próximas ações:', error)
    return NextResponse.json({ 
      error: 'Erro ao buscar próximas ações',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
