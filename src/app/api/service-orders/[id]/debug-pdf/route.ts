import { NextRequest, NextResponse } from 'next/server'
import { verifyAuth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('=== DEBUG GENERATE PDF ===')
    console.log('ID da OS:', params.id)
    
    // Testar autenticação
    console.log('Testando verifyAuth...')
    const authResult = await verifyAuth(req)
    console.log('Resultado da auth:', authResult)
    
    if (authResult.error || !authResult.user) {
      return NextResponse.json({
        success: false,
        debug: {
          step: 'auth',
          error: authResult.error,
          hasUser: !!authResult.user
        }
      })
    }
    
    console.log('Usuário autenticado:', authResult.user.email, authResult.user.role)
    
    return NextResponse.json({
      success: true,
      debug: {
        osId: params.id,
        user: authResult.user.email,
        role: authResult.user.role,
        message: 'Autenticação funcionando'
      }
    })
    
  } catch (error) {
    console.error('Erro na API debug:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro debug',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 })
  }
}
