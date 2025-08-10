import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const notificationId = id
    
    // TODO: Pegar o usuário autenticado do token/session
    // Por enquanto, vamos usar um usuário de teste baseado no query param
    const { searchParams } = new URL(request.url)
    const testUser = searchParams.get('testUser') || 'funcionario'
    
    const testUserMapping = {
      funcionario: 'funcionario@prefeitura.gov.br',  // FUNCIONARIO
      tecnico: 'tecnico@prefeitura.gov.br',         // TECNICO  
      admin: 'admin@prefeitura.gov.br',                 // ADMIN
      gestor: 'gestor@prefeitura.gov.br',              // GESTOR
      aprovador: 'admin@prefeitura.gov.br'            // APROVADOR
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

    // Marcar notificação como lida
    const result = await NotificationService.markAsRead(notificationId, currentUser.id)

    if (result.count === 0) {
      return NextResponse.json(
        { error: 'Notificação não encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
