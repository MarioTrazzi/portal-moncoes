import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/hooks/use-permissions'

export async function GET(request: NextRequest) {
  try {
    // Para teste, permitir escolher diferentes tipos de usuário via query param
    const { searchParams } = new URL(request.url)
    const testUser = searchParams.get('testUser') || 'funcionario'
    
    const testUserMapping = {
      funcionario: 'funcionario@prefeitura.gov.br',    // FUNCIONARIO
      tecnico: 'tecnico@prefeitura.gov.br',             // TECNICO  
      admin: 'admin@prefeitura.gov.br',                 // ADMIN
      gestor: 'gestor@prefeitura.gov.br',               // GESTOR
      aprovador: 'admin@prefeitura.gov.br'              // APROVADOR (usar admin como fallback)
    }
    
    const userEmail = testUserMapping[testUser as keyof typeof testUserMapping] || testUserMapping.funcionario
    
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      include: {
        department: {
          select: {
            id: true,
            name: true,
            location: true,
            building: true,
            floor: true,
            responsible: true
          }
        }
      }
    })
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      )
    }
    
    // Obter permissões do usuário
    const permissions = getUserPermissions(user.role)
    
    // Remover senha antes de retornar
    const { password, ...userWithoutPassword } = user
    
    return NextResponse.json({
      user: userWithoutPassword,
      permissions
    })
  } catch (error) {
    console.error('Erro ao buscar usuário:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
