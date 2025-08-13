import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { getUserPermissions } from '@/hooks/use-permissions'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verifyAuth(request)
    if (authResult.error) {
      return NextResponse.json(
        { error: authResult.error },
        { status: authResult.status }
      )
    }
    
    const user = authResult.user!
    const permissions = getUserPermissions(user.role)

    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department ? {
          id: user.department.id,
          name: user.department.name,
          location: user.department.location,
          building: user.department.building
        } : undefined
      },
      permissions
    })
  } catch (error) {
    console.error('Erro na API /auth/me:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
