import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'

export async function GET(request: NextRequest) {
  try {
    // TODO: Pegar o usuário autenticado do token/session
    // Por enquanto, vamos usar um usuário de teste baseado no query param
    const { searchParams } = new URL(request.url)
    const testUser = searchParams.get('testUser') || 'funcionario'
    
    const testUserMapping = {
      funcionario: 'maria.educacao@prefeitura.gov.br',  // FUNCIONARIO
      tecnico: 'carlos.tech@prefeitura.gov.br',         // TECNICO  
      admin: 'admin@prefeitura.gov.br',                 // ADMIN
      gestor: 'gestor@prefeitura.gov.br',              // GESTOR
      aprovador: 'ana.rh@prefeitura.gov.br'            // APROVADOR
    }
    
    const userEmail = testUserMapping[testUser as keyof typeof testUserMapping] || testUserMapping.funcionario
    
    // Buscar o usuário atual
    const { prisma } = await import('@/lib/prisma')
    const currentUser = await prisma.user.findUnique({
      where: { email: userEmail }
    })

    if (!currentUser) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }

    // Buscar notificações do usuário
    const notifications = await NotificationService.getUserNotifications(currentUser.id)
    
    // Contar não lidas
    const unreadCount = await NotificationService.getUnreadCount(currentUser.id)

    // Transformar para o formato esperado pelo frontend
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type.toLowerCase(),
      title: notification.title,
      message: notification.message,
      actionText: notification.actionText || 'Ver detalhes',
      actionUrl: notification.actionUrl || '/dashboard',
      serviceOrderId: notification.serviceOrderId,
      serviceOrder: notification.serviceOrder,
      createdAt: notification.createdAt.toISOString(),
      read: notification.read
    }))

    return NextResponse.json({
      notifications: formattedNotifications,
      unreadCount
    })
  } catch (error) {
    console.error('Erro ao buscar notificações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
