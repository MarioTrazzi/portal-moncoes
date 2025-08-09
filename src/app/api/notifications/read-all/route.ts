import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'

export async function POST(request: NextRequest) {
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

    // Marcar todas as notificações como lidas
    const result = await NotificationService.markAllAsRead(currentUser.id)

    return NextResponse.json({ 
      success: true,
      count: result.count 
    })
  } catch (error) {
    console.error('Erro ao marcar todas as notificações como lidas:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
