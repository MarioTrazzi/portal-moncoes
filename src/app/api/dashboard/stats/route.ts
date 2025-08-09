import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
  try {
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    // Buscar estatísticas básicas
    const [
      totalServiceOrders,
      createdToday,
      updatedToday,
      completedThisWeek,
      statusCounts,
      priorityCounts,
      categoryCounts,
      recentServiceOrders
    ] = await Promise.all([
      // Total de OS
      prisma.serviceOrder.count(),
      
      // OS criadas hoje
      prisma.serviceOrder.count({
        where: {
          createdAt: {
            gte: startOfToday
          }
        }
      }),
      
      // OS atualizadas hoje
      prisma.serviceOrder.count({
        where: {
          updatedAt: {
            gte: startOfToday
          }
        }
      }),
      
      // OS concluídas esta semana
      prisma.serviceOrder.count({
        where: {
          status: 'FINALIZADA',
          updatedAt: {
            gte: startOfWeek
          }
        }
      }),

      // Contagem por status
      prisma.serviceOrder.groupBy({
        by: ['status'],
        _count: {
          status: true
        }
      }),

      // Contagem por prioridade
      prisma.serviceOrder.groupBy({
        by: ['priority'],
        _count: {
          priority: true
        }
      }),

      // Contagem por categoria
      prisma.serviceOrder.groupBy({
        by: ['category'],
        _count: {
          category: true
        }
      }),
      
      // Últimas 5 OS criadas
      prisma.serviceOrder.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          createdBy: {
            select: {
              name: true,
              department: true
            }
          }
        }
      })
    ])

    // Converter arrays de contagem em objetos
    const byStatus = statusCounts.reduce((acc, item) => {
      acc[item.status] = item._count.status
      return acc
    }, {} as Record<string, number>)

    const byPriority = priorityCounts.reduce((acc, item) => {
      acc[item.priority] = item._count.priority
      return acc
    }, {} as Record<string, number>)

    const byCategory = categoryCounts.reduce((acc, item) => {
      acc[item.category] = item._count.category
      return acc
    }, {} as Record<string, number>)

    // Garantir que todos os status/prioridades existam
    const allStatuses = ['ABERTA', 'EM_ANALISE', 'AGUARDANDO_DESLOCAMENTO', 'EM_EXECUCAO', 'AGUARDANDO_MATERIAL', 'AGUARDANDO_ORCAMENTO', 'AGUARDANDO_APROVACAO', 'MATERIAL_APROVADO', 'FINALIZADA', 'CANCELADA']
    const allPriorities = ['BAIXA', 'NORMAL', 'ALTA', 'URGENTE']

    allStatuses.forEach(status => {
      if (!byStatus[status]) byStatus[status] = 0
    })

    allPriorities.forEach(priority => {
      if (!byPriority[priority]) byPriority[priority] = 0
    })

    // Calcular estatísticas adicionais
    const stats = {
      total: totalServiceOrders,
      byStatus,
      byPriority,
      byCategory,
      recentActivity: {
        createdToday,
        updatedToday,
        completedThisWeek,
        averageResolutionTime: 0 // TODO: implementar cálculo real
      },
      recentOrders: recentServiceOrders.map(order => ({
        id: order.id,
        number: order.number,
        title: order.title,
        status: order.status,
        priority: order.priority,
        createdAt: order.createdAt,
        createdBy: order.createdBy
      }))
    }

    return NextResponse.json(stats)
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}
