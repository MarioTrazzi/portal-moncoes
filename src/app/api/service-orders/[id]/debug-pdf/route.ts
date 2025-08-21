import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    console.log('=== DEBUG GENERATE PDF ===')
    console.log('ID da OS:', params.id)
    
    // Testar se consegue acessar o banco simples
    const count = await prisma.serviceOrder.count()
    console.log('Total de OS no banco:', count)
    
    return NextResponse.json({
      success: true,
      debug: {
        osId: params.id,
        totalOrders: count,
        message: 'API está funcionando'
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
