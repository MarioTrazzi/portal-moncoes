import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getUserPermissions } from '@/hooks/use-permissions'

export async function GET(request: NextRequest) {
  try {
    // Para teste, permitir escolher diferentes tipos de usuário via query param
    const { searchParams } = new URL(request.url)
    const testUser = searchParams.get('testUser') || 'funcionario'
    
    console.log('Test user parameter:', testUser)
    
    // Se o testUser parece ser um email, usar diretamente
    let userEmail: string
    if (testUser.includes('@')) {
      userEmail = testUser
    } else {
      // Caso contrário, mapear para emails conhecidos
      const testUserMapping = {
        funcionario: 'maria.educacao@prefeitura.gov.br',    // FUNCIONARIO
        tecnico: 'carlos.tech@prefeitura.gov.br',           // TECNICO  
        admin: 'admin@prefeitura.gov.br',                   // ADMIN
        gestor: 'gestor@prefeitura.gov.br',                 // GESTOR
        aprovador: 'ana.rh@prefeitura.gov.br'              // APROVADOR
      }
      
      userEmail = testUserMapping[testUser as keyof typeof testUserMapping] || testUserMapping.funcionario
    }
    
    console.log('Looking for user with email:', userEmail)
    
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
    
    console.log('User found:', user ? 'Yes' : 'No')
    
    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado', email: userEmail },
        { status: 404 }
      )
    }
    
    // Obter permissões do usuário
    const permissions = getUserPermissions(user.role)
    
    // Remover campos sensíveis antes de retornar
    const { ...userWithoutSensitiveData } = user
    
    return NextResponse.json({
      user: userWithoutSensitiveData,
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
