import { prisma } from "@/lib/prisma"
import { NotificationType, UserRole } from "@prisma/client"

interface CreateNotificationData {
  type: NotificationType
  title: string
  message: string
  userId: string
  serviceOrderId?: string
  actionUrl?: string
  actionText?: string
}

export class NotificationService {
  // Criar uma notificação
  static async create(data: CreateNotificationData) {
    return await prisma.notification.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        serviceOrder: {
          select: {
            id: true,
            number: true,
            title: true
          }
        }
      }
    })
  }

  // Criar notificações quando uma nova OS é criada
  static async notifyNewServiceOrder(serviceOrderId: string) {
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      include: {
        createdBy: {
          include: { department: true }
        }
      }
    })

    if (!serviceOrder) return

    // Buscar todos os técnicos para notificar sobre nova OS
    const technicians = await prisma.user.findMany({
      where: {
        role: UserRole.TECNICO,
        active: true
      }
    })

    // Criar notificações para todos os técnicos
    const notifications = technicians.map(tech => ({
      type: NotificationType.NEW_OS,
      title: 'Nova OS Criada',
      message: `Nova ordem de serviço #${serviceOrder.number} foi criada por ${serviceOrder.createdBy.name} (${serviceOrder.createdBy.department?.name}).`,
      userId: tech.id,
      serviceOrderId: serviceOrder.id,
      actionUrl: `/dashboard/service-orders/${serviceOrder.id}`,
      actionText: 'Ver OS'
    }))

    // Criar todas as notificações em batch
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      })
    }

    return notifications.length
  }

  // Notificar sobre atualizações na OS
  static async notifyServiceOrderUpdate(serviceOrderId: string, updateType: 'status' | 'assignment' | 'completion', updatedBy: string) {
    const serviceOrder = await prisma.serviceOrder.findUnique({
      where: { id: serviceOrderId },
      include: {
        createdBy: true,
        assignedTo: true
      }
    })

    if (!serviceOrder) return

    const notifications: CreateNotificationData[] = []

    // Sempre notificar o criador da OS (exceto se ele mesmo fez a alteração)
    if (serviceOrder.createdBy.id !== updatedBy) {
      let title = 'OS Atualizada'
      let message = `Sua ordem de serviço #${serviceOrder.number} foi atualizada.`
      let type: NotificationType = NotificationType.OS_UPDATED

      switch (updateType) {
        case 'status':
          message = `O status da sua OS #${serviceOrder.number} foi alterado para "${serviceOrder.status}".`
          break
        case 'assignment':
          if (serviceOrder.assignedTo) {
            message = `Sua OS #${serviceOrder.number} foi atribuída ao técnico ${serviceOrder.assignedTo.name}.`
            type = NotificationType.OS_ASSIGNED
          }
          break
        case 'completion':
          title = 'OS Finalizada'
          message = `Sua ordem de serviço #${serviceOrder.number} foi finalizada.`
          type = NotificationType.OS_COMPLETED
          break
      }

      notifications.push({
        type,
        title,
        message,
        userId: serviceOrder.createdBy.id,
        serviceOrderId: serviceOrder.id,
        actionUrl: `/dashboard/service-orders/${serviceOrder.id}`,
        actionText: 'Ver OS'
      })
    }

    // Se há técnico atribuído e não foi ele quem fez a alteração, notificar também
    if (serviceOrder.assignedTo && serviceOrder.assignedTo.id !== updatedBy && serviceOrder.assignedTo.id !== serviceOrder.createdBy.id) {
      notifications.push({
        type: NotificationType.OS_UPDATED,
        title: 'OS Atualizada',
        message: `A OS #${serviceOrder.number} atribuída a você foi atualizada.`,
        userId: serviceOrder.assignedTo.id,
        serviceOrderId: serviceOrder.id,
        actionUrl: `/dashboard/service-orders/${serviceOrder.id}`,
        actionText: 'Ver OS'
      })
    }

    // Criar as notificações
    if (notifications.length > 0) {
      await prisma.notification.createMany({
        data: notifications
      })
    }

    return notifications.length
  }

  // Buscar notificações de um usuário
  static async getUserNotifications(userId: string, limit = 20) {
    return await prisma.notification.findMany({
      where: { userId },
      include: {
        serviceOrder: {
          select: {
            id: true,
            number: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    })
  }

  // Marcar notificação como lida
  static async markAsRead(notificationId: string, userId: string) {
    return await prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId // Garantir que o usuário só pode marcar suas próprias notificações
      },
      data: { read: true }
    })
  }

  // Marcar todas as notificações como lidas
  static async markAllAsRead(userId: string) {
    return await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: { read: true }
    })
  }

  // Contar notificações não lidas
  static async getUnreadCount(userId: string) {
    return await prisma.notification.count({
      where: {
        userId,
        read: false
      }
    })
  }

  // Limpar notificações antigas (mais de 30 dias)
  static async cleanupOldNotifications() {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return await prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: thirtyDaysAgo
        },
        read: true
      }
    })
  }
}
